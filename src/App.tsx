import { useEffect, useState } from "react";
import { DICTS, LANG_META, type Lang } from "./i18n";
import { GuidelineMix } from "./components/GuidelineMix";
import { DesignYourMix } from "./components/DesignYourMix";
import {
  DashboardModule, ProductionModule, FleetModule,
  InventoryModule, SparesModule, RepairsModule,
  CustomersModule, OrdersModule, ReportsModule, SettingsModule,
} from "./components/Modules";
import { MarketingModule } from "./components/MarketingModule";
import { useSettings } from "./store";

type Module = "dashboard" | "qc" | "production" | "fleet" | "inventory" | "spares" | "repairs" | "customers" | "orders" | "marketing" | "reports" | "settings";
type QCTab = "guideline" | "design" | "approvals";

const LANG_KEY = "asphalt_lang_v1";
const MODULE_KEY = "asphalt_module_v1";
const VALID_MODULES: Module[] = ["dashboard", "qc", "production", "fleet", "inventory", "spares", "repairs", "customers", "orders", "marketing", "reports", "settings"];

/* ====== APPROVALS MODULE (Certifications) ====== */
function ApprovalsModule({ t }: { t: any }) {
  const LS = "asphalt_appr_v1";
  const [certs, setCerts] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch { return []; } });
  const [showAdd, setShowAdd] = useState(false);

  const addCert = (c: any) => { const nc = [{ ...c, id: Date.now().toString(36) }, ...certs]; setCerts(nc); localStorage.setItem(LS, JSON.stringify(nc)); setShowAdd(false); };
  const remove = (id: string) => { const nc = certs.filter((c: any) => c.id !== id); setCerts(nc); localStorage.setItem(LS, JSON.stringify(nc)); };
  const statusColor = (s: string) => s === "Approved" ? "bg-emerald-500/20 text-emerald-300" : s === "Pending" ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300";

  const [viewFile, setViewFile] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-amber-300">{t.apprTitle}</h2>
            <p className="text-xs text-slate-400 mt-1">{t.apprHint}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-gradient-to-l from-amber-500 to-orange-600 text-slate-900 font-bold px-4 py-2 rounded-lg shadow transition text-sm">{t.apprAddCert}</button>
        </div>

        {certs.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">{t.apprNoCerts}</div> : (
          <div className="space-y-3">
            {certs.map((c: any) => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-amber-500/30 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-amber-200 text-sm">{c.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor(c.status)}`}>
                        {c.status === "Approved" ? t.apprApproved : c.status === "Pending" ? t.apprPending : t.apprExpired}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{c.type} • {c.date}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{c.fileName} ({(c.fileSize / 1024).toFixed(1)} KB)</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.fileData && <button onClick={() => setViewFile(c.fileData)} className="bg-blue-600/80 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded">{t.apprView}</button>}
                    <button onClick={() => remove(c.id)} className="bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] px-2 py-1 rounded">{t.apprRemove}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAdd && <AddCertModal t={t} onClose={() => setShowAdd(false)} onAdd={addCert} />}

      {/* File viewer modal */}
      {viewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewFile(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-amber-300 font-bold">{t.apprView}</h3>
              <button onClick={() => setViewFile(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            {viewFile.startsWith("data:image") ? (
              <img src={viewFile} alt="Certification" className="w-full rounded-lg" />
            ) : viewFile.startsWith("data:application/pdf") ? (
              <iframe src={viewFile} className="w-full h-[70vh] rounded-lg" title="PDF" />
            ) : (
              <pre className="text-xs text-slate-300 overflow-auto max-h-[70vh] p-4 bg-slate-800 rounded-lg" dir="ltr">{atob(viewFile.split(",")[1] || "")}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddCertModal({ t, onClose, onAdd }: { t: any; onClose: () => void; onAdd: (c: any) => void }) {
  const [name, setName] = useState(""); const [type, setType] = useState(t.apprTypes[0]);
  const [status, setStatus] = useState("Approved"); const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string>("");

  const handleFile = async (f: File) => {
    setFile(f);
    if (f.size < 5_000_000) {
      const reader = new FileReader();
      reader.onload = () => setFileData(String(reader.result));
      reader.readAsDataURL(f);
    }
  };

  const submit = () => {
    if (!name.trim() || !file) return;
    onAdd({ name, type, status, fileName: file.name, fileSize: file.size, fileType: file.type, fileData, date: new Date().toLocaleDateString() });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-300 mb-4">{t.apprAddCert}</h3>
        <div className="space-y-3">
          <div><label className="block text-xs text-slate-400 mb-1">{t.apprName}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-400 outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1">{t.apprType}</label><select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">{t.apprTypes.map((tp: string) => <option key={tp}>{tp}</option>)}</select></div>
            <div><label className="block text-xs text-slate-400 mb-1">{t.apprStatus}</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"><option>Approved</option><option>Pending</option><option>Expired</option></select></div>
          </div>
          <label className="block">
            <div className="border-2 border-dashed border-slate-600 hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer transition bg-slate-800/30">
              <div className="text-3xl mb-2">📁</div>
              {file ? <><div className="text-amber-200 font-semibold text-sm">{file.name}</div><div className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</div></> : <><div className="text-slate-300 text-sm">{t.apprFile}</div><div className="text-[11px] text-slate-500">PDF, JPG, PNG, JSON</div></>}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.json" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={submit} disabled={!name.trim() || !file} className="flex-1 bg-gradient-to-l from-amber-500 to-orange-600 disabled:opacity-50 text-slate-900 font-bold py-2 rounded-lg transition">✓ {t.apply}</button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => { const s = localStorage.getItem(LANG_KEY) as Lang | null; return s && DICTS[s] ? s : "en"; });
  const t = DICTS[lang];
  const [settings] = useSettings();
  const [module, setModule] = useState<Module>(() => {
    const saved = localStorage.getItem(MODULE_KEY) as Module | null;
    return saved && VALID_MODULES.includes(saved) ? saved : "dashboard";
  });
  const [qcTab, setQcTab] = useState<QCTab>("guideline");

  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = LANG_META[lang].dir; document.title = t.title; localStorage.setItem(LANG_KEY, lang); }, [lang, t.title]);
  useEffect(() => { localStorage.setItem(MODULE_KEY, module); }, [module]);

  const navItems: { key: Module; label: string; icon: string }[] = [
    { key: "dashboard", label: t.navDashboard, icon: "🏠" },
    { key: "qc", label: t.navQC, icon: "🧪" },
    { key: "production", label: t.navProduction, icon: "🏭" },
    { key: "fleet", label: t.navFleet, icon: "🚛" },
    { key: "inventory", label: t.navInventory, icon: "📦" },
    { key: "spares", label: "Spare Parts", icon: "🔧" },
    { key: "repairs", label: "Repairs", icon: "🛠️" },
    { key: "customers", label: "Customers", icon: "👥" },
    { key: "orders", label: "Orders", icon: "📋" },
    { key: "marketing", label: "Marketing", icon: "📢" },
    { key: "reports", label: t.navReports, icon: "📊" },
    { key: "settings", label: t.navSettings, icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 lg:pl-72">
      <header className="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 border-b border-amber-500/40 shadow-lg sticky top-0 z-40 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-amber-500/30 lg:overflow-y-auto">
        <div className="px-4 md:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 lg:h-auto lg:flex-col lg:items-stretch lg:justify-start lg:gap-5 lg:p-5">
          <div className="flex items-center gap-3 cursor-pointer lg:flex-col lg:items-start" onClick={() => setModule("dashboard")}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-2xl shadow-lg shrink-0 overflow-hidden">
              {settings.plantLogo ? <img src={settings.plantLogo} alt="Plant logo" className="h-full w-full object-contain bg-white p-1" /> : "🏗️"}
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-black text-amber-300 leading-tight">{t.title}</h1>
              <p className="text-[10px] md:text-[11px] text-slate-300 mt-0.5">{settings.plantName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden lg:block">{settings.country || "EG"} • {settings.currency || "EGP"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
            <div className="inline-flex bg-slate-800/70 border border-slate-700 rounded-lg p-1">
              {(Object.keys(LANG_META) as Lang[]).map((code) => (
                <button key={code} onClick={() => setLang(code)} className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${lang === code ? "bg-amber-500 text-slate-900 shadow" : "text-slate-300 hover:bg-slate-700"}`} title={LANG_META[code].name}>
                  <span>{LANG_META[code].flag}</span><span className="hidden sm:inline">{LANG_META[code].name}</span>
                </button>
              ))}
            </div>
            <div className="text-center md:text-start hidden lg:block border-t border-slate-800 pt-3">
              <div className="text-[9px] text-slate-400">{t.designedBy}</div>
              <div className="text-amber-200 font-bold text-xs">{t.authorName}</div>
            </div>
          </div>
        </div>
        <nav className="bg-slate-950/50 border-t border-slate-800 lg:bg-transparent lg:border-t-0 lg:px-4 lg:pb-5">
          <div className="px-2 md:px-4 flex overflow-x-auto scrollbar-none lg:px-0 lg:flex-col lg:overflow-visible lg:gap-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setModule(item.key)} className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 lg:border-b-0 lg:border-l-2 lg:rounded-lg lg:w-full ${module === item.key ? "border-amber-400 text-amber-300 bg-amber-500/10" : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-6 py-5">
        {module === "dashboard" && <DashboardModule t={t} onNavigate={(m) => setModule(m as Module)} />}

        {module === "qc" && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-slate-900 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-[10px] text-purple-300 uppercase tracking-widest mb-1">{t.navQC} — Quality Control / Lab</div>
              <h2 className="text-lg font-black text-white">{qcTab === "guideline" ? t.qcGuidelineMix : qcTab === "design" ? t.qcDesignMix : t.qcApprovals}</h2>
              <p className="text-xs text-slate-400 mt-1">{qcTab === "guideline" ? t.qcGuidelineHint : qcTab === "design" ? t.qcDesignHint : t.qcApprovalsHint}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { key: "guideline" as QCTab, label: t.qcGuidelineMix, color: "from-blue-500 to-purple-600" },
                  { key: "design" as QCTab, label: t.qcDesignMix, color: "from-emerald-500 to-teal-600" },
                  { key: "approvals" as QCTab, label: t.qcApprovals, color: "from-amber-500 to-orange-600" },
                ]).map(tab => (
                  <button key={tab.key} onClick={() => setQcTab(tab.key)} className={`py-3 rounded-xl font-bold text-sm transition ${qcTab === tab.key ? `bg-gradient-to-l ${tab.color} text-white shadow-lg` : "text-slate-300 hover:bg-slate-800/60"}`}>{tab.label}</button>
                ))}
              </div>
            </div>
            {qcTab === "guideline" && <GuidelineMix t={t} />}
            {qcTab === "design" && <DesignYourMix t={t} />}
            {qcTab === "approvals" && <ApprovalsModule t={t} />}
          </div>
        )}

        {module === "production" && <ProductionModule t={t} />}
        {module === "fleet" && <FleetModule t={t} />}
        {module === "inventory" && <InventoryModule t={t} />}
        {module === "spares" && <SparesModule t={t} />}
        {module === "repairs" && <RepairsModule t={t} />}
        {module === "customers" && <CustomersModule t={t} />}
        {module === "orders" && <OrdersModule t={t} />}
        {module === "marketing" && <MarketingModule t={t} />}
        {module === "reports" && <ReportsModule t={t} />}
        {module === "settings" && <SettingsModule t={t} />}

        <footer className="text-center text-slate-500 text-xs py-6 mt-6 border-t border-slate-800">{t.footer}</footer>
      </main>
    </div>
  );
}
