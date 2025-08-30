// --- Reusable Header and Theme Functions ---

function createHeader(pathPrefix = '.') {
    // This structure now defines the columns directly.
    const headerColumns = [
        {
            title: 'Gematrix',
            links: [
                { name: 'Gematria Calculator', href: 'gematriamain/gematria.html' },
                { name: 'Library & Local DB', href: 'localdb.html' },
                { name: 'Gematria Statistics', href: 'infopages/statistics.html' },
                { name: 'My Work', href: 'work.html' },
            ]
        },
        {
            title: 'Gematria Types',
            links: [
                { name: 'All Ciphers', href: 'infopages/ciphers.html' },
                { name: 'Jewish Gematria', href: 'infopages/ciphers.html#jewish-gematria' },
                { name: 'English Gematria', href: 'infopages/ciphers.html#english-ordinal' },
                { name: 'Simple Gematria', href: 'infopages/ciphers.html#full-reduction' },
            ]
        },
        {
            title: 'Analysis Tools',
            links: [
                { name: 'Tools Hub', href: 'tools/tools.html' },
                { name: 'Delta', href: 'tools/delta.html' },
                { name: 'ELS', href: 'tools/els.html' },
                { name: 'Scanner', href: 'tools/scanner.html' },
                { name: 'Unfold', href: 'tools/unfold.html' },
            ]
        },
        {
            title: 'Resources',
            links: [
                { name: 'Numerology', href: 'infopages/numerology.html' },
                { name: 'Tesla Gematria', href: 'tools/teslagematria.html' },
            ]
        }
    ];

    let headerHtml = '<header class="site-header-main">';
    
    headerColumns.forEach(column => {
        headerHtml += `<div class="header-column">`;
        // No title for the first column to match the look
        if (column.title !== 'Gematrix') {
             headerHtml += `<h4>${column.title}</h4>`;
        }
        headerHtml += '<ul>';
        column.links.forEach(link => {
            headerHtml += `<li><a href="${pathPrefix}/${link.href}">${link.name}</a></li>`;
        });
        headerHtml += '</ul></div>';
    });

    headerHtml += '<div class="theme-toggle-container"><button id="theme-toggle" title="Toggle theme"></button></div>';
    headerHtml += '</header>';
    
    document.getElementById('main-header-placeholder').innerHTML = headerHtml;
}

function setupTheme() {
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    // The pathPrefix MUST be set on each page before this script is called.
    createHeader(window.pathPrefix); 
    setupTheme();

    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            let currentTheme = document.body.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('gematria-theme', newTheme);
        });
    }
});

