document.addEventListener('DOMContentLoaded', () => {
    // --- USER CONFIGURATION ---
    const GITHUB_USERNAME = "beansthelightkeeper";
    const GITHUB_REPO = "libraryofbeans";
    const LIBRARY_ROOT = 'content/'; 
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
    const addNoteBtn = document.getElementById('add-note-btn');
    const annotationsList = document.getElementById('annotations-list');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const colorSwatches = document.getElementById('highlighter-colors');
    const doubleSpaceToggle = document.getElementById('double-space-toggle');
    const marginSlider = document.getElementById('margin-slider');
    const bookmarkGutterToggle = document.getElementById('bookmark-gutter-toggle');
    const bookmarkGutter = document.getElementById('bookmark-gutter');
    const librarySectionHeader = document.getElementById('library-section-header');

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
        addNoteBtn.addEventListener('click', addNoteToSelection);
        fontSizeSlider.addEventListener('input', handleFontSizeChange);
        colorSwatches.addEventListener('click', handleColorChange);
        doubleSpaceToggle.addEventListener('click', toggleDoubleSpacing);
        marginSlider.addEventListener('input', handleMarginChange);
        bookmarkGutterToggle.addEventListener('click', toggleBookmarkGutter);
        contentFrame.addEventListener('load', onIframeLoad);
        librarySectionHeader.addEventListener('click', () => {
            librarySectionHeader.parentElement.classList.toggle('collapsed');
        });
    }

    function onIframeLoad() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc || !state.currentFile) return;
        const base = iframeDoc.createElement('base');
        const pathParts = state.currentFile.split('/');
        pathParts.pop(); 
        const directoryPath = pathParts.join('/') + '/';
        base.href = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/${directoryPath}`;
        iframeDoc.head.prepend(base);
        updateIframeStyles();
        setupIframeListeners();
        applyAnnotations();
        renderAnnotations();
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        iframeDoc.addEventListener('pointerup', handleIframeInteraction);
        iframeDoc.addEventListener('selectionchange', () => {
            const selection = iframeDoc.getSelection();
            addNoteBtn.disabled = !selection || selection.isCollapsed;
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
        applySettings(); renderAnnotations(); saveSettings();
    }
    
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
                margin: 0 auto; /* This helps with centering */
                max-width: 80ch; /* Good for readability */
            }
            ${highlightStyles}
            mark[id^="anno-"] { cursor: pointer; }
        `;
    }

    // --- GITHUB FILE FETCHING & RENDERING ---
    async function fetchAndOrganizeFiles() {
        const branch = 'main';
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/git/trees/${branch}?recursive=1`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
            const data = await response.json();
            
            const flatFileList = [];

            for (const item of data.tree) {
                if (item.type === 'blob' && item.path.startsWith(LIBRARY_ROOT) && item.path.endsWith('.html')) {
                    const relativePath = item.path.substring(LIBRARY_ROOT.length);
                    if (relativePath === '') continue;

                    const displayName = relativePath
                        .replace(/\.html$/, '')
                        .replace(/_/g, ' ')
                        .replace(/\//g, ' / ');

                    flatFileList.push({ name: displayName, path: item.path });
                }
            }
            
            flatFileList.sort((a, b) => a.name.localeCompare(b.name));
            renderFileList(flatFileList);

        } catch (error) {
            console.error("Failed to fetch files:", error);
            fileListContainer.innerHTML = '<p class="error">Could not load library.</p>';
        }
    }

    function renderFileList(files) {
        fileListContainer.innerHTML = '';
        const ul = document.createElement('ul');

        if (files.length === 0) {
            ul.innerHTML = '<li>No HTML files found.</li>';
        } else {
            files.forEach(file => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.path = file.path;
                a.textContent = file.name;
                
                a.onclick = (e) => {
                    e.preventDefault();
                    const currentActive = document.querySelector('#file-list-container li.active');
                    if (currentActive) {
                        currentActive.classList.remove('active');
                    }
                    li.classList.add('active');
                    loadFile(file.path);
                };
                li.appendChild(a);
                ul.appendChild(li);
            });
        }
        fileListContainer.appendChild(ul);
    }
    
    // ** THIS IS THE UPDATED FUNCTION THAT FIXES EVERYTHING **
    async function loadFile(fullPath) {
        state.currentFile = fullPath;
        welcomeMessage.style.display = 'none';
        document.body.classList.add('file-loaded');

        try {
            const url = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/${fullPath}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            
            // By setting srcdoc, we make the iframe's content have the same origin
            // as the parent page, which allows our scripts to modify it.
            contentFrame.srcdoc = htmlContent;

        } catch (error) {
            console.error("Failed to load file content:", error);
            contentFrame.srcdoc = `<html><body><h2>Failed to load content</h2><p>${error}</p></body></html>`;
        }
        
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
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
            setTimeout(() => createAnnotation(), 50);
        } else if (state.isEraseModeActive) {
            eraseAnnotation(event.target);
        }
    }
    
    function addNoteToSelection() {
        const note = prompt('Add a note for this annotation:');
        if (note === null) {
            const selection = contentFrame.contentDocument.getSelection();
            if(selection) selection.removeAllRanges();
            return;
        }
        createAnnotation(note);
    }

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
            note: note,
            color: state.settings.activeHighlightColor
        };

        const annotationKey = state.currentFile.includes('/') ? state.currentFile.substring(0, state.currentFile.lastIndexOf('/')) : state.currentFile;
        if (!state.annotations[annotationKey]) state.annotations[annotationKey] = [];
        state.annotations[annotationKey].push(newAnnotation);
        
        applyAnnotationToDOM(newAnnotation);
        saveAnnotations();
        renderAnnotations();
        selection.removeAllRanges();
    }

    function eraseAnnotation(target) {
        const mark = target.closest('mark');
        if (!mark || !mark.id.startsWith('anno-')) return;
        const annotationId = mark.id;
        const annotationKey = state.currentFile.includes('/') ? state.currentFile.substring(0, state.currentFile.lastIndexOf('/')) : state.currentFile;
        const fileAnnotations = state.annotations[annotationKey] || [];
        state.annotations[annotationKey] = fileAnnotations.filter(anno => anno.id !== annotationId);
        
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        
        saveAnnotations();
        renderAnnotations();
    }

    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        const range = deserializeRange(annotation.rangeData, iframeDoc);
        if (!range) return;
        const mark = iframeDoc.createElement('mark');
        mark.id = annotation.id;
        mark.className = `highlight highlight-${annotation.color}`;
        if (annotation.note) {
            mark.title = annotation.note;
        }
        try { range.surroundContents(mark); }
        catch (e) { console.error("Error applying annotation:", e, annotation); }
    }

    function applyAnnotations() {
        if (!state.currentFile) return;
        const annotationKey = state.currentFile.includes('/') ? state.currentFile.substring(0, state.currentFile.lastIndexOf('/')) : state.currentFile;
        const fileAnnotations = state.annotations[annotationKey] || [];
        fileAnnotations.forEach(applyAnnotationToDOM);
    }

    function renderAnnotations() {
        annotationsList.innerHTML = '';
        bookmarkGutter.innerHTML = '';
        if (!state.currentFile) return;

        const annotationKey = state.currentFile.includes('/') ? state.currentFile.substring(0, state.currentFile.lastIndexOf('/')) : state.currentFile;
        const fileAnnotations = state.annotations[annotationKey] || [];

        if (fileAnnotations.length === 0) {
            annotationsList.innerHTML = '<li>No annotations for this file.</li>'; return;
        }

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
            
            li.addEventListener('click', () => {
                const targetEl = contentFrame.contentDocument.getElementById(annotation.id);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            annotationsList.appendChild(li);

            if (state.settings.showBookmarkGutter) {
                 const targetEl = contentFrame.contentDocument.getElementById(annotation.id);
                if (targetEl) {
                    const indicator = document.createElement('div');
                    indicator.className = 'bookmark-indicator';
                    const yPercent = targetEl.offsetTop / contentFrame.contentDocument.body.scrollHeight;
                    indicator.style.top = `calc(${yPercent * 100}% - 5px)`;
                    indicator.addEventListener('click', () => targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' }));
                    bookmarkGutter.appendChild(indicator);
                }
            }
        });
    }

    // --- DATA PERSISTENCE & UTILITY FUNCTIONS ---
    function saveSettings() {
        localStorage.setItem('beansReaderSettings', JSON.stringify(state.settings));
    }
    function loadSettings() {
        const saved = localStorage.getItem('beansReaderSettings');
        if (saved) {
            Object.assign(state.settings, JSON.parse(saved));
        }
    }
    function saveAnnotations() {
        localStorage.setItem('beansReaderAnnotations', JSON.stringify(state.annotations));
    }
    function loadAnnotations() {
        const saved = localStorage.getItem('beansReaderAnnotations');
        if (saved) {
            Object.assign(state.annotations, JSON.parse(saved));
        }
    }
    
    function getPathTo(node) {
        if (!node || !node.parentNode) return '';
        if (node.id) return `id("${node.id}")`;
        if (node === document.body) return node.tagName.toLowerCase();
        let ix = 0;
        const siblings = node.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === node) return `${getPathTo(node.parentNode)}/${node.tagName.toLowerCase()}[${ix + 1}]`;
            if (sibling.nodeType === 1 && sibling.tagName === node.tagName) ix++;
        }
        return '';
    }
    function getNodeByPath(path, doc) {
         try {
            return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch(e){
            console.error("XPath evaluation failed for path:", path, e);
            return null;
        }
    }
    function serializeRange(range) {
        return {
            startContainerPath: getPathTo(range.startContainer),
            startOffset: range.startOffset,
            endContainerPath: getPathTo(range.endContainer),
            endOffset: range.endOffset,
        };
    }
    function deserializeRange(rangeData, doc) {
        try {
            const startContainer = getNodeByPath(rangeData.startContainerPath, doc);
            const endContainer = getNodeByPath(rangeData.endContainerPath, doc);
            if (!startContainer || !endContainer) {
                 console.error("Could not find start or end container for range", rangeData);
                 return null;
            }
            const range = doc.createRange();
            range.setStart(startContainer, rangeData.startOffset);
            range.setEnd(endContainer, rangeData.endOffset);
            return range;
        } catch (e) {
            console.error("Failed to deserialize range:", e, rangeData);
            return null;
        }
    }
    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    // --- START THE APP ---
    initialize();
});