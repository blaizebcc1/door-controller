// User Database
let users = {
    "Blaize": "BlaizeAccount"
};

let currentUser = null;
let selectedServer = null;
let servers = [];
let doors = {};
let nextRefresh = 5;

// YOUR GAME ID
const ROBLOX_GAME_ID = "109771177510848";

// CORS Proxy to bypass Roblox's restrictions
const CORS_PROXY = "";

// Door Configuration
const doorCategories = {
    main: [
        { id: 'FirstDoor', name: 'First Door', icon: '🚪' },
        { id: 'MainDoor', name: 'Main Door', icon: '🚪' },
        { id: 'BBdoor', name: 'BB Door', icon: '🚪' },
        { id: 'CoCoDoor', name: 'CoCo Door', icon: '🚪' },
        { id: 'CoCoDoor2', name: 'CoCo Gate', icon: '🚧' }
    ],
    rooms: [
        { id: 'Room1', name: 'Room 1', icon: '🏠' },
        { id: 'Room2', name: 'Room 2', icon: '🏠' },
        { id: 'Room3', name: 'Room 3', icon: '🏠' },
        { id: 'Room4', name: 'Room 4', icon: '🏠' },
        { id: 'Room5', name: 'Room 5', icon: '🏠' },
        { id: 'Room6', name: 'Room 6', icon: '🏠' },
        { id: 'Room7', name: 'Room 7', icon: '🏠' },
        { id: 'Room8', name: 'Room 8', icon: '🏠' }
    ],
    special: [
        { id: 'VaultDoor', name: 'Vault', icon: '🔐' },
        { id: 'EmergencyExit', name: 'Emergency', icon: '🚨' }
    ]
};

// Initialize door states
Object.values(doorCategories).forEach(category => {
    category.forEach(door => {
        doors[door.id] = false;
    });
});

// Load/Save users
function loadUsers() {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Login Function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    
    if (users[username] && users[username] === password) {
        currentUser = username;
        sessionStorage.setItem('currentUser', username);
        
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('serverScreen').classList.add('active');
        document.getElementById('currentUser').textContent = username;
        
        if (username === 'Blaize') {
            document.getElementById('adminPanel').style.display = 'block';
            displayUsers();
        }
        
        loadServers();
        startServerRefreshTimer();
        errorMsg.textContent = '';
    } else {
        errorMsg.textContent = 'Invalid username or password';
        document.getElementById('password').value = '';
    }
}

// Logout Function
function logout() {
    currentUser = null;
    selectedServer = null;
    sessionStorage.removeItem('currentUser');
    
    document.getElementById('serverScreen').classList.remove('active');
    document.getElementById('controlScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    if (serverUpdateInterval) {
        clearInterval(serverUpdateInterval);
    }
    if (refreshTimerInterval) {
        clearInterval(refreshTimerInterval);
    }
}

// Load Servers from Roblox API
let serverUpdateInterval = null;
let refreshTimerInterval = null;

async function loadServers() {
    console.log('🔍 Fetching servers for game:', ROBLOX_GAME_ID);
    
    try {
       // Use RoProxy which mirrors Roblox APIs without CORS restrictions
const proxyUrl = `https://games.roproxy.com/v1/games/${ROBLOX_GAME_ID}/servers/Public?sortOrder=Desc&limit=100`;
        console.log('📡 Fetching from:', proxyUrl);
        
        const response = await fetch(proxyUrl);
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Server data received:', data);
        
        if (!data.data || data.data.length === 0) {
            console.warn('⚠️ No servers found in response');
            servers = [];
            displayServers();
            updateConnectionStatus(false, 'No active servers found');
            return;
        }
        
        servers = data.data.map((server, index) => ({
            id: server.id,
            name: `Server ${index + 1}`,
            players: `${server.playing}/${server.maxPlayers}`,
            playingCount: server.playing,
            maxPlayers: server.maxPlayers,
            ping: server.ping || 'N/A',
            isStudio: false,
            status: 'active'
        }));
        
        console.log('✨ Processed servers:', servers.length);
        displayServers();
        updateConnectionStatus(true, `Found ${servers.length} server${servers.length !== 1 ? 's' : ''}`);
        
    } catch (error) {
        console.error('❌ Error loading servers:', error);
        servers = [];
        displayServers();
        updateConnectionStatus(false, `Connection failed`);
    }
}

function updateConnectionStatus(connected, message) {
    const statusBadge = document.getElementById('connectionStatus');
    if (statusBadge) {
        statusBadge.textContent = message;
        statusBadge.style.color = connected ? '#10b981' : '#ef4444';
        statusBadge.style.borderColor = connected ? '#10b981' : '#ef4444';
        statusBadge.style.background = connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    }
}

function startServerRefreshTimer() {
    nextRefresh = 5;
    
    if (refreshTimerInterval) {
        clearInterval(refreshTimerInterval);
    }
    
    refreshTimerInterval = setInterval(() => {
        nextRefresh--;
        updateRefreshDisplay();
        
        if (nextRefresh <= 0) {
            nextRefresh = 5;
            loadServers();
        }
    }, 1000);
}

function updateRefreshDisplay() {
    const welcomeCard = document.querySelector('.welcome-card p');
    if (welcomeCard && document.getElementById('serverScreen').classList.contains('active')) {
        welcomeCard.innerHTML = `Welcome, <span id="currentUser">${currentUser}</span>! Select a server to control doors. <span style="opacity: 0.7; font-size: 0.9em;">(Refreshing in ${nextRefresh}s)</span>`;
    }
}

function displayServers() {
    const grid = document.getElementById('serverGrid');
    grid.innerHTML = '';
    
    if (servers.length === 0) {
        grid.innerHTML = `
            <div style="color: white; padding: 40px; text-align: center; grid-column: 1/-1; background: rgba(255, 255, 255, 0.1); border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 3em; margin-bottom: 20px;">🔍</div>
                <h2 style="margin-bottom: 10px;">No Servers Found</h2>
                <p style="opacity: 0.8; margin: 10px 0;">Make sure your game is:</p>
                <ul style="list-style: none; padding: 0; opacity: 0.7;">
                    <li>✓ Published to Roblox</li>
                    <li>✓ Public or Unlisted (not Private)</li>
                    <li>✓ Has at least one active server running</li>
                    <li>✓ Game ID is correct: ${ROBLOX_GAME_ID}</li>
                </ul>
                <p style="opacity: 0.6; font-size: 0.85em; margin-top: 20px;">Tip: Join your game to create a server!</p>
                <button onclick="loadServers()" class="btn btn-primary" style="margin-top: 20px; width: auto;">🔄 Retry Now</button>
            </div>
        `;
        return;
    }
    
    servers.forEach((server, index) => {
        const card = document.createElement('div');
        card.className = 'server-card';
        card.onclick = () => selectServer(server);
        
        const isFull = server.playingCount >= server.maxPlayers;
        const fillPercentage = (server.playingCount / server.maxPlayers) * 100;
        
        card.innerHTML = `
            <div class="server-header">
                <div class="server-name">${server.name}</div>
                <div class="server-status"></div>
            </div>
            <div class="server-id">ID: ${server.id.substring(0, 20)}...</div>
            <div class="server-players" style="display: flex; align-items: center; gap: 10px;">
                <span>👥 ${server.players}</span>
                ${isFull ? '<span style="background: rgba(239, 68, 68, 0.3); padding: 2px 8px; border-radius: 10px; font-size: 0.8em;">FULL</span>' : ''}
            </div>
            <div style="width: 100%; background: rgba(0,0,0,0.3); border-radius: 10px; height: 6px; margin-top: 10px; overflow: hidden;">
                <div style="width: ${fillPercentage}%; background: linear-gradient(90deg, #10b981, #059669); height: 100%; transition: width 0.3s;"></div>
            </div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85em; margin-top: 8px;">
                📡 Ping: ${server.ping}ms
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function filterServers() {
    const searchTerm = document.getElementById('serverSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.server-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

function selectServer(server) {
    selectedServer = server;
    
    document.getElementById('serverScreen').classList.remove('active');
    document.getElementById('controlScreen').classList.add('active');
    
    document.getElementById('selectedServerName').textContent = server.name;
    document.getElementById('selectedServerPlayers').textContent = server.players;
    
    if (refreshTimerInterval) {
        clearInterval(refreshTimerInterval);
    }
    
    loadDoorControls();
    startDoorUpdates();
    updateConnectionStatus(true, 'Connected to ' + server.name);
}

function backToServers() {
    selectedServer = null;
    document.getElementById('controlScreen').classList.remove('active');
    document.getElementById('serverScreen').classList.add('active');
    
    if (doorUpdateInterval) {
        clearInterval(doorUpdateInterval);
    }
    
    loadServers();
    startServerRefreshTimer();
}

// Load Door Controls
function loadDoorControls() {
    loadDoorCategory('mainDoors', doorCategories.main);
    loadDoorCategory('roomDoors', doorCategories.rooms);
    loadDoorCategory('specialDoors', doorCategories.special);
}

function loadDoorCategory(containerId, doorList) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    doorList.forEach(door => {
        const btn = document.createElement('button');
        btn.className = `door-btn ${doors[door.id] ? 'open' : 'closed'}`;
        btn.onclick = () => toggleDoor(door.id);
        btn.dataset.doorId = door.id;
        btn.dataset.doorName = door.name.toLowerCase();
        
        btn.innerHTML = `
            <div class="door-icon">${door.icon}</div>
            <div class="door-name">${door.name}</div>
            <div class="door-status-text">${doors[door.id] ? 'Open' : 'Closed'}</div>
        `;
        
        container.appendChild(btn);
    });
}

function filterDoors() {
    const searchTerm = document.getElementById('doorSearch').value.toLowerCase();
    const buttons = document.querySelectorAll('.door-btn');
    
    buttons.forEach(btn => {
        const doorName = btn.dataset.doorName;
        btn.style.display = doorName.includes(searchTerm) ? 'flex' : 'none';
    });
}

// Toggle Door
async function toggleDoor(doorId) {
    doors[doorId] = !doors[doorId];
    updateDoorButton(doorId);
    await sendDoorCommand(doorId, doors[doorId]);
}

function updateDoorButton(doorId) {
    const btn = document.querySelector(`[data-door-id="${doorId}"]`);
    if (!btn) return;
    
    const isOpen = doors[doorId];
    btn.className = `door-btn ${isOpen ? 'open' : 'closed'}`;
    btn.querySelector('.door-status-text').textContent = isOpen ? 'Open' : 'Closed';
}

// Send Door Command to Roblox
async function sendDoorCommand(doorId, isOpen) {
    const command = {
        action: isOpen ? 'open' : 'close',
        doorId: doorId,
        serverId: selectedServer.id,
        user: currentUser,
        timestamp: Date.now()
    };
    
    console.log('🚪 Door Command:', command);
    
    // Store in localStorage for Roblox to poll
    localStorage.setItem('latestDoorCommand', JSON.stringify(command));
    localStorage.setItem(`doorCommand_${selectedServer.id}`, JSON.stringify(command));
    
    updateConnectionStatus(true, `${isOpen ? 'Opening' : 'Closing'} ${doorId}...`);
    
    setTimeout(() => {
        updateConnectionStatus(true, 'Connected to ' + selectedServer.name);
    }, 2000);
}

// Live Door Updates
let doorUpdateInterval = null;

function startDoorUpdates() {
    if (doorUpdateInterval) {
        clearInterval(doorUpdateInterval);
    }
    
    doorUpdateInterval = setInterval(async () => {
        await fetchDoorStates();
    }, 1000);
}

async function fetchDoorStates() {
    const statesData = localStorage.getItem(`doorStates_${selectedServer.id}`);
    if (statesData) {
        try {
            const states = JSON.parse(statesData);
            Object.keys(states).forEach(doorId => {
                if (doors[doorId] !== undefined && doors[doorId] !== states[doorId]) {
                    doors[doorId] = states[doorId];
                    updateDoorButton(doorId);
                }
            });
        } catch (e) {
            console.error('Error parsing door states:', e);
        }
    }
}

// User Management
function displayUsers() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '<h3>Current Users:</h3>';
    
    for (let username in users) {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <span>${username}</span>
            ${username !== 'Blaize' ? `<button onclick="removeUser('${username}')">Remove</button>` : '<span style="color: #fbbf24;">Admin</span>'}
        `;
        userList.appendChild(userItem);
    }
}

function addUser() {
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    
    if (!newUsername || !newPassword) {
        alert('Please fill in both fields');
        return;
    }
    
    if (users[newUsername]) {
        alert('User already exists');
        return;
    }
    
    users[newUsername] = newPassword;
    saveUsers();
    displayUsers();
    
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    
    alert(`User ${newUsername} added successfully!`);
}

function removeUser(username) {
    if (confirm(`Are you sure you want to remove user: ${username}?`)) {
        delete users[username];
        saveUsers();
        displayUsers();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    saveUsers();
    
    console.log('🎮 Door Controller initialized');
    console.log('🆔 Game ID:', ROBLOX_GAME_ID);
    console.log('🌐 Website:', 'https://blaizebcc1.github.io/door-controller/');
    
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('serverScreen').classList.add('active');
        document.getElementById('currentUser').textContent = savedUser;
        
        if (savedUser === 'Blaize') {
            document.getElementById('adminPanel').style.display = 'block';
            displayUsers();
        }
        
        loadServers();
        startServerRefreshTimer();
    }
});
