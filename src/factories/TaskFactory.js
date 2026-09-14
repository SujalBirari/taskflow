import { Task } from '../models/Task.js';
import { validateTitle, validateDueDate, capitalise } from '../utils/validation.js';

/**
 * TaskFactory — centralises all Task construction logic.
 *
 * Enforces validation, normalisation, and default values in one place so
 * no caller ever has to know about the Task constructor's internal shape.
 *
 * Usage:
 *   TaskFactory.create({ title, description, catRaw, priRaw, dueDate })
 */
export class TaskFactory {
    /**
     * Build and return a validated, normalised Task instance.
     *
     * @param {{
     *   title:        string,
     *   description?: string|null,
     *   catRaw?:      string|null,   // raw category value (will be capitalised)
     *   priRaw?:      string|null,   // raw priority value (will be capitalised)
     *   dueDate?:     string|null,
     * }} data
     * @returns {Task}
     * @throws {Error} if title or dueDate validation fails
     */
    static create(data = {}) {
        const {
            title,
            description = null,
            catRaw      = null,
            priRaw      = null,
            dueDate     = null,
        } = data;

        // ── Validate ─────────────────────────────────────────────────────────
        const titleCheck = validateTitle(title);
        if (!titleCheck.valid) throw new Error(titleCheck.error);

        const dateCheck = validateDueDate(dueDate);
        if (!dateCheck.valid)  throw new Error(dateCheck.error);

        // ── Normalise ────────────────────────────────────────────────────────
        return new Task(title.trim(), {
            description: description?.trim() || null,
            category:    capitalise(catRaw),
            priority:    capitalise(priRaw),
            dueDate:     dueDate || null,
        });
    }

    /**
     * Rehydrate a stored plain object back into a Task instance.
     * Delegates to Task.from() — provided here for a single import surface.
     *
     * @param {object} obj
     * @returns {Task}
     */
    static fromStorage(obj) {
        return Task.from(obj);
    }
}
