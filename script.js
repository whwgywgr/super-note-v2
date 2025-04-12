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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const noteList = document.getElementById('noteList');
const noteModal = document.getElementById('noteModal');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const searchInput = document.getElementById('searchInput');
const addNoteBtn = document.querySelector('.add-note-btn');
let currentNoteId = null;
let quill = null;

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

// ----- READ -----
function loadNotes() {
    // Set up real-time listener
    db.collection("notes")
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
            noteList.innerHTML = "";
            snapshot.forEach(doc => {
                const data = doc.data();
                const createdAt = data.createdAt ? data.createdAt.toDate().toLocaleString() : "No date";
                const updatedAt = data.updatedAt ? data.updatedAt.toDate().toLocaleString() : "Not updated";
                
                noteList.innerHTML += `
                    <li class="note-item">
                        <div class="note-content">
                            <h3>${data.title || 'Untitled Note'}</h3>
                            <div class="note-text">${data.content}</div>
                            <small>Created: ${createdAt}</small>
                            <small>Updated: ${updatedAt}</small>
                        </div>
                        <div class="note-actions">
                            <button class="edit-btn" onclick="openEditModal('${doc.id}', '${data.title || ''}', '${data.content}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" onclick="deleteNote('${doc.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </li>`;
            });
        }, error => {
            console.error("Error loading notes:", error);
            showNotification("Error loading notes. Please try again.", "error");
        });
}

// ----- CREATE -----
function addNote() {
    const title = noteTitle.value.trim();
    const content = quill.root.innerHTML;
    
    if (!content) {
        showNotification("Please enter note content", "error");
        return;
    }

    db.collection("notes").add({
        title: title,
        content: content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        closeModal();
        showNotification("Note added successfully!");
    }).catch(error => {
        console.error("Error adding note:", error);
        showNotification("Error adding note. Please try again.", "error");
    });
}

// ----- UPDATE -----
function updateNote() {
    const title = noteTitle.value.trim();
    const content = quill.root.innerHTML;
    
    if (!content) {
        showNotification("Please enter note content", "error");
        return;
    }

    db.collection("notes").doc(currentNoteId).update({
        title: title,
        content: content,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        closeModal();
        showNotification("Note updated successfully!");
    }).catch(error => {
        console.error("Error updating note:", error);
        showNotification("Error updating note. Please try again.", "error");
    });
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
}

function openEditModal(id, title, content) {
    noteModal.style.display = 'block';
    noteTitle.value = title;
    quill.root.innerHTML = content;
    currentNoteId = id;
}

function closeModal() {
    noteModal.style.display = 'none';
    noteTitle.value = '';
    quill.setContents([]);
    currentNoteId = null;
}

function saveNote() {
    if (currentNoteId) {
        updateNote();
    } else {
        addNote();
    }
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Quill
    initEditor();
    
    // Initialize the app
    loadNotes();
    
    // Add event listeners
    searchInput.addEventListener('input', searchNotes);
    
    // Add note button click handler
    addNoteBtn.addEventListener('click', openModal);
    
    // Save button in modal
    document.querySelector('.save-btn').addEventListener('click', saveNote);
    
    // Cancel button in modal
    document.querySelector('.cancel-btn').addEventListener('click', closeModal);
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == noteModal) {
        closeModal();
    }
}
  