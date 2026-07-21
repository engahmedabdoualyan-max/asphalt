import { useState } from "react";
import {
  useProduction, useTrucks, useInventory, useSpareParts, useRepairRequests,
  useCustomers, useOrders, useSettings,
  getTodayStats, getFleetStats, getInventoryAlerts, getSpareAlerts,
  generateOrderNo, exportAllData, clearAllData,
  type ProdEntry, type Truck, type SparePart, type Customer, type RepairRequest, type Order,
} from "../store";
import type { MixClass } from "../mixData";
import { MIX_CLASSES } from "../mixData";

/* ==================== SHARED UI ==================== */
function Stat({ label, value, icon, tone = "blue" }: { label: string; value: string; icon: string; tone?: string }) {
  const tones: Record<string, string> = {
    blue: "from-blue-600/20 to-blue-900/20 border-blue-500/40 text-blue-200",
    amber: "from-amber-600/20 to-orange-900/20 border-amber-500/40 text-amber-200",
    green: "from-emerald-600/20 to-emerald-900/20 border-emerald-500/40 text-emerald-200",
    red: "from-rose-600/20 to-rose-900/20 border-rose-500/40 text-rose-200",
    purple: "from-purple-600/20 to-purple-900/20 border-purple-500/40 text-purple-200",
  };
  return (
    <div className={`bg-gradient-to-br ${tones[tone] || tones.blue} border rounded-xl p-3 shadow-lg`}>
      <div className="flex items-center justify-between mb-1"><span className="text-[11px] opacity-80">{label}</span><span className="text-base">{icon}</span></div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function Section({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2"><span>{icon}</span>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ==================== DASHBOARD ==================== */
export function DashboardModule({ t, onNavigate }: { t: any; onNavigate: (m: string) => void }) {
  const [log] = useProduction();
  const [trucks] = useTrucks();
  const [inv] = useInventory();
  const [spares] = useSpareParts();
  const [repairs] = useRepairRequests();
  const [orders] = useOrders();
  const [settings] = useSettings();

  const prodStats = getTodayStats(log);
  const fleetStats = getFleetStats(trucks);
  const invAlerts = getInventoryAlerts(inv);
  const spareAlerts = getSpareAlerts(spares);
  const pendingRepairs = repairs.filter(r => r.status === "pending").length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  const modules = [
    { key: "qc", icon: "🧪", title: t.navQC, desc: t.modQCDesc, color: "from-purple-600 to-blue-700" },
    { key: "production", icon: "🏭", title: t.navProduction, desc: t.modProdDesc, color: "from-emerald-600 to-teal-700" },
    { key: "fleet", icon: "🚛", title: t.navFleet, desc: t.modFleetDesc, color: "from-amber-600 to-orange-700" },
    { key: "inventory", icon: "📦", title: t.navInventory, desc: t.modInvDesc, color: "from-cyan-600 to-teal-700" },
    { key: "spares", icon: "🔧", title: "Spare Parts", desc: "Workshop warehouse management", color: "from-rose-600 to-red-700" },
    { key: "repairs", icon: "🛠️", title: "Repairs", desc: "Repair requests & work orders", color: "from-indigo-600 to-purple-700" },
    { key: "customers", icon: "👥", title: "Customers", desc: "Customer & order management", color: "from-pink-600 to-rose-700" },
    { key: "reports", icon: "📊", title: t.navReports, desc: t.modRepDesc, color: "from-slate-600 to-slate-800" },
  ];

  return (
    <div className="space-y-5">
      <section className="bg-gradient-to-br from-slate-900 via-blue-950/50 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
        {settings.plantLogo && <img src={settings.plantLogo} alt="Logo" className="absolute top-4 left-4 w-16 h-16 object-contain opacity-20" />}
        <div className="text-xs text-amber-300 uppercase tracking-wider mb-1">{settings.plantName}</div>
        <h1 className="text-2xl md:text-3xl font-black text-white">{t.dashTitle}</h1>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-5">
          <Stat label={t.kpiBatchesToday} value={prodStats.batches.toString()} icon="🔢" tone="blue" />
          <Stat label={t.kpiTonsToday} value={prodStats.tons.toFixed(1)} icon="⚖️" tone="amber" />
          <Stat label={t.kpiFleetActive} value={fleetStats.active.toString()} icon="🚛" tone="green" />
          <Stat label="Pending Orders" value={pendingOrders.toString()} icon="📋" tone="purple" />
          <Stat label="Low Stock" value={(invAlerts.length + spareAlerts.length).toString()} icon="📦" tone={(invAlerts.length + spareAlerts.length) > 0 ? "red" : "green"} />
          <Stat label="Pending Repairs" value={pendingRepairs.toString()} icon="🔧" tone={pendingRepairs > 0 ? "red" : "green"} />
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map(m => (
          <button key={m.key} onClick={() => onNavigate(m.key)}
            className={`text-start bg-gradient-to-br ${m.color} p-5 rounded-2xl shadow-xl hover:scale-[1.02] hover:shadow-2xl transition group relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full" />
            <div className="text-4xl mb-2">{m.icon}</div>
            <h3 className="text-lg font-black text-white">{m.title}</h3>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">{m.desc}</p>
            <div className="mt-3 text-xs text-white/90 font-bold group-hover:translate-x-1 transition">{t.dashOpenModule} →</div>
          </button>
        ))}
      </section>
    </div>
  );
}

/* ==================== PRODUCTION ==================== */
export function ProductionModule({ t }: { t: any }) {
  const [log, setLog] = useProduction();
  const [inv, setInv] = useInventory();
  const [trucks] = useTrucks();
  const [mixClass, setMixClass] = useState<MixClass>("D");
  const [tons, setTons] = useState(2);
  const [bitumenPct, setBitumenPct] = useState(5.2);
  const [temp, setTemp] = useState(160);

  const def = MIX_CLASSES[mixClass];
  const stats = getTodayStats(log);

  const produce = () => {
    const aggUsed: Record<string, number> = {};
    const aggTotal = def.aggregates.reduce((s, a) => s + a.pct, 0);
    def.aggregates.forEach(a => { aggUsed[a.key] = (tons * (1 - bitumenPct / 100) * a.pct) / aggTotal; });
    aggUsed["bit"] = tons * (bitumenPct / 100);

    const entry: ProdEntry = {
      id: Date.now().toString(36), time: new Date().toISOString(), mixClass, tons, bitumenPct, temperature: temp,
      event: `${tons}t Class ${mixClass} @ ${bitumenPct}%`, aggUsed,
    };
    setLog([entry, ...log]);
    setInv(inv.map(i => ({ ...i, stock: Math.max(0, i.stock - (aggUsed[i.key] || 0)), consumedToday: i.consumedToday + (aggUsed[i.key] || 0) })));
  };

  return (
    <div className="space-y-5">
      <Section title={t.prodTitle} icon="🏭" action={
        <button onClick={produce} className="bg-gradient-to-l from-emerald-500 to-emerald-700 text-white font-bold px-5 py-2 rounded-lg shadow">{t.prodStartBatch}</button>
      }>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <Stat label={t.prodBatchCount} value={log.length.toString()} icon="🔢" tone="blue" />
          <Stat label={t.kpiTonsToday} value={stats.tons.toFixed(1)} icon="⚖️" tone="amber" />
          <Stat label="Current Mix" value={`Class ${mixClass}`} icon="🧪" tone="green" />
          <Stat label={t.kpiPlantStatus} value={t.plantRunning} icon="🟢" tone="green" />
          <Stat label="Active Trucks" value={getFleetStats(trucks).active.toString()} icon="🚛" tone="purple" />
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          <div><label className="block text-xs text-slate-400 mb-1">{t.classLabel}</label>
            <select value={mixClass} onChange={e => setMixClass(e.target.value as MixClass)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
              {(["A","B","C","D"] as MixClass[]).map(c => <option key={c} value={c}>Class {c}</option>)}
            </select></div>
          <div><label className="block text-xs text-slate-400 mb-1">{t.fleetTons}</label>
            <input type="number" min={0.5} max={10} step={0.5} value={tons} onChange={e => setTons(parseFloat(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">{t.bitumenPct}</label>
            <input type="number" min={2} max={10} step={0.1} value={bitumenPct} onChange={e => setBitumenPct(parseFloat(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">{t.prodTemp}</label>
            <input type="number" min={120} max={200} step={5} value={temp} onChange={e => setTemp(parseFloat(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 flex items-center justify-center">
            <span className="text-sm text-slate-300">{def.bitumen[0]}–{def.bitumen[1]}%</span>
          </div>
        </div>
      </Section>

      <Section title={t.prodLog} icon="📋">
        {log.length === 0 ? <div className="text-center py-8 text-slate-500">{t.prodLogEmpty}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs"><thead><tr className="bg-slate-800/70 text-amber-200">
              <th className="px-2 py-2 text-start">Time</th><th className="px-2 py-2">Class</th><th className="px-2 py-2">Tons</th><th className="px-2 py-2">AC%</th><th className="px-2 py-2">°C</th>
            </tr></thead><tbody>{log.slice(0,20).map((e: ProdEntry) => (
              <tr key={e.id} className="border-t border-slate-800">
                <td className="px-2 py-1.5 text-slate-400 text-[11px]">{new Date(e.time).toLocaleString()}</td>
                <td className="px-2 py-1.5 text-center text-amber-200 font-bold">{e.mixClass}</td>
                <td className="px-2 py-1.5 text-center text-emerald-300 font-mono">{e.tons}</td>
                <td className="px-2 py-1.5 text-center text-slate-300">{e.bitumenPct}</td>
                <td className="px-2 py-1.5 text-center text-slate-300">{e.temperature}</td>
              </tr>))}</tbody></table>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ==================== FLEET ==================== */
export function FleetModule({ t }: { t: any }) {
  const [trucks, setTrucks] = useTrucks();
  const [customers] = useCustomers();
  const [showAdd, setShowAdd] = useState(false);
  const fs = getFleetStats(trucks);

  return (
    <div className="space-y-5">
      <Section title={t.fleetTitle} icon="🚛" action={
        <button onClick={() => setShowAdd(true)} className="bg-gradient-to-l from-amber-500 to-orange-600 text-slate-900 font-bold px-4 py-2 rounded-lg shadow">{t.fleetAddTruck}</button>
      }>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Stat label={t.fleetTrucks} value={fs.total.toString()} icon="🚛" tone="blue" />
          <Stat label={t.fleetTotalDelivered} value={fs.delivered.toString()} icon="✅" tone="green" />
          <Stat label={t.fleetAvgDelivery} value={`${(fs.totalTons/Math.max(1,fs.delivered)).toFixed(1)}t`} icon="📊" tone="amber" />
        </div>
        {trucks.length === 0 ? <div className="text-center py-8 text-slate-500">{t.fleetNoTrucks}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm"><thead><tr className="bg-slate-800/70 text-amber-200">
              <th className="px-2 py-2 text-start">{t.fleetTruckNo}</th>
              <th className="px-2 py-2">{t.fleetDriver}</th>
              <th className="px-2 py-2">{t.fleetDest}</th>
              <th className="px-2 py-2 text-center">{t.fleetTons}</th>
              <th className="px-2 py-2 text-center">{t.fleetStatus}</th>
              <th className="px-2 py-2 text-center">{t.fleetActions}</th>
            </tr></thead><tbody>{trucks.map((tr: Truck) => {
              const statusMap: Record<string, {c: string, l: string}> = {
                loading: {c: "bg-blue-500/20 text-blue-300", l: t.fleetLoading},
                loaded: {c: "bg-amber-500/20 text-amber-300", l: t.fleetLoaded},
                dispatched: {c: "bg-purple-500/20 text-purple-300", l: t.fleetDispatched},
                delivered: {c: "bg-emerald-500/20 text-emerald-300", l: t.fleetDelivered},
              };
              const st = statusMap[tr.status] || statusMap.loading;
              return (
                <tr key={tr.id} className="border-t border-slate-800">
                  <td className="px-2 py-2 text-amber-200 font-mono font-bold">{tr.number}</td>
                  <td className="px-2 py-2 text-slate-300">{tr.driver}</td>
                  <td className="px-2 py-2 text-slate-300">{tr.destination}</td>
                  <td className="px-2 py-2 text-center text-emerald-300 font-mono">{tr.tons}</td>
                  <td className="px-2 py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.c}`}>{st.l}</span></td>
                  <td className="px-2 py-2 text-center"><div className="flex gap-1 justify-center">
                    {tr.status==="loading" && <button onClick={()=>setTrucks(trucks.map(x=>x.id===tr.id?{...x,status:"loaded",loadedAt:new Date().toISOString()}:x))} className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] px-2 py-1 rounded">✓</button>}
                    {tr.status==="loaded" && <button onClick={()=>setTrucks(trucks.map(x=>x.id===tr.id?{...x,status:"dispatched",dispatchedAt:new Date().toISOString()}:x))} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] px-2 py-1 rounded">{t.fleetDispatch}</button>}
                    {tr.status==="dispatched" && <button onClick={()=>setTrucks(trucks.map(x=>x.id===tr.id?{...x,status:"delivered",deliveredAt:new Date().toISOString()}:x))} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-1 rounded">{t.fleetDeliver}</button>}
                    <button onClick={()=>setTrucks(trucks.filter(x=>x.id!==tr.id))} className="bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] px-2 py-1 rounded">🗑</button>
                  </div></td>
                </tr>);
            })}</tbody></table>
          </div>
        )}
      </Section>
      {showAdd && <AddTruckModal t={t} customers={customers} onClose={()=>setShowAdd(false)} onAdd={tr=>{setTrucks([tr,...trucks]);setShowAdd(false)}} />}
    </div>
  );
}

function AddTruckModal({ t, customers, onClose, onAdd }: { t: any; customers: Customer[]; onClose: ()=>void; onAdd: (tr: Truck)=>void }) {
  const [n,setN] = useState(""); const [d,setD] = useState(""); const [p,setP] = useState("");
  const [dest,setDest] = useState(""); const [tons,setTons] = useState(15);
  const [mc,setMc] = useState<MixClass>("D"); const [cid,setCid] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e=>e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-300 mb-4">{t.fleetAddTruck}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">{t.fleetTruckNo}</label><input type="text" value={n} onChange={e=>setN(e.target.value)} placeholder="ABC-1234" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">{t.fleetDriver}</label><input type="text" value={d} onChange={e=>setD(e.target.value)} placeholder="Name" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div><label className="block text-xs text-slate-400 mb-1">Phone</label><input type="text" value={p} onChange={e=>setP(e.target.value)} placeholder="01xxxxxxxxx" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">{t.fleetDest}</label><input type="text" value={dest} onChange={e=>setDest(e.target.value)} placeholder="Destination" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">{t.fleetTons}</label><input type="number" min={1} max={40} step={0.5} value={tons} onChange={e=>setTons(parseFloat(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Class</label>
              <select value={mc} onChange={e=>setMc(e.target.value as MixClass)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
                {(["A","B","C","D"] as MixClass[]).map(c=><option key={c} value={c}>Class {c}</option>)}
              </select></div>
            <div><label className="block text-xs text-slate-400 mb-1">Customer</label>
              <select value={cid} onChange={e=>setCid(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
                <option value="">—</option>
                {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>n.trim()&&onAdd({id:Date.now().toString(36),number:n.trim(),driver:d.trim()||"—",phone:p.trim(),destination:dest.trim()||"—",tons,mixClass:mc,customerId:cid,status:"loading",createdAt:new Date().toISOString()})} className="flex-1 bg-gradient-to-l from-amber-500 to-orange-600 text-slate-900 font-bold py-2 rounded-lg">✓ {t.apply}</button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== INVENTORY ==================== */
export function InventoryModule({ t }: { t: any }) {
  const [inv, setInv] = useInventory();
  const [settings] = useSettings();
  const [refillAmt, setRefillAmt] = useState<Record<string, number>>({});
  const alerts = getInventoryAlerts(inv);
  const totalValue = inv.reduce((s,i) => s + i.stock * i.pricePerUnit, 0);

  const refill = (id: string) => {
    const amt = refillAmt[id] || 0;
    if (amt <= 0) return;
    setInv(inv.map(i => i.id === id ? {...i, stock: Math.min(i.capacity, i.stock + amt), lastRefill: new Date().toISOString()} : i));
    setRefillAmt({...refillAmt, [id]: 0});
  };

  const categories = [...new Set(inv.map(i => i.category))];

  return (
    <Section title={t.invTitle} icon="📦" action={
      <div className="text-sm text-slate-300">Total Value: <span className="font-bold text-amber-200">{(totalValue/1000).toFixed(0)}K {settings.currency || "EGP"}</span></div>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total Items" value={inv.length.toString()} icon="📦" tone="blue" />
        <Stat label="Total Stock" value={`${inv.reduce((s,i)=>s+i.stock,0).toFixed(0)}t`} icon="⚖️" tone="amber" />
        <Stat label="Low Stock" value={alerts.length.toString()} icon="⚠️" tone={alerts.length>0?"red":"green"} />
        <Stat label="Categories" value={categories.length.toString()} icon="📁" tone="purple" />
      </div>
      {categories.map(cat => (
        <div key={cat} className="mb-4">
          <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase">{cat}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {inv.filter(i => i.category === cat).map(item => {
              const pct = (item.stock / item.capacity) * 100;
              const isLow = item.stock < item.minStock;
              return (
                <div key={item.id} className={`bg-slate-800/50 border rounded-xl p-3 ${isLow ? "border-rose-500/50" : "border-slate-700"}`}>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-amber-200 text-sm">{item.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isLow ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>{isLow ? "LOW" : "OK"}</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-1 flex justify-between">
                    <span>{item.stock.toFixed(1)} / {item.capacity} {item.unit}</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="bg-slate-900 rounded-full h-2 overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${isLow ? "bg-rose-500" : "bg-emerald-500"}`} style={{width:`${Math.min(100,pct)}%`}} />
                  </div>
                  <div className="flex gap-2">
                    <input type="number" min={0} step={1} value={refillAmt[item.id]||""} placeholder="Refill (t)" onChange={e=>setRefillAmt({...refillAmt,[item.id]:parseFloat(e.target.value)||0})} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs" />
                    <button onClick={()=>refill(item.id)} className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded">{t.invRefill}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Section>
  );
}

/* ==================== SPARE PARTS ==================== */
export function SparesModule(_props: { t: any }) {
  const [parts, setParts] = useSpareParts();
  const [settings] = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const alerts = getSpareAlerts(parts);
  const categories = [...new Set(parts.map(p => p.category))];

  return (
    <Section title="🔧 Spare Parts" icon="🔧" action={
      <button onClick={()=>setShowAdd(true)} className="bg-gradient-to-l from-rose-500 to-rose-700 text-white font-bold px-4 py-2 rounded-lg shadow text-sm">+ Add Part</button>
    }>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Total Parts" value={parts.length.toString()} icon="🔧" tone="blue" />
        <Stat label="Total Value" value={`${(parts.reduce((s,p)=>s+p.stock*p.price,0)/1000).toFixed(0)}K`} icon="💰" tone="amber" />
        <Stat label="Low Stock" value={alerts.length.toString()} icon="⚠️" tone={alerts.length>0?"red":"green"} />
      </div>
      {categories.map(cat => (
        <div key={cat} className="mb-3">
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase">{cat}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs"><thead><tr className="bg-slate-800/70 text-amber-200">
              <th className="px-2 py-2 text-start">Code</th><th className="px-2 py-2 text-start">Name</th>
              <th className="px-2 py-2 text-center">Stock</th><th className="px-2 py-2 text-center">Min</th>
              <th className="px-2 py-2 text-center">Price</th><th className="px-2 py-2 text-start">Location</th>
            </tr></thead><tbody>{parts.filter(p=>p.category===cat).map(p => {
              const isLow = p.stock < p.minStock;
              return (
                <tr key={p.id} className={`border-t border-slate-800 ${isLow ? "bg-rose-500/5" : ""}`}>
                  <td className="px-2 py-1.5 text-slate-300 font-mono">{p.code}</td>
                  <td className="px-2 py-1.5 text-slate-200 font-semibold">{p.name}</td>
                  <td className={`px-2 py-1.5 text-center font-mono font-bold ${isLow?"text-rose-300":"text-emerald-300"}`}>{p.stock} {p.unit}</td>
                  <td className="px-2 py-1.5 text-center text-slate-400">{p.minStock}</td>
                  <td className="px-2 py-1.5 text-center text-amber-200">{p.price} {settings.currency || "EGP"}</td>
                  <td className="px-2 py-1.5 text-slate-400">{p.location}</td>
                </tr>
              );
            })}</tbody></table>
          </div>
        </div>
      ))}
      {showAdd && <AddSpareModal onClose={()=>setShowAdd(false)} onAdd={p=>{setParts([p,...parts]);setShowAdd(false)}} />}
    </Section>
  );
}

function AddSpareModal({ onClose, onAdd }: { onClose: ()=>void; onAdd: (p: SparePart)=>void }) {
  const [code,setCode] = useState(""); const [name,setName] = useState("");
  const [cat,setCat] = useState("Bearings"); const [stock,setStock] = useState(1);
  const [min,setMin] = useState(1); const [unit,setUnit] = useState("pcs");
  const [price,setPrice] = useState(0); const [loc,setLoc] = useState("");
  const [supp,setSupp] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-rose-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e=>e.stopPropagation()}>
        <h3 className="text-lg font-bold text-rose-300 mb-4">+ Add Spare Part</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Code</label><input type="text" value={code} onChange={e=>setCode(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Category</label>
              <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
                {["Bearings","Belts","Filters","Oils","Electrical","Mechanical","Other"].map(c=><option key={c}>{c}</option>)}
              </select></div>
            <div><label className="block text-xs text-slate-400 mb-1">Stock</label><input type="number" min={0} value={stock} onChange={e=>setStock(parseInt(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Min Stock</label><input type="number" min={0} value={min} onChange={e=>setMin(parseInt(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Unit</label><input type="text" value={unit} onChange={e=>setUnit(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Price</label><input type="number" min={0} value={price} onChange={e=>setPrice(parseFloat(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Location</label><input type="text" value={loc} onChange={e=>setLoc(e.target.value)} placeholder="Shelf A1" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div><label className="block text-xs text-slate-400 mb-1">Supplier</label><input type="text" value={supp} onChange={e=>setSupp(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>code.trim()&&name.trim()&&onAdd({id:Date.now().toString(36),code:code.trim(),name:name.trim(),category:cat,stock,minStock:min,unit,price,location:loc||"—",supplier:supp||"—"})} className="flex-1 bg-gradient-to-l from-rose-500 to-rose-700 text-white font-bold py-2 rounded-lg">✓ Add</button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== REPAIR REQUESTS ==================== */
export function RepairsModule(_props: { t: any }) {
  const [repairs, setRepairs] = useRepairRequests();
  const [showAdd, setShowAdd] = useState(false);

  const approve = (id: string) => setRepairs(repairs.map(r => r.id === id ? {...r, status: "approved", approvedAt: new Date().toISOString()} : r));
  const complete = (id: string) => setRepairs(repairs.map(r => r.id === id ? {...r, status: "completed", completedAt: new Date().toISOString()} : r));

  const statusColor = (s: string) => {
    const m: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-300", approved: "bg-blue-500/20 text-blue-300",
      "in-progress": "bg-purple-500/20 text-purple-300", completed: "bg-emerald-500/20 text-emerald-300", rejected: "bg-rose-500/20 text-rose-300",
    };
    return m[s] || "bg-slate-500/20 text-slate-300";
  };

  return (
    <Section title="🛠️ Repairs" icon="🛠️" action={
      <button onClick={()=>setShowAdd(true)} className="bg-gradient-to-l from-indigo-500 to-purple-600 text-white font-bold px-4 py-2 rounded-lg shadow text-sm">+ New Request</button>
    }>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Stat label="Pending" value={repairs.filter(r=>r.status==="pending").length.toString()} icon="⏳" tone="amber" />
        <Stat label="Approved" value={repairs.filter(r=>r.status==="approved").length.toString()} icon="✅" tone="blue" />
        <Stat label="In Progress" value={repairs.filter(r=>r.status==="in-progress").length.toString()} icon="🔧" tone="purple" />
        <Stat label="Completed" value={repairs.filter(r=>r.status==="completed").length.toString()} icon="✓" tone="green" />
      </div>
      {repairs.length === 0 ? <div className="text-center py-8 text-slate-500">No repair requests yet.</div> : (
        <div className="space-y-2">
          {repairs.map(r => (
            <div key={r.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-200">{r.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor(r.status)}`}>{r.status}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.priority==="urgent"?"bg-rose-600/30 text-rose-300":r.priority==="high"?"bg-amber-600/30 text-amber-300":"bg-slate-600/50 text-slate-300"}`}>{r.priority}</span>
                  </div>
                  <div className="text-xs text-slate-400">{r.equipment} • {r.description}</div>
                  <div className="text-[10px] text-slate-500 mt-1">By: {r.requestedBy} • {new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.status==="pending" && <button onClick={()=>approve(r.id)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded">Approve</button>}
                  {r.status==="approved" && <button onClick={()=>setRepairs(repairs.map(x=>x.id===r.id?{...x,status:"in-progress"}:x))} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] px-2 py-1 rounded">Start</button>}
                  {r.status==="in-progress" && <button onClick={()=>complete(r.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-1 rounded">Complete</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddRepairModal onClose={()=>setShowAdd(false)} onAdd={r=>{setRepairs([r,...repairs]);setShowAdd(false)}} />}
    </Section>
  );
}

function AddRepairModal({ onClose, onAdd }: { onClose: ()=>void; onAdd: (r: RepairRequest)=>void }) {
  const [title,setTitle] = useState(""); const [equip,setEquip] = useState("");
  const [prio,setPrio] = useState<"urgent"|"high"|"medium"|"low">("medium");
  const [desc,setDesc] = useState(""); const [req,setReq] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e=>e.stopPropagation()}>
        <h3 className="text-lg font-bold text-indigo-300 mb-4">+ New Repair Request</h3>
        <div className="space-y-3">
          <div><label className="block text-xs text-slate-400 mb-1">Title</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Equipment</label><input type="text" value={equip} onChange={e=>setEquip(e.target.value)} placeholder="Dryer Drum" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Priority</label>
              <select value={prio} onChange={e=>setPrio(e.target.value as any)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
                <option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select></div>
          </div>
          <div><label className="block text-xs text-slate-400 mb-1">Description</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">Requested By</label><input type="text" value={req} onChange={e=>setReq(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>title.trim()&&onAdd({id:Date.now().toString(36),title:title.trim(),equipment:equip||"General",priority:prio,description:desc,requestedBy:req||"—",status:"pending",createdAt:new Date().toISOString(),parts:[]})} className="flex-1 bg-gradient-to-l from-indigo-500 to-purple-600 text-white font-bold py-2 rounded-lg">✓ Submit</button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== CUSTOMERS ==================== */
export function CustomersModule(_props: { t: any }) {
  const [customers, setCustomers] = useCustomers();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <Section title="👥 Customers" icon="👥" action={
      <button onClick={()=>setShowAdd(true)} className="bg-gradient-to-l from-pink-500 to-rose-600 text-white font-bold px-4 py-2 rounded-lg shadow text-sm">+ Add Customer</button>
    }>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Total Customers" value={customers.length.toString()} icon="👥" tone="blue" />
        <Stat label="Total Orders" value={customers.reduce((s,c)=>s+c.totalOrders,0).toString()} icon="📋" tone="amber" />
        <Stat label="Total Tons" value={customers.reduce((s,c)=>s+c.totalTons,0).toFixed(0)} icon="⚖️" tone="green" />
      </div>
      {customers.length === 0 ? <div className="text-center py-8 text-slate-500">No customers yet.</div> : (
        <div className="grid md:grid-cols-2 gap-3">
          {customers.map(c => (
            <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-pink-500/30 transition">
              <div className="flex justify-between mb-2">
                <div><div className="font-bold text-pink-200">{c.name}</div><div className="text-xs text-slate-400">{c.company}</div></div>
                <div className="text-right text-[10px] text-slate-500">{c.totalOrders} orders • {c.totalTons}t</div>
              </div>
              <div className="text-xs text-slate-400 mb-1">📞 {c.phone} • ✉️ {c.email}</div>
              <div className="text-[11px] text-slate-500">{c.address}, {c.city}</div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddCustomerModal onClose={()=>setShowAdd(false)} onAdd={c=>{setCustomers([c,...customers]);setShowAdd(false)}} />}
    </Section>
  );
}

function AddCustomerModal({ onClose, onAdd }: { onClose: ()=>void; onAdd: (c: Customer)=>void }) {
  const [name,setName] = useState(""); const [company,setCompany] = useState("");
  const [phone,setPhone] = useState(""); const [email,setEmail] = useState("");
  const [address,setAddress] = useState(""); const [city,setCity] = useState("");
  const [notes,setNotes] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-pink-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e=>e.stopPropagation()}>
        <h3 className="text-lg font-bold text-pink-300 mb-4">+ Add Customer</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Company</label><input type="text" value={company} onChange={e=>setCompany(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Phone</label><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">City</label><input type="text" value={city} onChange={e=>setCity(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Credit Limit</label><input type="number" min={0} defaultValue={100000} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div><label className="block text-xs text-slate-400 mb-1">Address</label><input type="text" value={address} onChange={e=>setAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={1} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none" /></div>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>name.trim()&&onAdd({id:Date.now().toString(36),name:name.trim(),company:company||"—",phone:phone||"—",email:email||"—",address:address||"—",city:city||"—",notes,createdAt:new Date().toISOString(),totalOrders:0,totalTons:0,creditLimit:100000})} className="flex-1 bg-gradient-to-l from-pink-500 to-rose-600 text-white font-bold py-2 rounded-lg">✓ Add</button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== ORDERS ==================== */
export function OrdersModule(_props: { t: any }) {
  const [orders, setOrders] = useOrders();
  const [customers] = useCustomers();
  const [settings] = useSettings();
  const [showAdd, setShowAdd] = useState(false);

  const statusColor = (s: string) => {
    const m: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-300", confirmed: "bg-blue-500/20 text-blue-300",
      "in-production": "bg-purple-500/20 text-purple-300", dispatched: "bg-indigo-500/20 text-indigo-300",
      delivered: "bg-emerald-500/20 text-emerald-300", cancelled: "bg-rose-500/20 text-rose-300",
    };
    return m[s] || "bg-slate-500/20 text-slate-300";
  };

  const getCustomer = (id: string) => customers.find(c => c.id === id);

  return (
    <Section title="📋 Orders" icon="📋" action={
      <button onClick={()=>setShowAdd(true)} className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white font-bold px-4 py-2 rounded-lg shadow text-sm">+ New Order</button>
    }>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Stat label="Pending" value={orders.filter(o=>o.status==="pending").length.toString()} icon="⏳" tone="amber" />
        <Stat label="In Production" value={orders.filter(o=>o.status==="in-production").length.toString()} icon="🏭" tone="purple" />
        <Stat label="Dispatched" value={orders.filter(o=>o.status==="dispatched").length.toString()} icon="🚛" tone="indigo" />
        <Stat label="Delivered" value={orders.filter(o=>o.status==="delivered").length.toString()} icon="✅" tone="green" />
      </div>
      {orders.length === 0 ? <div className="text-center py-8 text-slate-500">No orders yet.</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs"><thead><tr className="bg-slate-800/70 text-amber-200">
            <th className="px-2 py-2 text-start">Order No.</th><th className="px-2 py-2">Customer</th>
            <th className="px-2 py-2">Class</th><th className="px-2 py-2 text-center">Tons</th>
            <th className="px-2 py-2 text-center">Amount</th><th className="px-2 py-2 text-center">Status</th><th className="px-2 py-2">Delivery</th>
          </tr></thead><tbody>{orders.map(o => {
            const cust = getCustomer(o.customerId);
            return (
              <tr key={o.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                <td className="px-2 py-2 text-amber-200 font-mono font-bold">{o.orderNo}</td>
                <td className="px-2 py-2 text-slate-300">{cust?.name || "—"}</td>
                <td className="px-2 py-2 text-center text-amber-200">{o.mixClass}</td>
                <td className="px-2 py-2 text-center text-emerald-300 font-mono">{o.tons}</td>
                <td className="px-2 py-2 text-center text-amber-200">{o.totalAmount.toLocaleString()}</td>
                <td className="px-2 py-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor(o.status)}`}>{o.status}</span></td>
                <td className="px-2 py-2 text-slate-400">{o.deliveryDate}</td>
              </tr>
            );
          })}</tbody></table>
        </div>
      )}
      {showAdd && <AddOrderModal customers={customers} currency={settings.currency || "EGP"} onClose={()=>setShowAdd(false)} onAdd={o=>{setOrders([o,...orders]);setShowAdd(false)}} />}
    </Section>
  );
}

function AddOrderModal({ customers, currency, onClose, onAdd }: { customers: Customer[]; currency: string; onClose: ()=>void; onAdd: (o: Order)=>void }) {
  const [cid,setCid] = useState(""); const [mc,setMc] = useState<MixClass>("D");
  const [tons,setTons] = useState(100); const [price,setPrice] = useState(850);
  const [date,setDate] = useState(new Date().toISOString().split("T")[0]);
  const [addr,setAddr] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e=>e.stopPropagation()}>
        <h3 className="text-lg font-bold text-emerald-300 mb-4">+ New Order</h3>
        <div className="space-y-3">
          <div><label className="block text-xs text-slate-400 mb-1">Customer</label>
            <select value={cid} onChange={e=>setCid(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
              <option value="">Select customer...</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
            </select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Mix Class</label>
              <select value={mc} onChange={e=>setMc(e.target.value as MixClass)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white">
                {(["A","B","C","D"] as MixClass[]).map(c=><option key={c} value={c}>Class {c}</option>)}
              </select></div>
            <div><label className="block text-xs text-slate-400 mb-1">Tons</label><input type="number" min={1} value={tons} onChange={e=>setTons(parseFloat(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Price/t</label><input type="number" min={0} step={10} value={price} onChange={e=>setPrice(parseFloat(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">Delivery Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Total Amount</label>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-amber-200 font-bold">{(tons*price).toLocaleString()} {currency}</div></div>
          </div>
          <div><label className="block text-xs text-slate-400 mb-1">Delivery Address</label><input type="text" value={addr} onChange={e=>setAddr(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white" /></div>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>cid&&onAdd({id:Date.now().toString(36),orderNo:generateOrderNo(),customerId:cid,mixClass:mc,tons,pricePerTon:price,totalAmount:tons*price,status:"pending",deliveryDate:date,deliveryAddress:addr||"—",notes:"",createdAt:new Date().toISOString()})} className="flex-1 bg-gradient-to-l from-emerald-500 to-teal-600 text-white font-bold py-2 rounded-lg">✓ Create</button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== REPORTS ==================== */
export function ReportsModule(_props: { t: any }) {
  const [log] = useProduction();
  const [trucks] = useTrucks();
  const [inv] = useInventory();
  const [orders] = useOrders();
  const [customers] = useCustomers();
  const [settings] = useSettings();

  const stats = getTodayStats(log);
  const fs = getFleetStats(trucks);
  const invVal = inv.reduce((s,i)=>s+i.stock*i.pricePerUnit,0);
  const ordersVal = orders.reduce((s,o)=>s+o.totalAmount,0);

  const exportJSON = () => exportAllData({ plant: settings, production: log, trucks, inventory: inv, orders, customers, exportedAt: new Date().toISOString() });
  const clear = () => { if(confirm("Clear all data?")){ clearAllData(); location.reload(); } };

  const printReport = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html dir="${document.documentElement.dir}"><head><title>${settings.plantName} - Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;direction:${document.documentElement.dir}}
        h1{color:#d97706} h2{color:#3b82f6;border-bottom:1px solid #ccc;padding-bottom:5px}
        table{width:100%;border-collapse:collapse;margin:15px 0} th,td{border:1px solid #ccc;padding:8px;text-align:center}
        th{background:#1e293b;color:#fbbf24} .stat{display:inline-block;margin:10px;padding:15px;border-radius:8px;background:#f3f4f6}
      </style></head><body>
      <h1>🏗️ ${settings.plantName}</h1>
      <p>Report generated: ${new Date().toLocaleString()}</p>
      <h2>Production Summary</h2>
      <p class="stat"><strong>Batches:</strong> ${log.length}</p>
      <p class="stat"><strong>Total Tons:</strong> ${stats.tons.toFixed(1)}</p>
      <h2>Inventory Value</h2>
      <p><strong>Total Stock Value:</strong> ${invVal.toLocaleString()} ${settings.currency}</p>
      <h2>Orders Summary</h2>
      <p class="stat"><strong>Orders:</strong> ${orders.length}</p>
      <p class="stat"><strong>Total Revenue:</strong> ${ordersVal.toLocaleString()} ${settings.currency}</p>
      <h2>Recent Batches</h2>
      <table><tr><th>Time</th><th>Class</th><th>Tons</th><th>AC%</th></tr>
      ${log.slice(0,10).map(e=>`<tr><td>${new Date(e.time).toLocaleString()}</td><td>${e.mixClass}</td><td>${e.tons}</td><td>${e.bitumenPct}</td></tr>`).join("")}
      </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Section title="Reports & Export" icon="📊" action={
      <div className="flex gap-2">
        <button onClick={printReport} className="bg-gradient-to-l from-blue-500 to-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow text-sm">🖨️ Print / PDF</button>
        <button onClick={exportJSON} className="bg-gradient-to-l from-emerald-500 to-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow text-sm">💾 Export JSON</button>
        <button onClick={clear} className="bg-gradient-to-l from-rose-600 to-rose-800 text-white font-bold px-4 py-2 rounded-lg shadow text-sm">🗑 Clear All</button>
      </div>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Total Batches" value={log.length.toString()} icon="🔢" tone="blue" />
        <Stat label="Total Tons" value={stats.tons.toFixed(0)} icon="⚖️" tone="amber" />
        <Stat label="Dispatched" value={fs.delivered.toString()} icon="🚛" tone="green" />
        <Stat label="Orders Value" value={`${(ordersVal/1000).toFixed(0)}K`} icon="💰" tone="purple" />
      </div>
    </Section>
  );
}

/* ==================== SETTINGS ==================== */
export function SettingsModule(_props: { t: any }) {
  const [settings, setSettings] = useSettings();
  const [name, setName] = useState(settings.plantName);
  const [logo, setLogo] = useState(settings.plantLogo || "");
  const [country, setCountry] = useState(settings.country || "EG");
  const [currency, setCurrency] = useState(settings.currency || "EGP");
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [saved, setSaved] = useState(false);

  const locations = [
    { code: "EG", label: "Egypt", currency: "EGP" },
    { code: "SA", label: "Saudi Arabia", currency: "SAR" },
    { code: "AE", label: "United Arab Emirates", currency: "AED" },
    { code: "QA", label: "Qatar", currency: "QAR" },
    { code: "KW", label: "Kuwait", currency: "KWD" },
    { code: "OM", label: "Oman", currency: "OMR" },
    { code: "BH", label: "Bahrain", currency: "BHD" },
    { code: "US", label: "United States", currency: "USD" },
  ];

  const handleCountryChange = (code: string) => {
    const selected = locations.find((loc) => loc.code === code);
    setCountry(code);
    if (selected) setCurrency(selected.currency);
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };

  const save = () => {
    setSettings({ ...settings, plantName: name, plantLogo: logo, country, currency, address, phone, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="Settings" icon="⚙️">
      <div className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-semibold">Plant Name</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-amber-400 outline-none" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">Plant Location</label>
            <select value={country} onChange={(e) => handleCountryChange(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-amber-400 outline-none">
              {locations.map((loc) => <option key={loc.code} value={loc.code}>{loc.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-semibold">Currency</label>
            <div className="w-full bg-slate-950/60 border border-amber-500/30 rounded-lg px-4 py-2.5 text-amber-200 font-black">
              {currency}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Automatically selected from plant location.</div>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-semibold">Plant Logo</label>
          <div className="flex items-center gap-4">
            {logo && <img src={logo} alt="Logo" className="w-16 h-16 object-contain bg-white rounded-lg p-1" />}
            <label className="cursor-pointer bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-300 hover:border-amber-400 transition">
              {logo ? "Change Logo" : "Upload Logo"}
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
            {logo && <button onClick={()=>setLogo("")} className="text-rose-400 text-sm">Remove</button>}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm text-slate-300 mb-2 font-semibold">Address</label><input type="text" value={address} onChange={e=>setAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
          <div><label className="block text-sm text-slate-300 mb-2 font-semibold">Phone</label><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
        </div>
        <div><label className="block text-sm text-slate-300 mb-2 font-semibold">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white" /></div>
        <button onClick={save} className="bg-gradient-to-l from-amber-500 to-orange-600 text-slate-900 font-bold px-5 py-2.5 rounded-lg shadow">Save Settings</button>
        {saved && <div className="text-emerald-300 text-sm font-semibold">✓ Saved</div>}
      </div>
    </Section>
  );
}
