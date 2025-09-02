document.addEventListener('DOMContentLoaded', () => {
    // --- USER CONFIGURATION ---
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
    const htmlTxtControls = document.getElementById('html-txt-controls');
    const pdfControls = document.getElementById('pdf-controls');
    const eraseModeToggle = document.getElementById('erase-mode-toggle');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const annotationsToggle = document.getElementById('annotations-toggle');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const lineHeightSlider = document.getElementById('line-height-slider');
    const highlightThicknessSlider = document.getElementById('highlight-thickness-slider');
    const colorSwatches = document.querySelectorAll('.rh-actions .color-swatch');
    const annotationsPanel = document.getElementById('annotations-panel');
    const annotationsList = document.getElementById('annotations-list');
    const bookmarksList = document.getElementById('bookmarks-list');
    const tabs = document.querySelectorAll('.annotations-panel .tab-link');
    const noteModalOverlay = document.getElementById('note-modal-overlay');
    const noteModalTextarea = document.getElementById('note-modal-textarea');
    const noteModalSave = document.getElementById('note-modal-save');
    const noteModalCancel = document.getElementById('note-modal-cancel');
    const epubReaderArea = document.getElementById('epub-reader-area');
    const epubViewer = document.getElementById('epub-viewer');
    const epubPrev = document.getElementById('epub-prev');
    const epubNext = document.getElementById('epub-next');
    const epubPagination = document.getElementById('epub-pagination');
    const epubCurrentPage = document.getElementById('epub-current-page');
    const epubTotalPages = document.getElementById('epub-total-pages');
    const searchBar = document.getElementById('search-bar');
    const filterType = document.getElementById('filter-type');
    const hideUncategorized = document.getElementById('hide-uncategorized');

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
    
    const ICONS = { sun: '☀', moon: '☾' };

    async function initialize() {
        loadSettings();
        loadAnnotations();
        loadBookmarks();
        await fetchAndOrganizeFiles();
        applySettings();
        setupEventListeners();
        renderAllBookmarks();
        toggleReaderTools(false);
    }

    async function fetchAndOrganizeFiles() {
        try {
            fileListContainer.innerHTML = '<p>Loading library...</p>';
            const response = await fetch(`./${METADATA_FILE}`);
            if (!response.ok) throw new Error(`Could not load ${METADATA_FILE}`);
            const metaObject = await response.json();
            state.metadata = metaObject;
            const filePaths = Object.keys(metaObject);
            state.allFiles = filePaths
                .map(path => ({
                    name: path.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf|epub|txt)$/i, '').replace(/_/g, ' '),
                    path: path
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
            renderFileList(state.allFiles);
        } catch (error) {
            console.error("Failed to load library from metadata:", error);
            fileListContainer.innerHTML = `<p style="padding:10px;color:red;">Error: Could not load library. Please check your 'library_meta.json' file.</p>`;
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
        epubPrev.addEventListener('click', () => state.currentRendition?.prev());
        epubNext.addEventListener('click', () => state.currentRendition?.next());
        searchBar.addEventListener('input', applyFilters);
        filterType.addEventListener('change', applyFilters);
        hideUncategorized.addEventListener('change', applyFilters);
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

        htmlTxtControls.classList.toggle('hidden', fileType === 'pdf');
        pdfControls.classList.toggle('hidden', fileType !== 'pdf');
        
        epubPagination.classList.add('hidden'); 
        epubPrev.style.display = 'none';
        epubNext.style.display = 'none';

        try {
            if (fileType === 'pdf') {
                contentFrame.style.display = 'block';
                contentFrame.srcdoc = '<p style="text-align:center;padding:2rem;">Loading PDF...</p>';
                await renderPdfInIframe(url);
            } else if (fileType === 'epub') {
                epubReaderArea.style.display = 'block';
                state.currentBook = window.ePub(url);
                state.currentRendition = state.currentBook.renderTo(epubViewer, { 
                    flow: "scrolled-doc",
                    width: "100%", 
                    height: "100%" 
                });
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
            console.error("Error loading file:", error);
            contentFrame.style.display = 'block';
            contentFrame.srcdoc = `<h2>Error loading file</h2><p>Could not load ${fullPath}</p><p>${error.message}</p>`; 
        }
        renderAnnotationsForCurrentFile();
        renderAllBookmarks();
    }
    
    function applyFilters(){const e=searchBar.value.toLowerCase(),t=filterType.value,n=hideUncategorized.checked,o=state.allFiles.filter(o=>{const i=state.metadata[o.path]||{};if(n&&!state.metadata[o.path])return!1;const l=o.path.split(".").pop();if("all"!==t&&l!==t)return!1;const d=i.title||o.name,a=i.author||"",s=(i.subjects||[]).join(" ");return o.name.toLowerCase().includes(e)||d.toLowerCase().includes(e)||a.toLowerCase().includes(e)||s.toLowerCase().includes(e)});renderFileList(o)}
    function handleTabClick(e){const t=e.target,n=document.getElementById(t.dataset.tab);n&&(document.querySelectorAll(".annotations-panel .tab-link.active").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".annotations-panel .tab-content.active").forEach(e=>e.classList.remove("active")),t.classList.add("active"),n.classList.add("active"))}
    async function renderPdfInIframe(e){if(!window.pdfjsLib)return void(contentFrame.src=e);try{const t=await window.pdfjsLib.getDocument({url:e}).promise;let n=`<style>body{margin:0;background:#525659;}.page-container{margin:1rem auto;box-shadow:0 0 10px rgba(0,0,0,0.5);position:relative;width:fit-content;}canvas{display:block;max-width:100%;height:auto;}.pdf-drawn-highlight{position:absolute;z-index:10;}</style>`;for(let e=1;e<=t.numPages;e++)n+=`<div class="page-container" data-page-number="${e}"><canvas id="pdf-canvas-${e}"></canvas></div>`;contentFrame.srcdoc=n,contentFrame.onload=async()=>{await new Promise(e=>setTimeout(e,1));const n=contentFrame.contentDocument;for(let e=1;e<=t.numPages;e++){const o=await t.getPage(e),i=o.getViewport({scale:1.5}),l=n.getElementById(`pdf-canvas-${e}`);if(l){const t=l.getContext("2d");l.height=i.height,l.width=i.width,await o.render({canvasContext:t,viewport:i}).promise}}syncDrawingCanvasSize(),setupIframeListeners(),applyAnnotationsForCurrentFile()}}catch(e){console.error("PDF Render Error:",e),contentFrame.srcdoc=`<h2>Failed to render PDF</h2><p>${e.message}</p>`}}
    function onIframeLoad(){contentFrame.src&&contentFrame.src.startsWith("blob:")||state.currentFile&&(state.currentFile.endsWith(".html")||state.currentFile.endsWith(".txt"))&&(updateIframeStyles(),setupIframeListeners(),applyAnnotationsForCurrentFile())}
    function setupIframeListeners(){const e=contentFrame.contentDocument;e&&(e.addEventListener("mouseup",createAnnotationFromSelection),e.addEventListener("click",handleIframeInteraction))}
    function applySettings(){document.body.classList.toggle("dark-mode","dark"===state.settings.theme),themeToggle.textContent="dark"===state.settings.theme?ICONS.sun:ICONS.moon,fontSizeSlider.value=state.settings.fontSize,lineHeightSlider.value=state.settings.lineHeight,highlightThicknessSlider.value=state.settings.highlightThickness,sidebar.classList.toggle("minimized",state.settings.sidebarMinimized),eraseModeToggle.classList.toggle("active",state.isEraseModeActive),colorSwatches.forEach(e=>e.classList.toggle("active",!state.isEraseModeActive&&e.dataset.color===state.settings.activeHighlightColor)),updateIframeStyles()}
    function toggleTheme(){updateSetting("theme","dark"===state.settings.theme?"light":"dark",applySettings)}
    function toggleSidebarMinimize(){updateSetting("sidebarMinimized",!state.settings.sidebarMinimized,applySettings)}
    function handleColorChange(e){state.isEraseModeActive&&toggleEraseMode(),updateSetting("activeHighlightColor",e.target.dataset.color,applySettings)}
    function updateIframeStyles(){const e=contentFrame.contentDocument;if(e&&e.head){let t=e.getElementById("dynamic-reader-styles");t||(t=e.createElement("style"),t.id="dynamic-reader-styles",e.head.appendChild(t));const n=getComputedStyle(document.body);t.innerHTML=`body{font-size:${state.settings.fontSize}px;line-height:${state.settings.lineHeight};color:${n.getPropertyValue("--text-primary")};background-color:${n.getPropertyValue("--bg-primary")};font-family:'Arimo',sans-serif;padding:2rem;max-width:800px;margin:0 auto;}.pdf-highlight{background-color:var(--highlight-${state.settings.activeHighlightColor});cursor:pointer;}`}
    if(state.currentRendition){const e={body:{color:getComputedStyle(document.body).getPropertyValue("--text-primary"),"font-size":`${state.settings.fontSize}px !important`,"line-height":`${state.settings.lineHeight} !important`,"font-family":"'Arimo', sans-serif !important"}};state.currentRendition.themes.register("custom",e),state.currentRendition.themes.select("custom")}}
    function toggleReaderTools(e){document.querySelectorAll(".rh-actions button, .rh-actions .color-swatch, .rh-controls .control").forEach(t=>{t.style.opacity=e?"1":"0.5",t.style.pointerEvents=e?"auto":"none"})}
    function toggleEraseMode(){state.isEraseModeActive=!state.isEraseModeActive,applySettings()}
    function showNoteModal(e="",t){noteModalTextarea.value=e,state.currentNoteCallback=t,noteModalOverlay.classList.remove("hidden"),noteModalTextarea.focus()}
    function hideNoteModal(){noteModalOverlay.classList.add("hidden"),state.currentNoteCallback=null}
    function handleIframeInteraction(e){const t=e.target.closest('[id^="anno-"]');t&&(state.isEraseModeActive?eraseAnnotation(t):editAnnotationNote(t.id))}
    function editAnnotationNote(e){const t=findAnnotation(e);t&&showNoteModal(t.note,e=>{t.note=e,saveAndApplyAnnotation(t)})}
    function createAnnotationFromSelection(){if(state.isEraseModeActive)return;const e=contentFrame.contentWindow.getSelection();if(!e||e.isCollapsed)return;const t=e.getRangeAt(0),n={id:`anno-${Date.now()}`,text:e.toString(),rangeData:serializeHtmlRange(t,contentFrame.contentDocument),note:"",color:state.settings.activeHighlightColor};e.removeAllRanges(),showNoteModal("",e=>{n.note=e,saveAndApplyAnnotation(n)})}
    function saveAndApplyAnnotation(e){state.annotations[state.currentFile]||(state.annotations[state.currentFile]=[]);const t=state.annotations[state.currentFile].findIndex(t=>t.id===e.id);t>-1?state.annotations[state.currentFile][t]=e:state.annotations[state.currentFile].push(e),saveAnnotations(),renderAnnotationsForCurrentFile()}
    function eraseAnnotation(e){const t=e.id;state.annotations[state.currentFile]&&(state.annotations[state.currentFile]=state.annotations[state.currentFile].filter(e=>e.id!==t),saveAnnotations(),renderAnnotationsForCurrentFile())}
    function applyAnnotationsForCurrentFile(){if(!state.currentFile)return;(state.annotations[state.currentFile]||[]).forEach(applyAnnotationToDOM)}
    function addBookmark(){if(!state.currentFile||!contentFrame.contentWindow)return;const e=contentFrame.contentWindow;let t="Top of page";if(e.document&&e.document.body){t=(Array.from(e.document.body.querySelectorAll("p, h1, h2, h3, .page-container")).find(e=>e.getBoundingClientRect().top>0)||{textContent:"Top of page"}).textContent.trim().substring(0,100)+"..."}const n={file:state.currentFile,snippet:t,scrollY:e.scrollY,timestamp:Date.now()};state.bookmarks[state.currentFile]||(state.bookmarks[state.currentFile]=[]),state.bookmarks[state.currentFile].push(n),saveBookmarks(),renderAllBookmarks()}
    function renderAllBookmarks(){bookmarksList.innerHTML="";const e=Object.values(state.bookmarks).flat().sort((e,t)=>t.timestamp-e.timestamp);if(0===e.length)return void(bookmarksList.innerHTML="<li>No bookmarks yet.</li>");e.forEach(e=>{const t=state.metadata[e.file]||{},n=t.title||e.file.substring(LIBRARY_ROOT.length).replace(/\.(html|pdf|epub|txt)$/i,""),o=t.author?`<div class="bookmark-author">${t.author}</div>`:"",i=document.createElement("li");i.innerHTML=`<div class="bookmark-title">${n}</div>${o}<div class="bookmark-snippet">${e.snippet}</div>`,i.onclick=()=>{state.currentFile!==e.file?(contentFrame.onload=()=>{contentFrame.contentWindow.scrollTo({top:e.scrollY,behavior:"smooth"}),contentFrame.onload=onIframeLoad},loadFile(e.file)):contentFrame.contentWindow.scrollTo({top:e.scrollY,behavior:"smooth"})},bookmarksList.appendChild(i)})}
    function syncDrawingCanvasSize(){const e=contentFrame.contentDocument;e&&e.body&&(drawingCanvas.width=e.body.scrollWidth,drawingCanvas.height=e.body.scrollHeight)}
    function startDrawing(e){if(!state.currentFile||!state.currentFile.toLowerCase().endsWith(".pdf")||state.isEraseModeActive)return;state.isDrawing=!0,drawingCanvas.classList.add("active"),drawingCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height),drawingCtx.strokeStyle=getComputedStyle(document.body).getPropertyValue(`--highlight-${state.settings.activeHighlightColor}`),drawingCtx.lineWidth=state.settings.highlightThickness,drawingCtx.lineCap="round",drawingCtx.lineJoin="round";const t=drawingCanvas.getBoundingClientRect(),n={x:e.clientX-t.left+contentFrame.contentWindow.scrollX,y:e.clientY-t.top+contentFrame.contentWindow.scrollY};state.drawPoints=[n],drawingCtx.beginPath(),drawingCtx.moveTo(n.x,n.y)}
    function draw(e){if(!state.isDrawing)return;const t=drawingCanvas.getBoundingClientRect(),n={x:e.clientX-t.left+contentFrame.contentWindow.scrollX,y:e.clientY-t.top+contentFrame.contentWindow.scrollY};state.drawPoints.push(n),drawingCtx.lineTo(n.x,n.y),drawingCtx.stroke()}
    function endDrawing(){if(!state.isDrawing)return;state.isDrawing=!1,drawingCanvas.classList.remove("active");if(state.drawPoints.length<2)return void drawingCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height);const e=contentFrame.contentDocument;let t=1/0,n=1/0,o=-1/0,i=-1/0;state.drawPoints.forEach(e=>{t=Math.min(t,e.x),n=Math.min(n,e.y),o=Math.max(o,e.x),i=Math.max(i,e.y)});let l=null;for(const t of e.querySelectorAll(".page-container"))if(n>=t.offsetTop&&n<=t.offsetTop+t.offsetHeight){l=t;break}if(!l)return void drawingCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height);const d=state.drawPoints.map(e=>({x:e.x-t,y:e.y-n})),a={id:`anno-${Date.now()}`,text:"[Freehand Annotation]",rangeData:{type:"pdf-freehand",page:l.dataset.pageNumber,thickness:state.settings.highlightThickness,points:d,bounds:{x:t-l.offsetLeft,y:n-l.offsetTop,width:o-t,height:i-n}},note:"",color:state.settings.activeHighlightColor};showNoteModal("",e=>{a.note=e,saveAndApplyAnnotation(a),drawingCtx.clearRect(0,0,drawingCanvas.width,drawingCanvas.height)})}
    function updateSetting(e,t,n){state.settings[e]=t,saveSettings(),n&&n()}
    function findAnnotation(e){return(state.annotations[state.currentFile]||[]).find(t=>t.id===e)}
    function saveData(e,t){localStorage.setItem(e,JSON.stringify(t))}
    function loadData(e){return JSON.parse(localStorage.getItem(e)||"{}")}
    function saveSettings(){saveData("beansReaderSettings_v9",state.settings)}
    function loadSettings(){Object.assign(state.settings,loadData("beansReaderSettings_v9"))}
    function saveAnnotations(){saveData("beansReaderAnnotations_v9",state.annotations)}
    function loadAnnotations(){Object.assign(state.annotations,loadData("beansReaderAnnotations_v9"))}
    function saveBookmarks(){saveData("beansReaderBookmarks_v9",state.bookmarks)}
    function loadBookmarks(){Object.assign(state.bookmarks,loadData("beansReaderBookmarks_v9"))}
    function getPathTo(e,t){if(e.nodeType===Node.TEXT_NODE&&(e=e.parentNode),!e||e===t.body)return"BODY";let n="";for(;e&&e!==t.body;){let t=Array.from(e.parentNode.childNodes).filter(t=>t.nodeName===e.nodeName).indexOf(e);n=`${e.tagName}:nth-of-type(${t+1})>${n}`,e=e.parentNode}return`BODY>${n.slice(0,-1)}`}
    function getNodeByPath(e,t){try{return t.querySelector(e)}catch(n){return console.error("Could not find node by path:",e,n),null}}
    function serializeHtmlRange(e,t){return{type:"html",startContainerPath:getPathTo(e.startContainer,t),startOffset:e.startOffset,endContainerPath:getPathTo(e.endContainer,t),endOffset:e.endOffset}}
    function deserializeHtmlRange(e,t){try{const n=getNodeByPath(e.startContainerPath,t),o=getNodeByPath(e.endContainerPath,t);if(!n||!o)return null;const i=n.hasChildNodes()?n.childNodes[0]:n,l=o.hasChildNodes()?o.childNodes[0]:o;if(!i||!l)return null;const d=t.createRange();return d.setStart(i,e.startOffset),d.setEnd(l,e.endOffset),d}catch(e){return console.error("Failed to deserialize range:",e),null}}
    function renderAnnotationsForCurrentFile(){const e=contentFrame.contentDocument;if(!e||!e.body)return;e.querySelectorAll('[id^="anno-"]').forEach(e=>{const t=e.parentNode;for(;e.firstChild;)t.insertBefore(e.firstChild,e);t.removeChild(e),t.normalize()}),state.currentFile&&state.annotations[state.currentFile]&&applyAnnotationsForCurrentFile(),annotationsList.innerHTML="";const t=state.annotations[state.currentFile]||[];if(0===t.length)return void(annotationsList.innerHTML="<li>No notes for this document.</li>");t.forEach(e=>{const t=document.createElement("li");t.innerHTML=`<div class="annotation-note">${e.note||"<em>No note added...</em>"}</div><div class="annotation-text">${e.text}</div>`,annotationsList.appendChild(t)})}
    function applyAnnotationToDOM(e){const t=contentFrame.contentDocument;if(!t)return;if("pdf-freehand"===e.rangeData.type){const n=t.querySelector(`.page-container[data-page-number="${e.rangeData.page}"]`);if(!n)return;const o=t.createElement("canvas");o.id=e.id,o.className="pdf-drawn-highlight",o.style.cssText=`position:absolute;left:${e.rangeData.bounds.x}px;top:${e.rangeData.bounds.y}px;pointer-events:all;cursor:pointer;opacity:0.7;`,o.width=e.rangeData.bounds.width,o.height=e.rangeData.bounds.height,o.title=e.note||"Click to add a note",n.appendChild(o);const i=o.getContext("2d");if(i.strokeStyle=getComputedStyle(document.body).getPropertyValue(`--highlight-${e.color}`),i.lineWidth=e.rangeData.thickness,i.lineCap="round",i.lineJoin="round",i.beginPath(),e.rangeData.points&&e.rangeData.points.length>0){i.moveTo(e.rangeData.points[0].x,e.rangeData.points[0].y);for(let t=1;t<e.rangeData.points.length;t++)i.lineTo(e.rangeData.points[t].x,e.rangeData.points[t].y);i.stroke()}}else if("html"===e.rangeData.type){const n=deserializeHtmlRange(e.rangeData,t);if(!n)return;const o=t.createElement("span");o.id=e.id,o.className="pdf-highlight",o.style.backgroundColor=`var(--highlight-${e.color})`,o.title=e.note||"Click to add a note";const i=n.extractContents();o.appendChild(i),n.insertNode(o)}}

    initialize();
});