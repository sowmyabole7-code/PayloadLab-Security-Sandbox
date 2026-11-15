/**
 * Theme Management
 * Dark security console default with light-mode toggle and localStorage persistence.
 */

import { createIcon } from './domUtils.js';

const THEME_STORAGE_KEY = 'payloadlab_theme';

export function initTheme() {
  let theme = 'dark'; // Dark "security console" default
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light';
    }
  } catch (e) {
    console.warn('Could not read theme from localStorage:', e);
  }

  applyTheme(theme);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {
        console.warn('Could not persist theme to localStorage:', e);
      }
    });
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    while (toggleBtn.firstChild) {
      toggleBtn.removeChild(toggleBtn.firstChild);
    }
    const icon = theme === 'dark' ? createIcon('sun', 18) : createIcon('moon', 18);
    toggleBtn.appendChild(icon);
    toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    toggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
}
