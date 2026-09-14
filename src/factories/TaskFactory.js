import { Task } from '../models/Task.js';
import { validateTaskForm, capitalise } from '../utils/validation.js';

/**
 * TaskFactory — centralises all Task construction logic.
 *
 * Enforces validation, normalisation, and default values in one place so
 * no caller ever has to know about the Task constructor's internal shape.
 *
 * On validation failure it throws a ValidationError whose `.fields` property
 * contains an array of { field, message } objects — the Controller passes
 * these directly to TaskView.showFieldErrors() for inline display.
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
     *   catRaw?:      string|null,
     *   priRaw?:      string|null,
     *   dueDate?:     string|null,
     * }} data
     * @returns {Task}
     * @throws {ValidationError} with a `.fields` array if validation fails
     */
    static create(data = {}) {
        const {
            title,
            description = null,
            catRaw      = null,
            priRaw      = null,
            dueDate     = null,
        } = data;

        // ── Validate all fields at once ───────────────────────────────────────
        const errors = validateTaskForm({ title, dueDate, priRaw });
        if (errors.length > 0) {
            TaskFactory._throwValidationError(errors);
        }

        // ── Normalise & construct ─────────────────────────────────────────────
        return new Task(title.trim(), {
            description: description?.trim() || null,
            category:    capitalise(catRaw),
            priority:    capitalise(priRaw),
            dueDate:     dueDate || null,
        });
    }

    /**
     * Rehydrate a stored plain object back into a Task instance.
     * @param {object} obj
     * @returns {Task}
     */
    static fromStorage(obj) {
        return Task.from(obj);
    }

    /**
     * Throw a ValidationError carrying field-level error details.
     * @param {{ field: string, message: string }[]} fieldErrors
     * @private
     */
    static _throwValidationError(fieldErrors) {
        const err     = new Error('Validation failed: ' + fieldErrors.map(e => e.message).join(' | '));
        err.fields    = fieldErrors;  // structured payload for TaskView.showFieldErrors()
        err.isValidationError = true;
        throw err;
    }
}
