export type Theme = 'light' | 'dark' | 'system';

let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

function prefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: Theme) {
  try {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    // remove any existing listener when switching away from 'system'
    if (systemListener && theme !== 'system') {
      try { mq.removeEventListener('change', systemListener); } catch(e) { /* ignore */ }
      systemListener = null;
    }

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const apply = (e?: MediaQueryListEvent) => {
        const dark = e ? e.matches : mq.matches;
        if (dark) root.classList.add('dark'); else root.classList.remove('dark');
      };
      apply();
      // attach listener
      systemListener = (e: MediaQueryListEvent) => apply(e);
      try { mq.addEventListener('change', systemListener); } catch(e) { /* ignore */ }
    }

    localStorage.setItem('theme', theme);
  } catch (err) {
    // no-op in non-browser environments
    // console.warn('applyTheme failed', err);
  }
}

export function initTheme() {
  if (typeof window === 'undefined') return;
  const saved = (localStorage.getItem('theme') as Theme) || 'system';
  applyTheme(saved);
}
