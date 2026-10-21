/**
 * Affinova - Modern Theme Management System (Dark / Light Mode)
 * Handles persistence, smooth transitions, and animated Sun/Moon icon swapping.
 */

(function () {
  const THEME_STORAGE_KEY = 'affinova_theme';

  // Get preferred or stored theme
  function getInitialTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to dark theme for premium SaaS aesthetic
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  // Update theme toggle icons (Sun for Dark Mode, Moon for Light Mode)
  function updateToggleIcons(theme) {
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
      if (theme === 'dark') {
        // Show Sun icon (click to switch to light)
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </svg>
        `;
        btn.setAttribute('aria-label', 'Switch to light mode');
        btn.setAttribute('title', 'Switch to light mode');
      } else {
        // Show Moon icon (click to switch to dark)
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>
        `;
        btn.setAttribute('aria-label', 'Switch to dark mode');
        btn.setAttribute('title', 'Switch to dark mode');
      }
    });
  }

  // Apply theme to document
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    updateToggleIcons(theme);

    // Dispatch event for components listening to theme change
    window.dispatchEvent(new CustomEvent('affinova_theme_changed', { detail: { theme } }));
  }

  // Toggle theme
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  // Initialize immediately on script load to prevent flash of wrong theme
  const initialTheme = getInitialTheme();
  document.documentElement.setAttribute('data-theme', initialTheme);

  // Hook event listeners when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    updateToggleIcons(initialTheme);

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    });
  });

  // Expose global helper
  window.AffinovaTheme = {
    get: () => document.documentElement.getAttribute('data-theme') || 'dark',
    set: applyTheme,
    toggle: toggleTheme
  };
})();
