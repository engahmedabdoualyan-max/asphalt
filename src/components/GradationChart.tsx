import { SIEVES } from "../mixData";
import type { Dict } from "../i18n";

export function GradationChart({
  combined,
  spec,
  t,
}: {
  combined: number[];
  spec: { low: number[]; high: number[] };
  t: Dict;
}) {
  const W = 560;
  const H = 420;
  const PAD = { top: 18, right: 18, bottom: 56, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const logMin = Math.log10(0.075);
  const logMax = Math.log10(37.5);
  const xOf = (mm: number) =>
    PAD.left + ((Math.log10(mm) - logMin) / (logMax - logMin)) * innerW;
  const yOf = (pct: number) => PAD.top + (1 - pct / 100) * innerH;

  const pathFrom = (vals: number[]) =>
    SIEVES.map(
      (s, i) => `${i === 0 ? "M" : "L"} ${xOf(s).toFixed(1)} ${yOf(vals[i]).toFixed(1)}`
    ).join(" ");

  const areaPath = [
    ...SIEVES.map(
      (s, i) => `${i === 0 ? "M" : "L"} ${xOf(s).toFixed(1)} ${yOf(spec.high[i]).toFixed(1)}`
    ),
    ...[...SIEVES].reverse().map((s, i) => {
      const idx = SIEVES.length - 1 - i;
      return `L ${xOf(s).toFixed(1)} ${yOf(spec.low[idx]).toFixed(1)}`;
    }),
    "Z",
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" direction="ltr">
      <defs>
        <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill="#0f172a" stroke="#334155" />
      {[0, 20, 40, 60, 80, 100].map((p) => (
        <g key={p}>
          <line x1={PAD.left} x2={PAD.left + innerW} y1={yOf(p)} y2={yOf(p)} stroke="#1e293b" strokeWidth={1} />
          <text x={PAD.left - 6} y={yOf(p) + 4} fontSize="10" fill="#94a3b8" textAnchor="end">{p}%</text>
        </g>
      ))}
      {SIEVES.map((s) => (
        <g key={s}>
          <line x1={xOf(s)} x2={xOf(s)} y1={PAD.top} y2={PAD.top + innerH} stroke="#1e293b" strokeWidth={1} />
          <text x={xOf(s)} y={PAD.top + innerH + 14} fontSize="9" fill="#94a3b8" textAnchor="middle">{s}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#specGrad)" stroke="none" />
      <path d={pathFrom(spec.high)} fill="none" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={pathFrom(spec.low)} fill="none" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={pathFrom(combined)} fill="none" stroke="#fbbf24" strokeWidth={2.5} />
      {SIEVES.map((s, i) => (
        <circle key={s} cx={xOf(s)} cy={yOf(combined[i])} r={3.5} fill="#fbbf24" stroke="#0f172a" strokeWidth={1} />
      ))}
      <text x={PAD.left + innerW / 2} y={H - 14} fontSize="11" fill="#cbd5e1" textAnchor="middle">{t.axisX}</text>
      <text x={-(PAD.top + innerH / 2)} y={14} fontSize="11" fill="#cbd5e1" textAnchor="middle" transform="rotate(-90)">{t.axisY}</text>
      <g transform={`translate(${PAD.left + 12}, ${PAD.top + 10})`}>
        <rect width="180" height="50" fill="#0b1220" stroke="#334155" rx="4" />
        <line x1="10" y1="18" x2="32" y2="18" stroke="#fbbf24" strokeWidth="2.5" />
        <text x="38" y="22" fontSize="10" fill="#fbbf24">{t.legendCurve}</text>
        <line x1="10" y1="36" x2="32" y2="36" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="38" y="40" fontSize="10" fill="#10b981">{t.legendSpec}</text>
      </g>
    </svg>
  );
}
