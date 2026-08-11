/* ==========================================================================
   STONE • PAPER • SCISSORS - MULTIPLAYER EXPRESS & SOCKET.IO SERVER
   ========================================================================== */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let PORT = parseInt(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/**
 * --------------------------------------------------------------------------
 * IN-MEMORY MULTIPLAYER ROOMS & PRESENCE STORE
 * --------------------------------------------------------------------------
 */
const rooms = new Map();
const userSocketsMap = new Map(); // uid -> Set of socketIds

/**
 * Helper to generate random 6-character room codes (e.g. "GAME42")
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Server-Side Winner Determination (CRITICAL SECURITY RULE)
 * Never trusts client input. Validates choices and returns 'p1', 'p2', or 'draw'.
 */
function calculateServerWinner(p1Choice, p2Choice) {
    if (p1Choice === p2Choice) return 'draw';

    if (
        (p1Choice === 'stone' && p2Choice === 'scissors') ||
        (p1Choice === 'scissors' && p2Choice === 'paper') ||
        (p1Choice === 'paper' && p2Choice === 'stone')
    ) {
        return 'p1';
    }

    return 'p2';
}


/**
 * --------------------------------------------------------------------------
 * EXPRESS API ENDPOINTS
 * --------------------------------------------------------------------------
 */

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        roomsActive: rooms.size,
        timestamp: new Date().toISOString()
    });
});

// Environment Config for Frontend
app.get('/api/config', (req, res) => {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'fir-p-s-game';
    res.json({
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`
    });
});

// Serve Single Page Application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


/**
 * --------------------------------------------------------------------------
 * SOCKET.IO MULTIPLAYER EVENT HANDLERS
 * --------------------------------------------------------------------------
 */

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // 1. CREATE ROOM
    socket.on('createRoom', ({ gameMode, uid, username, avatar, betAmount, challengeId }) => {
        let roomCode = generateRoomCode();
        while (rooms.has(roomCode)) {
            roomCode = generateRoomCode();
        }

        const targetWins = parseInt(gameMode.replace('Best of ', '')) || 4;
        const validatedBet = parseInt(betAmount) || 0;

        const player1 = {
            socketId: socket.id,
            uid: uid || socket.id,
            username: username || 'Player 1',
            avatar: avatar || '🥷',
            ready: false,
            score: 0,
            choice: null,
            isHost: true
        };

        const newRoom = {
            code: roomCode,
            gameMode: `Best of ${targetWins}`,
            targetWins: targetWins,
            betAmount: validatedBet,
            pot: validatedBet * 2,
            challengeId: challengeId || null,
            currentRound: 1,
            players: [player1],
            status: 'waiting' // 'waiting' | 'ready' | 'counting' | 'playing' | 'finished'
        };

        rooms.set(roomCode, newRoom);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`🏠 Room Created: ${roomCode} by ${player1.username} (Bet: ${validatedBet} 🪙)`);
        socket.emit('roomCreated', { roomCode, room: newRoom });
    });

    // 2. JOIN ROOM (SUPPORT DYNAMIC ROOM CREATION & RECONNECTS)
    socket.on('joinRoom', ({ roomCode, matchId, uid, username, avatar, gameMode, betAmount }) => {
        const cleanCode = (roomCode || matchId || '').trim().toUpperCase();
        if (!cleanCode) return;

        let room = rooms.get(cleanCode);

        // Search rooms by matchId or challengeId if not found by exact cleanCode key
        if (!room) {
            for (const r of rooms.values()) {
                if (r.code === cleanCode || r.challengeId === cleanCode || (r.matchId && r.matchId === cleanCode)) {
                    room = r;
                    break;
                }
            }
        }

        // Auto-initialize room on server if created via RTDB
        if (!room) {
            const targetWins = parseInt((gameMode || 'Best of 4').replace('Best of ', '')) || 4;
            const validatedBet = parseInt(betAmount) || 0;

            room = {
                code: cleanCode,
                matchId: cleanCode,
                gameMode: `Best of ${targetWins}`,
                targetWins: targetWins,
                betAmount: validatedBet,
                pot: validatedBet * 2,
                currentRound: 1,
                players: [],
                status: 'waiting'
            };
            rooms.set(cleanCode, room);
            console.log(`🏠 Server auto-initialized room for: ${cleanCode}`);
        }

        socket.join(cleanCode);
        socket.roomCode = cleanCode;

        // Check if player with this UID already exists in room (e.g., reconnect/sync)
        let existingPlayer = room.players.find(p => (uid && p.uid === uid) || p.socketId === socket.id);
        if (existingPlayer) {
            existingPlayer.socketId = socket.id;
            if (username) existingPlayer.username = username;
            console.log(`🔄 Player ${existingPlayer.username} (${uid}) updated socketId in room: ${cleanCode}`);
        } else {
            if (room.players.length >= 2) {
                console.warn(`⚠️ Room ${cleanCode} is full (2 players already exist).`);
                return socket.emit('errorMsg', 'Room is full (Maximum 2 players)!');
            }

            const isHost = room.players.length === 0;
            const newPlayer = {
                socketId: socket.id,
                uid: uid || socket.id,
                username: username || (isHost ? 'Player 1' : 'Player 2'),
                avatar: avatar || (isHost ? '🥷' : '⚡'),
                ready: false,
                score: 0,
                choice: null,
                isHost: isHost
            };
            room.players.push(newPlayer);
            console.log(`🎮 Player (${newPlayer.username}) joined room: ${cleanCode} (Total Players: ${room.players.length})`);
        }

        io.to(cleanCode).emit('playerJoined', { room });
        io.to(cleanCode).emit('roomUpdated', { room });
    });

    // 3. TOGGLE PLAYER READY
    socket.on('playerReady', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
            player.ready = !player.ready;
            io.to(roomCode).emit('roomUpdated', { room });

            // Check if both players are ready to start the game
            if (room.players.length === 2 && room.players.every(p => p.ready)) {
                room.status = 'counting';
                io.to(roomCode).emit('startCountdown', { room });

                // Server 3-second live countdown
                let countdown = 3;
                const timer = setInterval(() => {
                    if (countdown > 0) {
                        io.to(roomCode).emit('countdownTick', { count: countdown });
                        countdown--;
                    } else {
                        clearInterval(timer);
                        room.status = 'playing';
                        io.to(roomCode).emit('startRoundChoices', { room });
                    }
                }, 900);
            }
        }
    });

    // 4. PLAYER CHOICE SELECTION (SERVER-SIDE VALIDATION & ROUND SYNCHRONIZATION)
    socket.on('playerChoice', ({ roomCode, matchId, uid, choice }) => {
        let room = null;
        if (roomCode) room = rooms.get((roomCode || '').trim().toUpperCase());
        if (!room && matchId) {
            for (const r of rooms.values()) {
                if (r.code === matchId || r.challengeId === matchId || (r.matchId && r.matchId === matchId)) {
                    room = r;
                    break;
                }
            }
        }
        if (!room) {
            for (const r of rooms.values()) {
                if (r.players.some(p => p.socketId === socket.id || (uid && p.uid === uid))) {
                    room = r;
                    break;
                }
            }
        }

        if (!room) {
            console.warn(`❌ playerChoice: Room not found for code '${roomCode}' / matchId '${matchId}' / uid '${uid}'`);
            return;
        }

        if (room.status === 'starting' || room.status === 'counting' || room.status === 'waiting') {
            room.status = 'playing';
        }

        const validChoices = ['stone', 'paper', 'scissors'];
        if (!validChoices.includes(choice)) return;

        const player = room.players.find(p => p.socketId === socket.id || (uid && p.uid === uid));
        if (!player) {
            console.warn(`❌ playerChoice: Player not found in room '${room.code}' for socket '${socket.id}' / uid '${uid}'`);
            return;
        }

        player.socketId = socket.id;

        if (player.choice !== null) {
            console.log(`⚠️ Player ${player.username} already submitted choice in ${room.code}`);
            return;
        }

        player.choice = choice;
        player.submitted = true;
        console.log(`✊ CHOICE SUBMITTED in room ${room.code} by ${player.username} (${player.uid}): ${choice}`);

        // Acknowledge submission to the submitting player
        socket.emit('choiceSubmitted', { choice: choice, currentRound: room.currentRound });

        // Notify opponent that the other player has submitted choice (without revealing choice)
        socket.to(room.code).emit('opponentChoiceSubmitted', {
            username: player.username,
            currentRound: room.currentRound
        });

        console.log(`🔍 CHECK BOTH PLAYERS in ${room.code}:`);
        room.players.forEach((p, idx) => {
            console.log(`   Player ${idx + 1} (${p.username}): choice = ${p.choice}`);
        });

        // Check if BOTH players have submitted their choices
        if (room.players.length === 2 && room.players.every(p => p.choice !== null)) {
            console.log(`✨ BOTH CHOICES RECEIVED in ${room.code}! Calculating round result...`);
            const p1 = room.players[0];
            const p2 = room.players[1];

            const outcome = calculateServerWinner(p1.choice, p2.choice);

            if (outcome === 'p1') {
                p1.score++;
            } else if (outcome === 'p2') {
                p2.score++;
            }

            const resultPayload = {
                roomCode: room.code,
                matchId: room.code,
                currentRound: room.currentRound,
                p1Uid: p1.uid,
                p1Name: p1.username,
                p1Choice: p1.choice,
                p2Uid: p2.uid,
                p2Name: p2.username,
                p2Choice: p2.choice,
                p1Score: p1.score,
                p2Score: p2.score,
                outcome: outcome,
                winnerName: outcome === 'p1' ? p1.username : (outcome === 'p2' ? p2.username : 'Draw')
            };

            console.log(`🏆 ROUND RESULT for ${room.code}: ${p1.username} (${p1.choice}) VS ${p2.username} (${p2.choice}) -> Outcome: ${outcome} (Score: ${p1.score}-${p2.score})`);

            // Broadcast round result to BOTH players in the room
            io.to(room.code).emit('roundResult', resultPayload);

            const isTargetReached = p1.score >= room.targetWins || p2.score >= room.targetWins;

            if (isTargetReached) {
                room.status = 'finished';

                let matchWinner = null;
                let matchLoser = null;

                if (p1.score > p2.score) {
                    matchWinner = p1;
                    matchLoser = p2;
                } else if (p2.score > p1.score) {
                    matchWinner = p2;
                    matchLoser = p1;
                }

                setTimeout(() => {
                    io.to(room.code).emit('matchFinished', {
                        roomCode: room.code,
                        p1Score: p1.score,
                        p2Score: p2.score,
                        winner: matchWinner,
                        loser: matchLoser,
                        isTie: p1.score === p2.score,
                        gameMode: room.gameMode,
                        roundsPlayed: room.currentRound,
                        betAmount: room.betAmount || 0,
                        pot: room.pot || 0,
                        challengeId: room.challengeId || null
                    });
                }, 800);

            } else {
                room.currentRound++;
                p1.choice = null;
                p1.submitted = false;
                p2.choice = null;
                p2.submitted = false;

                setTimeout(() => {
                    if (rooms.has(room.code) && room.status === 'playing') {
                        console.log(`🔄 Emitting nextRound for ${room.code} (Round ${room.currentRound})`);
                        io.to(room.code).emit('nextRound', {
                            currentRound: room.currentRound,
                            room: room
                        });
                        io.to(room.code).emit('startRoundChoices', { room: room });
                    }
                }, 2500);
            }
        }
    });

    // 5. REMATCH REQUEST
    socket.on('rematch', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        room.currentRound = 1;
        room.status = 'waiting';
        room.players.forEach(p => {
            p.score = 0;
            p.choice = null;
            p.ready = false;
        });

        io.to(roomCode).emit('rematchStarted', { room });
    });

    // 5b. FRIEND BETTING CHALLENGE EVENTS & PRESENCE SYSTEM
    socket.on('registerUserPresence', ({ uid, username, avatar }) => {
        if (!uid) return;
        socket.uid = uid;

        if (!userSocketsMap.has(uid)) {
            userSocketsMap.set(uid, new Set());
        }
        userSocketsMap.get(uid).add(socket.id);

        console.log(`🟢 User Online: ${username} (${uid}) [Active Tabs/Sockets: ${userSocketsMap.get(uid).size}]`);

        const onlineUids = Array.from(userSocketsMap.keys());
        io.emit('presenceUpdate', { onlineUids });
    });

    socket.on('unregisterUserPresence', ({ uid }) => {
        const targetUid = uid || socket.uid;
        if (targetUid && userSocketsMap.has(targetUid)) {
            const socketSet = userSocketsMap.get(targetUid);
            socketSet.delete(socket.id);
            if (socketSet.size === 0) {
                userSocketsMap.delete(targetUid);
                console.log(`⚫ User Offline: ${targetUid}`);
            }
            const onlineUids = Array.from(userSocketsMap.keys());
            io.emit('presenceUpdate', { onlineUids });
        }
    });

    socket.on('getOnlineUsers', () => {
        const onlineUids = Array.from(userSocketsMap.keys());
        socket.emit('onlineUsersList', { onlineUids });
    });

    socket.on('sendFriendRequestNotif', ({ receiverUid, senderName }) => {
        if (userSocketsMap.has(receiverUid)) {
            userSocketsMap.get(receiverUid).forEach(sId => {
                io.to(sId).emit('friendRequestReceived', { senderName });
            });
        }
    });

    socket.on('friendRequestResponseNotif', ({ targetUid, responderName, accepted }) => {
        if (userSocketsMap.has(targetUid)) {
            userSocketsMap.get(targetUid).forEach(sId => {
                io.to(sId).emit('friendRequestResponse', { responderName, accepted });
            });
        }
    });

    socket.on('sendFriendChallenge', ({ challengeData }) => {
        const targetUid = challengeData.opponentId;
        if (targetUid && userSocketsMap.has(targetUid)) {
            userSocketsMap.get(targetUid).forEach(sId => {
                io.to(sId).emit('receiveFriendChallenge', { challengeData });
            });
        } else {
            socket.broadcast.emit('receiveFriendChallenge', { challengeData });
        }
    });

    socket.on('declineFriendChallenge', ({ challengeId, creatorSocketId }) => {
        if (creatorSocketId) {
            io.to(creatorSocketId).emit('friendChallengeDeclined', { challengeId });
        } else {
            socket.broadcast.emit('friendChallengeDeclined', { challengeId });
        }
    });

    // 6. LEAVE ROOM OR DISCONNECT HANDLER
    socket.on('leaveRoom', ({ roomCode }) => {
        handlePlayerLeave(socket, roomCode);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        if (socket.uid && userSocketsMap.has(socket.uid)) {
            const socketSet = userSocketsMap.get(socket.uid);
            socketSet.delete(socket.id);
            if (socketSet.size === 0) {
                userSocketsMap.delete(socket.uid);
                console.log(`⚫ User Offline: ${socket.uid}`);
            }
            const onlineUids = Array.from(userSocketsMap.keys());
            io.emit('presenceUpdate', { onlineUids });
        }
        if (socket.roomCode) {
            handlePlayerLeave(socket, socket.roomCode);
        }
    });
});

/**
 * Handles graceful player departure and room cleanup
 */
function handlePlayerLeave(socket, roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Filter out the leaving player
    const leavingPlayer = room.players.find(p => p.socketId === socket.id);
    room.players = room.players.filter(p => p.socketId !== socket.id);
    socket.leave(roomCode);

    if (leavingPlayer) {
        console.log(`🚪 ${leavingPlayer.username} left room ${roomCode}`);
    }

    if (room.players.length === 0) {
        // Room is empty, clean it up
        rooms.delete(roomCode);
        console.log(`🗑️ Room ${roomCode} deleted (empty).`);
    } else {
        // Remaining player is notified
        room.status = 'waiting';
        room.players[0].ready = false;
        room.players[0].score = 0;
        room.players[0].isHost = true;

        io.to(roomCode).emit('playerDisconnected', {
            message: `${leavingPlayer ? leavingPlayer.username : 'Opponent'} has left the room.`,
            room: room
        });
    }
}


/**
 * Start Server with Port Fallback
 */
function startServer(portToTry) {
    server.listen(portToTry)
        .on('listening', () => {
            console.log(`🚀 Real-Time Multiplayer Server listening on http://localhost:${portToTry}`);
        })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.warn(`⚠️ Port ${portToTry} in use. Retrying on port ${portToTry + 1}...`);
                server.close();
                setTimeout(() => {
                    server.listen(portToTry + 1);
                }, 100);
            } else {
                console.error('Server error:', err);
            }
        });
}

startServer(PORT);

