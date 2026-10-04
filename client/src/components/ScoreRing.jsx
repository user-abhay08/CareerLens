export default function ScoreRing({ score, max = 100, label, size = 120 }) {
  const pct = Math.max(0, Math.min(1, score / max));
  const r = 45;
  const circ = 2 * Math.PI * r;
  const color = pct >= 0.75 ? '#059669' : pct >= 0.5 ? '#4f46e5' : pct >= 0.3 ? '#d97706' : '#e11d48';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 110 110" className="-rotate-90">
          <circle cx="55" cy="55" r={r} stroke="currentColor" className="text-slate-100" strokeWidth="9" fill="none" />
          <circle
            cx="55"
            cy="55"
            r={r}
            stroke={color}
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 700ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-extrabold" style={{ color }}>
            {score}
            <span className="text-sm font-semibold text-slate-400">/{max}</span>
          </div>
        </div>
      </div>
      {label && <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>}
    </div>
  );
}
