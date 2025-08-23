document.addEventListener('DOMContentLoaded', () => {
    // --- USER CONFIGURATION ---
    const GITHUB_USERNAME = "beansthelightkeeper";
    const GITHUB_REPO = "libraryofbeans";
    // --- END OF CONFIGURATION ---

    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const minimizeToggle = document.getElementById('minimize-toggle');
    const rainbowToggle = document.getElementById('rainbow-toggle');
    const sidebar = document.querySelector('.sidebar');
    const fileListContainer = document.getElementById('file-list-container');
    const contentFrame = document.getElementById('content-frame');
    const welcomeMessage = document.getElementById('welcome-message');
    const highlightModeToggle = document.getElementById('highlight-mode-toggle');
    const eraseModeToggle = document.getElementById('erase-mode-toggle');
    // MODIFIED: Old bookmark button is now the add-note button
    const addNoteBtn = document.getElementById('add-note-btn');
    // MODIFIED: Renamed bookmarks list
    const annotationsList = document.getElementById('annotations-list');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const colorSwatches = document.getElementById('highlighter-colors');
    const doubleSpaceToggle = document.getElementById('double-space-toggle');
    const marginSlider = document.getElementById('margin-slider');
    const bookmarkGutterToggle = document.getElementById('bookmark-gutter-toggle');
    const bookmarkGutter = document.getElementById('bookmark-gutter');
    // NEW: Collapsible library section elements
    const librarySectionHeader = document.getElementById('library-section-header');
    const fileNavigation = document.getElementById('file-navigation');

    // --- App State ---
    const state = {
        currentFile: null,
        isHighlightModeActive: false,
        isEraseModeActive: false,
        settings: {
            theme: 'dark',
            fontSize: 16,
            sidebarMinimized: false,
            activeHighlightColor: 'yellow',
            isDoubleSpaced: false,
            isRainbowFxOn: true,
            marginSize: 10,
            showBookmarkGutter: true,
        },
        annotations: {},
    };
    
    // --- ICONS & COLORS ---
    const ICONS = {
        sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
    };
    const HIGHLIGHT_COLORS = {
        yellow: '--highlight-yellow', pink: '--highlight-pink',
        green: '--highlight-green', blue: '--highlight-blue',
    };

    // --- INITIALIZATION ---
    function initialize() {
        loadSettings();
        loadAnnotations();
        applySettings();
        fetchAndOrganizeFiles();
        setupEventListeners();
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        themeToggle.addEventListener('click', toggleTheme);
        minimizeToggle.addEventListener('click', toggleSidebarMinimize);
        rainbowToggle.addEventListener('click', toggleRainbowFx);
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        highlightModeToggle.addEventListener('click', toggleHighlightMode);
        eraseModeToggle.addEventListener('click', toggleEraseMode);
        // MODIFIED: Event listener for the new add note button
        addNoteBtn.addEventListener('click', addNoteToSelection);
        fontSizeSlider.addEventListener('input', handleFontSizeChange);
        colorSwatches.addEventListener('click', handleColorChange);
        doubleSpaceToggle.addEventListener('click', toggleDoubleSpacing);
        marginSlider.addEventListener('input', handleMarginChange);
        bookmarkGutterToggle.addEventListener('click', toggleBookmarkGutter);
        contentFrame.addEventListener('load', onIframeLoad);
        // NEW: Event listener for collapsing the library
        librarySectionHeader.addEventListener('click', () => {
            librarySectionHeader.parentElement.classList.toggle('collapsed');
        });
    }

    function onIframeLoad() {
        updateIframeStyles();
        setupIframeListeners();
        applyAnnotations();
        renderAnnotations(); // MODIFIED: was renderBookmarks
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        iframeDoc.addEventListener('pointerup', handleIframeInteraction);
        // MODIFIED: Logic now enables the 'Add Note' button
        iframeDoc.addEventListener('selectionchange', () => {
            const selection = iframeDoc.getSelection();
            addNoteBtn.disabled = !selection || selection.isCollapsed;
        });
    }
    
    // ... (keep the applySettings, toggleTheme, etc. functions as they are) ...
    // --- SETTINGS & UI UPDATES ---
    function applySettings() {
        document.body.dataset.theme = state.settings.theme;
        themeToggle.innerHTML = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        fontSizeSlider.value = state.settings.fontSize;
        marginSlider.value = state.settings.marginSize;
        sidebar.classList.toggle('minimized', state.settings.sidebarMinimized);
        doubleSpaceToggle.classList.toggle('active', state.settings.isDoubleSpaced);
        bookmarkGutterToggle.classList.toggle('active', state.settings.showBookmarkGutter);
        rainbowToggle.classList.toggle('active', state.settings.isRainbowFxOn);
        document.body.classList.toggle('no-fx', !state.settings.isRainbowFxOn);
        document.body.classList.toggle('gutter-visible', state.settings.showBookmarkGutter);
        
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color === state.settings.activeHighlightColor);
        });
        updateIframeStyles();
    }

    function toggleTheme() {
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        applySettings(); saveSettings();
    }
    function toggleSidebarMinimize() {
        state.settings.sidebarMinimized = !state.settings.sidebarMinimized;
        applySettings(); saveSettings();
    }
    function toggleRainbowFx() {
        state.settings.isRainbowFxOn = !state.settings.isRainbowFxOn;
        applySettings(); saveSettings();
    }
    function handleFontSizeChange(e) {
        state.settings.fontSize = e.target.value;
        updateIframeStyles(); saveSettings();
    }
    function handleColorChange(e) {
        const target = e.target.closest('.color-swatch');
        if (!target) return;
        state.settings.activeHighlightColor = target.dataset.color;
        applySettings(); saveSettings();
    }
    function toggleDoubleSpacing() {
        state.settings.isDoubleSpaced = !state.settings.isDoubleSpaced;
        applySettings(); saveSettings();
    }
    function handleMarginChange(e) {
        state.settings.marginSize = e.target.value;
        updateIframeStyles(); saveSettings();
    }
    function toggleBookmarkGutter() {
        state.settings.showBookmarkGutter = !state.settings.showBookmarkGutter;
        applySettings(); renderAnnotations(); saveSettings();
    }
    
    // ... (keep updateIframeStyles function as it is) ...
    function updateIframeStyles() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc || !iframeDoc.head) return;
        let style = iframeDoc.getElementById('dynamic-reader-styles');
        if (!style) {
            style = iframeDoc.createElement('style');
            style.id = 'dynamic-reader-styles';
            iframeDoc.head.appendChild(style);
        }
        const computedStyles = getComputedStyle(document.body);
        const bookmarkColor = computedStyles.getPropertyValue('--bookmark'); // This can stay for gutter color
        const textColor = computedStyles.getPropertyValue('--text-primary');
        const bodyBgColor = computedStyles.getPropertyValue('--bg-secondary');
        const lineHeight = state.settings.isDoubleSpaced ? '2.0' : '1.6';
        const margin = `${state.settings.marginSize}%`;
        const highlightStyles = Object.entries(HIGHLIGHT_COLORS).map(([name, cssVar]) => {
            return `.highlight-${name} { background-color: ${computedStyles.getPropertyValue(cssVar)}; color: inherit; }`;
        }).join('\n');
        style.innerHTML = `
            body {
                color: ${textColor}; background-color: ${bodyBgColor};
                line-height: ${lineHeight}; font-size: ${state.settings.fontSize}px;
                padding: 2% ${margin};
                transition: color 0.3s ease, background-color 0.3s ease;
            }
            ${highlightStyles}
            /* Unified annotation style */
            mark[id^="anno-"] {
                cursor: pointer;
            }
        `;
    }

    // ... (keep fetchAndOrganizeFiles and renderFileTree functions as they are) ...
    async function fetchAndOrganizeFiles() {
        // ...
    }
    function renderFileTree(data) {
        // ...
    }

    function loadFile(filePath) {
        state.currentFile = filePath;
        welcomeMessage.style.display = 'none';
        contentFrame.src = filePath;
        // NEW: Add a class to the body to show the bottom toolbar
        document.body.classList.add('file-loaded');
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
    }

    // --- ANNOTATION & ERASING LOGIC (HEAVILY MODIFIED) ---
    function toggleHighlightMode() {
        state.isHighlightModeActive = !state.isHighlightModeActive;
        if (state.isHighlightModeActive) state.isEraseModeActive = false;
        highlightModeToggle.classList.toggle('active', state.isHighlightModeActive);
        eraseModeToggle.classList.remove('active');
    }
    function toggleEraseMode() {
        state.isEraseModeActive = !state.isEraseModeActive;
        if (state.isEraseModeActive) state.isHighlightModeActive = false;
        eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        highlightModeToggle.classList.remove('active');
    }
    function handleIframeInteraction(event) {
        if (state.isHighlightModeActive) {
            setTimeout(() => createAnnotation(), 50); // Simplified call
        } else if (state.isEraseModeActive) {
            eraseAnnotation(event.target);
        }
    }
    
    // NEW: Function to add a note to a selection, which also creates a highlight
    function addNoteToSelection() {
        const note = prompt('Add a note for this annotation:');
        if (note === null) { // User cancelled prompt
            const selection = contentFrame.contentDocument.getSelection();
            selection.removeAllRanges();
            return;
        }
        createAnnotation(note);
    }

    // MODIFIED: Simplified and unified annotation creation
    function createAnnotation(note = '') {
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const annotationId = `anno-${Date.now()}`;
        const rangeData = serializeRange(range);
        
        const newAnnotation = { 
            id: annotationId, 
            text: selection.toString(), 
            rangeData,
            note: note, // Add note, empty if none provided
            color: state.settings.activeHighlightColor // Always add a color
        };

        if (!state.annotations[state.currentFile]) state.annotations[state.currentFile] = [];
        state.annotations[state.currentFile].push(newAnnotation);
        
        applyAnnotationToDOM(newAnnotation);
        saveAnnotations();
        renderAnnotations(); // MODIFIED: was renderBookmarks
        selection.removeAllRanges();
    }

    function eraseAnnotation(target) {
        const mark = target.closest('mark');
        if (!mark || !mark.id.startsWith('anno-')) return;
        const annotationId = mark.id;
        const fileAnnotations = state.annotations[state.currentFile] || [];
        state.annotations[state.currentFile] = fileAnnotations.filter(anno => anno.id !== annotationId);
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        saveAnnotations();
        renderAnnotations(); // MODIFIED: was renderBookmarks
    }

    // MODIFIED: Simplified annotation application
    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        const range = deserializeRange(annotation.rangeData, iframeDoc);
        if (!range) return;
        const mark = iframeDoc.createElement('mark');
        mark.id = annotation.id;
        mark.className = `highlight highlight-${annotation.color}`;
        if (annotation.note) {
            mark.title = annotation.note; // Add note as a tooltip
        }
        try { range.surroundContents(mark); }
        catch (e) { console.error("Error applying annotation:", e, annotation); }
    }

    function applyAnnotations() {
        const fileAnnotations = state.annotations[state.currentFile] || [];
        fileAnnotations.forEach(applyAnnotationToDOM);
    }

    // MODIFIED: Renders all annotations to the sidebar and gutter
    function renderAnnotations() {
        annotationsList.innerHTML = '';
        bookmarkGutter.innerHTML = '';
        const fileAnnotations = state.annotations[state.currentFile] || [];

        if (fileAnnotations.length === 0) {
            annotationsList.innerHTML = '<li>No annotations for this file.</li>'; return;
        }

        // Sort annotations by their position in the document
        fileAnnotations.sort((a, b) => {
            const elA = contentFrame.contentDocument.getElementById(a.id);
            const elB = contentFrame.contentDocument.getElementById(b.id);
            if (!elA || !elB) return 0;
            return elA.offsetTop - elB.offsetTop;
        });

        fileAnnotations.forEach(annotation => {
            const li = document.createElement('li');
            li.dataset.annotationId = annotation.id;
            
            let content = `<div class="annotation-text">${escapeHTML(annotation.text)}</div>`;
            if (annotation.note) {
                content = `<div class="annotation-note">${escapeHTML(annotation.note)}</div>` + content;
            }
            li.innerHTML = content;
            
            const targetEl = contentFrame.contentDocument.getElementById(annotation.id);
            li.addEventListener('click', () => {
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            annotationsList.appendChild(li);

            // Gutter logic remains similar, but now for all annotations
            if (state.settings.showBookmarkGutter && targetEl) {
                const indicator = document.createElement('div');
                indicator.className = 'bookmark-indicator'; // You can keep this class name
                const yPercent = targetEl.offsetTop / contentFrame.contentDocument.body.scrollHeight;
                indicator.style.top = `calc(${yPercent * 100}% - 5px)`;
                indicator.addEventListener('click', () => targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                bookmarkGutter.appendChild(indicator);
            }
        });
    }

    // ... (keep all data persistence and utility functions as they are) ...
    function saveSettings() { /* ... */ }
    function loadSettings() { /* ... */ }
    function saveAnnotations() { /* ... */ }
    function loadAnnotations() { /* ... */ }
    function getPathTo(node) { /* ... */ }
    function getNodeByPath(path, doc) { /* ... */ }
    function serializeRange(range) { /* ... */ }
    function deserializeRange(rangeData, doc) { /* ... */ }
    function escapeHTML(str) { /* ... */ }


    // --- START THE APP ---
    initialize();
});