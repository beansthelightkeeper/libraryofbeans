document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('glyphCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Array of esoteric Unicode symbols
    const glyphs = ['▲', '▼', '☯', '⚗', '⚩', '☥', '⚦', '☿'];

    // Optional Eye of Horus SVG
    const eyeOfHorus = new Image();
    eyeOfHorus.src = 'assets/eye-of-horus.svg'; // Place SVG in assets folder

    // Glyph object constructor
    class Glyph {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.isEyeOfHorus = Math.random() > 0.8; // 20% chance for Eye of Horus
            this.symbol = this.isEyeOfHorus ? null : glyphs[Math.floor(Math.random() * glyphs.length)];
            this.size = Math.random() * 30 + 15; // Size between 15 and 45
            this.opacity = Math.random() * 0.6 + 0.2; // Start between 0.2 and 0.8
            this.opacitySpeed = Math.random() * 0.015 + 0.005; // Fade speed
            this.hue = Math.random() * 360; // Random hue for rainbow effect
            this.speedX = (Math.random() - 0.5) * 1; // Gentle movement
            this.speedY = (Math.random() - 0.5) * 1;
        }

        update() {
            // Update opacity for fade effect
            this.opacity += this.opacitySpeed;
            if (this.opacity > 0.8 || this.opacity < 0.2) {
                this.opacitySpeed = -this.opacitySpeed;
            }

            // Update position
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around canvas edges
            if (this.x > canvas.width) this.x -= canvas.width;
            if (this.x < 0) this.x += canvas.width;
            if (this.y > canvas.height) this.y -= canvas.height;
            if (this.y < 0) this.y += canvas.height;

            // Update hue for rainbow effect
            this.hue = (this.hue + 1) % 360;
        }

        draw() {
            const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
            ctx.globalAlpha = this.opacity;
            if (this.isEyeOfHorus && eyeOfHorus.complete) {
                ctx.drawImage(eyeOfHorus, this.x, this.y, this.size, this.size);
            } else {
                ctx.font = `${this.size}px 'Noto Sans Symbols', Arial, sans-serif`;
                ctx.fillStyle = isDarkMode
                    ? `hsla(${this.hue}, 80%, 50%, 1)`
                    : `hsla(${this.hue}, 70%, 40%, 1)`;
                ctx.fillText(this.symbol, this.x, this.y);
            }
            ctx.globalAlpha = 1;
        }
    }

    // Create 30 glyphs for animation
    const glyphObjects = [];
    for (let i = 0; i < 30; i++) {
        glyphObjects.push(new Glyph());
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        glyphObjects.forEach(glyph => {
            glyph.update();
            glyph.draw();
        });
        requestAnimationFrame(animate);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            document.body.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // Start animation
    animate();
});