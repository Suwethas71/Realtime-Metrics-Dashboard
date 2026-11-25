// Pure helpers shared by the SVG charts.

export function extent(values) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1;
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.12;
  return [min - pad, max + pad];
}

/** Round axis bounds and steps to 1, 2, 2.5 or 5 × 10^n so labels read cleanly. */
export function niceScale(min, max, count = 4) {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / (count - 1);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) || raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v / step) * step);
  return { lo, hi: hi === lo ? lo + step : hi, ticks };
}

export function timeTicks(start, end) {
  const span = end - start;
  if (span < 4000) return [start, end];
  return Array.from({ length: 4 }, (_, i) => start + (span * i) / 3);
}

/** Step path: a value holds until the next observed change, then to `endX`. */
export function stepPath(points, x, y, endX) {
  let d = `M${x(points[0].t)} ${y(points[0].v)}`;
  for (let i = 1; i < points.length; i += 1) d += ` H${x(points[i].t)} V${y(points[i].v)}`;
  return `${d} H${endX}`;
}
