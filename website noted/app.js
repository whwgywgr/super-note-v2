let currentNoteId = null;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    sidebar.classList.toggle('w-16');
    mainContent.classList.toggle('ml-16');
    
    // Toggle text visibility
    document.querySelectorAll('.nav-text').forEach(el => el.classList.toggle('hidden'));
    document.querySelector('.title-text').classList.toggle('hidden');
    
    // Update padding for collapsed state
    if (sidebar.classList.contains('w-16')) {
        sidebar.classList.add('px-2');
    } else {
        sidebar.classList.remove('px-2');
    }
}

function toggleThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    dropdown.classList.toggle('hidden');
}

function changeTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    document.body.className = `font-sans m-0 p-0 leading-relaxed flex transition-all duration-300 bg-${themeName}-bg text-${themeName}-text`;
    
    // Update active state in theme options
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-theme') === themeName) {
            option.classList.add('active');
        }
    });

    // Update sidebar and content colors
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    sidebar.className = `w-64 h-screen bg-${themeName}-sidebar p-5 fixed left-0 top-0 shadow-lg transition-all duration-300 flex flex-col`;
    mainContent.className = `max-w-7xl ml-72 p-5 transition-all duration-300`;

    // Close dropdown
    document.getElementById('themeDropdown').classList.add('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('themeDropdown');
    const button = document.querySelector('.theme-selector-button');
    if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

function showNewNoteModal() {
    // Clear form data
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteTags').value = '';
    document.getElementById('markdownSupport').checked = false;
    
    document.getElementById('newNoteModal').classList.remove('hidden');
}

function closeNewNoteModal() {
    document.getElementById('newNoteModal').classList.add('hidden');
}

function showNewFolderModal() {
    // Clear form data
    document.getElementById('folderName').value = '';
    document.getElementById('newFolderModal').classList.remove('hidden');
}

function closeNewFolderModal() {
    document.getElementById('newFolderModal').classList.add('hidden');
}

function setViewMode(mode) {
    const container = document.getElementById('notesContainer');
    container.className = `notes-container ${mode}-view`;
}

function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const tags = document.getElementById('noteTags').value.split(',').map(tag => tag.trim());
    const useMarkdown = document.getElementById('markdownSupport').checked;

    if (title) {
        const note = {
            id: Date.now(),
            title,
            content,
            tags,
            useMarkdown,
            createdAt: new Date(),
            isPinned: false
        };

        // Save to localStorage
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));

        // Update UI
        addNoteToUI(note);
        closeNewNoteModal();
    }
}

function createFolder() {
    const name = document.getElementById('folderName').value;
    if (name) {
        const folder = {
            id: Date.now(),
            name,
            notes: []
        };

        // Save to localStorage
        const folders = JSON.parse(localStorage.getItem('folders') || '[]');
        folders.push(folder);
        localStorage.setItem('folders', JSON.stringify(folders));

        // Update UI
        addFolderToUI(folder);
        closeNewFolderModal();
    }
}

function addNoteToUI(note) {
    const container = document.getElementById('notesContainer');
    const noteElement = document.createElement('div');
    noteElement.className = 'note bg-blue-sky-card border border-blue-sky-border rounded p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow';
    noteElement.innerHTML = `
        <div class="flex justify-between items-start">
            <h3 class="text-lg font-bold">${note.title}</h3>
            <div class="flex gap-2">
                <button class="pin-button ${note.isPinned ? 'text-yellow-500' : 'text-gray-400'}" onclick="togglePin(${note.id})">
                    <i class="fas fa-thumbtack"></i>
                </button>
                <button class="text-blue-sky-accent hover:text-blue-sky-buttonHover" onclick="editNote(${note.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-500 hover:text-red-700" onclick="deleteNote(${note.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="note-preview mt-2 text-sm text-gray-600" onclick="showNotePreview(${note.id})">
            ${note.content.substring(0, 100)}...
        </div>
        <div class="tags mt-2">
            ${note.tags.map(tag => `<span class="tag bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">${tag}</span>`).join('')}
        </div>
    `;
    container.appendChild(noteElement);
}

function addFolderToUI(folder) {
    const container = document.getElementById('foldersContainer');
    const folderElement = document.createElement('div');
    folderElement.className = 'folder bg-blue-sky-card border border-blue-sky-border rounded p-4 mb-4';
    folderElement.innerHTML = `
        <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold">📁 ${folder.name}</h3>
            <div class="folder-actions">
                <button class="text-blue-sky-accent hover:text-blue-sky-buttonHover mr-2" onclick="renameFolder(${folder.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-500 hover:text-red-700" onclick="deleteFolder(${folder.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="folder-notes mt-2" id="folder-${folder.id}">
            <!-- Notes will be added here -->
        </div>
    `;
    container.appendChild(folderElement);
}

function showNotePreview(noteId) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const note = notes.find(n => n.id === noteId);
    if (note) {
        document.getElementById('previewNoteTitle').textContent = note.title;
        document.getElementById('previewNoteContent').innerHTML = note.content;
        document.getElementById('previewNoteTags').innerHTML = note.tags.map(tag => 
            `<span class="tag bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">${tag}</span>`
        ).join('');
        document.getElementById('notePreviewModal').classList.remove('hidden');
    }
}

function closeNotePreview() {
    document.getElementById('notePreviewModal').classList.add('hidden');
}

function editNote(noteId) {
    currentNoteId = noteId;
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const note = notes.find(n => n.id === noteId);
    if (note) {
        document.getElementById('editNoteTitle').value = note.title;
        document.getElementById('editNoteContent').value = note.content;
        document.getElementById('editNoteTags').value = note.tags.join(', ');
        document.getElementById('editMarkdownSupport').checked = note.useMarkdown;
        document.getElementById('editNoteModal').classList.remove('hidden');
    }
}

function closeEditNoteModal() {
    document.getElementById('editNoteModal').classList.add('hidden');
}

function updateNote() {
    const title = document.getElementById('editNoteTitle').value;
    const content = document.getElementById('editNoteContent').value;
    const tags = document.getElementById('editNoteTags').value.split(',').map(tag => tag.trim());
    const useMarkdown = document.getElementById('editMarkdownSupport').checked;

    if (title) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const noteIndex = notes.findIndex(n => n.id === currentNoteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = {
                ...notes[noteIndex],
                title,
                content,
                tags,
                useMarkdown
            };
            localStorage.setItem('notes', JSON.stringify(notes));
            refreshNotesUI();
            closeEditNoteModal();
        }
    }
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const updatedNotes = notes.filter(n => n.id !== noteId);
        localStorage.setItem('notes', JSON.stringify(updatedNotes));
        refreshNotesUI();
    }
}

function refreshNotesUI() {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.forEach(note => addNoteToUI(note));
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Load saved notes and folders
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const folders = JSON.parse(localStorage.getItem('folders') || '[]');

    notes.forEach(note => addNoteToUI(note));
    folders.forEach(folder => addFolderToUI(folder));

    // Set up search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const notes = document.querySelectorAll('.note');
        notes.forEach(note => {
            const title = note.querySelector('h3').textContent.toLowerCase();
            const content = note.querySelector('.note-preview').textContent.toLowerCase();
            if (title.includes(searchTerm) || content.includes(searchTerm)) {
                note.style.display = '';
            } else {
                note.style.display = 'none';
            }
        });
    });
}); 