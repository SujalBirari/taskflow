const STORAGE_KEY = 'tasks';

/**
 * StorageService — OOP wrapper for localStorage persistence.
 * Can be instantiated with a custom key (useful for testing).
 */
export class StorageService {
    /** @param {string} key localStorage key */
    constructor(key = STORAGE_KEY) {
        this._key = key;
    }

    /**
     * Load and return raw plain-object array from storage.
     * @returns {object[]}
     */
    load() {
        try {
            const stored = JSON.parse(localStorage.getItem(this._key));
            return Array.isArray(stored) ? stored : [];
        } catch {
            return [];
        }
    }

    /**
     * Persist an array of serialisable objects to storage.
     * Accepts Task instances (calls .toJSON() if available) or plain objects.
     * @param {Array} items
     */
    save(items) {
        const plain = items.map(item =>
            typeof item.toJSON === 'function' ? item.toJSON() : item
        );
        localStorage.setItem(this._key, JSON.stringify(plain));
    }

    /** Remove all items from storage. */
    clear() {
        localStorage.removeItem(this._key);
    }
}
