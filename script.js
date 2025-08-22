document.addEventListener('DOMContentLoaded', () => {
    // --- USER CONFIGURATION ---
    // IMPORTANT: Replace these with your GitHub username and repository name.
    const GITHUB_USERNAME = "beansthelightkeeper";
    const GITHUB_REPO = "libraryofbeans";
    // --- END OF CONFIGURATION ---

    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const minimizeToggle = document.getElementById('minimize-toggle');
    const sidebar = document.querySelector('.sidebar');
    const fileList = document.getElementById('file-list');
    const contentFrame = document.getElementById('content-frame');
    const welcomeMessage = document.getElementById('welcome-message');
    const highlightModeToggle = document.getElementById('highlight-mode-toggle');
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarksList = document.getElementById('bookmarks-list');
    const fontSizeSlider = document.getElementById('font-size-slider');

    // --- App State ---
    const state = {
        currentFile: null,
        isHighlightModeActive: false,
        settings: {
            theme: 'dark',
            fontSize: 16,
            sidebarMinimized: false,
        },
        annotations: {}, // { 'file1.html': [{...}], 'file2.html': [{...}] }
    };
    
    // --- ICONS ---
    const ICONS = {
        sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
    };

    // --- INITIALIZATION ---
    function initialize() {
        loadSettings();
        loadAnnotations();
        applySettings();
        fetchFilesFromGitHub();
        setupEventListeners();
    }

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        themeToggle.addEventListener('click', toggleTheme);
        minimizeToggle.addEventListener('click', toggleSidebarMinimize);
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        highlightModeToggle.addEventListener('click', toggleHighlightMode);
        bookmarkBtn.addEventListener('click', () => createAnnotation('bookmark'));
        fontSizeSlider.addEventListener('input', handleFontSizeChange);
        contentFrame.addEventListener('load', onIframeLoad);
    }

    function onIframeLoad() {
        updateIframeStyles();
        setupIframeListeners();
        applyAnnotations();
        renderBookmarks();
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        // Listen for mouse up (for desktop) and touch end (for mobile/tablet)
        iframeDoc.addEventListener('mouseup', handleIframeMouseUp);
        iframeDoc.addEventListener('touchend', handleIframeMouseUp); 
        iframeDoc.addEventListener('selectionchange', () => {
            const selection = iframeDoc.getSelection();
            bookmarkBtn.disabled = !selection || selection.isCollapsed;
        });
        iframeDoc.body.style.fontSize = `${state.settings.fontSize}px`;
    }

    // --- THEME & SETTINGS ---
    function applySettings() {
        document.body.dataset.theme = state.settings.theme;
        themeToggle.innerHTML = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        fontSizeSlider.value = state.settings.fontSize;
        if (contentFrame.contentDocument && contentFrame.contentDocument.body) {
            contentFrame.contentDocument.body.style.fontSize = `${state.settings.fontSize}px`;
        }
        sidebar.classList.toggle('minimized', state.settings.sidebarMinimized);
    }

    function toggleTheme() {
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        applySettings();
        updateIframeStyles(); // Update iframe styles on theme change
        saveSettings();
    }
    
    function toggleSidebarMinimize() {
        state.settings.sidebarMinimized = !state.settings.sidebarMinimized;
        sidebar.classList.toggle('minimized');
        saveSettings();
    }

    function handleFontSizeChange(e) {
        state.settings.fontSize = e.target.value;
        if (contentFrame.contentDocument && contentFrame.contentDocument.body) {
            contentFrame.contentDocument.body.style.fontSize = `${state.settings.fontSize}px`;
        }
        saveSettings();
    }

    // --- DYNAMIC IFRAME STYLING ---
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
        const highlightColor = computedStyles.getPropertyValue('--highlight');
        const bookmarkColor = computedStyles.getPropertyValue('--bookmark');
        
        // FIX: Add text color based on the current theme
        const textColor = computedStyles.getPropertyValue('--text-primary');
        const bodyBgColor = computedStyles.getPropertyValue('--bg-secondary');

        style.innerHTML = `
            body {
                color: ${textColor};
                background-color: ${bodyBgColor};
                transition: color 0.3s ease, background-color 0.3s ease;
            }
            .highlight { background-color: ${highlightColor}; color: inherit; }
            .bookmark { background-color: ${bookmarkColor}; color: inherit; }
        `;
    }

    // --- FILE HANDLING (Now using GitHub API) ---
    async function fetchFilesFromGitHub() {
        if (GITHUB_USERNAME === "YOUR_USERNAME" || GITHUB_REPO === "YOUR_REPOSITORY_NAME") {
            fileList.innerHTML = '<li>Please configure your GitHub username and repo in script.js</li>';
            return;
        }
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/content`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
            const files = await response.json();
            
            fileList.innerHTML = '';
            files
                .filter(file => file.type === 'file' && file.name.endsWith('.html'))
                .forEach(file => {
                    const li = document.createElement('li');
                    const displayName = file.name.replace(/\.html$/, '').replace(/[-_]/g, ' ');
                    li.innerHTML = `<span class="full-text">${displayName}</span><span class="mini-text">📖</span>`;
                    li.title = displayName;
                    li.dataset.path = file.path;
                    li.addEventListener('click', () => loadFile(file.path));
                    fileList.appendChild(li);
                });
        } catch (error) {
            console.error("Error loading file list from GitHub:", error);
            fileList.innerHTML = '<li>Error loading library. Check console for details.</li>';
        }
    }

    function loadFile(filePath) {
        state.currentFile = filePath;
        welcomeMessage.style.display = 'none';
        contentFrame.src = filePath;

        document.querySelectorAll('#file-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.path === filePath);
        });
        
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
        // The 'load' event on the iframe will trigger onIframeLoad()
    }

    // --- ANNOTATION LOGIC ---
    function toggleHighlightMode() {
        state.isHighlightModeActive = !state.isHighlightModeActive;
        highlightModeToggle.classList.toggle('active', state.isHighlightModeActive);
    }
    
    function handleIframeMouseUp() {
        if (state.isHighlightModeActive) {
            createAnnotation('highlight');
        }
    }

    function createAnnotation(type) {
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;

        let note = null;
        if (type === 'bookmark') {
            note = prompt('Add a note for this bookmark (for citation):');
            if (note === null) {
                selection.removeAllRanges();
                return;
            }
        }
        
        const range = selection.getRangeAt(0);
        const annotationId = `anno-${Date.now()}`;
        const rangeData = serializeRange(range);

        const newAnnotation = { id: annotationId, type, text: selection.toString(), note, rangeData };

        if (!state.annotations[state.currentFile]) {
            state.annotations[state.currentFile] = [];
        }
        state.annotations[state.currentFile].push(newAnnotation);
        
        applyAnnotationToDOM(newAnnotation);
        saveAnnotations();
        renderBookmarks();
        selection.removeAllRanges();
    }

    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        const range = deserializeRange(annotation.rangeData, iframeDoc);
        if (!range) {
            console.warn('Could not restore range for annotation:', annotation.id);
            return;
        }

        const mark = iframeDoc.createElement('mark');
        mark.id = annotation.id;
        mark.className = annotation.type; // Use class instead of inline style
        if (annotation.type === 'bookmark') mark.title = annotation.note;

        try {
            range.surroundContents(mark);
        } catch (e) {
            console.error("Error applying annotation to DOM:", e, annotation);
        }
    }
    
    function applyAnnotations() {
        const fileAnnotations = state.annotations[state.currentFile] || [];
        fileAnnotations.forEach(applyAnnotationToDOM);
    }

    function renderBookmarks() {
        bookmarksList.innerHTML = '';
        const fileAnnotations = state.annotations[state.currentFile] || [];
        const bookmarks = fileAnnotations.filter(a => a.type === 'bookmark');

        if (bookmarks.length === 0) {
            bookmarksList.innerHTML = '<li>No bookmarks for this file.</li>';
            return;
        }

        bookmarks.forEach(bookmark => {
            const li = document.createElement('li');
            li.dataset.annotationId = bookmark.id;
            li.innerHTML = `
                <div class="bookmark-note">${escapeHTML(bookmark.note || '')}</div>
                <div class="bookmark-text">${escapeHTML(bookmark.text)}</div>
            `;
            li.addEventListener('click', () => {
                const targetElement = contentFrame.contentDocument.getElementById(bookmark.id);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            bookmarksList.appendChild(li);
        });
    }

    // --- DATA PERSISTENCE (LocalStorage) ---
    function saveSettings() {
        localStorage.setItem('libraryOfBeansSettings', JSON.stringify(state.settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem('libraryOfBeansSettings');
        if (saved) {
            state.settings = { ...state.settings, ...JSON.parse(saved) };
        }
    }

    function saveAnnotations() {
        localStorage.setItem('libraryOfBeansAnnotations', JSON.stringify(state.annotations));
    }

    function loadAnnotations() {
        const saved = localStorage.getItem('libraryOfBeansAnnotations');
        if (saved) {
            state.annotations = JSON.parse(saved);
        }
    }

    // --- UTILITY FUNCTIONS (No changes here) ---
    function getPathTo(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let parent = node.parentNode;
            let path = getPathTo(parent);
            let index = Array.prototype.indexOf.call(parent.childNodes, node);
            return `${path}/text()[${index + 1}]`;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            let path = '';
            while (node && node.nodeType === Node.ELEMENT_NODE) {
                let selector = node.nodeName.toLowerCase();
                if (node.id) {
                    selector += `#${node.id}`;
                    path = selector + (path ? '>' + path : '');
                    break; 
                } else {
                    let sib = node, nth = 1;
                    while ((sib = sib.previousElementSibling)) {
                        if (sib.nodeName.toLowerCase() == selector) nth++;
                    }
                    selector += `:nth-of-type(${nth})`;
                }
                path = selector + (path ? '>' + path : '');
                node = node.parentNode;
            }
            return path;
        }
        return '';
    }

    function getNodeByPath(path, doc) {
        try {
            if (path.includes('/text()')) {
                const parts = path.split('/text()');
                const elementPath = parts[0];
                const textIndex = parseInt(parts[1].match(/\[(\d+)\]/)[1], 10) - 1;
                const parent = doc.querySelector(elementPath);
                return parent ? parent.childNodes[textIndex] : null;
            }
            return doc.querySelector(path);
        } catch (e) {
            console.error("Failed to find node by path:", path, e);
            return null;
        }
    }

    function serializeRange(range) {
        return {
            startPath: getPathTo(range.startContainer),
            startOffset: range.startOffset,
            endPath: getPathTo(range.endContainer),
            endOffset: range.endOffset,
        };
    }

    function deserializeRange(rangeData, doc) {
        const startNode = getNodeByPath(rangeData.startPath, doc);
        const endNode = getNodeByPath(rangeData.endPath, doc);

        if (startNode && endNode) {
            const range = doc.createRange();
            range.setStart(startNode, rangeData.startOffset);
            range.setEnd(endNode, rangeData.endOffset);
            return range;
        }
        return null;
    }
    
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    // --- START THE APP ---
    initialize();
});
