import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

export const normalizeDateForDateInput = (value) => {
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return '';
  }

  const text = String(value).trim();
  if (!text) return '';

  const parsed = dayjs(text, [
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'YYYY.MM.DD',
    'DD-MM-YYYY',
    'DD/MM/YYYY',
    'DD.MM.YYYY',
    'MM-DD-YYYY',
    'MM/DD/YYYY',
    'MM.DD.YYYY',
    'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss.SSS'
  ], true);

  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }

  const fallback = dayjs(text);
  return fallback.isValid() ? fallback.format('YYYY-MM-DD') : '';
};
