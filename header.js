// --- Reusable Header and Theme Functions ---

/**
 * Gets a structured object of cipher categories and names.
 * This should be kept in sync with ciphers.js.
 */
function getCipherCategories() {
    const categories = {
        "Core Ciphers": ["English Ordinal", "Reverse Ordinal", "Full Reduction", "Reverse Full Reduction", "Jewish Gematria", "Sumerian", "Chaldean"],
        "Keyboard Ciphers": ["Qwerty Gematria", "Left-Hand Qwerty", "Right-Hand Qwerty"],
        "Alternative Systems": ["Phone Keypad"],
        "Positional & Esoteric Ciphers": ["Spiral Gematria", "Golden Ratio Position", "SGRR Signal Signature"],
        "Computational Ciphers": ["ASCII Sum", "Binary Sum"],
        "Reverse Ciphers": [/* Populated below */]
    };

    // Dynamically add Base-N ciphers
    for (let i = 2; i <= 12; i++) {
        categories["Computational Ciphers"].push(`Base-${i} Sum`);
    }

    // Dynamically create a list of ciphers that have a reverse version
    const reversibleCiphers = Object.values(categories).flat();
    categories["Reverse Ciphers"] = reversibleCiphers.map(c => `Reverse ${c}`);

    return categories;
}


function createHeader(pathPrefix = '.') {
    const navLinks = [
        { name: 'Home', href: 'index.html' },
        { name: 'Calculator', href: 'gematriamain/gematria.html' },
        { name: 'Library', href: 'library.html' },
        {
            name: 'Tools',
            children: [
                { name: 'Tools Hub', href: 'tools/tools.html' },
                { name: 'Delta', href: 'tools/delta.html' },
                { name: 'ELS', href: 'tools/els.html' },
                { name: 'Scanner', href: 'tools/scanner.html' },
                { name: 'Unfold', href: 'tools/unfold.html' },
                { name: 'Tesla Gematria', href: 'tools/teslagematria.html' }
            ]
        },
        {
            name: 'Reference',
            children: [
                // This is our new special entry for the ciphers mega-menu
                { name: 'Ciphers', type: 'mega-menu', data: getCipherCategories() },
                { name: 'Statistics', href: 'infopages/statistics.html' },
                { name: 'Numerology', href: 'infopages/numerology.html' }
            ]
        },
        { name: 'Work', href: 'work.html' }
    ];

    let navHtml = '<nav class="main-nav"><div class="nav-links">';

    navLinks.forEach(link => {
        if (link.children) {
            navHtml += `<div class="dropdown">
                <a href="#" class="drop-btn">${link.name}</a>
                <div class="dropdown-content">`;
            link.children.forEach(child => {
                if (child.type === 'mega-menu') {
                    // Handle the special Ciphers mega-menu
                    navHtml += `<div class="dropdown-submenu">
                        <a href="${pathPrefix}/infopages/ciphers.html">${child.name} &raquo;</a>
                        <div class="dropdown-submenu-content">`;
                    const cipherCategories = child.data;
                    for (const category in cipherCategories) {
                        navHtml += `<div class="submenu-column"><h4>${category}</h4>`;
                        cipherCategories[category].forEach(cipherName => {
                            // Create an anchor link that points to the specific cipher on the page
                            const anchor = cipherName.replace(/\s+/g, '-').toLowerCase();
                            navHtml += `<a href="${pathPrefix}/infopages/ciphers.html#${anchor}">${cipherName}</a>`;
                        });
                        navHtml += `</div>`;
                    }
                    navHtml += `</div></div>`;
                } else {
                    navHtml += `<a href="${pathPrefix}/${child.href}">${child.name}</a>`;
                }
            });
            navHtml += `</div></div>`;
        } else {
            navHtml += `<a href="${pathPrefix}/${link.href}">${link.name}</a>`;
        }
    });

    navHtml += '</div><button id="theme-toggle" class="theme-toggle-button" title="Toggle theme"></button></nav>';
    
    const headerPlaceholder = document.getElementById('main-header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = navHtml;
    } else {
        console.error('Header placeholder with ID "main-header-placeholder" not found.');
    }
}

function setupTheme() {
    const savedTheme = localStorage.getItem('gematria-theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

document.addEventListener('DOMContentLoaded', () => {
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