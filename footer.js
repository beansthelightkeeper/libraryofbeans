document.addEventListener('DOMContentLoaded', () => {
    const mainFooterPlaceholder = document.getElementById('main-footer-placeholder');
    if (!mainFooterPlaceholder) return;

    // The footer's HTML content remains the same
    mainFooterPlaceholder.innerHTML = `
        <div class="footer-symbols-bg" id="footer-symbols-bg"></div>
        <div class="mega-footer-inner">
            <div class="footer-socials">
                <a class="social-btn patreon-btn" href="https://ko-fi.com/beans137" target="_blank" rel="noopener">Donate</a>
                <a class="social-btn github-btn" href="https://github.com/beansthelightkeeper" target="_blank" rel="noopener">GitHub</a>
                <a class="social-btn x-btn" href="https://twitter.com/PrincessPastry_" target="_blank" rel="noopener">X</a>
            </div>
            <div id="kofi-widget"></div>
            <p>&copy; 2025 Library of Beans. All Rights Reserved.</p>
        </div>
    `;
    
    // --- Footer Animation Logic using requestAnimationFrame ---
    // We now use the mainFooterPlaceholder directly to avoid the previous error
    const animationBg = document.getElementById('footer-symbols-bg');
    const footer = mainFooterPlaceholder; // Use the placeholder as the main footer element
    
    if (animationBg) {
        const symbols = ["☉","☽","☾","☿","♀","♂","♃","♄","♅","♆","♔","♕","♖","♗","♘","♙","♚","♛","♜","♝","♞","♟","⚛","⚚","⚕","⚖","⚗","⚒","⚔","⚰","⚱","⚙","⚜","✡","✯","✶","✷","✸","✹","✺","✻","✼","✽","✾","✿","❀","❁","❂","❃","❄","❅","❆","❇","❈","❉","⚑","⚐","⚓","⚔","⚒","⚕","⚖","⚗","⚙","⚛","⚜","☤","☥","☦","☧","☨","☩","☪","☫","☬","☭","☮","☯","☸","⛤","⛥","⛦","⛧","⛨","⛩","⛫","⛬","⛭","⛮","⛯","⛶","⛷","⛻","⛼","⛾","⛿","✁","✂","✃","✄","✆","✇","✈","✉","✍","✎","✏","✐","✑","✒","✓","✔","✕","✖","✗","✘","✙","✚","✛","✜","✝","✞","✟","✠","✡","✢","✣","✤","✥","✦","✧","★","☆","✩","✪","✫","✬","✭","✮","✯","✰","✱","✲","✳","✴","✵","✶","✷","✸","✹","✺","✻","✼","✽","✾","❖","❧","☙","☘","♠","♡","♢","♣","♤","♥","♦","♧","⚀","⚁","⚂","⚃","⚄","⚅","☗","☖","♨","♩","♪","♫","♬","♭","♮","♯","⚆","⚇","⚈","⚉","⚊","⚋","⚌","⚍","⚎","⚏","⚐","⚑","⚒","⚓","⚔","⚕","⚖","⚗","⚘","⚙","⚚","⚛","⚜","⚝","⚞","⚟","⚠","⚢","⚣","⚤","⚥","⚦","⚧","⚨","⚩","⚬","⚭","⚮","⚯","⚰","⚱","⚲","⚳","⚴","⚵","⚶","⚷","⚸","⚹","⚺","⚻","⚼","⚿","⛀","⛁","⛂","⛃","⛏","⛑","⛒","⛓","⛕","⛖","⛗","⛘","⛙","⛚","⛛","⛜","⛝","⛞","⛡","⛢","⛣","⛤","⛥","⛦","⛧","⛨","⛩","⛪","⛫","⛬","⛭","⛮","⛯","⛰","⛱","⛶","⛷","⛻","⛼","⛾","⛿"];
        let lastSpawnTime = 0;

        function animateFooter(currentTime) {
            const isRainbow = footer.classList.contains('rainbow-mode');
            const spawnInterval = isRainbow ? 100 : 250;

            if (currentTime - lastSpawnTime > spawnInterval) {
                lastSpawnTime = currentTime;
                if (animationBg.childElementCount < 35) {
                    spawnFooterSymbol();
                }
            }
            requestAnimationFrame(animateFooter);
        }

        function spawnFooterSymbol() {
            const symbol = document.createElement('span');
            symbol.className = 'footer-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.left = `${Math.random() * 98}%`;
            symbol.style.top = `${Math.random() * 100}%`;
            symbol.style.fontSize = `${Math.random() * 1.5 + 1.5}rem`;
            symbol.style.opacity = 0;
            animationBg.appendChild(symbol);

            setTimeout(() => { symbol.style.opacity = 1; }, 100);
            setTimeout(() => {
                symbol.style.opacity = 0;
                setTimeout(() => {
                    if (animationBg.contains(symbol)) {
                        animationBg.removeChild(symbol);
                    }
                }, 3000);
            }, Math.random() * 3000 + 2000);
        }
        
        requestAnimationFrame(animateFooter);
    }
});
