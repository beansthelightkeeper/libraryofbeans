document.addEventListener('DOMContentLoaded', () => {
    // --- USER CONFIGURATION ---
    const GITHUB_USERNAME = "beansthelightkeeper";
    const GITHUB_REPO = "libraryofbeans";
    const LIBRARY_ROOT = 'content/';
    const METADATA_FILE = 'library_meta.json';

    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const fileListContainer = document.getElementById('file-list-container');
    const contentFrame = document.getElementById('content-frame');
    const welcomeMessage = document.getElementById('welcome-message');
    const drawingCanvas = document.getElementById('pdf-drawing-canvas');
    const drawingCtx = drawingCanvas.getContext('2d');
    
    // Header Tool Containers
    const htmlTxtControls = document.getElementById('html-txt-controls');
    const pdfControls = document.getElementById('pdf-controls');

    // Header Tools
    const eraseModeToggle = document.getElementById('erase-mode-toggle');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const annotationsToggle = document.getElementById('annotations-toggle');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const lineHeightSlider = document.getElementById('line-height-slider');
    const highlightThicknessSlider = document.getElementById('highlight-thickness-slider');
    const colorSwatches = document.querySelectorAll('.rh-actions .color-swatch');

    // Annotations Panel & Modal
    const annotationsPanel = document.getElementById('annotations-panel');
    const annotationsList = document.getElementById('annotations-list');
    const bookmarksList = document.getElementById('bookmarks-list');
    const tabs = document.querySelectorAll('.annotations-panel .tab-link');
    const noteModalOverlay = document.getElementById('note-modal-overlay');
    const noteModalTextarea = document.getElementById('note-modal-textarea');
    const noteModalSave = document.getElementById('note-modal-save');
    const noteModalCancel = document.getElementById('note-modal-cancel');

    // EPUB Elements
    const epubReaderArea = document.getElementById('epub-reader-area');
    const epubViewer = document.getElementById('epub-viewer');
    const epubPrev = document.getElementById('epub-prev');
    const epubNext = document.getElementById('epub-next');

    // Search & Filter
    const searchBar = document.getElementById('search-bar');
    const filterType = document.getElementById('filter-type');
    const hideUncategorized = document.getElementById('hide-uncategorized');

    // --- App State ---
    const state = {
        currentFile: null,
        currentBook: null, // For EPUB.js instance
        isDrawing: false,
        drawPoints: [],
        currentNoteCallback: null,
        allFiles: [], // To store the master list of files
        metadata: {}, // To store file metadata
        settings: {
            theme: 'dark',
            fontSize: 16,
            lineHeight: 1.7,
            highlightThickness: 15,
            sidebarMinimized: false,
            activeHighlightColor: 'yellow',
        },
        annotations: {},
        bookmarks: {},
    };
    
    const ICONS = { sun: '☀', moon: '☾' };

    async function initialize() {
        loadSettings();
        loadAnnotations();
        loadBookmarks();
        await loadMetadata();
        applySettings();
        await fetchAndOrganizeFiles();
        setupEventListeners();
        renderAllBookmarks();
        toggleReaderTools(false);
    }

    function setupEventListeners() {
        themeToggle.addEventListener('click', toggleTheme);
        sidebarToggleBtn.addEventListener('click', toggleSidebarMinimize);
        eraseModeToggle.addEventListener('click', toggleEraseMode);
        addBookmarkBtn.addEventListener('click', addBookmark);
        annotationsToggle.addEventListener('click', () => annotationsPanel.classList.toggle('open'));
        fontSizeSlider.addEventListener('input', e => updateSetting('fontSize', e.target.value, updateIframeStyles));
        lineHeightSlider.addEventListener('input', e => updateSetting('lineHeight', e.target.value, updateIframeStyles));
        highlightThicknessSlider.addEventListener('input', e => updateSetting('highlightThickness', e.target.value));
        contentFrame.addEventListener('load', onIframeLoad);
        colorSwatches.forEach(swatch => swatch.addEventListener('click', handleColorChange));
        tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
        noteModalSave.addEventListener('click', () => {
            if (state.currentNoteCallback) state.currentNoteCallback(noteModalTextarea.value);
            hideNoteModal();
        });
        noteModalCancel.addEventListener('click', hideNoteModal);
        
        // Drawing canvas listeners (for freehand drawing)
        drawingCanvas.addEventListener('mousedown', startDrawing);
        drawingCanvas.addEventListener('mousemove', draw);
        drawingCanvas.addEventListener('mouseup', endDrawing);
        drawingCanvas.addEventListener('mouseleave', endDrawing);

        // EPUB Navigation
        epubPrev.addEventListener('click', () => state.currentBook?.prev());
        epubNext.addEventListener('click', () => state.currentBook?.next());

        // Search and Filter Listeners
        searchBar.addEventListener('input', applyFilters);
        filterType.addEventListener('change', applyFilters);
        hideUncategorized.addEventListener('change', applyFilters);
    }

    // --- NEW: Load Metadata from JSON file ---
    async function loadMetadata() {
        try {
            const response = await fetch(METADATA_FILE);
            if (!response.ok) throw new Error('Metadata file not found');
            state.metadata = await response.json();
        } catch (error) {
            console.warn("Could not load metadata file:", error);
            state.metadata = {};
        }
    }
    
    // --- NEW: Filter Logic ---
    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        const type = filterType.value;
        const hide = hideUncategorized.checked;
        
        const filteredFiles = state.allFiles.filter(file => {
            const meta = state.metadata[file.path] || {};
            
            // Hide uncategorized check
            if (hide && !state.metadata[file.path]) return false;

            // File type check
            const fileExt = file.path.split('.').pop();
            if (type !== 'all' && fileExt !== type) return false;
            
            // Search term check
            const title = meta.title || file.name;
            const author = meta.author || '';
            const subjects = (meta.subjects || []).join(' ');

            return (
                file.name.toLowerCase().includes(searchTerm) ||
                title.toLowerCase().includes(searchTerm) ||
                author.toLowerCase().includes(searchTerm) ||
                subjects.toLowerCase().includes(searchTerm)
            );
        });

        renderFileList(filteredFiles);
    }
    
    function handleTabClick(e) {
        // ... (no changes)
    }

    // --- UPDATED: PDF Rendering ---
    async function renderPdfInIframe(url) {
        // ... (no changes to this function's internals)
    }

    function onIframeLoad() {
        // ... (no changes)
    }

    function setupIframeListeners() {
        // ... (no changes)
    }
    
    // --- UPDATED: Apply Settings ---
    function applySettings() {
        document.body.classList.toggle('dark-mode', state.settings.theme === 'dark');
        themeToggle.textContent = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        fontSizeSlider.value = state.settings.fontSize;
        lineHeightSlider.value = state.settings.lineHeight;
        highlightThicknessSlider.value = state.settings.highlightThickness;
        sidebar.classList.toggle('minimized', state.settings.sidebarMinimized);
        // The button is no longer a sibling of main-content
        document.querySelector('.sidebar-toggle-btn').classList.toggle('minimized', state.settings.sidebarMinimized);
        eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        colorSwatches.forEach(s => s.classList.toggle('active', !state.isEraseModeActive && s.dataset.color === state.settings.activeHighlightColor));
        updateIframeStyles();
    }
    
    function toggleTheme() { updateSetting('theme', state.settings.theme === 'dark' ? 'light' : 'dark', applySettings); }
    function toggleSidebarMinimize() { updateSetting('sidebarMinimized', !state.settings.sidebarMinimized, applySettings); }
    function handleColorChange(e) {
        // ... (no changes)
    }

    // --- UPDATED: Iframe Styling (now handles EPUB styles) ---
    function updateIframeStyles() {
        // For HTML/TXT files in iframe
        const iframeDoc = contentFrame.contentDocument;
        if (iframeDoc && iframeDoc.head) {
            let style = iframeDoc.getElementById('dynamic-reader-styles');
            if (!style) { style = iframeDoc.createElement('style'); style.id = 'dynamic-reader-styles'; iframeDoc.head.appendChild(style); }
            const computed = getComputedStyle(document.body);
            // ... (style.innerHTML remains the same)
        }
        // For EPUB files
        if (state.currentBook) {
            const theme = {
                body: {
                    'color': getComputedStyle(document.body).getPropertyValue('--text-primary'),
                    'font-size': `${state.settings.fontSize}px !important`,
                    'line-height': `${state.settings.lineHeight} !important`,
                    'font-family': `'Arimo', sans-serif !important`
                }
            };
            state.currentBook.themes.register("custom", theme);
            state.currentBook.themes.select("custom");
        }
    }

    // --- UPDATED: Fetch Files (now supports .epub and .txt) ---
    async function fetchAndOrganizeFiles() {
    // These constants must match your GitHub details
    const GITHUB_USERNAME = "beansthelightkeeper";
    const GITHUB_REPO = "libraryofbeans";
    const LIBRARY_ROOT = 'content/';

    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/git/trees/main?recursive=1`;
    
    try {
        fileListContainer.innerHTML = '<p>Loading library from GitHub...</p>';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            // This will catch errors like 404 Not Found or 403 Forbidden
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Ensure the 'tree' property exists before trying to use it
        if (!data.tree) {
            throw new Error("Invalid API response from GitHub: 'tree' object not found.");
        }

        state.allFiles = data.tree
            .filter(item => item.type === 'blob' && /\.(html|pdf|epub|txt)$/i.test(item.path) && item.path.startsWith(LIBRARY_ROOT))
            .map(item => ({
                name: item.path.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf|epub|txt)$/i, '').replace(/_/g, ' '),
                path: item.path
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
            
        renderFileList(state.allFiles);

    } catch (error) {
        console.error("Failed to fetch files from GitHub:", error);
        // This part is new: it displays the error directly in the sidebar!
        fileListContainer.innerHTML = `
            <div style="padding: 10px; color: #ff6b6b;">
                <strong>Could not load library.</strong>
                <p style="font-size: 0.9em; word-wrap: break-word;">Error: ${error.message}</p>
                <p style="font-size: 0.8em; margin-top: 15px;">See the "Common Errors" section below for help.</p>
            </div>`;
    }
    }
    
    // --- UPDATED: Render File List (uses metadata) ---
    function renderFileList(files) {
        const ul = document.createElement('ul');
        if (files.length > 0) {
            const icons = ['☤', '☥', '☧', '☩', '♁', '⚚', '⚛'];
            files.forEach((file, i) => {
                const meta = state.metadata[file.path] || {};
                const displayName = meta.title || file.name;
                const displayAuthor = meta.author ? `<div class="file-author">${meta.author}</div>` : '';

                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.path = file.path;
                a.innerHTML = `<span class="file-icon">${icons[i % icons.length]}</span><div><span class="file-name">${displayName}</span>${displayAuthor}</div>`;
                a.onclick = (e) => { e.preventDefault(); loadFile(file.path); };
                li.appendChild(a);
                ul.appendChild(li);
            });
        } else {
             ul.innerHTML = '<li>No matching files found.</li>';
        }
        fileListContainer.innerHTML = ''; fileListContainer.appendChild(ul);
    }

    // --- UPDATED: Load File (handles all file types) ---
    async function loadFile(fullPath) {
        if (state.currentFile === fullPath) return;
        state.currentFile = fullPath;
        state.currentBook = null;
        
        // UI updates
        welcomeMessage.style.display = 'none';
        document.querySelectorAll('#file-list-container li.active').forEach(el => el.classList.remove('active'));
        document.querySelector(`#file-list-container a[data-path="${fullPath}"]`)?.parentElement.classList.add('active');
        
        // Hide all content viewers initially
        contentFrame.style.display = 'none';
        epubReaderArea.style.display = 'none';
        drawingCanvas.classList.remove('active');

        const url = `./${fullPath}`;
        const fileType = fullPath.split('.').pop().toLowerCase();

        // Show/hide correct controls
        htmlTxtControls.classList.toggle('hidden', fileType === 'pdf' || fileType === 'epub');
        pdfControls.classList.toggle('hidden', fileType !== 'pdf');

        try {
            if (fileType === 'pdf') {
                contentFrame.style.display = 'block';
                contentFrame.srcdoc = '<p style="text-align:center;padding:2rem;">Loading PDF...</p>';
                await renderPdfInIframe(url);
            } else if (fileType === 'epub') {
                epubReaderArea.style.display = 'block';
                state.currentBook = window.ePub(url);
                await state.currentBook.renderTo(epubViewer, { width: "100%", height: "100%" });
                updateIframeStyles(); // Apply custom theme
            } else if (fileType === 'txt') {
                contentFrame.style.display = 'block';
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const text = await response.text();
                // Format TXT by wrapping paragraphs in <p> tags
                const htmlContent = text.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
                contentFrame.srcdoc = `<html><head></head><body>${htmlContent}</body></html>`;
            } else { // HTML
                contentFrame.style.display = 'block';
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                contentFrame.srcdoc = await response.text();
            }
            toggleReaderTools(true);
        } catch (error) { 
            contentFrame.style.display = 'block';
            contentFrame.srcdoc = `<h2>Error</h2><p>${error.message}</p>`; 
        }
        renderAnnotationsForCurrentFile();
        renderAllBookmarks();
    }
    
    function toggleReaderTools(enabled) {
        // ... (no changes)
    }
    
    function toggleEraseMode() { updateSetting('isEraseModeActive', !state.isEraseModeActive, applySettings); }
    
    function showNoteModal(initialText = '', callback) {
        // ... (no changes)
    }
    function hideNoteModal() { /* ... (no changes) */ }
    function handleIframeInteraction(event) {
        // ... (no changes)
    }
    function editAnnotationNote(annotationId) {
        // ... (no changes)
    }
    function createAnnotationFromSelection() {
        // ... (no changes)
    }
    function saveAndApplyAnnotation(annotation) {
        // ... (no changes)
    }
    function eraseAnnotation(target) {
        // ... (no changes)
    }
    
    // --- UPDATED: Apply Annotations (handles new freehand type) ---
    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        if (annotation.rangeData.type === 'pdf-freehand') {
            const pageDiv = iframeDoc.querySelector(`.page-container[data-page-number="${annotation.rangeData.page}"]`);
            if (!pageDiv) return;

            const canvas = iframeDoc.createElement('canvas');
            canvas.id = annotation.id;
            canvas.className = 'pdf-drawn-highlight'; // Generic class, color applied via strokeStyle
            canvas.style.cssText = `left:${annotation.rangeData.bounds.x}px; top:${annotation.rangeData.bounds.y}px; pointer-events:all; cursor:pointer;`;
            canvas.width = annotation.rangeData.bounds.width;
            canvas.height = annotation.rangeData.bounds.height;
            canvas.title = annotation.note || "Click to add a note";
            pageDiv.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue(`--highlight-${annotation.color}`);
            ctx.lineWidth = annotation.rangeData.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(annotation.rangeData.points[0].x, annotation.rangeData.points[0].y);
            for (let i = 1; i < annotation.rangeData.points.length; i++) {
                ctx.lineTo(annotation.rangeData.points[i].x, annotation.rangeData.points[i].y);
            }
            ctx.stroke();

        } else if (annotation.rangeData.type === 'html') {
            // ... (no changes)
        }
    }

    function applyAnnotationsForCurrentFile() {
        if (!state.currentFile) return;
        (state.annotations[state.currentFile] || []).forEach(applyAnnotationToDOM);
    }
    function renderAnnotationsForCurrentFile() {
        // ... (no changes)
    }
    function addBookmark() {
        // ... (no changes)
    }

    // --- UPDATED: Render Bookmarks (uses metadata) ---
    function renderAllBookmarks() {
        bookmarksList.innerHTML = '';
        const allBookmarks = Object.values(state.bookmarks).flat();
        if (allBookmarks.length === 0) { bookmarksList.innerHTML = '<li>No bookmarks yet.</li>'; return; }
        allBookmarks.forEach(bm => {
            const meta = state.metadata[bm.file] || {};
            const title = meta.title || bm.file.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf|epub|txt)$/i,'');
            const author = meta.author ? `<div class="bookmark-author">${meta.author}</div>` : '';

            const li = document.createElement('li');
            li.innerHTML = `<div class="bookmark-title">${title}</div>${author}<div class="bookmark-snippet">${bm.snippet}</div>`;
            li.onclick = () => {
                state.targetScrollY = bm.scrollY;
                if (state.currentFile !== bm.file) {
                    loadFile(bm.file);
                } else {
                    contentFrame.contentWindow.scrollTo({ top: bm.scrollY, behavior: 'smooth' });
                }
            };
            bookmarksList.appendChild(li);
        });
    }

    // --- UPDATED: PDF Drawing Canvas Logic (now for freehand lines) ---
    function syncDrawingCanvasSize() {
        // ... (no changes)
    }

    function startDrawing(e) {
        if (!state.currentFile || !state.currentFile.toLowerCase().endsWith('.pdf') || state.isEraseModeActive) return;
        state.isDrawing = true;
        drawingCanvas.classList.add('active');
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        
        drawingCtx.strokeStyle = getComputedStyle(document.body).getPropertyValue(`--highlight-${state.settings.activeHighlightColor}`);
        drawingCtx.lineWidth = state.settings.highlightThickness;
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';

        const rect = drawingCanvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        state.drawPoints = [pos];
        drawingCtx.beginPath();
        drawingCtx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        if (!state.isDrawing) return;
        const rect = drawingCanvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        state.drawPoints.push(pos);
        drawingCtx.lineTo(pos.x, pos.y);
        drawingCtx.stroke();
    }
    
    function endDrawing(e) {
        if (!state.isDrawing) return;
        state.isDrawing = false;
        drawingCanvas.classList.remove('active');
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        if (state.drawPoints.length < 2) return;

        // Find which page the highlight is on
        const iframeDoc = contentFrame.contentDocument;
        const scrollY = contentFrame.contentWindow.scrollY;
        
        // Calculate bounding box of the drawn line
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.drawPoints.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        let targetPage = null;
        const pageContainers = iframeDoc.querySelectorAll('.page-container');
        for (const page of pageContainers) {
            if (minY + scrollY >= page.offsetTop && minY + scrollY <= page.offsetTop + page.offsetHeight) {
                targetPage = page;
                break;
            }
        }
        if (!targetPage) return;

        const pageRect = targetPage.getBoundingClientRect();
        const canvasRect = drawingCanvas.getBoundingClientRect();
        
        // Normalize points relative to the bounding box's top-left corner
        const normalizedPoints = state.drawPoints.map(p => ({
            x: p.x - minX,
            y: p.y - minY
        }));
        
        const annotationId = `anno-${Date.now()}`;
        const annotation = {
            id: annotationId,
            text: "[Freehand Annotation]",
            rangeData: {
                type: 'pdf-freehand',
                page: targetPage.dataset.pageNumber,
                thickness: state.settings.highlightThickness,
                points: normalizedPoints,
                bounds: { // Bounding box relative to the page div
                    x: minX - (pageRect.left - canvasRect.left),
                    y: minY - (pageRect.top - canvasRect.top),
                    width: maxX - minX,
                    height: maxY - minY,
                }
            },
            note: '',
            color: state.settings.activeHighlightColor
        };
        
        showNoteModal('', (note) => {
            annotation.note = note;
            saveAndApplyAnnotation(annotation);
        });
    }

    // --- UTILITY & STORAGE --- (no changes below this line)
    function updateSetting(key, value, callback) { state.settings[key] = value; saveSettings(); if(callback) callback(); }
    function findAnnotation(id) { return (state.annotations[state.currentFile] || []).find(a => a.id === id); }
    function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    function loadData(key) { return JSON.parse(localStorage.getItem(key) || '{}'); }
    function saveSettings() { saveData('beansReaderSettings_v6', state.settings); }
    function loadSettings() { Object.assign(state.settings, loadData('beansReaderSettings_v6')); }
    function saveAnnotations() { saveData('beansReaderAnnotations_v6', state.annotations); }
    function loadAnnotations() { Object.assign(state.annotations, loadData('beansReaderAnnotations_v6')); }
    function saveBookmarks() { saveData('beansReaderBookmarks_v6', state.bookmarks); }
    function loadBookmarks() { Object.assign(state.bookmarks, loadData('beansReaderBookmarks_v6')); }
    function getPathTo(node, doc) { /* ... */ }
    function getNodeByPath(path, doc) { /* ... */ }
    function serializeHtmlRange(range, doc) { /* ... */ }
    function deserializeHtmlRange(rangeData, doc) { /* ... */ }

    initialize();
});