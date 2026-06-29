/* ============================================================
   MATERIAL PROPERTIES TRACKING
   Aggregate & Bitumen test properties
============================================================ */

import { useState } from "react";
import type { Dict } from "../i18n";

interface PropTest { name: string; specMin?: number; specMax?: number; unit: string; value: number; }

const AGGREGATE_TESTS: PropTest[] = [
  { name: "Los Angeles Abrasion (%)", specMax: 30, unit: "%", value: 22 },
  { name: "Aggregate Crushing Value (%)", specMax: 30, unit: "%", value: 24 },
  { name: "Flakiness Index (%)", specMax: 35, unit: "%", value: 18 },
  { name: "Elongation Index (%)", specMax: 35, unit: "%", value: 15 },
  { name: "Specific Gravity (Bulk) — Coarse", specMin: 2.5, unit: "g/cm³", value: 2.62 },
  { name: "Specific Gravity (Bulk) — Fine", specMin: 2.5, unit: "g/cm³", value: 2.58 },
  { name: "Water Absorption (%)", specMax: 2, unit: "%", value: 1.2 },
  { name: "Soundness (Na₂SO₄ Loss) (%)", specMax: 12, unit: "%", value: 5.8 },
  { name: "Sand Equivalent (%)", specMin: 50, unit: "%", value: 68 },
  { name: "Aggregate Angularity — Fine (N₂₀₀+)", specMin: 400, unit: "count", value: 520 },
];

const BITUMEN_TESTS: PropTest[] = [
  { name: "Penetration @ 25°C", specMin: 60, specMax: 70, unit: "dmm", value: 65 },
  { name: "Softening Point (Ring & Ball)", specMin: 46, specMax: 58, unit: "°C", value: 52 },
  { name: "Specific Gravity @ 25°C", specMin: 1.01, specMax: 1.06, unit: "g/cm³", value: 1.03 },
  { name: "Flash Point (Cleveland)", specMin: 230, unit: "°C", value: 310 },
  { name: "Ductility @ 25°C", specMin: 100, unit: "cm", value: 120 },
  { name: "Kinematic Viscosity @ 135°C", specMin: 300, unit: "cSt", value: 420 },
  { name: "Rotational Viscometer @ 135°C", specMin: 1.5, specMax: 3.0, unit: "Pa·s", value: 2.1 },
  { name: "TFOT Residue — Penetration Retention", specMin: 55, unit: "%", value: 72 },
];

function PropTestRow({ test, onChange, }: { test: PropTest; onChange: (v: number) => void }) {
  let ok = true;
  if (test.specMin !== undefined && test.value < test.specMin) ok = false;
  if (test.specMax !== undefined && test.value > test.specMax) ok = false;

  return (
    <tr className="border-t border-slate-800 hover:bg-slate-800/30">
      <td className="px-2 py-1.5 text-slate-200 text-[12px]">{test.name}</td>
      <td className="px-2 py-1.5 text-center text-slate-400 text-[11px]">
        {test.specMin !== undefined ? test.specMin : "—"} {test.specMax !== undefined ? `– ${test.specMax}` : ""}
      </td>
      <td className="px-2 py-1.5 text-center">
        <input type="number" step={0.1} value={test.value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-20 bg-slate-800 border rounded px-1 py-0.5 text-center font-mono text-[11px] font-bold outline-none ${
            ok ? "border-slate-600 text-emerald-300 focus:border-emerald-400" : "border-rose-500 text-rose-300 focus:border-rose-400"
          }`} />
      </td>
      <td className="px-2 py-1.5 text-center text-[11px]">{test.unit}</td>
      <td className="px-2 py-1.5 text-center">
        <span className={`text-xs font-bold ${ok ? "text-emerald-400" : "text-rose-400"}`}>
          {ok ? "✓ PASS" : "✗ FAIL"}
        </span>
      </td>
    </tr>
  );
}

export function MaterialProperties(_props: { t: Dict }) {
  const [aggTests, setAggTests] = useState(AGGREGATE_TESTS);
  const [bitTests, setBitTests] = useState(BITUMEN_TESTS);

  const aggPass = aggTests.every(test => {
    if (test.specMin !== undefined && test.value < test.specMin) return false;
    if (test.specMax !== undefined && test.value > test.specMax) return false;
    return true;
  });
  const bitPass = bitTests.every(test => {
    if (test.specMin !== undefined && test.value < test.specMin) return false;
    if (test.specMax !== undefined && test.value > test.specMax) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Aggregate properties */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-base font-bold text-amber-300">🪨 Aggregate Physical Properties</h2>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${aggPass ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
            {aggPass ? "✓ All Pass" : "✗ Some Fail"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/70 text-amber-200">
                <th className="px-2 py-2 text-start">Test Property</th>
                <th className="px-2 py-2 text-center">Spec Range</th>
                <th className="px-2 py-2 text-center">Value</th>
                <th className="px-2 py-2 text-center">Unit</th>
                <th className="px-2 py-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {aggTests.map((test, i) => (
                <PropTestRow key={i} test={test}
                  onChange={(v) => setAggTests(prev => prev.map((t, j) => j === i ? { ...t, value: v } : t))} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bitumen properties */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-base font-bold text-amber-300">🛢️ Bitumen Properties (60/70)</h2>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${bitPass ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
            {bitPass ? "✓ All Pass" : "✗ Some Fail"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/70 text-amber-200">
                <th className="px-2 py-2 text-start">Test Property</th>
                <th className="px-2 py-2 text-center">Spec Range</th>
                <th className="px-2 py-2 text-center">Value</th>
                <th className="px-2 py-2 text-center">Unit</th>
                <th className="px-2 py-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {bitTests.map((test, i) => (
                <PropTestRow key={i} test={test}
                  onChange={(v) => setBitTests(prev => prev.map((t, j) => j === i ? { ...t, value: v } : t))} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
