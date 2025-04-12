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
            // Clear the note list first
            noteList.innerHTML = "";
            
            // Create a map to track unique notes
            const uniqueNotes = new Map();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // Use the document ID as the key to ensure uniqueness
                uniqueNotes.set(doc.id, {
                    id: doc.id,
                    title: data.title || 'Untitled Note',
                    content: data.content,
                    createdAt: data.createdAt ? data.createdAt.toDate().toLocaleString() : "No date",
                    updatedAt: data.updatedAt ? data.updatedAt.toDate().toLocaleString() : "Not updated"
                });
            });
            
            // Add unique notes to the list
            uniqueNotes.forEach(note => {
                noteList.innerHTML += `
                    <li class="note-item">
                        <div class="note-content">
                            <h3>${note.title}</h3>
                            <div class="note-text">${note.content}</div>
                            <small>Created: ${note.createdAt}</small>
                            <small>Updated: ${note.updatedAt}</small>
                        </div>
                        <div class="note-actions">
                            <button class="edit-btn" onclick="openEditModal('${note.id}', '${note.title.replace(/'/g, "\\'")}', '${note.content.replace(/'/g, "\\'")}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" onclick="deleteNote('${note.id}')">
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
async function addNote() {
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
        await db.collection("notes").add({
            title: title,
            content: content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal();
        showNotification("Note added successfully!");
    } catch (error) {
        console.error("Error adding note:", error);
        showNotification("Error adding note. Please try again.", "error");
    } finally {
        // Re-enable save button
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
  