import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

export const normalizeDateForDateInput = (value) => {
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return '';
  }

  const text = String(value).trim();
  if (!text) return '';

  const datePrefix = text.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/);
  if (datePrefix && dayjs(datePrefix[1], 'YYYY-MM-DD', true).isValid()) {
    return datePrefix[1];
  }

  const parsed = dayjs(text, [
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'YYYY.MM.DD',
    'DD-MM-YYYY',
    'DD/MM/YYYY',
    'DD.MM.YYYY',
    'MM-DD-YYYY',
    'MM/DD/YYYY',
    'MM.DD.YYYY'
  ], true);

  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }

  const fallback = dayjs(text);
  return fallback.isValid() ? fallback.format('YYYY-MM-DD') : '';
};
