/**
 * EventBus — lightweight Pub/Sub implementation.
 *
 * Events used in TaskFlow:
 *
 *   task:created   { task: Task }
 *   task:updated   { task: Task }
 *   task:completed { task: Task }
 *   task:rejected  { task: Task }
 *   task:reopened  { task: Task }
 *   task:deleted   { id: string }
 *   tasks:loaded   { tasks: Task[] }
 *
 * Usage:
 *   eventBus.subscribe('task:created', ({ task }) => console.log(task));
 *   eventBus.publish('task:created', { task });
 *   eventBus.unsubscribe('task:created', handler);
 *   eventBus.once('task:created', handler);   // fires exactly once
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._listeners = new Map();
    }

    // ─── Core API ─────────────────────────────────────────────────────────────

    /**
     * Subscribe to an event.
     * @param {string}   event    Event name (e.g. 'task:created')
     * @param {Function} callback Receives the payload object
     * @returns {Function}        The callback (for easy unsubscribe)
     */
    subscribe(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        return callback;
    }

    /**
     * Unsubscribe a previously registered callback.
     * @param {string}   event
     * @param {Function} callback  Must be the same reference passed to subscribe()
     */
    unsubscribe(event, callback) {
        this._listeners.get(event)?.delete(callback);
    }

    /**
     * Subscribe to an event — the handler is automatically removed after the first call.
     * @param {string}   event
     * @param {Function} callback
     */
    once(event, callback) {
        const wrapper = (payload) => {
            callback(payload);
            this.unsubscribe(event, wrapper);
        };
        this.subscribe(event, wrapper);
    }

    /**
     * Publish an event with an optional payload.
     * All subscribers are called synchronously in subscription order.
     * @param {string} event
     * @param {*}      [payload]
     */
    publish(event, payload) {
        this._listeners.get(event)?.forEach(cb => {
            try {
                cb(payload);
            } catch (err) {
                console.error(`[EventBus] Error in subscriber for "${event}":`, err);
            }
        });
    }

    /**
     * Remove all subscribers for a given event (or ALL events if omitted).
     * @param {string} [event]
     */
    clear(event) {
        if (event) {
            this._listeners.delete(event);
        } else {
            this._listeners.clear();
        }
    }

    /**
     * List all events that have at least one active subscriber (for debugging).
     * @returns {string[]}
     */
    get activeEvents() {
        return [...this._listeners.entries()]
            .filter(([, subs]) => subs.size > 0)
            .map(([event]) => event);
    }
}
