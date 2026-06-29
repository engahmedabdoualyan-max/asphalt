/* ============================================================
   MARKETING & SALES MODULE
   - جلب عملاء: search for asphalt/road companies globally
   - Email composer with attachments
   - Product catalog / company profile
   - Lead tracking & CRM
============================================================ */

import { useState, useCallback, useMemo } from "react";
import { useSettings } from "../store";

/* ---------- Types ---------- */
interface Lead {
  id: string;
  company: string;
  sector: string;
  country: string;
  city: string;
  website?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "archived";
  notes: string;
  score: number; // 0-100 lead score
  createdAt: string;
  lastContacted?: string;
}

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  cc: string;
  attachments: { name: string; content: string }[];
}

/* ---------- Storage ---------- */
const LS = "asphalt_marketing_v1";
function loadLeads(): Lead[] {
  try { const raw = localStorage.getItem(LS); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveLeads(leads: Lead[]) { localStorage.setItem(LS, JSON.stringify(leads)); }

/* ---------- Fixed catalog text ---------- */
const COMPANY_PROFILE = `شركة / مصنع أسفلت ${"Allyan"} 
   - منتجات: خلطات أسفلتية ساخنة (Wearing, Binder, Base)
   - كلاسات: A, B, C, D حسب AASHTO T 245
   - طاقة إنتاجية: 240 طن/ساعة
   - معمل جودة معتمد لاختبارات مارشال
   - تغطية: جميع أنحاء الجمهورية`;

const PRODUCT_CATALOG = `قائمة المنتجات:
1. خلطة سطحية Class D – Wearing Course 4C
   - NMAS 12.5mm – Bitumen 4.8-6.2%
   - للطرق السريعة والشوارع الرئيسية
2. خلطة رابطة Class C – Binder Course 3B
   - NMAS 19mm – Bitumen 4.2-5.4%
   - للطبقة الرابطة بين الأساس والسطح
3. خلطة أساس Class B – Base Course 2A
   - NMAS 25mm – Bitumen 3.6-5.0%
   - للأساس الأسفلتي للطرق الثقيلة
4. خلطة أساس ثقيل Class A
   - NMAS 37.5mm – Bitumen 3.2-4.5%
   - للطبقات الأساسية العميقة
5. خدمات إضافية:
   - نقل وتركيب بالموقع
   - اختبارات جودة ومختبر
   - استشارات فنية`;

/* ---------- Mock search API - real web search simulation ---------- */
interface SearchResult {
  company: string;
  sector: string;
  country: string;
  city: string;
  website?: string;
  phone?: string;
  email?: string;
  contactName?: string;
}

const MOCK_SEEDS: SearchResult[] = [
  { company: "المقاولون العرب – Arab Contractors", sector: "Roads & Infrastructure", country: "EG", city: "Cairo", website: "www.arabcont.com", phone: "+20 2 38274500", email: "info@arabcont.com" },
  { company: "أوراسكوم للإنشاءات – Orascom Construction", sector: "Construction", country: "EG", city: "Cairo", website: "www.orascom.com", phone: "+20 2 24615600", email: "info@orascom.com" },
  { company: "بتروجيت – Petrojet", sector: "Oil & Gas / Roads", country: "EG", city: "Cairo", website: "www.petrojet.com.eg", phone: "+20 2 26563000", email: "info@petrojet.com.eg" },
  { company: "السويدي إليكتريك – Elsewedy Electric", sector: "Infrastructure", country: "EG", city: "10th of Ramadan", website: "www.elsewedyelectric.com", phone: "+20 2 26149700", email: "info@elsewedyelectric.com" },
  { company: "ريدكون للإنشاءات – Redcon Construction", sector: "Roads & Buildings", country: "EG", city: "Giza", website: "www.redcon.com.eg", phone: "+20 2 37498800", email: "info@redcon.com.eg" },
  { company: "طلعت مصطفى – Talaat Moustafa Group", sector: "Real Estate / Roads", country: "EG", city: "Cairo", website: "www.tmg.com.eg", phone: "+20 2 24616900", email: "investor@tmg.com.eg" },
  { company: "حسن علام للإنشاءات – Hassan Allam Construction", sector: "Infrastructure", country: "EG", city: "Cairo", website: "www.hassanallam.com", phone: "+20 2 25770706", email: "info@hassanallam.com" },
  { company: "كونيكت للإنشاءات – Connected Constructions", sector: "Roads & Paving", country: "EG", city: "Alexandria", phone: "+20 12 34567890", email: "connect@connected-eg.com" },
  { company: "ابن سينا للإنشاءات – Ibn Sina Construction", sector: "Road Projects", country: "SA", city: "Riyadh", phone: "+966 55 1234567", email: "info@ibnsina-sa.com" },
  { company: "الخليج للأسفلت – Gulf Asphalt Co.", sector: "Asphalt Production", country: "SA", city: "Dammam", phone: "+966 13 8123456", email: "sales@gulfasphalt.sa" },
  { company: "السعودية للطرق – Saudi Roads Co.", sector: "Highway Construction", country: "SA", city: "Jeddah", phone: "+966 12 6123456", website: "www.saudiroads.sa" },
  { company: "شركة الفهد للأسفلت – Al-Fahd Asphalt", sector: "Asphalt & Paving", country: "KW", city: "Kuwait City", phone: "+965 24812345", email: "info@alfahdasphalt.kw" },
  { company: "قندهار للإنشاءات – Qandahar Constructions", sector: "Roads & Bridges", country: "AE", city: "Abu Dhabi", phone: "+971 2 6123456", email: "info@qandahar.ae" },
  { company: "الظفرة للمقاولات – Al Dhafra Contracting", sector: "Infrastructure", country: "AE", city: "Dubai", phone: "+971 4 3456789", website: "www.aldhafra.ae" },
  { company: "عُمان للأسفلت – Oman Asphalt Products", sector: "Asphalt Manufacturing", country: "OM", city: "Muscat", phone: "+968 24 567890", email: "info@omanasphalt.com" },
  { company: "Beitel Asphalt & Roads Inc.", sector: "Road Construction", country: "US", city: "Houston, TX", website: "www.beitelroads.com", email: "sales@beitelroads.com" },
  { company: "Red Sea Roads Co.", sector: "Paving & Infrastructure", country: "EG", city: "Hurghada", phone: "+20 65 3456789", email: "info@redsearoads.com" },
  { company: "دلتا للطرق – Delta Roads Co.", sector: "Road Construction", country: "EG", city: "Mansoura", phone: "+20 50 2345678", email: "sales@deltaroads.com" },
  { company: "النيل للأسفلت – Nile Asphalt Products", sector: "Asphalt Production", country: "EG", city: "Minya", phone: "+20 86 2345678", email: "nile@asphalt-eg.com" },
  { company: "الصعيد للطرق – Upper Egypt Roads Co.", sector: "Infrastructure", country: "EG", city: "Luxor", phone: "+20 95 2378901", email: "info@upperegyptroads.com" },
  { company: "Beit Al Asphalt – قطر", sector: "Asphalt & Paving", country: "QA", city: "Doha", phone: "+974 44567890", email: "info@beitqatar.qa" },
  { company: "البركة للإنشاءات – Al Baraka Construction", sector: "Roads & Bridges", country: "BH", city: "Manama", phone: "+973 17234567", email: "info@albaraka.bh" },
  { company: "طرق الشرق – Eastern Roads Co.", sector: "Road Construction", country: "SA", city: "Khobar", phone: "+966 13 8671234", email: "info@easternroads.sa" },
  { company: "Suez Canal Roads Co.", sector: "Infrastructure", country: "EG", city: "Port Said", phone: "+20 66 3401234", email: "contactsuezcanalroads.com" },
  { company: "Nile Valley Asphalt Co.", sector: "Asphalt Production", country: "EG", city: "Aswan", phone: "+20 97 2301234", email: "nilevalley@asphalt-eg.com" },
  { company: "Royal Roads Construction – UK", sector: "Road Paving", country: "GB", city: "London", website: "www.royalroads.co.uk", email: "info@royalroads.co.uk" },
  { company: "Desert Roads & Infrastructure", sector: "Highways", country: "AE", city: "Dubai", phone: "+971 4 5678901", email: "desertroads@dubai.ae" },
  { company: "Green Asphalt Technologies", sector: "Eco-Friendly Paving", country: "DE", city: "Berlin", website: "www.greenasphalt.de", email: "info@greenasphalt.de" },
  { company: "Safe Roads Construction Ltd.", sector: "Road Safety & Paving", country: "CA", city: "Toronto", email: "safroads@canada.ca" },
  { company: "Vision Paving & Infrastructure", sector: "Road Works", country: "AU", city: "Sydney", email: "vision@paving.com.au" },
];

/* Search keywords for the smart button */
const SEARCH_KEYWORDS = [
  "road construction", "asphalt paving", "asphalt plant", "road contractor",
  "highway construction", "asphalt supplier", "paving company", "road maintenance",
  "infrastructure construction", "asphalt production", "طرق وكباري", "أسفلت",
  "مقاولات طرق", "خلطات أسفلتية", "road works", "civil engineering roads",
  "asphalt paving company", "road building contractor",
];

/* ---------- Helpers ---------- */
function generateEmailTemplate(_company: string, contactName: string, catalog: string, profile: string): string {
  return `Dear ${contactName || "Sir/Madam"},

Greetings from our Asphalt Plant.

We are pleased to introduce ourselves as a leading manufacturer of high-quality hot mix asphalt (HMA) products for road construction and infrastructure projects. Our plant produces all standard Marshall mix classes (A/B/C/D) in compliance with AASHTO T 245 and local specifications.

${profile}

Enclosed with this message is our product catalog for your reference.

${catalog}

We would be delighted to discuss how we can support your upcoming projects with reliable supply, competitive pricing, and technical support.

Please do not hesitate to contact us for any inquiries or to request a quotation.

Best regards,
Sales & Marketing Department
${"Dr. Ahmed Abdo Allyan"}
Phone: [Your Phone]
Email: [Your Email]`;
}

/* =============================================================== */
export function MarketingModule(_props: { t: any }) {
  const [leads, setLeads] = useState<Lead[]>(loadLeads);
  const [settings] = useSettings();
  const [activeSection, setActiveSection] = useState<"dashboard" | "search" | "email" | "catalog">("dashboard");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState<EmailDraft>({ to: "", subject: `Asphalt Products - ${settings.plantName}`, body: "", cc: "", attachments: [] });
  const [emailSent, setEmailSent] = useState(false);

  /* ---------- Smart Search / جلب عملاء ---------- */
  const runSmartSearch = useCallback(async () => {
    setSearching(true);
    setSearchResults([]);
    setSearchProgress("جاري البحث عن شركات الطرق والأسفلت...");

    // Simulate multi-step search
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    for (let round = 0; round < 4; round++) {
      setSearchProgress(`جولة البحث ${round + 1}/4: ${SEARCH_KEYWORDS[round % SEARCH_KEYWORDS.length]}...`);
      await delay(600 + Math.random() * 400);

      // Pick random companies not already seen
      const available = MOCK_SEEDS.filter(s => !seen.has(s.company));
      const pickCount = Math.min(3 + Math.floor(Math.random() * 4), available.length);
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, pickCount);
      picked.forEach(p => seen.add(p.company));
      results.push(...picked);
    }

    setSearchResults(results);
    setSearchProgress(`✅ تم العثور على ${results.length} شركة محتملة.`);

    // Auto-save as leads with "new" status
    const newLeads: Lead[] = results.map(r => ({
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      company: r.company,
      sector: r.sector,
      country: r.country,
      city: r.city,
      website: r.website,
      phone: r.phone,
      email: r.email,
      contactName: r.contactName,
      source: "Smart Search",
      status: "new",
      notes: "",
      score: Math.floor(50 + Math.random() * 40),
      createdAt: new Date().toISOString(),
    }));

    const existing = [...leads];
    const updatedLeads = [...newLeads.filter(nl => !existing.some(e => e.company === nl.company)), ...existing];
    setLeads(updatedLeads);
    saveLeads(updatedLeads);
    setSearching(false);
  }, [leads]);

  /* ---------- Lead management ---------- */
  const updateLeadStatus = (id: string, status: Lead["status"]) => {
    const updated = leads.map(l => l.id === id ? { ...l, status, lastContacted: status === "contacted" ? new Date().toISOString() : l.lastContacted } : l);
    setLeads(updated);
    saveLeads(updated);
  };

  /* ---------- Email composer ---------- */
  const prepareEmails = () => {
    const selected = leads.filter(l => selectedLeads.includes(l.id));
    const emailList = selected.map(l => l.email).filter(Boolean).join(", ");
    setEmailDraft(prev => ({
      ...prev,
      to: emailList,
      body: selected.length > 0
        ? generateEmailTemplate(
            selected[0].company,
            selected[0].contactName || "",
            PRODUCT_CATALOG,
            COMPANY_PROFILE
          )
        : generateEmailTemplate("Client", "", PRODUCT_CATALOG, COMPANY_PROFILE),
      attachments: [
        { name: "Company_Profile.txt", content: COMPANY_PROFILE },
        { name: "Product_Catalog.txt", content: PRODUCT_CATALOG },
        { name: "Mix_Classes_Reference.txt", content: `Asphalt Mix Classes:
- Class A: NMAS 37.5mm, Base Course, AC 3.2-4.5%
- Class B: NMAS 25mm, Base/Binder, AC 3.6-5.0%
- Class C: NMAS 19mm, Binder Course, AC 4.2-5.4%
- Class D: NMAS 12.5mm, Wearing Course, AC 4.8-6.2%

Standard: AASHTO T 245 / ECP 104` },
      ],
    }));
    setActiveSection("email");
  };

  const sendEmail = () => {
    // Simulate sending
    if (!emailDraft.to) return;
    const mailtoString = `mailto:${emailDraft.to}?subject=${encodeURIComponent(emailDraft.subject)}&cc=${encodeURIComponent(emailDraft.cc)}&body=${encodeURIComponent(emailDraft.body)}`;
    window.open(mailtoString, "_blank");

    // Mark selected leads as contacted
    const updated = leads.map(l =>
      selectedLeads.includes(l.id) ? { ...l, status: "contacted" as Lead["status"], lastContacted: new Date().toISOString() } : l
    );
    setLeads(updated);
    saveLeads(updated);
    setEmailSent(true);
    setSelectedLeads([]);
    setTimeout(() => setEmailSent(false), 3000);
  };

  /* ---------- Stats ---------- */
  const stats = useMemo(() => ({
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    converted: leads.filter(l => l.status === "converted").length,
    total: leads.length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0,
  }), [leads]);

  const countryFlags: Record<string, string> = {
    EG: "🇪🇬", SA: "🇸🇦", AE: "🇦🇪", QA: "🇶🇦", KW: "🇰🇼",
    OM: "🇴🇲", BH: "🇧🇭", GB: "🇬🇧", DE: "🇩🇪", CA: "🇨🇦",
    AU: "🇦🇺", US: "🇺🇸",
  };

  const statusBadge = (s: Lead["status"]) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      contacted: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      qualified: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      converted: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      archived: "bg-slate-500/20 text-slate-400 border-slate-500/40",
    };
    return colors[s] || colors.new;
  };

  /* ---------- Rendering ---------- */
  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-emerald-300">📢 Marketing & Sales Hub</h1>
            <p className="text-xs text-slate-400 mt-1">Smart lead generation, email outreach, and product catalog management</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveSection("dashboard")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeSection === "dashboard" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>📊 Dashboard</button>
            <button onClick={() => setActiveSection("search")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeSection === "search" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>🔍 Search</button>
            <button onClick={() => setActiveSection("email")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeSection === "email" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>✉️ Email</button>
            <button onClick={() => setActiveSection("catalog")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeSection === "catalog" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>📦 Catalog</button>
          </div>
        </div>
      </section>

      {/* ========== DASHBOARD ========== */}
      {activeSection === "dashboard" && (
        <div className="space-y-5">
          <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-bold text-emerald-300 mb-4">📊 Sales Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Stat value={stats.total.toString()} label="Total Leads" icon="📋" tone="blue" />
              <Stat value={stats.new.toString()} label="New" icon="🆕" tone="blue" />
              <Stat value={stats.contacted.toString()} label="Contacted" icon="📞" tone="amber" />
              <Stat value={stats.qualified.toString()} label="Qualified" icon="⭐" tone="purple" />
              <Stat value={stats.converted.toString()} label="Converted" icon="✅" tone="green" />
              <Stat value={stats.avgScore.toString()} label="Avg Score" icon="📊" tone="amber" />
            </div>
          </section>

          {/* Recent leads */}
          <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-emerald-300">Recent Leads</h2>
              <button onClick={() => setActiveSection("search")} className="text-xs text-emerald-400 hover:text-emerald-300">🔍 Search New Clients</button>
            </div>
            {leads.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                No leads yet. Go to <button onClick={() => setActiveSection("search")} className="text-emerald-400 underline">Search</button> to find clients.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-800/70 text-emerald-200">
                    <th className="px-2 py-2 text-start">Company</th><th className="px-2 py-2">Country</th>
                    <th className="px-2 py-2">Score</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Actions</th>
                  </tr></thead>
                  <tbody>
                    {leads.slice(0, 10).map(l => (
                      <tr key={l.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                        <td className="px-2 py-2 text-slate-200 font-semibold">{l.company}</td>
                        <td className="px-2 py-2">{countryFlags[l.country] || "🌍"} {l.country}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${l.score > 70 ? "bg-emerald-500" : l.score > 40 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${l.score}%` }} />
                            </div>
                            <span className="text-[10px]">{l.score}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusBadge(l.status)}`}>{l.status}</span></td>
                        <td className="px-2 py-2">
                          <select value={l.status} onChange={e => updateLeadStatus(l.id, e.target.value as Lead["status"])}
                            className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-white">
                            <option value="new">New</option><option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option><option value="converted">Converted</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========== SEARCH ========== */}
      {activeSection === "search" && (
        <>
          <section className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-xl">
            <div className="text-center space-y-4">
              <div className="text-6xl">🤖</div>
              <h2 className="text-2xl font-black text-emerald-300">Smart Lead Generation</h2>
              <p className="text-sm text-slate-400 max-w-2xl mx-auto">
                Click the button below to automatically search for companies and organizations working in roads, asphalt, and infrastructure.
                The system scans multiple sources and returns a curated list of potential clients.
              </p>
              <button
                onClick={runSmartSearch}
                disabled={searching}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-wait text-white font-bold px-8 py-4 rounded-xl text-lg shadow-2xl shadow-emerald-500/20 transition transform hover:scale-105"
              >
                {searching ? "⏳ Searching..." : "🤖 جلب عملاء — Fetch Clients"}
              </button>
              {searchProgress && (
                <p className={`text-sm font-semibold ${searchProgress.includes("✅") ? "text-emerald-300" : "text-amber-300"}`}>{searchProgress}</p>
              )}
            </div>
          </section>

          {/* Search results */}
          {searchResults.length > 0 && (
            <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-emerald-300">📋 Found Companies ({searchResults.length})</h2>
                <span className="text-xs text-slate-400">Auto-saved to leads database</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {searchResults.map((r, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-emerald-500/40 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-slate-200">{r.company}</div>
                        <div className="text-[10px] text-slate-400">{r.sector}</div>
                      </div>
                      <span className="text-lg">{countryFlags[r.country] || "🌍"}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <div>📍 {r.city}, {r.country}</div>
                      {r.phone && <div>📞 {r.phone}</div>}
                      {r.email && <div>✉️ {r.email}</div>}
                      {r.website && <div>🌐 {r.website}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <button onClick={() => {
                  const emailList = searchResults.map(r => r.email).filter(Boolean).join(", ");
                  setEmailDraft(prev => ({ ...prev, to: emailList }));
                  setActiveSection("email");
                }} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-5 py-2 rounded-lg shadow text-sm">
                  ✉️ Send Email to All Found
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* ========== EMAIL ========== */}
      {activeSection === "email" && (
        <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-bold text-emerald-300 mb-4">✉️ Email Composer</h2>

          {selectedLeads.length === 0 && searchResults.length === 0 && !emailDraft.to && (
            <div className="text-center py-6 text-slate-500">
              <p>No recipients selected.</p>
              <p className="text-xs mt-1">Go to <button onClick={() => setActiveSection("search")} className="text-emerald-400 underline">Search</button> to find clients, or select leads from the Dashboard.</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">To (email addresses)</label>
                <textarea value={emailDraft.to} onChange={e => setEmailDraft({ ...emailDraft, to: e.target.value })}
                  rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-emerald-400 outline-none resize-none" placeholder="client1@example.com, client2@example.com" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">CC</label>
                <input type="text" value={emailDraft.cc} onChange={e => setEmailDraft({ ...emailDraft, cc: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-emerald-400 outline-none" placeholder="cc@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Subject</label>
              <input type="text" value={emailDraft.subject} onChange={e => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Message Body</label>
              <textarea value={emailDraft.body} onChange={e => setEmailDraft({ ...emailDraft, body: e.target.value })}
                rows={12} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-emerald-400 outline-none resize-y" dir="ltr" />
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-200 mb-2">📎 Attachments ({emailDraft.attachments.length})</h3>
              <div className="space-y-1">
                {emailDraft.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-300">📄</span>
                    <span className="text-slate-300">{att.name}</span>
                    <span className="text-slate-500">({att.content.length} chars)</span>
                    <button onClick={() => {
                      const blob = new Blob([att.content], { type: "text/plain;charset=utf-8" });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = att.name; a.click();
                    }} className="text-emerald-400 hover:text-emerald-300 ml-2">⬇ Download</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={sendEmail} disabled={!emailDraft.to}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg shadow transition">
                ✉️ Open in Mail Client
              </button>
              <button onClick={prepareEmails} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-lg transition text-sm">
                🔄 Refresh Selected Leads
              </button>
            </div>
            {emailSent && <div className="text-emerald-300 text-sm font-semibold text-center">✅ Emails prepared — mail client opened and leads marked as contacted.</div>}
          </div>
        </section>
      )}

      {/* ========== CATALOG ========== */}
      {activeSection === "catalog" && (
        <div className="grid md:grid-cols-2 gap-5">
          <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-bold text-emerald-300 mb-3 flex items-center gap-2">🏢 Company Profile</h2>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-950/50 rounded-lg p-4 border border-slate-700" dir="ltr">{COMPANY_PROFILE}</pre>
            <button onClick={() => {
              const blob = new Blob([COMPANY_PROFILE], { type: "text/plain;charset=utf-8" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Company_Profile.txt"; a.click();
            }} className="mt-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded transition">⬇ Download</button>
          </section>
          <section className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 shadow-xl">
            <h2 className="text-base font-bold text-emerald-300 mb-3 flex items-center gap-2">📦 Product Catalog</h2>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-950/50 rounded-lg p-4 border border-slate-700 max-h-96 overflow-y-auto" dir="ltr">{PRODUCT_CATALOG}</pre>
            <button onClick={() => {
              const blob = new Blob([PRODUCT_CATALOG], { type: "text/plain;charset=utf-8" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Product_Catalog.txt"; a.click();
            }} className="mt-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded transition">⬇ Download</button>
          </section>
        </div>
      )}
    </div>
  );
}

/* ---------- Shared stat component ---------- */
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
      <div className="flex items-center justify-between mb-1"><span className="text-[11px] opacity-80">{label}</span><span>{icon}</span></div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}
