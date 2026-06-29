/* ============================================================
   SPC (Statistical Process Control) Charts
   X-bar and R charts for gradation, bitumen content, stability
============================================================ */

import { useMemo } from "react";
import type { Dict } from "../i18n";

interface SPCTarget { label: string; nominal: number; ucl: number; lcl: number; unit: string; }

const DEFAULT_TARGETS: SPCTarget[] = [
  { label: "% Passing 4.75mm", nominal: 55, ucl: 65, lcl: 45, unit: "%" },
  { label: "% Passing 2.36mm", nominal: 38, ucl: 48, lcl: 28, unit: "%" },
  { label: "% Passing 0.075mm", nominal: 6, ucl: 10, lcl: 4, unit: "%" },
  { label: "Bitumen Content", nominal: 5.2, ucl: 5.8, lcl: 4.6, unit: "%" },
  { label: "Marshall Stability", nominal: 1200, ucl: 1500, lcl: 800, unit: "kg" },
  { label: "Bulk Density", nominal: 2.36, ucl: 2.42, lcl: 2.28, unit: "g/cm³" },
];

function generateSimData(nominal: number, range: number, n: number): number[] {
  return Array.from({ length: n }, () => nominal + (Math.random() - 0.5) * range);
}

function SPCTargetChart({
  target, data, color,
}: {
  target: SPCTarget; data: number[]; color: string;
}) {
  const W = 320, H = 160;
  const P = { t: 10, r: 10, b: 22, l: 40 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;

  const allVals = [...data, target.ucl, target.lcl, target.nominal];
  const yMin = Math.min(...allVals) - (target.ucl - target.lcl) * 0.15;
  const yMax = Math.max(...allVals) + (target.ucl - target.lcl) * 0.15;

  const xOf = (i: number) => P.l + (i / (data.length - 1 || 1)) * iW;
  const yOf = (v: number) => P.t + (1 - (v - yMin) / (yMax - yMin)) * iH;

  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2">
      <div className="text-[11px] font-bold text-slate-200 mb-1 px-1">{target.label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" direction="ltr">
        <rect x={P.l} y={P.t} width={iW} height={iH} fill="#0f172a" stroke="#334155" rx="2" />
        {/* UCL */}
        <line x1={P.l} x2={P.l + iW} y1={yOf(target.ucl)} y2={yOf(target.ucl)} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
        <text x={P.l + iW + 2} y={yOf(target.ucl) + 3} fontSize="7" fill="#ef4444" opacity={0.8}>UCL</text>
        {/* LCL */}
        <line x1={P.l} x2={P.l + iW} y1={yOf(target.lcl)} y2={yOf(target.lcl)} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
        <text x={P.l + iW + 2} y={yOf(target.lcl) + 3} fontSize="7" fill="#ef4444" opacity={0.8}>LCL</text>
        {/* Nominal */}
        <line x1={P.l} x2={P.l + iW} y1={yOf(target.nominal)} y2={yOf(target.nominal)} stroke="#10b981" strokeWidth={1.5} opacity={0.6} />
        <text x={P.l + iW + 2} y={yOf(target.nominal) + 3} fontSize="7" fill="#10b981" opacity={0.8}>Nom</text>
        {/* Warning zone shading */}
        <rect x={P.l} y={yOf(target.ucl)} width={iW} height={yOf(target.nominal) - yOf(target.ucl)}
          fill="#fbbf24" opacity={0.05} />
        <rect x={P.l} y={yOf(target.nominal)} width={iW} height={yOf(target.lcl) - yOf(target.nominal)}
          fill="#fbbf24" opacity={0.05} />
        {/* Data line */}
        <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
        {data.map((v, i) => {
          const outOfSpec = v > target.ucl || v < target.lcl;
          return (
            <circle key={i} cx={xOf(i)} cy={yOf(v)} r={2.5}
              fill={outOfSpec ? "#ef4444" : color} stroke="#0f172a" strokeWidth={0.5} />
          );
        })}
      </svg>
    </div>
  );
}

export function SPCCharts(_props: { t: Dict }) {
  const N = 25;

  const allData = useMemo(() => {
    return DEFAULT_TARGETS.map(tgt => {
      const range = (tgt.ucl - tgt.lcl) * 0.7;
      return generateSimData(tgt.nominal, range, N);
    });
  }, []);

  const outOfSpecCount = useMemo(() => {
    return allData.reduce((sum, data, ti) => {
      return sum + data.filter(v => v > DEFAULT_TARGETS[ti].ucl || v < DEFAULT_TARGETS[ti].lcl).length;
    }, 0);
  }, [allData]);

  const totalPoints = allData.reduce((s, d) => s + d.length, 0);
  const cpkEstimate = useMemo(() => {
    // Simulated Cpk
    return +(1.2 + Math.random() * 0.6).toFixed(2);
  }, []);

  const colors = ["#fbbf24", "#a78bfa", "#f87171", "#34d399", "#38bdf8", "#fb923c"];

  return (
    <div className="space-y-5">
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-base font-bold text-amber-300">📈 SPC — Statistical Process Control</h2>
          <div className="flex gap-3 text-xs">
            <span className={`px-2 py-1 rounded-full ${cpkEstimate >= 1.33 ? "bg-emerald-500/20 text-emerald-300" : cpkEstimate >= 1.0 ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"}`}>
              Cpk: {cpkEstimate}
            </span>
            <span className="px-2 py-1 rounded-full bg-rose-500/20 text-rose-300">
              OOC: {outOfSpecCount}/{totalPoints}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {DEFAULT_TARGETS.map((tgt, i) => (
            <SPCTargetChart key={i} target={tgt} data={allData[i]} color={colors[i]} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
            <div className="text-emerald-300 font-bold">Within Limits</div>
            <div className="text-lg font-black text-emerald-200">{totalPoints - outOfSpecCount}</div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">
            <div className="text-rose-300 font-bold">Out of Control</div>
            <div className="text-lg font-black text-rose-200">{outOfSpecCount}</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
            <div className="text-blue-300 font-bold">Process Yield</div>
            <div className="text-lg font-black text-blue-200">{(((totalPoints - outOfSpecCount) / totalPoints) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </section>
    </div>
  );
}
