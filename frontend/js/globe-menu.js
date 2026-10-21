/**
 * Affinova - Interactive Globe Login/Register Menu (Part 1 Specification)
 * Handles smooth expansion of LOGIN and REGISTER options around the 🌐 globe icon.
 */

document.addEventListener('DOMContentLoaded', () => {
  const globeContainers = document.querySelectorAll('.globe-auth-container');

  globeContainers.forEach(container => {
    const triggerBtn = container.querySelector('.globe-trigger-btn');
    const menu = container.querySelector('.globe-auth-menu');

    if (!triggerBtn || !menu) return;

    // Toggle open state on trigger click/tap
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = container.classList.contains('is-open');

      // Close any other open menus
      document.querySelectorAll('.globe-auth-container.is-open').forEach(c => {
        if (c !== container) c.classList.remove('is-open');
      });

      if (isOpen) {
        container.classList.remove('is-open');
        triggerBtn.setAttribute('aria-expanded', 'false');
      } else {
        container.classList.add('is-open');
        triggerBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Prevent clicks inside the open menu from immediately bubbling and closing it
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Close when clicking anywhere outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.globe-auth-container.is-open').forEach(container => {
      container.classList.remove('is-open');
      const triggerBtn = container.querySelector('.globe-trigger-btn');
      if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.globe-auth-container.is-open').forEach(container => {
        container.classList.remove('is-open');
        const triggerBtn = container.querySelector('.globe-trigger-btn');
        if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
      });
    }
  });
});
