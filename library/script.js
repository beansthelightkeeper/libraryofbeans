document.addEventListener('DOMContentLoaded', () => {
    // --- USER CONFIGURATION ---
    const GITHUB_USERNAME = "beansthelightkeeper";
    const GITHUB_REPO = "libraryofbeans";
    const LIBRARY_ROOT = 'content/';
    const PDFJS_VERSION = '4.4.168';

    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const fileListContainer = document.getElementById('file-list-container');
    const contentFrame = document.getElementById('content-frame');
    const welcomeMessage = document.getElementById('welcome-message');
    const drawingCanvas = document.getElementById('pdf-drawing-canvas');
    const drawingCtx = drawingCanvas.getContext('2d');
    
    // Header Tools
    const eraseModeToggle = document.getElementById('erase-mode-toggle');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const annotationsToggle = document.getElementById('annotations-toggle');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const lineHeightSlider = document.getElementById('line-height-slider');
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

    // --- App State ---
    const state = {
        currentFile: null,
        isDrawing: false,
        drawStartPos: { x: 0, y: 0 },
        currentNoteCallback: null,
        settings: {
            theme: 'dark',
            fontSize: 16,
            lineHeight: 1.7,
            sidebarMinimized: false,
            activeHighlightColor: 'yellow',
        },
        annotations: {},
        bookmarks: {},
    };
    
    const ICONS = { sun: '☀', moon: '☾' };

    function initialize() {
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.standardFontDataUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/standard_fonts/`;
        }
        loadSettings();
        loadAnnotations();
        loadBookmarks();
        applySettings();
        fetchAndOrganizeFiles();
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
        contentFrame.addEventListener('load', onIframeLoad);
        colorSwatches.forEach(swatch => swatch.addEventListener('click', handleColorChange));
        tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
        noteModalSave.addEventListener('click', () => {
            if (state.currentNoteCallback) state.currentNoteCallback(noteModalTextarea.value);
            hideNoteModal();
        });
        noteModalCancel.addEventListener('click', hideNoteModal);
        
        // Drawing canvas listeners
        drawingCanvas.addEventListener('mousedown', startDrawing);
        drawingCanvas.addEventListener('mousemove', draw);
        drawingCanvas.addEventListener('mouseup', endDrawing);
        drawingCanvas.addEventListener('mouseleave', endDrawing);
    }
    
    function handleTabClick(e) {
        const targetTab = e.currentTarget.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === targetTab));
    }

    async function renderPdfInIframe(url) {
        if (!window.pdfjsLib) { contentFrame.src = url; return; }
        try {
            const pdf = await window.pdfjsLib.getDocument({ url }).promise;
            const iframeDoc = contentFrame.contentDocument;
            iframeDoc.body.innerHTML = '';
            iframeDoc.body.style.cssText = `margin:0; background-color:var(--bg-secondary);`;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                
                const container = iframeDoc.createElement('div');
                container.className = 'page-container';
                container.style.cssText = `position:relative; width:${viewport.width}px; height:${viewport.height}px; margin:20px auto; box-shadow:var(--shadow);`;
                container.dataset.pageNumber = i;

                const canvas = iframeDoc.createElement('canvas');
                const textLayerDiv = iframeDoc.createElement('div');
                textLayerDiv.className = 'textLayer';
                container.append(canvas, textLayerDiv);
                iframeDoc.body.appendChild(container);

                canvas.width = viewport.width; canvas.height = viewport.height;

                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                const textContent = await page.getTextContent();
                const textLayer = new window.pdfjsLib.TextLayer({ textContentSource: textContent, container: textLayerDiv, viewport });
                await textLayer.render();
            }
            toggleReaderTools(true);
            setupIframeListeners();
            applyAnnotationsForCurrentFile();
            
            // Sync drawing canvas size after PDF renders
            setTimeout(() => syncDrawingCanvasSize(), 100);

        } catch (error) { console.error("PDF Render Error:", error); contentFrame.srcdoc = `<h2>Failed to render PDF</h2><p>${error.message}</p>`; }
    }

    function onIframeLoad() {
        if (!state.currentFile || !state.currentFile.toLowerCase().endsWith('.pdf')) {
             drawingCanvas.classList.remove('active'); // Hide canvas for HTML files
             return;
        }
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        updateIframeStyles();
        setupIframeListeners();
        applyAnnotationsForCurrentFile();
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        iframeDoc.addEventListener('click', handleIframeInteraction);
        iframeDoc.addEventListener('mouseup', handleIframeInteraction);
        // Also listen to the window for resize events
        contentFrame.contentWindow.addEventListener('resize', syncDrawingCanvasSize);
    }
    
    function applySettings() {
        document.body.classList.toggle('dark-mode', state.settings.theme === 'dark');
        themeToggle.textContent = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        fontSizeSlider.value = state.settings.fontSize;
        lineHeightSlider.value = state.settings.lineHeight;
        sidebar.classList.toggle('minimized', state.settings.sidebarMinimized);
        sidebarToggleBtn.classList.toggle('minimized', state.settings.sidebarMinimized);
        eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        colorSwatches.forEach(s => s.classList.toggle('active', !state.isEraseModeActive && s.dataset.color === state.settings.activeHighlightColor));
        updateIframeStyles();
    }
    
    function toggleTheme() { updateSetting('theme', state.settings.theme === 'dark' ? 'light' : 'dark', applySettings); }
    function toggleSidebarMinimize() { updateSetting('sidebarMinimized', !state.settings.sidebarMinimized, applySettings); }
    function handleColorChange(e) {
        if (!e.target.classList.contains('color-swatch')) return;
        state.isEraseModeActive = false; // Turn off eraser when a color is picked
        updateSetting('activeHighlightColor', e.target.dataset.color, applySettings);
    }

    function updateIframeStyles() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc || !iframeDoc.head) return;
        let style = iframeDoc.getElementById('dynamic-reader-styles');
        if (!style) { style = iframeDoc.createElement('style'); style.id = 'dynamic-reader-styles'; iframeDoc.head.appendChild(style); }
        const computed = getComputedStyle(document.body);
        style.innerHTML = `:root {--highlight-yellow:${computed.getPropertyValue('--highlight-yellow')};--highlight-pink:${computed.getPropertyValue('--highlight-pink')};--highlight-green:${computed.getPropertyValue('--highlight-green')};--highlight-blue:${computed.getPropertyValue('--highlight-blue')};} body{font-family:${computed.getPropertyValue('--font-main')};color:${computed.getPropertyValue('--text-primary')};background:${computed.getPropertyValue('--bg-primary')};line-height:${state.settings.lineHeight};font-size:${state.settings.fontSize}px;padding:2% 8%;margin:0 auto;max-width:80ch;} img{max-width:100%;height:auto;border-radius:8px;} a{color:${computed.getPropertyValue('--accent')};} .highlight-yellow{background:var(--highlight-yellow);} .highlight-pink{background:var(--highlight-pink);} .highlight-green{background:var(--highlight-green')} .highlight-blue{background:var(--highlight-blue);} mark[id^="anno-"]{cursor:pointer;border-radius:2px;} .pdf-drawn-highlight{position:absolute;z-index:10;pointer-events:all;cursor:pointer;}`;
    }

    async function fetchAndOrganizeFiles() {
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/git/trees/main?recursive=1`;
        try {
            fileListContainer.innerHTML = '<p>Loading library...</p>';
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            const files = data.tree
                .filter(item => item.type === 'blob' && (item.path.endsWith('.html') || item.path.endsWith('.pdf')) && item.path.startsWith(LIBRARY_ROOT))
                .map(item => ({ name: item.path.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf)$/i, '').replace(/_/g, ' '), path: item.path }))
                .sort((a, b) => a.name.localeCompare(b.name));
            renderFileList(files);
        } catch (error) { console.error("Failed to fetch files:", error); fileListContainer.innerHTML = '<p>Could not load library.</p>'; }
    }
    
    function renderFileList(files) {
        const ul = document.createElement('ul');
        if (files.length > 0) {
            const icons = ['☤', '☥', '☧', '☩', '♁', '⚚', '⚛'];
            files.forEach((file, i) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.path = file.path;
                a.innerHTML = `<span class="file-icon">${icons[i % icons.length]}</span><span class="file-name">${file.name}</span>`;
                a.onclick = (e) => { e.preventDefault(); loadFile(file.path); };
                li.appendChild(a);
                ul.appendChild(li);
            });
        }
        fileListContainer.innerHTML = ''; fileListContainer.appendChild(ul);
    }


    async function loadFile(fullPath) {
        if (state.currentFile === fullPath) return;
        state.currentFile = fullPath;
        welcomeMessage.style.display = 'none';
        document.querySelectorAll('#file-list-container li.active').forEach(el => el.classList.remove('active'));
        document.querySelector(`#file-list-container a[data-path="${fullPath}"]`)?.parentElement.classList.add('active');
        const url = `./${fullPath}`; // Corrected path
        try {
            if (fullPath.toLowerCase().endsWith('.pdf')) {
                contentFrame.srcdoc = '<p style="text-align:center;padding:2rem;">Loading PDF...</p>';
                await new Promise(r => setTimeout(r, 0));
                await renderPdfInIframe(url);
            } else {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                contentFrame.srcdoc = await response.text();
                toggleReaderTools(true);
            }
        } catch (error) { contentFrame.srcdoc = `<h2>Error</h2><p>${error.message}</p>`; }
        renderAnnotationsForCurrentFile();
        renderAllBookmarks();
    }
    
    function toggleReaderTools(enabled) {
        [addBookmarkBtn, fontSizeSlider, lineHeightSlider, eraseModeToggle].forEach(tool => tool.disabled = !enabled);
        colorSwatches.forEach(swatch => swatch.classList.toggle('disabled', !enabled));
    }
    
    function toggleEraseMode() { updateSetting('isEraseModeActive', !state.isEraseModeActive, applySettings); }
    
    // --- Annotation Modal Logic ---
    function showNoteModal(initialText = '', callback) {
        noteModalTextarea.value = initialText;
        state.currentNoteCallback = callback;
        noteModalOverlay.classList.remove('hidden');
        noteModalTextarea.focus();
    }
    function hideNoteModal() { noteModalOverlay.classList.add('hidden'); state.currentNoteCallback = null; }

    function handleIframeInteraction(event) {
        const target = event.target;
        const mark = target.closest('[id^="anno-"]');
        if (event.type === 'click' && mark) {
            editAnnotationNote(mark.id);
            return;
        }
        if (event.type === 'mouseup' && state.currentFile && !state.currentFile.toLowerCase().endsWith('.pdf')) {
            setTimeout(() => {
                const selection = contentFrame.contentDocument.getSelection();
                if (!selection || selection.isCollapsed) return;
                if (state.isEraseModeActive) eraseAnnotation(target);
                else createAnnotationFromSelection();
            }, 50);
        }
    }
    
    function editAnnotationNote(annotationId) {
        const annotation = findAnnotation(annotationId);
        if (!annotation) return;
        showNoteModal(annotation.note, (newNote) => {
            annotation.note = newNote;
            saveAnnotations();
            renderAnnotationsForCurrentFile();
            const iframeDoc = contentFrame.contentDocument;
            iframeDoc.querySelectorAll(`[id="${annotationId}"]`).forEach(el => el.title = newNote);
        });
    }

    function createAnnotationFromSelection() {
        // This function is now ONLY for HTML files
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;
        
        const range = selection.getRangeAt(0);
        const annotationId = `anno-${Date.now()}`;
        const annotation = { 
            id: annotationId, 
            text: range.toString(), 
            rangeData: { type: 'html', ...serializeHtmlRange(range, iframeDoc) }, 
            note: '', 
            color: state.settings.activeHighlightColor 
        };
        
        saveAndApplyAnnotation(annotation);
        selection.removeAllRanges();
    }

    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        if (annotation.rangeData.type === 'pdf-draw') {
            const pageDiv = iframeDoc.querySelector(`.page-container[data-page-number="${annotation.rangeData.page}"]`);
            if (!pageDiv) return;
            const mark = iframeDoc.createElement('div');
            mark.id = annotation.id;
            mark.className = `pdf-drawn-highlight highlight-${annotation.color}`;
            const rect = annotation.rangeData.rect;
            mark.style.cssText = `left:${rect.x}px; top:${rect.y}px; width:${rect.width}px; height:${rect.height}px;`;
            mark.title = annotation.note || "Click to add a note";
            pageDiv.appendChild(mark);

        } else if (annotation.rangeData.type === 'html') {
            const range = deserializeHtmlRange(annotation.rangeData, iframeDoc);
            if (!range) return;
            const mark = iframeDoc.createElement('mark');
            mark.id = annotation.id;
            mark.className = `highlight-${annotation.color}`;
            mark.title = annotation.note || "Click to add a note";
            try { range.surroundContents(mark); }
            catch (e) { const frag = range.extractContents(); mark.appendChild(frag); range.insertNode(mark); }
        }
    }
    
    function saveAndApplyAnnotation(annotation) {
        if (!state.annotations[state.currentFile]) state.annotations[state.currentFile] = [];
        state.annotations[state.currentFile].push(annotation);
        applyAnnotationToDOM(annotation);
        saveAnnotations();
        renderAnnotationsForCurrentFile();
    }

    function eraseAnnotation(target) {
        const mark = target.closest('[id^="anno-"]');
        if (!mark) return;
        const annotationId = mark.id;
        state.annotations[state.currentFile] = (state.annotations[state.currentFile] || []).filter(a => a.id !== annotationId);
        contentFrame.contentDocument.querySelectorAll(`[id="${annotationId}"]`).forEach(el => {
            if (el.nodeName === 'MARK') {
                const parent = el.parentNode;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
            } else {
                el.remove();
            }
        });
        saveAnnotations();
        renderAnnotationsForCurrentFile();
    }

    function applyAnnotationsForCurrentFile() {
        if (!state.currentFile) return;
        (state.annotations[state.currentFile] || []).forEach(applyAnnotationToDOM);
    }

    function renderAnnotationsForCurrentFile() {
        annotationsList.innerHTML = '';
        const fileAnnos = state.annotations[state.currentFile] || [];
        if (fileAnnos.length === 0) { annotationsList.innerHTML = '<li>No notes for this file.</li>'; return; }
        fileAnnos.forEach(anno => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="annotation-note">${anno.note || '<i>Click highlight to add note</i>'}</div><div class="annotation-text">${anno.text}</div>`;
            li.onclick = () => {
                 const firstMark = contentFrame.contentDocument.getElementById(anno.id);
                 firstMark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            annotationsList.appendChild(li);
        });
    }
    
    function addBookmark() {
        if (!state.currentFile) return;
        const iframeWin = contentFrame.contentWindow;
        const iframeDoc = contentFrame.contentDocument;
        const scrollY = iframeWin.scrollY;
        let snippet = `Bookmark at ${Math.round((scrollY / iframeDoc.body.scrollHeight) * 100)}%`;
        const pElement = Array.from(iframeDoc.querySelectorAll('p, div.textLayer > span')).find(p => p.offsetTop >= scrollY);
        if (pElement) snippet = pElement.textContent.trim().substring(0, 100) + '...';
        if (!state.bookmarks[state.currentFile]) state.bookmarks[state.currentFile] = [];
        if (state.bookmarks[state.currentFile].some(bm => bm.scrollY === scrollY)) return;
        state.bookmarks[state.currentFile].push({ id: `bm-${Date.now()}`, file: state.currentFile, scrollY, snippet });
        saveBookmarks();
        renderAllBookmarks();
    }

    function renderAllBookmarks() {
        bookmarksList.innerHTML = '';
        const allBookmarks = Object.values(state.bookmarks).flat();
        if (allBookmarks.length === 0) { bookmarksList.innerHTML = '<li>No bookmarks yet.</li>'; return; }
        allBookmarks.forEach(bm => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="bookmark-title">${bm.file.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf)$/i,'')}</div><div class="bookmark-snippet">${bm.snippet}</div>`;
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

    // --- PDF Drawing Canvas Logic ---
    function syncDrawingCanvasSize() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc || !iframeDoc.body) return;
        drawingCanvas.width = iframeDoc.body.scrollWidth;
        drawingCanvas.height = iframeDoc.body.scrollHeight;
    }

    function startDrawing(e) {
        if (!state.currentFile || !state.currentFile.toLowerCase().endsWith('.pdf') || state.isEraseModeActive) return;
        state.isDrawing = true;
        const rect = drawingCanvas.getBoundingClientRect();
        state.drawStartPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        drawingCanvas.classList.add('active');
    }

    function draw(e) {
        if (!state.isDrawing) return;
        const rect = drawingCanvas.getBoundingClientRect();
        const currentPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const { x, y } = state.drawStartPos;
        const width = currentPos.x - x;
        const height = currentPos.y - y;

        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCtx.fillStyle = getComputedStyle(document.body).getPropertyValue(`--highlight-${state.settings.activeHighlightColor}`);
        drawingCtx.fillRect(x, y, width, height);
    }
    
    function endDrawing(e) {
        if (!state.isDrawing) return;
        state.isDrawing = false;
        drawingCanvas.classList.remove('active');
        const rect = drawingCanvas.getBoundingClientRect();
        const endPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        const startX = Math.min(state.drawStartPos.x, endPos.x);
        const startY = Math.min(state.drawStartPos.y, endPos.y);
        const width = Math.abs(state.drawStartPos.x - endPos.x);
        const height = Math.abs(state.drawStartPos.y - endPos.y);

        if (width < 10 || height < 10) return; // Ignore tiny accidental drags

        // Find which page the highlight is on
        const iframeDoc = contentFrame.contentDocument;
        const scrollY = contentFrame.contentWindow.scrollY;
        let targetPage = null;
        const pageContainers = iframeDoc.querySelectorAll('.page-container');
        for (const page of pageContainers) {
            if (startY + scrollY >= page.offsetTop && startY + scrollY <= page.offsetTop + page.offsetHeight) {
                targetPage = page;
                break;
            }
        }
        if (!targetPage) return;

        const annotationId = `anno-${Date.now()}`;
        const annotation = {
            id: annotationId,
            text: "[Drawn Annotation]",
            rangeData: {
                type: 'pdf-draw',
                page: targetPage.dataset.pageNumber,
                rect: {
                    x: startX - (targetPage.offsetLeft),
                    y: startY - (targetPage.offsetTop - scrollY),
                    width, height
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


    // --- UTILITY & STORAGE ---
    function updateSetting(key, value, callback) { state.settings[key] = value; saveSettings(); if(callback) callback(); }
    function findAnnotation(id) { return (state.annotations[state.currentFile] || []).find(a => a.id === id); }
    function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    function loadData(key) { return JSON.parse(localStorage.getItem(key) || '{}'); }
    function saveSettings() { saveData('beansReaderSettings_v5', state.settings); }
    function loadSettings() { Object.assign(state.settings, loadData('beansReaderSettings_v5')); }
    function saveAnnotations() { saveData('beansReaderAnnotations_v5', state.annotations); }
    function loadAnnotations() { Object.assign(state.annotations, loadData('beansReaderAnnotations_v5')); }
    function saveBookmarks() { saveData('beansReaderBookmarks_v5', state.bookmarks); }
    function loadBookmarks() { Object.assign(state.bookmarks, loadData('beansReaderBookmarks_v5')); }
    
    function getPathTo(node, doc) { if (node.id) return `#${node.id}`; if (node.nodeName === 'BODY') return '/html/body'; if (node.nodeName === '#text') { let i=1, s=node.previousSibling; while(s) { if (s.nodeName==='#text') i++; s=s.previousSibling; } return `${getPathTo(node.parentNode, doc)}/text()[${i}]`; } let i=1, s=node.previousSibling; while(s) { if (s.nodeName===node.nodeName) i++; s=s.previousSibling; } return `${getPathTo(node.parentNode, doc)}/${node.nodeName.toLowerCase()}[${i}]`; }
    function getNodeByPath(path, doc) { try { return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } catch (e) { return null; } }
    function serializeHtmlRange(range, doc) { return { startPath: getPathTo(range.startContainer, doc), startOffset: range.startOffset, endPath: getPathTo(range.endContainer, doc), endOffset: range.endOffset }; }
    function deserializeHtmlRange(rangeData, doc) { try { const startNode = getNodeByPath(rangeData.startPath, doc); const endNode = getNodeByPath(rangeData.endPath, doc); if (!startNode || !endNode) return null; const range = doc.createRange(); range.setStart(startNode, rangeData.startOffset); range.setEnd(endNode, rangeData.endOffset); return range; } catch (e) { return null; } }

    initialize();
});

