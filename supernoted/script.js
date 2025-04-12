document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    const layouts = document.querySelectorAll('.layout');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.sidebar-header').prepend(mobileMenuBtn);

    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show/hide layouts based on clicked link
            const target = this.textContent.trim();
            layouts.forEach(layout => {
                if (layout.classList.contains(target.toLowerCase() + '-layout')) {
                    layout.style.display = 'block';
                } else {
                    layout.style.display = 'none';
                }
            });
        });
    });

    // Mobile menu toggle functionality
    mobileMenuBtn.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        
        if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Notes page functionality
    const notesContainer = document.querySelector('.notes-container');
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const searchInput = document.getElementById('search-notes');
    const folderFilter = document.getElementById('folder-filter');
    const dateFilter = document.getElementById('date-filter');

    if (notesContainer) {
        // View switching
        gridViewBtn.addEventListener('click', function() {
            notesContainer.classList.remove('list-view');
            notesContainer.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        });

        listViewBtn.addEventListener('click', function() {
            notesContainer.classList.remove('grid-view');
            notesContainer.classList.add('list-view');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
        });

        // Search functionality
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterNotes();
        });

        // Filter functionality
        folderFilter.addEventListener('change', filterNotes);
        dateFilter.addEventListener('change', filterNotes);

        function filterNotes() {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedFolder = folderFilter.value;
            const selectedDate = dateFilter.value;
            const notes = document.querySelectorAll('.note-card');

            notes.forEach(note => {
                const title = note.querySelector('h3').textContent.toLowerCase();
                const content = note.querySelector('.note-content').textContent.toLowerCase();
                const folder = note.querySelector('.note-folder').textContent.toLowerCase();
                const date = note.querySelector('.note-date').textContent;

                const matchesSearch = title.includes(searchTerm) || content.includes(searchTerm);
                const matchesFolder = !selectedFolder || folder === selectedFolder;
                const matchesDate = !selectedDate || isDateInRange(date, selectedDate);

                if (matchesSearch && matchesFolder && matchesDate) {
                    note.style.display = '';
                } else {
                    note.style.display = 'none';
                }
            });
        }

        function isDateInRange(dateString, range) {
            const noteDate = new Date(dateString);
            const today = new Date();
            
            switch(range) {
                case 'today':
                    return noteDate.toDateString() === today.toDateString();
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    return noteDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    return noteDate >= monthAgo;
                default:
                    return true;
            }
        }

        // Initialize grid view as default
        gridViewBtn.classList.add('active');
    }

    // Add mobile menu styles
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 10px;
        }

        @media (max-width: 768px) {
            .mobile-menu-btn {
                display: block;
            }

            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }

            .sidebar.active {
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize the first layout as visible
    layouts[0].style.display = 'block';
}); 