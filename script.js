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
    const highlightsList = document.getElementById('highlights-list');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const colorSwatches = document.getElementById('highlighter-colors');
    const doubleSpaceToggle = document.getElementById('double-space-toggle');
    const marginSlider = document.getElementById('margin-slider');
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
        },
        highlights: {},
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

    // --- INITIALIZATION ---
    function initialize() {
        loadSettings();
        loadHighlights();
        injectDynamicStyles();
        applySettings();
        fetchAndOrganizeFiles();
        setupEventListeners();
    }

    // --- DYNAMIC STYLE INJECTION ---
    function injectDynamicStyles() {
        const style = document.createElement('style');
        style.id = 'app-dynamic-styles';
        style.innerHTML = `
            .color-palette.disabled {
                opacity: 0.5;
                filter: grayscale(80%);
                cursor: not-allowed;
            }
            .color-palette.disabled .color-swatch {
                pointer-events: none;
            }
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
        fontSizeSlider.addEventListener('input', handleFontSizeChange);
        colorSwatches.addEventListener('click', handleColorChange);
        doubleSpaceToggle.addEventListener('click', toggleDoubleSpacing);
        marginSlider.addEventListener('input', handleMarginChange);
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
        applyHighlightsForCurrentFile();
        renderHighlightsForCurrentFile();
    }

    function setupIframeListeners() {
        const iframeDoc = contentFrame.contentDocument;
        if (!iframeDoc) return;
        iframeDoc.addEventListener('pointerup', handleIframeInteraction);
    }

    // --- SETTINGS & UI UPDATES ---
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
            mark[id^="highlight-"] { cursor: pointer; }
        `;
    }

    // --- GITHUB FILE FETCHING ---
    async function fetchAndOrganizeFiles() {
        const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/git/trees/main?recursive=1`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
            const data = await response.json();
            const flatFileList = data.tree
                .filter(item => item.type === 'blob' && item.path.startsWith(LIBRARY_ROOT) && item.path.endsWith('.html'))
                .map(item => {
                    const relativePath = item.path.substring(LIBRARY_ROOT.length);
                    const displayName = relativePath.replace(/\.html$/, '').replace(/_/g, ' ').replace(/\//g, ' / ');
                    return { name: displayName, path: item.path };
                })
                .sort((a, b) => a.name.localeCompare(b.name));
            renderFileList(flatFileList);
        } catch (error) {
            console.error("Failed to fetch files:", error);
            fileListContainer.innerHTML = '<p class="error">Could not load library.</p>';
        }
    }

    function renderFileList(files) {
        const ul = document.createElement('ul');
        if (files.length > 0) {
            files.forEach(file => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.path = file.path;
                a.textContent = file.name;
                a.onclick = (e) => { e.preventDefault(); loadFile(file.path); };
                li.appendChild(a);
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = '<li>No HTML files found.</li>';
        }
        fileListContainer.innerHTML = '';
        fileListContainer.appendChild(ul);
    }

    async function loadFile(fullPath) {
        if (state.currentFile === fullPath) return;
        state.currentFile = fullPath;
        welcomeMessage.style.display = 'none';
        document.body.classList.add('file-loaded');

        document.querySelectorAll('#file-list-container li.active').forEach(el => el.classList.remove('active'));
        const fileLink = document.querySelector(`#file-list-container a[data-path="${fullPath}"]`);
        if (fileLink) fileLink.parentElement.classList.add('active');

        try {
            const url = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/${fullPath}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const htmlContent = await response.text();
            contentFrame.srcdoc = htmlContent;
        } catch (error) {
            console.error("Failed to load file content:", error);
            contentFrame.srcdoc = `<html><body><h2>Failed to load content</h2><p>${error}</p></body></html>`;
        }

        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    }

    // --- HIGHLIGHTING & ERASING LOGIC ---
    function toggleHighlightMode() {
        state.isHighlightModeActive = !state.isHighlightModeActive;
        if (state.isHighlightModeActive) {
            state.isEraseModeActive = false;
            state.settings.activeHighlightColor = state.settings.activeHighlightColor || 'yellow';
        }
        highlightModeToggle.classList.toggle('active', state.isHighlightModeActive);
        eraseModeToggle.classList.remove('active');
        applySettings();
    }

    function toggleEraseMode() {
        state.isEraseModeActive = !state.isEraseModeActive;
        if (state.isEraseModeActive) state.isHighlightModeActive = false;
        eraseModeToggle.classList.toggle('active', state.isEraseModeActive);
        highlightModeToggle.classList.remove('active');
        applySettings();
    }

    function handleIframeInteraction(event) {
        setTimeout(() => {
            if (state.isHighlightModeActive) {
                createHighlight();
            } else if (state.isEraseModeActive) {
                eraseHighlight(event.target);
            }
        }, 50);
    }

    function createHighlight() {
        const iframeDoc = contentFrame.contentDocument;
        const selection = iframeDoc.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const highlightId = `highlight-${Date.now()}`;
        const rangeData = serializeRange(range, iframeDoc);

        const newHighlight = {
            id: highlightId,
            text: selection.toString(),
            rangeData,
            color: state.settings.activeHighlightColor
        };

        const highlightKey = state.currentFile;
        if (!state.highlights[highlightKey]) state.highlights[highlightKey] = [];
        state.highlights[highlightKey].push(newHighlight);

        applyHighlightToDOM(newHighlight);
        saveHighlights();
        renderHighlightsForCurrentFile();
        selection.removeAllRanges();
    }

    function eraseHighlight(target) {
        const mark = target.closest('mark');
        if (!mark || !mark.id.startsWith('highlight-')) return;
        const highlightId = mark.id;
        const highlightKey = state.currentFile;
        const fileHighlights = state.highlights[highlightKey] || [];
        state.highlights[highlightKey] = fileHighlights.filter(h => h.id !== highlightId);

        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();

        saveHighlights();
        renderHighlightsForCurrentFile();
    }

    function applyHighlightToDOM(highlight) {
        const iframeDoc = contentFrame.contentDocument;
        const range = deserializeRange(highlight.rangeData, iframeDoc);
        if (!range) return;
        const mark = iframeDoc.createElement('mark');
        mark.id = highlight.id;
        mark.className = `highlight highlight-${highlight.color}`;
        try {
            range.surroundContents(mark);
        } catch (e) {
            console.error("Error applying highlight:", e, highlight);
        }
    }

    function applyHighlightsForCurrentFile() {
        if (!state.currentFile) return;
        const fileHighlights = state.highlights[state.currentFile] || [];
        fileHighlights.forEach(applyHighlightToDOM);
    }

    function renderHighlightsForCurrentFile() {
        highlightsList.innerHTML = '';
        if (!state.currentFile) return;
        const fileHighlights = state.highlights[state.currentFile] || [];
        if (fileHighlights.length === 0) {
            highlightsList.innerHTML = '<li>No highlights for this file.</li>';
            return;
        }
        fileHighlights.forEach(highlight => {
            const li = document.createElement('li');
            li.dataset.highlightId = highlight.id;
            li.innerHTML = `<div class="highlight-text">${escapeHTML(highlight.text)}</div>`;
            li.addEventListener('click', () => {
                const targetEl = contentFrame.contentDocument.getElementById(highlight.id);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            highlightsList.appendChild(li);
        });
    }

    // --- DATA PERSISTENCE & UTILITY FUNCTIONS ---
    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save data to localStorage", e);
        }
    }

    function loadData(key) {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
            return {};
        }
    }

    function saveSettings() { saveData('beansReaderSettings', state.settings); }
    function loadSettings() { Object.assign(state.settings, loadData('beansReaderSettings')); }
    function saveHighlights() { saveData('beansReaderHighlights', state.highlights); }
    function loadHighlights() { Object.assign(state.highlights, loadData('beansReaderHighlights')); }

    function getPathTo(node, doc) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.id) return `id("${node.id}")`;
            if (node === doc.body) return '/html/body';

            let ix = 1;
            let sibling = node.previousSibling;
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === node.tagName) {
                    ix++;
                }
                sibling = sibling.previousSibling;
            }
            return `${getPathTo(node.parentNode, doc)}/${node.tagName.toLowerCase()}[${ix}]`;
        }

        const parent = node.parentNode;
        if (!parent) return '';
        const parentPath = getPathTo(parent, doc);
        const children = Array.from(parent.childNodes);
        const nodeIndex = children.indexOf(node) + 1;
        
        return `${parentPath}/node()[${nodeIndex}]`;
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
            if (!startContainer || !endContainer) {
                console.warn("Could not find start or end container for range", rangeData);
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
        p.textContent = str;
        return p.innerHTML;
    }

    // --- START THE APP ---
    initialize();
});
