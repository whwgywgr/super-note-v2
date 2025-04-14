import {
    auth,
    db,
    provider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from './firebase.js';

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
//firebase.initializeApp(firebaseConfig);

// DOM Elements
const authModal = document.getElementById('authModal');
const profileModal = document.getElementById('profileModal');
const userProfileSection = document.querySelector('.user-profile');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const googleRegisterBtn = document.getElementById('googleRegisterBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const noteList = document.getElementById('noteList');
const folderList = document.getElementById('folderList');
const noteModal = document.getElementById('noteModal');
const folderModal = document.getElementById('folderModal');
const folderModalTitle = document.getElementById('folderModalTitle');
const previewModal = document.getElementById('previewModal');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const folderName = document.getElementById('folderName');
const noteFolder = document.getElementById('noteFolder');
const previewTitle = document.getElementById('previewTitle');
const previewContent = document.getElementById('previewContent');
const searchInput = document.getElementById('searchInput');

// State variables
let currentUser = null;
let currentNoteId = null;
let currentPreviewNote = null;
let currentFolderId = null;
let editingFolderId = null;
let quill = null;
let isSaving = false;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        updateUserProfile(user);
        hideAuthModal();
        showUserProfile();
        loadFolders();
        loadNotes();
    } else {
        // User is signed out
        currentUser = null;
        hideUserProfile();
        showAuthModal();
    }
});

// Sign in with Google
googleSignInBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
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
    
    signInWithPopup(auth, provider)
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
    signOut(auth)
        .then(() => {
            hideProfileModal();
        })
        .catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
});

// Close profile modal
closeProfileBtn.addEventListener('click', () => {
    hideProfileModal();
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
    initEditor();
});

// Initialize Quill
function initEditor() {
    quill = new Quill('#noteContent', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Add tab navigation from title to editor
    noteTitle.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            quill.focus();
        }
    });

    // Add Enter key shortcut to save note
    noteTitle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveNote();
        }
    });

    // Add keyboard shortcut for new note (Ctrl/Cmd + N)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openModal();
        }
    });
}

// Load Folders
function loadFolders() {
    if (!currentUser) return;
    
    const foldersQuery = query(
        collection(db, "folders"),
        where("userId", "==", currentUser.uid),
        orderBy("name")
    );

    onSnapshot(foldersQuery, snapshot => {
        folderList.innerHTML = '';
        noteFolder.innerHTML = '<option value="">No Folder</option>';
        
        snapshot.forEach(doc => {
            const folder = doc.data();
            folderList.innerHTML += `
                <li class="folder-item">
                    <div class="folder-content" onclick="selectFolder('${doc.id}')">
                        <i class="fas fa-folder"></i>
                        <span>${folder.name}</span>
                    </div>
                    <div class="folder-actions">
                        <button class="edit-folder-btn" onclick="event.stopPropagation(); openEditFolderModal('${doc.id}', '${folder.name.replace(/'/g, "\\'")}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </li>`;
            
            noteFolder.innerHTML += `
                <option value="${doc.id}">${folder.name}</option>`;
        });
    });
}

// Load Notes
function loadNotes() {
    if (!currentUser) return;

    let notesQuery = query(
        collection(db, "notes"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
    );
    
    if (currentFolderId) {
        notesQuery = query(
            notesQuery,
            where("folderId", "==", currentFolderId)
        );
    }

    onSnapshot(notesQuery, snapshot => {
        noteList.innerHTML = "";
        const uniqueNotes = new Map();
        
        // First, get all folders
        getDocs(collection(db, "folders")).then(foldersSnapshot => {
            const folders = new Map();
            foldersSnapshot.forEach(doc => {
                folders.set(doc.id, doc.data().name);
            });
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const folderName = data.folderId ? folders.get(data.folderId) || 'Unknown Folder' : 'No Folder';
                const date = data.createdAt ? data.createdAt.toDate() : new Date();
                const formattedDate = `${date.getDate()} ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][date.getMonth()]} ${date.getFullYear()}`;
                
                uniqueNotes.set(doc.id, {
                    id: doc.id,
                    title: data.title || 'Untitled Note',
                    content: data.content,
                    folderId: data.folderId || '',
                    folderName: folderName,
                    formattedDate: formattedDate,
                    createdAt: date.toLocaleString(),
                    updatedAt: data.updatedAt ? data.updatedAt.toDate().toLocaleString() : "Not updated"
                });
            });
            
            uniqueNotes.forEach(note => {
                noteList.innerHTML += `
                    <li class="note-item" onclick="openPreviewModal('${note.id}', '${note.title.replace(/'/g, "\\'")}', '${note.content.replace(/'/g, "\\'")}')">
                        <div class="note-date">${note.formattedDate}</div>
                        <div class="note-content">
                            <div class="note-icon">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="note-details">
                                <h3>${note.title}</h3>
                                <p>${note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                            </div>
                            <div class="note-actions">
                                <button class="edit-btn" onclick="event.stopPropagation(); openEditModal('${note.id}', '${note.title.replace(/'/g, "\\'")}', '${note.content.replace(/'/g, "\\'")}', '${note.folderId}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-btn" onclick="event.stopPropagation(); deleteNote('${note.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </li>`;
            });
        });
    });
}

// Note and Folder Functions
function openModal() {
    noteModal.style.display = 'block';
    noteTitle.value = '';
    quill.setContents([]);
    currentNoteId = null;
}

function openEditModal(id, title, content, folderId = '') {
    noteModal.style.display = 'block';
    noteTitle.value = title;
    quill.setContents(quill.clipboard.convert(content));
    currentNoteId = id;
    noteFolder.value = folderId;
}

function closeModal() {
    noteModal.style.display = 'none';
    currentNoteId = null;
}

function openFolderModal() {
    folderModal.style.display = 'block';
    folderModalTitle.textContent = 'New Folder';
    folderName.value = '';
    folderName.focus();
    editingFolderId = null;
}

function openEditFolderModal(folderId, folderName) {
    folderModal.style.display = 'block';
    folderModalTitle.textContent = 'Edit Folder';
    document.getElementById('folderName').value = folderName;
    editingFolderId = folderId;
}

function closeFolderModal() {
    folderModal.style.display = 'none';
    editingFolderId = null;
}

async function saveFolder() {
    const name = folderName.value.trim();
    if (!name) {
        showNotification("Please enter a folder name", "error");
        return;
    }

    try {
        if (editingFolderId) {
            await updateDoc(doc(db, "folders", editingFolderId), {
                name: name,
                updatedAt: serverTimestamp()
            });
            showNotification("Folder updated successfully!");
        } else {
            await addDoc(collection(db, "folders"), {
                name: name,
                userId: currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            showNotification("Folder created successfully!");
        }
        closeFolderModal();
    } catch (error) {
        console.error("Error saving folder:", error);
        showNotification("Error saving folder. Please try again.", "error");
    }
}

function selectFolder(folderId) {
    currentFolderId = folderId;
    loadNotes();
}

async function saveNote() {
    if (isSaving) return;
    isSaving = true;

    const title = noteTitle.value.trim();
    const content = quill.root.innerHTML;
    const folderId = noteFolder.value;

    if (!title) {
        showNotification("Please enter a note title", "error");
        isSaving = false;
        return;
    }

    try {
        const noteData = {
            title: title,
            content: content,
            folderId: folderId || null,
            userId: currentUser.uid,
            updatedAt: serverTimestamp()
        };

        if (currentNoteId) {
            await updateDoc(doc(db, "notes", currentNoteId), noteData);
            showNotification("Note updated successfully!");
        } else {
            noteData.createdAt = serverTimestamp();
            await addDoc(collection(db, "notes"), noteData);
            showNotification("Note created successfully!");
        }

        closeModal();
    } catch (error) {
        console.error("Error saving note:", error);
        showNotification("Error saving note. Please try again.", "error");
    } finally {
        isSaving = false;
    }
}

async function deleteNote(id) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
        await deleteDoc(doc(db, "notes", id));
        showNotification("Note deleted successfully!");
    } catch (error) {
        console.error("Error deleting note:", error);
        showNotification("Error deleting note. Please try again.", "error");
    }
}

function openPreviewModal(id, title, content) {
    previewModal.style.display = 'block';
    previewTitle.textContent = title;
    previewContent.innerHTML = content;
    currentPreviewNote = { id, title, content };
}

function closePreviewModal() {
    previewModal.style.display = 'none';
    currentPreviewNote = null;
}

function openEditModalFromPreview() {
    if (currentPreviewNote) {
        openEditModal(
            currentPreviewNote.id,
            currentPreviewNote.title,
            currentPreviewNote.content
        );
        closePreviewModal();
    }
}

function showNotification(message, type = "success") {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Search functionality
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const notes = document.querySelectorAll('.note-item');

    notes.forEach(note => {
        const title = note.querySelector('h3').textContent.toLowerCase();
        const content = note.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            note.style.display = 'block';
        } else {
            note.style.display = 'none';
        }
    });
}); 



