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
        currentBook: null, // For EPUB.js book instance
        currentRendition: null, // For EPUB.js rendition instance
        isEraseModeActive: false,
        isDrawing: false,
        drawPoints: [],
        currentNoteCallback: null,
        allFiles: [], 
        metadata: {},
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
        
        drawingCanvas.addEventListener('mousedown', startDrawing);
        drawingCanvas.addEventListener('mousemove', draw);
        drawingCanvas.addEventListener('mouseup', endDrawing);
        drawingCanvas.addEventListener('mouseleave', endDrawing);

        // Correctly calls next/prev on the rendition object
        epubPrev.addEventListener('click', () => state.currentRendition?.prev());
        epubNext.addEventListener('click', () => state.currentRendition?.next());

        searchBar.addEventListener('input', applyFilters);
        filterType.addEventListener('change', applyFilters);
        hideUncategorized.addEventListener('change', applyFilters);
    }

    async function loadMetadata() {
        try {
            const response = await fetch(`./${METADATA_FILE}`);
            if (!response.ok) throw new Error('Metadata file not found');
            state.metadata = await response.json();
        } catch (error) {
            console.warn("Could not load metadata file:", error);
            state.metadata = {};
        }
    }
    
    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        const type = filterType.value;
        const hide = hideUncategorized.checked;
        
        const filteredFiles = state.allFiles.filter(file => {
            const meta = state.metadata[file.path] || {};
            if (hide && !state.metadata[file.path]) return false;
            const fileExt = file.path.split('.').pop();
            if (type !== 'all' && fileExt !== type) return false;
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
        const clickedTab = e.target;
        const targetContent = document.getElementById(clickedTab.dataset.tab);
        if (!targetContent) return;
        document.querySelectorAll('.annotations-panel .tab-link.active').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.annotations-panel .tab-content.active').forEach(c => c.classList.remove('active'));
        clickedTab.classList.add('active');
        targetContent.classList.add('active');
    }

    async function renderPdfInIframe(url) {
        if (!window.pdfjsLib) {
            contentFrame.src = url;
            return;
        }
        try {
            const pdf = await window.pdfjsLib.getDocument({ url }).promise;
            let docHtml = `<style>body{margin:0;background:#525659;}.page-container{margin:1rem auto;box-shadow:0 0 10px rgba(0,0,0,0.5);position:relative;width:fit-content;}canvas{display:block;max-width:100%;height:auto;}.pdf-drawn-highlight{position:absolute;z-index:10;}</style>`;
            for (let i = 1; i <= pdf.numPages; i++) {
                docHtml += `<div class="page-container" data-page-number="${i}"><canvas id="pdf-canvas-${i}"></canvas></div>`;
            }
            contentFrame.srcdoc = docHtml;

            contentFrame.onload = async () => {
                // Waits a moment for the iframe's content to be ready
                await new Promise(resolve => setTimeout(resolve, 0)); 
                
                const iframeDoc = contentFrame.contentDocument;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = iframeDoc.getElementById(`pdf-canvas-${i}`);
                    if (canvas) {
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                    }
                }
                syncDrawingCanvasSize();
                setupIframeListeners();
                applyAnnotationsForCurrentFile();
            };
        } catch (error) {
            console.error("PDF Render Error:", error);
            contentFrame.srcdoc = `<h2>Failed to render PDF</h2><p>${error.message}</p>`;
        }
    }

    function onIframeLoad() {
        if (contentFrame.src && contentFrame.src.startsWith('blob:')) return;
        if (state.currentFile && (state.currentFile.endsWith('.html') || state.currentFile.endsWith('.txt'))) {
            updateIframeStyles();
            setupIframeListeners();
            applyAnnotationsForCurrentFile();
        }
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        iframeDoc.addEventListener('mouseup', createAnnotationFromSelection);
        iframeDoc.addEventListener('click', handleIframeInteraction);
    }
    
    function applySettings() {
        document.body.classList.toggle('dark-mode', state.settings.theme === 'dark');
        themeToggle.textContent = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        fontSizeSlider.value = state.settings.fontSize;
        lineHeightSlider.value = state.settings.lineHeight;
        highlightThicknessSlider.value = state.settings.highlightThickness;
        sidebar.classList.toggle('minimized', state.settings.sidebarMinimized);
        eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        colorSwatches.forEach(s => s.classList.toggle('active', !state.isEraseModeActive && s.dataset.color === state.settings.activeHighlightColor));
        updateIframeStyles();
    }
    
    function toggleTheme() { updateSetting('theme', state.settings.theme === 'dark' ? 'light' : 'dark', applySettings); }
    function toggleSidebarMinimize() { updateSetting('sidebarMinimized', !state.settings.sidebarMinimized, applySettings); }
    
    function handleColorChange(e) {
        if (state.isEraseModeActive) toggleEraseMode();
        updateSetting('activeHighlightColor', e.target.dataset.color, applySettings);
    }

    function updateIframeStyles() {
        const iframeDoc = contentFrame.contentDocument;
        if (iframeDoc && iframeDoc.head) {
            let style = iframeDoc.getElementById('dynamic-reader-styles');
            if (!style) { 
                style = iframeDoc.createElement('style'); 
                style.id = 'dynamic-reader-styles'; 
                iframeDoc.head.appendChild(style); 
            }
            const computed = getComputedStyle(document.body);
            style.innerHTML = `body{font-size:${state.settings.fontSize}px;line-height:${state.settings.lineHeight};color:${computed.getPropertyValue('--text-primary')};background-color:${computed.getPropertyValue('--bg-primary')};font-family:'Arimo',sans-serif;padding:2rem;max-width:800px;margin:0 auto;}.pdf-highlight{background-color:var(--highlight-${state.settings.activeHighlightColor});cursor:pointer;}`;
        }
        if (state.currentRendition) {
            const theme = {'body': {'color': getComputedStyle(document.body).getPropertyValue('--text-primary'),'font-size':`${state.settings.fontSize}px !important`,'line-height':`${state.settings.lineHeight} !important`,'font-family':`'Arimo', sans-serif !important`}};
            state.currentRendition.themes.register("custom", theme);
            state.currentRendition.themes.select("custom");
        }
    }

    async function fetchAndOrganizeFiles() {
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/git/trees/main?recursive=1`;
        try {
            fileListContainer.innerHTML = '<p>Loading library from GitHub...</p>';
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            if (!data.tree) throw new Error("Invalid API response from GitHub: 'tree' object not found.");
            state.allFiles = data.tree
                .filter(item => item.type === 'blob' && /\.(html|pdf|epub|txt)$/i.test(item.path) && item.path.startsWith(LIBRARY_ROOT))
                .map(item => ({name: item.path.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf|epub|txt)$/i, '').replace(/_/g, ' '), path: item.path }))
                .sort((a, b) => a.name.localeCompare(b.name));
            renderFileList(state.allFiles);
        } catch (error) {
            console.error("Failed to fetch files from GitHub:", error);
            fileListContainer.innerHTML = `<div style="padding:10px;color:#ff6b6b;"><strong>Could not load library.</strong><p style="font-size:0.9em;word-wrap:break-word;">Error: ${error.message}</p><p style="font-size:0.8em;margin-top:15px;">This usually means the GitHub repo is private. Please make it public in the repository settings.</p></div>`;
        }
    }
    
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
        fileListContainer.innerHTML = ''; 
        fileListContainer.appendChild(ul);
    }

    async function loadFile(fullPath) {
        if (state.currentFile === fullPath) return;
        state.currentFile = fullPath;
        state.currentBook = null;
        state.currentRendition = null;
        
        welcomeMessage.style.display = 'none';
        document.querySelectorAll('#file-list-container li.active').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`#file-list-container a[data-path="${fullPath}"]`);
        if (activeLink) activeLink.parentElement.classList.add('active');
        
        contentFrame.style.display = 'none';
        epubReaderArea.style.display = 'none';
        drawingCanvas.classList.remove('active');

        const url = `./${fullPath}`;
        const fileType = fullPath.split('.').pop().toLowerCase();

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
                state.currentRendition = state.currentBook.renderTo(epubViewer, { width: "100%", height: "100%" });
                await state.currentRendition.display();
                updateIframeStyles();
            } else if (fileType === 'txt') {
                contentFrame.style.display = 'block';
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                const text = await response.text();
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
            contentFrame.srcdoc = `<h2>Error loading file</h2><p>Could not load ${url}</p><p>${error.message}</p>`; 
        }
        renderAnnotationsForCurrentFile();
        renderAllBookmarks();
    }
    
    function toggleReaderTools(enabled) {
        const tools = document.querySelectorAll('.rh-actions button, .rh-actions .color-swatch, .rh-controls .control');
        tools.forEach(tool => {
            tool.style.opacity = enabled ? '1' : '0.5';
            tool.style.pointerEvents = enabled ? 'auto' : 'none';
        });
    }
    
    function toggleEraseMode() { 
        state.isEraseModeActive = !state.isEraseModeActive;
        applySettings();
    }
    
    function showNoteModal(initialText = '', callback) {
        noteModalTextarea.value = initialText;
        state.currentNoteCallback = callback;
        noteModalOverlay.classList.remove('hidden');
        noteModalTextarea.focus();
    }

    function hideNoteModal() {
        noteModalOverlay.classList.add('hidden');
        state.currentNoteCallback = null;
    }

    function handleIframeInteraction(event) {
        const target = event.target.closest('[id^="anno-"]');
        if (target) {
            if (state.isEraseModeActive) {
                eraseAnnotation(target);
            } else {
                editAnnotationNote(target.id);
            }
        }
    }

    function editAnnotationNote(annotationId) {
        const annotation = findAnnotation(annotationId);
        if (!annotation) return;
        showNoteModal(annotation.note, (newNote) => {
            annotation.note = newNote;
            saveAndApplyAnnotation(annotation);
        });
    }

    function createAnnotationFromSelection() {
        if (state.isEraseModeActive) return;
        const selection = contentFrame.contentWindow.getSelection();
        if (!selection || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const annotation = {
            id: `anno-${Date.now()}`, text: selection.toString(),
            rangeData: serializeHtmlRange(range, contentFrame.contentDocument),
            note: '', color: state.settings.activeHighlightColor,
        };
        selection.removeAllRanges();
        showNoteModal('', (note) => {
            annotation.note = note;
            saveAndApplyAnnotation(annotation);
        });
    }

    function saveAndApplyAnnotation(annotation) {
        if (!state.annotations[state.currentFile]) {
            state.annotations[state.currentFile] = [];
        }
        const existingIndex = state.annotations[state.currentFile].findIndex(a => a.id === annotation.id);
        if (existingIndex > -1) {
            state.annotations[state.currentFile][existingIndex] = annotation;
        } else {
            state.annotations[state.currentFile].push(annotation);
        }
        saveAnnotations();
        renderAnnotationsForCurrentFile();
    }

    function eraseAnnotation(target) {
        const annotationId = target.id;
        if (!state.annotations[state.currentFile]) return;
        state.annotations[state.currentFile] = state.annotations[state.currentFile].filter(a => a.id !== annotationId);
        saveAnnotations();
        renderAnnotationsForCurrentFile();
    }
    
    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        if (annotation.rangeData.type === 'pdf-freehand') {
            const pageDiv = iframeDoc.querySelector(`.page-container[data-page-number="${annotation.rangeData.page}"]`);
            if (!pageDiv) return;
            const canvas = iframeDoc.createElement('canvas');
            canvas.id = annotation.id;
            canvas.className = 'pdf-drawn-highlight';
            canvas.style.cssText = `position:absolute;left:${annotation.rangeData.bounds.x}px;top:${annotation.rangeData.bounds.y}px;pointer-events:all;cursor:pointer;opacity:0.7;`;
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
            if (annotation.rangeData.points && annotation.rangeData.points.length > 0) {
                ctx.moveTo(annotation.rangeData.points[0].x, annotation.rangeData.points[0].y);
                for (let i = 1; i < annotation.rangeData.points.length; i++) {
                    ctx.lineTo(annotation.rangeData.points[i].x, annotation.rangeData.points[i].y);
                }
                ctx.stroke();
            }
        } else if (annotation.rangeData.type === 'html') {
            const range = deserializeHtmlRange(annotation.rangeData, iframeDoc);
            if (!range) return;
            const wrapper = iframeDoc.createElement('span');
            wrapper.id = annotation.id;
            wrapper.className = 'pdf-highlight';
            wrapper.style.backgroundColor = `var(--highlight-${annotation.color})`;
            wrapper.title = annotation.note || "Click to add a note";
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);
        }
    }

    function renderAnnotationsForCurrentFile() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc || !iframeDoc.body) return;
        iframeDoc.querySelectorAll('[id^="anno-"]').forEach(el => {
            const parent = el.parentNode;
            while(el.firstChild) { parent.insertBefore(el.firstChild, el); }
            parent.removeChild(el);
            parent.normalize();
        });
        if (state.currentFile && state.annotations[state.currentFile]) {
            applyAnnotationsForCurrentFile();
        }
        annotationsList.innerHTML = '';
        const currentAnnos = state.annotations[state.currentFile] || [];
        if (currentAnnos.length === 0) {
            annotationsList.innerHTML = '<li>No notes for this document.</li>';
            return;
        }
        currentAnnos.forEach(anno => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="annotation-note">${anno.note || '<em>No note added...</em>'}</div><div class="annotation-text">${anno.text}</div>`;
            annotationsList.appendChild(li);
        });
    }

    function applyAnnotationsForCurrentFile() {
        if (!state.currentFile) return;
        (state.annotations[state.currentFile] || []).forEach(applyAnnotationToDOM);
    }

    function addBookmark() {
        if (!state.currentFile || !contentFrame.contentWindow) return;
        const iframeWin = contentFrame.contentWindow;
        let snippet = 'Top of page';
        if (iframeWin.document && iframeWin.document.body) {
            const firstVisibleElement = Array.from(iframeWin.document.body.querySelectorAll('p, h1, h2, h3, .page-container'))
                .find(el => el.getBoundingClientRect().top > 0);
            snippet = firstVisibleElement ? firstVisibleElement.textContent.trim().substring(0, 100) + '...' : 'Top of page';
        }
        const bookmark = {file: state.currentFile, snippet, scrollY: iframeWin.scrollY, timestamp: Date.now()};
        if (!state.bookmarks[state.currentFile]) state.bookmarks[state.currentFile] = [];
        state.bookmarks[state.currentFile].push(bookmark);
        saveBookmarks();
        renderAllBookmarks();
    }

    function renderAllBookmarks() {
        bookmarksList.innerHTML = '';
        const allBookmarks = Object.values(state.bookmarks).flat().sort((a, b) => b.timestamp - a.timestamp);
        if (allBookmarks.length === 0) { bookmarksList.innerHTML = '<li>No bookmarks yet.</li>'; return; }
        allBookmarks.forEach(bm => {
            const meta = state.metadata[bm.file] || {};
            const title = meta.title || bm.file.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf|epub|txt)$/i,'');
            const author = meta.author ? `<div class="bookmark-author">${meta.author}</div>` : '';
            const li = document.createElement('li');
            li.innerHTML = `<div class="bookmark-title">${title}</div>${author}<div class="bookmark-snippet">${bm.snippet}</div>`;
            li.onclick = () => {
                if (state.currentFile !== bm.file) {
                    contentFrame.onload = () => {
                        contentFrame.contentWindow.scrollTo({ top: bm.scrollY, behavior: 'smooth' });
                        contentFrame.onload = onIframeLoad; // Reset to default
                    };
                    loadFile(bm.file);
                } else {
                    contentFrame.contentWindow.scrollTo({ top: bm.scrollY, behavior: 'smooth' });
                }
            };
            bookmarksList.appendChild(li);
        });
    }

    function syncDrawingCanvasSize() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc || !iframeDoc.body) return;
        drawingCanvas.width = iframeDoc.body.scrollWidth;
        drawingCanvas.height = iframeDoc.body.scrollHeight;
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
        const pos = { x: e.clientX - rect.left + contentFrame.contentWindow.scrollX, y: e.clientY - rect.top + contentFrame.contentWindow.scrollY };
        state.drawPoints = [pos];
        drawingCtx.beginPath();
        drawingCtx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        if (!state.isDrawing) return;
        const rect = drawingCanvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left + contentFrame.contentWindow.scrollX, y: e.clientY - rect.top + contentFrame.contentWindow.scrollY };
        state.drawPoints.push(pos);
        drawingCtx.lineTo(pos.x, pos.y);
        drawingCtx.stroke();
    }
    
    function endDrawing() {
        if (!state.isDrawing) return;
        state.isDrawing = false;
        drawingCanvas.classList.remove('active');
        if (state.drawPoints.length < 2) {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            return;
        }
        const iframeDoc = contentFrame.contentDocument;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.drawPoints.forEach(p => { minX=Math.min(minX,p.x); minY=Math.min(minY,p.y); maxX=Math.max(maxX,p.x); maxY=Math.max(maxY,p.y); });
        let targetPage = null;
        for (const page of iframeDoc.querySelectorAll('.page-container')) {
            if (minY >= page.offsetTop && minY <= page.offsetTop + page.offsetHeight) { targetPage = page; break; }
        }
        if (!targetPage) { drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); return; }
        const normalizedPoints = state.drawPoints.map(p => ({ x: p.x - minX, y: p.y - minY }));
        const annotation = {
            id: `anno-${Date.now()}`, text: "[Freehand Annotation]",
            rangeData: {
                type: 'pdf-freehand', page: targetPage.dataset.pageNumber,
                thickness: state.settings.highlightThickness, points: normalizedPoints,
                bounds: { x: minX - targetPage.offsetLeft, y: minY - targetPage.offsetTop, width: maxX - minX, height: maxY - minY }
            },
            note: '', color: state.settings.activeHighlightColor
        };
        showNoteModal('', (note) => {
            annotation.note = note;
            saveAndApplyAnnotation(annotation);
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        });
    }

    function updateSetting(key, value, callback) { state.settings[key] = value; saveSettings(); if(callback) callback(); }
    function findAnnotation(id) { return (state.annotations[state.currentFile] || []).find(a => a.id === id); }
    function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    function loadData(key) { return JSON.parse(localStorage.getItem(key) || '{}'); }
    function saveSettings() { saveData('beansReaderSettings_v8', state.settings); }
    function loadSettings() { Object.assign(state.settings, loadData('beansReaderSettings_v8')); }
    function saveAnnotations() { saveData('beansReaderAnnotations_v8', state.annotations); }
    function loadAnnotations() { Object.assign(state.annotations, loadData('beansReaderAnnotations_v8')); }
    function saveBookmarks() { saveData('beansReaderBookmarks_v8', state.bookmarks); }
    function loadBookmarks() { Object.assign(state.bookmarks, loadData('beansReaderBookmarks_v8')); }
    
    function getPathTo(node, doc) {
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        if (!node || node === doc.body) return 'BODY';
        let path = '';
        while (node && node !== doc.body) {
            let index = Array.from(node.parentNode.childNodes).filter(n => n.nodeName === node.nodeName).indexOf(node);
            path = `${node.tagName}:nth-of-type(${index + 1})>${path}`;
            node = node.parentNode;
        }
        return `BODY>${path.slice(0, -1)}`;
    }

    function getNodeByPath(path, doc) {
        try { return doc.querySelector(path); } 
        catch (e) { console.error("Could not find node by path:", path, e); return null; }
    }

    function serializeHtmlRange(range, doc) {
        return {
            type: 'html',
            startContainerPath: getPathTo(range.startContainer, doc),
            startOffset: range.startOffset,
            endContainerPath: getPathTo(range.endContainer, doc),
            endOffset: range.endOffset,
        };
    }

    function deserializeHtmlRange(rangeData, doc) {
        try {
            const startNode = getNodeByPath(rangeData.startContainerPath, doc);
            const endNode = getNodeByPath(rangeData.endContainerPath, doc);
            if (!startNode || !endNode) return null;
            
            const startContainer = startNode.hasChildNodes() ? startNode.childNodes[0] : startNode;
            const endContainer = endNode.hasChildNodes() ? endNode.childNodes[0] : endNode;

            if (!startContainer || !endContainer) return null;

            const range = doc.createRange();
            range.setStart(startContainer, rangeData.startOffset);
            range.setEnd(endContainer, rangeData.endOffset);
            return range;
        } catch (e) {
            console.error("Failed to deserialize range:", rangeData, e);
            return null;
        }
    }

    initialize();
});