document.addEventListener('DOMContentLoaded', () => {
    // --- APP SETUP ---
    const LIBRARY_ROOT = 'content/';
    const METADATA_FILE = 'library_meta.json';

    // --- DOM Elements ---
    const header = document.querySelector('.reader-header');
    const sidebarEl = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // --- App State ---
    const state = {
        currentFile: null, currentBook: null, currentRendition: null,
        isEraseModeActive: false, isDrawing: false, drawPoints: [],
        currentNoteCallback: null, allFiles: [], metadata: {},
        settings: {
            theme: 'dark', fontSize: 16, lineHeight: 1.7, highlightThickness: 15,
            sidebarMinimized: false, activeHighlightColor: 'yellow',
        },
        annotations: {}, bookmarks: {},
    };
    
    // --- BUILD UI ---
    function buildUI() {
        header.innerHTML = `
            <div class="header-group rh-nav">
                <button id="sidebar-toggle-btn" class="action-btn" title="Toggle Library">☰</button>
                <div class="nav-divider"></div><a href="#" title="Home">⌂</a>
            </div>
            <div class="header-group rh-controls">
                <div class="control" id="html-txt-controls">
                    <div title="Font Size"><span>Aa</span><input type="range" id="font-size-slider" min="12" max="28" value="16" step="1"></div>
                    <div title="Line Spacing"><span>☰</span><input type="range" id="line-height-slider" min="1.5" max="3" value="1.7" step="0.1"></div>
                </div>
                <div class="control hidden" id="pdf-controls"><div title="Highlight Thickness"><span>⬍</span><input type="range" id="highlight-thickness-slider" min="2" max="30" value="15" step="1"></div></div>
            </div>
            <div class="header-group rh-pagination hidden" id="epub-pagination"><span>Page <span id="epub-current-page">1</span> of <span id="epub-total-pages">?</span></span></div>
            <div class="header-group rh-actions">
                <div class="color-swatch active" data-color="yellow" style="background:var(--highlight-yellow);" title="Yellow"></div>
                <div class="color-swatch" data-color="pink" style="background:var(--highlight-pink);" title="Pink"></div>
                <div class="color-swatch" data-color="green" style="background:var(--highlight-green);" title="Green"></div>
                <div class="color-swatch" data-color="blue" style="background:var(--highlight-blue);" title="Blue"></div>
                <div class="tool-divider"></div><button id="erase-mode-toggle" class="action-btn" title="Erase Highlight">Eraser</button>
                <div class="tool-divider"></div><button id="add-bookmark-btn" class="action-btn" title="Add Bookmark">⚑</button>
                <button id="annotations-toggle" class="action-btn" title="Show Notes & Bookmarks">߷</button>
                <button id="theme-toggle" class="action-btn" title="Toggle Theme">◐</button>
            </div>`;
        
        sidebarEl.innerHTML = `<nav class="library-nav"><section class="sidebar-section"><h2>Library Contents</h2><div class="filter-controls"><input type="search" id="search-bar" placeholder="Search..."><select id="filter-type"><option value="all">All Types</option><option value="pdf">PDF</option><option value="epub">EPUB</option><option value="html">HTML</option><option value="txt">TXT</option></select></div><div id="file-list-container" class="scrollable"><p>Loading library...</p></div></section></nav>`;
        
        mainContent.innerHTML = `<div id="welcome-message"><h2>Welcome</h2><p>Select a document to begin.</p></div><div id="epub-reader-area"><div id="epub-viewer"></div><a id="epub-prev">‹</a><a id="epub-next">›</a></div><canvas id="pdf-drawing-canvas"></canvas><iframe id="content-frame" name="content-frame" title="Document Content" sandbox="allow-scripts allow-same-origin"></iframe>`;

        // Create Annotations Panel dynamically
        const annotationsPanel = document.createElement('div');
        annotationsPanel.id = 'annotations-panel';
        annotationsPanel.className = 'annotations-panel'; // Add CSS for this class
        annotationsPanel.innerHTML = `<style>.annotations-panel{position:absolute;top:var(--header-height);right:24px;width:350px;max-height:50vh;background-color:var(--bg-primary);border:1px solid var(--border-color);border-top:none;border-radius:0 0 8px 8px;box-shadow:var(--shadow);z-index:1000;transform:translateY(-110%);transition:transform .4s ease;display:flex;flex-direction:column}.annotations-panel.open{transform:translateY(0)}.tabs{display:flex;border-bottom:1px solid var(--border-color);}.tab-link{flex-grow:1;padding:12px;background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:.9rem;border-bottom:2px solid transparent}.tab-link.active{color:var(--accent);border-bottom-color:var(--accent)}.tab-content{display:none;flex-grow:1;overflow-y:auto}.tab-content.active{display:block}#annotations-list, #bookmarks-list{list-style:none;padding:0;margin:0}#annotations-list li, #bookmarks-list li{padding:12px 16px;border-bottom:1px solid var(--border-color);cursor:pointer}#annotations-list li:hover, #bookmarks-list li:hover{background-color:var(--bg-secondary)}.annotation-note{font-style:italic;margin-bottom:5px}.annotation-text,.bookmark-snippet{font-size:.85rem;color:var(--text-secondary)}.bookmark-title{font-size:.9rem;font-weight:600;margin-bottom:4px}.bookmark-author{font-size:.8rem;color:var(--text-secondary);font-style:italic}</style><div class="tabs"><button class="tab-link active" data-tab="Annotations">Notes</button><button class="tab-link" data-tab="Bookmarks">Bookmarks</button></div><div id="Annotations" class="tab-content active scrollable"><ul id="annotations-list"></ul></div><div id="Bookmarks" class="tab-content scrollable"><ul id="bookmarks-list"></ul></div>`;
        document.body.appendChild(annotationsPanel);
    }
    
    // --- INITIALIZE ---
    buildUI();
    // Re-fetch DOM elements after building UI
    const dom = {
        themeToggle: document.getElementById('theme-toggle'), sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'), sidebar: document.querySelector('.sidebar'), fileListContainer: document.getElementById('file-list-container'),
        contentFrame: document.getElementById('content-frame'), welcomeMessage: document.getElementById('welcome-message'), drawingCanvas: document.getElementById('pdf-drawing-canvas'),
        htmlTxtControls: document.getElementById('html-txt-controls'), pdfControls: document.getElementById('pdf-controls'), eraseModeToggle: document.getElementById('erase-mode-toggle'),
        addBookmarkBtn: document.getElementById('add-bookmark-btn'), annotationsToggle: document.getElementById('annotations-toggle'), fontSizeSlider: document.getElementById('font-size-slider'),
        lineHeightSlider: document.getElementById('line-height-slider'), highlightThicknessSlider: document.getElementById('highlight-thickness-slider'),
        colorSwatches: document.querySelectorAll('.rh-actions .color-swatch'), annotationsPanel: document.getElementById('annotations-panel'),
        annotationsList: document.getElementById('annotations-list'), bookmarksList: document.getElementById('bookmarks-list'), tabs: document.querySelectorAll('.annotations-panel .tab-link'),
        epubReaderArea: document.getElementById('epub-reader-area'), epubViewer: document.getElementById('epub-viewer'), epubPrev: document.getElementById('epub-prev'), epubNext: document.getElementById('epub-next'),
        epubPagination: document.getElementById('epub-pagination'), epubCurrentPage: document.getElementById('epub-current-page'), epubTotalPages: document.getElementById('epub-total-pages'),
        searchBar: document.getElementById('search-bar'), filterType: document.getElementById('filter-type'),
    };
    const drawingCtx = dom.drawingCanvas.getContext('2d');

    async function initialize() {
        loadSettings(); loadAnnotations(); loadBookmarks();
        await fetchAndOrganizeFiles();
        applySettings(); setupEventListeners(); renderAllBookmarks(); toggleReaderTools(false);
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
        const ul = document.createElement('ul');
        if (files.length > 0) {
            files.forEach(file => {
                const meta = state.metadata[file.path] || {};
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#'; a.dataset.path = file.path;
                a.innerHTML = `<span class="file-icon">📖</span><div><span class="file-name">${meta.title || file.name}</span>${meta.author ? `<div class="file-author">${meta.author}</div>` : ''}</div>`;
                a.onclick = (e) => { e.preventDefault(); loadFile(file.path); };
                li.appendChild(a);
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = '<li>No files found.</li>';
        }
        dom.fileListContainer.innerHTML = ''; 
        dom.fileListContainer.appendChild(ul);
    }

    function setupEventListeners() {
        dom.themeToggle.addEventListener('click', toggleTheme);
        dom.sidebarToggleBtn.addEventListener('click', toggleSidebarMinimize);
        dom.eraseModeToggle.addEventListener('click', toggleEraseMode);
        dom.addBookmarkBtn.addEventListener('click', addBookmark);
        dom.annotationsToggle.addEventListener('click', () => dom.annotationsPanel.classList.toggle('open'));
        dom.fontSizeSlider.addEventListener('input', e => updateSetting('fontSize', e.target.value, updateIframeStyles));
        dom.lineHeightSlider.addEventListener('input', e => updateSetting('lineHeight', e.target.value, updateIframeStyles));
        dom.highlightThicknessSlider.addEventListener('input', e => updateSetting('highlightThickness', e.target.value));
        dom.contentFrame.addEventListener('load', onIframeLoad);
        dom.colorSwatches.forEach(swatch => swatch.addEventListener('click', handleColorChange));
        dom.tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
        dom.epubPrev.addEventListener('click', () => state.currentRendition?.prev());
        dom.epubNext.addEventListener('click', () => state.currentRendition?.next());
        dom.searchBar.addEventListener('input', applyFilters);
        dom.filterType.addEventListener('change', applyFilters);
    }

    async function loadFile(fullPath) {
        if (state.currentFile === fullPath) return;
        state.currentFile = fullPath; state.currentBook = null; state.currentRendition = null;
        dom.welcomeMessage.style.display = 'none';
        document.querySelectorAll('#file-list-container li.active').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`#file-list-container a[data-path="${fullPath}"]`);
        if (activeLink) activeLink.parentElement.classList.add('active');
        
        dom.contentFrame.style.display = 'none';
        dom.epubReaderArea.style.display = 'none';
        dom.drawingCanvas.classList.remove('active');
        
        const url = `./${fullPath}`;
        const fileType = fullPath.split('.').pop().toLowerCase();

        dom.htmlTxtControls.classList.toggle('hidden', fileType === 'pdf');
        dom.pdfControls.classList.toggle('hidden', fileType !== 'pdf');
        dom.epubPagination.classList.add('hidden'); 
        dom.epubPrev.style.display = 'none';
        dom.epubNext.style.display = 'none';

        try {
            if (fileType === 'pdf') {
                dom.contentFrame.style.display = 'block';
                dom.contentFrame.srcdoc = '<p style="text-align:center;padding:2rem;">Loading PDF...</p>';
                await renderPdfInIframe(url);
            } else if (fileType === 'epub') {
                dom.epubReaderArea.style.display = 'block';
                state.currentBook = window.ePub(url);
                state.currentRendition = state.currentBook.renderTo(dom.epubViewer, { flow: "scrolled-doc", width: "100%", height: "100%" });
                await state.currentRendition.display();
                updateIframeStyles();
            } else { // HTML or TXT
                dom.contentFrame.style.display = 'block';
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                let content = await response.text();
                if (fileType === 'txt') {
                    content = `<pre style="white-space:pre-wrap;font-family:inherit;">${content}</pre>`;
                }
                dom.contentFrame.srcdoc = `<html><head></head><body>${content}</body></html>`;
            }
            toggleReaderTools(true);
        } catch (error) { 
            console.error("Error loading file:", error);
            dom.contentFrame.style.display = 'block';
            dom.contentFrame.srcdoc = `<h2>Error loading file</h2><p>${error.message}</p>`; 
        }
    }
    
    function onIframeLoad() {
        if (dom.contentFrame.src && dom.contentFrame.src.startsWith('blob:')) return;
        updateIframeStyles();
        setupIframeListeners();
        renderAnnotationsForCurrentFile();
    }
    
    function applySettings(){document.body.classList.toggle("dark-mode","dark"===state.settings.theme);dom.themeToggle.textContent="dark"===state.settings.theme?"☀":"☾";dom.fontSizeSlider.value=state.settings.fontSize;dom.lineHeightSlider.value=state.settings.lineHeight;dom.highlightThicknessSlider.value=state.settings.highlightThickness;dom.sidebar.classList.toggle("minimized",state.settings.sidebarMinimized);dom.eraseModeToggle.classList.toggle("active",state.isEraseModeActive);dom.colorSwatches.forEach(e=>e.classList.toggle("active",!state.isEraseModeActive&&e.dataset.color===state.settings.activeHighlightColor));updateIframeStyles()}
    function toggleTheme(){updateSetting("theme","dark"===state.settings.theme?"light":"dark",applySettings)}
    function toggleSidebarMinimize(){updateSetting("sidebarMinimized",!state.settings.sidebarMinimized,applySettings)}
    function handleColorChange(e){state.isEraseModeActive&&toggleEraseMode(),updateSetting("activeHighlightColor",e.target.dataset.color,applySettings)}
    function updateIframeStyles(){const e=dom.contentFrame.contentDocument;if(e&&e.head){let t=e.getElementById("dynamic-reader-styles");t||(t=e.createElement("style"),t.id="dynamic-reader-styles",e.head.appendChild(t));const n=getComputedStyle(document.body);t.innerHTML=`body{font-size:${state.settings.fontSize}px;line-height:${state.settings.lineHeight};color:${n.getPropertyValue("--text-primary")};background-color:${n.getPropertyValue("--bg-primary")};font-family:inherit;padding:2rem;max-width:800px;margin:0 auto;}`}
    if(state.currentRendition){const e={body:{"color":getComputedStyle(document.body).getPropertyValue("--text-primary"),"font-size":`${state.settings.fontSize}px !important`,"line-height":`${state.settings.lineHeight} !important`}};state.currentRendition.themes.register("custom",e),state.currentRendition.themes.select("custom")}}
    function toggleReaderTools(e){document.querySelectorAll(".rh-actions button, .rh-actions .color-swatch, .rh-controls .control").forEach(t=>{t.style.opacity=e?"1":".5";t.style.pointerEvents=e?"auto":"none"})}

    // All other functions (bookmarks, annotations, etc.) would go here...

    initialize();
});