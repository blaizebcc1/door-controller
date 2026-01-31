// User Database
let users = {
    "Blaize": "BlaizeAccount"
};

let currentUser = null;
let selectedServer = null;
let servers = [];
let doors = {};

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
}

// Load Servers
let serverUpdateInterval = null;

async function loadServers() {
    const studioRunning = await checkStudioStatus();
    const liveServers = await getLiveServers();
    
    servers = [];
    
    if (studioRunning) {
        servers.push({
            id: 'studio',
            name: 'Studio',
            players: 'N/A',
            isStudio: true,
            status: 'active'
        });
    }
    
    servers = servers.concat(liveServers);
    
    displayServers();
    
    if (serverUpdateInterval) {
        clearInterval(serverUpdateInterval);
    }
    serverUpdateInterval = setInterval(loadServers, 5000);
}

async function checkStudioStatus() {
    const heartbeat = localStorage.getItem('robloxHeartbeat');
    if (heartbeat) {
        const lastBeat = parseInt(heartbeat);
        const now = Date.now();
        return (now - lastBeat) < 10000;
    }
    return false;
}

async function getLiveServers() {
    const serversData = localStorage.getItem('robloxServers');
    if (serversData) {
        try {
            return JSON.parse(serversData);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function displayServers() {
    const grid = document.getElementById('serverGrid');
    grid.innerHTML = '';
    
    if (servers.length === 0) {
        grid.innerHTML = '<div style="color: white; padding: 20px; text-align: center; grid-column: 1/-1;">No servers available. Start a game in Roblox Studio!</div>';
        return;
    }
    
    servers.forEach(server => {
        const card = document.createElement('div');
        card.className = `server-card ${server.isStudio ? 'studio' : ''}`;
        card.onclick = () => selectServer(server);
        
        card.innerHTML = `
            <div class="server-header">
                <div class="server-name">${server.name}</div>
                <div class="server-status"></div>
            </div>
            <div class="server-id">${server.isStudio ? 'Studio Test' : 'ID: ' + server.id}</div>
            <div class="server-players">👥 ${server.players} ${server.isStudio ? '' : 'players'}</div>
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
    
    loadDoorControls();
    startDoorUpdates();
}

function backToServers() {
    selectedServer = null;
    document.getElementById('controlScreen').classList.remove('active');
    document.getElementById('serverScreen').classList.add('active');
    
    if (doorUpdateInterval) {
        clearInterval(doorUpdateInterval);
    }
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
        server: selectedServer.id,
        user: currentUser,
        timestamp: Date.now()
    };
    
    console.log('Sending command:', command);
    
    // Store command for Roblox to poll
    localStorage.setItem('doorCommand', JSON.stringify(command));
    localStorage.setItem('doorCommandTime', Date.now().toString());
    
    document.getElementById('connectionStatus').textContent = 'Command Sent';
    document.getElementById('connectionStatus').style.color = '#10b981';
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
    const statesData = localStorage.getItem('doorStates');
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
    }
});
