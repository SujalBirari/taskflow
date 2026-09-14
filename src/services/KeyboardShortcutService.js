/**
 * KeyboardShortcutService — registers and dispatches global keyboard shortcuts.
 *
 * Rules:
 *  - Shortcuts with printable keys (N, /) are silenced when the user is
 *    already typing inside an <input>, <textarea>, or <select>.
 *  - Escape always fires regardless of focus, so modals can always be closed.
 *  - Modifier combos (Ctrl/Alt/Meta + key) are intentionally ignored so
 *    browser shortcuts (Ctrl+N, Ctrl+F, …) are never hijacked.
 *
 * Usage:
 *   const kb = new KeyboardShortcutService({
 *       'n':      () => openNewTask(),
 *       '/':      () => focusSearch(),
 *       'Escape': () => closeModals(),
 *   });
 *   kb.destroy(); // removes the listener when no longer needed
 */
export class KeyboardShortcutService {
    /**
     * @param {Record<string, () => void>} shortcuts
     *   Keys are KeyboardEvent.key strings (case-sensitive).
     *   Values are zero-arg handler functions.
     */
    constructor(shortcuts = {}) {
        this._shortcuts = shortcuts;
        this._handler   = this._onKeyDown.bind(this);
        document.addEventListener('keydown', this._handler);
    }

    // ─── Public ───────────────────────────────────────────────────────────────

    /**
     * Add or overwrite a single shortcut at runtime.
     * @param {string}   key
     * @param {Function} handler
     */
    register(key, handler) {
        this._shortcuts[key] = handler;
    }

    /** Remove a registered shortcut. */
    unregister(key) {
        delete this._shortcuts[key];
    }

    /** Tear down the global listener. */
    destroy() {
        document.removeEventListener('keydown', this._handler);
    }

    // ─── Private ─────────────────────────────────────────────────────────────

    _onKeyDown(e) {
        // Never hijack browser-level modifier combos
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const key    = e.key;
        const isEsc  = key === 'Escape';
        const typing = this._isTypingContext();

        // Escape fires regardless of focus
        if (isEsc) {
            this._dispatch('Escape', e);
            return;
        }

        // All other shortcuts are blocked while user is typing in a form field
        if (typing) return;

        this._dispatch(key, e);
    }

    /** @private */
    _dispatch(key, e) {
        const handler = this._shortcuts[key];
        if (handler) {
            e.preventDefault();
            handler();
        }
    }

    /**
     * Returns true when the active element is an editable form control.
     * @private
     */
    _isTypingContext() {
        const tag = document.activeElement?.tagName?.toLowerCase() ?? '';
        const editable = document.activeElement?.isContentEditable ?? false;
        return ['input', 'textarea', 'select'].includes(tag) || editable;
    }
}
