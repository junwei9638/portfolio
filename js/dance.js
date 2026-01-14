// Handle back link fade on scroll
document.addEventListener('DOMContentLoaded', () => {
    const backLink = document.querySelector('.back-link');

    if (backLink) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                backLink.classList.add('hidden');
            } else {
                backLink.classList.remove('hidden');
            }
        });
    }

    // Handle year collapsing
    document.querySelectorAll('.year-marker').forEach(marker => {
        marker.style.cursor = 'pointer'; // Make it look clickable
        marker.addEventListener('click', () => {
            const group = marker.closest('.year-group');
            if (group) {
                group.classList.toggle('collapsed');
            }
        });
    });
});
