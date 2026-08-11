/* ==========================================================================
   STONE • PAPER • SCISSORS - FULL-STACK ENGINE WITH MULTIPLAYER & SOCKET.IO
   ========================================================================== */

import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    addDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    serverTimestamp,
    runTransaction,
    onSnapshot,
    rtdb,
    rtdbRef,
    rtdbSet,
    rtdbPush,
    rtdbOnValue,
    rtdbOnDisconnect,
    rtdbServerTimestamp,
    rtdbRemove,
    rtdbGet
} from './firebase-config.js';

// Initialize Socket.IO Client safely (compatible with static hosts & live backend)
const dummySocket = {
    on: () => {},
    off: () => {},
    emit: () => {},
    once: () => {},
    id: null
};
const socket = (typeof io !== 'undefined' && typeof io === 'function') ? (io({ autoConnect: true, reconnectionAttempts: 5, timeout: 5000 }) || dummySocket) : dummySocket;

/**
 * --------------------------------------------------------------------------
 * STEP 1: DOM ELEMENT SELECTIONS
 * --------------------------------------------------------------------------
 */

// Overlays & Screens
const modeSelectionOverlay = document.getElementById('mode-selection-overlay');
const matchEndOverlay = document.getElementById('match-end-overlay');
const statsOverlay = document.getElementById('stats-overlay');
const profileOverlay = document.getElementById('profile-overlay');
const historyOverlay = document.getElementById('history-overlay');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const authOverlay = document.getElementById('auth-overlay');
const createRoomOverlay = document.getElementById('create-room-overlay');
const joinRoomOverlay = document.getElementById('join-room-overlay');
const waitingRoomOverlay = document.getElementById('waiting-room-overlay');
const gameContainer = document.getElementById('game-container');
const rewardToast = document.getElementById('reward-toast');

// Mode Selection Buttons
const modeButtons = document.querySelectorAll('#sp-mode-container .mode-card-btn');

// Mode Switch Tabs (VS Computer vs 2-Player Online)
const tabSpBtn = document.getElementById('tab-sp-btn');
const tabMpBtn = document.getElementById('tab-mp-btn');
const spModeContainer = document.getElementById('sp-mode-container');
const mpModeContainer = document.getElementById('mp-mode-container');


// Multiplayer Room Buttons & Displays
const btnOpenCreateRoom = document.getElementById('btn-open-create-room');
const btnOpenJoinRoom = document.getElementById('btn-open-join-room');
const closeCreateRoomBtn = document.getElementById('close-create-room-btn');
const closeJoinRoomBtn = document.getElementById('close-join-room-btn');
const confirmCreateRoomBtn = document.getElementById('confirm-create-room-btn');
const confirmJoinRoomBtn = document.getElementById('confirm-join-room-btn');
const createModeSelect = document.getElementById('create-mode-select');
const joinCodeInput = document.getElementById('join-code-input');
const joinFeedback = document.getElementById('join-feedback');

const roomCodeVal = document.getElementById('room-code-val');
const copyCodeBtn = document.getElementById('copy-code-btn');
const waitingModeBadge = document.getElementById('waiting-mode-badge');
const playerReadyBtn = document.getElementById('player-ready-btn');
const leaveRoomBtn = document.getElementById('leave-room-btn');

const p1Avatar = document.getElementById('p1-avatar');
const p1Name = document.getElementById('p1-name');
const p1Status = document.getElementById('p1-status');
const p2Avatar = document.getElementById('p2-avatar');
const p2Name = document.getElementById('p2-name');
const p2Status = document.getElementById('p2-status');

// Auth DOM Elements
const headerAuthBtn = document.getElementById('header-auth-btn');
const headerUsernameDisplay = document.getElementById('header-username-display');
const closeAuthBtn = document.getElementById('close-auth-btn');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authFeedback = document.getElementById('auth-feedback');

// Status Pills & Header Badges
const modeDisplayBadge = document.getElementById('mode-display-badge');
const roundDisplayBadge = document.getElementById('round-display-badge');
const arenaSubtitle = document.getElementById('arena-subtitle');
const userCardLabel = document.getElementById('user-card-label');
const computerCardLabel = document.getElementById('computer-card-label');
const userScoreLabel = document.getElementById('user-score-label');
const computerScoreLabel = document.getElementById('computer-score-label');

const headerLevelBadge = document.getElementById('header-level-badge');
const headerCoinsCount = document.getElementById('header-coins-count');
const headerXpText = document.getElementById('header-xp-text');
const headerXpFill = document.getElementById('header-xp-fill');

// Match End Modal Content
const matchResultTitle = document.getElementById('match-result-title');
const matchScoreSummary = document.getElementById('match-score-summary');
const matchTrophy = document.getElementById('match-trophy');
const matchXpReward = document.getElementById('match-xp-reward');
const matchCoinsReward = document.getElementById('match-coins-reward');

const playAgainBtn = document.getElementById('play-again-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const inGameMenuBtn = document.getElementById('in-game-menu-btn');
const resetButton = document.getElementById('reset-btn');

// Profile Buttons & Content
const openProfileBtn = document.getElementById('open-profile-btn');
const openProfileMenuBtn = document.getElementById('open-profile-menu-btn');
const closeProfileBtn = document.getElementById('close-profile-btn');
const profileLevelBadge = document.getElementById('profile-level-badge');
const profileRankTitle = document.getElementById('profile-rank-title');
const profileEmailSubtitle = document.getElementById('profile-email-subtitle');
const profileCoins = document.getElementById('profile-coins');
const profileTotalXp = document.getElementById('profile-total-xp');
const profileLevelVal = document.getElementById('profile-level-val');
const profileXpText = document.getElementById('profile-xp-text');
const profileXpFill = document.getElementById('profile-xp-fill');

// Stats & History Buttons
const openStatsMenuBtn = document.getElementById('open-stats-menu-btn');
const openStatsEndBtn = document.getElementById('open-stats-end-btn');
const openStatsArenaBtn = document.getElementById('open-stats-arena-btn');
const closeStatsBtn = document.getElementById('close-stats-btn');
const resetStatsBtn = document.getElementById('reset-stats-btn');

const openHistoryMenuBtn = document.getElementById('open-history-menu-btn');
const openHistoryEndBtn = document.getElementById('open-history-end-btn');
const openHistoryArenaBtn = document.getElementById('open-history-arena-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const historyList = document.getElementById('history-list');

const openLeaderboardMenuBtn = document.getElementById('open-leaderboard-menu-btn');
const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
const leaderboardList = document.getElementById('leaderboard-list');
const lbTabs = document.querySelectorAll('.lb-tab');

// Game Arena Displays
const userMoveDisplay = document.getElementById('user-move-display');
const computerMoveDisplay = document.getElementById('computer-move-display');
const userCard = document.getElementById('user-card');
const computerCard = document.getElementById('computer-card');
const vsBadge = document.querySelector('.vs-badge');

const userScoreElement = document.getElementById('user-score');
const computerScoreElement = document.getElementById('computer-score');
const resultMessageElement = document.getElementById('result-message');
const choiceButtons = document.querySelectorAll('.choice-btn');


/**
 * --------------------------------------------------------------------------
 * STEP 2: STATE & CONFIGURATION
 * --------------------------------------------------------------------------
 */

const PROGRESSION_CONFIG = {
    XP_PER_LEVEL: 100,
    REWARDS: {
        WIN:  { xp: 50, coins: 20 },
        LOSE: { xp: 10, coins: 5  },
        DRAW: { xp: 20, coins: 10 }
    },
    TITLES: [
        { minLevel: 10, title: 'Grand Champion 👑' },
        { minLevel: 8,  title: 'Scissors Master ✌️' },
        { minLevel: 5,  title: 'Rock Crusher ✊' },
        { minLevel: 3,  title: 'Paper Slasher ✋' },
        { minLevel: 1,  title: 'Novice Fighter 🥷' }
    ]
};

const STATS_STORAGE_KEY = 'stone_paper_scissors_stats_v1';
const PROGRESSION_STORAGE_KEY = 'stone_paper_scissors_progression_v1';

let currentUser = null;
let userProfileData = null;

let userDocUnsubscribe = null;
let allUsersUnsubscribe = null;
let friendships1Unsubscribe = null;
let friendships2Unsubscribe = null;
let q1FriendshipsMap = new Map();
let q2FriendshipsMap = new Map();

let onlineUserUidsSet = new Set();
let socketOnlineUidsSet = new Set();
let rtdbOnlineUidsSet = new Set();

let allRegisteredUsersList = [];
let userFriendshipsList = [];
var lastLoadUsersError = null;
if (typeof window !== 'undefined') window.lastLoadUsersError = null;
let selectedChallengeTargetFriend = null;

let isMultiplayerMode = false; // Single Player vs Online Multiplayer flag
let currentRoomCode = null;
let currentRoomData = null;

let gameStats = {
    totalMatches: 0,
    matchesWon: 0,
    matchesLost: 0,
    matchesDrawn: 0,
    totalRoundsPlayed: 0,
    currentStreak: 0,
    bestStreak: 0
};

let userProgression = {
    coins: 0,
    totalXP: 0,
    level: 1
};


/**
 * --------------------------------------------------------------------------
 * STEP 3: FIREBASE AUTHENTICATION & FIRESTORE SYNC
 * --------------------------------------------------------------------------
 */

const authLoadingOverlay = document.getElementById('auth-loading-overlay');

onAuthStateChanged(auth, async (user) => {
    // Hide the loading screen once Firebase has determined auth state
    if (authLoadingOverlay) authLoadingOverlay.classList.add('hidden');

    if (user) {
        currentUser = user;
        console.log(`🔐 Logged in as: ${user.email} (${user.uid})`);

        headerAuthBtn.innerHTML = '<span class="btn-icon">🚪</span> Logout';
        headerAuthBtn.classList.add('logged-in');

        // Hide Login, show Home
        if (authOverlay) authOverlay.classList.add('hidden');
        modeSelectionOverlay.classList.remove('hidden');

        await syncUserFromFirestore(user);
    } else {
        // IMPORTANT: Clean up listeners BEFORE clearing currentUser reference
        // (Fix: the old code set currentUser=null first, then checked if(currentUser) which was always false)
        const previousUser = currentUser;
        const logoutUid = previousUser ? previousUser.uid : null;

        // Clean up all Firebase listeners while we still have the UID
        if (logoutUid) {
            if (userDocUnsubscribe) {
                userDocUnsubscribe();
                userDocUnsubscribe = null;
            }
            if (allUsersUnsubscribe) { allUsersUnsubscribe(); allUsersUnsubscribe = null; }
            if (friendships1Unsubscribe) { friendships1Unsubscribe(); friendships1Unsubscribe = null; }
            if (friendships2Unsubscribe) { friendships2Unsubscribe(); friendships2Unsubscribe = null; }
            if (rtdbUsersListenerUnsub) { rtdbUsersListenerUnsub(); rtdbUsersListenerUnsub = null; }
            if (rtdbStatusListenerUnsub) { rtdbStatusListenerUnsub(); rtdbStatusListenerUnsub = null; }
            if (rtdbIncomingChallengesUnsub) { rtdbIncomingChallengesUnsub(); rtdbIncomingChallengesUnsub = null; }
            q1FriendshipsMap.clear();
            q2FriendshipsMap.clear();
            cleanupRtdbPresence();
            rtdbSet(rtdbRef(rtdb, `status/${logoutUid}/state`), 'offline').catch(() => {});
            unregisterCurrentPresence(logoutUid);
        }

        // NOW clear state
        currentUser = null;
        userProfileData = null;
        console.log('🔓 Guest User (Logged out)');

        headerAuthBtn.innerHTML = '<span class="btn-icon">🔑</span> Login';
        headerAuthBtn.classList.remove('logged-in');
        headerUsernameDisplay.textContent = 'Guest Player';

        // Hide ALL game screens, show Login
        modeSelectionOverlay.classList.add('hidden');
        gameContainer.classList.add('hidden');
        document.body.classList.remove('in-game');
        profileOverlay.classList.add('hidden');
        matchEndOverlay.classList.add('hidden');
        waitingRoomOverlay.classList.add('hidden');
        if (createRoomOverlay) createRoomOverlay.classList.add('hidden');
        if (joinRoomOverlay) joinRoomOverlay.classList.add('hidden');
        if (statsOverlay) statsOverlay.classList.add('hidden');
        if (historyOverlay) historyOverlay.classList.add('hidden');
        if (leaderboardOverlay) leaderboardOverlay.classList.add('hidden');

        authOverlay.classList.remove('hidden');

        allRegisteredUsersList = [];
        userFriendshipsList = [];
        lastLoadUsersError = null;
        loadLocalStorageData();
        renderProgressionUI();
        renderStatsUI();
        renderFriendsTab();
        renderAllPlayersTab();
        renderRequestsTab();
    }
});

async function syncUserFromFirestore(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            userProfileData = docSnap.data();

            userProgression.coins = userProfileData.coins || 0;
            userProgression.totalXP = userProfileData.xp || 0;
            userProgression.level = userProfileData.level || 1;

            gameStats.totalMatches = userProfileData.totalMatches || 0;
            gameStats.matchesWon = userProfileData.wins || 0;
            gameStats.matchesLost = userProfileData.losses || 0;
            gameStats.matchesDrawn = userProfileData.draws || 0;
            gameStats.currentStreak = userProfileData.currentWinStreak || 0;
            gameStats.bestStreak = userProfileData.bestWinStreak || 0;

            const displayName = userProfileData.username || user.email.split('@')[0];
            if (headerUsernameDisplay) headerUsernameDisplay.textContent = displayName;
            if (profileEmailSubtitle) profileEmailSubtitle.textContent = user.email;

            renderProgressionUI();
            renderStatsUI();

            // Reset any legacy stuck lockedCoins in Firestore
            if (userProfileData.lockedCoins && userProfileData.lockedCoins > 0) {
                userProfileData.lockedCoins = 0;
                await updateDoc(userDocRef, { lockedCoins: 0 }).catch(() => {});
            }

            // Process welcome bonus if not yet claimed
            await processWelcomeBonus(user.uid);
            // Check and show daily reward
            await checkAndShowDailyReward(user.uid);
        } else {
            const defaultUsername = user.displayName || user.email.split('@')[0];
            await createInitialUserDoc(user.uid, defaultUsername, user.email);
        }

        // Attach realtime Firestore document listener for coins and stats
        if (userDocUnsubscribe) userDocUnsubscribe();
        userDocUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                userProfileData = snapshot.data();
                userProgression.coins = userProfileData.coins || 0;
                userProgression.totalXP = userProfileData.xp || 0;
                userProgression.level = userProfileData.level || 1;

                gameStats.totalMatches = userProfileData.totalMatches || 0;
                gameStats.matchesWon = userProfileData.wins || 0;
                gameStats.matchesLost = userProfileData.losses || 0;
                gameStats.matchesDrawn = userProfileData.draws || 0;
                gameStats.currentStreak = userProfileData.currentWinStreak || 0;
                gameStats.bestStreak = userProfileData.bestWinStreak || 0;

                renderProgressionUI();
                renderStatsUI();
            }
        }, (err) => {
            console.error('Error in realtime user document snapshot listener:', err);
        });

        // Register presence and load social data for logged-in user
        initRtdbPresence(user.uid);
        subscribeGlobalRtdbPresence();
        subscribeIncomingRtdbChallenges(user.uid);
        registerCurrentPresence();
        await loadSocialData();
    } catch (e) {
        console.error('Error syncing Firestore user document:', e);
    }
}

async function createInitialUserDoc(uid, username, email) {
    const newUserDoc = {
        uid: uid,
        username: username,
        email: email,
        coins: 100,
        xp: userProgression.totalXP || 0,
        level: userProgression.level || 1,
        totalMatches: gameStats.totalMatches || 0,
        wins: gameStats.matchesWon || 0,
        losses: gameStats.matchesLost || 0,
        draws: gameStats.matchesDrawn || 0,
        currentWinStreak: gameStats.currentStreak || 0,
        bestWinStreak: gameStats.bestStreak || 0,
        welcomeBonusClaimed: true,
        lastDailyRewardDate: '',
        lockedCoins: 0,
        createdAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', uid), newUserDoc);
    userProfileData = newUserDoc;
    userProgression.coins = 100;
    if (headerUsernameDisplay) headerUsernameDisplay.textContent = username;
    renderProgressionUI();

    // Record welcome bonus transaction
    await recordCoinTransaction(uid, 'WELCOME_BONUS', 100, 100, null);

    // Show daily reward after account creation
    await checkAndShowDailyReward(uid);

    console.log('🎁 Welcome Bonus: +100 coins awarded to new account.');
}

async function updateFirestoreUserDoc() {
    if (!currentUser) return;
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            coins: userProgression.coins,
            xp: userProgression.totalXP,
            level: userProgression.level,
            totalMatches: gameStats.totalMatches,
            wins: gameStats.matchesWon,
            losses: gameStats.matchesLost,
            draws: gameStats.matchesDrawn,
            currentWinStreak: gameStats.currentStreak,
            bestWinStreak: gameStats.bestStreak
        });
        console.log('☁️ Firestore user document synced successfully.');
    } catch (e) {
        console.error('Error updating Firestore user doc:', e);
    }
}

async function saveMatchToFirestore(matchRecord) {
    if (!currentUser) return;
    try {
        await addDoc(collection(db, 'matches'), {
            userId: currentUser.uid,
            username: matchRecord.username || 'Player',
            opponentName: matchRecord.opponentName || 'Computer',
            matchType: matchRecord.matchType || 'VS Computer',
            mode: matchRecord.mode || 'Best of 3',
            userScore: matchRecord.userScore || 0,
            computerScore: matchRecord.computerScore || 0,
            outcome: matchRecord.outcome || 'DRAW',
            rounds: matchRecord.rounds || ((matchRecord.userScore || 0) + (matchRecord.computerScore || 0)),
            xpEarned: matchRecord.xpEarned || 0,
            coinsEarned: matchRecord.coinsEarned || 0,
            betAmount: matchRecord.betAmount || 0,
            timestamp: serverTimestamp()
        });
        console.log('📜 Match result saved to Cloud Firestore matches collection.');
    } catch (e) {
        console.error('Error saving match result to Firestore:', e);
    }
}

async function loadMatchHistory() {
    const listContainers = [
        document.getElementById('profile-history-list'),
        document.getElementById('history-list')
    ].filter(Boolean);

    if (!currentUser) {
        listContainers.forEach(container => {
            container.innerHTML = '<div class="empty-state">Please sign in to view your Cloud Match History!</div>';
        });
        return;
    }

    listContainers.forEach(container => {
        container.innerHTML = '<div class="empty-state">Loading match history...</div>';
    });

    try {
        const q = query(
            collection(db, 'matches'),
            where('userId', '==', currentUser.uid),
            orderBy('timestamp', 'desc'),
            limit(15)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            listContainers.forEach(container => {
                container.innerHTML = '<div class="empty-state">No match records found. Complete a match to build history!</div>';
            });
            return;
        }

        listContainers.forEach(container => container.innerHTML = '');

        querySnapshot.forEach(docSnap => {
            const match = docSnap.data();
            const badgeClass = match.outcome === 'WIN' ? 'history-badge-win' : match.outcome === 'LOSE' ? 'history-badge-lose' : 'history-badge-draw';
            const dateStr = match.timestamp ? new Date(match.timestamp.toDate()).toLocaleString() : 'Recently';
            const xpGained = match.xpEarned ? `+${match.xpEarned} XP` : '';
            const coinsGained = match.coinsEarned ? `+${match.coinsEarned} 🪙` : '';

            const itemHtml = `
                <div class="history-item">
                    <span class="history-badge ${badgeClass}">${match.outcome}</span>
                    <div class="history-details">
                        <span class="history-mode">${match.mode}</span>
                        <span class="history-date">${dateStr} • ${xpGained} ${coinsGained}</span>
                    </div>
                    <div class="history-score">${match.userScore} - ${match.computerScore}</div>
                </div>
            `;

            listContainers.forEach(container => {
                container.insertAdjacentHTML('beforeend', itemHtml);
            });
        });
    } catch (e) {
        console.error('Error loading match history:', e);
        listContainers.forEach(container => {
            container.innerHTML = '<div class="empty-state">Unable to load match history.</div>';
        });
    }
}

async function loadLeaderboard(sortBy = 'wins') {
    leaderboardList.innerHTML = '<div class="empty-state">Loading global champions...</div>';

    try {
        const fieldName = sortBy === 'xp' ? 'xp' : sortBy === 'coins' ? 'coins' : 'wins';
        const q = query(
            collection(db, 'users'),
            orderBy(fieldName, 'desc'),
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            leaderboardList.innerHTML = '<div class="empty-state">No leaderboard data available yet. Be the first champion!</div>';
            return;
        }

        leaderboardList.innerHTML = '';
        let rank = 1;

        querySnapshot.forEach(docSnap => {
            const player = docSnap.data();
            const isCurrentUser = currentUser && player.uid === currentUser.uid;
            
            let rankBadge = `${rank}`;
            let rankClass = '';
            if (rank === 1) { rankBadge = '👑'; rankClass = 'rank-1'; }
            else if (rank === 2) { rankBadge = '🥈'; rankClass = 'rank-2'; }
            else if (rank === 3) { rankBadge = '🥉'; rankClass = 'rank-3'; }

            const valDisplay = sortBy === 'xp' ? `${player.xp || 0} XP` : sortBy === 'coins' ? `${player.coins || 0} 🪙` : `${player.wins || 0} Wins`;

            const itemHtml = `
                <div class="leaderboard-item ${isCurrentUser ? 'is-current-user' : ''}">
                    <div class="rank-badge ${rankClass}">${rankBadge}</div>
                    <div class="lb-player-info">
                        <span class="lb-username">${player.username || 'Anonymous Fighter'}</span>
                        <span class="lb-level">LVL ${player.level || 1}</span>
                    </div>
                    <div class="lb-stat-value">${valDisplay}</div>
                </div>
            `;
            leaderboardList.insertAdjacentHTML('beforeend', itemHtml);
            rank++;
        });
    } catch (e) {
        console.error('Error loading leaderboard:', e);
        leaderboardList.innerHTML = '<div class="empty-state">Unable to load leaderboard.</div>';
    }
}


/**
 * --------------------------------------------------------------------------
 * STEP 4: SOCKET.IO MULTIPLAYER EVENT LISTENERS & ROOM LOGIC
 * --------------------------------------------------------------------------
 */

// 1. Connection Event
socket.on('connect', () => {
    console.log('⚡ Connected to Socket.IO Multiplayer Server! Socket ID:', socket.id);
    if (currentUser) {
        registerCurrentPresence();
        initRtdbPresence(currentUser.uid);
        subscribeGlobalRtdbPresence();
    }
});

// 2. Room Created Callback
socket.on('roomCreated', ({ roomCode, room }) => {
    currentRoomCode = roomCode;
    currentRoomData = room;
    isMultiplayerMode = true;

    if (roomCodeVal) roomCodeVal.textContent = roomCode;
    if (waitingModeBadge) waitingModeBadge.textContent = `MODE: ${room.gameMode}`;

    const host = room.players[0];
    p1Name.textContent = host.username;
    p1Avatar.textContent = host.avatar || '🥷';
    p1Status.textContent = 'Not Ready';
    p1Status.classList.remove('ready');

    p2Name.textContent = 'Waiting for Player 2...';
    p2Avatar.textContent = '❓';
    p2Status.textContent = 'Not Ready';
    p2Status.classList.remove('ready');

    playerReadyBtn.textContent = "⚡ I'm Ready!";

    createRoomOverlay.classList.add('hidden');
    modeSelectionOverlay.classList.add('hidden');
    waitingRoomOverlay.classList.remove('hidden');
});

// 3. Player Joined Callback
socket.on('playerJoined', ({ room }) => {
    currentRoomCode = room.code;
    currentRoomData = room;
    isMultiplayerMode = true;

    if (roomCodeVal) roomCodeVal.textContent = room.code;
    if (waitingModeBadge) waitingModeBadge.textContent = `MODE: ${room.gameMode}`;

    const p1 = room.players[0];
    const p2 = room.players[1];

    if (p1) {
        p1Name.textContent = p1.username;
        p1Avatar.textContent = p1.avatar || '🥷';
        p1Status.textContent = p1.ready ? 'Ready!' : 'Not Ready';
        p1Status.classList.toggle('ready', p1.ready);
    }

    if (p2) {
        p2Name.textContent = p2.username;
        p2Avatar.textContent = p2.avatar || '⚡';
        p2Status.textContent = p2.ready ? 'Ready!' : 'Not Ready';
        p2Status.classList.toggle('ready', p2.ready);
    }

    if (joinRoomOverlay) joinRoomOverlay.classList.add('hidden');
    if (modeSelectionOverlay) modeSelectionOverlay.classList.add('hidden');
    waitingRoomOverlay.classList.remove('hidden');
});

// 4. Room Updated Callback (Ready Statuses)
socket.on('roomUpdated', ({ room }) => {
    currentRoomCode = room.code;
    currentRoomData = room;
    isMultiplayerMode = true;

    const p1 = room.players[0];
    const p2 = room.players[1];

    if (p1) {
        p1Status.textContent = p1.ready ? 'Ready!' : 'Not Ready';
        p1Status.classList.toggle('ready', p1.ready);
    }

    if (p2) {
        p2Status.textContent = p2.ready ? 'Ready!' : 'Not Ready';
        p2Status.classList.toggle('ready', p2.ready);
    }
});

// 5. Countdown Start Callback
socket.on('startCountdown', ({ room }) => {
    currentRoomData = room;
    waitingRoomOverlay.classList.add('hidden');

    // Update Arena labels for 2-Player Multiplayer
    const p1 = room.players[0];
    const p2 = room.players[1];

    const isHost = socket.id === p1.socketId;
    const me = isHost ? p1 : p2;
    const opponent = isHost ? p2 : p1;

    const myName = me ? (me.username || me.name) : 'Player 1';
    const oppName = opponent ? (opponent.username || opponent.name) : 'Player 2';

    userCardLabel.textContent = myName;
    computerCardLabel.textContent = oppName;
    userScoreLabel.textContent = `${myName}:`;
    computerScoreLabel.textContent = `${oppName}:`;
    arenaSubtitle.textContent = `Real-Time Match: ${myName} VS ${oppName}`;

    // Show Bet Match Banner if this is a bet match
    const betBanner = document.getElementById('bet-match-banner');
    const potAmount = room.pot || (room.betAmount ? room.betAmount * 2 : 0);
    if (potAmount > 0 && betBanner) {
        const betTotalPot = document.getElementById('bet-total-pot');
        if (betTotalPot) betTotalPot.textContent = `🪙 ${potAmount}`;
        betBanner.classList.remove('hidden');
    } else if (betBanner) {
        betBanner.classList.add('hidden');
    }

    // Hide Stats, History, and Menu buttons during active multiplayer match (showing ONLY Reset Match)
    if (openStatsArenaBtn) openStatsArenaBtn.classList.add('hidden');
    if (openHistoryArenaBtn) openHistoryArenaBtn.classList.add('hidden');
    if (inGameMenuBtn) inGameMenuBtn.classList.add('hidden');

    modeDisplayBadge.textContent = `MODE: ${room.gameMode}`;
    roundDisplayBadge.textContent = `ROUND 1`;

    userScoreElement.textContent = '0';
    computerScoreElement.textContent = '0';
    userMoveDisplay.textContent = '❓';
    computerMoveDisplay.textContent = '❓';
    
    clearVisualEffects();
    toggleChoiceButtons(true);
    gameContainer.classList.remove('hidden');
    document.body.classList.add('in-game');

    resultMessageElement.classList.add('countdown-text');
    animateResultText('GET READY!', 'countdown-pulse');
});

// 6. Countdown Tick Event
socket.on('countdownTick', ({ count }) => {
    animateResultText(`${count}`, 'countdown-pulse');
});

// 7. Start Round Choices Event (server says its time to pick again)
socket.on('startRoundChoices', ({ room }) => {
    clearVisualEffects();
    userMoveDisplay.textContent = '❓';
    computerMoveDisplay.textContent = '❓';
    resultMessageElement.textContent = 'Make your move!';

    if (room) {
        roundDisplayBadge.textContent = `ROUND ${room.currentRound}`;
    }

    animateResultText('FIGHT!', 'fight-pulse');
    toggleChoiceButtons(false);
});

// 7b. Choice Submitted Event (Acknowledge to local player)
socket.off('choiceSubmitted');
socket.on('choiceSubmitted', ({ choice }) => {
    toggleChoiceButtons(true);
    const choiceName = choice ? (choice.charAt(0).toUpperCase() + choice.slice(1)) : 'choice';
    resultMessageElement.textContent = `You selected ${choiceName} • Waiting for opponent...`;
});

// 7c. Opponent Choice Submitted Event (Notify player waiting to choose)
socket.off('opponentChoiceSubmitted');
socket.on('opponentChoiceSubmitted', ({ username }) => {
    const isLocalSubmitted = Array.from(choiceButtons).some(btn => btn.disabled);
    if (!isLocalSubmitted) {
        resultMessageElement.textContent = `${username || 'Opponent'} has submitted their choice! Make your move!`;
    } else {
        resultMessageElement.textContent = `Opponent has chosen • Waiting for result...`;
    }
});

// 7d. Next Round Transition Event (Requirement 11)
socket.off('nextRound');
socket.on('nextRound', ({ currentRound, room }) => {
    clearVisualEffects();
    userMoveDisplay.textContent = '❓';
    computerMoveDisplay.textContent = '❓';
    resultMessageElement.textContent = 'Make your move!';
    roundDisplayBadge.textContent = `ROUND ${currentRound}`;

    if (room) {
        currentRoomData = room;
    }

    animateResultText('FIGHT!', 'fight-pulse');
    toggleChoiceButtons(false);
});

// 8. Round Result Callback (Server-Side Decision Received - Requirement 7 & 8)
socket.off('roundResult');
socket.on('roundResult', ({ p1Choice, p2Choice, p1Score, p2Score, outcome, currentRound, p1Uid, p1Name, p2Uid, p2Name, winnerName }) => {
    toggleChoiceButtons(true);

    const isHost = checkIsPlayerA();

    const myChoice = isHost ? p1Choice : p2Choice;
    const oppChoice = isHost ? p2Choice : p1Choice;
    const myScore = isHost ? p1Score : p2Score;
    const oppScore = isHost ? p2Score : p1Score;

    // Reveal BOTH choices simultaneously on BOTH clients (Requirement 8)
    animateMoveReveal(userMoveDisplay, moveEmojis[myChoice]);
    animateMoveReveal(computerMoveDisplay, moveEmojis[oppChoice]);

    userScoreElement.textContent = myScore;
    computerScoreElement.textContent = oppScore;

    clearVisualEffects();
    resultMessageElement.classList.add('result-shake');

    let myOutcome = 'draw';
    if (outcome === 'p1') myOutcome = isHost ? 'win' : 'lose';
    if (outcome === 'p2') myOutcome = isHost ? 'lose' : 'win';

    // REPLACE stuck message immediately with round winner message (Requirement 9)
    if (myOutcome === 'win') {
        resultMessageElement.textContent = `🎉 You win Round ${currentRound}!`;
        resultMessageElement.classList.add('result-win');
        userCard.classList.add('winner');
        computerCard.classList.add('loser');
    } else if (myOutcome === 'lose') {
        resultMessageElement.textContent = `🏆 ${winnerName || 'Opponent'} wins Round ${currentRound}!`;
        resultMessageElement.classList.add('result-lose');
        computerCard.classList.add('computer-winner');
        userCard.classList.add('loser');
    } else {
        resultMessageElement.textContent = `🤝 Round ${currentRound} Draw!`;
        resultMessageElement.classList.add('result-draw');
    }

    roundDisplayBadge.textContent = `ROUND ${currentRound}`;
});

// 9. Match Finished Callback
socket.on('matchFinished', async ({ roomCode, winner, loser, isTie, p1Score, p2Score, gameMode, betAmount, pot, challengeId }) => {
    const activeRoomCode = roomCode || currentRoomCode;
    const isHost = (currentRoomData && currentRoomData.players && currentRoomData.players[0]) ? (socket.id === currentRoomData.players[0].socketId) : true;
    const myScore = isHost ? p1Score : p2Score;
    const oppScore = isHost ? p2Score : p1Score;

    let outcomeTag = 'DRAW';

    if (isTie) {
        matchTrophy.textContent = '🤝';
        matchResultTitle.textContent = '🤝 Draw!';
        outcomeTag = 'DRAW';
    } else if (winner && winner.socketId === socket.id) {
        matchTrophy.textContent = '🏆';
        matchResultTitle.textContent = '🏆 You Won!';
        outcomeTag = 'WIN';
    } else {
        matchTrophy.textContent = '💀';
        matchResultTitle.textContent = '💀 You Lost!';
        outcomeTag = 'LOSE';
    }

    matchScoreSummary.textContent = `Final Score: ${myScore} - ${oppScore}`;

    // Hide game container and SHOW match end overlay IMMEDIATELY
    gameContainer.classList.add('hidden');
    document.body.classList.remove('in-game');
    matchEndOverlay.classList.remove('hidden');

    // Record stats
    gameStats.totalMatches++;
    if (outcomeTag === 'WIN') { gameStats.matchesWon++; gameStats.currentStreak++; if (gameStats.currentStreak > gameStats.bestStreak) gameStats.bestStreak = gameStats.currentStreak; }
    else if (outcomeTag === 'LOSE') { gameStats.matchesLost++; gameStats.currentStreak = 0; }
    else { gameStats.matchesDrawn++; gameStats.currentStreak = 0; }

    saveLocalStorageData();
    renderStatsUI();

    // Hide bet banner
    const betBanner = document.getElementById('bet-match-banner');
    if (betBanner) betBanner.classList.add('hidden');

    const actualBet = betAmount || (currentRoomData ? currentRoomData.betAmount : 0) || 0;

    // For non-bet matches, award base XP & coins
    if (actualBet <= 0) {
        awardMatchRewards(outcomeTag);
    } else {
        // For bet matches, award XP only (coins managed atomically by bet settlement)
        const reward = PROGRESSION_CONFIG.REWARDS[outcomeTag];
        if (reward) userProgression.totalXP += reward.xp;
    }

    // Update match result UI display with exact coin change breakdown
    const matchCoinsRewardEl = document.getElementById('match-coins-reward');
    const currentBalance = userProgression.coins;

    if (actualBet > 0) {
        if (outcomeTag === 'WIN') {
            matchTrophy.textContent = '🏆';
            matchResultTitle.textContent = '🏆 You Won!';
            if (matchCoinsRewardEl) {
                matchCoinsRewardEl.innerHTML = `<br><strong>Bet:</strong> ${actualBet} Coins<br><strong>Reward:</strong> +${actualBet * 2} Coins<br><strong>New Balance:</strong> 🪙 ${currentBalance} Coins`;
            }
        } else if (outcomeTag === 'LOSE') {
            matchTrophy.textContent = '💀';
            matchResultTitle.textContent = '💀 You Lost!';
            if (matchCoinsRewardEl) {
                matchCoinsRewardEl.innerHTML = `<br><strong>Bet Lost:</strong> -${actualBet} Coins<br><strong>New Balance:</strong> 🪙 ${currentBalance} Coins`;
            }
        } else {
            matchTrophy.textContent = '🤝';
            matchResultTitle.textContent = '🤝 Draw!';
            if (matchCoinsRewardEl) {
                matchCoinsRewardEl.innerHTML = `<br><strong>Bet Refunded:</strong> +${actualBet} Coins<br><strong>New Balance:</strong> 🪙 ${currentBalance} Coins`;
            }
        }
    }

    renderProgressionUI();

    // ATOMIC MULTIPLAYER BET SETTLEMENT (Runs once per matchId in Firestore transaction)
    if (actualBet > 0 && activeRoomCode) {
        const matchId = activeRoomCode;
        const winnerUid = winner ? winner.uid : (currentRoomData?.players[0]?.uid || null);
        const loserUid = loser ? loser.uid : (currentRoomData?.players[1]?.uid || null);

        settleMultiplayerBetMatch({
            matchId: matchId,
            winnerUid: winnerUid,
            loserUid: loserUid,
            isTie: isTie,
            betAmount: actualBet
        }).then(() => {
            renderProgressionUI();
            if (matchCoinsRewardEl && actualBet > 0) {
                const freshBal = userProgression.coins;
                if (outcomeTag === 'WIN') {
                    matchCoinsRewardEl.innerHTML = `<br><strong>Bet:</strong> ${actualBet} Coins<br><strong>Reward:</strong> +${actualBet * 2} Coins<br><strong>New Balance:</strong> 🪙 ${freshBal} Coins`;
                } else if (outcomeTag === 'LOSE') {
                    matchCoinsRewardEl.innerHTML = `<br><strong>Bet Lost:</strong> -${actualBet} Coins<br><strong>New Balance:</strong> 🪙 ${freshBal} Coins`;
                } else {
                    matchCoinsRewardEl.innerHTML = `<br><strong>Bet Refunded:</strong> +${actualBet} Coins<br><strong>New Balance:</strong> 🪙 ${freshBal} Coins`;
                }
            }
        }).catch(err => console.error('Error settling match bet:', err));
    }

    if (currentUser) {
        const reward = PROGRESSION_CONFIG.REWARDS[outcomeTag];
        const oppName = (currentRoomData && currentRoomData.players) 
            ? (isHost ? (currentRoomData.players[1]?.username || 'Online Player') : (currentRoomData.players[0]?.username || 'Online Player'))
            : 'Online Player';

        const mpMatchRecord = {
            id: 'mp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            userId: currentUser.uid,
            username: (userProfileData && userProfileData.username) ? userProfileData.username : currentUser.email.split('@')[0],
            opponentName: oppName,
            matchType: actualBet > 0 ? 'Bet Match' : 'Online Match',
            mode: gameMode || 'Online Match',
            userScore: myScore,
            computerScore: oppScore,
            outcome: outcomeTag,
            rounds: myScore + oppScore,
            xpEarned: reward ? reward.xp : 0,
            coinsEarned: outcomeTag === 'WIN' && actualBet > 0 ? actualBet * 2 : (actualBet > 0 ? 0 : (reward ? reward.coins : 0)),
            betAmount: actualBet,
            timestamp: Date.now()
        };

        saveMatchToLocalHistory(mpMatchRecord);
        updateFirestoreUserDoc().catch(() => {});
        saveMatchToFirestore(mpMatchRecord).catch(() => {});
    }
});

// 10. Player Disconnected Callback
socket.on('playerDisconnected', async ({ message, room }) => {
    alert(message || 'Opponent disconnected.');
    currentRoomData = room;
    if (gameContainer) gameContainer.classList.add('hidden');
    if (matchEndOverlay) matchEndOverlay.classList.add('hidden');

    const betAmount = (currentRoomData && currentRoomData.betAmount) || 0;
    if (betAmount > 0 && currentUser && currentRoomData && currentRoomData.status !== 'finished') {
        try {
            await refundLockedBet(betAmount);
            console.log(`🔓 Bet refunded due to opponent disconnect: +${betAmount} coins`);
        } catch (e) {
            console.error('Error refunding bet on disconnect:', e);
        }
    }

    const betBanner = document.getElementById('bet-match-banner');
    if (betBanner) betBanner.classList.add('hidden');

    // Update waiting room player card
    const p1 = room ? room.players[0] : null;
    if (p1) {
        if (p1Name) p1Name.textContent = p1.username;
        if (p1Avatar) p1Avatar.textContent = p1.avatar || '🥷';
        if (p1Status) {
            p1Status.textContent = 'Not Ready';
            p1Status.classList.remove('ready');
        }
    }
    if (p2Name) p2Name.textContent = 'Waiting for Player 2...';
    if (p2Avatar) p2Avatar.textContent = '❓';
    if (p2Status) {
        p2Status.textContent = 'Not Ready';
        p2Status.classList.remove('ready');
    }

    if (waitingRoomOverlay) waitingRoomOverlay.classList.remove('hidden');
});

// 11. Rematch Started Callback
socket.on('rematchStarted', ({ room }) => {
    currentRoomData = room;
    matchEndOverlay.classList.add('hidden');
    gameContainer.classList.add('hidden');

    const p1 = room.players[0];
    const p2 = room.players[1];

    if (p1) {
        p1Name.textContent = p1.username;
        p1Avatar.textContent = p1.avatar || '🥷';
        p1Status.textContent = 'Not Ready';
        p1Status.classList.remove('ready');
    }
    if (p2) {
        p2Name.textContent = p2.username;
        p2Avatar.textContent = p2.avatar || '⚡';
        p2Status.textContent = 'Not Ready';
        p2Status.classList.remove('ready');
    }

    waitingRoomOverlay.classList.remove('hidden');
});

// 12. Socket Error Messages
socket.on('errorMsg', (msg) => {
    alert(msg);
    if (joinFeedback) {
        joinFeedback.textContent = msg;
        joinFeedback.classList.remove('hidden');
        joinFeedback.classList.add('error');
    }
});


/**
 * --------------------------------------------------------------------------
 * STEP 5: LOCALSTORAGE & HELPER UTILITIES
 * --------------------------------------------------------------------------
 */

function loadLocalStorageData() {
    const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
    if (savedStats) { try { gameStats = JSON.parse(savedStats); } catch (e) {} }

    const savedProg = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (savedProg) { try { userProgression = JSON.parse(savedProg); } catch (e) {} }
}

function saveLocalStorageData() {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(gameStats));
    localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(userProgression));
}

function getPlayerRankTitle(level) {
    const matched = PROGRESSION_CONFIG.TITLES.find(t => level >= t.minLevel);
    return matched ? matched.title : 'Novice Fighter 🥷';
}

function renderProgressionUI() {
    const level = Math.floor(userProgression.totalXP / PROGRESSION_CONFIG.XP_PER_LEVEL) + 1;
    userProgression.level = level;

    const currentLevelXP = userProgression.totalXP % PROGRESSION_CONFIG.XP_PER_LEVEL;
    const xpPercentage = (currentLevelXP / PROGRESSION_CONFIG.XP_PER_LEVEL) * 100;
    const rankTitle = getPlayerRankTitle(level);

    if (headerLevelBadge) headerLevelBadge.textContent = `LVL ${level}`;
    if (headerCoinsCount) headerCoinsCount.textContent = userProgression.coins;
    if (headerXpText) headerXpText.textContent = `${currentLevelXP} / ${PROGRESSION_CONFIG.XP_PER_LEVEL} XP`;
    if (headerXpFill) headerXpFill.style.width = `${xpPercentage}%`;

    const headerNavCoins = document.getElementById('header-nav-coins');
    if (headerNavCoins) headerNavCoins.textContent = userProgression.coins;

    const profileUsernameDisplay = document.getElementById('profile-username-display');
    if (profileUsernameDisplay) {
        profileUsernameDisplay.textContent = (userProfileData && userProfileData.username) ? userProfileData.username : (currentUser ? currentUser.email.split('@')[0] : 'Guest Player');
    }

    if (profileLevelBadge) profileLevelBadge.textContent = `LVL ${level}`;
    if (profileLevelVal) profileLevelVal.textContent = level;
    if (profileRankTitle) profileRankTitle.textContent = rankTitle;
    if (profileCoins) profileCoins.textContent = userProgression.coins;
    if (profileTotalXp) profileTotalXp.textContent = userProgression.totalXP;
    if (profileXpText) profileXpText.textContent = `${currentLevelXP} / ${PROGRESSION_CONFIG.XP_PER_LEVEL} XP`;
    if (profileXpFill) profileXpFill.style.width = `${xpPercentage}%`;
}

function renderStatsUI() {
    const total = gameStats.totalMatches;
    const winRate = total > 0 ? ((gameStats.matchesWon / total) * 100).toFixed(1) + '%' : '0%';

    const setAllText = (id, val) => {
        document.querySelectorAll(`#${id}`).forEach(el => el.textContent = val);
    };

    setAllText('stat-total-matches', gameStats.totalMatches);
    setAllText('stat-matches-won', gameStats.matchesWon);
    setAllText('stat-matches-lost', gameStats.matchesLost);
    setAllText('stat-matches-drawn', gameStats.matchesDrawn);
    setAllText('stat-total-rounds', gameStats.totalRoundsPlayed);
    setAllText('stat-win-rate', winRate);
    setAllText('stat-current-streak', gameStats.currentStreak);
    setAllText('stat-best-streak', gameStats.bestStreak);
}

function awardMatchRewards(outcome) {
    const reward = PROGRESSION_CONFIG.REWARDS[outcome];
    if (!reward) return;

    userProgression.totalXP += reward.xp;
    userProgression.coins += reward.coins;

    saveLocalStorageData();
    renderProgressionUI();

    matchXpReward.textContent = `+${reward.xp} XP`;
    matchCoinsReward.textContent = `+${reward.coins} 🪙`;

    const coinAmountEl = document.getElementById('header-coins-count');
    if (coinAmountEl) {
        coinAmountEl.classList.remove('coin-pop');
        void coinAmountEl.offsetWidth;
        coinAmountEl.classList.add('coin-pop');
    }

    showRewardToast(reward.xp, reward.coins);
}

function showRewardToast(xp, coins) {
    if (!rewardToast) return;
    rewardToast.textContent = `🎁 +${xp} XP • +${coins} 🪙`;
    rewardToast.classList.remove('hidden');
    rewardToast.style.animation = 'none';
    void rewardToast.offsetWidth;
    rewardToast.style.animation = 'toast-slide-in 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

    setTimeout(() => rewardToast.classList.add('hidden'), 2500);
}


/**
 * --------------------------------------------------------------------------
 * STEP 6: SINGLE PLAYER GAME ENGINE
 * --------------------------------------------------------------------------
 */

const choices = ['stone', 'paper', 'scissors'];
const moveEmojis = { stone: '✊', paper: '✋', scissors: '✌️' };

let selectedModeRounds = 4;
let targetWins = 3;
let currentRoundNumber = 1;
let userScore = 0;
let computerScore = 0;

let isCountingDown = false;
let isMatchOver = false;
let currentTimerId = null;

function delay(ms) {
    return new Promise((resolve) => {
        currentTimerId = setTimeout(resolve, ms);
    });
}

function getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

function toggleChoiceButtons(isDisabled) {
    choiceButtons.forEach(button => {
        button.disabled = isDisabled;
    });
}

function clearVisualEffects() {
    resultMessageElement.classList.remove(
        'result-win',
        'result-lose',
        'result-draw',
        'result-shake',
        'countdown-text',
        'countdown-pulse',
        'fight-pulse'
    );

    userCard.classList.remove('winner', 'loser');
    computerCard.classList.remove('computer-winner', 'winner', 'loser');
    
    if (vsBadge) {
        vsBadge.classList.remove('vs-active');
    }

    choiceButtons.forEach(btn => {
        btn.classList.remove('selected-choice', 'btn-pressed');
    });

    userMoveDisplay.classList.remove('reveal-pop');
    computerMoveDisplay.classList.remove('reveal-pop');
}

function animateScoreUpdate(scoreElement) {
    scoreElement.classList.remove('score-pop');
    void scoreElement.offsetWidth;
    scoreElement.classList.add('score-pop');
}

function animateMoveReveal(element, emojiText) {
    element.textContent = emojiText;
    element.classList.remove('reveal-pop');
    void element.offsetWidth;
    element.classList.add('reveal-pop');
}

function determineWinner(player, computer) {
    if (player === computer) return 'draw';

    if (
        (player === 'stone' && computer === 'scissors') ||
        (player === 'scissors' && computer === 'paper') ||
        (player === 'paper' && computer === 'stone')
    ) {
        return 'user';
    }

    return 'computer';
}

function calculateServerWinner(c1, c2) {
    if (c1 === c2) return 'draw';
    if (
        (c1 === 'stone' && c2 === 'scissors') ||
        (c1 === 'scissors' && c2 === 'paper') ||
        (c1 === 'paper' && c2 === 'stone')
    ) {
        return 'p1';
    }
    return 'p2';
}

function animateResultText(text, animationClass) {
    resultMessageElement.textContent = text;
    resultMessageElement.classList.remove('countdown-pulse', 'fight-pulse');
    void resultMessageElement.offsetWidth;
    
    if (animationClass) {
        resultMessageElement.classList.add(animationClass);
    }
}

function startNewSinglePlayerMatch(totalRounds) {
    isMultiplayerMode = false;
    selectedModeRounds = parseInt(totalRounds);
    targetWins = selectedModeRounds;
    
    currentRoundNumber = 1;
    userScore = 0;
    computerScore = 0;
    isMatchOver = false;
    isCountingDown = false;

    userCardLabel.textContent = 'YOU';
    computerCardLabel.textContent = 'COMPUTER';
    userScoreLabel.textContent = 'Your Score:';
    computerScoreLabel.textContent = 'Computer Score:';
    arenaSubtitle.textContent = 'Choose your move and defeat the computer!';

    if (openStatsArenaBtn) openStatsArenaBtn.classList.remove('hidden');
    if (openHistoryArenaBtn) openHistoryArenaBtn.classList.remove('hidden');
    if (inGameMenuBtn) inGameMenuBtn.classList.remove('hidden');

    modeDisplayBadge.textContent = `MODE: BEST OF ${selectedModeRounds}`;
    roundDisplayBadge.textContent = `ROUND 1`;

    userScoreElement.textContent = '0';
    computerScoreElement.textContent = '0';
    userMoveDisplay.textContent = '❓';
    computerMoveDisplay.textContent = '❓';
    resultMessageElement.textContent = 'Make your move!';
    clearVisualEffects();
    toggleChoiceButtons(false);

    modeSelectionOverlay.classList.add('hidden');
    matchEndOverlay.classList.add('hidden');
    statsOverlay.classList.add('hidden');
    profileOverlay.classList.add('hidden');
    historyOverlay.classList.add('hidden');
    leaderboardOverlay.classList.add('hidden');
    waitingRoomOverlay.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    document.body.classList.add('in-game');
}

async function evaluateMatchProgress() {
    const isTargetReached = userScore >= targetWins || computerScore >= targetWins;

    if (isTargetReached) {
        isMatchOver = true;
        toggleChoiceButtons(true);

        await recordSinglePlayerMatchStats();
        await delay(1200);
        showMatchEndScreen();
    } else {
        currentRoundNumber++;
        roundDisplayBadge.textContent = `ROUND ${currentRoundNumber}`;
    }
}

async function recordSinglePlayerMatchStats() {
    let matchOutcome = 'DRAW';

    if (userScore > computerScore) {
        matchOutcome = 'WIN';
        gameStats.matchesWon++;
        gameStats.currentStreak++;
        if (gameStats.currentStreak > gameStats.bestStreak) gameStats.bestStreak = gameStats.currentStreak;
    } else if (computerScore > userScore) {
        matchOutcome = 'LOSE';
        gameStats.matchesLost++;
        gameStats.currentStreak = 0;
    } else {
        matchOutcome = 'DRAW';
        gameStats.matchesDrawn++;
        gameStats.currentStreak = 0;
    }
    gameStats.totalMatches++;
    gameStats.totalRoundsPlayed += (userScore + computerScore);

    const reward = PROGRESSION_CONFIG.REWARDS[matchOutcome];

    const matchRecord = {
        id: 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        userId: currentUser ? currentUser.uid : 'guest',
        username: (currentUser && userProfileData && userProfileData.username) ? userProfileData.username : (currentUser ? currentUser.email.split('@')[0] : 'Guest Player'),
        opponentName: 'Computer',
        matchType: 'VS Computer',
        mode: `Best of ${selectedModeRounds}`,
        userScore: userScore,
        computerScore: computerScore,
        outcome: matchOutcome,
        rounds: userScore + computerScore,
        xpEarned: reward ? reward.xp : 0,
        coinsEarned: reward ? reward.coins : 0,
        betAmount: 0,
        timestamp: Date.now()
    };

    saveMatchToLocalHistory(matchRecord);
    saveLocalStorageData();
    renderStatsUI();
    awardMatchRewards(matchOutcome);

    if (currentUser) {
        await updateFirestoreUserDoc();
        await saveMatchToFirestore(matchRecord);
    }
}

function showMatchEndScreen() {
    if (userScore > computerScore) {
        matchTrophy.textContent = '🏆';
        matchResultTitle.textContent = 'YOU WON THE MATCH!';
    } else if (computerScore > userScore) {
        matchTrophy.textContent = '🤖';
        matchResultTitle.textContent = 'COMPUTER WINS THE MATCH!';
    } else {
        matchTrophy.textContent = '🤝';
        matchResultTitle.textContent = 'MATCH TIED!';
    }

    matchScoreSummary.textContent = `Final Score: YOU ${userScore} - ${computerScore} COMPUTER in ${currentRoundNumber} Rounds`;
    matchEndOverlay.classList.remove('hidden');
}

function showModeMenu() {
    if (currentTimerId) {
        clearTimeout(currentTimerId);
        currentTimerId = null;
    }

    if (isMultiplayerMode && currentRoomCode) {
        socket.emit('leaveRoom', { roomCode: currentRoomCode });
        currentRoomCode = null;
    }

    isCountingDown = false;
    isMatchOver = false;

    matchEndOverlay.classList.add('hidden');
    statsOverlay.classList.add('hidden');
    profileOverlay.classList.add('hidden');
    historyOverlay.classList.add('hidden');
    leaderboardOverlay.classList.add('hidden');
    authOverlay.classList.add('hidden');
    waitingRoomOverlay.classList.add('hidden');
    createRoomOverlay.classList.add('hidden');
    joinRoomOverlay.classList.add('hidden');
    gameContainer.classList.add('hidden');
    document.body.classList.remove('in-game');
    modeSelectionOverlay.classList.remove('hidden');
}

async function playRoundSinglePlayer(userChoice, selectedButton) {
    if (isCountingDown || isMatchOver) return;

    isCountingDown = true;
    toggleChoiceButtons(true);

    clearVisualEffects();
    if (selectedButton) selectedButton.classList.add('selected-choice');
    if (vsBadge) vsBadge.classList.add('vs-active');

    animateMoveReveal(userMoveDisplay, moveEmojis[userChoice]);
    computerMoveDisplay.textContent = '❓';

    resultMessageElement.classList.add('countdown-text');
    animateResultText('GET READY!', 'countdown-pulse');
    await delay(700);
    if (!isCountingDown) return;

    const countdownNumbers = ['3', '2', '1'];
    for (let num of countdownNumbers) {
        animateResultText(num, 'countdown-pulse');
        await delay(750);
        if (!isCountingDown) return;
    }

    animateResultText('FIGHT!', 'fight-pulse');
    await delay(600);
    if (!isCountingDown) return;

    if (vsBadge) vsBadge.classList.remove('vs-active');

    const computerChoice = getComputerChoice();
    animateMoveReveal(computerMoveDisplay, moveEmojis[computerChoice]);

    const result = determineWinner(userChoice, computerChoice);
    resultMessageElement.classList.remove('countdown-text', 'fight-pulse');
    
    void resultMessageElement.offsetWidth;
    resultMessageElement.classList.add('result-shake');

    gameStats.totalRoundsPlayed++;
    saveLocalStorageData();

    if (result === 'user') {
        userScore++;
        userScoreElement.textContent = userScore;
        animateScoreUpdate(userScoreElement);

        resultMessageElement.textContent = 'YOU WIN!';
        resultMessageElement.classList.add('result-win');
        userCard.classList.add('winner');
        computerCard.classList.add('loser');

    } else if (result === 'computer') {
        computerScore++;
        computerScoreElement.textContent = computerScore;
        animateScoreUpdate(computerScoreElement);

        resultMessageElement.textContent = 'COMPUTER WINS!';
        resultMessageElement.classList.add('result-lose');
        computerCard.classList.add('computer-winner');
        userCard.classList.add('loser');

    } else {
        resultMessageElement.textContent = 'DRAW!';
        resultMessageElement.classList.add('result-draw');
    }

    isCountingDown = false;
    await evaluateMatchProgress();

    if (!isMatchOver) {
        toggleChoiceButtons(false);
    }
}


/**
 * --------------------------------------------------------------------------
 * STEP 7: EVENT LISTENERS & USER CONTROLS
 * --------------------------------------------------------------------------
 */

// Mode Switch Tabs (VS Computer vs 2-Player Online)
tabSpBtn.addEventListener('click', () => {
    tabSpBtn.classList.add('active');
    tabMpBtn.classList.remove('active');
    spModeContainer.classList.remove('hidden');
    mpModeContainer.classList.add('hidden');
});

tabMpBtn.addEventListener('click', () => {
    tabMpBtn.classList.add('active');
    tabSpBtn.classList.remove('active');
    mpModeContainer.classList.remove('hidden');
    spModeContainer.classList.add('hidden');
    loadSocialData();
});

// Single Player Mode Selection Buttons
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const rounds = button.getAttribute('data-rounds');
        startNewSinglePlayerMatch(rounds);
    });
});

function checkIsPlayerA() {
    if (!currentUser) return false;
    if (!currentRoomData) return true;

    // Check RTDB structure (playerA)
    if (currentRoomData.playerA && currentRoomData.playerA.uid) {
        return currentRoomData.playerA.uid === currentUser.uid;
    }

    // Check Socket.IO structure (players array)
    if (currentRoomData.players && currentRoomData.players.length > 0) {
        const p1 = currentRoomData.players[0];
        if (p1 && p1.uid) {
            return p1.uid === currentUser.uid;
        }
    }

    return true;
}

// Choice Buttons Event Listeners (Single Player or Multiplayer)
choiceButtons.forEach(button => {
    button.addEventListener('click', () => {
        button.classList.add('btn-pressed');
        setTimeout(() => button.classList.remove('btn-pressed'), 150);

        const userChoice = button.getAttribute('data-choice');

        if (isMultiplayerMode && (currentRoomCode || currentMatchId)) {
            const uid = currentUser ? currentUser.uid : socket.id;

            // Show local choice immediately on local player move card (Requirement 1)
            userMoveDisplay.textContent = moveEmojis[userChoice] || '❓';

            // Disable choice buttons immediately (Requirement 3)
            toggleChoiceButtons(true);

            // Display status message: "You selected Rock • Waiting for opponent..."
            const choiceName = userChoice.charAt(0).toUpperCase() + userChoice.slice(1);
            resultMessageElement.textContent = `You selected ${choiceName} • Waiting for opponent...`;

            // Emit playerChoice to server with roomCode, matchId, uid, choice
            socket.emit('playerChoice', {
                roomCode: currentRoomCode || currentMatchId,
                matchId: currentMatchId || currentRoomCode,
                uid: uid,
                choice: userChoice
            });

            // Also sync choice to RTDB for redundancy
            if (currentMatchId) {
                const isPlayerA = checkIsPlayerA();
                const choicePath = isPlayerA ? `matches/${currentMatchId}/playerA/choice` : `matches/${currentMatchId}/playerB/choice`;
                console.log(`📤 Writing RTDB choice: ${userChoice} to ${choicePath} (isPlayerA: ${isPlayerA})`);
                rtdbSet(rtdbRef(rtdb, choicePath), userChoice).catch(() => {});
            }
        } else {
            // Single Player match choice
            playRoundSinglePlayer(userChoice, button);
        }
    });
});

// Multiplayer Room Controls
if (btnOpenCreateRoom) {
    btnOpenCreateRoom.addEventListener('click', () => {
        createRoomOverlay.classList.remove('hidden');
    });
}

if (closeCreateRoomBtn) {
    closeCreateRoomBtn.addEventListener('click', () => {
        createRoomOverlay.classList.add('hidden');
    });
}

// Note: confirmCreateRoomBtn event handler is bound atomically in Step 8 with bet locking support

if (btnOpenJoinRoom) {
    btnOpenJoinRoom.addEventListener('click', () => {
        joinRoomOverlay.classList.remove('hidden');
    });
}

closeJoinRoomBtn.addEventListener('click', () => {
    joinRoomOverlay.classList.add('hidden');
});

confirmJoinRoomBtn.addEventListener('click', () => {
    const code = joinCodeInput.value.trim();
    if (!code) {
        alert('Please enter a valid room code!');
        return;
    }

    const username = (userProfileData && userProfileData.username) ? userProfileData.username : (currentUser ? currentUser.email.split('@')[0] : 'Player 2');
    const uid = currentUser ? currentUser.uid : socket.id;

    socket.emit('joinRoom', {
        roomCode: code,
        uid: uid,
        username: username,
        avatar: '⚡'
    });
});

// Waiting Room Controls
playerReadyBtn.addEventListener('click', async () => {
    playerReadyBtn.disabled = true;
    try {
        if (currentMatchId && currentRoomData) {
            const isPlayerA = checkIsPlayerA();

            if (isPlayerA) {
                const p1 = currentRoomData.playerA || (currentRoomData.players ? currentRoomData.players[0] : null);
                const newReady = !(p1 && p1.ready);
                await rtdbSet(rtdbRef(rtdb, `matches/${currentMatchId}/playerA/ready`), newReady).catch(() => {});
            } else {
                const p2 = currentRoomData.playerB || (currentRoomData.players ? currentRoomData.players[1] : null);
                const newReady = !(p2 && p2.ready);
                await rtdbSet(rtdbRef(rtdb, `matches/${currentMatchId}/playerB/ready`), newReady).catch(() => {});
            }
        }
        if (currentRoomCode) {
            socket.emit('playerReady', { roomCode: currentRoomCode });
        }
    } catch (e) {
        console.error('Error toggling ready state:', e);
    } finally {
        setTimeout(() => { playerReadyBtn.disabled = false; }, 300);
    }
});

leaveRoomBtn.addEventListener('click', () => {
    if (currentMatchId) {
        if (rtdbMatchUnsub) {
            rtdbMatchUnsub();
            rtdbMatchUnsub = null;
        }
        rtdbSet(rtdbRef(rtdb, `matches/${currentMatchId}/status`), 'cancelled').catch(() => {});
        currentMatchId = null;
    }
    if (currentRoomCode) {
        socket.emit('leaveRoom', { roomCode: currentRoomCode });
        currentRoomCode = null;
    }
    waitingRoomOverlay.classList.add('hidden');
    modeSelectionOverlay.classList.remove('hidden');
});

if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
        if (currentRoomCode) {
            navigator.clipboard.writeText(currentRoomCode);
            copyCodeBtn.textContent = '✅ Copied!';
            setTimeout(() => copyCodeBtn.textContent = '📋 Copy Code', 2000);
        }
    });
}

// Auth Handlers
headerAuthBtn.addEventListener('click', () => {
    if (currentUser) {
        if (confirm('Are you sure you want to log out?')) signOut(auth);
    } else {
        authOverlay.classList.remove('hidden');
    }
});

tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authFeedback.classList.add('hidden');
});

tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authFeedback.classList.add('hidden');
});

if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', () => {
        if (currentUser) {
            authOverlay.classList.add('hidden');
        }
    });
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    authFeedback.classList.remove('hidden', 'error', 'success');
    authFeedback.textContent = 'Creating account...';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createInitialUserDoc(userCredential.user.uid, username, email);

        authFeedback.textContent = 'Account created successfully!';
        authFeedback.classList.add('success');
        setTimeout(() => authOverlay.classList.add('hidden'), 1000);
    } catch (error) {
        authFeedback.textContent = error.message.replace('Firebase:', '');
        authFeedback.classList.add('error');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    authFeedback.classList.remove('hidden', 'error', 'success');
    authFeedback.textContent = 'Signing in...';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        authFeedback.textContent = 'Signed in successfully!';
        authFeedback.classList.add('success');
        setTimeout(() => authOverlay.classList.add('hidden'), 1000);
    } catch (error) {
        authFeedback.textContent = error.message.replace('Firebase:', '');
        authFeedback.classList.add('error');
    }
});

// Navigation & Modals Handlers
[openHistoryMenuBtn, openHistoryEndBtn, openHistoryArenaBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => {
            loadMatchHistory();
            historyOverlay.classList.remove('hidden');
        });
    }
});
closeHistoryBtn.addEventListener('click', () => historyOverlay.classList.add('hidden'));

openLeaderboardMenuBtn.addEventListener('click', () => {
    loadLeaderboard('wins');
    leaderboardOverlay.classList.remove('hidden');
});
closeLeaderboardBtn.addEventListener('click', () => leaderboardOverlay.classList.add('hidden'));

lbTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        lbTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadLeaderboard(tab.getAttribute('data-sort'));
    });
});

resetButton.addEventListener('click', () => {
    if (isMultiplayerMode) {
        if (currentRoomCode) socket.emit('rematch', { roomCode: currentRoomCode });
    } else {
        startNewSinglePlayerMatch(selectedModeRounds);
    }
});

playAgainBtn.addEventListener('click', () => {
    if (isMultiplayerMode) {
        if (currentRoomCode) socket.emit('rematch', { roomCode: currentRoomCode });
    } else {
        startNewSinglePlayerMatch(selectedModeRounds);
    }
});

if (backToMenuBtn) backToMenuBtn.addEventListener('click', showModeMenu);
if (inGameMenuBtn) inGameMenuBtn.addEventListener('click', showModeMenu);

[openProfileBtn, openProfileMenuBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => {
            renderProgressionUI();
            renderStatsUI();
            loadMatchHistory();
            profileOverlay.classList.remove('hidden');
        });
    }
});
closeProfileBtn.addEventListener('click', () => profileOverlay.classList.add('hidden'));

// Profile Inner Tabs (Stats & History)
const profileTabStats = document.getElementById('profile-tab-stats');
const profileTabHistory = document.getElementById('profile-tab-history');
const profileStatsSection = document.getElementById('profile-stats-section');
const profileHistorySection = document.getElementById('profile-history-section');

if (profileTabStats && profileTabHistory) {
    profileTabStats.addEventListener('click', () => {
        profileTabStats.classList.add('active');
        profileTabHistory.classList.remove('active');
        const profileStatDetailsSection = document.getElementById('profile-stat-details-section');
        if (profileStatDetailsSection) profileStatDetailsSection.classList.add('hidden');
        if (profileStatsSection) profileStatsSection.classList.remove('hidden');
        if (profileHistorySection) profileHistorySection.classList.add('hidden');
    });

    profileTabHistory.addEventListener('click', () => {
        profileTabHistory.classList.add('active');
        profileTabStats.classList.remove('active');
        const profileStatDetailsSection = document.getElementById('profile-stat-details-section');
        if (profileStatDetailsSection) profileStatDetailsSection.classList.add('hidden');
        if (profileHistorySection) profileHistorySection.classList.remove('hidden');
        if (profileStatsSection) profileStatsSection.classList.add('hidden');
        loadMatchHistory();
    });
}

// --------------------------------------------------------------------------
// PROFILE STATS CARDS INTERACTIVITY & SINGLE SOURCE OF TRUTH DETAILS PANEL
// --------------------------------------------------------------------------

const MATCH_HISTORY_STORAGE_KEY = 'stone_paper_scissors_match_history_v1';

function getLocalMatchHistory() {
    const raw = localStorage.getItem(MATCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function saveMatchToLocalHistory(matchRecord) {
    const history = getLocalMatchHistory();
    const exists = history.some(m => m.id === matchRecord.id);
    if (!exists) {
        history.unshift(matchRecord);
        if (history.length > 100) history.pop();
        localStorage.setItem(MATCH_HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeMatchDoc(docData, user, docId = null) {
    const currentUid = user ? user.uid : null;
    const currentUsername = (userProfileData && userProfileData.username) ? userProfileData.username : (user ? user.email.split('@')[0] : '');

    let userScore = 0;
    let oppScore = 0;
    let opponentName = 'Computer';
    let mode = docData.mode || 'Best of 3';
    let matchType = docData.matchType || 'VS Computer';
    let xpEarned = docData.xpEarned || 0;
    let coinsEarned = docData.coinsEarned || 0;
    let betAmount = docData.betAmount || 0;

    const isP2 = (docData.p2Uid && docData.p2Uid === currentUid) || (docData.player2Id && docData.player2Id === currentUid) || (docData.player2 && docData.player2 === currentUsername);
    const isP1 = (docData.p1Uid && docData.p1Uid === currentUid) || (docData.player1Id && docData.player1Id === currentUid) || (docData.player1 && docData.player1 === currentUsername);

    if (isP2) {
        userScore = docData.p2Score !== undefined ? docData.p2Score : (docData.player2Score !== undefined ? docData.player2Score : (docData.computerScore || 0));
        oppScore = docData.p1Score !== undefined ? docData.p1Score : (docData.player1Score !== undefined ? docData.player1Score : (docData.userScore || 0));
        opponentName = docData.p1Name || docData.player1Name || docData.player1 || docData.opponentName || 'Online Player';
        matchType = betAmount > 0 ? 'Bet Match' : 'Online Match';
    } else if (isP1) {
        userScore = docData.p1Score !== undefined ? docData.p1Score : (docData.player1Score !== undefined ? docData.player1Score : (docData.userScore || 0));
        oppScore = docData.p2Score !== undefined ? docData.p2Score : (docData.player2Score !== undefined ? docData.player2Score : (docData.computerScore || 0));
        opponentName = docData.p2Name || docData.player2Name || docData.player2 || docData.opponentName || 'Online Player';
        matchType = betAmount > 0 ? 'Bet Match' : 'Online Match';
    } else {
        userScore = docData.userScore !== undefined ? docData.userScore : 0;
        oppScore = docData.computerScore !== undefined ? docData.computerScore : (docData.oppScore || 0);
        opponentName = docData.opponentName || docData.opponent || 'Computer';
        if (opponentName === 'AI Bot') opponentName = 'Computer';
        if (docData.matchType) matchType = docData.matchType;
    }

    let outcome = 'DRAW';
    if (userScore > oppScore) {
        outcome = 'WIN';
    } else if (userScore < oppScore) {
        outcome = 'LOSE';
    } else {
        outcome = 'DRAW';
    }

    const rounds = docData.rounds || (userScore + oppScore);

    let timestampVal = docData.timestamp ? (typeof docData.timestamp === 'number' ? docData.timestamp : (docData.timestamp.toMillis ? docData.timestamp.toMillis() : Date.now())) : Date.now();
    let dateStr = 'Recently';
    try {
        const dateObj = new Date(timestampVal);
        dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        dateStr = 'Recently';
    }

    return {
        id: docId || docData.id || `m_${timestampVal}_${userScore}_${oppScore}`,
        mode,
        matchType,
        userScore,
        oppScore,
        opponentName,
        outcome,
        rounds,
        xpEarned,
        coinsEarned,
        betAmount,
        dateStr,
        timestampVal
    };
}

async function getAllCompletedMatches() {
    const localHistory = getLocalMatchHistory();
    let firestoreMatches = [];

    if (currentUser) {
        try {
            const q = query(
                collection(db, 'matches'),
                where('userId', '==', currentUser.uid),
                limit(100)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(docSnap => {
                firestoreMatches.push(normalizeMatchDoc(docSnap.data(), currentUser, docSnap.id));
            });
        } catch (e) {
            console.error('Error fetching Firestore matches:', e);
        }
    }

    const normalizedLocal = localHistory.map(m => normalizeMatchDoc(m, currentUser));

    const combinedMap = new Map();
    [...normalizedLocal, ...firestoreMatches].forEach(m => {
        const key = m.id || `${m.timestampVal}_${m.mode}_${m.userScore}_${m.oppScore}_${m.opponentName}`;
        if (!combinedMap.has(key)) {
            combinedMap.set(key, m);
        }
    });

    const allMatches = Array.from(combinedMap.values());
    allMatches.sort((a, b) => b.timestampVal - a.timestampVal);

    syncStatsWithHistory(allMatches);

    return allMatches;
}

function syncStatsWithHistory(allMatches) {
    if (!allMatches || allMatches.length === 0) return;

    gameStats.totalMatches = allMatches.length;

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalRounds = 0;

    allMatches.forEach(m => {
        if (m.outcome === 'WIN') wins++;
        else if (m.outcome === 'LOSE') losses++;
        else draws++;

        totalRounds += (m.rounds || (m.userScore + m.oppScore));
    });

    gameStats.matchesWon = wins;
    gameStats.matchesLost = losses;
    gameStats.matchesDrawn = draws;
    gameStats.totalRoundsPlayed = totalRounds;

    let currentStreak = 0;
    if (allMatches.length > 0) {
        const firstOutcome = allMatches[0].outcome;
        if (firstOutcome !== 'DRAW') {
            for (let i = 0; i < allMatches.length; i++) {
                if (allMatches[i].outcome === firstOutcome) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }
    gameStats.currentStreak = currentStreak;

    let bestStreak = 0;
    let tempStreak = 0;
    const chronological = allMatches.slice().reverse();
    chronological.forEach(m => {
        if (m.outcome === 'WIN') {
            tempStreak++;
            if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    });
    gameStats.bestStreak = bestStreak;

    saveLocalStorageData();
    renderStatsUI();
}

function renderMatchItem(match, index, formatType) {
    let resultBadgeHtml = '';
    let cardClass = '';

    if (match.outcome === 'WIN') {
        resultBadgeHtml = `<span class="detail-outcome-badge badge-win">🏆 WIN</span>`;
        cardClass = 'win-card';
    } else if (match.outcome === 'LOSE') {
        resultBadgeHtml = `<span class="detail-outcome-badge badge-loss">💀 LOSS</span>`;
        cardClass = 'loss-card';
    } else {
        resultBadgeHtml = `<span class="detail-outcome-badge badge-draw">🤝 DRAW</span>`;
        cardClass = 'draw-card';
    }

    let matchTypeTag = '🤖 VS Computer';
    if (match.matchType === 'Bet Match' || match.betAmount > 0) {
        matchTypeTag = '⚔️ Bet Match';
    } else if (match.matchType === 'Online Match' || (match.opponentName && match.opponentName !== 'Computer')) {
        matchTypeTag = '🌐 Online Match';
    }

    let betInfoHtml = '';
    if (match.betAmount > 0) {
        const coinsNet = match.outcome === 'WIN' ? `+${match.betAmount * 2} 🪙` : `-${match.betAmount} 🪙`;
        betInfoHtml = `
            <div style="font-size: 0.78rem; color: var(--accent-gold); font-weight: 700; margin-top: 0.2rem;">
                Bet: 🪙 ${match.betAmount} • ${match.outcome === 'WIN' ? 'Coins Won' : 'Coins Lost'}: ${coinsNet}
            </div>
        `;
    }

    return `
        <div class="detail-match-card ${cardClass}">
            <div class="detail-card-header">
                <div>
                    <span style="font-size: 0.8rem; font-weight: 800; color: var(--accent-cyan); margin-right: 0.4rem;">${matchTypeTag}</span>
                    ${resultBadgeHtml}
                </div>
                <span class="detail-match-mode">${escapeHtml(match.mode)}</span>
            </div>
            
            <div class="detail-match-row" style="margin-top: 0.4rem;">
                <div>
                    <div class="detail-opponent-label">YOU vs ${escapeHtml(match.opponentName)}</div>
                    <div class="detail-opponent-name">Opponent: ${escapeHtml(match.opponentName)}</div>
                </div>
                <div class="detail-score-box">${match.userScore} - ${match.oppScore}</div>
            </div>

            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
                Rounds Played: <strong>${match.rounds}</strong>
            </div>

            ${betInfoHtml}

            <div class="detail-card-footer">
                <div class="detail-rewards">
                    ${match.xpEarned ? `<span class="reward-xp">+${match.xpEarned} XP</span>` : ''}
                    ${match.coinsEarned && !match.betAmount ? `<span class="reward-coins">+${match.coinsEarned} 🪙</span>` : ''}
                </div>
                <div class="detail-date">${match.dateStr}</div>
            </div>
        </div>
    `;
}

async function openProfileStatDetails(category) {
    const profileStatsSection = document.getElementById('profile-stats-section');
    const profileStatDetailsSection = document.getElementById('profile-stat-details-section');
    const profileHistorySection = document.getElementById('profile-history-section');
    const statDetailsTitle = document.getElementById('stat-details-title');
    const statDetailsContent = document.getElementById('profile-stat-details-content');

    if (!profileStatDetailsSection || !statDetailsContent) return;

    if (profileStatsSection) profileStatsSection.classList.add('hidden');
    if (profileHistorySection) profileHistorySection.classList.add('hidden');
    profileStatDetailsSection.classList.remove('hidden');

    statDetailsContent.innerHTML = '<div class="empty-state">Loading match details...</div>';

    const matches = await getAllCompletedMatches();

    if (category === 'TOTAL') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '🎮 Total Matches';
        if (matches.length === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No completed matches yet.</div>';
        } else {
            statDetailsContent.innerHTML = matches.map((m, idx) => renderMatchItem(m, idx, 'TOTAL')).join('');
        }
    } else if (category === 'WINS') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '🏆 Wins';
        const winsList = matches.filter(m => m.outcome === 'WIN');
        if (winsList.length === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No wins yet.</div>';
        } else {
            statDetailsContent.innerHTML = winsList.map((m, idx) => renderMatchItem(m, idx, 'WINS')).join('');
        }
    } else if (category === 'LOSSES') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '💀 Losses';
        const lossesList = matches.filter(m => m.outcome === 'LOSE');
        if (lossesList.length === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No losses yet.</div>';
        } else {
            statDetailsContent.innerHTML = lossesList.map((m, idx) => renderMatchItem(m, idx, 'LOSSES')).join('');
        }
    } else if (category === 'DRAWS') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '🤝 Draws';
        const drawsList = matches.filter(m => m.outcome === 'DRAW');
        if (drawsList.length === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No draws yet.</div>';
        } else {
            statDetailsContent.innerHTML = drawsList.map((m, idx) => renderMatchItem(m, idx, 'DRAWS')).join('');
        }
    } else if (category === 'ROUNDS') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '⏱️ Total Rounds';
        if (matches.length === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No completed rounds yet.</div>';
        } else {
            let totalRoundsSum = 0;
            matches.forEach(m => { totalRoundsSum += (m.rounds || (m.userScore + m.oppScore)); });

            let html = `
                <div class="rounds-summary-card">
                    <div style="font-size: 1.1rem; font-weight: 900; color: var(--accent-cyan);">
                        Total Rounds = ${totalRoundsSum}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                        Sum of all completed-match rounds: ${matches.map(m => m.rounds || (m.userScore + m.oppScore)).join(' + ')} = ${totalRoundsSum}
                    </div>
                </div>
            `;
            html += matches.map(m => `
                <div class="detail-match-card" style="padding: 0.75rem 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 800; color: #ffffff;">YOU vs ${escapeHtml(m.opponentName)}</span>
                        <span style="font-size: 0.8rem; font-weight: 800; color: var(--accent-cyan);">${m.rounds} rounds</span>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
                        ${escapeHtml(m.mode)} • ${m.dateStr}
                    </div>
                </div>
            `).join('');

            statDetailsContent.innerHTML = html;
        }
    } else if (category === 'WIN_RATE') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '📈 Win Rate';
        const totalCount = matches.length;
        const winsCount = matches.filter(m => m.outcome === 'WIN').length;
        const lossesCount = matches.filter(m => m.outcome === 'LOSE').length;
        const drawsCount = matches.filter(m => m.outcome === 'DRAW').length;

        if (totalCount === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No completed matches yet.</div>';
        } else {
            const rateVal = ((winsCount / totalCount) * 100).toFixed(1);
            let html = `
                <div class="rounds-summary-card">
                    <div style="font-size: 1rem; font-weight: 800; color: var(--accent-cyan); margin-bottom: 0.4rem;">
                        📈 Win Rate Summary
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.85rem; color: #ffffff;">
                        <div>Wins: <strong>${winsCount}</strong></div>
                        <div>Losses: <strong>${lossesCount}</strong></div>
                        <div>Draws: <strong>${drawsCount}</strong></div>
                        <div>Total Matches: <strong>${totalCount}</strong></div>
                    </div>
                    <div style="border-top: 1px dashed rgba(255,255,255,0.1); margin-top: 0.5rem; padding-top: 0.5rem; font-weight: 900; color: var(--accent-gold); font-size: 0.95rem;">
                        Calculation: (${winsCount} / ${totalCount}) × 100 = ${rateVal}%
                    </div>
                </div>
                <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-muted); margin: 0.4rem 0;">Actual Winning Matches:</div>
            `;
            const winningMatches = matches.filter(m => m.outcome === 'WIN');
            if (winningMatches.length === 0) {
                html += '<div class="empty-state">No wins yet.</div>';
            } else {
                html += winningMatches.map((m, idx) => renderMatchItem(m, idx, 'WINS')).join('');
            }
            statDetailsContent.innerHTML = html;
        }
    } else if (category === 'CURRENT_STREAK') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '🔥 Current Streak';
        if (matches.length === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No active streak.</div>';
        } else {
            const firstOutcome = matches[0].outcome;
            let streakCount = 0;
            if (firstOutcome !== 'DRAW') {
                for (let i = 0; i < matches.length; i++) {
                    if (matches[i].outcome === firstOutcome) streakCount++;
                    else break;
                }
            }

            if (streakCount === 0 || firstOutcome === 'DRAW') {
                statDetailsContent.innerHTML = '<div class="empty-state">No active streak.</div>';
            } else {
                const streakLabel = firstOutcome === 'WIN' ? `${streakCount} Win Streak` : `${streakCount} Loss Streak`;
                const streakMatches = matches.slice(0, streakCount);

                let html = `
                    <div class="rounds-summary-card">
                        <div style="font-size: 1rem; font-weight: 900; color: var(--accent-gold);">
                            Current Streak: ${streakLabel}
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">
                            Latest ${streakCount} consecutive results in chronological order:
                        </div>
                    </div>
                `;
                html += streakMatches.map((m, idx) => renderMatchItem(m, idx, 'STREAK')).join('');
                statDetailsContent.innerHTML = html;
            }
        }
    } else if (category === 'BEST_STREAK') {
        if (statDetailsTitle) statDetailsTitle.innerHTML = '👑 Best Streak';
        if (matches.length === 0) {
            statDetailsContent.innerHTML = '<div class="empty-state">No winning streak recorded yet.</div>';
        } else {
            let maxWinRun = [];
            let currentWinRun = [];
            const chronological = matches.slice().reverse();

            chronological.forEach(m => {
                if (m.outcome === 'WIN') {
                    currentWinRun.push(m);
                    if (currentWinRun.length > maxWinRun.length) {
                        maxWinRun = [...currentWinRun];
                    }
                } else {
                    currentWinRun = [];
                }
            });

            if (maxWinRun.length === 0) {
                statDetailsContent.innerHTML = '<div class="empty-state">No winning streak recorded yet.</div>';
            } else {
                let html = `
                    <div class="rounds-summary-card">
                        <div style="font-size: 1rem; font-weight: 900; color: var(--accent-gold);">
                            Best Streak: ${maxWinRun.length} Wins
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">
                            Longest consecutive winning streak in match history:
                        </div>
                    </div>
                `;
                html += maxWinRun.map((m, idx) => renderMatchItem(m, idx, 'BEST_STREAK')).join('');
                statDetailsContent.innerHTML = html;
            }
        }
    }
}

// Bind Back Button
const backToStatsBtn = document.getElementById('back-to-stats-btn');
if (backToStatsBtn) {
    backToStatsBtn.addEventListener('click', () => {
        const profileStatsSection = document.getElementById('profile-stats-section');
        const profileStatDetailsSection = document.getElementById('profile-stat-details-section');
        if (profileStatDetailsSection) profileStatDetailsSection.classList.add('hidden');
        if (profileStatsSection) profileStatsSection.classList.remove('hidden');
    });
}

// Bind Clickable Stat Cards for all 8 cards
const statCardTotalMatches = document.getElementById('stat-card-total-matches');
const statCardWins = document.getElementById('stat-card-wins');
const statCardLosses = document.getElementById('stat-card-losses');
const statCardDraws = document.getElementById('stat-card-draws');
const statCardWinRate = document.getElementById('stat-card-win-rate');
const statCardCurrentStreak = document.getElementById('stat-card-current-streak');
const statCardBestStreak = document.getElementById('stat-card-best-streak');
const statCardRounds = document.getElementById('stat-card-rounds');

const statCardMap = [
    { el: statCardTotalMatches, category: 'TOTAL' },
    { el: statCardWins, category: 'WINS' },
    { el: statCardLosses, category: 'LOSSES' },
    { el: statCardDraws, category: 'DRAWS' },
    { el: statCardWinRate, category: 'WIN_RATE' },
    { el: statCardCurrentStreak, category: 'CURRENT_STREAK' },
    { el: statCardBestStreak, category: 'BEST_STREAK' },
    { el: statCardRounds, category: 'ROUNDS' }
];

statCardMap.forEach(({ el, category }) => {
    if (el) {
        el.addEventListener('click', () => openProfileStatDetails(category));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProfileStatDetails(category);
            }
        });
    }
});

[openStatsMenuBtn, openStatsEndBtn, openStatsArenaBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => {
            renderStatsUI();
            statsOverlay.classList.remove('hidden');
        });
    }
});
if (closeStatsBtn) closeStatsBtn.addEventListener('click', () => statsOverlay.classList.add('hidden'));

if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all local statistics?')) {
            gameStats = { totalMatches: 0, matchesWon: 0, matchesLost: 0, matchesDrawn: 0, totalRoundsPlayed: 0, currentStreak: 0, bestStreak: 0 };
            saveLocalStorageData();
            renderStatsUI();
            if (currentUser) updateFirestoreUserDoc();
        }
    });
}

renderProgressionUI();
renderStatsUI();

console.log('⚡ Socket.IO Multiplayer Engine Ready!');


/**
 * --------------------------------------------------------------------------
 * STEP 8: VIRTUAL COIN & FRIEND BETTING CHALLENGE SYSTEM
 * --------------------------------------------------------------------------
 * 
 * Welcome Bonus: +100 coins ONCE per account (Firestore transaction)
 * Daily Reward: +10 coins ONCE per calendar day (Firestore transaction)
 * Bet Locking: Reserve coins before match start
 * Atomic Settlement: WIN/LOSE/DRAW via runTransaction
 * Transaction History: Immutable audit log per coin movement
 * --------------------------------------------------------------------------
 */

// ========================================================================
// 8a. COIN TRANSACTION HISTORY LOGGER
// ========================================================================
async function recordCoinTransaction(userId, type, amount, balanceAfter, relatedChallengeId) {
    try {
        const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        await addDoc(collection(db, 'transactions'), {
            transactionId: txId,
            userId: userId,
            type: type,
            amount: amount,
            balanceAfter: balanceAfter,
            relatedChallengeId: relatedChallengeId || null,
            createdAt: serverTimestamp()
        });
        console.log(`💰 Transaction recorded: ${type} ${amount > 0 ? '+' : ''}${amount} (Balance: ${balanceAfter})`);
    } catch (e) {
        console.error('Error recording coin transaction:', e);
    }
}

// ========================================================================
// 8b. WELCOME BONUS (+100 coins, ONCE per account)
// ========================================================================
async function processWelcomeBonus(uid) {
    if (!uid) return;
    try {
        const userDocRef = doc(db, 'users', uid);
        const result = await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userDocRef);
            if (!userSnap.exists()) return { awarded: false };

            const userData = userSnap.data();
            if (userData.welcomeBonusClaimed === true) {
                return { awarded: false };
            }

            const currentCoins = userData.coins || 0;
            const newBalance = currentCoins + 100;

            transaction.update(userDocRef, {
                coins: newBalance,
                welcomeBonusClaimed: true
            });

            return { awarded: true, newBalance };
        });

        if (result.awarded) {
            userProgression.coins = result.newBalance;
            renderProgressionUI();
            await recordCoinTransaction(uid, 'WELCOME_BONUS', 100, result.newBalance, null);
            showRewardToast(0, 100);
            console.log('🎁 Welcome Bonus: +100 coins awarded!');
        }
    } catch (e) {
        console.error('Error processing welcome bonus:', e);
    }
}

// ========================================================================
// 8c. DAILY LOGIN REWARD (+10 coins, ONCE per calendar day)
// ========================================================================
function getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function checkAndShowDailyReward(uid) {
    if (!uid) return;

    const dailyRewardOverlay = document.getElementById('daily-reward-overlay');
    const claimBtn = document.getElementById('claim-daily-reward-btn');
    const closeBtn = document.getElementById('close-daily-reward-btn');
    const statusMsg = document.getElementById('daily-reward-status-msg');

    if (!dailyRewardOverlay) return;

    try {
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) return;

        const userData = docSnap.data();
        const todayStr = getTodayDateString();
        const lastRewardDate = userData.lastDailyRewardDate || '';

        if (lastRewardDate === todayStr) {
            // Already claimed today - don't show modal
            return;
        }

        // Show daily reward modal with claim button
        if (claimBtn) claimBtn.classList.remove('hidden');
        if (closeBtn) closeBtn.classList.add('hidden');
        if (statusMsg) statusMsg.classList.add('hidden');
        dailyRewardOverlay.classList.remove('hidden');
    } catch (e) {
        console.error('Error checking daily reward:', e);
    }
}

async function claimDailyReward() {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const claimBtn = document.getElementById('claim-daily-reward-btn');
    const closeBtn = document.getElementById('close-daily-reward-btn');
    const statusMsg = document.getElementById('daily-reward-status-msg');
    const dailyRewardOverlay = document.getElementById('daily-reward-overlay');

    if (claimBtn) {
        claimBtn.disabled = true;
        claimBtn.textContent = 'Claiming...';
    }

    try {
        const userDocRef = doc(db, 'users', uid);
        const todayStr = getTodayDateString();

        const result = await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userDocRef);
            if (!userSnap.exists()) throw new Error('User document not found');

            const userData = userSnap.data();
            const lastRewardDate = userData.lastDailyRewardDate || '';

            // Double-check inside transaction to prevent duplicate claims
            if (lastRewardDate === todayStr) {
                return { claimed: false, reason: 'already_claimed' };
            }

            const currentCoins = userData.coins || 0;
            const newBalance = currentCoins + 10;

            transaction.update(userDocRef, {
                coins: newBalance,
                lastDailyRewardDate: todayStr
            });

            return { claimed: true, newBalance };
        });

        if (result.claimed) {
            userProgression.coins = result.newBalance;
            renderProgressionUI();
            await recordCoinTransaction(uid, 'DAILY_REWARD', 10, result.newBalance, null);
            showRewardToast(0, 10);

            if (statusMsg) {
                statusMsg.textContent = '✅ Reward Claimed! +10 🪙';
                statusMsg.classList.remove('hidden');
            }
            if (claimBtn) claimBtn.classList.add('hidden');
            if (closeBtn) closeBtn.classList.remove('hidden');

            console.log('🎁 Daily Reward: +10 coins claimed!');
        } else {
            if (statusMsg) {
                statusMsg.textContent = "✅ Today's reward already claimed";
                statusMsg.classList.remove('hidden');
            }
            if (claimBtn) claimBtn.classList.add('hidden');
            if (closeBtn) closeBtn.classList.remove('hidden');
        }
    } catch (e) {
        console.error('Error claiming daily reward:', e);
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<span class="btn-icon">🎁</span> Claim Reward';
        }
    }
}

// Wire up Daily Reward UI
const claimDailyRewardBtn = document.getElementById('claim-daily-reward-btn');
const closeDailyRewardBtn = document.getElementById('close-daily-reward-btn');
const dailyRewardOverlayEl = document.getElementById('daily-reward-overlay');

if (claimDailyRewardBtn) {
    claimDailyRewardBtn.addEventListener('click', claimDailyReward);
}
if (closeDailyRewardBtn) {
    closeDailyRewardBtn.addEventListener('click', () => {
        if (dailyRewardOverlayEl) dailyRewardOverlayEl.classList.add('hidden');
    });
}


// ========================================================================
// 8d. ATOMIC MULTIPLAYER BET SETTLEMENT
// ========================================================================
/**
 * Atomic Multiplayer Bet Settlement in Firestore
 * Guarantees that:
 * 1. Both players' wallets (Winner and Loser) are updated in a single atomic transaction.
 * 2. Winner receives the full pot (+ betAmount * 2).
 * 3. Loser's already deducted stake remains deducted (0 coins added back).
 * 4. Draw refunds the original bet to BOTH players (+ betAmount).
 * 5. Settlement is idempotent: status 'pending' -> 'settled'. Duplicate calls or page refreshes do NOT re-settle or modify wallets again.
 * 6. Stores betting transaction details in `bet_settlements/${matchId}`.
 */
async function settleMultiplayerBetMatch({ matchId, winnerUid, loserUid, isTie, betAmount }) {
    if (!matchId || betAmount <= 0) return null;

    const settlementRef = doc(db, 'bet_settlements', matchId);

    try {
        const result = await runTransaction(db, async (transaction) => {
            const settlementSnap = await transaction.get(settlementRef);

            // Check if already settled in Firestore
            if (settlementSnap.exists() && settlementSnap.data().settlementStatus === 'settled') {
                console.log(`🔒 Match ${matchId} was ALREADY settled in Firestore. Skipping duplicate payout.`);
                return { ...settlementSnap.data(), alreadySettled: true };
            }

            const winnerRef = winnerUid ? doc(db, 'users', winnerUid) : null;
            const loserRef = loserUid ? doc(db, 'users', loserUid) : null;

            const winnerSnap = winnerRef ? await transaction.get(winnerRef) : null;
            const loserSnap = loserRef ? await transaction.get(loserRef) : null;

            let winnerNewCoins = 0;
            let loserNewCoins = 0;

            if (isTie) {
                // DRAW: Refund original bet (stake) to BOTH players
                if (winnerSnap && winnerSnap.exists()) {
                    const wData = winnerSnap.data();
                    const wCoins = (wData.coins || 0) + betAmount;
                    const wLocked = Math.max(0, (wData.lockedCoins || 0) - betAmount);
                    transaction.update(winnerRef, { coins: wCoins, lockedCoins: wLocked });
                    winnerNewCoins = wCoins;
                }
                if (loserSnap && loserSnap.exists()) {
                    const lData = loserSnap.data();
                    const lCoins = (lData.coins || 0) + betAmount;
                    const lLocked = Math.max(0, (lData.lockedCoins || 0) - betAmount);
                    transaction.update(loserRef, { coins: lCoins, lockedCoins: lLocked });
                    loserNewCoins = lCoins;
                }
            } else {
                // WIN / LOSS:
                // Winner receives complete betting pot (betAmount * 2)
                if (winnerSnap && winnerSnap.exists()) {
                    const wData = winnerSnap.data();
                    const wCoins = (wData.coins || 0) + (betAmount * 2);
                    const wLocked = Math.max(0, (wData.lockedCoins || 0) - betAmount);
                    transaction.update(winnerRef, { coins: wCoins, lockedCoins: wLocked });
                    winnerNewCoins = wCoins;
                }
                // Loser's already deducted stake MUST REMAIN DEDUCTED.
                // Reset lockedCoins to 0 without adding any coins back!
                if (loserSnap && loserSnap.exists()) {
                    const lData = loserSnap.data();
                    const lCoins = lData.coins || 0; // Remains deducted (e.g. 70)!
                    const lLocked = Math.max(0, (lData.lockedCoins || 0) - betAmount);
                    transaction.update(loserRef, { coins: lCoins, lockedCoins: lLocked });
                    loserNewCoins = lCoins;
                }
            }

            const settlementData = {
                matchId: matchId,
                winnerId: winnerUid || null,
                loserId: loserUid || null,
                betAmount: betAmount,
                winnerPayout: isTie ? betAmount : betAmount * 2,
                loserDeduction: isTie ? 0 : betAmount,
                winnerNewCoins: winnerNewCoins,
                loserNewCoins: loserNewCoins,
                result: isTie ? 'draw' : 'win_loss',
                timestamp: serverTimestamp(),
                settlementStatus: 'settled'
            };

            transaction.set(settlementRef, settlementData);

            return { ...settlementData, alreadySettled: false };
        });

        // Record coin transaction logs for audit trail
        if (result && !result.alreadySettled) {
            if (isTie) {
                if (winnerUid) await recordCoinTransaction(winnerUid, 'BET_REFUND', betAmount, result.winnerNewCoins, matchId);
                if (loserUid) await recordCoinTransaction(loserUid, 'BET_REFUND', betAmount, result.loserNewCoins, matchId);
            } else {
                if (winnerUid) await recordCoinTransaction(winnerUid, 'BET_WIN', betAmount * 2, result.winnerNewCoins, matchId);
                if (loserUid) await recordCoinTransaction(loserUid, 'BET_LOSS', -betAmount, result.loserNewCoins, matchId);
            }
        }

        return result;
    } catch (err) {
        console.error('❌ Error in settleMultiplayerBetMatch transaction:', err);
        return null;
    }
}


// ========================================================================
// 8e. BET CHIP SELECTOR UI LOGIC
// ========================================================================

/**
 * Refreshes the coin balance display and chip enabled/disabled states
 * in the Create Room overlay.
 */
function refreshBetChipUI() {
    const coinsDisplay = document.getElementById('create-user-coins-display');
    const warningText = document.getElementById('create-bet-warning');
    const chips = document.querySelectorAll('#create-bet-chips .bet-chip');

    const currentBalance = userProgression.coins || 0;

    if (coinsDisplay) {
        coinsDisplay.textContent = `Your Balance: 🪙 ${currentBalance}`;
    }

    chips.forEach(chip => {
        const betVal = parseInt(chip.getAttribute('data-bet')) || 0;
        if (betVal > 0 && betVal > currentBalance) {
            chip.classList.add('disabled');
            chip.disabled = true;
        } else {
            chip.classList.remove('disabled');
            chip.disabled = false;
        }
    });

    // Check selected chip against balance
    const activeChip = document.querySelector('#create-bet-chips .bet-chip.active');
    if (activeChip && warningText) {
        const selectedBet = parseInt(activeChip.getAttribute('data-bet')) || 0;
        if (selectedBet > currentBalance) {
            const deficit = selectedBet - currentBalance;
            warningText.textContent = `❌ Insufficient Coins. You need ${deficit} more coins.`;
            warningText.classList.remove('hidden');
            // Switch back to "No Bet"
            chips.forEach(c => c.classList.remove('active'));
            const noBetChip = document.querySelector('#create-bet-chips .bet-chip[data-bet="0"]');
            if (noBetChip) noBetChip.classList.add('active');
        } else {
            warningText.classList.add('hidden');
        }
    }
}

// Bet chip click handlers
const betChipsContainer = document.getElementById('create-bet-chips');
if (betChipsContainer) {
    betChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.bet-chip');
        if (!chip || chip.disabled) return;

        const chips = betChipsContainer.querySelectorAll('.bet-chip');
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const warningText = document.getElementById('create-bet-warning');
        if (warningText) warningText.classList.add('hidden');
    });
}

// Refresh bet UI when Create Room overlay opens
const origBtnOpenCreateRoom = document.getElementById('btn-open-create-room');
if (origBtnOpenCreateRoom) {
    // Add another listener that refreshes bet chip UI
    origBtnOpenCreateRoom.addEventListener('click', () => {
        refreshBetChipUI();
    });
}


// ========================================================================
// 8f. BET LOCKING (Reserve coins before match)
// ========================================================================

/**
 * Locks the user's bet amount in Firestore via transaction.
 * Deducts betAmount from available coins and adds to lockedCoins.
 */
async function lockUserBet(betAmount) {
    if (!currentUser || betAmount <= 0) return false;
    const uid = currentUser.uid;

    try {
        const userDocRef = doc(db, 'users', uid);

        const result = await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userDocRef);
            if (!userSnap.exists()) throw new Error('User document not found');

            const userData = userSnap.data();
            const currentCoins = userData.coins || 0;
            const lockedCoins = userData.lockedCoins || 0;
            const availableBalance = currentCoins - lockedCoins;

            if (availableBalance < betAmount) {
                return { locked: false, reason: 'insufficient_balance' };
            }

            transaction.update(userDocRef, {
                coins: currentCoins - betAmount,
                lockedCoins: lockedCoins + betAmount
            });

            return { locked: true, newBalance: currentCoins - betAmount, newLocked: lockedCoins + betAmount };
        });

        if (result.locked) {
            userProgression.coins = result.newBalance;
            if (userProfileData) userProfileData.lockedCoins = result.newLocked;
            renderProgressionUI();
            await recordCoinTransaction(uid, 'BET_LOCK', -betAmount, result.newBalance, null);
            console.log(`🔒 Bet locked: ${betAmount} coins (Available: ${result.newBalance})`);
            return true;
        } else {
            console.warn('❌ Cannot lock bet: insufficient balance');
            return false;
        }
    } catch (e) {
        console.error('Error locking bet:', e);
        return false;
    }
}

/**
 * Locks bet amount for specified user UID in Firestore atomically.
 */
async function lockUserBetForUid(targetUid, betAmount) {
    if (!targetUid || betAmount <= 0) return false;

    try {
        const userDocRef = doc(db, 'users', targetUid);

        const result = await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userDocRef);
            if (!userSnap.exists()) throw new Error('User document not found');

            const userData = userSnap.data();
            const currentCoins = userData.coins || 0;
            const lockedCoins = userData.lockedCoins || 0;
            const availableBalance = currentCoins - lockedCoins;

            if (availableBalance < betAmount) {
                return { locked: false, reason: 'insufficient_balance' };
            }

            transaction.update(userDocRef, {
                coins: currentCoins - betAmount,
                lockedCoins: lockedCoins + betAmount
            });

            return { locked: true, newBalance: currentCoins - betAmount, newLocked: lockedCoins + betAmount };
        });

        if (result.locked) {
            if (currentUser && targetUid === currentUser.uid) {
                userProgression.coins = result.newBalance;
                if (userProfileData) userProfileData.lockedCoins = result.newLocked;
                renderProgressionUI();
            }
            await recordCoinTransaction(targetUid, 'BET_LOCK', -betAmount, result.newBalance, null);
            console.log(`🔒 Bet locked for ${targetUid}: ${betAmount} coins (Available: ${result.newBalance})`);
            return true;
        } else {
            console.warn(`❌ Cannot lock bet for ${targetUid}: insufficient balance`);
            return false;
        }
    } catch (e) {
        console.error(`Error locking bet for ${targetUid}:`, e);
        return false;
    }
}

/**
 * Refunds a locked bet (e.g., challenge declined or expired).
 */
async function refundLockedBet(betAmount) {
    if (!currentUser || betAmount <= 0) return;
    const uid = currentUser.uid;

    try {
        const userDocRef = doc(db, 'users', uid);

        const result = await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userDocRef);
            if (!userSnap.exists()) throw new Error('User document not found');

            const userData = userSnap.data();
            const currentCoins = userData.coins || 0;
            const lockedCoins = userData.lockedCoins || 0;

            const newCoins = currentCoins + betAmount;
            const newLocked = Math.max(0, lockedCoins - betAmount);

            transaction.update(userDocRef, {
                coins: newCoins,
                lockedCoins: newLocked
            });

            return { newBalance: newCoins, newLocked };
        });

        userProgression.coins = result.newBalance;
        if (userProfileData) userProfileData.lockedCoins = result.newLocked;
        renderProgressionUI();
        await recordCoinTransaction(uid, 'BET_REFUND', betAmount, result.newBalance, null);
        console.log(`🔓 Bet refunded: +${betAmount} coins (Balance: ${result.newBalance})`);
    } catch (e) {
        console.error('Error refunding locked bet:', e);
    }
}


let rtdbIncomingChallengesUnsub = null;

function showIncomingChallengeModal(challengeData) {
    if (!currentUser || !challengeData) return;
    const overlay = document.getElementById('incoming-challenge-overlay');
    const challengerName = document.getElementById('incoming-challenger-name');
    const challengeMode = document.getElementById('incoming-challenge-mode');
    const challengeBet = document.getElementById('incoming-challenge-bet');
    const challengePot = document.getElementById('incoming-challenge-pot');
    const warningEl = document.getElementById('incoming-challenge-warning');
    const acceptBtn = document.getElementById('accept-challenge-btn');

    if (!overlay) return;

    if (challengerName) challengerName.textContent = challengeData.creatorName || 'Friend';
    if (challengeMode) challengeMode.textContent = challengeData.gameMode || 'Best of 4';
    if (challengeBet) challengeBet.textContent = `🪙 ${challengeData.betAmount} Coins`;
    if (challengePot) challengePot.textContent = `🪙 ${challengeData.betAmount * 2} Coins`;

    if (acceptBtn) acceptBtn.disabled = false;

    const currentBalance = userProgression.coins || 0;
    if (currentBalance < challengeData.betAmount) {
        if (warningEl) {
            warningEl.innerHTML = `❌ Not enough coins to play this game.<br>Required: ${challengeData.betAmount} coins<br>Your balance: ${currentBalance} coins`;
            warningEl.classList.remove('hidden');
        }
    } else {
        if (warningEl) warningEl.classList.add('hidden');
    }

    overlay._pendingChallenge = challengeData;
    overlay.classList.remove('hidden');
}

function subscribeIncomingRtdbChallenges(uid) {
    if (!uid) return;
    if (rtdbIncomingChallengesUnsub) return;

    const myChallengesRef = rtdbRef(rtdb, `challenges/${uid}`);
    console.log(`📡 Subscribing to RTDB incoming challenges path: challenges/${uid}`);

    rtdbIncomingChallengesUnsub = rtdbOnValue(myChallengesRef, (snapshot) => {
        try {
            if (!snapshot.exists()) return;
            const challengesObj = snapshot.val();
            const keys = Object.keys(challengesObj);
            keys.sort((a, b) => (challengesObj[b]?.createdAt || 0) - (challengesObj[a]?.createdAt || 0));

            for (const key of keys) {
                const ch = challengesObj[key];
                if (ch && ch.status === 'PENDING' && ch.opponentId === uid) {
                    showIncomingChallengeModal(ch);
                    break;
                }
            }
        } catch (e) {
            console.error('Error processing RTDB challenges snapshot:', e);
        }
    }, (err) => console.error('❌ RTDB challenges listener error:', err));
}

// Listen for incoming friend challenges
socket.on('receiveFriendChallenge', ({ challengeData }) => {
    showIncomingChallengeModal(challengeData);
});

let currentMatchId = null;
let rtdbMatchUnsub = null;

function subscribeRtdbMatchRoom(matchId) {
    if (!matchId) return;
    if (currentMatchId === matchId && rtdbMatchUnsub) return;

    if (rtdbMatchUnsub) {
        rtdbMatchUnsub();
        rtdbMatchUnsub = null;
    }

    currentMatchId = matchId;
    isMultiplayerMode = true;

    // Join Socket.IO room as well so server registers both players
    if (typeof socket !== 'undefined' && socket && socket.connected && currentUser) {
        const myName = (userProfileData && userProfileData.username) ? userProfileData.username : currentUser.email.split('@')[0];
        socket.emit('joinRoom', {
            roomCode: matchId,
            matchId: matchId,
            uid: currentUser.uid,
            username: myName,
            avatar: '⚡'
        });
    }

    const matchRef = rtdbRef(rtdb, `matches/${matchId}`);
    console.log(`📡 Subscribing to RTDB match room: matches/${matchId}`);

    rtdbMatchUnsub = rtdbOnValue(matchRef, (snapshot) => {
        try {
            if (!snapshot.exists()) return;
            const room = snapshot.val();
            currentRoomData = room;
            currentRoomCode = room.roomCode || room.matchId || matchId;

            if (roomCodeVal) roomCodeVal.textContent = currentRoomCode;
            if (waitingModeBadge) waitingModeBadge.textContent = `MODE: ${room.format || room.gameMode || 'Best of 4'}`;

            const p1 = room.playerA || (room.players ? room.players[0] : null);
            const p2 = room.playerB || (room.players ? room.players[1] : null);

            if (p1) {
                if (p1Name) p1Name.textContent = p1.name || p1.username || 'Host Player';
                if (p1Avatar) p1Avatar.textContent = p1.avatar || '🥷';
                if (p1Status) {
                    p1Status.textContent = p1.ready ? 'Ready!' : 'Not Ready';
                    p1Status.classList.toggle('ready', !!p1.ready);
                }
            }

            if (p2) {
                if (p2Name) p2Name.textContent = p2.name || p2.username || 'Player 2';
                if (p2Avatar) p2Avatar.textContent = p2.avatar || '⚡';
                if (p2Status) {
                    p2Status.textContent = p2.ready ? 'Ready!' : 'Not Ready';
                    p2Status.classList.toggle('ready', !!p2.ready);
                }
            }

            // Check if BOTH players are ready
            if (p1 && p2 && p1.ready === true && p2.ready === true) {
                if (room.status === 'waiting') {
                    if (currentUser && p1.uid === currentUser.uid) {
                        rtdbSet(rtdbRef(rtdb, `matches/${matchId}/status`), 'starting').catch(() => {});
                    }
                } else if (room.status === 'starting' || room.status === 'playing') {
                    if (!gameContainer.classList.contains('hidden') && document.body.classList.contains('in-game')) {
                        // Already in game arena
                    } else {
                        startMultiplayerGameArenaFromRtdb(room);
                    }
                }
            } else if (room.status === 'waiting' || !room.status) {
                if (waitingRoomOverlay) waitingRoomOverlay.classList.remove('hidden');
                if (createRoomOverlay) createRoomOverlay.classList.add('hidden');
                if (joinRoomOverlay) joinRoomOverlay.classList.add('hidden');
                if (modeSelectionOverlay) modeSelectionOverlay.classList.add('hidden');
            }

            // Check if match is finished
            if (room.status === 'finished') {
                handleRtdbMatchFinished(matchId, room);
                return;
            }

            // Check if BOTH player choices exist in RTDB (Redundant RTDB Round Settlement)
            if (p1 && p2 && p1.choice && p2.choice && (room.status === 'playing' || room.status === 'starting')) {
                handleRtdbBothChoicesRevealed(matchId, room, p1, p2);
            } else if (p1 && p2 && !p1.choice && !p2.choice && (room.status === 'playing' || room.status === 'starting')) {
                handleRtdbNewRoundReset(room);
            }
        } catch (e) {
            console.error('Error processing RTDB match room update:', e);
        }
    }, (err) => console.error('❌ RTDB match room listener error:', err));
}

let lastProcessedRtdbRoundKey = null;
let lastResetRoundNum = 0;
let finishedMatchIds = new Set();

async function handleRtdbMatchFinished(matchId, room) {
    if (!matchId) return;
    if (finishedMatchIds.has(matchId)) return;
    finishedMatchIds.add(matchId);

    console.log(`🏁 RTDB Match Finished: ${matchId}`);

    const p1 = room.playerA || (room.players ? room.players[0] : null);
    const p2 = room.playerB || (room.players ? room.players[1] : null);

    const p1Score = (p1 ? (typeof p1.score === 'number' ? p1.score : 0) : 0);
    const p2Score = (p2 ? (typeof p2.score === 'number' ? p2.score : 0) : 0);

    const isHost = checkIsPlayerA();
    const myScore = isHost ? p1Score : p2Score;
    const oppScore = isHost ? p2Score : p1Score;

    let matchWinner = null;
    let matchLoser = null;
    let isTie = p1Score === p2Score;

    if (p1Score > p2Score) {
        matchWinner = p1;
        matchLoser = p2;
    } else if (p2Score > p1Score) {
        matchWinner = p2;
        matchLoser = p1;
    }

    const winnerUid = matchWinner ? matchWinner.uid : null;
    const loserUid = matchLoser ? matchLoser.uid : null;
    const betAmount = room.bet || room.betAmount || 0;

    console.log(`🏆 MATCH FINISH SCORES: P1 (${p1 ? p1.name : 'P1'}): ${p1Score} vs P2 (${p2 ? p2.name : 'P2'}): ${p2Score} | Winner: ${matchWinner ? matchWinner.name : 'Tie'}`);

    // Settle bet atomically in Firestore if there is a stake
    if (betAmount > 0) {
        await settleMultiplayerBetMatch(matchId, winnerUid, loserUid, betAmount, isTie);
    }

    let outcomeTag = 'DRAW';
    const matchResultTitle = document.getElementById('match-result-title');
    const matchTrophy = document.getElementById('match-trophy');
    const matchScoreSummary = document.getElementById('match-score-summary');
    const matchCoinsRewardEl = document.getElementById('match-coins-reward');

    const iWon = matchWinner && currentUser && matchWinner.uid === currentUser.uid;

    if (isTie) {
        if (matchTrophy) matchTrophy.textContent = '🤝';
        if (matchResultTitle) matchResultTitle.textContent = '🤝 Draw!';
        outcomeTag = 'DRAW';
    } else if (iWon) {
        if (matchTrophy) matchTrophy.textContent = '🏆';
        if (matchResultTitle) matchResultTitle.textContent = '🏆 You Won Match!';
        outcomeTag = 'WIN';
    } else {
        if (matchTrophy) matchTrophy.textContent = '💀';
        if (matchResultTitle) matchResultTitle.textContent = '💀 You Lost Match!';
        outcomeTag = 'LOSE';
    }

    if (matchScoreSummary) {
        matchScoreSummary.textContent = `Final Score: ${myScore} - ${oppScore}`;
    }

    // Update coin reward breakdown display
    if (betAmount > 0 && matchCoinsRewardEl) {
        if (outcomeTag === 'WIN') {
            userProgression.coins += (betAmount * 2);
            matchCoinsRewardEl.innerHTML = `<br><strong>Stake:</strong> 🪙 ${betAmount}<br><strong>Pot Won:</strong> +🪙 ${betAmount * 2}<br><strong>New Balance:</strong> 🪙 ${userProgression.coins}`;
        } else if (outcomeTag === 'LOSE') {
            matchCoinsRewardEl.innerHTML = `<br><strong>Stake Lost:</strong> -🪙 ${betAmount}<br><strong>New Balance:</strong> 🪙 ${userProgression.coins}`;
        } else {
            userProgression.coins += betAmount;
            matchCoinsRewardEl.innerHTML = `<br><strong>Stake Refunded:</strong> +🪙 ${betAmount}<br><strong>New Balance:</strong> 🪙 ${userProgression.coins}`;
        }
        renderProgressionUI();
    }

    // Hide game screen and show victory overlay
    if (gameContainer) gameContainer.classList.add('hidden');
    document.body.classList.remove('in-game');
    if (matchEndOverlay) matchEndOverlay.classList.remove('hidden');

    const betBanner = document.getElementById('bet-match-banner');
    if (betBanner) betBanner.classList.add('hidden');
}

function handleRtdbNewRoundReset(room) {
    if (!room) return;
    if (room.status === 'finished' || (currentMatchId && finishedMatchIds.has(currentMatchId))) {
        return;
    }

    const roundNum = room.currentRound || 1;
    if (roundNum === lastResetRoundNum && choiceButtons[0] && !choiceButtons[0].disabled) return;
    lastResetRoundNum = roundNum;

    console.log(`🔄 Resetting UI for Round ${roundNum}`);

    clearVisualEffects();
    userMoveDisplay.textContent = '❓';
    computerMoveDisplay.textContent = '❓';
    resultMessageElement.textContent = 'Make your move!';
    roundDisplayBadge.textContent = `ROUND ${roundNum}`;
    toggleChoiceButtons(false);
}

function handleRtdbBothChoicesRevealed(matchId, room, p1, p2) {
    const roundKey = `${matchId}_r${room.currentRound || 1}_${p1.choice}_${p2.choice}`;
    if (lastProcessedRtdbRoundKey === roundKey) return;
    lastProcessedRtdbRoundKey = roundKey;
    lastResetRoundNum = 0;

    console.log(`✨ RTDB both choices revealed in ${matchId}: P1 (${p1.name}): ${p1.choice} vs P2 (${p2.name}): ${p2.choice}`);

    const outcome = calculateServerWinner(p1.choice, p2.choice);
    let p1Score = p1.score || 0;
    let p2Score = p2.score || 0;

    if (outcome === 'p1') p1Score++;
    if (outcome === 'p2') p2Score++;

    const isHost = currentUser && p1.uid === currentUser.uid;
    const myChoice = isHost ? p1.choice : p2.choice;
    const oppChoice = isHost ? p2.choice : p1.choice;
    const myScore = isHost ? p1Score : p2Score;
    const oppScore = isHost ? p2Score : p1Score;

    toggleChoiceButtons(true);
    animateMoveReveal(userMoveDisplay, moveEmojis[myChoice]);
    animateMoveReveal(computerMoveDisplay, moveEmojis[oppChoice]);

    userScoreElement.textContent = myScore;
    computerScoreElement.textContent = oppScore;

    clearVisualEffects();
    resultMessageElement.classList.add('result-shake');

    let myOutcome = 'draw';
    if (outcome === 'p1') myOutcome = isHost ? 'win' : 'lose';
    if (outcome === 'p2') myOutcome = isHost ? 'lose' : 'win';

    const winnerName = outcome === 'p1' ? p1.name : (outcome === 'p2' ? p2.name : 'Draw');

    if (myOutcome === 'win') {
        resultMessageElement.textContent = `🎉 You win Round ${room.currentRound || 1}!`;
        resultMessageElement.classList.add('result-win');
        userCard.classList.add('winner');
        computerCard.classList.add('loser');
    } else if (myOutcome === 'lose') {
        resultMessageElement.textContent = `🏆 ${winnerName || 'Opponent'} wins Round ${room.currentRound || 1}!`;
        resultMessageElement.classList.add('result-lose');
        computerCard.classList.add('computer-winner');
        userCard.classList.add('loser');
    } else {
        resultMessageElement.textContent = `🤝 Round ${room.currentRound || 1} Draw!`;
        resultMessageElement.classList.add('result-draw');
    }

    if (isHost) {
        setTimeout(async () => {
            const nextRound = (room.currentRound || 1) + 1;
            const targetWins = room.targetWins || 4;
            if (p1Score >= targetWins || p2Score >= targetWins) {
                // Update final scores FIRST in RTDB so both clients see final score before status becomes finished
                await rtdbSet(rtdbRef(rtdb, `matches/${matchId}/playerA/score`), p1Score).catch(() => {});
                await rtdbSet(rtdbRef(rtdb, `matches/${matchId}/playerB/score`), p2Score).catch(() => {});
                await rtdbSet(rtdbRef(rtdb, `matches/${matchId}/status`), 'finished').catch(() => {});

                // Ensure local host also triggers finish overlay
                handleRtdbMatchFinished(matchId, room);
            } else {
                rtdbSet(rtdbRef(rtdb, `matches/${matchId}/playerA/choice`), null).catch(() => {});
                rtdbSet(rtdbRef(rtdb, `matches/${matchId}/playerB/choice`), null).catch(() => {});
                rtdbSet(rtdbRef(rtdb, `matches/${matchId}/playerA/score`), p1Score).catch(() => {});
                rtdbSet(rtdbRef(rtdb, `matches/${matchId}/playerB/score`), p2Score).catch(() => {});
                rtdbSet(rtdbRef(rtdb, `matches/${matchId}/currentRound`), nextRound).catch(() => {});
            }
        }, 2500);
    }
}

function startMultiplayerGameArenaFromRtdb(room) {
    if (!room) return;
    if (room.status === 'finished' || (currentMatchId && finishedMatchIds.has(currentMatchId))) {
        return;
    }
    if (waitingRoomOverlay) waitingRoomOverlay.classList.add('hidden');

    const p1 = room.playerA || (room.players ? room.players[0] : null);
    const p2 = room.playerB || (room.players ? room.players[1] : null);

    const isPlayerA = currentUser && p1 && p1.uid === currentUser.uid;
    const me = isPlayerA ? p1 : p2;
    const opponent = isPlayerA ? p2 : p1;

    const myName = me ? (me.name || me.username) : ((userProfileData && userProfileData.username) ? userProfileData.username : (currentUser ? currentUser.email.split('@')[0] : 'Player 1'));
    const oppName = opponent ? (opponent.name || opponent.username) : 'Player 2';

    userCardLabel.textContent = myName;
    computerCardLabel.textContent = oppName;
    userScoreLabel.textContent = `${myName}:`;
    computerScoreLabel.textContent = `${oppName}:`;
    arenaSubtitle.textContent = `Real-Time Match: ${myName} VS ${oppName}`;

    const betBanner = document.getElementById('bet-match-banner');
    const potAmount = room.pot || (room.bet ? room.bet * 2 : 0);
    if (potAmount > 0 && betBanner) {
        const betTotalPot = document.getElementById('bet-total-pot');
        if (betTotalPot) betTotalPot.textContent = `🪙 ${potAmount}`;
        betBanner.classList.remove('hidden');
    } else if (betBanner) {
        betBanner.classList.add('hidden');
    }

    if (openStatsArenaBtn) openStatsArenaBtn.classList.add('hidden');
    if (openHistoryArenaBtn) openHistoryArenaBtn.classList.add('hidden');
    if (inGameMenuBtn) inGameMenuBtn.classList.add('hidden');

    modeDisplayBadge.textContent = `MODE: ${room.format || room.gameMode || 'Best of 4'}`;
    roundDisplayBadge.textContent = `ROUND ${room.currentRound || 1}`;

    userScoreElement.textContent = '0';
    computerScoreElement.textContent = '0';
    userMoveDisplay.textContent = '❓';
    computerMoveDisplay.textContent = '❓';

    clearVisualEffects();
    toggleChoiceButtons(false);
    gameContainer.classList.remove('hidden');
    document.body.classList.add('in-game');

    resultMessageElement.textContent = 'Make your move!';
    animateResultText('FIGHT!', 'fight-pulse');
}


// ========================================================================
// 8h. INCOMING CHALLENGE ACCEPT / DECLINE BUTTON HANDLERS
// ========================================================================

const acceptChallengeBtn = document.getElementById('accept-challenge-btn');
const declineChallengeBtn = document.getElementById('decline-challenge-btn');
const incomingChallengeOverlay = document.getElementById('incoming-challenge-overlay');

if (acceptChallengeBtn) {
    acceptChallengeBtn.addEventListener('click', async () => {
        if (!incomingChallengeOverlay || !incomingChallengeOverlay._pendingChallenge || !currentUser) return;

        const challengeData = incomingChallengeOverlay._pendingChallenge;
        const warningEl = document.getElementById('incoming-challenge-warning');

        acceptChallengeBtn.disabled = true;
        const origHtml = acceptChallengeBtn.innerHTML;
        acceptChallengeBtn.innerHTML = '⏳ Accepting...';

        try {
            // 0. Prevent duplicate acceptance
            if (challengeData.status === 'ACCEPTED') {
                alert('Challenge already accepted.');
                acceptChallengeBtn.disabled = false;
                acceptChallengeBtn.innerHTML = origHtml;
                return;
            }

            // 1. Fetch FRESH balance for receiver B
            const receiverDocRef = doc(db, 'users', currentUser.uid);
            const receiverSnap = await getDoc(receiverDocRef);
            
            if (!receiverSnap.exists()) {
                if (warningEl) {
                    warningEl.innerHTML = `❌ User profile not found.`;
                    warningEl.classList.remove('hidden');
                }
                acceptChallengeBtn.disabled = false;
                acceptChallengeBtn.innerHTML = origHtml;
                return;
            }

            const receiverData = receiverSnap.data();
            const receiverCoins = receiverData.coins || 0;
            const betAmount = challengeData.betAmount || 0;

            if (receiverCoins < betAmount) {
                if (warningEl) {
                    warningEl.innerHTML = `❌ Not enough coins to play this game.<br>Required: ${betAmount} coins<br>Your balance: ${receiverCoins} coins`;
                    warningEl.classList.remove('hidden');
                }
                alert('Not enough coins to play');
                acceptChallengeBtn.disabled = false;
                acceptChallengeBtn.innerHTML = origHtml;
                return;
            }

            // 2. Fetch FRESH balance for challenger A
            if (challengeData.creatorId) {
                const creatorDocRef = doc(db, 'users', challengeData.creatorId);
                const creatorSnap = await getDoc(creatorDocRef);
                if (creatorSnap.exists()) {
                    const creatorData = creatorSnap.data();
                    const creatorCoins = creatorData.coins || 0;
                    if (creatorCoins < betAmount) {
                        alert('Challenger no longer has enough coins to play.');
                        acceptChallengeBtn.disabled = false;
                        acceptChallengeBtn.innerHTML = origHtml;
                        return;
                    }
                }
            }

            // 3. ATOMICALLY DEDUCT / LOCK BET FROM BOTH PLAYERS UPON ACCEPTANCE
            if (betAmount > 0) {
                const lockedA = await lockUserBetForUid(challengeData.creatorId, betAmount);
                const lockedB = await lockUserBet(betAmount);
                if (!lockedA || !lockedB) {
                    alert('Not enough coins to play');
                    acceptChallengeBtn.disabled = false;
                    acceptChallengeBtn.innerHTML = origHtml;
                    return;
                }
            }

            // 4. CREATE MATCH ROOM IN FIREBASE RTDB
            const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const roomCode = matchId.substring(6, 12).toUpperCase();
            const myName = (userProfileData && userProfileData.username) ? userProfileData.username : currentUser.email.split('@')[0];

            const matchPayload = {
                matchId: matchId,
                roomCode: roomCode,
                status: 'waiting',
                format: challengeData.gameMode || 'Best of 4',
                targetWins: parseInt((challengeData.gameMode || 'Best of 4').replace('Best of ', '')) || 4,
                bet: betAmount,
                pot: betAmount * 2,
                playerA: {
                    uid: challengeData.creatorId,
                    name: challengeData.creatorName || 'Player 1',
                    avatar: '🥷',
                    ready: false,
                    score: 0,
                    choice: null
                },
                playerB: {
                    uid: currentUser.uid,
                    name: myName,
                    avatar: '⚡',
                    ready: false,
                    score: 0,
                    choice: null
                },
                currentRound: 1,
                createdAt: rtdbServerTimestamp()
            };

            await rtdbSet(rtdbRef(rtdb, `matches/${matchId}`), matchPayload);

            // 5. ATOMICALLY UPDATE RTDB CHALLENGE STATUS TO ACCEPTED WITH MATCH ID
            const acceptedChallengePayload = {
                ...challengeData,
                status: 'ACCEPTED',
                matchId: matchId,
                roomCode: roomCode,
                acceptedAt: rtdbServerTimestamp()
            };

            if (challengeData.opponentId && challengeData.challengeId) {
                await rtdbSet(rtdbRef(rtdb, `challenges/${challengeData.opponentId}/${challengeData.challengeId}`), acceptedChallengePayload).catch(() => {});
            }
            if (challengeData.creatorId && challengeData.challengeId) {
                await rtdbSet(rtdbRef(rtdb, `challenges/${challengeData.creatorId}/${challengeData.challengeId}`), acceptedChallengePayload).catch(() => {});
            }

            incomingChallengeOverlay.classList.add('hidden');
            incomingChallengeOverlay._pendingChallenge = null;

            // 6. IMMEDIATELY SUBSCRIBE PLAYER B TO MATCH ROOM & NAVIGATE TO WAITING ROOM
            subscribeRtdbMatchRoom(matchId);

        } catch (err) {
            console.error('Error accepting challenge:', err);
            alert('Failed to accept challenge.');
        } finally {
            acceptChallengeBtn.disabled = false;
            acceptChallengeBtn.innerHTML = origHtml;
        }
    });
}

if (declineChallengeBtn) {
    declineChallengeBtn.addEventListener('click', async () => {
        if (!incomingChallengeOverlay || !incomingChallengeOverlay._pendingChallenge) return;

        const challengeData = incomingChallengeOverlay._pendingChallenge;
        declineChallengeBtn.disabled = true;

        try {
            if (challengeData.opponentId && challengeData.challengeId) {
                await rtdbSet(rtdbRef(rtdb, `challenges/${challengeData.opponentId}/${challengeData.challengeId}/status`), 'DECLINED').catch(() => {});
            }

            socket.emit('declineFriendChallenge', {
                challengeId: challengeData.challengeId || null,
                creatorSocketId: challengeData.creatorSocketId || null
            });

            incomingChallengeOverlay.classList.add('hidden');
            incomingChallengeOverlay._pendingChallenge = null;
        } catch (e) {
            console.error('Error declining challenge:', e);
        } finally {
            declineChallengeBtn.disabled = false;
        }
    });
}


// ========================================================================
// 8i. BET LOCK ON ROOM CREATION (for creator)
// ========================================================================

// Override the original confirmCreateRoomBtn to also lock bet
const origConfirmCreateRoomBtn = document.getElementById('confirm-create-room-btn');
if (origConfirmCreateRoomBtn) {
    // Remove the existing listener by cloning
    const newBtn = origConfirmCreateRoomBtn.cloneNode(true);
    origConfirmCreateRoomBtn.parentNode.replaceChild(newBtn, origConfirmCreateRoomBtn);

    newBtn.addEventListener('click', async () => {
        const mode = createModeSelect.value;
        const username = (userProfileData && userProfileData.username) ? userProfileData.username : (currentUser ? currentUser.email.split('@')[0] : 'Player 1');
        const uid = currentUser ? currentUser.uid : socket.id;

        const activeBetChip = document.querySelector('#create-bet-chips .bet-chip.active');
        const selectedBet = activeBetChip ? parseInt(activeBetChip.getAttribute('data-bet')) || 0 : 0;

        // Room creation does NOT deduct coins (coins only locked when match accepted/started)
        socket.emit('createRoom', {
            gameMode: mode,
            uid: uid,
            username: username,
            avatar: '🥷',
            betAmount: selectedBet
        });

        // Broadcast challenge to connected players if bet > 0
        if (selectedBet > 0 && currentUser) {
            // This will be sent once room is created to share the challenge
            socket.once('roomCreated', ({ roomCode }) => {
                socket.emit('sendFriendChallenge', {
                    challengeData: {
                        challengeId: `ch_${Date.now()}`,
                        creatorId: currentUser.uid,
                        creatorName: username,
                        creatorSocketId: socket.id,
                        betAmount: selectedBet,
                        gameMode: mode,
                        roomCode: roomCode,
                        status: 'PENDING',
                        createdAt: Date.now()
                    }
                });
            });
        }
    });
}


// ========================================================================
// 8j. CHALLENGE EXPIRATION TIMER
// ========================================================================

/**
 * Auto-expire challenges after 5 minutes.
 * If the creator's room is still waiting and no one joins, refund the bet.
 */
function startChallengeExpirationTimer(betAmount, timeoutMs = 300000) {
    setTimeout(async () => {
        // If we're still in waiting room (no opponent joined), refund
        if (currentRoomData && currentRoomData.players && currentRoomData.players.length < 2 && betAmount > 0) {
            await refundLockedBet(betAmount);
            alert(`⏰ Challenge expired. Your 🪙 ${betAmount} coins were returned.`);
        }
    }, timeoutMs);
}


console.log('🪙 Virtual Coin & Betting Challenge System initialized!');


/**
 * --------------------------------------------------------------------------
 * STEP 9: FRIEND SYSTEM & ONLINE FRIEND CHALLENGE ENGINE
 * --------------------------------------------------------------------------
 */

let rebuildOnlineDebounceTimer = null;
function rebuildCombinedOnlineSet() {
    onlineUserUidsSet = new Set([...socketOnlineUidsSet, ...rtdbOnlineUidsSet]);
    if (rebuildOnlineDebounceTimer) clearTimeout(rebuildOnlineDebounceTimer);
    rebuildOnlineDebounceTimer = setTimeout(() => {
        renderFriendsTab();
        renderAllPlayersTab();
    }, 50);
}

// Socket Presence Listeners
socket.on('presenceUpdate', ({ onlineUids }) => {
    socketOnlineUidsSet = new Set(onlineUids || []);
    rebuildCombinedOnlineSet();
});

socket.on('onlineUsersList', ({ onlineUids }) => {
    socketOnlineUidsSet = new Set(onlineUids || []);
    rebuildCombinedOnlineSet();
});

socket.on('friendRequestReceived', ({ senderName }) => {
    if (rewardToast) {
        rewardToast.textContent = `📩 New friend request from ${senderName}!`;
        showRewardToast(0, 0);
    }
    loadSocialData();
});

socket.on('friendRequestResponse', ({ responderName, accepted }) => {
    if (accepted) {
        if (rewardToast) {
            rewardToast.textContent = `🎉 ${responderName} accepted your friend request!`;
            showRewardToast(0, 0);
        }
    }
    loadSocialData();
});

let myRtdbConnRef = null;
let myRtdbStatusConnRef = null;
let rtdbConnectedUnsub = null;
let rtdbUsersListenerUnsub = null;
let rtdbStatusListenerUnsub = null;

// Firebase Realtime Database Presence Management
function initRtdbPresence(uid) {
    if (!uid) return;

    const displayName = (userProfileData && userProfileData.username) ? userProfileData.username : (currentUser ? currentUser.email.split('@')[0] : 'Player');

    console.log(`🔥 Initializing RTDB Presence for Auth UID: ${uid} (Path: /users/${uid}/online & /status/${uid})`);

    cleanupRtdbPresence();

    const connectedRef = rtdbRef(rtdb, '.info/connected');

    rtdbConnectedUnsub = rtdbOnValue(connectedRef, (snap) => {
        const isConnected = snap.val() === true;
        console.log(`📡 RTDB Connection State: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'} (UID: ${uid})`);

        if (isConnected) {
            const userConnsRef = rtdbRef(rtdb, `users/${uid}/connections`);
            myRtdbConnRef = rtdbPush(userConnsRef);

            const statusConnsRef = rtdbRef(rtdb, `status/${uid}/connections`);
            myRtdbStatusConnRef = rtdbPush(statusConnsRef);

            // Register onDisconnect BEFORE setting user online!
            rtdbOnDisconnect(myRtdbConnRef).remove().catch(e => console.error('❌ onDisconnect(userConn).remove() failed:', e.message));
            rtdbOnDisconnect(myRtdbStatusConnRef).remove().catch(e => console.error('❌ onDisconnect(statusConn).remove() failed:', e.message));

            rtdbOnDisconnect(rtdbRef(rtdb, `users/${uid}/online`)).set(false).catch(e => console.error('❌ onDisconnect(online).set(false) failed:', e.message));
            rtdbOnDisconnect(rtdbRef(rtdb, `users/${uid}/lastSeen`)).set(rtdbServerTimestamp()).catch(e => console.error('❌ onDisconnect(lastSeen) failed:', e.message));

            rtdbOnDisconnect(rtdbRef(rtdb, `status/${uid}/state`)).set('offline').catch(e => console.error('❌ onDisconnect(status/state) failed:', e.message));
            rtdbOnDisconnect(rtdbRef(rtdb, `status/${uid}/lastChanged`)).set(rtdbServerTimestamp()).catch(e => console.error('❌ onDisconnect(status/lastChanged) failed:', e.message));

            // Set online presence state & user metadata
            rtdbSet(myRtdbConnRef, { connectedAt: rtdbServerTimestamp() }).catch(e => console.error('❌ rtdbSet(userConn) failed:', e.message));
            rtdbSet(myRtdbStatusConnRef, { connectedAt: rtdbServerTimestamp() }).catch(e => console.error('❌ rtdbSet(statusConn) failed:', e.message));

            rtdbSet(rtdbRef(rtdb, `users/${uid}/online`), true).then(() => console.log(`✅ RTDB SET SUCCESS: users/${uid}/online = true`)).catch(e => console.error(`❌ rtdbSet(users/${uid}/online, true) FAILED:`, e.message));
            rtdbSet(rtdbRef(rtdb, `users/${uid}/lastSeen`), rtdbServerTimestamp()).catch(e => console.error('❌ rtdbSet(lastSeen) failed:', e.message));
            rtdbSet(rtdbRef(rtdb, `users/${uid}/displayName`), displayName).catch(e => console.error('❌ rtdbSet(displayName) failed:', e.message));
            rtdbSet(rtdbRef(rtdb, `users/${uid}/avatar`), '🥷').catch(e => console.error('❌ rtdbSet(avatar) failed:', e.message));

            rtdbSet(rtdbRef(rtdb, `status/${uid}/state`), 'online').catch(e => console.error('❌ rtdbSet(status/state) failed:', e.message));
            rtdbSet(rtdbRef(rtdb, `status/${uid}/lastChanged`), rtdbServerTimestamp()).catch(e => console.error('❌ rtdbSet(status/lastChanged) failed:', e.message));

            console.log(`🟢 RTDB presence set commands dispatched for UID: ${uid} (ConnID: ${myRtdbConnRef.key})`);
        }
    }, (error) => {
        console.error(`❌ RTDB .info/connected listener error for UID ${uid}:`, error);
    });
}

function cleanupRtdbPresence() {
    if (myRtdbConnRef) {
        rtdbRemove(myRtdbConnRef).catch(err => console.warn('Error removing RTDB user connection ref:', err));
        myRtdbConnRef = null;
    }
    if (myRtdbStatusConnRef) {
        rtdbRemove(myRtdbStatusConnRef).catch(err => console.warn('Error removing RTDB status connection ref:', err));
        myRtdbStatusConnRef = null;
    }
    if (typeof rtdbConnectedUnsub === 'function') {
        rtdbConnectedUnsub();
        rtdbConnectedUnsub = null;
    }
}

function subscribeGlobalRtdbPresence() {
    if (!rtdbUsersListenerUnsub) {
        const usersRef = rtdbRef(rtdb, 'users');
        console.log('📡 Subscribing to RTDB global presence path: /users');

        rtdbUsersListenerUnsub = rtdbOnValue(usersRef, (snapshot) => {
            try {
                const newSet = new Set();
                if (snapshot.exists()) {
                    const users = snapshot.val();
                    Object.keys(users).forEach(uid => {
                        const u = users[uid];
                        if (u) {
                            const hasConns = u.connections && Object.keys(u.connections).length > 0;
                            if (u.online === true || hasConns) {
                                newSet.add(uid);
                            }
                        }
                    });
                }
                rtdbOnlineUidsSet = newSet;
                rebuildCombinedOnlineSet();
            } catch (e) {
                console.error('Error processing RTDB /users presence update:', e);
            }
        }, (err) => console.error('❌ RTDB presence listener error on /users:', err));
    }

    if (!rtdbStatusListenerUnsub) {
        const statusRef = rtdbRef(rtdb, 'status');
        rtdbStatusListenerUnsub = rtdbOnValue(statusRef, (snapshot) => {
            try {
                if (snapshot.exists()) {
                    const statuses = snapshot.val();
                    Object.keys(statuses).forEach(uid => {
                        const st = statuses[uid];
                        if (st) {
                            const hasConns = st.connections && Object.keys(st.connections).length > 0;
                            if (st.state === 'online' || hasConns) {
                                rtdbOnlineUidsSet.add(uid);
                            }
                        }
                    });
                    rebuildCombinedOnlineSet();
                }
            } catch (e) {
                console.error('Error processing RTDB /status presence update:', e);
            }
        }, (err) => console.error('❌ RTDB presence listener error on /status:', err));
    }
}

// Presence listeners managed in Step 4 connect handler

function registerCurrentPresence() {
    if (currentUser) {
        const username = (userProfileData && userProfileData.username) ? userProfileData.username : currentUser.email.split('@')[0];
        socket.emit('registerUserPresence', {
            uid: currentUser.uid,
            username: username,
            avatar: '🥷'
        });
        socket.emit('getOnlineUsers');

        // Sync Firestore presence document
        updateDoc(doc(db, 'users', currentUser.uid), {
            isOnline: true,
            lastSeen: serverTimestamp()
        }).catch(err => console.warn('Could not update Firestore online presence:', err));
    }
}

function unregisterCurrentPresence(targetUid) {
    const uid = targetUid || (currentUser ? currentUser.uid : null);
    if (uid) {
        socket.emit('unregisterUserPresence', { uid: uid });
        updateDoc(doc(db, 'users', uid), {
            isOnline: false,
            lastSeen: serverTimestamp()
        }).catch(err => console.warn('Could not update Firestore offline presence:', err));
    }
}

window.addEventListener('beforeunload', () => {
    if (myRtdbConnRef) {
        rtdbRemove(myRtdbConnRef);
    }
    if (currentUser) {
        socket.emit('unregisterUserPresence', { uid: currentUser.uid });
    }
});

// --------------------------------------------------------------------------
// 9a. FIRESTORE FRIEND DATA REALTIME LISTENERS
// --------------------------------------------------------------------------

function setupSocialRealtimeListeners() {
    if (!currentUser) return;

    // 1. Realtime listener for registered users
    if (allUsersUnsubscribe) allUsersUnsubscribe();
    const usersQ = query(collection(db, 'users'), limit(500));
    allUsersUnsubscribe = onSnapshot(usersQ, (snap) => {
        try {
            lastLoadUsersError = null;
            allRegisteredUsersList = [];
            snap.forEach(docSnap => {
                const data = docSnap.data();
                allRegisteredUsersList.push({
                    uid: docSnap.id || data.uid,
                    ...data
                });
            });
            renderAllPlayersTab();
            renderFriendsTab();
        } catch (e) {
            console.error('Error processing users snapshot:', e);
            lastLoadUsersError = e;
            renderAllPlayersTab();
        }
    }, (err) => {
        console.warn('Error in allUsers realtime listener:', err);
        lastLoadUsersError = err;
        renderAllPlayersTab();
    });

    // 2. Realtime listener for friendships (as user1)
    if (friendships1Unsubscribe) friendships1Unsubscribe();
    const q1 = query(collection(db, 'friends'), where('user1Id', '==', currentUser.uid));
    friendships1Unsubscribe = onSnapshot(q1, (snap1) => {
        try {
            q1FriendshipsMap.clear();
            snap1.forEach(d => q1FriendshipsMap.set(d.id, { id: d.id, ...d.data() }));
            updateMergedFriendshipsUI();
        } catch (e) {
            console.error('Error processing friendships1 snapshot:', e);
        }
    }, (err) => console.warn('Error in friendships1 listener:', err));

    // 3. Realtime listener for friendships (as user2)
    if (friendships2Unsubscribe) friendships2Unsubscribe();
    const q2 = query(collection(db, 'friends'), where('user2Id', '==', currentUser.uid));
    friendships2Unsubscribe = onSnapshot(q2, (snap2) => {
        try {
            q2FriendshipsMap.clear();
            snap2.forEach(d => q2FriendshipsMap.set(d.id, { id: d.id, ...d.data() }));
            updateMergedFriendshipsUI();
        } catch (e) {
            console.error('Error processing friendships2 snapshot:', e);
        }
    }, (err) => console.warn('Error in friendships2 listener:', err));
}

function updateMergedFriendshipsUI() {
    const mergedMap = new Map([...q1FriendshipsMap, ...q2FriendshipsMap]);
    userFriendshipsList = Array.from(mergedMap.values());

    // Update Pending Requests Badge Count in UI
    const pendingIncoming = userFriendshipsList.filter(f => f.status === 'PENDING' && f.receiverId === (currentUser ? currentUser.uid : null));
    const reqBadgeEl = document.getElementById('requests-badge-count');
    if (reqBadgeEl) {
        if (pendingIncoming.length > 0) {
            reqBadgeEl.textContent = pendingIncoming.length;
            reqBadgeEl.classList.remove('hidden');
        } else {
            reqBadgeEl.classList.add('hidden');
        }
    }

    renderFriendsTab();
    renderAllPlayersTab();
    renderRequestsTab();
}

async function loadSocialData() {
    if (!currentUser) return;
    setupSocialRealtimeListeners();
}

function getRelationshipState(otherUid) {
    if (!currentUser || otherUid === currentUser.uid) return { state: 'SELF' };

    const match = userFriendshipsList.find(f => 
        (f.user1Id === currentUser.uid && f.user2Id === otherUid) ||
        (f.user2Id === currentUser.uid && f.user1Id === otherUid)
    );

    if (!match) return { state: 'NONE' };

    if (match.status === 'ACCEPTED') {
        return { state: 'FRIENDS', docId: match.id };
    }

    if (match.status === 'PENDING') {
        if (match.requesterId === currentUser.uid) {
            return { state: 'PENDING_SENT', docId: match.id };
        } else {
            return { state: 'PENDING_RECEIVED', docId: match.id, requesterName: match.user1Id === otherUid ? match.user1Name : match.user2Name };
        }
    }

    return { state: 'NONE' };
}

// --------------------------------------------------------------------------
// 9b. SOCIAL TABS UI RENDERERS
// --------------------------------------------------------------------------

function renderFriendsTab() {
    const container = document.getElementById('friends-list-container');
    const filterText = (document.getElementById('friends-search-input')?.value || '').toLowerCase().trim();

    if (!container) return;
    if (!currentUser) {
        container.innerHTML = '<div class="empty-state">Please sign in to view your friends!</div>';
        return;
    }

    const friendRelations = userFriendshipsList.filter(f => f.status === 'ACCEPTED');
    if (friendRelations.length === 0) {
        container.innerHTML = '<div class="empty-state">No friends added yet. Go to "All Players" tab to add friends!</div>';
        return;
    }

    const friends = [];
    friendRelations.forEach(f => {
        const friendUid = f.user1Id === currentUser.uid ? f.user2Id : f.user1Id;
        const userObj = allRegisteredUsersList.find(u => u.uid === friendUid) || {
            uid: friendUid,
            username: f.user1Id === currentUser.uid ? f.user2Name : f.user1Name
        };
        if (!filterText || (userObj.username || '').toLowerCase().includes(filterText)) {
            friends.push(userObj);
        }
    });

    if (friends.length === 0) {
        container.innerHTML = '<div class="empty-state">No matching friends found.</div>';
        return;
    }

    container.innerHTML = friends.map(friend => {
        const isOnline = onlineUserUidsSet.has(friend.uid);
        const presenceClass = isOnline ? 'presence-online' : 'presence-offline';
        const presenceText = isOnline ? '🟢 Online' : '⚫ Offline';

        return `
            <div class="social-user-card">
                <div class="social-user-info">
                    <span class="social-avatar">👤</span>
                    <div class="social-name-col">
                        <span class="social-username">${escapeHtml(friend.username || 'Fighter')}</span>
                        <span class="presence-badge ${presenceClass}">${presenceText}</span>
                    </div>
                </div>
                <div>
                    ${isOnline 
                        ? `<button class="social-action-btn btn-challenge" onclick="openFriendChallengeModal('${friend.uid}', '${escapeHtml(friend.username || 'Friend')}')">⚔️ Challenge</button>`
                        : `<button class="social-action-btn btn-offline" disabled>🔒 Offline</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function renderAllPlayersTab() {
    const container = document.getElementById('all-players-list-container');
    const filterText = (document.getElementById('all-players-search-input')?.value || '').toLowerCase().trim();

    if (!container) return;

    if (lastLoadUsersError) {
        container.innerHTML = `<div class="empty-state" style="color: #f43f5e;">Error loading players: ${escapeHtml(lastLoadUsersError.message || String(lastLoadUsersError))}</div>`;
        return;
    }

    // Exclude currently logged-in user from own All Players list
    let players = allRegisteredUsersList.filter(u => !currentUser || u.uid !== currentUser.uid);

    if (filterText) {
        players = players.filter(u => (u.username || '').toLowerCase().includes(filterText) || (u.email || '').toLowerCase().includes(filterText));
    }

    if (players.length === 0) {
        if (filterText) {
            container.innerHTML = '<div class="empty-state">No matching players found.</div>';
        } else {
            container.innerHTML = '<div class="empty-state">No other registered players found.</div>';
        }
        return;
    }

    container.innerHTML = players.map(player => {
        const isSelf = currentUser && player.uid === currentUser.uid;
        const isOnline = onlineUserUidsSet.has(player.uid);
        const presenceClass = isOnline ? 'presence-online' : 'presence-offline';
        const presenceText = isOnline ? '🟢 Online' : '⚫ Offline';

        const rel = getRelationshipState(player.uid);

        let actionBtnHtml = '';
        if (isSelf) {
            actionBtnHtml = `<button class="social-action-btn btn-offline" disabled>You</button>`;
        } else if (rel.state === 'FRIENDS') {
            actionBtnHtml = `<button class="social-action-btn btn-friends-status" disabled>✓ Friends</button>`;
        } else if (rel.state === 'PENDING_SENT') {
            actionBtnHtml = `<button class="social-action-btn btn-request-sent" disabled>⏳ Request Sent</button>`;
        } else if (rel.state === 'PENDING_RECEIVED') {
            actionBtnHtml = `<button class="social-action-btn btn-add-friend" onclick="handleAcceptFriendClick(this, '${rel.docId}', '${player.uid}')">📩 Respond</button>`;
        } else {
            actionBtnHtml = `<button class="social-action-btn btn-add-friend" onclick="handleSendFriendRequestClick(this, '${player.uid}', '${escapeHtml(player.username || 'Fighter')}')">➕ Add Friend</button>`;
        }

        return `
            <div class="social-user-card">
                <div class="social-user-info">
                    <span class="social-avatar">👤</span>
                    <div class="social-name-col">
                        <span class="social-username">${escapeHtml(player.username || 'Fighter')}</span>
                        <span class="presence-badge ${presenceClass}">${presenceText}</span>
                    </div>
                </div>
                <div>
                    ${actionBtnHtml}
                </div>
            </div>
        `;
    }).join('');
}

function renderRequestsTab() {
    const container = document.getElementById('requests-list-container');
    const badgeCount = document.getElementById('requests-badge-count');

    if (!container) return;
    if (!currentUser) {
        container.innerHTML = '<div class="empty-state">Please sign in to view friend requests!</div>';
        if (badgeCount) badgeCount.classList.add('hidden');
        return;
    }

    const pendingIncoming = userFriendshipsList.filter(f => f.status === 'PENDING' && f.receiverId === currentUser.uid);

    if (badgeCount) {
        if (pendingIncoming.length > 0) {
            badgeCount.textContent = pendingIncoming.length;
            badgeCount.classList.remove('hidden');
        } else {
            badgeCount.classList.add('hidden');
        }
    }

    if (pendingIncoming.length === 0) {
        container.innerHTML = '<div class="empty-state">No pending friend requests.</div>';
        return;
    }

    container.innerHTML = pendingIncoming.map(req => {
        const senderName = req.requesterId === req.user1Id ? req.user1Name : req.user2Name;

        return `
            <div class="social-user-card">
                <div class="social-user-info">
                    <span class="social-avatar">👤</span>
                    <div class="social-name-col">
                        <span class="social-username">${escapeHtml(senderName)}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">wants to be your friend</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.35rem;">
                    <button class="social-action-btn btn-add-friend" onclick="handleAcceptFriendClick(this, '${req.id}', '${req.requesterId}')">✅ Accept</button>
                    <button class="social-action-btn btn-offline" style="background: rgba(244,63,94,0.2); color: #f43f5e;" onclick="handleRejectFriendClick(this, '${req.id}')">❌ Reject</button>
                </div>
            </div>
        `;
    }).join('');
}

// --------------------------------------------------------------------------
// OPTIMISTIC SOCIAL ACTION HANDLERS
// --------------------------------------------------------------------------

window.handleSendFriendRequestClick = async function(btnEl, targetUid, targetName) {
    if (!btnEl || btnEl.disabled) return;
    btnEl.disabled = true;
    const origHTML = btnEl.innerHTML;
    btnEl.innerHTML = '⏳ Sending...';
    try {
        await sendFriendRequest(targetUid, targetName);
    } catch (e) {
        btnEl.disabled = false;
        btnEl.innerHTML = origHTML;
    }
};

window.handleAcceptFriendClick = async function(btnEl, docId, requesterUid) {
    if (!btnEl || btnEl.disabled) return;
    btnEl.disabled = true;
    btnEl.innerHTML = '⏳ Accepting...';
    try {
        await acceptFriendRequest(docId, requesterUid);
    } catch (e) {
        btnEl.disabled = false;
        btnEl.innerHTML = '✅ Accept';
    }
};

window.handleRejectFriendClick = async function(btnEl, docId) {
    if (!btnEl || btnEl.disabled) return;
    btnEl.disabled = true;
    btnEl.innerHTML = '⏳ Rejecting...';
    try {
        await rejectFriendRequest(docId);
    } catch (e) {
        btnEl.disabled = false;
        btnEl.innerHTML = '❌ Reject';
    }
};

// --------------------------------------------------------------------------
// 9c. FRIEND ACTIONS (SEND / ACCEPT / REJECT)
// --------------------------------------------------------------------------

async function sendFriendRequest(targetUid, targetName) {
    if (!currentUser) return;
    if (targetUid === currentUser.uid) return;

    try {
        const myName = (userProfileData && userProfileData.username) ? userProfileData.username : currentUser.email.split('@')[0];

        const rel = getRelationshipState(targetUid);
        if (rel.state !== 'NONE') {
            alert('A relationship or request already exists with this player.');
            return;
        }

        const sortedUids = [currentUser.uid, targetUid].sort();
        const friendDocId = `${sortedUids[0]}_${sortedUids[1]}`;

        await setDoc(doc(db, 'friends', friendDocId), {
            user1Id: sortedUids[0],
            user1Name: sortedUids[0] === currentUser.uid ? myName : targetName,
            user2Id: sortedUids[1],
            user2Name: sortedUids[1] === currentUser.uid ? myName : targetName,
            requesterId: currentUser.uid,
            receiverId: targetUid,
            status: 'PENDING',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        socket.emit('sendFriendRequestNotif', { receiverUid: targetUid, senderName: myName });

        updateMergedFriendshipsUI();
        renderAllPlayersTab();
        renderRequestsTab();

        if (rewardToast) {
            rewardToast.textContent = `⏳ Friend request sent to ${targetName}!`;
            showRewardToast(0, 0);
        }
    } catch (e) {
        console.error('Error sending friend request:', e);
        alert('Failed to send friend request.');
    }
}

async function acceptFriendRequest(docId, requesterUid) {
    if (!currentUser || !docId) return;

    try {
        const myName = (userProfileData && userProfileData.username) ? userProfileData.username : currentUser.email.split('@')[0];

        await updateDoc(doc(db, 'friends', docId), {
            status: 'ACCEPTED',
            updatedAt: serverTimestamp()
        });

        if (requesterUid) {
            socket.emit('friendRequestResponseNotif', { targetUid: requesterUid, responderName: myName, accepted: true });
        }

        updateMergedFriendshipsUI();
        renderFriendsTab();
        renderAllPlayersTab();
        renderRequestsTab();

        if (rewardToast) {
            rewardToast.textContent = `✅ Friend request accepted!`;
            showRewardToast(0, 0);
        }
    } catch (e) {
        console.error('Error accepting friend request:', e);
        alert('Failed to accept friend request.');
    }
}

async function rejectFriendRequest(docId) {
    if (!currentUser || !docId) return;

    try {
        const docRef = doc(db, 'friends', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            socket.emit('friendRequestResponseNotif', { targetUid: data.requesterId, responderName: currentUser.email.split('@')[0], accepted: false });
        }

        await updateDoc(docRef, {
            status: 'REJECTED',
            updatedAt: serverTimestamp()
        });

        updateMergedFriendshipsUI();
        renderFriendsTab();
        renderAllPlayersTab();
        renderRequestsTab();
    } catch (e) {
        console.error('Error rejecting friend request:', e);
    }
}

window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.rejectFriendRequest = rejectFriendRequest;
window.openFriendChallengeModal = openFriendChallengeModal;

// --------------------------------------------------------------------------
// 9d. FRIEND CHALLENGE CONFIGURATION MODAL LOGIC
// --------------------------------------------------------------------------

function openFriendChallengeModal(friendUid, friendName) {
    if (!currentUser) return;
    if (!onlineUserUidsSet.has(friendUid)) {
        alert(`⚫ ${friendName} is currently offline and cannot be challenged.`);
        return;
    }

    selectedChallengeTargetFriend = { uid: friendUid, name: friendName };

    const modal = document.getElementById('friend-challenge-config-modal');
    const targetNameEl = document.getElementById('challenge-target-username');
    const balanceDisplay = document.getElementById('challenge-user-balance-display');

    if (!modal) return;

    if (targetNameEl) targetNameEl.textContent = friendName;

    const currentBalance = userProgression.coins || 0;
    if (balanceDisplay) balanceDisplay.textContent = `Your Balance: 🪙 ${currentBalance}`;

    const betChips = document.querySelectorAll('#challenge-bet-chips .bet-chip');
    betChips.forEach(chip => {
        const betVal = parseInt(chip.getAttribute('data-bet')) || 0;
        if (betVal > currentBalance) {
            chip.classList.add('disabled');
            chip.disabled = true;
        } else {
            chip.classList.remove('disabled');
            chip.disabled = false;
        }
    });

    const activeBetChip = document.querySelector('#challenge-bet-chips .bet-chip.active');
    if (activeBetChip && activeBetChip.disabled) {
        activeBetChip.classList.remove('active');
        const firstValid = document.querySelector('#challenge-bet-chips .bet-chip:not(:disabled)');
        if (firstValid) firstValid.classList.add('active');
    }

    modal.classList.remove('hidden');
}

const challengeModeChipsContainer = document.getElementById('challenge-mode-chips');
if (challengeModeChipsContainer) {
    challengeModeChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.mode-chip');
        if (!chip) return;
        challengeModeChipsContainer.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
}

const challengeBetChipsContainer = document.getElementById('challenge-bet-chips');
if (challengeBetChipsContainer) {
    challengeBetChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.bet-chip');
        if (!chip || chip.disabled) return;
        challengeBetChipsContainer.querySelectorAll('.bet-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
}

const closeChallengeConfigBtn = document.getElementById('close-challenge-config-btn');
if (closeChallengeConfigBtn) {
    closeChallengeConfigBtn.addEventListener('click', () => {
        const modal = document.getElementById('friend-challenge-config-modal');
        if (modal) modal.classList.add('hidden');
    });
}

const sendDirectChallengeBtn = document.getElementById('send-direct-challenge-btn');
if (sendDirectChallengeBtn) {
    sendDirectChallengeBtn.addEventListener('click', async () => {
        if (!currentUser || !selectedChallengeTargetFriend) {
            alert('Please select an online friend to challenge.');
            return;
        }

        const friendUid = selectedChallengeTargetFriend.uid;
        const friendName = selectedChallengeTargetFriend.name;

        if (!onlineUserUidsSet.has(friendUid)) {
            alert(`⚫ ${friendName} is currently offline.`);
            const modal = document.getElementById('friend-challenge-config-modal');
            if (modal) modal.classList.add('hidden');
            return;
        }

        const activeModeChip = document.querySelector('#challenge-mode-chips .mode-chip.active');
        const activeBetChip = document.querySelector('#challenge-bet-chips .bet-chip.active');

        const gameMode = activeModeChip ? activeModeChip.getAttribute('data-mode') : 'Best of 4';
        const betAmount = activeBetChip ? parseInt(activeBetChip.getAttribute('data-bet')) || 30 : 30;

        const currentBalance = userProgression.coins || 0;
        if (currentBalance < betAmount) {
            alert(`❌ Insufficient Coins. You need ${betAmount - currentBalance} more coins.`);
            return;
        }

        sendDirectChallengeBtn.disabled = true;
        const origText = sendDirectChallengeBtn.innerHTML;
        sendDirectChallengeBtn.innerHTML = '⏳ Sending Challenge...';

        try {
            const myName = (userProfileData && userProfileData.username) ? userProfileData.username : currentUser.email.split('@')[0];
            const challengeId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const challengeRef = rtdbRef(rtdb, `challenges/${friendUid}/${challengeId}`);
            
            const challengeData = {
                challengeId: challengeId,
                creatorId: currentUser.uid,
                creatorName: myName,
                creatorSocketId: socket.id || null,
                opponentId: friendUid,
                opponentName: friendName,
                betAmount: betAmount,
                gameMode: gameMode,
                status: 'PENDING',
                createdAt: rtdbServerTimestamp()
            };

            // 1. CREATE CHALLENGE IN FIREBASE RTDB (DO NOT DEDUCT OR LOCK COINS AT SEND TIME!)
            await rtdbSet(challengeRef, challengeData);
            console.log('✅ Challenge written to Firebase RTDB! (Coins remain unchanged at 80/current balance)');

            // 2. LISTEN FOR ACCEPTANCE / DECLINE ON THIS CHALLENGE
            const sentChallengeRef = rtdbRef(rtdb, `challenges/${friendUid}/${challengeId}`);
            let isAutoNavigated = false;

            const sentUnsub = rtdbOnValue(sentChallengeRef, async (snap) => {
                if (!snap.exists()) return;
                const val = snap.val();
                const status = val?.status;
                
                if (status === 'DECLINED') {
                    if (sentUnsub) sentUnsub();
                    alert(`⚔️ ${friendName} declined your challenge. No coins were lost.`);
                } else if (status === 'ACCEPTED') {
                    const matchId = val.matchId || val.roomCode;
                    if (matchId && !isAutoNavigated) {
                        isAutoNavigated = true;
                        if (sentUnsub) sentUnsub();
                        console.log('🚀 Challenger auto-navigating to match room:', matchId);
                        subscribeRtdbMatchRoom(matchId);
                    }
                }
            });

            // 4. EMIT SOCKET NOTIFICATION & EXPIRATION TIMER
            socket.emit('sendFriendChallenge', { challengeData });
            startChallengeExpirationTimer(betAmount, 300000);

            // 5. SHOW SUCCESS FEEDBACK & CLOSE MODAL
            showRewardToast(0, 0);
            if (rewardToast) rewardToast.textContent = `⚔️ Challenge sent to ${friendName}!`;

            const modal = document.getElementById('friend-challenge-config-modal');
            if (modal) modal.classList.add('hidden');

            // 6. CREATE MULTIPLAYER ROOM FOR HOST
            socket.emit('createRoom', {
                gameMode: gameMode,
                uid: currentUser.uid,
                username: myName,
                avatar: '🥷',
                betAmount: betAmount,
                challengeId: challengeId
            });

            socket.once('roomCreated', ({ roomCode }) => {
                rtdbSet(rtdbRef(rtdb, `challenges/${friendUid}/${challengeId}/roomCode`), roomCode).catch(() => {});
            });

        } catch (err) {
            console.error('❌ Challenge send error:', err);
            alert(`Failed to send challenge: ${err.message || 'Firebase write failed'}`);
        } finally {
            sendDirectChallengeBtn.disabled = false;
            sendDirectChallengeBtn.innerHTML = origText;
        }
    });
}

// --------------------------------------------------------------------------
// 9e. SOCIAL TABS BINDINGS & SEARCH INPUT LISTENERS
// --------------------------------------------------------------------------

const tabFriendsBtn = document.getElementById('tab-friends-btn');
const tabAllPlayersBtn = document.getElementById('tab-all-players-btn');
const tabRequestsBtn = document.getElementById('tab-requests-btn');

const socialFriendsPanel = document.getElementById('social-friends-panel');
const socialAllPlayersPanel = document.getElementById('social-all-players-panel');
const socialRequestsPanel = document.getElementById('social-requests-panel');

if (tabFriendsBtn && tabAllPlayersBtn && tabRequestsBtn) {
    tabFriendsBtn.addEventListener('click', () => {
        tabFriendsBtn.classList.add('active');
        tabAllPlayersBtn.classList.remove('active');
        tabRequestsBtn.classList.remove('active');

        if (socialFriendsPanel) socialFriendsPanel.classList.remove('hidden');
        if (socialAllPlayersPanel) socialAllPlayersPanel.classList.add('hidden');
        if (socialRequestsPanel) socialRequestsPanel.classList.add('hidden');

        renderFriendsTab();
    });

    tabAllPlayersBtn.addEventListener('click', () => {
        tabAllPlayersBtn.classList.add('active');
        tabFriendsBtn.classList.remove('active');
        tabRequestsBtn.classList.remove('active');

        if (socialAllPlayersPanel) socialAllPlayersPanel.classList.remove('hidden');
        if (socialFriendsPanel) socialFriendsPanel.classList.add('hidden');
        if (socialRequestsPanel) socialRequestsPanel.classList.add('hidden');

        if (!allUsersUnsubscribe && currentUser) {
            loadSocialData();
        } else {
            renderAllPlayersTab();
        }
    });

    tabRequestsBtn.addEventListener('click', () => {
        tabRequestsBtn.classList.add('active');
        tabFriendsBtn.classList.remove('active');
        tabAllPlayersBtn.classList.remove('active');

        if (socialRequestsPanel) socialRequestsPanel.classList.remove('hidden');
        if (socialFriendsPanel) socialFriendsPanel.classList.add('hidden');
        if (socialAllPlayersPanel) socialAllPlayersPanel.classList.add('hidden');

        renderRequestsTab();
    });
}

const friendsSearchInput = document.getElementById('friends-search-input');
if (friendsSearchInput) {
    friendsSearchInput.addEventListener('input', renderFriendsTab);
}

const allPlayersSearchInput = document.getElementById('all-players-search-input');
if (allPlayersSearchInput) {
    allPlayersSearchInput.addEventListener('input', renderAllPlayersTab);
}

// Register presence and load social data on user sync
registerCurrentPresence();
loadSocialData();

