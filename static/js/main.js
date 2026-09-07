/**
 * Modern Vanilla JS Controller
 * Theme switching, multi-tab terminal studio, copy utilities, and mobile drawer
 */

(function () {
  'use strict';

  // SVG Icons for Theme Toggle
  const MOON_SVG = `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const SUN_SVG = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

  // 1. Theme Toggle with System Sync & Storage
  function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateThemeIcon(isDark);

    // Watch OS Theme changes if not explicitly overridden
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', e.matches);
        updateThemeIcon(e.matches);
      }
    });
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
  }

  function updateThemeIcon(isDark) {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = isDark ? SUN_SVG : MOON_SVG;
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
  }

  // 2. Mobile Menu Toggle & Overlay
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('nav-menu');
    const overlay = document.getElementById('nav-overlay');
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      if (overlay) overlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    }

    function openMenu() {
      menu.classList.add('open');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      if (overlay) overlay.classList.add('active');
      document.body.classList.add('menu-open');
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close when clicking any nav item/link
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !menu.contains(e.target) && menu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Close if resized to desktop viewport
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && menu.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // 3. Multi-Tab Architecture Terminal
  function initTerminalTabs() {
    const tabButtons = document.querySelectorAll('.terminal-tab');
    if (!tabButtons.length) return;

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        if (!targetId) return;

        // Set active tab
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Set active content pane
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
          if (pane.id === targetId) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });

        // Update footer file status
        const fileStatus = document.getElementById('terminal-file-status');
        if (fileStatus) {
          fileStatus.textContent = btn.textContent.trim();
        }
      });
    });
  }

  // Terminal Copy Utility
  window.copyTerminalContent = function () {
    const activePane = document.querySelector('.tab-pane.active');
    const btn = document.getElementById('terminal-copy-btn');
    if (!activePane || !btn) return;

    const rawText = activePane.innerText || activePane.textContent;
    navigator.clipboard.writeText(rawText.trim()).then(() => {
      const origHTML = btn.innerHTML;
      btn.innerHTML = `<span style="color: #34d399;">✓ Copied</span>`;
      setTimeout(() => {
        btn.innerHTML = origHTML;
      }, 2200);
    }).catch(err => console.error('Copy failed:', err));
  };

  // 4. Initialize on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initTerminalTabs();

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  });
})();
