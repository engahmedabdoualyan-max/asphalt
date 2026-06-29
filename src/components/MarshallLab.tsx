/* ============================================================
   MARSHALL LAB TEST — Full 5-specimen method
   CORRECTED per AASHTO T 245 / ASTM D6927 / AASHTO M 323 / MS-2

   References:
   • AASHTO T 245: Resistance to Plastic Flow of Bituminous 
     Mixtures Using Marshall Apparatus
   • ASTM D6927: Standard Test Method for Marshall Stability 
     and Flow of Bituminous Mixtures
   • AASHTO M 323: Superpave Volumetric Mix Design
   • AASHTO R 35: Superpave Volumetric Design for Asphalt Mixtures
   • Asphalt Institute MS-2: Mix Design Methods for Asphalt 
     Concrete and Other Hot-Mix Types (7th Ed.)

   Plots: Stability, Flow, Density, Vv, VMA, VFB vs AC%
   Determines OAC = (B1 + B2 + B3) / 3
============================================================ */

import { useMemo, useState } from "react";
import { MIX_CLASSES, type MixClass } from "../mixData";
import type { Dict } from "../i18n";

/* ────────────────────────────────────────────────────────────
   INTERFACES
   ──────────────────────────────────────────────────────────── */

interface Specimen {
  ac: number;           // Asphalt Content (% by mass of total mix)
  stability: number;    // Marshall Stability (N)
  flow: number;         // Marshall Flow (0.01 inch = 0.25 mm)
  bulkDensity: number;  // Gmb (Bulk Specific Gravity)
  theoDensity?: number; // Gmm (Theoretical Maximum Specific Gravity)
}

interface TrafficLevel {
  label: string;
  esalMin: number;      // Million ESALs
  esalMax: number;
  blows: number;        // Marshall blows per side
  minStability: number; // Newtons (N)
  flowMin: number;      // 0.01 inch
  flowMax: number;      // 0.01 inch
}

/* ────────────────────────────────────────────────────────────
   TRAFFIC LEVELS per AASHTO T 245 / ASTM D6927 / MS-2
   ──────────────────────────────────────────────────────────── */

const TRAFFIC_LEVELS: Record<string, TrafficLevel> = {
  LIGHT: {
    label: "Light Traffic",
    esalMin: 0,
    esalMax: 1e4,
    blows: 35,
    minStability: 2224,  // 500 lb
    flowMin: 8,
    flowMax: 20,
  },
  MEDIUM: {
    label: "Medium Traffic",
    esalMin: 1e4,
    esalMax: 1e6,
    blows: 50,
    minStability: 3336,  // 750 lb
    flowMin: 8,
    flowMax: 18,
  },
  HEAVY: {
    label: "Heavy Traffic",
    esalMin: 1e6,
    esalMax: Infinity,
    blows: 75,
    minStability: 6672,  // 1500 lb
    flowMin: 8,
    flowMax: 16,
  },
};

/* ────────────────────────────────────────────────────────────
   VOLUMETRIC CALCULATIONS per AASHTO R 35 / MS-2

   Air Voids (Va):     Va = 100 × (Gmm - Gmb) / Gmm
   VMA:                VMA = 100 - [(Gmb × Ps) / Gsb]
                         where Ps = percent aggregate = 100 - Pb
   VFB:                VFB = 100 × (VMA - Va) / VMA
   ──────────────────────────────────────────────────────────── */

/** Calculate Air Voids (Va) — AASHTO R 35 Eq. 2 */
function calcAirVoids(gmb: number, gmm: number): number {
  return ((gmm - gmb) / gmm) * 100;
}

/** Calculate VMA — AASHTO R 35 Eq. 3 / MS-2 Section 6.3 */
function calcVMA(gmb: number, ac: number, gsb: number): number {
  const ps = 100 - ac; // Percent aggregate by weight
  return 100 - ((gmb * ps) / gsb);
}

/** Calculate VFB — AASHTO R 35 Eq. 13 / MS-2 Section 6.3 */
function calcVFB(vma: number, va: number): number {
  return vma > 0 ? ((vma - va) / vma) * 100 : 0;
}

/** Calculate Bulk Specific Gravity of Aggregate (Gsb) from blend */
function calcGsb(
  aggregates: { gsb: number; percent: number }[]
): number {
  let numerator = 0;
  let denominator = 0;
  for (const agg of aggregates) {
    numerator += agg.percent;
    denominator += agg.percent / agg.gsb;
  }
  return numerator / denominator;
}

/* ────────────────────────────────────────────────────────────
   DEFAULT SPECIMENS (5 specimens per AASHTO T 245)
   Typically 3 specimens per asphalt content, 5 asphalt contents
   spanning expected OAC ± 0.5%
   ──────────────────────────────────────────────────────────── */

const DEFAULT_SPECIMENS: Specimen[] = [
  { ac: 3.5, stability: 8500,  flow: 12, bulkDensity: 2.28, theoDensity: 2.45 },
  { ac: 4.0, stability: 10500, flow: 14, bulkDensity: 2.32, theoDensity: 2.45 },
  { ac: 4.5, stability: 12800, flow: 16, bulkDensity: 2.35, theoDensity: 2.45 },
  { ac: 5.0, stability: 13500, flow: 18, bulkDensity: 2.37, theoDensity: 2.46 },
  { ac: 5.5, stability: 12200, flow: 21, bulkDensity: 2.36, theoDensity: 2.46 },
  { ac: 6.0, stability: 9800,  flow: 25, bulkDensity: 2.34, theoDensity: 2.47 },
];

/* ────────────────────────────────────────────────────────────
   GRADATION CONTROL POINTS per AASHTO M 323 Table 3
   For NMAS = 19.0 mm (0.75 inch)
   ──────────────────────────────────────────────────────────── */

const GRADATION_19MM: { sieve: number; minPass: number; maxPass: number }[] = [
  { sieve: 25.0,  minPass: 100, maxPass: 100 },
  { sieve: 19.0,  minPass: 90,  maxPass: 100 }, // ← CRITICAL CONTROL POINT
  { sieve: 12.5,  minPass: 0,   maxPass: 90 },
  { sieve: 9.5,   minPass: 0,   maxPass: 0 },   // No control specified
  { sieve: 4.75,  minPass: 0,   maxPass: 0 },   // No control specified
  { sieve: 2.36,  minPass: 23,  maxPass: 49 },  // Primary Control Sieve (PCS)
  { sieve: 0.075, minPass: 2,   maxPass: 8 },
];

/* ────────────────────────────────────────────────────────────
   MINIMUM VMA REQUIREMENTS per AASHTO M 323 / MS-2
   Table 2 / Section 6.3
   ──────────────────────────────────────────────────────────── */

function getMinVMA(nmas: number): number {
  if (nmas <= 4.75) return 16.0;
  if (nmas <= 9.5)  return 16.0;
  if (nmas <= 12.5) return 15.0;
  if (nmas <= 19.0) return 14.0;
  if (nmas <= 25.0) return 13.0;
  if (nmas <= 37.5) return 12.0;
  return 11.0;
}

/* ────────────────────────────────────────────────────────────
   VFB RANGE per AASHTO M 323 Table 6
   ──────────────────────────────────────────────────────────── */

function getVFBRanges(esalMillion: number): { min: number; max: number } {
  if (esalMillion < 0.3) return { min: 70, max: 80 };
  if (esalMillion < 3)   return { min: 65, max: 78 };
  return { min: 65, max: 75 };
}

/* ────────────────────────────────────────────────────────────
   MINI CHART COMPONENT (SVG)
   ──────────────────────────────────────────────────────────── */

function MiniChart({
  data,
  xRange,
  yRange,
  color,
  unit,
  thresholdLines,
  oacX,
}: {
  data: { x: number; y: number }[];
  xRange: [number, number];
  yRange: [number, number];
  color: string;
  unit: string;
  thresholdLines?: { y: number; label: string; color: string; dash?: boolean }[];
  oacX?: number;
}) {
  const W = 240, H = 140;
  const P = { t: 12, r: 12, b: 28, l: 42 };
  const iW = W - P.l - P.r;
  const iH = H - P.t - P.b;

  const xOf = (v: number) =>
    P.l + ((v - xRange[0]) / (xRange[1] - xRange[0])) * iW;
  const yOf = (v: number) =>
    P.t + (1 - (v - yRange[0]) / (yRange[1] - yRange[0])) * iH;

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(d.x).toFixed(1)} ${yOf(d.y).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" direction="ltr">
      {/* Background */}
      <rect
        x={P.l}
        y={P.t}
        width={iW}
        height={iH}
        fill="#0f172a"
        stroke="#334155"
        rx="2"
      />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={P.l}
          x2={P.l + iW}
          y1={P.t + iH * f}
          y2={P.t + iH * f}
          stroke="#1e293b"
          strokeWidth={0.5}
        />
      ))}

      {/* Threshold lines */}
      {thresholdLines?.map((tl, i) => (
        <g key={i}>
          <line
            x1={P.l}
            x2={P.l + iW}
            y1={yOf(tl.y)}
            y2={yOf(tl.y)}
            stroke={tl.color}
            strokeWidth={1}
            strokeDasharray={tl.dash ? "4 3" : "0"}
            opacity={0.6}
          />
          <text
            x={P.l + iW - 2}
            y={yOf(tl.y) - 3}
            fontSize="7"
            fill={tl.color}
            textAnchor="end"
            opacity={0.8}
          >
            {tl.label}
          </text>
        </g>
      ))}

      {/* OAC vertical line */}
      {oacX !== undefined && (
        <line
          x1={xOf(oacX)}
          x2={xOf(oacX)}
          y1={P.t}
          y2={P.t + iH}
          stroke="#fbbf24"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          opacity={0.7}
        />
      )}

      {/* Data path */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xOf(d.x)}
          cy={yOf(d.y)}
          r={3}
          fill={color}
          stroke="#0f172a"
          strokeWidth={1}
        />
      ))}

      {/* X-axis labels */}
      <text
        x={P.l - 4}
        y={H - 4}
        fontSize="8"
        fill="#94a3b8"
        textAnchor="end"
      >
        {xRange[0]}
      </text>
      <text
        x={P.l + iW}
        y={H - 4}
        fontSize="8"
        fill="#94a3b8"
        textAnchor="end"
      >
        {xRange[1]}
      </text>
      <text
        x={P.l + iW / 2}
        y={H - 1}
        fontSize="7"
        fill="#64748b"
        textAnchor="middle"
      >
        {unit}
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   UTILITY FUNCTIONS
   ──────────────────────────────────────────────────────────── */

function findPeak(data: { x: number; y: number }[]): number {
  let maxY = -Infinity;
  let peakX = data[0]?.x ?? 0;
  data.forEach((d) => {
    if (d.y > maxY) {
      maxY = d.y;
      peakX = d.x;
    }
  });
  return peakX;
}

function findXforY(
  data: { x: number; y: number }[],
  targetY: number
): number {
  for (let i = 0; i < data.length - 1; i++) {
    if (
      (data[i].y - targetY) * (data[i + 1].y - targetY) <= 0
    ) {
      const t =
        (targetY - data[i].y) /
        (data[i + 1].y - data[i].y || 1);
      return data[i].x + t * (data[i + 1].x - data[i].x);
    }
  }
  return data[Math.round(data.length / 2)]?.x ?? 0;
}

function linearInterpolate(
  x: number,
  x1: number,
  x2: number,
  y1: number,
  y2: number
): number {
  if (x2 === x1) return y1;
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
}

/* ────────────────────────────────────────────────────────────
   CURVE CARD COMPONENT
   ──────────────────────────────────────────────────────────── */

function CurveCard({
  title,
  color,
  data,
  xRange,
  thresholdLines,
  oacX,
}: {
  title: string;
  color: string;
  data: { x: number; y: number }[];
  xRange: [number, number];
  thresholdLines: {
    y: number;
    label: string;
    color: string;
    dash?: boolean;
  }[];
  oacX?: number;
}) {
  const yMin = Math.min(...data.map((d) => d.y));
  const yMax = Math.max(...data.map((d) => d.y));
  const pad = (yMax - yMin) * 0.2 || 1;
  const yRange: [number, number] = [yMin - pad, yMax + pad];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2">
      <div className="text-[11px] font-bold text-slate-200 mb-1 px-1">
        {title}
      </div>
      <MiniChart
        data={data}
        xRange={xRange}
        yRange={yRange}
        color={color}
        unit="AC %"
        thresholdLines={thresholdLines}
        oacX={oacX}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN MARSHALL LAB COMPONENT
   ──────────────────────────────────────────────────────────── */

export function MarshallLab({ t }: { t: Dict }) {
  const [specimens, setSpecimens] = useState<Specimen[]>(DEFAULT_SPECIMENS);
  const [mixClass] = useState<MixClass>("D");
  const [trafficLevel] = useState<keyof typeof TRAFFIC_LEVELS>("HEAVY");
  const [gsb] = useState<number>(2.65); // Bulk Specific Gravity of Aggregate
  const [esalMillion] = useState<number>(5); // Design ESALs in millions

  const def = MIX_CLASSES[mixClass];
  const traffic = TRAFFIC_LEVELS[trafficLevel];
  const sorted = useMemo(
    () => [...specimens].sort((a, b) => a.ac - b.ac),
    [specimens]
  );

  /* ── Volumetric Computations per AASHTO R 35 ── */
  const computed = useMemo(() => {
    return sorted.map((s) => {
      const gmm = s.theoDensity || 2.45;
      const va = calcAirVoids(s.bulkDensity, gmm);
      const vma = calcVMA(s.bulkDensity, s.ac, gsb);
      const vfb = calcVFB(vma, va);
      return { ...s, airVoids: va, vma, vfb };
    });
  }, [sorted, gsb]);

  const acValues = computed.map((c) => c.ac);
  const xRange: [number, number] = [
    Math.min(...acValues) - 0.3,
    Math.max(...acValues) + 0.3,
  ];

  /* ── OAC Determination per AASHTO T 245 / MS-2 ── */
  // B1 = Asphalt content at maximum bulk density (Gmb)
  const B1 = findPeak(
    computed.map((c) => ({ x: c.ac, y: c.bulkDensity }))
  );
  // B2 = Asphalt content at maximum stability
  const B2 = findPeak(
    computed.map((c) => ({ x: c.ac, y: c.stability }))
  );
  // B3 = Asphalt content at 4% air voids (median of 3-5% range)
  const B3 = findXforY(
    computed.map((c) => ({ x: c.ac, y: c.airVoids })),
    4.0
  );
  const OAC = (B1 + B2 + B3) / 3;

  /* ── Interpolate properties at OAC ── */
  const oacProps = useMemo(() => {
    const findAtAC = (ac: number, key: string): number => {
      const arr = computed as Record<string, number>[];
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i].ac <= ac && arr[i + 1].ac >= ac) {
          return linearInterpolate(
            ac,
            arr[i].ac,
            arr[i + 1].ac,
            arr[i][key],
            arr[i + 1][key]
          );
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

  /* ── Specification Limits per AASHTO T 245 / M 323 ── */
  const minStab = traffic.minStability; // Newtons (N)
  const minVMA = getMinVMA(def.nmas);
  const vfbRange = getVFBRanges(esalMillion);
  const flowMin = traffic.flowMin;
  const flowMax = traffic.flowMax;

  /* ── Pass/Fail Check ── */
  const pass =
    oacProps.stability >= minStab &&
    oacProps.flow >= flowMin &&
    oacProps.flow <= flowMax &&
    oacProps.airVoids >= 3 &&
    oacProps.airVoids <= 5 &&
    oacProps.vma >= minVMA &&
    oacProps.vfb >= vfbRange.min &&
    oacProps.vfb <= vfbRange.max;

  const updateSpec = (
    idx: number,
    field: keyof Specimen,
    value: number
  ) => {
    setSpecimens((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  /* ── Format stability for display ── */
  const formatStability = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)} kN` : `${n.toFixed(0)} N`;

  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════════════════
          OAC RESULT BANNER
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl">
        <div className="text-xs text-amber-300 uppercase tracking-widest mb-2">
          Optimum Asphalt Content (OAC)
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="text-5xl font-black text-amber-300">
              {OAC.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              OAC = (B₁ + B₂ + B₃) / 3 = ({B1.toFixed(2)} +{" "}
              {B2.toFixed(2)} + {B3.toFixed(2)}) / 3
            </div>
          </div>
          <div className="flex-1 min-w-[200px] grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-2">
              <div className="text-[9px] text-blue-300">
                B₁ (Max Density)
              </div>
              <div className="text-lg font-black text-blue-200">
                {B1.toFixed(2)}%
              </div>
            </div>
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-2">
              <div className="text-[9px] text-amber-300">
                B₂ (Max Stability)
              </div>
              <div className="text-lg font-black text-amber-200">
                {B2.toFixed(2)}%
              </div>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-2">
              <div className="text-[9px] text-emerald-300">
                B₃ (Va = 4%)
              </div>
              <div className="text-lg font-black text-emerald-200">
                {B3.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Level Badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            Traffic Level:
          </span>
          <span className="text-[10px] font-bold text-amber-300 bg-amber-900/30 px-2 py-0.5 rounded">
            {traffic.label} ({traffic.blows} blows/side)
          </span>
          <span className="text-[10px] text-slate-500">
            {formatStability(traffic.minStability)} min stability
          </span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          6 MARSHALL DESIGN CURVES
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-amber-300 mb-3">
          📊 Marshall Design Curves
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <CurveCard
            title={`Stability (N) — Min: ${formatStability(minStab)}`}
            color="#fbbf24"
            data={computed.map((c) => ({ x: c.ac, y: c.stability }))}
            xRange={xRange}
            thresholdLines={[
              {
                y: minStab,
                label: `Min: ${formatStability(minStab)}`,
                color: "#ef4444",
                dash: true,
              },
            ]}
            oacX={OAC}
          />
          <CurveCard
            title={`Flow (0.01″) — ${flowMin}-${flowMax}`}
            color="#a78bfa"
            data={computed.map((c) => ({ x: c.ac, y: c.flow }))}
            xRange={xRange}
            thresholdLines={[
              {
                y: flowMin,
                label: `Min: ${flowMin}`,
                color: "#ef4444",
                dash: true,
              },
              {
                y: flowMax,
                label: `Max: ${flowMax}`,
                color: "#ef4444",
                dash: true,
              },
            ]}
            oacX={OAC}
          />
          <CurveCard
            title="Bulk Density Gmb (g/cm³)"
            color="#34d399"
            data={computed.map((c) => ({ x: c.ac, y: c.bulkDensity }))}
            xRange={xRange}
            thresholdLines={[]}
            oacX={OAC}
          />
          <CurveCard
            title="Air Voids Va (%)"
            color="#f87171"
            data={computed.map((c) => ({ x: c.ac, y: c.airVoids }))}
            xRange={xRange}
            thresholdLines={[
              {
                y: 4,
                label: "Target: 4%",
                color: "#fbbf24",
                dash: true,
              },
              {
                y: 3,
                label: "Min: 3",
                color: "#ef4444",
                dash: true,
              },
              {
                y: 5,
                label: "Max: 5",
                color: "#ef4444",
                dash: true,
              },
            ]}
            oacX={OAC}
          />
          <CurveCard
            title={`VMA (%) — Min: ${minVMA}`}
            color="#38bdf8"
            data={computed.map((c) => ({ x: c.ac, y: c.vma }))}
            xRange={xRange}
            thresholdLines={[
              {
                y: minVMA,
                label: `Min: ${minVMA}`,
                color: "#ef4444",
                dash: true,
              },
            ]}
            oacX={OAC}
          />
          <CurveCard
            title={`VFB (%) — ${vfbRange.min}-${vfbRange.max}`}
            color="#fb923c"
            data={computed.map((c) => ({ x: c.ac, y: c.vfb }))}
            xRange={xRange}
            thresholdLines={[
              {
                y: vfbRange.min,
                label: `Min: ${vfbRange.min}`,
                color: "#ef4444",
                dash: true,
              },
              {
                y: vfbRange.max,
                label: `Max: ${vfbRange.max}`,
                color: "#ef4444",
                dash: true,
              },
            ]}
            oacX={OAC}
          />
        </div>

        {/* Reference Standards Footer */}
        <div className="mt-4 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Design Standards & References
          </div>
          <div className="text-[10px] text-slate-500 leading-relaxed">
            <span className="text-amber-400 font-semibold">AASHTO T 245</span>
            {" "}— Resistance to Plastic Flow of Bituminous Mixtures Using Marshall
            Apparatus |{" "}
            <span className="text-amber-400 font-semibold">ASTM D6927</span>
            {" "}— Standard Test Method for Marshall Stability and Flow |
            <span className="text-amber-400 font-semibold">AASHTO M 323</span>
            {" "}— Superpave Volumetric Mix Design |{" "}
            <span className="text-amber-400 font-semibold">AASHTO R 35</span>
            {" "}— Superpave Volumetric Design for Asphalt Mixtures |{" "}
            <span className="text-amber-400 font-semibold">MS-2</span>
            {" "}— Asphalt Institute Mix Design Methods (7th Ed.)
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SPECIMEN DATA TABLE
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-amber-300 mb-3">
          🔬 Specimen Test Data
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/70 text-amber-200">
                <th className="px-2 py-2 text-center">#</th>
                <th className="px-2 py-2 text-center">AC %</th>
                <th className="px-2 py-2 text-center">
                  Stability (N)
                </th>
                <th className="px-2 py-2 text-center">
                  Flow (0.01″)
                </th>
                <th className="px-2 py-2 text-center">Gmb</th>
                <th className="px-2 py-2 text-center">Gmm</th>
                <th className="px-2 py-2 text-center">Va %</th>
                <th className="px-2 py-2 text-center">VMA %</th>
                <th className="px-2 py-2 text-center">VFB %</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((c, i) => {
                const vaOk = c.airVoids >= 3 && c.airVoids <= 5;
                const isOAC = Math.abs(c.ac - OAC) < 0.06;
                return (
                  <tr
                    key={i}
                    className={`border-t border-slate-800 ${
                      isOAC
                        ? "bg-amber-500/10"
                        : i % 2 === 0
                        ? "bg-slate-900/30"
                        : ""
                    }`}
                  >
                    <td className="px-2 py-1.5 text-center text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step={0.1}
                        value={c.ac}
                        onChange={(e) =>
                          updateSpec(
                            i,
                            "ac",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-amber-200 font-mono text-[11px] focus:border-amber-400 outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step={10}
                        value={c.stability}
                        onChange={(e) =>
                          updateSpec(
                            i,
                            "stability",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step={0.5}
                        value={c.flow}
                        onChange={(e) =>
                          updateSpec(
                            i,
                            "flow",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step={0.01}
                        value={c.bulkDensity}
                        onChange={(e) =>
                          updateSpec(
                            i,
                            "bulkDensity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-18 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step={0.01}
                        value={c.theoDensity || 2.45}
                        onChange={(e) =>
                          updateSpec(
                            i,
                            "theoDensity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-18 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-slate-200 font-mono text-[11px] focus:border-amber-400 outline-none"
                      />
                    </td>
                    <td
                      className={`px-2 py-1.5 text-center font-mono font-bold ${
                        vaOk ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {c.airVoids.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-slate-300">
                      {c.vma.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-center font-mono font-bold text-slate-300">
                      {c.vfb.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-amber-500/10 border-t-2 border-amber-500/40">
                <td
                  className="px-2 py-2 text-amber-300 font-bold"
                  colSpan={2}
                >
                  OAC @ {OAC.toFixed(2)}%
                </td>
                <td
                  className={`px-2 py-2 text-center font-mono font-black ${
                    oacProps.stability >= minStab
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {formatStability(oacProps.stability)}
                </td>
                <td
                  className={`px-2 py-2 text-center font-mono font-black ${
                    oacProps.flow >= flowMin && oacProps.flow <= flowMax
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {oacProps.flow.toFixed(1)}
                </td>
                <td className="px-2 py-2 text-center font-mono font-black text-amber-200">
                  {oacProps.density.toFixed(3)}
                </td>
                <td className="px-2 py-2" />
                <td
                  className={`px-2 py-2 text-center font-mono font-black ${
                    oacProps.airVoids >= 3 && oacProps.airVoids <= 5
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {oacProps.airVoids.toFixed(2)}
                </td>
                <td
                  className={`px-2 py-2 text-center font-mono font-black ${
                    oacProps.vma >= minVMA
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {oacProps.vma.toFixed(2)}
                </td>
                <td
                  className={`px-2 py-2 text-center font-mono font-black ${
                    oacProps.vfb >= vfbRange.min &&
                    oacProps.vfb <= vfbRange.max
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {oacProps.vfb.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Specification Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
          <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50">
            <div className="text-slate-500">Stability (N)</div>
            <div className="text-amber-300 font-mono">
              ≥ {formatStability(minStab)}
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50">
            <div className="text-slate-500">Flow (0.01″)</div>
            <div className="text-amber-300 font-mono">
              {flowMin} – {flowMax}
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50">
            <div className="text-slate-500">Air Voids (%)</div>
            <div className="text-amber-300 font-mono">3.0 – 5.0</div>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50">
            <div className="text-slate-500">VMA / VFB</div>
            <div className="text-amber-300 font-mono">
              ≥ {minVMA}% / {vfbRange.min}-{vfbRange.max}%
            </div>
          </div>
        </div>

        {/* Pass/Fail Banner */}
        <div
          className={`mt-4 p-4 rounded-xl text-center font-bold border-2 ${
            pass
              ? "bg-emerald-500/10 border-emerald-500 text-emerald-300"
              : "bg-rose-500/10 border-rose-500 text-rose-300"
          }`}
        >
          {pass ? t.dymPass : t.dymFail}
        </div>

        <button
          onClick={() => setSpecimens(DEFAULT_SPECIMENS)}
          className="mt-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded transition"
        >
          ↻ Reset to defaults
        </button>
      </section>

      {/* ═══════════════════════════════════════════════════════
          GRADATION CONTROL POINTS (19mm NMAS)
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-amber-300 mb-3">
          📐 Gradation Control Points — NMAS 19.0 mm
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/70 text-amber-200">
                <th className="px-3 py-2 text-center">Sieve (mm)</th>
                <th className="px-3 py-2 text-center">Min Passing (%)</th>
                <th className="px-3 py-2 text-center">Max Passing (%)</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {GRADATION_19MM.map((row, i) => {
                const isCritical = row.sieve === 19.0;
                return (
                  <tr
                    key={i}
                    className={`border-t border-slate-800 ${
                      isCritical ? "bg-rose-500/5" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 text-center font-mono text-slate-300">
                      {row.sieve}
                    </td>
                    <td className="px-3 py-1.5 text-center font-mono text-emerald-300">
                      {row.minPass}%
                    </td>
                    <td className="px-3 py-1.5 text-center font-mono text-rose-300">
                      {row.maxPass}%
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {isCritical ? (
                        <span className="text-rose-400 font-bold text-[10px] bg-rose-900/20 px-2 py-0.5 rounded">
                          ⚠ CRITICAL CONTROL POINT
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">
                          Control Point
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[10px] text-slate-500">
          <span className="text-amber-400 font-semibold">Reference:</span>{" "}
          AASHTO M 323 Table 3 — Aggregate Gradation Control Points for 19.0 mm
          Nominal Maximum Aggregate Size
        </div>
      </section>
    </div>
  );
}
