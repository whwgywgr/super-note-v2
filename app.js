// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBtVbxoz3y5SGF1L970XDMLFFrYcXmoXTE",
    authDomain: "supernoted-v2.firebaseapp.com",
    projectId: "supernoted-v2",
    storageBucket: "supernoted-v2.firebasestorage.app",
    messagingSenderId: "966370368481",
    appId: "1:966370368481:web:1baa0f00bf23c8ee9290a0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// DOM Elements
const authModal = document.getElementById('authModal');
const profileModal = document.getElementById('profileModal');
const userProfileSection = document.querySelector('.user-profile');
const googleSignInBtn = document.getElementById('googleSignIn');
const googleRegisterBtn = document.getElementById('googleRegister');
const signOutBtn = document.getElementById('profileSignOut');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        updateUserProfile(user);
        hideAuthModal();
        showUserProfile();
    } else {
        // User is signed out
        hideUserProfile();
        showAuthModal();
    }
});

// Sign in with Google
googleSignInBtn.addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .then((result) => {
            // Handle successful sign-in
            const user = result.user;
            updateUserProfile(user);
        })
        .catch((error) => {
            console.error('Error signing in:', error);
            alert('Error signing in. Please try again.');
        });
});

// Register with Google
googleRegisterBtn.addEventListener('click', () => {
    // Set the provider to show account chooser
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    auth.signInWithPopup(provider)
        .then((result) => {
            // Handle successful registration
            const user = result.user;
            updateUserProfile(user);
            
            // Show welcome message
            alert('Welcome to SuperNoted! Your account has been created successfully.');
        })
        .catch((error) => {
            console.error('Error registering:', error);
            alert('Error creating account. Please try again.');
        });
});

// Sign out
signOutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            hideProfileModal();
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
});

// Update user profile information
function updateUserProfile(user) {
    // Update header profile
    userAvatar.src = user.photoURL || 'assets/default-avatar.png';
    userName.textContent = user.displayName;

    // Update profile modal
    profileAvatar.src = user.photoURL || 'assets/default-avatar.png';
    profileName.textContent = user.displayName;
    profileEmail.textContent = user.email;
}

// Show/hide modals and profile section
function showAuthModal() {
    authModal.style.display = 'block';
    setTimeout(() => {
        authModal.classList.add('show');
    }, 10);
}

function hideAuthModal() {
    authModal.classList.remove('show');
    setTimeout(() => {
        authModal.style.display = 'none';
    }, 300);
}

function showProfileModal() {
    profileModal.style.display = 'block';
    setTimeout(() => {
        profileModal.classList.add('show');
    }, 10);
}

function hideProfileModal() {
    profileModal.classList.remove('show');
    setTimeout(() => {
        profileModal.style.display = 'none';
    }, 300);
}

function showUserProfile() {
    userProfileSection.style.display = 'flex';
}

function hideUserProfile() {
    userProfileSection.style.display = 'none';
}

// Toggle profile modal when clicking on user profile
userProfileSection.addEventListener('click', () => {
    showProfileModal();
});

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === authModal) {
        hideAuthModal();
    }
    if (event.target === profileModal) {
        hideProfileModal();
    }
});

// Show auth modal by default when page loads
document.addEventListener('DOMContentLoaded', () => {
    showAuthModal();
}); 