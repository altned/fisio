/**
 * XSS Sanitization Utility
 * Sanitizes user input to prevent Cross-Site Scripting attacks
 */
import xss from 'xss';

// Configure XSS filter options
const xssOptions = {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true, // Strip all unknown tags
    stripIgnoreTagBody: ['script', 'style'], // Strip script and style tags completely
};

/**
 * Sanitize a single string value
 */
export function sanitize(value: string): string {
    if (!value || typeof value !== 'string') {
        return value;
    }
    return xss(value, xssOptions);
}

/**
 * Sanitize all string properties in an object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitize(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
                typeof item === 'string' ? sanitize(item) : item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}
