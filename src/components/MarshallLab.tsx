/* ============================================================
   MARSHALL LAB TEST — Full 5-specimen method
   Plots: Stability, Flow, Density, Vv, VMA, VFB vs AC%
   Determines OAC = (B1 + B2 + B3) / 3
============================================================ */

import { useMemo, useState } from "react";
import { MIX_CLASSES, type MixClass } from "../mixData";
import type { Dict } from "../i18n";

interface Specimen {
  ac: number;
  stability: number;
  flow: number;
  bulkDensity: number;
  theoDensity?: number;
}

function calcVoids(bd: number, td: number) { return ((td - bd) / td) * 100; }
function calcVMA_simple(bd: number, td: number, ac: number) {
  const vv = calcVoids(bd, td);
  const gse = 2.65;
  const vb = (ac / 100) * (bd / gse) * 100;
  return vv + vb;
}
function calcVFB(vma: number, vv: number) { return vma > 0 ? ((vma - vv) / vma) * 100 : 0; }

const DEFAULT_SPECIMENS: Specimen[] = [
  { ac: 3.5, stability: 850, flow: 12, bulkDensity: 2.28, theoDensity: 2.45 },
  { ac: 4.0, stability: 1050, flow: 14, bulkDensity: 2.32, theoDensity: 2.45 },
  { ac: 4.5, stability: 1280, flow: 16, bulkDensity: 2.35, theoDensity: 2.45 },
  { ac: 5.0, stability: 1350, flow: 18, bulkDensity: 2.37, theoDensity: 2.46 },
  { ac: 5.5, stability: 1220, flow: 21, bulkDensity: 2.36, theoDensity: 2.46 },
  { ac: 6.0, stability: 980, flow: 25, bulkDensity: 2.34, theoDensity: 2.47 },
];

function MiniChart({
  data, xRange, yRange, color, unit, thresholdLines,
}: {
  data: { x: number; y: number }[];
  xRange: [number, number];
  yRange: [number, number];
  color: string;
  unit: string;
  thresholdLines?: { y: number; label: string; color: string; dash?: boolean }[];
}) {
  const W = 220, H = 120;
  const P = { t: 10, r: 10, b: 24, l: 36 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;
  const xOf = (v: number) => P.l + ((v - xRange[0]) / (xRange[1] - xRange[0])) * iW;
  const yOf = (v: number) => P.t + (1 - (v - yRange[0]) / (yRange[1] - yRange[0])) * iH;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(d.x).toFixed(1)} ${yOf(d.y).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" direction="ltr">
      <rect x={P.l} y={P.t} width={iW} height={iH} fill="#0f172a" stroke="#334155" rx="2" />
      {thresholdLines?.map((tl, i) => (
        <g key={i}>
          <line x1={P.l} x2={P.l + iW} y1={yOf(tl.y)} y2={yOf(tl.y)}
            stroke={tl.color} strokeWidth={1} strokeDasharray={tl.dash ? "4 3" : "0"} opacity={0.6} />
          <text x={P.l + iW - 2} y={yOf(tl.y) - 3} fontSize="7" fill={tl.color} textAnchor="end" opacity={0.8}>{tl.label}</text>
        </g>
      ))}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={P.l} x2={P.l + iW} y1={P.t + iH * f} y2={P.t + iH * f} stroke="#1e293b" strokeWidth={0.5} />
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={xOf(d.x)} cy={yOf(d.y)} r={3} fill={color} stroke="#0f172a" strokeWidth={1} />
      ))}
      <text x={P.l - 4} y={H - 4} fontSize="8" fill="#94a3b8" textAnchor="end">{xRange[0]}</text>
      <text x={P.l + iW} y={H - 4} fontSize="8" fill="#94a3b8" textAnchor="end">{xRange[1]}</text>
      <text x={P.l + iW / 2} y={H - 1} fontSize="7" fill="#64748b" textAnchor="middle">{unit}</text>
    </svg>
  );
}

function findPeak(data: { x: number; y: number }[]): number {
  let maxY = -Infinity, peakX = data[0]?.x ?? 0;
  data.forEach(d => { if (d.y > maxY) { maxY = d.y; peakX = d.x; } });
  return peakX;
}

function findXforY(data: { x: number; y: number }[], targetY: number): number {
  for (let i = 0; i < data.length - 1; i++) {
    if ((data[i].y - targetY) * (data[i + 1].y - targetY) <= 0) {
      const t = (targetY - data[i].y) / (data[i + 1].y - data[i].y || 1);
      return data[i].x + t * (data[i + 1].x - data[i].x);
    }
  }
  return data[Math.round(data.length / 2)]?.x ?? 0;
}

export function MarshallLab({ t }: { t: Dict }) {
  const [specimens, setSpecimens] = useState<Specimen[]>(DEFAULT_SPECIMENS);
  const [mixClass] = useState<MixClass>("D");

  const def = MIX_CLASSES[mixClass];
  const sorted = useMemo(() => [...specimens].sort((a, b) => a.ac - b.ac), [specimens]);

  const computed = useMemo(() => {
    return sorted.map(s => {
      const td = s.theoDensity || 2.45;
      const vv = calcVoids(s.bulkDensity, td);
      const vma = calcVMA_simple(s.bulkDensity, td, s.ac);
      const vfb = calcVFB(vma, vv);
      return { ...s, airVoids: vv, vma, vfb };
    });
  }, [sorted]);

  const acValues = computed.map(c => c.ac);
  const xRange: [number, number] = [Math.min(...acValues) - 0.3, Math.max(...acValues) + 0.3];

  const B1 = findPeak(computed.map(c => ({ x: c.ac, y: c.bulkDensity })));
  const B2 = findPeak(computed.map(c => ({ x: c.ac, y: c.stability })));
  const B3 = findXforY(computed.map(c => ({ x: c.ac, y: c.airVoids })), 4.0);
  const OAC = (B1 + B2 + B3) / 3;

  const oacProps = useMemo(() => {
    const findAtAC = (ac: number, key: string) => {
      const arr = computed as Record<string, number>[];
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i].ac <= ac && arr[i + 1].ac >= ac) {
          const t = (ac - arr[i].ac) / (arr[i + 1].ac - arr[i].ac || 1);
          return arr[i][key] + t * (arr[i + 1][key] - arr[i][key]);
        }
      }
      return arr[0]?.[key] ?? 0;
    };
    return {
      stability: findAtAC(OAC, "stability"),
      flow: findAtAC(OAC, "flow"),
      airVoids: findAtAC(OAC, "airVoids"),
      vma: findAtAC(OAC, "vma"),
      vfb: findAtAC(OAC, "vfb"),
      density: findAtAC(OAC, "bulkDensity"),
    };
  }, [computed, OAC]);

  const minStab = mixClass === "A" || mixClass === "B" ? 900 : 800;
  const minVMA = def.nmas <= 12.5 ? 14 : def.nmas <= 19 ? 13 : def.nmas <= 25 ? 12 : 11;
  const pass = oacProps.stability >= minStab &&
    oacProps.flow >= 8 && oacProps.flow <= 16 &&
    oacProps.airVoids >= 3 && oacProps.airVoids <= 5 &&
    oacProps.vma >= minVMA &&
    oacProps.vfb >= 65 && oacProps.vfb <= 78;

  const updateSpec = (idx: number, field: keyof Specimen, value: number) => {
    setSpecimens(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-5">
      {/* OAC Result banner */}
      <section className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl">
        <div className="text-xs text-amber-300 uppercase tracking-widest mb-2">Optimum Asphalt Content (OAC)</div>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="text-5xl font-black text-amber-300">{OAC.toFixed(2)}%</div>
            <div className="text-[11px] text-slate-400 mt-1">
              OAC = (B₁ + B₂ + B₃) / 3 = ({B1.toFixed(2)} + {B2.toFixed(2)} + {B3.toFixed(2)}) / 3
            </div>
          </div>
          <div className="flex-1 min-w-[200px] grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-2">
              <div className="text-[9px] text-blue-300">B₁ (Max Density)</div>
              <div className="text-lg font-black text-blue-200">{B1.toFixed(2)}%</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-2">
              <div className="text-[9px] text-amber-300">B₂ (Max Stability)</div>
              <div className="text-lg font-black text-amber-200">{B2.toFixed(2)}%</div>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-2">
              <div className="text-[9px] text-emerald-300">B₃ (Vv = 4%)</div>
              <div className="text-lg font-black text-emerald-200">{B3.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Marshall curves grid */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-amber-300 mb-3">📊 Marshall Design Curves</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <CurveCard title="Stability (kg)" color="#fbbf24"
            data={computed.map(c => ({ x: c.ac, y: c.stability }))}
            xRange={xRange}
            thresholdLines={[{ y: minStab, label: `Min: ${minStab}`, color: "#ef4444", dash: true }]} />
          <CurveCard title="Flow (0.01 in)" color="#a78bfa"
            data={computed.map(c => ({ x: c.ac, y: c.flow }))}
            xRange={xRange}
            thresholdLines={[
              { y: 8, label: "Min: 8", color: "#ef4444", dash: true },
              { y: 16, label: "Max: 16", color: "#ef4444", dash: true },
            ]} />
          <CurveCard title="Bulk Density (g/cm³)" color="#34d399"
            data={computed.map(c => ({ x: c.ac, y: c.bulkDensity }))}
            xRange={xRange} thresholdLines={[]} />
          <CurveCard title="Air Voids Vv (%)" color="#f87171"
            data={computed.map(c => ({ x: c.ac, y: c.airVoids }))}
            xRange={xRange}
            thresholdLines={[
              { y: 4, label: "Target: 4%", color: "#fbbf24", dash: true },
              { y: 3, label: "Min: 3", color: "#ef4444", dash: true },
              { y: 5, label: "Max: 5", color: "#ef4444", dash: true },
            ]} />
          <CurveCard title="VMA (%)" color="#38bdf8"
            data={computed.map(c => ({ x: c.ac, y: c.vma }))}
            xRange={xRange}
            thresholdLines={[{ y: minVMA, label: `Min: ${minVMA}`, color: "#ef4444", dash: true }]} />
          <CurveCard title="VFB (%)" color="#fb923c"
            data={computed.map(c => ({ x: c.ac, y: c.vfb }))}
            xRange={xRange}
            thresholdLines={[
              { y: 65, label: "Min: 65", color: "#ef4444", dash: true },
              { y: 78, label: "Max: 78", color: "#ef4444", dash: true },
            ]} />
        </div>
      </section>

      {/* Specimen data table */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-amber-300 mb-3">🔬 Specimen Test Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/70 text-amber-200">
                <th className="px-2 py-2 text-center">#</th>
                <th className="px-2 py-2 text-center">AC %</th>
                <th className="px-2 py-2 text-center">Stability (kg)</th>
                <th className="px-2 py-2 text-center">Flow (0.01")</th>
                <th className="px-2 py-2 text-center">Gmb</th>
                <th className="px-2 py-2 text-center">Gmm</th>
                <th className="px-2 py-2 text-center">Vv %</th>
                <th className="px-2 py-2 text-center">VMA %</th>
                <th className="px-2 py-2 text-center">VFB %</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((c, i) => {
                const vvOk = c.airVoids >= 3 && c.airVoids <= 5;
                const isOAC = Math.abs(c.ac - OAC) < 0.06;
                return (
                  <tr key={i} className={`border-t border-slate-800 ${isOAC ? "bg-amber-500/10" : i % 2 === 0 ? "bg-slate-900/30" : ""}`}>
                    <td className="px-2 py-1.5 text-center text-slate-400">{i + 1}</td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="number" step={0.1} value={c.ac}
                        onChange={(e) => updateSpec(i, "ac", parseFloat(e.target.value) || 0)}
                        className="w-16 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-amber-200 font-mono text-[11px] focus:border-amber-400 outline-none" />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="number" step={10} value={c.stability}
                        onChange={(e) => updateSpec(i, "stability", parseFloat(e.target.value) || 0)}
                        className="w-18 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none" />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="number" step={0.5} value={c.flow}
                        onChange={(e) => updateSpec(i, "flow", parseFloat(e.target.value) || 0)}
                        className="w-16 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none" />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="number" step={0.01} value={c.bulkDensity}
                        onChange={(e) => updateSpec(i, "bulkDensity", parseFloat(e.target.value) || 0)}
                        className="w-18 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none" />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="number" step={0.01} value={c.theoDensity || 2.45}
                        onChange={(e) => updateSpec(i, "theoDensity", parseFloat(e.target.value) || 0)}
                        className="w-18 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none" />
                    </td>
                    <td className={`px-2 py-1.5 text-center font-mono font-bold ${vvOk ? "text-emerald-300" : "text-rose-300"}`}>
                      {c.airVoids.toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-slate-300">
                      {c.vma.toFixed(1)}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-slate-300">
                      {c.vfb.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-amber-500/10 border-t-2 border-amber-500/40">
                <td className="px-2 py-2 text-amber-300 font-bold" colSpan={2}>OAC @ {OAC.toFixed(2)}%</td>
                <td className="px-2 py-2 text-center font-mono font-black text-amber-200">{oacProps.stability.toFixed(0)}</td>
                <td className="px-2 py-2 text-center font-mono font-black text-amber-200">{oacProps.flow.toFixed(1)}</td>
                <td className="px-2 py-2 text-center font-mono font-black text-amber-200">{oacProps.density.toFixed(3)}</td>
                <td className="px-2 py-2" />
                <td className={`px-2 py-2 text-center font-mono font-black ${oacProps.airVoids >= 3 && oacProps.airVoids <= 5 ? "text-emerald-300" : "text-rose-300"}`}>
                  {oacProps.airVoids.toFixed(1)}
                </td>
                <td className={`px-2 py-2 text-center font-mono font-black ${oacProps.vma >= minVMA ? "text-emerald-300" : "text-rose-300"}`}>
                  {oacProps.vma.toFixed(1)}
                </td>
                <td className={`px-2 py-2 text-center font-mono font-black ${oacProps.vfb >= 65 && oacProps.vfb <= 78 ? "text-emerald-300" : "text-rose-300"}`}>
                  {oacProps.vfb.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={`mt-4 p-4 rounded-xl text-center font-bold border-2 ${
          pass ? "bg-emerald-500/10 border-emerald-500 text-emerald-300" : "bg-rose-500/10 border-rose-500 text-rose-300"
        }`}>
          {pass ? t.dymPass : t.dymFail}
        </div>

        <button onClick={() => setSpecimens(DEFAULT_SPECIMENS)}
          className="mt-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded transition">
          ↻ Reset to defaults
        </button>
      </section>
    </div>
  );
}

function CurveCard({
  title, color, data, xRange, thresholdLines,
}: {
  title: string; color: string;
  data: { x: number; y: number }[];
  xRange: [number, number];
  thresholdLines: { y: number; label: string; color: string; dash?: boolean }[];
}) {
  const yMin = Math.min(...data.map(d => d.y));
  const yMax = Math.max(...data.map(d => d.y));
  const pad = (yMax - yMin) * 0.2 || 1;
  const yRange: [number, number] = [yMin - pad, yMax + pad];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2">
      <div className="text-[11px] font-bold text-slate-200 mb-1 px-1">{title}</div>
      <MiniChart data={data} xRange={xRange} yRange={yRange} color={color} unit="AC %" thresholdLines={thresholdLines} />
    </div>
  );
}
