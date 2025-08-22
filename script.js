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
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarksList = document.getElementById('bookmarks-list');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const colorSwatches = document.getElementById('highlighter-colors');
    const doubleSpaceToggle = document.getElementById('double-space-toggle');
    const marginSlider = document.getElementById('margin-slider');
    const bookmarkGutterToggle = document.getElementById('bookmark-gutter-toggle');
    const bookmarkGutter = document.getElementById('bookmark-gutter');

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
        bookmarkBtn.addEventListener('click', () => createAnnotation('bookmark'));
        fontSizeSlider.addEventListener('input', handleFontSizeChange);
        colorSwatches.addEventListener('click', handleColorChange);
        doubleSpaceToggle.addEventListener('click', toggleDoubleSpacing);
        marginSlider.addEventListener('input', handleMarginChange);
        bookmarkGutterToggle.addEventListener('click', toggleBookmarkGutter);
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
        iframeDoc.addEventListener('pointerup', handleIframeInteraction);
        iframeDoc.addEventListener('selectionchange', () => {
            const selection = iframeDoc.getSelection();
            bookmarkBtn.disabled = !selection || selection.isCollapsed;
        });
    }

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
        applySettings(); renderBookmarks(); saveSettings();
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
        const bookmarkColor = computedStyles.getPropertyValue('--bookmark');
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
            .bookmark { background-color: ${bookmarkColor}; color: inherit; }
        `;
    }

    // --- FILE ORGANIZATION & HANDLING ---
    async function fetchAndOrganizeFiles() {
        if (GITHUB_USERNAME === "YOUR_USERNAME" || GITHUB_REPO === "YOUR_REPOSITORY_NAME") {
            fileListContainer.innerHTML = '<li>Please configure script.js</li>'; return;
        }
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/content`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
            const files = await response.json();
            const organized = {};
            files.filter(file => file.type === 'file' && file.name.endsWith('.html')).forEach(file => {
                const parts = file.name.replace(/\.html$/, '').split('/');
                if (parts.length !== 3) return; // Expects Subject/Author/Title.html
                const [subject, author, title] = parts;
                if (!organized[subject]) organized[subject] = {};
                if (!organized[subject][author]) organized[subject][author] = [];
                organized[subject][author].push({ name: title, path: file.path });
            });
            renderFileTree(organized);
        } catch (error) {
            console.error("Error loading file list:", error);
            fileListContainer.innerHTML = '<li>Error loading library.</li>';
        }
    }
    function renderFileTree(data) {
        const createBranch = (obj, isTopLevel = false) => {
            const ul = document.createElement('ul');
            if (isTopLevel) ul.classList.add('top-level');
            for (const key in obj) {
                const li = document.createElement('li');
                if (Array.isArray(obj[key])) { // It's an array of files
                    const file = obj[key][0];
                    li.textContent = file.name;
                    li.className = 'file-item';
                    li.dataset.path = file.path;
                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        loadFile(file.path);
                        document.querySelectorAll('.file-item.active').forEach(el => el.classList.remove('active'));
                        li.classList.add('active');
                    });
                } else { // It's a folder
                    li.textContent = key;
                    li.className = 'folder';
                    const childrenUl = createBranch(obj[key]);
                    childrenUl.style.display = 'none';
                    li.appendChild(childrenUl);
                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        li.classList.toggle('open');
                        childrenUl.style.display = childrenUl.style.display === 'none' ? 'block' : 'none';
                    });
                }
                ul.appendChild(li);
            }
            return ul;
        };
        fileListContainer.innerHTML = '';
        fileListContainer.appendChild(createBranch(data, true));
    }
    function loadFile(filePath) {
        state.currentFile = filePath;
        welcomeMessage.style.display = 'none';
        contentFrame.src = filePath;
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
    }

    // --- ANNOTATION & ERASING LOGIC ---
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
            setTimeout(() => createAnnotation('highlight'), 50);
        } else if (state.isEraseModeActive) {
            eraseAnnotation(event.target);
        }
    }
    function createAnnotation(type) {
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const annotationId = `anno-${Date.now()}`;
        const rangeData = serializeRange(range);
        const newAnnotation = { id: annotationId, type, text: selection.toString(), rangeData };
        if (type === 'bookmark') {
            const note = prompt('Add a note for this bookmark:');
            if (note === null) { selection.removeAllRanges(); return; }
            newAnnotation.note = note;
        } else if (type === 'highlight') {
            newAnnotation.color = state.settings.activeHighlightColor;
        }
        if (!state.annotations[state.currentFile]) state.annotations[state.currentFile] = [];
        state.annotations[state.currentFile].push(newAnnotation);
        applyAnnotationToDOM(newAnnotation);
        saveAnnotations();
        renderBookmarks();
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
        renderBookmarks();
    }
    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        const range = deserializeRange(annotation.rangeData, iframeDoc);
        if (!range) return;
        const mark = iframeDoc.createElement('mark');
        mark.id = annotation.id;
        if (annotation.type === 'highlight') {
            mark.className = `highlight highlight-${annotation.color}`;
        } else if (annotation.type === 'bookmark') {
            mark.className = 'bookmark';
            mark.title = annotation.note;
        }
        try { range.surroundContents(mark); }
        catch (e) { console.error("Error applying annotation:", e, annotation); }
    }
    function applyAnnotations() {
        const fileAnnotations = state.annotations[state.currentFile] || [];
        fileAnnotations.forEach(applyAnnotationToDOM);
    }
    function renderBookmarks() {
        bookmarksList.innerHTML = '';
        bookmarkGutter.innerHTML = '';
        const fileAnnotations = state.annotations[state.currentFile] || [];
        const bookmarks = fileAnnotations.filter(a => a.type === 'bookmark');
        if (bookmarks.length === 0) {
            bookmarksList.innerHTML = '<li>No bookmarks for this file.</li>'; return;
        }
        bookmarks.forEach(bookmark => {
            const li = document.createElement('li');
            li.dataset.annotationId = bookmark.id;
            li.innerHTML = `<div class="bookmark-note">${escapeHTML(bookmark.note || '')}</div><div class="bookmark-text">${escapeHTML(bookmark.text)}</div>`;
            const targetEl = contentFrame.contentDocument.getElementById(bookmark.id);
            li.addEventListener('click', () => {
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            bookmarksList.appendChild(li);
            if (state.settings.showBookmarkGutter && targetEl) {
                const indicator = document.createElement('div');
                indicator.className = 'bookmark-indicator';
                const yPercent = targetEl.offsetTop / contentFrame.contentDocument.body.scrollHeight;
                indicator.style.top = `calc(${yPercent * 100}% - 5px)`;
                indicator.addEventListener('click', () => targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                bookmarkGutter.appendChild(indicator);
            }
        });
    }

    // --- DATA PERSISTENCE ---
    function saveSettings() { localStorage.setItem('libraryOfBeansSettings', JSON.stringify(state.settings)); }
    function loadSettings() {
        const saved = localStorage.getItem('libraryOfBeansSettings');
        if (saved) Object.assign(state.settings, JSON.parse(saved));
    }
    function saveAnnotations() { localStorage.setItem('libraryOfBeansAnnotations', JSON.stringify(state.annotations)); }
    function loadAnnotations() {
        const saved = localStorage.getItem('libraryOfBeansAnnotations');
        if (saved) state.annotations = JSON.parse(saved);
    }

    // --- UTILITY FUNCTIONS ---
    function getPathTo(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let parent = node.parentNode; let path = getPathTo(parent);
            let index = Array.prototype.indexOf.call(parent.childNodes, node);
            return `${path}/text()[${index + 1}]`;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            let path = '';
            while (node && node.nodeType === Node.ELEMENT_NODE) {
                let selector = node.nodeName.toLowerCase();
                if (node.id) { selector += `#${node.id}`; path = selector + (path ? '>' + path : ''); break; }
                else {
                    let sib = node, nth = 1;
                    while ((sib = sib.previousElementSibling)) { if (sib.nodeName.toLowerCase() == selector) nth++; }
                    selector += `:nth-of-type(${nth})`;
                }
                path = selector + (path ? '>' + path : '');
                node = node.parentNode;
            }
            return path;
        } return '';
    }
    function getNodeByPath(path, doc) {
        try {
            if (path.includes('/text()')) {
                const parts = path.split('/text()'); const elementPath = parts[0];
                const textIndex = parseInt(parts[1].match(/\[(\d+)\]/)[1], 10) - 1;
                const parent = doc.querySelector(elementPath);
                return parent ? parent.childNodes[textIndex] : null;
            } return doc.querySelector(path);
        } catch (e) { console.error("Failed to find node by path:", path, e); return null; }
    }
    function serializeRange(range) {
        return {
            startPath: getPathTo(range.startContainer), startOffset: range.startOffset,
            endPath: getPathTo(range.endContainer), endOffset: range.endOffset,
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
        } return null;
    }
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    // --- START THE APP ---
    initialize();
});
