document.addEventListener('DOMContentLoaded', () => {
    const mainHeaderPlaceholder = document.getElementById('main-header-placeholder');
    if (!mainHeaderPlaceholder) return;

    mainHeaderPlaceholder.innerHTML = `
        <nav class="mega-header">
            <div class="mega-header-inner">
                <div class="header-col">
                    <h4>Library of Beans</h4>
                    <ul>
                        <li><a href="/gematriamain/calculator.html">Calculator</a></li>
                        <li><a href="/work/numerology.html">Numerology</a></li>
                        <li><a href="/work/statistics.html">Statistics</a></li>
                        <li><a href="/library.html">Library</a></li>
                        <li><a href="/work.html">Work</a></li>
                        <li><a href="about.html">About</a></li>
                    </ul>
                </div>
                <div class="header-col">
                    <h4>Gematria Types</h4>
                    <ul>
                        <li><a href="/work/ciphers.html#jewish-gematria">Jewish Gematria</a></li>
                        <li><a href="/work/ciphers.html#english-gematria">English Gematria</a></li>
                        <li><a href="/work/ciphers.html#hebrew-gematria">Hebrew Gematria</a></li>
                        <li><a href="/work/ciphers.html#latin-gematria">Latin Gematria</a></li>
                        <li><a href="/work/ciphers.html#simple-gematria">Simple Gematria</a></li>
                    </ul>
                </div>
                <div class="header-col">
                    <h4>Tools</h4>
                    <ul>
                        <li><a href="/tools/tools.html">Tools</a></li>
                        <li><a href="/tools/delta.html">Delta</a></li>
                        <li><a href="/tools/els.html">ELS</a></li>
                        <li><a href="/tools/scanner.html">Scanner</a></li>
                        <li><a href="/tools/toolsexp.html">Tools Exp</a></li>
                        <li><a href="/tools/unfold.html">Unfold</a></li>
                    </ul>
                </div>
                <div class="header-col">
                    <h4>External</h4>
                    <ul>
                        <li><a href="https://www.gematrix.org" target="_blank">Gematrix.org</a></li>
                        <li><a href="https://en.wikipedia.org/wiki/Gematria" target="_blank">Wikipedia</a></li>
                        <li><a href="https://chrome.google.com/webstore/detail/gematria-calculator-gemat/gabklpcbgpilmpfpbingloinmdpojagl?hl=en-US&utm_source=chrome-ntp-launcher" target="_blank" style="color:red;">Chrome App</a></li>
                        <li><a href="https://gematrixorg.tumblr.com" target="_blank">Tumblr</a></li>
                        <li><a href="https://twitter.com/princesspastry_" target="_blank">Twitter</a></li>
                    </ul>
                </div>
                <div class="theme-toggle-container">
                    <button id="theme-toggle" title="Toggle theme">🌓</button>
                </div>
            </div>
        </nav>
    `;

    // Theme toggle logic
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    if (localStorage.getItem('theme') === 'dark') {
        body.setAttribute('data-theme', 'dark');
        toggleBtn.textContent = '🌙';
    } else {
        body.removeAttribute('data-theme');
        toggleBtn.textContent = '☀️';
    }
    toggleBtn.addEventListener('click', function() {
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            toggleBtn.textContent = '☀️';
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleBtn.textContent = '🌙';
        }
    });
});