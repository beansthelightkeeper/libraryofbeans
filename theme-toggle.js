document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for a saved theme preference on page load
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);

    // Update the toggle button's appearance
    if (savedTheme === 'dark') {
        themeToggle.style.backgroundColor = '#000';
        themeToggle.style.borderColor = '#555';
    } else {
        themeToggle.style.backgroundColor = '#fff';
        themeToggle.style.borderColor = '#888';
    }

    // Add click event listener to the toggle button
    themeToggle.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'light') {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.style.backgroundColor = '#000';
            themeToggle.style.borderColor = '#555';
        } else {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.style.backgroundColor = '#fff';
            themeToggle.style.borderColor = '#888';
        }
    });
});
