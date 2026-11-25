const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1/dashboard';
const HEALTH_URL = import.meta.env.VITE_HEALTH_URL || '/health';

/**
 * Error carrying the backend's standardized failure payload:
 *   400 { success:false, message, errors:[{ field, issue }] }
 *   404 / 500 { success:false, message }
 * status 0 means the request never reached the API.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isNetwork() {
    return this.status === 0;
  }

  get isValidation() {
    return this.status === 400 && this.fieldErrors.length > 0;
  }

  /** Field errors keyed by field name, first issue wins. */
  fieldMap() {
    return this.fieldErrors.reduce((map, { field, issue }) => {
      if (field && !map[field]) map[field] = issue;
      return map;
    }, {});
  }
}

async function request(path, { method = 'GET', body, signal, base = API_BASE } = {}) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (cause) {
    if (cause.name === 'AbortError') throw cause;
    throw new ApiError('Cannot reach the metrics API. Check that the backend is running on port 5000.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body, e.g. the dev proxy's own error page.
  }

  if (!response.ok || payload?.success === false) {
    const status = response.status;
    const message =
      payload?.message ||
      (status >= 500 ? 'The metrics API is unavailable right now.' : `Request failed (${status}).`);
    throw new ApiError(message, { status, fieldErrors: payload?.errors || [] });
  }

  return payload;
}

export const api = {
  listMetrics: ({ signal } = {}) => request('/metrics', { signal }),
  getMetric: (id) => request(`/metrics/${id}`),
  createMetric: (data) => request('/metrics', { method: 'POST', body: data }),
  updateMetric: (id, data) => request(`/metrics/${id}`, { method: 'PUT', body: data }),
  deleteMetric: (id) => request(`/metrics/${id}`, { method: 'DELETE' }),
  health: ({ signal } = {}) => request('', { base: HEALTH_URL, signal })
};
