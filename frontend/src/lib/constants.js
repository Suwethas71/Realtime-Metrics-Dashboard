// Mirrors backend/src/validators/dashboard.validator.js. The backend compares
// case-sensitively, so values are always sent in uppercase.
export const CATEGORIES = ['SALES', 'TRAFFIC', 'SYSTEM', 'REVENUE'];
export const STATUSES = ['ACTIVE', 'WARNING', 'CRITICAL'];

export const TITLE_MIN = 3;
export const TITLE_MAX = 50;

export const CATEGORY_META = {
  SALES: { label: 'Sales', color: 'var(--cat-sales)' },
  TRAFFIC: { label: 'Traffic', color: 'var(--cat-traffic)' },
  SYSTEM: { label: 'System', color: 'var(--cat-system)' },
  REVENUE: { label: 'Revenue', color: 'var(--cat-revenue)' }
};

export const STATUS_META = {
  ACTIVE: { label: 'Active', tone: 'active' },
  WARNING: { label: 'Warning', tone: 'warning' },
  CRITICAL: { label: 'Critical', tone: 'critical' }
};

// Most severe first: used for sorting and for the dashboard's attention list.
export const STATUS_RANK = { CRITICAL: 0, WARNING: 1, ACTIVE: 2 };

export const POLL_OPTIONS = [
  { value: 2000, label: '2s' },
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' }
];

export const DEFAULT_POLL_MS = 2000;
export const HISTORY_LIMIT = 60;
export const ACTIVITY_LIMIT = 80;
