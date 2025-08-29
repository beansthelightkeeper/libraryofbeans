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
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const annotationsList = document.getElementById('annotations-list');
    const bookmarksList = document.getElementById('bookmarks-list');
    const clearAnnotationsBtn = document.getElementById('clear-annotations-btn');
    const clearBookmarksBtn = document.getElementById('clear-bookmarks-btn');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const colorSwatches = document.getElementById('highlighter-colors');
    const doubleSpaceToggle = document.getElementById('double-space-toggle');
    const marginSlider = document.getElementById('margin-slider');
    const librarySectionHeader = document.getElementById('library-section-header');

    // --- App State ---
    const state = {
        currentFile: null,
        targetScrollY: null,
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
        },
        annotations: {},
        bookmarks: {},
    };

    // --- ICONS & COLORS ---
    const ICONS = {
        sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
    };
    const HIGHLIGHT_COLORS = {
        yellow: '--highlight-yellow',
        pink: '--highlight-pink',
        green: '--highlight-green',
        blue: '--highlight-blue',
    };
    const HIEROGLYPHS = ['𓂀', '⟁', '∞', '𝄠', '𝨁', '𝨄', '🃟', '🂡', '🙨', '☥', '♅', '♆', '⚚', '⚛', '⚜', '☤', '☧', '⚳', '⬙', '⏣'];

    // --- INITIALIZATION ---
    function initialize() {
        // Debug PDF.js loading
        if (!window.pdfjsLib) {
            console.warn("PDF.js library not loaded. PDFs will use native viewer.");
        } else {
            console.log("PDF.js library loaded successfully.");
        }
        loadSettings();
        loadAnnotations();
        loadBookmarks();
        injectDynamicStyles();
        applySettings();
        fetchAndOrganizeFiles();
        setupEventListeners();
        renderAllBookmarks();
        toggleReaderTools(false); // Disable tools on startup
    }

    // --- DYNAMIC STYLE INJECTION ---
    function injectDynamicStyles() {
        const style = document.createElement('style');
        style.id = 'app-dynamic-styles';
        style.innerHTML = `
            .color-palette.disabled {
                opacity: 0.5;
                filter: grayscale(80%);
                pointer-events: none;
            }
            .textLayer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
            .textLayer > div { position: absolute; white-space: pre; cursor: text; }
            .highlight { cursor: pointer; }
        `;
        document.head.appendChild(style);
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
        addBookmarkBtn.addEventListener('click', addBookmark);
        clearAnnotationsBtn.addEventListener('click', clearAllAnnotations);
        clearBookmarksBtn.addEventListener('click', clearAllBookmarks);
        fontSizeSlider.addEventListener('input', handleFontSizeChange);
        colorSwatches.addEventListener('click', handleColorChange);
        doubleSpaceToggle.addEventListener('click', toggleDoubleSpacing);
        marginSlider.addEventListener('input', handleMarginChange);
        contentFrame.addEventListener('load', onIframeLoad);
        librarySectionHeader.addEventListener('click', () => {
            librarySectionHeader.parentElement.classList.toggle('collapsed');
        });
    }

    async function renderPdfInIframe(url) {
        // Check if PDF.js is loaded
        if (!window.pdfjsLib) {
            console.warn("PDF.js not loaded, falling back to native PDF viewer");
            contentFrame.src = url;
            contentFrame.srcdoc = `<html><body><h2>Loading PDF in native viewer...</h2><p>If this fails, ensure the PDF exists at <a href="${url}">${url}</a></p></body></html>`;
            toggleReaderTools(false); // Disable tools for native viewer
            return;
        }

        try {
            const pdfjsLib = window.pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch PDF: HTTP ${response.status}`);
            const pdf = await pdfjsLib.getDocument(url).promise;
            const iframeDoc = contentFrame.contentDocument;
            iframeDoc.body.innerHTML = ''; // Clear previous content
            iframeDoc.body.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--bg-secondary');


            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const canvas = iframeDoc.createElement('canvas');
                canvas.style.display = 'block';
                canvas.style.margin = 'auto';
                canvas.dataset.page = pageNum;
                const context = canvas.getContext('2d');

                const scale = 1.5;
                const viewport = page.getViewport({ scale: scale });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const container = iframeDoc.createElement('div');
                container.style.position = 'relative';
                container.style.width = `${viewport.width}px`;
                container.style.height = `${viewport.height}px`;
                container.style.margin = '20px auto';
                container.style.setProperty('--scale-factor', scale);
                container.dataset.page = pageNum;
                iframeDoc.body.appendChild(container);
                canvas.style.position = 'absolute';
                container.appendChild(canvas);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };
                await page.render(renderContext).promise;

                const textContent = await page.getTextContent();
                const textLayerDiv = iframeDoc.createElement('div');
                textLayerDiv.className = 'textLayer';
                textLayerDiv.style.width = `${viewport.width}px`;
                textLayerDiv.style.height = `${viewport.height}px`;
                container.appendChild(textLayerDiv);

                pdfjsLib.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
            }

            applyAnnotationsForCurrentFile();
            setupIframeListeners();

        } catch (error) {
            console.error("Error rendering PDF:", error);
            contentFrame.src = url;
            contentFrame.srcdoc = `<html><body><h2>Failed to render PDF</h2><p>Error: ${error.message}. Trying native viewer... <a href="${url}">Open PDF directly</a></p></body></html>`;
            toggleReaderTools(false);
        }
    }

    function onIframeLoad() {
        if (!state.currentFile || state.currentFile.toLowerCase().endsWith('.pdf')) {
            return;
        }

        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;

        iframeDoc.querySelectorAll('img').forEach(img => {
            if (img.src.includes('beanscodex.com/images/')) {
                const fileName = img.src.split('/').pop();
                img.src = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/content/images/${fileName}`;
                img.onerror = () => { img.style.display = 'none'; };
            }
        });

        const base = iframeDoc.createElement('base');
        const pathParts = state.currentFile.split('/');
        pathParts.pop();
        const directoryPath = pathParts.join('/') + '/';
        base.href = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/${directoryPath}`;
        iframeDoc.head.prepend(base);

        updateIframeStyles();
        setupIframeListeners();
        applyAnnotationsForCurrentFile();
        renderAnnotationsForCurrentFile();
        renderAllBookmarks();

        if (state.targetScrollY !== null) {
            contentFrame.contentWindow.scrollTo(0, state.targetScrollY);
            state.targetScrollY = null;
        }
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        iframeDoc.addEventListener('pointerup', handleIframeInteraction);
        iframeDoc.addEventListener('selectionchange', () => {
            const selection = iframeDoc.getSelection();
            const isValidSelection = selection && !selection.isCollapsed && selection.toString().trim() !== '';
            addNoteBtn.disabled = !isValidSelection;
            highlightModeToggle.disabled = !isValidSelection;
        });
    }

    function applySettings() {
        document.body.dataset.theme = state.settings.theme;
        themeToggle.innerHTML = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        fontSizeSlider.value = state.settings.fontSize;
        marginSlider.value = state.settings.marginSize;
        sidebar.classList.toggle('minimized', state.settings.sidebarMinimized);
        doubleSpaceToggle.classList.toggle('active', state.settings.isDoubleSpaced);
        rainbowToggle.classList.toggle('active', state.settings.isRainbowFxOn);
        document.body.classList.toggle('no-fx', !state.settings.isRainbowFxOn);
        colorSwatches.classList.toggle('disabled', !state.isHighlightModeActive);
        highlightModeToggle.classList.toggle('active', state.isHighlightModeActive);
        eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color === state.settings.activeHighlightColor);
        });
        updateIframeStyles();
    }

    function toggleTheme() {
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        saveSettings();
        applySettings();
    }

    function toggleSidebarMinimize() {
        state.settings.sidebarMinimized = !state.settings.sidebarMinimized;
        saveSettings();
        applySettings();
    }

    function toggleRainbowFx() {
        state.settings.isRainbowFxOn = !state.settings.isRainbowFxOn;
        saveSettings();
        applySettings();
    }

    function handleFontSizeChange(e) {
        state.settings.fontSize = e.target.value;
        saveSettings();
        updateIframeStyles();
    }

    function handleColorChange(e) {
        if (!state.isHighlightModeActive) return;
        const target = e.target.closest('.color-swatch');
        if (!target) return;
        state.settings.activeHighlightColor = target.dataset.color;
        saveSettings();
        applySettings();
    }

    function toggleDoubleSpacing() {
        state.settings.isDoubleSpaced = !state.settings.isDoubleSpaced;
        saveSettings();
        applySettings();
    }

    function handleMarginChange(e) {
        state.settings.marginSize = e.target.value;
        saveSettings();
        updateIframeStyles();
    }

    function updateIframeStyles() {
        if (!state.currentFile || state.currentFile.toLowerCase().endsWith('.pdf')) return;
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
        const lineHeight = state.settings.isDoubleSpaced ? '2.5' : '1.6';
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
                margin: 0 auto;
                max-width: 80ch;
            }
            ${highlightStyles}
            mark[id^="anno-"] { cursor: pointer; }
        `;
    }

    async function fetchAndOrganizeFiles() {
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/git/trees/main?recursive=1`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
            const data = await response.json();
            const flatFileList = data.tree
                .filter(item => item.type === 'blob' && (item.path.endsWith('.html') || item.path.endsWith('.pdf')) && item.path.startsWith(LIBRARY_ROOT))
                .map(item => {
                    const relativePath = item.path.substring(LIBRARY_ROOT.length);
                    const displayName = relativePath.replace(/\.(html|pdf)$/i, '').replace(/_/g, ' ').replace(/\//g, ' / ');
                    return { name: displayName, path: item.path };
                })
                .sort((a, b) => a.name.localeCompare(b.name));
            renderFileList(flatFileList);
        } catch (error) {
            console.error("Failed to fetch files:", error);
            fileListContainer.innerHTML = '<p class="error">Could not load library.</p>';
        }
    }

    function getIconForText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        return HIEROGLYPHS[Math.abs(hash) % HIEROGLYPHS.length];
    }

    function renderFileList(files) {
        const ul = document.createElement('ul');
        if (files.length > 0) {
            files.forEach(file => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.path = file.path;
                const icon = getIconForText(file.name);
                a.innerHTML = `<span class="file-icon" title="${file.name}">${icon}</span><span class="file-name">${file.name}</span>`;
                a.onclick = (e) => { e.preventDefault(); loadFile(file.path); };
                li.appendChild(a);
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = '<li>No HTML or PDF files found.</li>';
        }
        fileListContainer.innerHTML = '';
        fileListContainer.appendChild(ul);
    }

    async function loadFile(fullPath) {
        if (state.currentFile === fullPath) return;
        state.currentFile = fullPath;
        welcomeMessage.style.display = 'none';
        document.querySelectorAll('#file-list-container li.active').forEach(el => el.classList.remove('active'));
        const fileLink = document.querySelector(`#file-list-container a[data-path="${fullPath}"]`);
        if (fileLink) fileLink.parentElement.classList.add('active');
        const isPdf = fullPath.toLowerCase().endsWith('.pdf');
        toggleReaderTools(isPdf ? !!window.pdfjsLib : true);
        try {
            const url = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/${fullPath}`;
            if (isPdf) {
                contentFrame.srcdoc = '<html><body style="background-color:var(--bg-secondary);"></body></html>';
                await renderPdfInIframe(url);
            } else {
                contentFrame.src = 'about:blank';
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const htmlContent = await response.text();
                contentFrame.srcdoc = htmlContent;
            }
        } catch (error) {
            console.error("Failed to load file content:", error);
            contentFrame.srcdoc = `<html><body><h2>Failed to load content</h2><p>Error: ${error.message}. File: ${fullPath}</p></body></html>`;
        }
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
        renderAnnotationsForCurrentFile();
        renderAllBookmarks();
    }

    function toggleReaderTools(enabled) {
        const toolsToToggle = [highlightModeToggle, eraseModeToggle, addNoteBtn, addBookmarkBtn, fontSizeSlider, doubleSpaceToggle, marginSlider];
        toolsToToggle.forEach(tool => {
            if (tool) tool.disabled = !enabled;
        });
        if (enabled) {
            colorSwatches.classList.remove('disabled');
        } else {
            colorSwatches.classList.add('disabled');
            state.isHighlightModeActive = false;
            state.isEraseModeActive = false;
            applySettings();
        }
    }

    function toggleHighlightMode() {
        state.isHighlightModeActive = !state.isHighlightModeActive;
        if (state.isHighlightModeActive) state.isEraseModeActive = false;
        applySettings();
    }

    function toggleEraseMode() {
        state.isEraseModeActive = !state.isEraseModeActive;
        if (state.isEraseModeActive) state.isHighlightModeActive = false;
        applySettings();
    }

    function handleIframeInteraction(event) {
        setTimeout(() => {
            if (state.isHighlightModeActive) {
                createAnnotation();
            } else if (state.isEraseModeActive) {
                eraseAnnotation(event.target);
            }
        }, 50);
    }

    function addNoteToSelection() {
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) {
            alert("Please select some text to annotate.");
            return;
        }
        const note = prompt('Add a note for this annotation:');
        if (note === null) {
            selection.removeAllRanges();
            return;
        }
        createAnnotation(note);
    }

    function createAnnotation(note = '') {
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;
        const isPdf = state.currentFile.toLowerCase().endsWith('.pdf');
        const annotationId = `anno-${Date.now()}`;
        const range = selection.getRangeAt(0);
        
        const commonAncestor = range.commonAncestorContainer;
        if (isPdf && !commonAncestor.closest('.textLayer')) {
             alert("Please select text within the PDF content area to highlight.");
             selection.removeAllRanges();
             return;
        }
        
        const rangeData = serializeRange(range, iframeDoc);
        const newAnnotation = {
            id: annotationId,
            text: range.toString(),
            rangeData,
            note: note,
            color: state.settings.activeHighlightColor,
            isPdf: isPdf,
            page: isPdf ? commonAncestor.closest('[data-page]')?.dataset.page : null
        };
        const annotationKey = state.currentFile;
        if (!state.annotations[annotationKey]) state.annotations[annotationKey] = [];
        state.annotations[annotationKey].push(newAnnotation);
        applyAnnotationToDOM(newAnnotation);
        saveAnnotations();
        renderAnnotationsForCurrentFile();
        selection.removeAllRanges();
    }

    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        const range = deserializeRange(annotation.rangeData, iframeDoc);
        if (!range) return;
        const mark = iframeDoc.createElement('mark');
        mark.id = annotation.id;
        mark.className = `highlight highlight-${annotation.color}`;
        if (annotation.note) mark.title = annotation.note;
        try {
            range.surroundContents(mark);
        } catch (e) {
            console.warn("Could not surround contents, trying alternative.", e);
            const fragment = range.extractContents();
            mark.appendChild(fragment);
            range.insertNode(mark);
        }
    }

    function eraseAnnotation(target) {
        const mark = target.closest('.highlight');
        if (!mark || !mark.id.startsWith('anno-')) return;
        const annotationId = mark.id;
        const annotationKey = state.currentFile;
        const fileAnnotations = state.annotations[annotationKey] || [];
        state.annotations[annotationKey] = fileAnnotations.filter(anno => anno.id !== annotationId);
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
        saveAnnotations();
        renderAnnotationsForCurrentFile();
    }

    function applyAnnotationsForCurrentFile() {
        if (!state.currentFile) return;
        const fileAnnotations = state.annotations[state.currentFile] || [];
        fileAnnotations.forEach(applyAnnotationToDOM);
    }

    function renderAnnotationsForCurrentFile() {
        annotationsList.innerHTML = '';
        if (!state.currentFile) {
            annotationsList.innerHTML = '<li>No file selected.</li>';
            return;
        }
        const fileAnnotations = state.annotations[state.currentFile] || [];
        if (fileAnnotations.length === 0) {
            annotationsList.innerHTML = '<li>No annotations for this file.</li>';
            return;
        }
        fileAnnotations.forEach(annotation => {
            const li = document.createElement('li');
            li.dataset.annotationId = annotation.id;
            let content = `<div class="annotation-text">${escapeHTML(annotation.text)}</div>`;
            if (annotation.note) {
                content = `<div class="annotation-note">${escapeHTML(annotation.note)}</div>` + content;
            }
            if (annotation.isPdf && annotation.page) {
                content = `<div class="annotation-page">Page ${annotation.page}</div>` + content;
            }
            li.innerHTML = content;
            li.addEventListener('click', () => {
                const targetEl = contentFrame.contentDocument.getElementById(annotation.id);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            annotationsList.appendChild(li);
        });
    }

    function clearAllAnnotations() {
        if (confirm("Are you sure you want to delete all annotations for all files? This cannot be undone.")) {
            state.annotations = {};
            saveAnnotations();
            renderAnnotationsForCurrentFile();
            const iframeDoc = contentFrame.contentDocument;
            if (iframeDoc) {
                iframeDoc.querySelectorAll('.highlight[id^="anno-"]').forEach(mark => {
                    const parent = mark.parentNode;
                    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
                    parent.removeChild(mark);
                    parent.normalize();
                });
            }
        }
    }

    function addBookmark() {
        if (!state.currentFile) return;
        const iframeWin = contentFrame.contentWindow;
        const iframeDoc = contentFrame.contentDocument;
        const scrollY = iframeWin.scrollY;
        let snippet = `Bookmark at ${Math.round((scrollY / iframeDoc.body.scrollHeight) * 100)}%`;
        try {
            if (state.currentFile.toLowerCase().endsWith('.pdf')) {
                const pageContainers = Array.from(iframeDoc.querySelectorAll('[data-page]'));
                const currentPage = pageContainers.find(p => scrollY < p.offsetTop + p.offsetHeight);
                snippet = `Bookmark on Page ${currentPage ? currentPage.dataset.page : '1'}`;
            } else {
                const pElement = Array.from(iframeDoc.elementsFromPoint(iframeWin.innerWidth / 2, 50)).find(el => el.tagName === 'P' && el.textContent.trim().length > 10);
                if (pElement) snippet = pElement.textContent.trim().substring(0, 100) + '...';
            }
        } catch (e) { /* ignore */ }
        const newBookmark = { id: `bookmark-${Date.now()}`, file: state.currentFile, scrollY, snippet };
        if (!state.bookmarks[state.currentFile]) state.bookmarks[state.currentFile] = [];
        if (state.bookmarks[state.currentFile].some(bm => bm.scrollY === scrollY)) {
            alert("Bookmark already exists at this location.");
            return;
        }
        state.bookmarks[state.currentFile].push(newBookmark);
        saveBookmarks();
        renderAllBookmarks();
    }

    function renderAllBookmarks() {
        bookmarksList.innerHTML = '';
        const allBookmarks = Object.values(state.bookmarks).flat().sort((a, b) => a.file.localeCompare(b.file));
        if (allBookmarks.length === 0) {
            bookmarksList.innerHTML = '<li>No bookmarks yet.</li>';
            return;
        }
        allBookmarks.forEach(bookmark => {
            const li = document.createElement('li');
            li.classList.toggle('active-file', bookmark.file === state.currentFile);
            const bookTitle = bookmark.file.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf)$/i, '').replace(/_/g, ' ').replace(/\//g, ' / ');
            li.innerHTML = `<div class="bookmark-title">${bookTitle}</div><div class="bookmark-snippet">${escapeHTML(bookmark.snippet)}</div>`;
            li.addEventListener('click', () => {
                state.targetScrollY = bookmark.scrollY;
                if (state.currentFile !== bookmark.file) {
                    loadFile(bookmark.file);
                } else if (contentFrame.contentWindow) {
                    contentFrame.contentWindow.scrollTo({ top: bookmark.scrollY, behavior: 'smooth' });
                }
            });
            bookmarksList.appendChild(li);
        });
    }

    function clearAllBookmarks() {
        if (confirm("Are you sure you want to delete all bookmarks? This cannot be undone.")) {
            state.bookmarks = {};
            saveBookmarks();
            renderAllBookmarks();
        }
    }

    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    }

    function loadData(key, defaultValue = {}) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
            return defaultValue;
        }
    }
    
    function saveSettings() { saveData('beansReaderSettings', state.settings); }
    function loadSettings() { Object.assign(state.settings, loadData('beansReaderSettings', state.settings)); }
    function saveAnnotations() { saveData('beansReaderAnnotations', state.annotations); }
    function loadAnnotations() { Object.assign(state.annotations, loadData('beansReaderAnnotations')); }
    function saveBookmarks() { saveData('beansReaderBookmarks', state.bookmarks); }
    function loadBookmarks() { Object.assign(state.bookmarks, loadData('beansReaderBookmarks')); }

    function getPathTo(node, doc) {
        if (node.id) return `//*[@id='${node.id}']`;
        if (node === doc.body) return '/html/body';
        let ix = 0;
        let siblings = node.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            let sibling = siblings[i];
            if (sibling === node) return getPathTo(node.parentNode, doc) + '/' + node.nodeName + '[' + (ix + 1) + ']';
            if (sibling.nodeType === 1 && sibling.nodeName === node.nodeName) ix++;
        }
    }

    function getNodeByPath(path, doc) {
        try {
            return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch (e) {
            console.error("XPath evaluation failed for path:", path, e);
            return null;
        }
    }
    
    function serializeRange(range, doc) {
        return {
            startContainerPath: getPathTo(range.startContainer, doc),
            startOffset: range.startOffset,
            endContainerPath: getPathTo(range.endContainer, doc),
            endOffset: range.endOffset,
        };
    }

    function deserializeRange(rangeData, doc) {
        try {
            const startContainer = getNodeByPath(rangeData.startContainerPath, doc);
            const endContainer = getNodeByPath(rangeData.endContainerPath, doc);
            if (!startContainer || !endContainer) return null;
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
        p.textContent = str;
        return p.innerHTML;
    }

    initialize();
});