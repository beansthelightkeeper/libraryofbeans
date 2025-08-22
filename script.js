document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
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
        fetchAndDisplayFileList();
        setupEventListeners();
    }

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        themeToggle.addEventListener('click', toggleTheme);
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        highlightModeToggle.addEventListener('click', toggleHighlightMode);
        bookmarkBtn.addEventListener('click', () => createAnnotation('bookmark'));
        fontSizeSlider.addEventListener('input', handleFontSizeChange);

        // Listen for events inside the iframe once it's loaded
        contentFrame.addEventListener('load', setupIframeListeners);
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;

        // For continuous highlighting
        iframeDoc.addEventListener('mouseup', handleIframeMouseUp);

        // To enable/disable the manual bookmark button
        iframeDoc.addEventListener('selectionchange', () => {
            const selection = iframeDoc.getSelection();
            bookmarkBtn.disabled = !selection || selection.isCollapsed;
        });

        // Apply current font size to the iframe body
        iframeDoc.body.style.fontSize = `${state.settings.fontSize}px`;
    }

    // --- THEME & SETTINGS ---
    function applySettings() {
        // Apply theme
        document.body.dataset.theme = state.settings.theme;
        themeToggle.innerHTML = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        // Apply font size
        fontSizeSlider.value = state.settings.fontSize;
        if (contentFrame.contentDocument && contentFrame.contentDocument.body) {
            contentFrame.contentDocument.body.style.fontSize = `${state.settings.fontSize}px`;
        }
    }

    function toggleTheme() {
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        applySettings();
        saveSettings();
    }

    function handleFontSizeChange(e) {
        state.settings.fontSize = e.target.value;
        if (contentFrame.contentDocument && contentFrame.contentDocument.body) {
            contentFrame.contentDocument.body.style.fontSize = `${state.settings.fontSize}px`;
        }
        saveSettings();
    }

    // --- FILE HANDLING ---
    async function fetchAndDisplayFileList() {
        try {
            const response = await fetch('files.json');
            if (!response.ok) throw new Error('files.json not found.');
            const files = await response.json();
            
            fileList.innerHTML = '';
            files.forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name;
                li.dataset.path = file.path;
                li.addEventListener('click', () => loadFile(file.path));
                fileList.appendChild(li);
            });
        } catch (error) {
            console.error("Error loading file list:", error);
            fileList.innerHTML = '<li>Error loading library. Make sure files.json exists.</li>';
        }
    }

    function loadFile(filePath) {
        state.currentFile = filePath;
        welcomeMessage.style.display = 'none';
        contentFrame.src = filePath;

        // Update active class in file list
        document.querySelectorAll('#file-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.path === filePath);
        });
        
        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }

        // The 'load' event on the iframe will trigger annotation application
        contentFrame.onload = () => {
            setupIframeListeners();
            applyAnnotations();
            renderBookmarks();
        };
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
            if (note === null) { // User cancelled prompt
                selection.removeAllRanges();
                return;
            }
        }
        
        const range = selection.getRangeAt(0);
        const annotationId = `anno-${Date.now()}`;

        // Store a serializable representation of the range
        const rangeData = serializeRange(range);

        const newAnnotation = {
            id: annotationId,
            type: type,
            text: selection.toString(),
            note: note,
            rangeData: rangeData,
        };

        if (!state.annotations[state.currentFile]) {
            state.annotations[state.currentFile] = [];
        }
        state.annotations[state.currentFile].push(newAnnotation);
        
        applyAnnotationToDOM(newAnnotation);
        saveAnnotations();
        renderBookmarks();
        
        selection.removeAllRanges(); // Deselect text
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
        mark.style.backgroundColor = annotation.type === 'bookmark' ? 'var(--bookmark)' : 'var(--highlight)';
        
        if (annotation.type === 'bookmark') {
            mark.title = annotation.note; // Show note on hover
        }

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
                <div class="bookmark-text">"${escapeHTML(bookmark.text)}"</div>
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
        localStorage.setItem('aetheriumReaderSettings', JSON.stringify(state.settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem('aetheriumReaderSettings');
        if (saved) {
            state.settings = { ...state.settings, ...JSON.parse(saved) };
        }
    }

    function saveAnnotations() {
        localStorage.setItem('aetheriumReaderAnnotations', JSON.stringify(state.annotations));
    }

    function loadAnnotations() {
        const saved = localStorage.getItem('aetheriumReaderAnnotations');
        if (saved) {
            state.annotations = JSON.parse(saved);
        }
    }

    // --- UTILITY FUNCTIONS ---
    function getPathTo(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            // For text nodes, get path to parent and the index within parent
            let parent = node.parentNode;
            let path = getPathTo(parent);
            let index = Array.prototype.indexOf.call(parent.childNodes, node);
            return `${path}/text()[${index + 1}]`;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            let path = '';
            while (node.nodeType === Node.ELEMENT_NODE) {
                let selector = node.nodeName.toLowerCase();
                if (node.id) {
                    selector += `#${node.id}`;
                    path = selector + path;
                    break; 
                } else {
                    let sib = node, nth = 1;
                    while ((sib = sib.previousElementSibling)) {
                        if (sib.nodeName.toLowerCase() == selector) nth++;
                    }
                    selector += `:nth-of-type(${nth})`;
                }
                path = '>' + selector + path;
                node = node.parentNode;
            }
            return path.substring(1);
        }
    }

    function getNodeByPath(path, doc) {
        try {
            // For text nodes, we need to handle it differently
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
