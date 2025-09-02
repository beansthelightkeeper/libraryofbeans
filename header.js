document.addEventListener('DOMContentLoaded', () => {
    const mainHeaderPlaceholder = document.getElementById('main-header-placeholder');
    if (!mainHeaderPlaceholder) return;

    mainHeaderPlaceholder.innerHTML = `
        <nav class="mega-header">
            <div class="header-controls">
                <button id="minimize-btn" class="control-btn" title="Minimize Header">🔼</button>
                <button id="dark-mode-btn" class="control-btn" title="Toggle Dark Mode">🌙</button>
                <button id="rainbow-mode-btn" class="control-btn" title="Toggle Rainbow Mode">🌈</button>
            </div>
            <div class="header-animation-bg" id="header-animation-bg"></div>
            <div class="mega-header-inner">
                <div class="header-col">
                    <h4>Library of Beans</h4>
                    <ul>
                        <li><a href="/gematriamain/calculator.html">Calculator</a></li>
                        <li><a href="/work/numerology.html">Numerology</a></li>
                        <li><a href="/gematriamain/statistics.html">Statistics</a></li>
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
                        <li><a href="/work/ciphers.html#simple-gematria">Simple Gematria</a></li>
                        <li><a href="/work/ciphers.html#latin-gematria">Latin Gematria</a></li>
                        <li><a href="/work/ciphers.html#chaldean-gematria">Chaldean</a></li>
                        <li><a href="/work/ciphers.html#greek-isopsephy">Greek Isopsephy</a></li>
                        <li><a href="/work/ciphers.html#hebrew-gematria">Traditional Hebrew</a></li>
                    </ul>
                </div>
                <div class="header-col">
                    <h4>Beans Gematria</h4>
                    <ul>
                        <li><a href="/work/ciphers.html#jewish-gematria">Jewish Gematria</a></li>
                        <li><a href="/work/ciphers.html#english-gematria">English Gematria</a></li>
                        <li><a href="/work/ciphers.html#simple-gematria">Simple Gematria</a></li>
                        <li><a href="/work/ciphers.html#latin-gematria">Latin Gematria</a></li>
                        <li><a href="/work/ciphers.html#chaldean-gematria">Chaldean</a></li>
                        <li><a href="/work/ciphers.html#greek-isopsephy">Greek Isopsephy</a></li>
                        <li><a href="/work/ciphers.html#hebrew-gematria">Traditional Hebrew</a></li>
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
                    <h4>Other</h4>
                    <ul>
                       <li><a href="/gematriamain/localdb.html">Local Database</a></li>
                    </ul>
                </div>
                <div class="header-col">
                    <h4>External</h4>
                    <ul>
                        <li><a href="https://www.gematrix.org" target="_blank">Gematrix.org</a></li>
                        <li><a href="https://twitter.com/princesspastry_" target="_blank">Twitter</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    `;

    // --- Control Bar Logic ---
    const minimizeBtn = document.getElementById('minimize-btn');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const rainbowModeBtn = document.getElementById('rainbow-mode-btn');
    const megaHeader = document.querySelector('.mega-header');
    const body = document.body;
    
    minimizeBtn.addEventListener('click', () => {
        megaHeader.classList.toggle('minimized');
        minimizeBtn.textContent = megaHeader.classList.contains('minimized') ? '🔽' : '🔼';
    });

    darkModeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
    }

    rainbowModeBtn.addEventListener('click', () => {
        const footer = document.querySelector('.mega-footer'); // Find footer dynamically
        body.classList.toggle('rainbow-headings');
        megaHeader.classList.toggle('rainbow-mode');
        if (footer) footer.classList.toggle('rainbow-mode');
    });

    // --- Header Animation Logic using requestAnimationFrame ---
    const animationBg = document.getElementById('header-animation-bg');
    if (animationBg) {
        const symbols = ['▲', '△', '▴', '▵', '▸', '▹', '►', '▻', '▼', '▽', '▾', '▿', '◀', '◁', '◂', '◃', '◆', '◇', '◈', '◉', '◊', '◐', '◑', '◒', '◓', '◍', '◦', '●', '◎', '◯', '★', '☆', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰', '✱', '✲', '✳', '✴', '✵', '✶', '✷', '✸', '✹', '✺', '✻', '✼', '✽', '✾', '✿', '❀', '❁', '❂', '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋', '❖', '⬒', '⬓', '⬔', '⬕', '⬖', '⬗', '⬘', '⬙', '⬰', '⬱', '⬲', '⬳', '⬴', '⬵', '⬶', '⬷', '⬸', '⬹', '⬺', '⬻', '⧫', '⧈', '⧉', '⧊', '⧋', '⧌', '⧍', '⧎', '⧏', '⦀', '⦁', '⦂', '⦃', '⦄', '⦅', '⦆', '⦇', '⦈', '⦉', '⦊', '⦋', '⦌', '⦍', '⦎', '⦏', '⦐', '⦑', '⦒', '⦓', '⦔', '⦕', '⦖', '⦗', '⏃', '⏂', '⏁', '⏀', '◢', '◣', '◤', '◥', '▱', '▰', '▭', '▮', '▯', '✦', '✧'];
        let lastSpawnTime = 0;

        function animate(currentTime) {
            const isRainbow = megaHeader.classList.contains('rainbow-mode');
            const spawnInterval = isRainbow ? 120 : 450;

            if (currentTime - lastSpawnTime > spawnInterval) {
                lastSpawnTime = currentTime;
                if (animationBg.childElementCount < 30) {
                    spawnSymbol(isRainbow);
                }
            }
            requestAnimationFrame(animate);
        }

        function spawnSymbol(isRainbow) {
            const fadeTime = isRainbow ? 1500 : 3000;
            const symbol = document.createElement('span');
            symbol.className = 'header-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.left = `${Math.random() * 98}%`;
            symbol.style.top = `${Math.random() * 85}%`;
            symbol.style.fontSize = `${Math.random() * 12 + 12}px`;
            animationBg.appendChild(symbol);

            setTimeout(() => { symbol.style.opacity = '1'; }, 100);
            setTimeout(() => {
                symbol.style.opacity = '0';
                setTimeout(() => {
                    if (animationBg.contains(symbol)) {
                        animationBg.removeChild(symbol);
                    }
                }, 2000);
            }, Math.random() * 2000 + fadeTime);
        }
        
        requestAnimationFrame(animate); // Start the animation loop
    }
});

