/* ============================================================
   COST ESTIMATOR — Material cost per ton of HMA
============================================================ */

import { useState } from "react";
import { MIX_CLASSES, type MixClass } from "../mixData";
import type { Dict } from "../i18n";

interface MaterialPrice { name: string; pricePerTon: number; unit: string; }

const DEFAULT_PRICES: MaterialPrice[] = [
  { name: "Coarse Aggregate (Bins 3-4)", pricePerTon: 320, unit: "EGP/ton" },
  { name: "Fine Aggregate (Bins 1-2)", pricePerTon: 280, unit: "EGP/ton" },
  { name: "Natural Sand", pricePerTon: 150, unit: "EGP/ton" },
  { name: "Mineral Filler", pricePerTon: 450, unit: "EGP/ton" },
  { name: "Bitumen 60/70", pricePerTon: 14500, unit: "EGP/ton" },
];

export function CostEstimator(_props: { t: Dict }) {
  const [mixClass, setMixClass] = useState<MixClass>("D");
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [batchSize, setBatchSize] = useState(1000);
  const [fuelPerTon, setFuelPerTon] = useState(8);
  const [electricityPerTon, setElectricityPerTon] = useState(12);
  const [laborPerTon, setLaborPerTon] = useState(45);
  const [depreciationPerTon, setDepreciationPerTon] = useState(25);
  const [overheadPct, setOverheadPct] = useState(10);

  const def = MIX_CLASSES[mixClass];

  const aggTotalPct = def.aggregates.reduce((s, a) => s + a.pct, 0);
  const materialCost = (() => {
    const bitumenCost = (def.bitumenDefault / 100) * prices[4].pricePerTon;
    const aggCost = (1 - def.bitumenDefault / 100) * (
      (def.aggregates[0].pct + def.aggregates[1].pct) / aggTotalPct * prices[0].pricePerTon +
      (def.aggregates[2].pct + def.aggregates[3].pct) / aggTotalPct * prices[1].pricePerTon +
      def.aggregates[4].pct / aggTotalPct * prices[2].pricePerTon +
      def.aggregates[5].pct / aggTotalPct * prices[3].pricePerTon
    );
    return { bitumenCost, aggCost, total: bitumenCost + aggCost };
  })();

  const fuelCost = fuelPerTon * prices[4].pricePerTon > 0 ? 0 : fuelPerTon * 35; // fallback diesel price
  const elCost = electricityPerTon * 2.5; // EGP per kWh fallback
  const directCost = materialCost.total + fuelCost + elCost + laborPerTon;
  const indirectCost = depreciationPerTon + (directCost * overheadPct / 100);
  const totalCostPerTon = directCost + indirectCost;

  const batchTons = batchSize / 1000;
  const batchCost = totalCostPerTon * batchTons;

  const updatePrice = (idx: number, val: number) => {
    setPrices(prev => prev.map((p, i) => i === idx ? { ...p, pricePerTon: val } : p));
  };

  const costBar = (label: string, value: number, color: string) => (
    <div className="flex items-center gap-2">
      <div className="w-28 text-[11px] text-slate-300 truncate">{label}</div>
      <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, (value / totalCostPerTon) * 100)}%` }} />
      </div>
      <div className="w-20 text-right text-[11px] font-mono font-bold text-white">
        {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border-2 border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <h2 className="text-lg font-bold text-amber-300 mb-3">💰 Cost Estimation per Ton</h2>

        <div className="grid grid-cols-4 gap-2 mb-4 max-w-lg">
          {(["A", "B", "C", "D"] as MixClass[]).map(c => (
            <button key={c} onClick={() => setMixClass(c)}
              className={`py-2 rounded-lg text-sm font-bold transition ${
                mixClass === c ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}>Class {c}</button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Cost Breakdown</h3>
            {costBar("Bitumen", materialCost.bitumenCost, "bg-gradient-to-r from-amber-500 to-orange-500")}
            {costBar("Aggregates", materialCost.aggCost, "bg-gradient-to-r from-blue-500 to-cyan-500")}
            {costBar("Fuel", fuelCost, "bg-gradient-to-r from-rose-500 to-pink-500")}
            {costBar("Electricity", elCost, "bg-gradient-to-r from-emerald-500 to-teal-500")}
            {costBar("Labor", laborPerTon, "bg-gradient-to-r from-purple-500 to-violet-500")}
            {costBar("Depreciation", depreciationPerTon, "bg-gradient-to-r from-slate-500 to-slate-600")}
            {costBar("Overhead", directCost * overheadPct / 100, "bg-gradient-to-r from-yellow-500 to-amber-500")}

            <div className="border-t border-slate-700 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-200">Total Cost per Ton</span>
                <span className="text-2xl font-black text-amber-300">
                  {totalCostPerTon.toLocaleString(undefined, { maximumFractionDigits: 1 })} EGP
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">Batch Cost ({batchSize} kg)</span>
                <span className="text-lg font-bold text-white">
                  {batchCost.toLocaleString(undefined, { maximumFractionDigits: 1 })} EGP
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200">Material Prices (per ton)</h3>
            {prices.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-44 text-[11px] text-slate-300 truncate">{p.name}</div>
                <input type="number" min={0} step={10} value={p.pricePerTon}
                  onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs font-mono focus:border-amber-400 outline-none" />
                <div className="w-16 text-[10px] text-slate-500">{p.unit}</div>
              </div>
            ))}

            <h3 className="text-sm font-bold text-slate-200 mt-3 pt-2 border-t border-slate-700">Operating Costs (per ton)</h3>
            {[
              { label: "Fuel consumption", val: fuelPerTon, set: setFuelPerTon, unit: "L/ton", step: 0.5 },
              { label: "Electricity", val: electricityPerTon, set: setElectricityPerTon, unit: "kWh/ton", step: 0.5 },
              { label: "Labor cost", val: laborPerTon, set: setLaborPerTon, unit: "EGP/ton", step: 5 },
              { label: "Depreciation", val: depreciationPerTon, set: setDepreciationPerTon, unit: "EGP/ton", step: 5 },
              { label: "Overhead", val: overheadPct, set: setOverheadPct, unit: "% of direct", step: 1 },
              { label: "Batch size", val: batchSize, set: setBatchSize, unit: "kg", step: 50 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-44 text-[11px] text-slate-300">{item.label}</div>
                <input type="number" min={0} step={item.step} value={item.val}
                  onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs font-mono focus:border-amber-400 outline-none" />
                <div className="w-16 text-[10px] text-slate-500">{item.unit}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
