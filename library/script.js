document.addEventListener('DOMContentLoaded', () => {
    // --- APP SETUP ---
    const LIBRARY_ROOT = 'content/';
    const METADATA_FILE = 'library_meta.json';
    const body = document.body;

    function buildUI() {
        const header = document.createElement('header');
        header.className = 'reader-header';
        header.innerHTML = `
            <div class="header-group rh-nav">
                <button id="sidebar-toggle-btn" class="action-btn" title="Toggle Library">☰</button>
                <div class="nav-divider"></div><a href="index.html" title="Home">⌂</a>
            </div>
            <div class="header-group rh-controls">
                <div class="control" id="html-txt-controls">
                    <div title="Font Size"><span>Aa</span><input type="range" id="font-size-slider" min="12" max="28" value="16" step="1"></div>
                    <div title="Line Spacing"><span>☰</span><input type="range" id="line-height-slider" min="1.5" max="3" value="1.7" step="0.1"></div>
                </div>
                <div class="control hidden" id="pdf-controls"><div title="Highlight Thickness"><span>⬍</span><input type="range" id="highlight-thickness-slider" min="2" max="30" value="15" step="1"></div></div>
            </div>
            <div class="header-group rh-pagination hidden" id="epub-pagination">
                <button id="epub-flow-toggle" class="action-btn" title="Toggle Scroll/Page Mode">📜</button>
                <span>Page <span id="epub-current-page">1</span> of <span id="epub-total-pages">?</span></span>
            </div>
            <div class="header-group rh-actions">
                <div class="color-swatch active" data-color="yellow" style="background:var(--highlight-yellow);" title="Yellow"></div><div class="color-swatch" data-color="pink" style="background:var(--highlight-pink);" title="Pink"></div>
                <div class="color-swatch" data-color="green" style="background:var(--highlight-green);" title="Green"></div><div class="color-swatch" data-color="blue" style="background:var(--highlight-blue);" title="Blue"></div>
                <div class="tool-divider"></div><button id="erase-mode-toggle" class="action-btn" title="Erase Highlight">Eraser</button>
                <div class="tool-divider"></div><button id="add-bookmark-btn" class="action-btn" title="Add Bookmark">⚑</button>
                <button id="annotations-toggle" class="action-btn" title="Show Notes & Bookmarks">߷</button>
                <button id="theme-toggle" class="action-btn" title="Toggle Theme">◐</button>
            </div>`;

        const appContainer = document.createElement('div');
        appContainer.className = 'app-container';
        appContainer.innerHTML = `
            <aside class="sidebar"><nav class="library-nav"><section class="sidebar-section"><h2>Library Contents</h2><div class="filter-controls"><input type="search" id="search-bar" placeholder="Search..."><select id="filter-type"><option value="all">All Types</option><option value="pdf">PDF</option><option value="epub">EPUB</option><option value="html">HTML</option><option value="txt">TXT</option></select></div><div id="file-list-container" class="scrollable"><p>Loading library...</p></div></section></nav></aside>
            <main class="main-content">
                <div id="welcome-message"><h2>Welcome</h2><p>Select a document to begin.</p></div>
                <div id="pdf-viewer-area"></div>
                <div id="epub-reader-area"><div id="epub-viewer"></div><a id="epub-prev">‹</a><a id="epub-next">›</a></div>
                <iframe id="content-frame" name="content-frame" title="Document Content" sandbox="allow-same-origin"></iframe>
                <div id="annotations-panel" class="annotations-panel">
                    <div class="tabs">
                        <button class="tab-link active" data-tab="notes-content">Notes</button>
                        <button class="tab-link" data-tab="bookmarks-content">Bookmarks</button>
                    </div>
                    <div id="notes-content" class="tab-content active">
                        <ul class="annotations-list" id="notes-list"><li>No notes for this document.</li></ul>
                    </div>
                    <div id="bookmarks-content" class="tab-content">
                        <ul class="annotations-list" id="bookmarks-list"><li>No bookmarks for this document.</li></ul>
                    </div>
                </div>
            </main>`;
        
        body.prepend(appContainer);
        body.prepend(header);
    }
    
    buildUI();

    const dom = {
        themeToggle: document.getElementById('theme-toggle'), sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'), sidebar: document.querySelector('.sidebar'), fileListContainer: document.getElementById('file-list-container'),
        contentFrame: document.getElementById('content-frame'), welcomeMessage: document.getElementById('welcome-message'), 
        pdfViewerArea: document.getElementById('pdf-viewer-area'),
        htmlTxtControls: document.getElementById('html-txt-controls'), pdfControls: document.getElementById('pdf-controls'), eraseModeToggle: document.getElementById('erase-mode-toggle'),
        addBookmarkBtn: document.getElementById('add-bookmark-btn'), annotationsToggle: document.getElementById('annotations-toggle'), fontSizeSlider: document.getElementById('font-size-slider'),
        lineHeightSlider: document.getElementById('line-height-slider'), highlightThicknessSlider: document.getElementById('highlight-thickness-slider'),
        colorSwatches: document.querySelectorAll('.rh-actions .color-swatch'),
        epubReaderArea: document.getElementById('epub-reader-area'), epubViewer: document.getElementById('epub-viewer'), epubPrev: document.getElementById('epub-prev'), epubNext: document.getElementById('epub-next'),
        epubPagination: document.getElementById('epub-pagination'), epubCurrentPage: document.getElementById('epub-current-page'), epubTotalPages: document.getElementById('epub-total-pages'),
        epubFlowToggle: document.getElementById('epub-flow-toggle'), searchBar: document.getElementById('search-bar'), filterType: document.getElementById('filter-type'),
        annotationModalOverlay: document.getElementById('annotation-modal-overlay'),
        annotationTextarea: document.getElementById('annotation-textarea'),
        annotationSaveBtn: document.getElementById('annotation-save-btn'),
        annotationCancelBtn: document.getElementById('annotation-cancel-btn'),
        annotationsPanel: document.getElementById('annotations-panel'),
        notesList: document.getElementById('notes-list'),
        bookmarksList: document.getElementById('bookmarks-list'),
        tabLinks: document.querySelectorAll('.annotations-panel .tab-link'),
        tabContents: document.querySelectorAll('.annotations-panel .tab-content'),
    };

    const state = {
        currentFile: null, currentBook: null, currentRendition: null,
        isEraseModeActive: false, currentCfi: null,
        allFiles: [], metadata: {},
        settings: { theme: 'dark', fontSize: 16, lineHeight: 1.7, highlightThickness: 15, sidebarMinimized: false, activeHighlightColor: 'yellow', epubFlow: 'paginated' },
        annotations: {},
    };

    async function initialize() {
        loadSettings();
        loadAnnotations();
        await fetchAndOrganizeFiles();
        applySettings(); 
        setupEventListeners();
        toggleReaderTools(false);
    }

    async function fetchAndOrganizeFiles() {
        try {
            dom.fileListContainer.innerHTML = '<p>Loading library...</p>';
            const response = await fetch(`./${METADATA_FILE}`);
            if (!response.ok) throw new Error(`Could not find ${METADATA_FILE}`);
            const metaObject = await response.json();
            state.metadata = metaObject;
            state.allFiles = Object.keys(metaObject)
                .map(path => ({ name: path.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf|epub|txt)$/i, '').replace(/_/g, ' '), path }))
                .sort((a, b) => a.name.localeCompare(b.name));
            renderFileList(state.allFiles);
        } catch (error) {
            console.error("Failed to load library:", error);
            dom.fileListContainer.innerHTML = `<p style="padding:10px;color:red;">Error: ${error.message}. Check your 'library_meta.json' file.</p>`;
        }
    }

    function renderFileList(files) {
        let listHtml = '';
        if (files.length > 0) {
            const icons = ['☤', '☥', '☧', '☩', '♁', '⚚', '⚛'];
            files.forEach((file, i) => {
                const meta = state.metadata[file.path] || {};
                const authorHtml = meta.author ? `<div class="file-author">${meta.author}</div>` : '';
                listHtml += `<li><a href="#" data-path="${file.path}"><span class="file-icon">${icons[i % icons.length]}</span><div><span class="file-name">${meta.title || file.name}</span>${authorHtml}</div></a></li>`;
            });
            dom.fileListContainer.innerHTML = `<ul>${listHtml}</ul>`;
            dom.fileListContainer.querySelectorAll('a').forEach(a => a.onclick = (e) => { e.preventDefault(); loadFile(a.dataset.path); });
        } else {
            dom.fileListContainer.innerHTML = '<ul><li>No files found.</li></ul>';
        }
    }

    function setupEventListeners() {
        dom.themeToggle.addEventListener('click', () => updateSetting('theme', state.settings.theme === 'dark' ? 'light' : 'dark', applySettings));
        dom.sidebarToggleBtn.addEventListener('click', () => updateSetting('sidebarMinimized', !state.settings.sidebarMinimized, applySettings));
        dom.eraseModeToggle.addEventListener('click', () => {
            state.isEraseModeActive = !state.isEraseModeActive;
            applySettings();
        });
        dom.colorSwatches.forEach(swatch => swatch.addEventListener('click', e => {
            state.isEraseModeActive = false;
            updateSetting('activeHighlightColor', e.target.dataset.color, applySettings);
        }));
        dom.fontSizeSlider.addEventListener('input', e => updateSetting('fontSize', e.target.value, updateReaderStyles));
        dom.lineHeightSlider.addEventListener('input', e => updateSetting('lineHeight', e.target.value, updateReaderStyles));
        dom.contentFrame.addEventListener('load', () => updateReaderStyles());
        dom.epubPrev.addEventListener('click', () => state.currentRendition?.prev());
        dom.epubNext.addEventListener('click', () => state.currentRendition?.next());
        dom.epubFlowToggle.addEventListener('click', () => {
            const newFlow = state.settings.epubFlow === 'paginated' ? 'scrolled-doc' : 'paginated';
            updateSetting('epubFlow', newFlow, () => {
                if (state.currentFile) loadFile(state.currentFile);
            });
        });
        dom.searchBar.addEventListener('input', applyFilters);
        dom.filterType.addEventListener('change', applyFilters);
        dom.annotationCancelBtn.addEventListener('click', () => dom.annotationModalOverlay.classList.add('hidden'));
        dom.annotationSaveBtn.addEventListener('click', saveAnnotation);
        
        dom.annotationsToggle.addEventListener('click', () => {
            dom.annotationsPanel.classList.toggle('open');
        });
        dom.tabLinks.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                dom.tabLinks.forEach(btn => btn.classList.remove('active'));
                dom.tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    async function loadFile(fullPath) {
        if (!fullPath) return;
        state.currentFile = fullPath;
        dom.welcomeMessage.style.display = 'none';
        
        dom.contentFrame.style.display = 'none';
        dom.epubReaderArea.style.display = 'none';
        dom.pdfViewerArea.style.display = 'none';
        
        const fileType = fullPath.split('.').pop().toLowerCase();

        const showTextControls = ['html', 'txt', 'epub'].includes(fileType);
        dom.htmlTxtControls.classList.toggle('hidden', !showTextControls);
        dom.pdfControls.classList.toggle('hidden', fileType !== 'pdf');
        dom.epubPagination.classList.toggle('hidden', fileType !== 'epub');
        dom.epubReaderArea.classList.toggle('scrolled-epub', fileType === 'epub' && state.settings.epubFlow !== 'paginated');
        
        try {
            if (fileType === 'pdf') {
                dom.pdfViewerArea.style.display = 'block';
                const url = new URL(`../${fullPath}`, window.location.href).href;
                await renderPdf(url);
            } else if (fileType === 'epub') {
                dom.epubReaderArea.style.display = 'block';
                await renderEpub(fullPath);
            } else { 
                dom.contentFrame.style.display = 'block';
                const url = new URL(`../${fullPath}`, window.location.href).href;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                let content = await response.text();
                if (fileType === 'txt') content = `<pre style="white-space:pre-wrap;font-family:inherit;">${content}</pre>`;
                dom.contentFrame.srcdoc = `<html><head></head><body>${content}</body></html>`;
            }
            toggleReaderTools(true);
            renderAnnotationsPanel();
        } catch (error) { 
            console.error("Error loading file:", error);
            dom.welcomeMessage.style.display = 'block';
            dom.welcomeMessage.innerHTML = `<h2>Error loading file</h2><p>${error.message}</p>`; 
        }
    }

    async function renderPdf(url) {
        if (!window.pdfjsLib) throw new Error("PDF.js is not loaded.");
        dom.pdfViewerArea.innerHTML = '<p style="color:white;padding:2rem;">Loading PDF...</p>';
        const pdf = await window.pdfjsLib.getDocument(url).promise;
        dom.pdfViewerArea.innerHTML = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            dom.pdfViewerArea.appendChild(canvas);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
        }
    }
    
    async function renderEpub(fullPath) {
        if (state.currentRendition) state.currentRendition.destroy();
        state.currentBook = null;
        state.currentRendition = null;
        dom.epubViewer.innerHTML = '';

        // --- THE DEFINITIVE FIX ---
        // This combination of a full URL and the manager options is the most robust.
        const bookUrl = new URL(`../${fullPath}`, window.location.href).href;
        state.currentBook = window.ePub(bookUrl);
        
        await state.currentBook.ready;
        
        const renditionOptions = {
            manager: state.settings.epubFlow === 'scrolled-doc' ? 'continuous' : 'default',
            flow: state.settings.epubFlow,
        };

        if (state.settings.epubFlow === 'paginated') {
            renditionOptions.width = "100%";
            renditionOptions.height = "100%";
        }

        state.currentRendition = state.currentBook.renderTo(dom.epubViewer, renditionOptions);

        const handleHighlightClick = (cfiRange) => {
            if (state.isEraseModeActive) {
                state.currentRendition.annotations.remove(cfiRange, "highlight");
                state.annotations[state.currentFile] = (state.annotations[state.currentFile] || []).filter(a => a.cfi !== cfiRange);
                saveAnnotations();
                renderAnnotationsPanel();
            } else {
                showAnnotationModal(cfiRange);
            }
        };

        state.currentRendition.on("selected", (cfiRange, contents) => {
            const color = state.settings.activeHighlightColor;
            state.currentRendition.annotations.add("highlight", cfiRange, {}, (e) => handleHighlightClick(cfiRange), "hl", { "fill": color, "fill-opacity": "0.5", "mix-blend-mode": "multiply" });
            contents.window.getSelection().removeAllRanges();
            if (!state.annotations[state.currentFile]) state.annotations[state.currentFile] = [];
            state.annotations[state.currentFile].push({ cfi: cfiRange, color: color, note: "" });
            saveAnnotations();
            renderAnnotationsPanel();
        });

        await state.currentRendition.display();

        (state.annotations[state.currentFile] || []).forEach(anno => {
            state.currentRendition.annotations.add("highlight", anno.cfi, {}, (e) => handleHighlightClick(anno.cfi), "hl", { "fill": anno.color, "fill-opacity": "0.5", "mix-blend-mode": "multiply" });
        });

        const isPaginated = state.settings.epubFlow === 'paginated';
        dom.epubPrev.style.display = isPaginated ? 'flex' : 'none';
        dom.epubNext.style.display = isPaginated ? 'flex' : 'none';
        dom.epubPagination.querySelector('span').style.visibility = isPaginated ? 'visible' : 'hidden';

        if (isPaginated) {
            await state.currentBook.locations.generate(1650);
            dom.epubTotalPages.textContent = state.currentBook.locations.total;
            state.currentRendition.on("relocated", location => {
                dom.epubCurrentPage.textContent = state.currentBook.locations.locationFromCfi(location.start.cfi);
            });
        }
        updateReaderStyles();
    }

    async function renderAnnotationsPanel() {
        if (!state.currentBook || !state.currentBook.ready) {
            dom.notesList.innerHTML = '<li>Load a book to see notes.</li>';
            dom.bookmarksList.innerHTML = '<li>Load a book to see bookmarks.</li>';
            return;
        }
    
        const currentAnnos = state.annotations[state.currentFile] || [];
        const notes = [];
        const bookmarks = [];
    
        await Promise.all(currentAnnos.map(async (anno) => {
            try {
                const range = await state.currentBook.getRange(anno.cfi);
                const text = range.toString().trim();
                const item = { ...anno, text: text.substring(0, 100) };
                if (anno.note) {
                    notes.push(item);
                } else {
                    bookmarks.push(item);
                }
            } catch (e) {
                console.warn("Could not find text for CFI:", anno.cfi);
            }
        }));
    
        dom.notesList.innerHTML = notes.length ? notes.map(n => `<li data-cfi="${n.cfi}"><div class="annotation-note">${n.note}</div><div class="annotation-text">“...${n.text}...”</div></li>`).join('') : '<li>No notes for this document.</li>';
        dom.bookmarksList.innerHTML = bookmarks.length ? bookmarks.map(b => `<li data-cfi="${b.cfi}"><div class="annotation-text">“...${b.text}...”</div></li>`).join('') : '<li>No bookmarks for this document.</li>';
    
        document.querySelectorAll('.annotations-list li[data-cfi]').forEach(item => {
            item.addEventListener('click', () => {
                state.currentRendition.display(item.dataset.cfi);
                dom.annotationsPanel.classList.remove('open');
            });
        });
    }

    function showAnnotationModal(cfi) {
        state.currentCfi = cfi;
        const existingAnnotation = (state.annotations[state.currentFile] || []).find(a => a.cfi === cfi);
        dom.annotationTextarea.value = existingAnnotation?.note || "";
        dom.annotationModalOverlay.classList.remove('hidden');
        dom.annotationTextarea.focus();
    }

    function saveAnnotation() {
        const annotation = (state.annotations[state.currentFile] || []).find(a => a.cfi === state.currentCfi);
        if (annotation) {
            annotation.note = dom.annotationTextarea.value;
            saveAnnotations();
            renderAnnotationsPanel();
        }
        dom.annotationModalOverlay.classList.add('hidden');
        state.currentCfi = null;
    }

    function applySettings() {
        body.classList.toggle("dark-mode", state.settings.theme === 'dark');
        dom.sidebar.classList.toggle("minimized", state.settings.sidebarMinimized);
        dom.epubFlowToggle.textContent = state.settings.epubFlow === 'paginated' ? '📜' : '📖';
        dom.epubFlowToggle.title = state.settings.epubFlow === 'paginated' ? 'Switch to Scroll Mode' : 'Switch to Page Mode';
        dom.eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        dom.colorSwatches.forEach(s => s.classList.toggle('active', !state.isEraseModeActive && s.dataset.color === state.settings.activeHighlightColor));
        updateReaderStyles();
    }
    
    function updateReaderStyles() {
        const fontSize = state.settings.fontSize;
        const lineHeight = state.settings.lineHeight;
        if (state.currentRendition) {
            const theme = { body: { "color": getComputedStyle(body).getPropertyValue("--text-primary"), "font-size": `${fontSize}px !important`, "line-height": `${lineHeight} !important` } };
            state.currentRendition.themes.register("custom", theme);
            state.currentRendition.themes.select("custom");
        }
        const doc = dom.contentFrame.contentDocument;
        if (doc?.head) {
            let style = doc.getElementById('dynamic-reader-styles');
            if (!style) { style = doc.createElement('style'); style.id = 'dynamic-reader-styles'; doc.head.appendChild(style); }
            const computed = getComputedStyle(body);
            style.innerHTML = `body{font-size:${fontSize}px;line-height:${lineHeight};color:${computed.getPropertyValue("--text-primary")};background-color:${computed.getPropertyValue("--bg-primary")};padding:2rem;max-width:800px;margin:0 auto;}`;
        }
    }
    
    function applyFilters(){const e=dom.searchBar.value.toLowerCase(),t=dom.filterType.value;renderFileList(state.allFiles.filter(n=>{const o=state.metadata[n.path]||{};if("all"!==t&&n.path.split(".").pop()!==t)return!1;return(o.title||n.name).toLowerCase().includes(e)||(o.author||"").toLowerCase().includes(e)||(o.subjects||[]).join(" ").toLowerCase().includes(e)}))}
    function toggleReaderTools(e){document.querySelectorAll(".rh-actions button, .rh-actions .color-swatch, .rh-controls .control").forEach(t=>{t.style.opacity=e?"1":".5";t.style.pointerEvents=e?"auto":"none"})}
    function updateSetting(key, value, callback) { state.settings[key] = value; saveSettings(); if(callback) callback(); }
    function loadSettings() { Object.assign(state.settings, JSON.parse(localStorage.getItem('beansReaderSettings_v10') || '{}')); }
    function saveSettings() { localStorage.setItem('beansReaderSettings_v10', JSON.stringify(state.settings)); }
    function loadAnnotations() { Object.assign(state.annotations, JSON.parse(localStorage.getItem('beansReaderAnnotations_v10') || '{}')); }
    function saveAnnotations() { localStorage.setItem('beansReaderAnnotations_v10', JSON.stringify(state.annotations)); }
    
    initialize();
});