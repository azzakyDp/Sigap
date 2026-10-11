/**
 * Formatting utilities for dates and API values
 */

export const formatDate = (value, options = {}) => {
  if (!value) return '-';
  try {
    let dateStr = value;
    // Jika ISO string tanpa penanda timezone (contoh "2026-10-11T08:44:00" dari database),
    // tambahkan 'Z' agar dibaca sebagai UTC dan dikonversi dengan tepat ke timezone lokal pengguna (WIB).
    if (
      typeof dateStr === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateStr) &&
      !dateStr.endsWith('Z') &&
      !/[+-]\d{2}:\d{2}$/.test(dateStr)
    ) {
      dateStr = `${dateStr}Z`;
    }
    const date = new Date(dateStr);
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
