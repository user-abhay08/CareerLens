export function asString(v, fallback = '') {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : fallback;
}

export function asArray(v) {
  return Array.isArray(v) ? v : [];
}

export function asStringArray(v, max = 12) {
  return asArray(v)
    .map((x) => asString(x))
    .filter(Boolean)
    .slice(0, max);
}

export function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
