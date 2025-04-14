// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBtVbxoz3y5SGF1L970XDMLFFrYcXmoXTE",
    authDomain: "supernoted-v2.firebaseapp.com",
    projectId: "supernoted-v2",
    storageBucket: "supernoted-v2.firebasestorage.app",
    messagingSenderId: "966370368481",
    appId: "1:966370368481:web:1baa0f00bf23c8ee9290a0",
    measurementId: "G-5YHLBL1F1X"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

// DOM Elements
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
const addNoteBtn = document.querySelector('.add-note-btn');
const authModal = document.getElementById('authModal');
const googleSignInBtn = document.getElementById('googleSignIn');
const signOutBtn = document.getElementById('signOutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
let currentNoteId = null;
let currentPreviewNote = null;
let currentFolderId = null;
let editingFolderId = null;
let quill = null;
let isSaving = false;

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

// Initialize notes collection
function initializeNotesCollection() {
    db.collection("notes").add({
        title: "Welcome to SuperNoted!",
        content: "This is your first note. You can edit or delete it.",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error => {
        console.log("Error initializing notes:", error);
    });
}

// Load Folders
function loadFolders() {
    db.collection("folders")
        .orderBy("name")
        .onSnapshot(snapshot => {
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

// Folder Functions
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
            await db.collection("folders").doc(editingFolderId).update({
                name: name,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification("Folder updated successfully!");
        } else {
            await db.collection("folders").add({
                name: name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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

// ----- READ -----
function loadNotes() {
    if (!currentUser) return;

    let query = db.collection("notes")
        .where("userId", "==", currentUser.uid)
        .orderBy("createdAt", "desc");
    
    if (currentFolderId) {
        query = query.where("folderId", "==", currentFolderId);
    }

    query.onSnapshot(snapshot => {
        noteList.innerHTML = "";
        const uniqueNotes = new Map();
        
        // First, get all folders
        db.collection("folders").get().then(foldersSnapshot => {
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

// ----- CREATE -----
async function addNote() {
    if (!currentUser) return;

    const saveBtn = document.querySelector('.save-btn');
    const title = noteTitle.value.trim();
    const content = quill.root.innerHTML;
    const folderId = noteFolder.value;
    
    if (!content) {
        showNotification("Please enter note content", "error");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        await db.collection("notes").add({
            title: title,
            content: content,
            folderId: folderId,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal();
        showNotification("Note added successfully!");
    } catch (error) {
        console.error("Error adding note:", error);
        showNotification("Error adding note. Please try again.", "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    }
}

// ----- UPDATE -----
async function updateNote() {
    const saveBtn = document.querySelector('.save-btn');
    const title = noteTitle.value.trim();
    const content = quill.root.innerHTML;
    
    if (!content) {
        showNotification("Please enter note content", "error");
        return;
    }

    // Disable save button
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        await db.collection("notes").doc(currentNoteId).update({
            title: title,
            content: content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal();
        showNotification("Note updated successfully!");
    } catch (error) {
        console.error("Error updating note:", error);
        showNotification("Error updating note. Please try again.", "error");
    } finally {
        // Re-enable save button
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    }
}

// ----- DELETE -----
function deleteNote(id) {
    if (confirm("Are you sure you want to delete this note?")) {
        db.collection("notes").doc(id).delete()
            .then(() => {
                showNotification("Note deleted successfully!");
            }).catch(error => {
                console.error("Error deleting note:", error);
                showNotification("Error deleting note. Please try again.", "error");
            });
    }
}

// Modal Functions
function openModal() {
    noteModal.style.display = 'block';
    noteTitle.value = '';
    quill.setContents([]);
    currentNoteId = null;
    // Focus on the title input
    noteTitle.focus();
}

function openEditModal(id, title, content, folderId = '') {
    noteModal.style.display = 'block';
    noteTitle.value = title;
    quill.root.innerHTML = content;
    noteFolder.value = folderId;
    currentNoteId = id;
}

function closeModal() {
    noteModal.style.display = 'none';
    noteTitle.value = '';
    quill.setContents([]);
    currentNoteId = null;
}

function saveNote() {
    if (isSaving) {
        return;
    }

    isSaving = true;
    
    if (currentNoteId) {
        updateNote();
    } else {
        addNote();
    }
    
    // Reset the saving flag after a short delay
    setTimeout(() => {
        isSaving = false;
    }, 1000);
}

// Search Functionality
function searchNotes() {
    const searchTerm = searchInput.value.toLowerCase();
    const notes = document.querySelectorAll('.note-item');
    
    notes.forEach(note => {
        const title = note.querySelector('h3').textContent.toLowerCase();
        const content = note.querySelector('.note-text').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            note.style.display = 'block';
        } else {
            note.style.display = 'none';
        }
    });
}

// Notification Function
function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Preview Modal Functions
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
        closePreviewModal();
        openEditModal(currentPreviewNote.id, currentPreviewNote.title, currentPreviewNote.content);
    }
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        hideAuthModal();
        updateUserProfile(user);
        loadFolders();
        loadNotes();
    } else {
        currentUser = null;
        showAuthModal();
        clearUserProfile();
    }
});

// Auth Functions
function showAuthModal() {
    authModal.style.display = 'block';
    // Hide main content
    document.querySelector('.container').style.display = 'none';
}

function hideAuthModal() {
    authModal.style.display = 'none';
    // Show main content
    document.querySelector('.container').style.display = 'block';
}

function updateUserProfile(user) {
    userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
    userName.textContent = user.displayName || user.email;
}

function clearUserProfile() {
    userAvatar.src = '';
    userName.textContent = '';
}

// Google Sign In
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Error signing in with Google:", error);
        showNotification("Error signing in. Please try again.", "error");
    }
}

// Sign Out
async function signOut() {
    try {
        await auth.signOut();
        showNotification("Signed out successfully!");
    } catch (error) {
        console.error("Error signing out:", error);
        showNotification("Error signing out. Please try again.", "error");
    }
}

// Update Firestore Security
function getUserData() {
    return {
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        userName: currentUser?.displayName,
        userPhoto: currentUser?.photoURL
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Quill
    initEditor();
    
    // Initialize the app
    loadFolders();
    loadNotes();
    
    // Add event listeners
    searchInput.addEventListener('input', searchNotes);
    
    // Add note button click handler
    addNoteBtn.addEventListener('click', openModal);
    
    // Save button in modal
    document.querySelector('.save-btn').addEventListener('click', saveNote);
    
    // Cancel button in modal
    document.querySelector('.cancel-btn').addEventListener('click', closeModal);
    
    // Auth event listeners
    googleSignInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == noteModal) {
        closeModal();
    }
    if (event.target == folderModal) {
        closeFolderModal();
    }
    if (event.target == previewModal) {
        closePreviewModal();
    }
}
  