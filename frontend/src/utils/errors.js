/**
 * Error utility functions
 */

/**
 * Safely extracts a displayable error string from an API error response or error object.
 * Handles 422 validation errors (where detail is an array), 400/403/404 business errors (where detail is a string),
 * response message strings, or fallback error messages.
 *
 * @param {any} err - Error object (typically Axios error)
 * @param {string} fallback - Default fallback message
 * @returns {string} Safe error string ready for rendering
 */
export const getErrorMessage = (err, fallback = 'Terjadi kesalahan') => {
  if (!err) return fallback;

  const detail = err.response?.data?.detail;
  const message = err.response?.data?.message;

  if (detail !== undefined && detail !== null) {
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.msg) {
            const loc = Array.isArray(item.loc)
              ? item.loc.filter((l) => l !== 'body' && l !== 'query' && l !== 'path').join('.')
              : '';
            return loc ? `${loc}: ${item.msg}` : item.msg;
          }
          return JSON.stringify(item);
        })
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join(', ');
      }
    }
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return fallback;
};
