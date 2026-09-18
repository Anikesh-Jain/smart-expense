/**
 * Safe date formatting utilities to prevent "Invalid Date" or broken date strings.
 */

export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const formatShortDate = (dateStr) => {
  if (!isValidDate(dateStr)) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
};

export const formatFullDate = (dateStr) => {
  if (!isValidDate(dateStr)) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!isValidDate(dateStr)) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
