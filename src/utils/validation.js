/**
 * validation.js — all regex rules and validators for TaskFlow forms.
 *
 * Design principles:
 *  - RULES exports every pattern/limit in one place (easy to tweak)
 *  - Individual validators return { valid, error } for model-level throws
 *  - validateTaskForm() returns an array of { field, message } for inline UI errors
 */

// ─── Regex Rules ─────────────────────────────────────────────────────────────

export const RULES = {
    /** At least one non-whitespace character */
    TITLE_NON_EMPTY:  /\S/,

    /** 1–100 characters (after trimming) */
    TITLE_MAX_LENGTH: /^[\s\S]{1,100}$/,

    /** ISO date: YYYY-MM-DD with basic range guards */
    DATE_FORMAT:      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

    /** Accepted priority values (case-insensitive) */
    PRIORITY:         /^(low|medium|high)$/i,

    /** Accepted category values (case-insensitive) */
    CATEGORY:         /^(work|personal|study|other)$/i,

    /** Max title length constant (mirrors regex) */
    TITLE_MAX_CHARS:  100,
};

// ─── Individual validators (used by model layer — throw on failure) ───────────

/**
 * @param {string} title
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTitle(title) {
    const trimmed = (title ?? '').trim();

    if (!RULES.TITLE_NON_EMPTY.test(trimmed)) {
        return { valid: false, error: 'Task title is required.' };
    }
    if (!RULES.TITLE_MAX_LENGTH.test(trimmed)) {
        return {
            valid: false,
            error: `Title must not exceed ${RULES.TITLE_MAX_CHARS} characters (currently ${trimmed.length}).`,
        };
    }
    return { valid: true };
}

/**
 * @param {string|null} dueDate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDueDate(dueDate) {
    if (!dueDate) return { valid: true }; // optional field

    if (!RULES.DATE_FORMAT.test(dueDate)) {
        return { valid: false, error: 'Due date must be a valid date (YYYY-MM-DD).' };
    }
    // Verify the date is real (e.g. not Feb 30)
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) {
        return { valid: false, error: 'Due date is not a real calendar date.' };
    }
    return { valid: true };
}

/**
 * @param {string|null} priority  — raw form value, may be empty string
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePriority(priority) {
    if (!priority) return { valid: true }; // optional field

    if (!RULES.PRIORITY.test(priority)) {
        return { valid: false, error: 'Priority must be Low, Medium, or High.' };
    }
    return { valid: true };
}

// ─── Aggregate form validator (used by TaskFactory — returns field errors) ────

/**
 * Validate all task form fields at once.
 * Returns an empty array when everything is valid.
 *
 * @param {{
 *   title:   string,
 *   dueDate: string|null,
 *   priRaw:  string|null,
 * }} formData
 * @returns {{ field: string, message: string }[]}
 */
export function validateTaskForm({ title, dueDate, priRaw }) {
    const errors = [];

    const titleResult    = validateTitle(title);
    const dateResult     = validateDueDate(dueDate);
    const priorityResult = validatePriority(priRaw);

    if (!titleResult.valid)    errors.push({ field: 'task-title',    message: titleResult.error });
    if (!dateResult.valid)     errors.push({ field: 'task-due',      message: dateResult.error });
    if (!priorityResult.valid) errors.push({ field: 'task-priority', message: priorityResult.error });

    return errors;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Capitalise the first letter of a string.
 * @param {string} str
 * @returns {string|null}
 */
export function capitalise(str) {
    if (!str) return null;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
