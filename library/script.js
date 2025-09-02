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
    
    // Header Tools
    const eraseModeToggle = document.getElementById('erase-mode-toggle');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const annotationsToggle = document.getElementById('annotations-toggle');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const lineHeightSlider = document.getElementById('line-height-slider');
    const colorSwatches = document.querySelectorAll('.rh-actions .color-swatch');

    // Annotations Panel
    const annotationsPanel = document.getElementById('annotations-panel');
    const annotationsList = document.getElementById('annotations-list');
    const bookmarksList = document.getElementById('bookmarks-list');
    const tabs = document.querySelectorAll('.annotations-panel .tab-link');

    // --- App State ---
    const state = {
        currentFile: null,
        targetScrollY: null,
        isHighlightModeActive: false,
        isEraseModeActive: false,
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
    
    // --- ICONS ---
    const ICONS = { sun: '☀', moon: '☾' };

    // --- INITIALIZATION ---
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

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        themeToggle.addEventListener('click', toggleTheme);
        sidebarToggleBtn.addEventListener('click', toggleSidebarMinimize);
        eraseModeToggle.addEventListener('click', toggleEraseMode);
        addBookmarkBtn.addEventListener('click', addBookmark);
        annotationsToggle.addEventListener('click', () => annotationsPanel.classList.toggle('open'));
        fontSizeSlider.addEventListener('input', handleFontSizeChange);
        lineHeightSlider.addEventListener('input', handleLineHeightChange);
        contentFrame.addEventListener('load', onIframeLoad);
        colorSwatches.forEach(swatch => swatch.addEventListener('click', handleColorChange));
        tabs.forEach(tab => tab.addEventListener('click', handleTabClick));
    }
    
    function handleTabClick(e) {
        const targetTab = e.currentTarget.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === targetTab);
        });
    }

    async function renderPdfInIframe(url) {
        if (!window.pdfjsLib) {
            contentFrame.src = url;
            return;
        }
        try {
            const pdf = await window.pdfjsLib.getDocument({ url }).promise;
            const iframeDoc = contentFrame.contentDocument;
            iframeDoc.body.innerHTML = '';
            const styles = getComputedStyle(document.body);
            iframeDoc.body.style.cssText = `margin:0; background-color:${styles.getPropertyValue('--bg-secondary')};`;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                
                const container = iframeDoc.createElement('div');
                container.className = 'page-container';
                container.style.cssText = `position:relative; width:${viewport.width}px; height:${viewport.height}px; margin:20px auto; box-shadow:${styles.getPropertyValue('--shadow')};`;
                container.dataset.pageNumber = i;

                const canvas = iframeDoc.createElement('canvas');
                const textLayerDiv = iframeDoc.createElement('div');
                textLayerDiv.className = 'textLayer';
                
                container.append(canvas, textLayerDiv);
                iframeDoc.body.appendChild(container);

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                const textContent = await page.getTextContent();
                
                const textLayer = new window.pdfjsLib.TextLayer({ textContentSource: textContent, container: textLayerDiv, viewport });
                await textLayer.render();
            }
            toggleReaderTools(true);
            setupIframeListeners();
            applyAnnotationsForCurrentFile();
        } catch (error) {
            console.error("PDF Render Error:", error);
            contentFrame.srcdoc = `<h2>Failed to render PDF</h2><p>${error.message}</p>`;
        }
    }

    function onIframeLoad() {
        if (!state.currentFile || state.currentFile.toLowerCase().endsWith('.pdf')) return;
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
        iframeDoc.addEventListener('mouseup', handleIframeInteraction); // For text selection
    }
    
    function applySettings() {
        document.body.classList.toggle('dark-mode', state.settings.theme === 'dark');
        themeToggle.textContent = state.settings.theme === 'dark' ? ICONS.sun : ICONS.moon;
        fontSizeSlider.value = state.settings.fontSize;
        lineHeightSlider.value = state.settings.lineHeight;
        sidebar.classList.toggle('minimized', state.settings.sidebarMinimized);
        sidebarToggleBtn.classList.toggle('minimized', state.settings.sidebarMinimized);

        eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        
        // Handle color swatch active state
        colorSwatches.forEach(swatch => {
            swatch.classList.toggle('active', !state.isEraseModeActive && swatch.dataset.color === state.settings.activeHighlightColor);
        });

        updateIframeStyles();
    }
    
    function toggleTheme() { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; saveSettings(); applySettings(); }
    function toggleSidebarMinimize() { state.settings.sidebarMinimized = !state.settings.sidebarMinimized; saveSettings(); applySettings(); }
    function handleFontSizeChange(e) { state.settings.fontSize = e.target.value; saveSettings(); updateIframeStyles(); }
    function handleLineHeightChange(e) { state.settings.lineHeight = e.target.value; saveSettings(); updateIframeStyles(); }
    function handleColorChange(e) {
        if (!e.target.classList.contains('color-swatch')) return;
        state.settings.activeHighlightColor = e.target.dataset.color;
        state.isEraseModeActive = false;
        saveSettings(); 
        applySettings();
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
        const computed = getComputedStyle(document.body);
        style.innerHTML = `
            :root {
                --highlight-yellow: ${computed.getPropertyValue('--highlight-yellow')};
                --highlight-pink: ${computed.getPropertyValue('--highlight-pink')};
                --highlight-green: ${computed.getPropertyValue('--highlight-green')};
                --highlight-blue: ${computed.getPropertyValue('--highlight-blue')};
            }
            body { font-family:${computed.getPropertyValue('--font-main')}; color:${computed.getPropertyValue('--text-primary')}; background:${computed.getPropertyValue('--bg-primary')}; line-height:${state.settings.lineHeight}; font-size:${state.settings.fontSize}px; padding:2% 8%; margin:0 auto; max-width:80ch; }
            img { max-width:100%; height:auto; border-radius:8px; }
            a { color:${computed.getPropertyValue('--accent')}; }
            .highlight-yellow { background: var(--highlight-yellow); }
            .highlight-pink { background: var(--highlight-pink); }
            .highlight-green { background: var(--highlight-green); }
            .highlight-blue { background: var(--highlight-blue); }
            mark[id^="anno-"] { cursor:pointer; border-radius:2px; }
            .pdf-highlight-overlay { position: absolute; z-index: 10; pointer-events: none; }
        `;
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
        const url = `../${fullPath}`;
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

    function toggleEraseMode() {
        state.isEraseModeActive = !state.isEraseModeActive;
        saveSettings();
        applySettings();
    }

    function handleIframeInteraction(event) {
        const target = event.target;
        if (event.type === 'click' && target.closest('[id^="anno-"]')) {
             editAnnotationNote(target.closest('[id^="anno-"]').id);
             return;
        }
        if (event.type === 'mouseup') {
             setTimeout(() => {
                const selection = contentFrame.contentDocument.getSelection();
                if (!selection || selection.isCollapsed) return;
                 
                if (state.isEraseModeActive) eraseAnnotation(target);
                else createAnnotation();
             }, 50);
        }
    }
    
    function editAnnotationNote(annotationId) {
        const annotation = (state.annotations[state.currentFile] || []).find(a => a.id === annotationId);
        if (!annotation) return;
        const newNote = prompt('Edit your note:', annotation.note);
        if (newNote !== null) {
            annotation.note = newNote;
            saveAnnotations();
            renderAnnotationsForCurrentFile();
            const iframeDoc = contentFrame.contentDocument;
            iframeDoc.querySelectorAll(`[id="${annotationId}"]`).forEach(el => el.title = newNote);
        }
    }

    function createAnnotation() {
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;
        
        const isPdf = state.currentFile.toLowerCase().endsWith('.pdf');
        const annotationId = `anno-${Date.now()}`;
        let annotation;

        if (isPdf) {
            const range = selection.getRangeAt(0);
            const pageDiv = range.startContainer.parentElement.closest('.page-container');
            if (!pageDiv) return;
            const pageNum = pageDiv.dataset.pageNumber;
            const pageRect = pageDiv.getBoundingClientRect();
            const clientRects = Array.from(range.getClientRects()).map(rect => ({
                left: rect.left - pageRect.left,
                top: rect.top - pageRect.top,
                width: rect.width,
                height: rect.height,
            }));
            
            annotation = { id: annotationId, text: selection.toString(), rangeData: { type: 'pdf', page: pageNum, rects: clientRects }, note: '', color: state.settings.activeHighlightColor };

        } else {
            const range = selection.getRangeAt(0);
            annotation = { id: annotationId, text: range.toString(), rangeData: { type: 'html', ...serializeHtmlRange(range, iframeDoc) }, note: '', color: state.settings.activeHighlightColor };
        }

        if (!state.annotations[state.currentFile]) state.annotations[state.currentFile] = [];
        state.annotations[state.currentFile].push(annotation);
        
        applyAnnotationToDOM(annotation);
        saveAnnotations();
        renderAnnotationsForCurrentFile();
        selection.removeAllRanges();
    }

    function applyAnnotationToDOM(annotation) {
        const iframeDoc = contentFrame.contentDocument;
        if (annotation.rangeData.type === 'pdf') {
            const pageDiv = iframeDoc.querySelector(`.page-container[data-page-number="${annotation.rangeData.page}"]`);
            if (!pageDiv) return;
            
            annotation.rangeData.rects.forEach(rect => {
                const mark = iframeDoc.createElement('mark');
                mark.id = annotation.id;
                mark.className = `pdf-highlight-overlay highlight-${annotation.color}`;
                mark.style.cssText = `left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px;`;
                mark.title = annotation.note || "Click to add a note";
                pageDiv.appendChild(mark);
            });
        } else {
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

    function eraseAnnotation(target) {
        const mark = target.closest('[id^="anno-"]');
        if (!mark) return;
        const annotationId = mark.id;
        state.annotations[state.currentFile] = (state.annotations[state.currentFile] || []).filter(a => a.id !== annotationId);
        
        // For PDFs, multiple elements might share an ID
        contentFrame.contentDocument.querySelectorAll(`[id="${annotationId}"]`).forEach(el => el.remove());
        
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
    
    function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    function loadData(key) { return JSON.parse(localStorage.getItem(key) || '{}'); }
    function saveSettings() { saveData('beansReaderSettings_v4', state.settings); }
    function loadSettings() { Object.assign(state.settings, loadData('beansReaderSettings_v4')); }
    function saveAnnotations() { saveData('beansReaderAnnotations_v4', state.annotations); }
    function loadAnnotations() { Object.assign(state.annotations, loadData('beansReaderAnnotations_v4')); }
    function saveBookmarks() { saveData('beansReaderBookmarks_v4', state.bookmarks); }
    function loadBookmarks() { Object.assign(state.bookmarks, loadData('beansReaderBookmarks_v4')); }
    
    function getPathTo(node, doc) {
        if (node.id) return `#${node.id}`;
        if (node.nodeName === 'BODY') return '/html/body';
        if (node.nodeName === '#text') {
             let index = 1, sibling = node.previousSibling;
             while(sibling) {
                 if (sibling.nodeName === '#text') index++;
                 sibling = sibling.previousSibling;
             }
             return `${getPathTo(node.parentNode, doc)}/text()[${index}]`;
        }
        let index = 1, sibling = node.previousSibling;
        while (sibling) {
            if (sibling.nodeName === node.nodeName) index++;
            sibling = sibling.previousSibling;
        }
        return `${getPathTo(node.parentNode, doc)}/${node.nodeName.toLowerCase()}[${index}]`;
    }
    function getNodeByPath(path, doc) { try { return doc.evaluate(path, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; } catch (e) { return null; } }
    function serializeHtmlRange(range, doc) { return { startPath: getPathTo(range.startContainer, doc), startOffset: range.startOffset, endPath: getPathTo(range.endContainer, doc), endOffset: range.endOffset }; }
    function deserializeHtmlRange(rangeData, doc) { try { const startNode = getNodeByPath(rangeData.startPath, doc); const endNode = getNodeByPath(rangeData.endPath, doc); if (!startNode || !endNode) return null; const range = doc.createRange(); range.setStart(startNode, rangeData.startOffset); range.setEnd(endNode, rangeData.endOffset); return range; } catch (e) { return null; } }

    initialize();
});

