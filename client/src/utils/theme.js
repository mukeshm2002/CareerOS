/**
 * CareerOS Theme Utility
 * Handles Light, Dark, and System theme switching with persistent localStorage
 */

export function getEffectiveTheme(themeSetting) {
  if (themeSetting === 'DARK') return 'dark';
  if (themeSetting === 'LIGHT') return 'light';
  // SYSTEM fallback
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function applyTheme(themeSetting) {
  if (typeof document === 'undefined') return;

  const effective = getEffectiveTheme(themeSetting);
  const root = document.documentElement;

  if (effective === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function initTheme() {
  if (typeof window === 'undefined') return;

  const savedTheme = localStorage.getItem('careeros_theme') || 'SYSTEM';
  applyTheme(savedTheme);

  // Watch system color-scheme changes if currently set to SYSTEM
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const current = localStorage.getItem('careeros_theme') || 'SYSTEM';
      if (current === 'SYSTEM') {
        applyTheme('SYSTEM');
      }
    });
  }
}
