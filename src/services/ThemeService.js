const STORAGE_KEY = 'theme';
const DARK_CLASS  = 'dark';

/**
 * ThemeService — manages light/dark mode preference.
 *
 * - Reads saved preference from localStorage on construction
 * - Falls back to the OS/system preference (prefers-color-scheme)
 * - Applies the `dark` CSS class to <html> so Tailwind's dark: variants activate
 * - Persists every toggle to localStorage
 */
export class ThemeService {
    constructor() {
        this._theme = this._loadPreference();
        this._apply();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /** @returns {'light'|'dark'} */
    get theme() { return this._theme; }

    get isDark()  { return this._theme === 'dark'; }
    get isLight() { return this._theme === 'light'; }

    /** Switch to dark mode and persist. */
    enableDark() {
        this._theme = 'dark';
        this._apply();
        this._save();
    }

    /** Switch to light mode and persist. */
    enableLight() {
        this._theme = 'light';
        this._apply();
        this._save();
    }

    /** Toggle between dark and light, persist, and return the new theme. */
    toggle() {
        this.isDark ? this.enableLight() : this.enableDark();
        return this._theme;
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    /** Apply the current theme to <html> so Tailwind dark: variants activate. */
    _apply() {
        if (this.isDark) {
            document.documentElement.classList.add(DARK_CLASS);
        } else {
            document.documentElement.classList.remove(DARK_CLASS);
        }
    }

    /** Persist current theme to localStorage. */
    _save() {
        localStorage.setItem(STORAGE_KEY, this._theme);
    }

    /**
     * Load saved preference, or fall back to OS preference.
     * @returns {'light'|'dark'}
     */
    _loadPreference() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;

        // Respect system preference as the default
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }
}
