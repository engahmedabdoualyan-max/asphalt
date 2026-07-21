import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, query, orderBy, getDocs } from "firebase/firestore";
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

  // Firebase Auth & Firestore
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Firebase initialization
  const [firebaseApp] = useState(() => initializeApp({
    apiKey: "AIzaSyCZFp9LIpQ6NinNOlGgkla2aCSJD0eBSHE",
    authDomain: "asphalt-e7497.firebaseapp.com",
    projectId: "asphalt-e7497",
    storageBucket: "asphalt-e7497.firebasestorage.app",
    messagingSenderId: "895349888715",
    appId: "1:895349888715:web:5819ff8d6eec8b81c92d4e",
    measurementId: "G-CF3PSJTGS4"
  }));

  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      } else {
        // Create new user profile
        const newProfile = {
          uid: userId,
          email: user?.email || "",
          displayName: user?.displayName || "",
          photoURL: user?.photoURL || "",
          role: "user",
          permissions: ["dashboard", "reports", "settings"],
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };
        await setDoc(doc(db, 'users', userId), newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const signOutUser = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Guest Sign In
  const signInAsGuest = async () => {
    setIsLoading(true);
    try {
      const { signInAnonymously } = await import("firebase/auth");
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      console.error('Error signing in as guest:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user activity
  const updateUserActivity = async (userId: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        lastLogin: serverTimestamp(),
        lastActive: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  };

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
        {!user ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-gradient-to-br from-slate-900 via-blue-950/50 to-slate-900 border border-amber-500/30 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-4xl shadow-lg">
                🏗️
              </div>
              <h1 className="text-2xl font-black text-amber-300 mb-2">{t.title}</h1>
              <p className="text-slate-400 text-sm mb-6">سجل الدخول للمتابعة إلى لوحة التحكم المصنع</p>
              
              <div className="space-y-3">
                <button 
                  onClick={signInWithGoogle} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading ? 'جاري التسجيل...' : '🟢 دخول بحساب Google'}
                </button>
                
                <button 
                  onClick={signInAsGuest} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isLoading ? 'جاري التسجيل...' : '👤 دخول كضيف'}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  باستخدام هذا النظام، أنت توافق على <a href="#" className="text-amber-300">شروط الخدمة</a> و <a href="#" className="text-amber-300">سياسة الخصوصية</a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        <footer className="text-center text-slate-500 text-xs py-6 mt-6 border-t border-slate-800">{t.footer}</footer>
        
        {/* Floating Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {/* Contact Us Button */}
          <button 
            onClick={() => window.open('tel:+201234567890', '_self')}
            className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-110"
            title="اتصل بنا"
          >
            <span className="text-2xl">📞</span>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              اتصل بنا
            </div>
          </button>
          
          {/* WhatsApp Contact */}
          <button 
            onClick={() => window.open('https://wa.me/201234567890', '_blank')}
            className="group relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-110"
            title="واتساب"
          >
            <span className="text-2xl">👤</span>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              واتساب
            </div>
          </button>
          
          {/* Usage Guide */}
          <button 
            onClick={() => {
              const usageModal = document.getElementById('usage-modal');
              if (usageModal) usageModal.classList.remove('hidden');
            }}
            className="group relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110"
            title="دليل الاستخدام"
          >
            <span className="text-2xl">📋</span>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              دليل الاستخدام
            </div>
          </button>
          
          {/* Rating System */}
          <button 
            onClick={() => {
              const ratingModal = document.getElementById('rating-modal');
              if (ratingModal) ratingModal.classList.remove('hidden');
            }}
            className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-4 rounded-full shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-110"
            title="قيم تجربتك"
          >
            <span className="text-2xl">⭐</span>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              قيم النظام
            </div>
          </button>
        </div>

        {/* Rating Modal */}
        <div id="rating-modal" className="hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && document.getElementById('rating-modal')?.classList.add('hidden')}>
          <div className="bg-slate-900 border border-orange-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-orange-300 mb-4">قيم تجربتك</h3>
            <p className="text-sm text-slate-400 mb-4">كيف تجد نظام إدارة مصنع الأسفلت الذكي؟</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map((star) => (
                <button key={star} className="text-3xl text-slate-600 hover:text-orange-500 transition-colors">⭐</button>
              ))}
            </div>
            <textarea placeholder="اكتب تعليقك (اختياري)..." className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm h-20 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => document.getElementById('rating-modal')?.classList.add('hidden')} className="flex-1 bg-gradient-to-l from-orange-500 to-orange-600 text-white font-bold py-2 rounded-lg">إرسال التقييم</button>
              <button onClick={() => document.getElementById('rating-modal')?.classList.add('hidden')} className="px-4 py-2 bg-slate-700 text-white rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>

        {/* Usage Guide Modal */}
        <div id="usage-modal" className="hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && document.getElementById('usage-modal')?.classList.add('hidden')}>
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-purple-300 mb-4">دليل استخدام نظام إدارة مصنع الأسفلت</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-purple-200 font-bold mb-2">📊 التنقل الأساسي</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li><strong>اللوحة:</strong> نظرة عامة على مؤشرات الأداء الرئيسية</li>
                  <li><strong>QC / المختبر:</strong> تصميم الخلطات، التحقق من الجودة</li>
                  <li><strong>الإنتاج:</strong> تشغيل المصنع ومراقبة الخام</li>
                  <li><strong>الأسطول:</strong> إدارة الشاحنات والتوصيل</li>
                  <li><strong>المخزون:</strong> مراقبة المواد الخام والمكونات</li>
                  <li><strong>الصيانة:</strong> جدولة الصيانة وقائمة الإصلاحات</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-purple-200 font-bold mb-2">⚡ الميزات الأساسية</h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li><strong>تخزين البيانات:</strong> حفظ جميع البيانات في المتصفح</li>
                  <li><strong>إحصائيات اليوم:</strong> نظرة عامة على إنتاج اليوم</li>
                  <li><strong>تنبيهات المخزون:</strong> تنبيهات انخفاض المخزون</li>
                  <li><strong>الترجمة:</strong> دعم العربية والإنجليزية والأردية</li>
                  <li><strong>تقارير التصنيع:</strong> تقارير PDF قابلة للطباعة</li>
                  <li><strong>الاتصالات:</strong> زر الاتصال السريع والنقر</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-purple-200 font-bold mb-2">🔧 دليل سريع</h4>
              <ol className="text-xs text-slate-400 space-y-1 list-decimal mr-4">
                <li>اختر القسم من القائمة الجانبية أو اللوحة</li>
                <li>استخدم أزرار التحكم السريع لإضافة معدات</li>
                <li>انقر على الارتفاعات لتعديل الكميات</li>
                <li>اطلع على تنبيهات المخزون في الوقت الفعلي</li>
                <li>قم بتصدير البيانات في قسم التقارير</li>
                <li>قم بتخصيص لغة المحطة من الشعار</li>
              </ol>
            </div>
            
            <div className="mt-4">
              <h4 className="text-purple-200 font-bold mb-2">📞 الدعم والمساعدة</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p><strong>الموقع:</strong> منطقة الصناعة، السادات، المنوفية</p>
                <p><strong>الهاتف:</strong> +2 01223456789</p>
                <p><strong>البريد:</strong> info@asphaltplant.com</p>
                <p><strong>العمل:</strong> السبت - الخميس 8:00 ص - 6:00 م</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button onClick={() => document.getElementById('usage-modal')?.classList.add('hidden')} className="flex-1 bg-gradient-to-l from-purple-500 to-purple-700 text-white font-bold py-2 rounded-lg">فهمت</button>
              <button onClick={() => document.getElementById('usage-modal')?.classList.add('hidden')} className="px-4 py-2 bg-slate-700 text-white rounded-lg">إغلاق</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
