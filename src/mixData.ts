/* ============================================================
   Marshall Mix Design Data — Classes A, B, C, D
   Quality-control reference set for guidance only.

   References used for equations and limits:
   - AASHTO T 245: Marshall stability and flow procedure
   - AASHTO T 27 / T 11: sieve analysis and material finer than No. 200
   - Asphalt Institute MS-2: Marshall volumetric criteria
   - ECP 104 / Saudi MOC-MOMRA project specifications: JMF control style

   Final production values must always be replaced by the approved JMF.
============================================================ */

export type MixClass = "A" | "B" | "C" | "D";
export type LayerType = "wearing" | "binder" | "base";
export type AggKey = "a4" | "a3" | "a2" | "a1" | "ns" | "fl";

/* Standard sieves (mm) */
export const SIEVES = [37.5, 25, 19, 12.5, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075];

export interface MixClassDef {
  code: MixClass;
  nmas: number;          // nominal max aggregate size (mm)
  layer: LayerType;
  bitumen: [number, number];
  bitumenDefault: number;
  /* Default aggregate proportions (%) — must sum to 100 */
  aggregates: { key: AggKey; pct: number }[];
  /* Spec envelope: low / high % passing for each sieve */
  specLow: number[];
  specHigh: number[];
}

/* ---------- Component (stockpile) typical gradations ---------- */
export const COMPONENT_GRADATION: Record<AggKey, number[]> = {
  // bin 4: 1.5"-1"
  a4: [100, 92, 55, 12, 3, 1, 0, 0, 0, 0, 0, 0],
  // bin 3: 3/4"-3/8"
  a3: [100, 100, 98, 78, 30, 4, 1, 0, 0, 0, 0, 0],
  // bin 2: 3/8"-#4
  a2: [100, 100, 100, 100, 92, 28, 6, 2, 1, 0, 0, 0],
  // bin 1: crusher sand <#4
  a1: [100, 100, 100, 100, 100, 96, 72, 52, 36, 22, 12, 6],
  // natural / dune sand
  ns: [100, 100, 100, 100, 100, 99, 92, 76, 56, 30, 10, 3],
  // mineral filler
  fl: [100, 100, 100, 100, 100, 100, 100, 100, 100, 98, 92, 82],
};

/* ---------- Mix Class definitions ---------- */
export const MIX_CLASSES: Record<MixClass, MixClassDef> = {
  /* CLASS A — Heavy traffic asphalt base, NMAS 37.5 mm */
  A: {
    code: "A",
    nmas: 37.5,
    layer: "base",
    bitumen: [3.2, 4.5],
    bitumenDefault: 3.8,
    aggregates: [
      { key: "a4", pct: 38 },
      { key: "a3", pct: 28 },
      { key: "a2", pct: 16 },
      { key: "a1", pct: 13 },
      { key: "ns", pct: 3 },
      { key: "fl", pct: 2 },
    ],
    specLow:  [100, 80, 68, 50, 38, 20, 15, 10, 7, 5, 3, 2],
    specHigh: [100, 100, 90, 72, 60, 45, 32, 24, 17, 12, 9, 6],
  },

  /* CLASS B — Medium-heavy, NMAS 25 mm (deep base/binder) */
  B: {
    code: "B",
    nmas: 25,
    layer: "base",
    bitumen: [3.6, 5.0],
    bitumenDefault: 4.2,
    aggregates: [
      { key: "a4", pct: 28 },
      { key: "a3", pct: 30 },
      { key: "a2", pct: 19 },
      { key: "a1", pct: 16 },
      { key: "ns", pct: 4 },
      { key: "fl", pct: 3 },
    ],
    specLow:  [100, 90, 76, 60, 45, 28, 18, 12, 8, 5, 3, 2],
    specHigh: [100, 100, 96, 82, 65, 48, 34, 26, 20, 14, 10, 6],
  },

  /* CLASS C — Medium traffic binder course, NMAS 19 mm */
  C: {
    code: "C",
    nmas: 19,
    layer: "binder",
    bitumen: [4.2, 5.4],
    bitumenDefault: 4.8,
    aggregates: [
      { key: "a4", pct: 0 },
      { key: "a3", pct: 45 },
      { key: "a2", pct: 20 },
      { key: "a1", pct: 21 },
      { key: "ns", pct: 9 },
      { key: "fl", pct: 5 },
    ],
    specLow:  [100, 100, 90, 70, 58, 35, 23, 15, 10, 6, 4, 3],
    specHigh: [100, 100, 100, 92, 80, 55, 39, 30, 22, 16, 10, 7],
  },

  /* CLASS D — Wearing course, NMAS 12.5 mm (light/medium traffic) */
  D: {
    code: "D",
    nmas: 12.5,
    layer: "wearing",
    bitumen: [4.8, 6.2],
    bitumenDefault: 5.4,
    aggregates: [
      { key: "a4", pct: 0 },
      { key: "a3", pct: 18 },
      { key: "a2", pct: 32 },
      { key: "a1", pct: 28 },
      { key: "ns", pct: 16 },
      { key: "fl", pct: 6 },
    ],
    specLow:  [100, 100, 100, 90, 70, 44, 28, 18, 13, 8, 5, 4],
    specHigh: [100, 100, 100, 100, 90, 74, 58, 42, 30, 22, 16, 8],
  },
};

/* Combine gradations (% passing each sieve) given proportions */
export function computeCombined(
  proportions: { key: AggKey; pct: number }[]
): number[] {
  const total = proportions.reduce((s, p) => s + p.pct, 0);
  if (total <= 0) return SIEVES.map(() => 0);
  return SIEVES.map((_, idx) => {
    let s = 0;
    proportions.forEach((p) => {
      s += (p.pct / total) * COMPONENT_GRADATION[p.key][idx];
    });
    return Math.min(100, Math.max(0, s));
  });
}

/* Estimate Marshall properties from AC content & gradation.
   This is a QC screening model, not a replacement for lab specimens.
   Actual OAC is determined from Marshall curves: max stability,
   max density, and 4% air voids, then checked against project specs. */
export function estimateMarshall(
  ac: number,
  combined: number[],
  mixClass: MixClass
) {
  const def = MIX_CLASSES[mixClass];
  const midAC = def.bitumenDefault;
  const optDist = Math.abs(ac - midAC);

  // P200 (filler passing 0.075mm) influences voids & VMA
  const p200 = combined[combined.length - 1];

  // Air voids: optimum ~4%, increases away from optimum AC
  const airVoids = Math.max(2.5, Math.min(7, 4 + optDist * 1.2 - (p200 - 5) * 0.08));

  // VMA: typical 13-16%, depends on NMAS
  const baseVMA = def.nmas <= 12.5 ? 15.0 : def.nmas <= 19 ? 14.0 : def.nmas <= 25 ? 13.0 : 12.0;
  const vma = Math.max(11, baseVMA + (ac - midAC) * 0.5 + (p200 - 5) * 0.18);

  // VFA = (VMA - airVoids) / VMA * 100
  const vfa = ((vma - airVoids) / vma) * 100;

  // Stability (kg) — peaks near mid AC
  const nominalStability = mixClass === "A" || mixClass === "B" ? 1250 : 1100;
  const stability = Math.max(500, nominalStability - optDist * 280 + Math.min(120, (p200 - 4) * 20));

  // Flow (0.01 in) — increases with AC
  const flow = 9 + (ac - def.bitumen[0]) * 1.7;

  // Bulk density (kg/m³)
  const density = 2400 - airVoids * 10 - Math.abs(ac - midAC) * 12;

  // Marshall criteria (Asphalt Institute / FAA P-401):
  //  Stability >= 900 kg  (heavy/base mixes checked higher here)
  //  Flow 8 - 16  (0.01 in)
  //  Air voids 3 - 5 %
  //  VMA depends on NMAS (12% min for 37.5mm, 15% min for 12.5mm)
  //  VFA 65 - 78 %
  const minStab = mixClass === "A" || mixClass === "B" ? 1000 : 850;
  const minVMA = def.nmas <= 12.5 ? 14 : def.nmas <= 19 ? 13 : def.nmas <= 25 ? 12 : 11;
  const checks = {
    stability: stability >= minStab,
    flow: flow >= 8 && flow <= 16,
    airVoids: airVoids >= 3 && airVoids <= 5,
    vma: vma >= minVMA,
    vfa: vfa >= 65 && vfa <= 78,
  };
  const pass = Object.values(checks).every(Boolean);

  return {
    stability,
    flow,
    airVoids,
    vma,
    vfa,
    density,
    checks,
    pass,
  };
}
