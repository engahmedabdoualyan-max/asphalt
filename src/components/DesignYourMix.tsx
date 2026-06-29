/* ============================================================
   DESIGN YOUR MIX — Manual input + file upload + optimizer
   Improved file parsing for CSV, TSV, JSON, TXT
============================================================ */

import { useMemo, useState, useCallback, useRef } from "react";
import {
  MIX_CLASSES, SIEVES, COMPONENT_GRADATION, estimateMarshall,
  type MixClass, type AggKey,
} from "../mixData";
import { GradationChart } from "./GradationChart";
import type { Dict } from "../i18n";

type Tab = "manual" | "upload";
const AGG_KEYS: AggKey[] = ["a4", "a3", "a2", "a1", "ns", "fl"];
const AGG_NAMES: Record<AggKey, string> = {
  a4: "Bin 4 (Coarse)", a3: "Bin 3 (Med)", a2: "Bin 2 (Chips)",
  a1: "Bin 1 (Sand)", ns: "Natural", fl: "Filler",
};

function midBand(low: number[], high: number[]): number[] {
  return low.map((l, i) => (l + high[i]) / 2);
}

/* Optimize proportions via random search */
function optimizeProportions(
  targets: number[], componentGrads: Record<AggKey, number[]>, initial: { key: AggKey; pct: number }[]
): { key: AggKey; pct: number }[] {
  const keys = initial.map(i => i.key);
  let best = initial.map(i => i.pct);
  let bestErr = Infinity;

  function errorOf(p: number[]): number {
    const total = p.reduce((s, v) => s + v, 0);
    if (total <= 0) return Infinity;
    let e = 0;
    SIEVES.forEach((_, idx) => {
      let c = 0;
      keys.forEach((k, ki) => { c += (p[ki] / total) * componentGrads[k][idx]; });
      e += (c - targets[idx]) ** 2;
    });
    return e;
  }

  for (let it = 0; it < 3000; it++) {
    const trial = best.map(v => {
      const delta = (Math.random() - 0.5) * 4 * (1 - it / 3000);
      return Math.max(0, Math.min(60, v + delta));
    });
    const s = trial.reduce((a, b) => a + b, 0);
    if (s === 0) continue;
    const norm = trial.map(v => (v / s) * 100);
    const err = errorOf(norm);
    if (err < bestErr) { bestErr = err; best = norm; }
  }

  return keys.map((k, i) => ({ key: k, pct: Math.round(best[i] * 10) / 10 }));
}

/* ==================== FILE PARSING ==================== */

interface ParseResult {
  success: boolean;
  grads?: Record<AggKey, number[]>;
  rawPreview?: string;
  message: string;
}

/* Parse CSV / TSV / TXT — rows = components, columns = sieve values */
function parseTextFile(text: string, fileName: string): ParseResult {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return { success: false, message: "File is empty" };

  // Try to detect delimiter
  const delimiters = [",", "\t", ";", "|"];
  let bestDelim = ",";
  let bestScore = 0;
  for (const d of delimiters) {
    const counts = lines.slice(0, 5).map(l => l.split(d).length);
    const score = Math.min(...counts);
    if (score > bestScore) { bestScore = score; bestDelim = d; }
  }

  // Extract all numeric rows
  const numericRows: number[][] = [];
  const rowLabels: string[] = [];
  for (const line of lines) {
    const parts = line.split(bestDelim).map(p => p.trim().replace(/["']/g, ""));
    const nums: number[] = [];
    const labels: string[] = [];
    for (const p of parts) {
      const n = parseFloat(p);
      if (!isNaN(n) && n >= 0 && n <= 100) nums.push(n);
      else if (p.length > 0 && p.length < 50) labels.push(p);
    }
    if (nums.length >= 6) { // At least 6 sieve values to be useful
      numericRows.push(nums.slice(0, SIEVES.length));
      rowLabels.push(labels[0] || `Row ${numericRows.length}`);
    }
  }

  if (numericRows.length === 0) {
    return { success: false, message: `No numeric gradation data found. Found ${lines.length} lines.`, rawPreview: lines.slice(0, 5).join("\n") };
  }

  // Map rows to aggregate keys
  const grads: Record<AggKey, number[]> = {
    a4: [...COMPONENT_GRADATION.a4],
    a3: [...COMPONENT_GRADATION.a3],
    a2: [...COMPONENT_GRADATION.a2],
    a1: [...COMPONENT_GRADATION.a1],
    ns: [...COMPONENT_GRADATION.ns],
    fl: [...COMPONENT_GRADATION.fl],
  };

  // If we have exactly 6 rows, map directly
  if (numericRows.length === 6) {
    AGG_KEYS.forEach((k, i) => {
      grads[k] = padToLength(numericRows[i], SIEVES.length);
    });
    return { success: true, grads, message: `✅ Parsed 6 components × ${SIEVES.length} sieves from ${fileName}` };
  }

  // Try to match by header labels
  const headerLine = lines[0].split(bestDelim).map(h => h.trim().toLowerCase());
  const sieveMatches = headerLine.map(h => {
    const n = parseFloat(h.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? -1 : n;
  });
  const hasSieveHeader = sieveMatches.filter(n => n > 0).length >= 4;

  if (hasSieveHeader && numericRows.length > 0) {
    // Header contains sieve sizes, first column is component names
    const sieveIndices = sieveMatches.map((s, i) => ({ sieve: s, colIdx: i })).filter(x => x.sieve > 0);
    AGG_KEYS.forEach((k, i) => {
      if (numericRows[i]) {
        const row = numericRows[i];
        const fullRow = new Array(SIEVES.length).fill(100);
        sieveIndices.forEach(({ sieve, colIdx }) => {
          const sieveIdx = findClosestSieve(sieve);
          if (sieveIdx >= 0 && colIdx < row.length) {
            fullRow[sieveIdx] = row[colIdx];
          }
        });
        grads[k] = fullRow;
      }
    });
    return { success: true, grads, message: `✅ Parsed with header matching from ${fileName}` };
  }

  // Just use rows as-is
  AGG_KEYS.forEach((k, i) => {
    if (numericRows[i]) {
      grads[k] = padToLength(numericRows[i], SIEVES.length);
    }
  });

  return { success: true, grads, message: `✅ Parsed ${numericRows.length} component rows from ${fileName}` };
}

/* Parse JSON — supports multiple formats */
function parseJSON(text: string, fileName: string): ParseResult {
  try {
    const data = JSON.parse(text);

    // Format 1: { gradations: { a4: [...], a3: [...], ... } }
    if (data.gradations) {
      const grads: Record<AggKey, number[]> = { ...COMPONENT_GRADATION };
      for (const key of AGG_KEYS) {
        if (data.gradations[key]) grads[key] = padToLength(data.gradations[key], SIEVES.length);
      }
      return { success: true, grads, message: `✅ Parsed gradations from JSON: ${fileName}` };
    }

    // Format 2: { components: [{ name: "Bin4", values: [...] }, ...] }
    if (data.components && Array.isArray(data.components)) {
      const grads: Record<AggKey, number[]> = { ...COMPONENT_GRADATION };
      data.components.forEach((comp: any, i: number) => {
        if (i < AGG_KEYS.length && (comp.values || comp.gradation || comp.data)) {
          grads[AGG_KEYS[i]] = padToLength(comp.values || comp.gradation || comp.data, SIEVES.length);
        }
      });
      return { success: true, grads, message: `✅ Parsed ${data.components.length} components from JSON: ${fileName}` };
    }

    // Format 3: Array of arrays — [[vals for a4], [vals for a3], ...]
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      const grads: Record<AggKey, number[]> = { ...COMPONENT_GRADATION };
      data.forEach((arr: number[], i: number) => {
        if (i < AGG_KEYS.length) grads[AGG_KEYS[i]] = padToLength(arr, SIEVES.length);
      });
      return { success: true, grads, message: `✅ Parsed ${data.length} component arrays from JSON: ${fileName}` };
    }

    // Format 4: { sieve_data: { "4.75": 55, "2.36": 38, ... } } — single component
    if (data.sieve_data || data.passing) {
      const sieveData = data.sieve_data || data.passing;
      const vals = SIEVES.map(s => sieveData[s.toString()] ?? sieveData[s] ?? 100);
      const grads: Record<AggKey, number[]> = { ...COMPONENT_GRADATION };
      grads.a1 = vals; // Default to fine aggregate
      return { success: true, grads, message: `✅ Parsed single gradation curve from JSON: ${fileName}` };
    }

    // Format 5: Array of objects with sieve keys
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
      const sieveKeys = Object.keys(data[0]).filter(k => !isNaN(parseFloat(k)));
      if (sieveKeys.length >= 6) {
        const grads: Record<AggKey, number[]> = { ...COMPONENT_GRADATION };
        data.forEach((obj: any, i: number) => {
          if (i < AGG_KEYS.length) {
            grads[AGG_KEYS[i]] = SIEVES.map(s => obj[s.toString()] ?? obj[s] ?? 100);
          }
        });
        return { success: true, grads, message: `✅ Parsed ${data.length} objects from JSON: ${fileName}` };
      }
    }

    return { success: false, message: "JSON format not recognized. Expected: { gradations: {...} } or array of components." };
  } catch (e) {
    return { success: false, message: `Invalid JSON: ${(e as Error).message}` };
  }
}

/* Parse PDF — extract text and try to find numbers */
async function parsePDF(file: File): Promise<ParseResult> {
  try {
    // Try to read as text first (some PDFs are text-based)
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const numberLines: number[][] = [];

    for (const line of lines) {
      // Extract sequences of numbers from each line
      const matches = line.match(/\d+\.?\d*/g);
      if (matches && matches.length >= 6) {
        const nums = matches.map(Number).filter(n => n >= 0 && n <= 100);
        if (nums.length >= 6) numberLines.push(nums.slice(0, SIEVES.length));
      }
    }

    if (numberLines.length >= 3) {
      const grads: Record<AggKey, number[]> = { ...COMPONENT_GRADATION };
      AGG_KEYS.forEach((k, i) => {
        if (numberLines[i]) grads[k] = padToLength(numberLines[i], SIEVES.length);
      });
      return { success: true, grads, message: `✅ Extracted ${numberLines.length} gradation rows from PDF: ${file.name}` };
    }

    return { success: false, message: "PDF contains no parseable gradation data. Please use a text-based PDF or convert to CSV/JSON." };
  } catch {
    return { success: false, message: "Could not read PDF file. Try converting to CSV or JSON format." };
  }
}

/* Read image and display for manual entry */
function parseImage(file: File): ParseResult {
  return { success: false, message: `📸 Image "${file.name}" loaded — please read the values and enter manually in the table below.` };
}

/* Helper functions */
function padToLength(arr: number[], len: number): number[] {
  const result = [...arr];
  while (result.length < len) result.unshift(result[0] >= 50 ? 100 : 0);
  return result.slice(0, len);
}

function findClosestSieve(target: number): number {
  let bestIdx = 0, bestDist = Infinity;
  SIEVES.forEach((s, i) => { const d = Math.abs(s - target); if (d < bestDist) { bestDist = d; bestIdx = i; } });
  return bestDist < target * 0.5 ? bestIdx : -1;
}

/* ==================== COMPONENT ==================== */

export function DesignYourMix({ t }: { t: Dict }) {
  const [tab, setTab] = useState<Tab>("manual");
  const [mixClass, setMixClass] = useState<MixClass>("D");
  const def = MIX_CLASSES[mixClass];

  /* === Step 1: Design Code — AASHTO is the primary/default === */
  const designCodes = [
    { code: "AASHTO T 245", label: "AASHTO T 245", desc: "Marshall (Primary)", primary: true },
    { code: "ECP 104", label: "ECP 104", desc: "Egyptian Code", primary: false },
    { code: "Saudi MOC/MOMRA", label: "Saudi MOC/MOMRA", desc: "Saudi Specs", primary: false },
    { code: "Asphalt Institute MS-2", label: "AI MS-2", desc: "Asphalt Institute", primary: false },
  ];
  const [designCode, setDesignCode] = useState("AASHTO T 245");

  /* === Crusher (الكسارة) sidebar state === */
  const [crusherTab, setCrusherTab] = useState<"info" | "bins" | "properties">("info");
  const [crusher, setCrusher] = useState({
    name: "Main Crusher Plant",
    type: "Jaw + Cone",
    location: "Quarry Site A",
    capacity: 250,
    owner: "Plant Owner",
  });
  const [matProps, setMatProps] = useState({
    bulkSG: 2.65, apparentSG: 2.72, absorption: 1.2, laa: 22, flakiness: 15, elongation: 12, sandEq: 68,
  });

  const [grads, setGrads] = useState<Record<AggKey, number[]>>({
    a4: [...COMPONENT_GRADATION.a4], a3: [...COMPONENT_GRADATION.a3],
    a2: [...COMPONENT_GRADATION.a2], a1: [...COMPONENT_GRADATION.a1],
    ns: [...COMPONENT_GRADATION.ns], fl: [...COMPONENT_GRADATION.fl],
  });

  const [results, setResults] = useState<{ proportions: { key: AggKey; pct: number }[]; ac: number; combined: number[]; marshall: ReturnType<typeof estimateMarshall> } | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const target = useMemo(() => midBand(def.specLow, def.specHigh), [def]);

  const updateCrusher = (field: keyof typeof crusher, val: string | number) => setCrusher(prev => ({ ...prev, [field]: val }));
  const updateMat = (field: keyof typeof matProps, val: number) => setMatProps(prev => ({ ...prev, [field]: val }));

  const updateGrad = (key: AggKey, idx: number, val: number) => {
    setGrads(prev => { const arr = [...prev[key]]; arr[idx] = val; return { ...prev, [key]: arr }; });
  };

  const runOptimization = () => {
    const initial = def.aggregates.map(a => ({ ...a }));
    const optimal = optimizeProportions(target, grads, initial);

    let bestAC = def.bitumenDefault;
    let bestScore = -Infinity;
    for (let ac = def.bitumen[0]; ac <= def.bitumen[1]; ac += 0.1) {
      const combinedCurve = SIEVES.map((_, idx) => {
        let s = 0;
        optimal.forEach(o => { s += (o.pct / 100) * grads[o.key][idx]; });
        return s;
      });
      const m = estimateMarshall(ac, combinedCurve, mixClass);
      const score = (m.pass ? 100 : 0) + (Object.values(m.checks).filter(Boolean).length * 10) - Math.abs(m.airVoids - 4) * 5;
      if (score > bestScore) { bestScore = score; bestAC = Math.round(ac * 10) / 10; }
    }

    const combinedCurve = SIEVES.map((_, idx) => {
      let s = 0;
      optimal.forEach(o => { s += (o.pct / 100) * grads[o.key][idx]; });
      return s;
    });
    const marshall = estimateMarshall(bestAC, combinedCurve, mixClass);
    setResults({ proportions: optimal, ac: bestAC, combined: combinedCurve, marshall });
  };

  /* Handle file upload */
  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true);
    setParseStatus(null);
    setImagePreview(null);

    const ext = file.name.toLowerCase().split(".").pop();

    try {
      if (ext === "json") {
        const text = await file.text();
        setParseStatus(parseJSON(text, file.name));
      } else if (["csv", "tsv", "txt"].includes(ext || "")) {
        const text = await file.text();
        setParseStatus(parseTextFile(text, file.name));
      } else if (ext === "pdf") {
        setParseStatus(await parsePDF(file));
      } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
        const result = parseImage(file);
        setParseStatus(result);
        // Show image preview
        const reader = new FileReader();
        reader.onload = () => setImagePreview(String(reader.result));
        reader.readAsDataURL(file);
      } else {
        // Try reading as text
        const text = await file.text();
        setParseStatus(parseTextFile(text, file.name));
      }
    } catch (err) {
      setParseStatus({ success: false, message: `Error reading file: ${(err as Error).message}` });
    }

    setIsParsing(false);
  }, []);

  // Apply parsed gradations
  useEffect(() => {
    if (parseStatus?.success && parseStatus.grads) {
      setGrads(parseStatus.grads);
    }
  }, [parseStatus]);

  const resetToDefaults = () => {
    setGrads({
      a4: [...COMPONENT_GRADATION.a4], a3: [...COMPONENT_GRADATION.a3],
      a2: [...COMPONENT_GRADATION.a2], a1: [...COMPONENT_GRADATION.a1],
      ns: [...COMPONENT_GRADATION.ns], fl: [...COMPONENT_GRADATION.fl],
    });
    setParseStatus(null);
    setImagePreview(null);
  };

  const aggName = (k: AggKey) => ({
    a4: t.aggA4, a3: t.aggA3, a2: t.aggA2, a1: t.aggA1, ns: t.aggNS, fl: t.aggFL,
  })[k];

  const classFull = (c: MixClass) => ({
    A: t.classAFull, B: t.classBFull, C: t.classCFull, D: t.classDFull,
  })[c];

  return (
    <div className="space-y-5">
      {/* ===== STEP 1: Design Code selector — AASHTO is primary ===== */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <label className="text-xs text-amber-300 font-bold uppercase tracking-wide flex items-center gap-1">
            <span className="bg-amber-500 text-slate-900 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black">1</span>
            {t.dymChooseCode || "Choose Design Code"}
          </label>
          <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-0.5 font-bold">
            ✓ Active: {designCode}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {designCodes.map(dc => (
            <button key={dc.code} onClick={() => setDesignCode(dc.code)}
              className={`p-3 rounded-xl border-2 text-start transition relative ${designCode === dc.code ? "border-amber-400 bg-amber-500/20 text-amber-200 shadow-lg" : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-amber-500/50"}`}>
              {dc.primary && <span className="absolute -top-2 -end-1 text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">PRIMARY</span>}
              <div className="font-black text-sm">{dc.label}</div>
              <div className="text-[10px] mt-0.5 opacity-80">{dc.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ===== STEP 2: Mix Class ===== */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 shadow-xl">
        <label className="text-xs text-amber-300 font-bold uppercase tracking-wide flex items-center gap-1 mb-2">
          <span className="bg-amber-500 text-slate-900 w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black">2</span>
          {t.classLabel}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(MIX_CLASSES) as MixClass[]).map(c => (
            <button key={c} onClick={() => setMixClass(c)}
              className={`p-3 rounded-xl border-2 text-start transition ${mixClass === c ? "border-amber-400 bg-amber-500/20 text-amber-200 shadow-lg" : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-amber-500/50"}`}>
              <div className="font-black text-lg">{c}</div>
              <div className="text-[10px] mt-1 leading-tight opacity-80">{classFull(c)}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ===== STEP 3: Crusher sidebar + Main design area ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

        {/* ===== CRUSHER SIDEBAR (الكسارة) ===== */}
        <aside className="xl:col-span-1 xl:sticky xl:top-4">
          <section className="bg-slate-900/70 border border-amber-500/40 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-l from-amber-600/30 to-orange-700/20 border-b border-amber-500/30 p-3">
              <h2 className="font-black text-amber-200 flex items-center gap-2 text-sm">⚙️ {t.dymCrusher || "Crusher Setup (الكسارة)"}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Aggregate source & material configuration</p>
            </div>

            {/* Section tabs */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/50">
              {([
                { key: "info" as const, label: "🏭 Info", icon: "🏭" },
                { key: "bins" as const, label: "⛏️ Bins", icon: "⛏️" },
                { key: "properties" as const, label: "⚗️ Props", icon: "⚗️" },
              ]).map(s => (
                <button key={s.key} onClick={() => setCrusherTab(s.key)}
                  className={`py-2 rounded-lg text-[11px] font-bold transition ${crusherTab === s.key ? "bg-amber-500 text-slate-900 shadow" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{s.label}</button>
              ))}
            </div>

            {/* --- Section: Crusher Info --- */}
            {crusherTab === "info" && (
              <div className="p-4 space-y-3">
                <Field label={t.dymCrusherName || "Crusher Name"} value={crusher.name} onChange={v => updateCrusher("name", v)} />
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.dymCrusherType || "Crusher Type"}</label>
                  <select value={crusher.type} onChange={e => updateCrusher("type", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 outline-none">
                    <option>Jaw Crusher</option>
                    <option>Cone Crusher</option>
                    <option>Jaw + Cone</option>
                    <option>Impact Crusher</option>
                    <option>Vertical Shaft Impact (VSI)</option>
                  </select>
                </div>
                <Field label={t.dymCrusherLoc || "Location / Quarry"} value={crusher.location} onChange={v => updateCrusher("location", v)} />
                <Field label={t.dymCrusherOwner || "Owner / Supplier"} value={crusher.owner} onChange={v => updateCrusher("owner", v)} />
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.dymCrusherCap || "Capacity (tons/hour)"}</label>
                  <input type="number" min={0} step={10} value={crusher.capacity}
                    onChange={e => updateCrusher("capacity", parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 outline-none" />
                </div>
              </div>
            )}

            {/* --- Section: Stockpile Bins summary --- */}
            {crusherTab === "bins" && (
              <div className="p-4 space-y-2">
                <p className="text-[10px] text-slate-400 mb-1">Bin stockpiles producing the aggregate fractions below. Edit full gradation in the design table →</p>
                {AGG_KEYS.map(k => {
                  const totalPass = grads[k].reduce((s, v) => s + v, 0);
                  return (
                    <div key={k} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-slate-200 truncate">{AGG_NAMES[k]}</div>
                        <div className="text-[9px] text-slate-500">{aggName(k)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min(100, totalPass / 12)}%` }} />
                        </div>
                        <span className="text-[10px] text-amber-200 font-mono w-8 text-end">{(totalPass / 12).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- Section: Material Properties --- */}
            {crusherTab === "properties" && (
              <div className="p-4 grid grid-cols-2 gap-2">
                <NumField label="Bulk SG" value={matProps.bulkSG} onChange={v => updateMat("bulkSG", v)} step={0.01} />
                <NumField label="Apparent SG" value={matProps.apparentSG} onChange={v => updateMat("apparentSG", v)} step={0.01} />
                <NumField label="Absorption %" value={matProps.absorption} onChange={v => updateMat("absorption", v)} step={0.1} ok={matProps.absorption <= 2} />
                <NumField label="LAA Loss %" value={matProps.laa} onChange={v => updateMat("laa", v)} step={1} ok={matProps.laa <= 30} />
                <NumField label="Flakiness %" value={matProps.flakiness} onChange={v => updateMat("flakiness", v)} step={1} ok={matProps.flakiness <= 35} />
                <NumField label="Elongation %" value={matProps.elongation} onChange={v => updateMat("elongation", v)} step={1} ok={matProps.elongation <= 35} />
                <div className="col-span-2">
                  <NumField label="Sand Equivalent %" value={matProps.sandEq} onChange={v => updateMat("sandEq", v)} step={1} ok={matProps.sandEq >= 50} />
                </div>
              </div>
            )}

            {/* Footer note */}
            <div className="border-t border-slate-800 p-3 bg-slate-950/30">
              <div className="text-[10px] text-slate-500 leading-relaxed">
                <span className="text-amber-200 font-bold">Note:</span> Crusher output gradations feed the design table. Verify against {designCode} limits.
              </div>
            </div>
          </section>
        </aside>

        {/* ===== MAIN DESIGN AREA ===== */}
        <div className="xl:col-span-2 space-y-5">
          {/* Tab switcher */}
          <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-1.5 shadow-xl">
            <div className="grid grid-cols-2 gap-1.5">
              {([{ key: "manual" as Tab, label: t.dymTabManual }, { key: "upload" as Tab, label: t.dymTabUpload }]).map(x => (
                <button key={x.key} onClick={() => setTab(x.key)}
                  className={`py-3 rounded-xl font-bold text-sm transition ${tab === x.key ? "bg-gradient-to-l from-amber-500 to-orange-600 text-slate-900 shadow" : "text-slate-300 hover:bg-slate-800/60"}`}>{x.label}</button>
              ))}
            </div>
          </section>

      {/* Upload tab */}
      {tab === "upload" && (
        <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-amber-300 mb-1">{t.dymUploadSheet}</h3>
          <p className="text-xs text-slate-400 mb-4">Supports: CSV, TSV, TXT, JSON, PDF, Images (JPG/PNG)</p>

          {/* Drop zone */}
          <label className="block">
            <div className="border-2 border-dashed border-slate-600 hover:border-amber-500/60 rounded-xl p-8 text-center cursor-pointer transition bg-slate-800/30"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-amber-400", "bg-amber-500/5"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-amber-400", "bg-amber-500/5"); }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-amber-400", "bg-amber-500/5"); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}>
              <div className="text-5xl mb-3">📥</div>
              {isParsing ? (
                <div className="text-amber-200">⏳ {t.dymExtracting}</div>
              ) : parseStatus ? (
                <div className={`font-semibold ${parseStatus.success ? "text-emerald-300" : "text-rose-300"}`}>{parseStatus.message}</div>
              ) : (
                <>
                  <div className="text-slate-300 font-semibold">Drop file here or click to browse</div>
                  <div className="text-[11px] text-slate-500 mt-1">CSV • TSV • TXT • JSON • PDF • JPG/PNG</div>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.json,.txt,.pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          </label>

          {/* Image preview */}
          {imagePreview && (
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-2">📸 Uploaded Image — Read values and enter manually below:</div>
              <img src={imagePreview} alt="Uploaded test" className="max-h-64 rounded-lg border border-slate-700 mx-auto" />
            </div>
          )}

          {/* Parse error preview */}
          {parseStatus && !parseStatus.success && parseStatus.rawPreview && (
            <div className="mt-4 bg-slate-800 rounded-lg p-3 text-[11px] text-slate-400 font-mono overflow-auto max-h-32">
              <div className="text-rose-300 mb-1">Raw content preview:</div>
              <pre dir="ltr">{parseStatus.rawPreview}</pre>
            </div>
          )}

          {/* Supported formats guide */}
          <div className="mt-4 bg-slate-800/40 border border-slate-700 rounded-lg p-4">
            <div className="text-sm font-bold text-slate-200 mb-2">📌 Supported File Formats:</div>
            <div className="grid md:grid-cols-2 gap-3 text-[11px]">
              <div>
                <div className="text-amber-200 font-bold mb-1">CSV / TSV / TXT:</div>
                <pre className="text-slate-400 bg-slate-900 rounded p-2" dir="ltr">{`Component,37.5,25,19,12.5,9.5,4.75,2.36,1.18,0.6,0.3,0.15,0.075
Bin4,100,92,55,12,3,1,0,0,0,0,0,0
Bin3,100,100,98,78,30,4,1,0,0,0,0,0
Bin2,100,100,100,100,92,28,6,2,1,0,0,0
Sand,100,100,100,100,100,96,72,52,36,22,12,6
Natural,100,100,100,100,100,99,92,76,56,30,10,3
Filler,100,100,100,100,100,100,100,100,100,98,92,82`}</pre>
              </div>
              <div>
                <div className="text-amber-200 font-bold mb-1">JSON:</div>
                <pre className="text-slate-400 bg-slate-900 rounded p-2" dir="ltr">{`{
  "gradations": {
    "a4": [100,92,55,12,3,1,0,0,0,0,0,0],
    "a3": [100,100,98,78,30,4,1,0,0,0,0,0],
    "a2": [100,100,100,100,92,28,6,2,1,0,0,0],
    "a1": [100,100,100,100,100,96,72,52,36,22,12,6],
    "ns": [100,100,100,100,100,99,92,76,56,30,10,3],
    "fl": [100,100,100,100,100,100,100,100,100,98,92,82]
  }
}`}</pre>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">
              <strong>12 sieves:</strong> {SIEVES.join(", ")} mm<br/>
              <strong>6 components:</strong> a4 (Bin 4), a3 (Bin 3), a2 (Bin 2), a1 (Bin 1), ns (Natural), fl (Filler)
            </div>
          </div>

          {parseStatus?.success && (
            <div className="mt-4 flex justify-center">
              <button onClick={runOptimization}
                className="bg-gradient-to-l from-emerald-500 to-emerald-700 hover:from-emerald-400 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg transition">{t.dymOptimize}</button>
            </div>
          )}
        </section>
      )}

      {/* Manual input */}
      {tab === "manual" && (
        <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h3 className="text-base font-bold text-amber-300 mb-1">{t.dymInputGradations}</h3>
          <p className="text-xs text-slate-400 mb-4">{t.dymInputHint}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800/70 text-amber-200">
                  <th className="px-2 py-2 text-start">{t.dymComponent}</th>
                  {SIEVES.map(s => <th key={s} className="px-1 py-2 text-center font-mono text-[10px]">{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {AGG_KEYS.map((k, ri) => (
                  <tr key={k} className={`border-t border-slate-800 ${ri % 2 === 0 ? "bg-slate-900/30" : ""}`}>
                    <td className="px-2 py-1.5 text-slate-200 text-[11px] whitespace-nowrap">
                      <div className="font-semibold">{aggName(k)}</div>
                      <div className="text-[9px] text-slate-500">{AGG_NAMES[k]}</div>
                    </td>
                    {grads[k].map((v, i) => (
                      <td key={i} className="px-0.5 py-1">
                        <input type="number" min={0} max={100} step={0.1} value={v}
                          onChange={(e) => updateGrad(k, i, parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-amber-200 font-mono text-[11px] focus:border-amber-400 outline-none" />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-emerald-900/20 border-t-2 border-emerald-500/40">
                  <td className="px-2 py-2 text-emerald-300 font-bold text-[11px]">{t.dymTargetGradation}</td>
                  {target.map((v, i) => (
                    <td key={i} className="px-1 py-2 text-center text-emerald-300 font-mono text-[11px]">{v.toFixed(0)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={runOptimization}
              className="bg-gradient-to-l from-emerald-500 to-emerald-700 hover:from-emerald-400 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg transition">{t.dymOptimize}</button>
            <button onClick={resetToDefaults}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm">{t.dymReset}</button>
          </div>
        </section>
      )}

          {/* Results */}
          {results && <ResultsPanel t={t} results={results} mixClass={mixClass} />}
        </div>{/* end main area */}
      </div>{/* end two-column grid */}
    </div>
  );
}

/* ---- Small field helpers for the crusher sidebar ---- */
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-400 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 outline-none" />
    </div>
  );
}

function NumField({ label, value, onChange, step = 1, ok }: { label: string; value: number; onChange: (v: number) => void; step?: number; ok?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 ${ok === false ? "border-rose-500/50 bg-rose-500/5" : ok === true ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-700 bg-slate-800/40"}`}>
      <label className="block text-[10px] text-slate-400 mb-0.5">{label}</label>
      <input type="number" step={step} value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-transparent text-sm font-mono font-bold outline-none ${ok === false ? "text-rose-300" : ok === true ? "text-emerald-300" : "text-white"}`} />
    </div>
  );
}

function ResultsPanel({ t, results, mixClass }: {
  t: Dict; results: { proportions: { key: AggKey; pct: number }[]; ac: number; combined: number[]; marshall: ReturnType<typeof estimateMarshall> }; mixClass: MixClass;
}) {
  const def = MIX_CLASSES[mixClass];
  const spec = { low: def.specLow, high: def.specHigh };
  const m = results.marshall;
  const aggName = (k: AggKey) => ({ a4: t.aggA4, a3: t.aggA3, a2: t.aggA2, a1: t.aggA1, ns: t.aggNS, fl: t.aggFL })[k];

  const stat = (label: string, value: string, pass: boolean) => (
    <div className={`p-3 rounded-lg border ${pass ? "bg-emerald-500/10 border-emerald-500/40" : "bg-rose-500/10 border-rose-500/40"}`}>
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-lg font-black ${pass ? "text-emerald-300" : "text-rose-300"}`}>{value} {pass ? "✓" : "✗"}</div>
    </div>
  );

  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-2xl">
      <h2 className="text-lg font-black text-amber-300 mb-4 flex items-center gap-2"><span>🎯</span>{t.dymResults}</h2>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-2">{t.dymOptimalPcts}</h3>
            <div className="space-y-1.5">
              {results.proportions.map(p => (
                <div key={p.key} className="flex items-center gap-2">
                  <div className="text-xs text-slate-300 w-36 truncate">{aggName(p.key)}</div>
                  <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all" style={{ width: `${p.pct}%` }} />
                  </div>
                  <div className="text-amber-200 font-mono font-bold text-sm w-12 text-end">{p.pct.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-center">
            <div className="text-xs text-amber-200 mb-1">{t.dymOptimalAC}</div>
            <div className="text-3xl font-black text-amber-300">{results.ac.toFixed(1)}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Range: {def.bitumen[0]}% – {def.bitumen[1]}%</div>
          </div>
          <div className={`p-4 rounded-xl text-center font-bold border-2 ${m.pass ? "bg-emerald-500/10 border-emerald-500 text-emerald-300" : "bg-rose-500/10 border-rose-500 text-rose-300"}`}>
            {m.pass ? t.dymPass : t.dymFail}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-2">{t.dymPerformance}</h3>
            <div className="grid grid-cols-2 gap-2">
              {stat(t.dymStability, m.stability.toFixed(0), m.checks.stability)}
              {stat(t.dymFlow, m.flow.toFixed(1), m.checks.flow)}
              {stat(t.dymVoids, m.airVoids.toFixed(1), m.checks.airVoids)}
              {stat(t.dymVMA, m.vma.toFixed(1), m.checks.vma)}
              {stat(t.dymVFA, m.vfa.toFixed(1), m.checks.vfa)}
              <div className="p-3 rounded-lg border bg-slate-800/50 border-slate-700">
                <div className="text-[10px] text-slate-400">{t.dymDensity}</div>
                <div className="text-lg font-black text-slate-200">{m.density.toFixed(0)}</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-950/50 rounded-xl border border-slate-700 p-2">
            <GradationChart combined={results.combined} spec={spec} t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect } from "react";
