document.addEventListener('DOMContentLoaded', () => {
    const mainHeaderPlaceholder = document.getElementById('main-header-placeholder');

    const headerHTML = `
        <div class="site-header-main">
            <div class="header-column">
                <h4>TOOLS</h4>
                <ul>
                    <li><a href="#">Calculator</a></li>
                    <li><a href="#">Decoder</a></li>
                    <li><a href="#">Statistics</a></li>
                </ul>
            </div>
            <div class="header-column">
                <h4>ARTICLES</h4>
                <ul>
                    <li><a href="#">All</a></li>
                    <li><a href="#">Featured</a></li>
                    <li><a href="#">Recent</a></li>
                </ul>
            </div>
            <div class="header-column">
                <h4>THEMES</h4>
                <ul>
                    <li><a href="#">Biblical</a></li>
                    <li><a href="#">Historical</a></li>
                    <li><a href="#">Esoteric</a></li>
                </ul>
            </div>
            <div class="header-column">
                <h4>LINKS</h4>
                <ul>
                    <li><a href="#">Blog</a></li>
                    <li><a href="#">Forum</a></li>
                    <li><a href="#">Contact</a></li>
                </ul>
            </div>
        </div>
        <div class="theme-toggle-container">
            <button id="theme-toggle"></button>
        </div>
    `;

    if (mainHeaderPlaceholder) {
        mainHeaderPlaceholder.innerHTML = headerHTML;
    }
});
