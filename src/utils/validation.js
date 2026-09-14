/**
 * Validate that a task title is non-empty.
 * @param {string} title
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTitle(title) {
    if (!title || title.trim().length === 0) {
        return { valid: false, error: 'Task title cannot be empty.' };
    }
    if (title.trim().length > 200) {
        return { valid: false, error: 'Task title cannot exceed 200 characters.' };
    }
    return { valid: true };
}

/**
 * Validate that dueDate, if provided, is a parseable date string.
 * @param {string|null} dueDate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDueDate(dueDate) {
    if (!dueDate) return { valid: true };
    const d = new Date(dueDate);
    if (isNaN(d.getTime())) {
        return { valid: false, error: 'Invalid due date.' };
    }
    return { valid: true };
}

/**
 * Capitalise the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalise(str) {
    if (!str) return null;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
