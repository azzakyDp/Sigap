/**
 * Formatting utilities for dates and API values
 */

export const formatDate = (value, options = {}) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const { month = 'short' } = options || {};
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month,
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return String(value);
  }
};

/**
 * Converts a datetime-local input string or Date object to ISO string format for API payload
 */
export const toApiDateTime = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch (e) {
    return value;
  }
};
