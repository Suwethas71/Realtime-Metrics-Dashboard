const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

export function formatValue(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return numberFormat.format(value);
}

export function formatCompact(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return Math.abs(value) >= 100000 ? compactFormat.format(value) : numberFormat.format(value);
}

export function formatDelta(delta) {
  if (!delta) return '0';
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${numberFormat.format(Math.abs(delta))}`;
}

export function percentChange(from, to) {
  if (!from) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

export function relativeTime(iso, now = Date.now()) {
  const time = typeof iso === 'number' ? iso : Date.parse(iso);
  if (Number.isNaN(time)) return '—';
  const seconds = Math.round((now - time) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function clockTime(ms) {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function fullDate(iso) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  return new Date(time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
