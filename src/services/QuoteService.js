/**
 * QuoteService — fetches a daily motivational quote from an external API.
 *
 * API: https://dummyjson.com/quotes/random
 * Response shape: { id, quote, author }
 *
 * Caching strategy:
 *   - Stores the fetched quote in localStorage keyed by today's date.
 *   - On the same day, the cache is served instantly (no network request).
 *   - On a new day the cache is stale, so a fresh quote is fetched.
 *
 * Failure behaviour:
 *   - Returns null on any network or parse error.
 *   - The caller decides what fallback text to show.
 */
export class QuoteService {
    static API_URL     = 'https://dummyjson.com/quotes/random';
    static STORAGE_KEY = 'daily_quote_cache';

    // ─── Public ───────────────────────────────────────────────────────────────

    /**
     * Return today's quote.
     * Hits the network only when the cache is empty or stale (new day).
     *
     * @returns {Promise<{ text: string, author: string } | null>}
     *   null when the API request fails and there is no usable cache.
     */
    async fetchQuote() {
        const cached = this._readCache();
        if (cached) return cached;

        return await this._fetchFromAPI();
    }

    // ─── Network ─────────────────────────────────────────────────────────────

    /**
     * @private
     * @returns {Promise<{ text: string, author: string } | null>}
     */
    async _fetchFromAPI() {
        try {
            const response = await fetch(QuoteService.API_URL);

            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const json = await response.json();

            // Normalise the DummyJSON response shape → internal shape
            const quote = {
                text:   json.quote  ?? 'Keep going.',
                author: json.author ?? 'Unknown',
            };

            this._writeCache(quote);
            return quote;

        } catch (err) {
            console.error('[QuoteService] Failed to fetch quote:', err);
            return null; // ← caller renders the fallback message
        }
    }

    // ─── Cache ────────────────────────────────────────────────────────────────

    /**
     * @private
     * @returns {{ text: string, author: string } | null}
     */
    _readCache() {
        try {
            const raw = localStorage.getItem(QuoteService.STORAGE_KEY);
            if (!raw) return null;

            const { date, quote } = JSON.parse(raw);

            // Cache is valid only for today
            if (date === this._today()) return quote;

            return null; // stale — new day, fetch fresh
        } catch {
            return null;
        }
    }

    /**
     * @private
     * @param {{ text: string, author: string }} quote
     */
    _writeCache(quote) {
        try {
            localStorage.setItem(
                QuoteService.STORAGE_KEY,
                JSON.stringify({ date: this._today(), quote })
            );
        } catch {
            // localStorage quota exceeded — not critical, just skip caching
        }
    }

    /** @private */
    _today() {
        return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    }
}
