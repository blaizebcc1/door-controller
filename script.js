// User Database (In production, use a real backend)
let users = {
    "Blaize": "BlaizeAccount"
};

let currentUser = null;
let doorIsOpen = false;

// Load users from localStorage
function loadUsers() {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
}

// Save users to localStorage
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
        document.getElementById('dashboardScreen').classList.add('active');
        document.getElementById('currentUser').textContent = username;
        
        // Show admin panel for Blaize
        if (username === 'Blaize') {
            document.getElementById('adminPanel').style.display = 'block';
            displayUsers();
        }
        
        errorMsg.textContent = '';
    } else {
        errorMsg.textContent = 'Invalid username or password';
        document.getElementById('password').value = '';
    }
}

// Logout Function
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    document.getElementById('dashboardScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Toggle Door Function
async function toggleDoor() {
    const button = document.getElementById('doorButton');
    const statusIndicator = document.getElementById('doorStatus');
    const statusText = document.getElementById('doorStatusText');
    
    doorIsOpen = !doorIsOpen;
    
    // Update UI
    if (doorIsOpen) {
        button.textContent = 'Close Door';
        button.classList.add('open');
        statusIndicator.classList.add('open');
        statusText.textContent = 'Open';
    } else {
        button.textContent = 'Open Door';
        button.classList.remove('open');
        statusIndicator.classList.remove('open');
        statusText.textContent = 'Closed';
    }
    
    // Send command to Roblox (you'll need to set this up with HttpService)
    await sendToRoblox({
        action: doorIsOpen ? 'open' : 'close',
        door: 'FirstDoor',
        user: currentUser
    });
}

// Send data to Roblox
async function sendToRoblox(data) {
    // This requires setting up HttpService in Roblox Studio
    // For now, we'll log it
    console.log('Sending to Roblox:', data);
    
    // In production, you'd use:
    // try {
    //     const response = await fetch('YOUR_ROBLOX_SERVER_URL', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(data)
    //     });
    //     return await response.json();
    // } catch (error) {
    //     console.error('Error:', error);
    // }
}

// Display Users (Admin Only)
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

// Add User (Admin Only)
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

// Remove User (Admin Only)
function removeUser(username) {
    if (confirm(`Are you sure you want to remove user: ${username}?`)) {
        delete users[username];
        saveUsers();
        displayUsers();
    }
}

// Enter key support
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    saveUsers(); // Save initial user
    
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // Check if user is already logged in
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('dashboardScreen').classList.add('active');
        document.getElementById('currentUser').textContent = savedUser;
        
        if (savedUser === 'Blaize') {
            document.getElementById('adminPanel').style.display = 'block';
            displayUsers();
        }
    }
});
