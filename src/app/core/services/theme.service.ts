import { Injectable, computed, signal } from '@angular/core';

export type ThemeName = 'light' | 'dark';

const KEY = 'theme';
const BAR_COLOR: Record<ThemeName, string> = { light: '#ffffff', dark: '#140c11' };

function saved(): ThemeName | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch { return null; }
}

function deviceIsDark(): boolean {
  return !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

// Light / dark mode. Website aur admin portal dono ek hi pasand istemal karte hain.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeName>(saved() ?? (deviceIsDark() ? 'dark' : 'light'));
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.apply(this.theme());

    // Agar user ne khud nahi chuna, to device ki setting badalne par saath badle
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', e => {
      if (!saved()) this.setTheme(e.matches ? 'dark' : 'light', false);
    });

    // Doosre tab mein badla ho to yahan bhi badal jaye
    window.addEventListener('storage', e => {
      if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) this.setTheme(e.newValue, false);
    });
  }

  toggle() { this.setTheme(this.isDark() ? 'light' : 'dark'); }

  setTheme(theme: ThemeName, remember = true) {
    this.theme.set(theme);
    this.apply(theme);
    if (remember) { try { localStorage.setItem(KEY, theme); } catch { /* private mode */ } }
  }

  private apply(theme: ThemeName) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOR[theme]);
  }
}
