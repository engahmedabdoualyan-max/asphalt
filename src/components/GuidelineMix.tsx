import { useEffect, useMemo, useState } from "react";
import {
  MIX_CLASSES,
  SIEVES,
  computeCombined,
  type MixClass,
  type AggKey,
} from "../mixData";
import { GradationChart } from "./GradationChart";
import type { Dict } from "../i18n";

interface SavedDesign {
  id: string;
  name: string;
  mixClass: MixClass;
  bitumenPct: number;
  batchSize: number;
  aggregates: { key: AggKey; pct: number }[];
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileData?: string;
  uploadedAt: string;
}

const STORAGE_KEY = "asphalt_designs_v3";

function loadDesigns(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function StatCard({
  label, value, unit, tone = "blue", icon,
}: {
  label: string; value: string; unit?: string;
  tone?: "blue" | "amber" | "green" | "red"; icon: string;
}) {
  const tones: Record<string, string> = {
    blue: "from-blue-600/20 to-blue-900/20 border-blue-500/40 text-blue-200",
    amber: "from-amber-600/20 to-orange-900/20 border-amber-500/40 text-amber-200",
    green: "from-emerald-600/20 to-emerald-900/20 border-emerald-500/40 text-emerald-200",
    red: "from-rose-600/20 to-rose-900/20 border-rose-500/40 text-rose-200",
  };
  return (
    <div className={`bg-gradient-to-br ${tones[tone]} border rounded-xl p-3 shadow`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] opacity-80">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="text-xl font-black">
        {value}{unit && <span className="text-xs font-normal opacity-70 ms-1">{unit}</span>}
      </div>
    </div>
  );
}

export function GuidelineMix({ t }: { t: Dict }) {
  const [mixClass, setMixClass] = useState<MixClass>("D");
  const [batchSize, setBatchSize] = useState(1000);
  const [bitumenPct, setBitumenPct] = useState(MIX_CLASSES.D.bitumenDefault);
  const [aggregates, setAggregates] = useState(MIX_CLASSES.D.aggregates.map(a => ({...a})));
  const [standardCode, setStandardCode] = useState("ECP 104 / Egyptian Code");
  const [compaction, setCompaction] = useState("75 blows - heavy traffic");
  const [trafficUse, setTrafficUse] = useState("Road paving / highway works");
  const [designs, setDesigns] = useState<SavedDesign[]>(loadDesigns);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  }, [designs]);

  const def = MIX_CLASSES[mixClass];
  const totalPct = aggregates.reduce((s, a) => s + a.pct, 0);
  const bitumenOk = bitumenPct >= def.bitumen[0] && bitumenPct <= def.bitumen[1];

  const weights = useMemo(() => {
    const bitumenWeight = (batchSize * bitumenPct) / 100;
    const aggWeight = batchSize - bitumenWeight;
    const rows = aggregates.map(a => ({
      ...a, weight: totalPct > 0 ? (aggWeight * a.pct) / totalPct : 0,
    }));
    return { rows, bitumenWeight, aggWeight };
  }, [batchSize, bitumenPct, aggregates, totalPct]);

  const combined = useMemo(() => computeCombined(aggregates), [aggregates]);
  const spec = { low: def.specLow, high: def.specHigh };

  const compliance = useMemo(() => {
    let inSpec = 0;
    const violations: string[] = [];
    SIEVES.forEach((s, i) => {
      if (combined[i] >= spec.low[i] && combined[i] <= spec.high[i]) inSpec++;
      else violations.push(`${s}mm`);
    });
    return { pct: (inSpec / SIEVES.length) * 100, violations };
  }, [combined, spec]);

  const handleClassChange = (c: MixClass) => {
    setMixClass(c);
    setAggregates(MIX_CLASSES[c].aggregates.map(a => ({...a})));
    setBitumenPct(MIX_CLASSES[c].bitumenDefault);
  };

  const updatePct = (key: AggKey, val: number) => {
    setAggregates(prev => prev.map(a => a.key === key ? { ...a, pct: val } : a));
  };

  const aggMeta = (key: AggKey) => {
    const map: Record<AggKey, { name: string; note: string }> = {
      a4: { name: t.aggA4, note: t.aggNotes.a4 },
      a3: { name: t.aggA3, note: t.aggNotes.a3 },
      a2: { name: t.aggA2, note: t.aggNotes.a2 },
      a1: { name: t.aggA1, note: t.aggNotes.a1 },
      ns: { name: t.aggNS, note: t.aggNotes.ns },
      fl: { name: t.aggFL, note: t.aggNotes.fl },
    };
    return map[key];
  };

  const classFull = (c: MixClass) => ({
    A: t.classAFull, B: t.classBFull, C: t.classCFull, D: t.classDFull,
  })[c];

  /* Upload handlers */
  const handleUpload = async (file: File, name: string) => {
    const id = Date.now().toString(36);
    let fileData: string | undefined;
    if (file.type.startsWith("image/") && file.size < 2_000_000) {
      fileData = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(file);
      });
    }
    let parsed: Partial<SavedDesign> | null = null;
    if (file.name.toLowerCase().endsWith(".json")) {
      try { parsed = JSON.parse(await file.text()); } catch { /* ignore */ }
    }
    const design: SavedDesign = {
      id,
      name: name || file.name,
      mixClass: (parsed?.mixClass as MixClass) || mixClass,
      bitumenPct: parsed?.bitumenPct ?? bitumenPct,
      batchSize: parsed?.batchSize ?? batchSize,
      aggregates: parsed?.aggregates || aggregates.map(a => ({...a})),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData,
      uploadedAt: new Date().toISOString(),
    };
    setDesigns(prev => [design, ...prev]);
    setShowUpload(false);
  };

  return (
    <div className="space-y-5">
      {/* Class selector buttons */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 shadow-xl">
        <label className="block text-xs text-slate-300 mb-2 font-semibold uppercase tracking-wide">
          {t.classLabel}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(MIX_CLASSES) as MixClass[]).map(c => (
            <button
              key={c}
              onClick={() => handleClassChange(c)}
              className={`p-3 rounded-xl border-2 text-start transition ${
                mixClass === c
                  ? "border-amber-400 bg-amber-500/20 text-amber-200 shadow-lg"
                  : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-amber-500/50"
              }`}
            >
              <div className="font-black text-lg">{c}</div>
              <div className="text-[10px] mt-1 leading-tight opacity-80">{classFull(c)}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t.statBatch} value={batchSize.toLocaleString()} unit={t.weightUnit} icon="⚖️" tone="blue" />
        <StatCard label={t.statBitumenWeight} value={weights.bitumenWeight.toFixed(1)} unit={t.weightUnit} icon="🛢️" tone="amber" />
        <StatCard label={t.statAggWeight} value={weights.aggWeight.toFixed(1)} unit={t.weightUnit} icon="🪨" tone="blue" />
        <StatCard label={t.statCompliance} value={compliance.pct.toFixed(0)} unit="%"
          icon={compliance.pct >= 90 ? "✅" : "⚠️"} tone={compliance.pct >= 90 ? "green" : "red"} />
      </section>

      {/* Params */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <span>⚙️</span> {t.sectionParams}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Reference equations: Marshall mix design by AASHTO T 245, aggregate gradation by AASHTO T 27/T 11, and ECP 104 job-mix classification.
            </p>
          </div>
          <span className="text-[10px] text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
            Calculation source: JMF batch weight = total batch × component %
          </span>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">{t.batchSize}</label>
            <select value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none">
              {[500, 750, 1000, 1500, 2000, 2500, 3000].map(v => <option key={v} value={v}>{v} {t.weightUnit}</option>)}
            </select>
            <input type="number" min={100} max={5000} step={50} value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value) || 0)}
              className="mt-2 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:border-amber-400 outline-none" />
            <div className="text-[11px] text-slate-500 mt-1">Preset + custom value</div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">{t.nmasLabel}</label>
            <div className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-amber-200 font-bold">
              {def.nmas} mm
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Class {mixClass}</div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">Design code</label>
            <select value={standardCode} onChange={(e) => setStandardCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-amber-400 outline-none">
              <option>ECP 104 / Egyptian Code</option>
              <option>Saudi MOC / MOMRA asphalt specifications</option>
              <option>AASHTO T 245</option>
              <option>Asphalt Institute MS-2</option>
              <option>Project JMF approved limits</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">Compaction</label>
            <select value={compaction} onChange={(e) => setCompaction(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-amber-400 outline-none">
              <option>75 blows - heavy traffic</option>
              <option>50 blows - medium traffic</option>
              <option>35 blows - light traffic</option>
              <option>Project approved compaction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">Application</label>
            <select value={trafficUse} onChange={(e) => setTrafficUse(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:border-amber-400 outline-none">
              <option>Road paving / highway works</option>
              <option>Airport pavement</option>
              <option>Industrial yards</option>
              <option>Urban streets</option>
              <option>Project special mix</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">{t.bitumenPct}</label>
            <select value={bitumenPct} onChange={(e) => setBitumenPct(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none">
              {Array.from({ length: Math.round((def.bitumen[1] - def.bitumen[0]) / 0.1) + 1 }, (_, i) => +(def.bitumen[0] + i * 0.1).toFixed(1)).map(v => (
                <option key={v} value={v}>{v.toFixed(1)}%</option>
              ))}
            </select>
            <input type="number" min={def.bitumen[0]} max={def.bitumen[1]} step={0.1} value={bitumenPct}
              onChange={(e) => setBitumenPct(Number(e.target.value) || 0)}
              className="mt-2 w-full bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:border-amber-400 outline-none" />
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
              <div className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-emerald-300">Min: {def.bitumen[0].toFixed(1)}%</div>
              <div className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-1 text-rose-300">Max: {def.bitumen[1].toFixed(1)}%</div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-3 text-[11px] text-slate-400">
          <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-3"><span className="text-slate-200 font-bold">Code:</span> {standardCode}</div>
          <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-3"><span className="text-slate-200 font-bold">Compaction:</span> {compaction}</div>
          <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-3"><span className="text-slate-200 font-bold">Use:</span> {trafficUse}</div>
        </div>
        <div className={`mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold border ${
          bitumenOk ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-300"
        }`}>
          {bitumenOk ? t.bitumenOk : `${t.bitumenBad} (${def.bitumen[0]}% – ${def.bitumen[1]}%)`}
        </div>
      </section>

      {/* Table + Curve side by side */}
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-base font-bold text-amber-300 mb-4 flex items-center gap-2">
            <span>📋</span> {t.sectionTable}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-l from-slate-800 to-slate-700 text-amber-200 border-b border-amber-500/30">
                  <th className="px-2 py-2.5 text-start">{t.colMaterial}</th>
                  <th className="px-2 py-2.5 text-center">{t.colSize}</th>
                  <th className="px-2 py-2.5 text-center">{t.colPct}</th>
                  <th className="px-2 py-2.5 text-center">{t.colWeight}</th>
                </tr>
              </thead>
              <tbody>
                {weights.rows.map((r, i) => {
                  const meta = aggMeta(r.key);
                  return (
                    <tr key={r.key} className={`border-b border-slate-800 hover:bg-slate-800/40 transition ${i % 2 === 0 ? "bg-slate-900/30" : ""}`}>
                      <td className="px-2 py-2 text-slate-200 text-[13px]">{meta.name}</td>
                      <td className="px-2 py-2 text-center text-slate-400 font-mono text-[11px]">{meta.note}</td>
                      <td className="px-2 py-2 text-center">
                        <input type="number" min={0} max={100} step={0.5} value={r.pct}
                          onChange={(e) => updatePct(r.key, Number(e.target.value) || 0)}
                          className="w-16 bg-slate-800 border border-slate-600 rounded px-1.5 py-1 text-center text-amber-200 font-bold focus:border-amber-400 outline-none text-sm" />
                      </td>
                      <td className="px-2 py-2 text-center font-mono font-bold text-emerald-300 text-[13px]">
                        {r.weight.toFixed(2)} {t.weightUnit}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-amber-900/20 border-b border-amber-500/30">
                  <td className="px-2 py-2.5 text-amber-200 font-semibold text-[13px]">{t.aggBitumen}</td>
                  <td className="px-2 py-2.5 text-center text-slate-400 text-[11px]">{t.bitumenSizeNote}</td>
                  <td className="px-2 py-2.5 text-center text-amber-200 font-bold">{bitumenPct.toFixed(1)}%</td>
                  <td className="px-2 py-2.5 text-center font-mono font-bold text-amber-300 text-[13px]">
                    {weights.bitumenWeight.toFixed(2)} {t.weightUnit}
                  </td>
                </tr>
                <tr className="bg-gradient-to-l from-blue-900/50 to-slate-900/50 border-t-2 border-amber-500/50">
                  <td className="px-2 py-2.5 font-black text-amber-300 text-[13px]">{t.totalRow}</td>
                  <td className="px-2 py-2.5 text-center text-slate-400">-</td>
                  <td className="px-2 py-2.5 text-center font-bold text-white">100%</td>
                  <td className="px-2 py-2.5 text-center font-black text-base text-white">
                    {batchSize.toLocaleString()} {t.weightUnit}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {Math.abs(totalPct - 100) > 0.1 && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs">
              {t.pctSumWarn(totalPct)}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-bold text-amber-300 flex items-center gap-2"><span>📈</span> {t.sectionCurve}</h2>
            <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700">{t.specStd}</span>
          </div>
          <div className="bg-slate-950/50 rounded-xl border border-slate-700 p-2">
            <GradationChart combined={combined} spec={spec} t={t} />
          </div>
          {compliance.violations.length > 0 && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs">
              {t.violations(compliance.violations.join(" , "))}
            </div>
          )}
        </div>
      </section>

      {/* Sieve table */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/70 text-slate-300">
                <th className="px-2 py-2 text-start">{t.sieveHeader}</th>
                {SIEVES.map(s => <th key={s} className="px-2 py-2 text-center font-mono">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-700">
                <td className="px-2 py-2 text-slate-400">{t.upperLimit}</td>
                {spec.high.map((v, i) => <td key={i} className="px-2 py-2 text-center text-emerald-400 font-mono">{v}</td>)}
              </tr>
              <tr className="border-t border-slate-700 bg-amber-500/5">
                <td className="px-2 py-2 text-amber-200 font-bold">{t.combined}</td>
                {combined.map((v, i) => {
                  const inSpec = v >= spec.low[i] && v <= spec.high[i];
                  return <td key={i} className={`px-2 py-2 text-center font-mono font-bold ${inSpec ? "text-amber-200" : "text-rose-400"}`}>{v.toFixed(1)}</td>;
                })}
              </tr>
              <tr className="border-t border-slate-700">
                <td className="px-2 py-2 text-slate-400">{t.lowerLimit}</td>
                {spec.low.map((v, i) => <td key={i} className="px-2 py-2 text-center text-emerald-400 font-mono">{v}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Approved Designs */}
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-bold text-amber-300 flex items-center gap-2"><span>📚</span> {t.sectionUploads}</h2>
          <button onClick={() => setShowUpload(true)}
            className="bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 font-bold px-4 py-2 rounded-lg shadow-lg transition text-sm">
            {t.uploadBtn}
          </button>
        </div>
        {designs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">{t.noDesigns}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {designs.map((d) => (
              <div key={d.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 hover:border-amber-500/50 transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-amber-200 truncate text-sm" title={d.name}>{d.name}</div>
                    <div className="text-[10px] text-slate-400">Class {d.mixClass} • {d.bitumenPct.toFixed(1)}% AC</div>
                  </div>
                  <span className="text-lg shrink-0">
                    {d.fileType?.startsWith("image/") ? "🖼️" : d.fileType === "application/pdf" ? "📕" : d.fileName?.endsWith(".json") ? "📄" : "📎"}
                  </span>
                </div>
                {d.fileData && d.fileType?.startsWith("image/") && (
                  <img src={d.fileData} alt={d.name} className="w-full h-24 object-cover rounded mb-2 border border-slate-700" />
                )}
                <div className="text-[10px] text-slate-500 mb-2">
                  {t.uploadedAt}: {new Date(d.uploadedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setMixClass(d.mixClass);
                    setBatchSize(d.batchSize);
                    setBitumenPct(d.bitumenPct);
                    setAggregates(d.aggregates.map(a => ({...a})));
                  }} className="flex-1 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded transition">
                    ✓ {t.apply}
                  </button>
                  <button onClick={() => setDesigns(prev => prev.filter(x => x.id !== d.id))}
                    className="bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold py-1.5 px-3 rounded transition">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showUpload && <UploadModal t={t} onClose={() => setShowUpload(false)} onUpload={handleUpload} />}
    </div>
  );
}

function UploadModal({
  t, onClose, onUpload,
}: { t: Dict; onClose: () => void; onUpload: (file: File, name: string) => Promise<void>; }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!file) return;
    setBusy(true);
    await onUpload(file, name.trim() || file.name);
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-300 mb-4">{t.uploadBtn}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">{t.designName}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project-A Wearing Course"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-400 outline-none text-sm" />
          </div>
          <label className="block">
            <div className="border-2 border-dashed border-slate-600 hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer transition bg-slate-800/30">
              <div className="text-3xl mb-2">📁</div>
              {file ? <>
                <div className="text-amber-200 font-semibold text-sm">{file.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
              </> : <>
                <div className="text-slate-300 text-sm">Click to select file</div>
                <div className="text-[11px] text-slate-500 mt-1">{t.uploadHint}</div>
              </>}
              <input type="file" accept=".json,.pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, "")); } }} />
            </div>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={submit} disabled={!file || busy}
              className="flex-1 bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 disabled:opacity-50 text-slate-900 font-bold py-2 rounded-lg transition">
              {busy ? "..." : "✓ " + t.apply}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}
