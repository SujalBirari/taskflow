import { EventBus }       from './events/EventBus.js';
import { TaskView }       from './views/TaskView.js';
import { StorageService } from './services/StorageService.js';
import { TaskManager }    from './services/TaskManager.js';
import { TaskController }          from './controllers/TaskController.js';
import { ThemeService }            from './services/ThemeService.js';
import { QuoteService }            from './services/QuoteService.js';
import { KeyboardShortcutService } from './services/KeyboardShortcutService.js';

// ─── Theme ────────────────────────────────────────────────────────────────────

const theme = new ThemeService();

const themeToggleBtn = document.querySelector('#theme-toggle');
if (themeToggleBtn) {
    const updateIcon = () => {
        themeToggleBtn.textContent = theme.isDark ? '☀️' : '🌙';
        themeToggleBtn.setAttribute('title', theme.isDark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    updateIcon();
    themeToggleBtn.addEventListener('click', () => {
        theme.toggle();
        updateIcon();
    });
}

// ─── Daily Motivation ─────────────────────────────────────────────────────────

const quoteService = new QuoteService();

/** DOM refs for the motivation card */
const motivationLoading = document.querySelector('#motivation-loading');
const motivationContent = document.querySelector('#motivation-content');
const motivationError   = document.querySelector('#motivation-error');
const motivationQuote   = document.querySelector('#motivation-quote');
const motivationAuthor  = document.querySelector('#motivation-author');
const motivationRefresh = document.querySelector('#motivation-refresh');

/**
 * Fetch and render a quote.
 * Pass `bustCache = true` to skip the daily cache (used by the refresh button).
 * @param {boolean} [bustCache=false]
 */
async function loadQuote(bustCache = false) {
    // Show loading skeleton, hide previous content/error
    motivationLoading?.classList.remove('hidden');
    motivationContent?.classList.add('hidden');
    motivationError?.classList.add('hidden');

    // Optionally bust the localStorage cache so a fresh quote is fetched
    if (bustCache) {
        localStorage.removeItem('daily_quote_cache');
    }

    const quote = await quoteService.fetchQuote();

    motivationLoading?.classList.add('hidden');

    if (quote) {
        if (motivationQuote)  motivationQuote.textContent  = `"${quote.text}"`;
        if (motivationAuthor) motivationAuthor.textContent = `— ${quote.author}`;
        motivationContent?.classList.remove('hidden');
    } else {
        motivationError?.classList.remove('hidden');
    }
}

// Initial load
loadQuote();

// Refresh button bypasses the daily cache for a new quote
motivationRefresh?.addEventListener('click', () => loadQuote(true));

// ─── App ──────────────────────────────────────────────────────────────────────

const eventBus   = new EventBus();
const storage    = new StorageService();
const manager    = new TaskManager(storage, eventBus);
const view       = new TaskView();
const controller = new TaskController(view, manager, eventBus);

controller.init();

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────

const keyboardShortcuts = new KeyboardShortcutService({
    'n':      () => controller.openNewTask(),
    'N':      () => controller.openNewTask(),
    '/':      () => controller.focusSearch(),
    'Escape': () => controller.closeModals(),
});