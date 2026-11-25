import { CATEGORIES, STATUSES, TITLE_MAX, TITLE_MIN } from './constants';

// Client-side checks that mirror the express-validator rules. The messages
// match the backend's wording so both sources read the same in the form.
export function validateMetric(form) {
  const errors = {};
  const title = form.title.trim();

  if (!title) errors.title = 'Title is required';
  else if (title.length < TITLE_MIN || title.length > TITLE_MAX)
    errors.title = `Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`;

  const rawValue = String(form.value).trim();
  if (rawValue === '') errors.value = 'Value is required';
  else if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(rawValue)) errors.value = 'Value must be a valid numeric value';

  if (!form.category) errors.category = 'Category is required';
  else if (!CATEGORIES.includes(form.category))
    errors.category = `Category must be one of: ${CATEGORIES.join(', ')}`;

  if (form.status && !STATUSES.includes(form.status))
    errors.status = `Status must be one of: ${STATUSES.join(', ')}`;

  return errors;
}

// Builds the request body. Numeric strings are sent as numbers; anything else
// is sent as typed so the API's own validation can answer it.
export function toPayload(form) {
  const rawValue = String(form.value).trim();
  const numeric = rawValue !== '' && !Number.isNaN(Number(rawValue));
  const payload = {
    title: form.title,
    value: numeric ? Number(rawValue) : rawValue,
    category: form.category
  };
  if (form.status) payload.status = form.status;
  return payload;
}
