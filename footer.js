document.addEventListener('DOMContentLoaded', () => {
    // 1. Find the placeholder element for the footer
    const mainFooterPlaceholder = document.getElementById('main-footer-placeholder');
    if (!mainFooterPlaceholder) {
        console.warn('Footer placeholder element not found. Footer will not be rendered.');
        return;
    }

    // 2. Inject the footer's HTML structure
    mainFooterPlaceholder.innerHTML = `
        <footer class="mega-footer">
            <div class="mega-footer-inner">
                <p>&copy; ${new Date().getFullYear()} Your Website Name</p>
                <p>Feel free to replace this text with your own footer links or information.</p>
            </div>
        </footer>
    `;

    // 3. Create and append the Ko-fi widget scripts to the document body
    // This ensures they load correctly after the page structure is in place.
    const kofiScriptMain = document.createElement('script');
    kofiScriptMain.type = 'text/javascript';
    kofiScriptMain.src = 'https://storage.ko-fi.com/cdn/widget/Widget_2.js';
    
    // The second script, which initializes the widget, should only run after the first one has loaded.
    kofiScriptMain.onload = () => {
        const kofiScriptInit = document.createElement('script');
        kofiScriptInit.type = 'text/javascript';
        kofiScriptInit.text = `kofiwidget2.init('Support me on Ko-fi', '#72a4f2', 'L3L31JCTM4');kofiwidget2.draw();`;
        document.body.appendChild(kofiScriptInit);
    };
    
    document.body.appendChild(kofiScriptMain);
});
