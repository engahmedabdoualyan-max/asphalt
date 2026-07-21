export type Lang = "en" | "ar" | "ur";

export const LANG_META: Record<Lang, { name: string; flag: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", flag: "🇬🇧", dir: "ltr" },
  ar: { name: "العربية", flag: "🇪🇬", dir: "rtl" },
  ur: { name: "اردو", flag: "🇵🇰", dir: "rtl" },
};

export interface Dict {
  title: string; subtitle: string; designedBy: string; authorName: string; authorRole: string; footer: string;
  navDashboard: string; navQC: string; navProduction: string; navFleet: string;
  navInventory: string; navMaintenance: string; navRD: string; navReports: string; navSettings: string;
  dashTitle: string; dashSubtitle: string; dashOpenModule: string;
  modDashDesc: string; modQCDesc: string; modProdDesc: string; modFleetDesc: string; modInvDesc: string;
  modMainDesc: string; modRDDesc: string; modRepDesc: string; modSetDesc: string;
  kpiBatchesToday: string; kpiTonsToday: string; kpiActiveMix: string; kpiPlantStatus: string;
  plantRunning: string; plantIdle: string; kpiFleetActive: string; kpiMaintenanceDue: string; kpiStockAlerts: string;
  qcGuidelineMix: string; qcDesignMix: string; qcApprovals: string;
  qcGuidelineHint: string; qcDesignHint: string; qcApprovalsHint: string;
  classLabel: string; classA: string; classB: string; classC: string; classD: string;
  classAFull: string; classBFull: string; classCFull: string; classDFull: string; nmasLabel: string;
  sectionParams: string; sectionTable: string; sectionCurve: string; sectionUploads: string;
  batchSize: string; batchHint: string; mixType: string;
  bitumenPct: string; bitumenRange: string; bitumenOk: string; bitumenBad: string;
  mixWearing: string; mixBinder: string; mixBase: string;
  aggA4: string; aggA3: string; aggA2: string; aggA1: string; aggNS: string; aggFL: string;
  aggBitumen: string; bitumenSizeNote: string;
  aggNotes: { a4: string; a3: string; a2: string; a1: string; ns: string; fl: string };
  colMaterial: string; colSize: string; colPct: string; colWeight: string;
  totalRow: string; weightUnit: string; pctSumWarn: (v: number) => string; violations: (s: string) => string;
  statBatch: string; statBitumenWeight: string; statAggWeight: string; statCompliance: string;
  specStd: string; sieveHeader: string; upperLimit: string; combined: string; lowerLimit: string;
  axisX: string; axisY: string; legendCurve: string; legendSpec: string;
  uploadBtn: string; uploadHint: string; approvedDesigns: string; noDesigns: string;
  apply: string; remove: string; designName: string; uploadedAt: string;
  dymTitle: string; dymTabManual: string; dymTabUpload: string;
  dymInputGradations: string; dymInputHint: string; dymComponent: string; dymPctPassing: string;
  dymTargetGradation: string; dymOptimize: string; dymUploadSheet: string; dymUploadHint: string;
  dymExtracting: string; dymExtractDone: string; dymExtractFail: string;
  dymResults: string; dymOptimalPcts: string; dymOptimalAC: string; dymPerformance: string;
  dymStability: string; dymFlow: string; dymVoids: string; dymVMA: string; dymVFA: string; dymDensity: string;
  dymVerdict: string; dymPass: string; dymFail: string; dymApplyToMix: string; dymReset: string; dymAddTest: string;
  dymChooseCode: string; dymCrusher: string; dymCrusherName: string; dymCrusherType: string;
  dymCrusherLoc: string; dymCrusherOwner: string; dymCrusherCap: string;
  apprTitle: string; apprHint: string; apprAddCert: string; apprName: string;
  apprFile: string; apprType: string; apprDate: string; apprStatus: string;
  apprApproved: string; apprPending: string; apprExpired: string;
  apprNoCerts: string; apprRemove: string; apprView: string; apprTypes: string[];
  prodTitle: string; prodStartBatch: string; prodStopPlant: string;
  prodBatchCount: string; prodCurrentMix: string; prodTemp: string;
  prodMixingTime: string; prodLog: string; prodLogEmpty: string;
  prodTimestamp: string; prodEvent: string; prodHourlyChart: string;
  fleetTitle: string; fleetAddTruck: string; fleetTruckNo: string;
  fleetDriver: string; fleetDest: string; fleetTons: string; fleetStatus: string;
  fleetActions: string; fleetLoading: string; fleetLoaded: string;
  fleetDispatched: string; fleetDelivered: string; fleetDispatch: string;
  fleetDeliver: string; fleetNoTrucks: string; fleetTrucks: string;
  fleetAvgDelivery: string; fleetTotalDelivered: string;
  invTitle: string; invMaterial: string; invStock: string; invCapacity: string;
  invStatus: string; invOk: string; invLow: string; invCritical: string;
  invRefill: string; invRefillAmount: string; invHistory: string;
  maintTitle: string; maintAdd: string; maintEquipment: string;
  maintType: string; maintDate: string; maintNextDue: string;
  maintStatus: string; maintSchedule: string; maintCompleted: string;
  maintOverdue: string; maintUpcoming: string; maintAddTask: string;
  maintTaskName: string; maintAssignedTo: string; maintPriority: string;
  maintHigh: string; maintMed: string; maintLow: string;
  maintDueDate: string; maintDone: string; maintPending: string;
  maintNoTasks: string; maintLogHistory: string; maintTypes: string[];
  rdTitle: string; rdProjects: string; rdAddProject: string;
  rdProjectName: string; rdDescription: string; rdStatus: string;
  rdActive: string; rdCompleted: string; rdOnHold: string;
  rdNewMixDesign: string; rdRecycledMix: string; rdWMA: string; rdSMA: string; rdOther: string;
  rdFindings: string; rdTeam: string; rdStartDate: string; rdTarget: string;
  rdNoProjects: string; rdUploadReport: string;
  repTitle: string; repTotalBatches: string; repTotalTons: string;
  repTotalDispatched: string; repExportJSON: string; repClearData: string; repConfirmClear: string;
  setTitle: string; setLanguage: string; setPlantName: string; setSave: string; setSaved: string;
}

const en: Dict = {
  title: "Intelligent Asphalt Plant Management System", subtitle: "Full Plant Operations & Quality Management",
  designedBy: "Developed by", authorName: "Dr. Ahmed Abdo Allyan", authorRole: "Roads & Materials Engineering Consultant",
  footer: "© Intelligent Asphalt Plant System — Dr. Ahmed Abdo Allyan",
  navDashboard: "Dashboard", navQC: "QC / Lab", navProduction: "Production", navFleet: "Fleet",
  navInventory: "Inventory", navMaintenance: "Maintenance", navRD: "R&D", navReports: "Reports", navSettings: "Settings",
  dashTitle: "Plant Manager Dashboard", dashSubtitle: "Full overview of all departments", dashOpenModule: "Open",
  modDashDesc: "Live overview of all plant metrics", modQCDesc: "Mix design, lab tests, certifications & approvals",
  modProdDesc: "Run batches, control production", modFleetDesc: "Trucks, loading, delivery tracking",
  modInvDesc: "Silos, tanks, materials stock", modMainDesc: "Equipment maintenance & scheduling",
  modRDDesc: "Research, new mix designs, recycling", modRepDesc: "Reports & data export", modSetDesc: "Plant info, language",
  kpiBatchesToday: "Batches Today", kpiTonsToday: "Tons Produced", kpiActiveMix: "Active Mix",
  kpiPlantStatus: "Plant Status", plantRunning: "RUNNING", plantIdle: "IDLE",
  kpiFleetActive: "Active Trucks", kpiMaintenanceDue: "Maint. Due", kpiStockAlerts: "Low Stock",
  qcGuidelineMix: "📘 Guideline Mix", qcDesignMix: "🧪 Design Your Mix", qcApprovals: "📋 Certifications",
  qcGuidelineHint: "Standard preset proportions based on Marshall classification",
  qcDesignHint: "Input lab tests or upload sheet — system computes optimal proportions",
  qcApprovalsHint: "Upload & manage lab certifications, mix approvals, and test reports",
  classLabel: "Mix Class", classA: "Class A", classB: "Class B", classC: "Class C", classD: "Class D",
  classAFull: "Class A — Heavy traffic, NMAS 37.5 mm (Base)", classBFull: "Class B — Med-heavy, NMAS 25 mm",
  classCFull: "Class C — Medium traffic, NMAS 19 mm (Binder)", classDFull: "Class D — Light traffic, NMAS 12.5 mm (Wearing)",
  nmasLabel: "NMAS",
  sectionParams: "Batch Parameters & Mix Components", sectionTable: "Batch Components — Weights",
  sectionCurve: "Marshall Gradation Curve", sectionUploads: "Approved Mix Designs Library",
  batchSize: "Batch Capacity (kg):", batchHint: "Typical: 1000–3000 kg", mixType: "Target Layer:",
  bitumenPct: "Bitumen Content (%):", bitumenRange: "Allowed range", bitumenOk: "✅ Complies with Marshall specs",
  bitumenBad: "⚠️ Outside allowed range",
  mixWearing: "Wearing (Surface)", mixBinder: "Binder (Intermediate)", mixBase: "Asphalt Base",
  aggA4: "Very Coarse (Bin 4)", aggA3: "Medium Coarse (Bin 3)", aggA2: "Chippings (Bin 2)",
  aggA1: "Crusher Sand (Bin 1)", aggNS: "Natural Sand", aggFL: "Mineral Filler",
  aggBitumen: "Bitumen 60/70", bitumenSizeNote: "Separate scale",
  aggNotes: { a4: '1.5"–1"', a3: '3/4"–3/8"', a2: '3/8"–#4', a1: "Passing #4", ns: "Workability", fl: "Limestone" },
  colMaterial: "Material", colSize: "Size", colPct: "Percent (%)", colWeight: "Weight",
  totalRow: "Total Batch", weightUnit: "kg",
  pctSumWarn: (v) => `⚠️ Aggregate sum = ${v.toFixed(1)}% (must = 100%) — auto-normalized.`,
  violations: (s) => `⚠️ Out-of-spec at: ${s}`,
  statBatch: "Batch Capacity", statBitumenWeight: "Bitumen", statAggWeight: "Aggregate", statCompliance: "Compliance",
  specStd: "AASHTO T 245", sieveHeader: "Sieve (mm)", upperLimit: "Upper", combined: "Combined", lowerLimit: "Lower",
  axisX: "Sieve opening (mm) — log", axisY: "% Passing", legendCurve: "Combined", legendSpec: "Spec Limits",
  uploadBtn: "📤 Upload Design", uploadHint: "JSON, PDF, JPG, PNG, XLSX", approvedDesigns: "Approved Designs",
  noDesigns: "No designs uploaded yet.", apply: "Apply", remove: "Remove", designName: "Design Name", uploadedAt: "Uploaded",
  dymTitle: "🧪 Design Your Mix", dymTabManual: "✏️ Manual", dymTabUpload: "📤 Upload",
  dymInputGradations: "Enter Component Gradations (% passing)", dymInputHint: "Input sieve-analysis results for each stockpile",
  dymComponent: "Component", dymPctPassing: "% Passing", dymTargetGradation: "Target Mid-band",
  dymOptimize: "🎯 Compute Optimal Mix", dymUploadSheet: "Upload Test Sheet", dymUploadHint: "CSV / TSV / JSON / Image",
  dymExtracting: "⏳ Extracting...", dymExtractDone: "✅ Extracted", dymExtractFail: "⚠️ Could not extract",
  dymResults: "Mix Design Results", dymOptimalPcts: "Optimal Proportions", dymOptimalAC: "Optimal AC",
  dymPerformance: "Marshall Performance", dymStability: "Stability (kg)", dymFlow: "Flow (0.01 in)",
  dymVoids: "Air Voids (%)", dymVMA: "VMA (%)", dymVFA: "VFA (%)", dymDensity: "Density (kg/m³)",
  dymVerdict: "Verdict", dymPass: "✅ PASS", dymFail: "❌ FAIL",
  dymApplyToMix: "Apply", dymReset: "Reset", dymAddTest: "Add Row",
  dymChooseCode: "Choose Design Code", dymCrusher: "Crusher Setup (الكسارة)",
  dymCrusherName: "Crusher Name", dymCrusherType: "Crusher Type", dymCrusherLoc: "Location / Quarry",
  dymCrusherOwner: "Owner / Supplier", dymCrusherCap: "Capacity (tons/hour)",
  apprTitle: "📋 Certifications & Approvals", apprHint: "Upload lab certifications, DOT approvals, mix design reports",
  apprAddCert: "+ Add Certification", apprName: "Certification Name", apprFile: "File",
  apprType: "Type", apprDate: "Date", apprStatus: "Status",
  apprApproved: "Approved", apprPending: "Pending", apprExpired: "Expired",
  apprNoCerts: "No certifications uploaded yet.", apprRemove: "Remove", apprView: "View",
  apprTypes: ["Mix Design Report", "Lab Certification", "DOT Approval", "Material Test Report", "Aggregate Source Approval", "Bitumen Certificate", "Project Specification"],
  prodTitle: "🏭 Production", prodStartBatch: "▶ Produce", prodStopPlant: "⏸ Stop",
  prodBatchCount: "Total Batches", prodCurrentMix: "Current Mix", prodTemp: "Temp (°C)",
  prodMixingTime: "Mix Time (s)", prodLog: "Production Log", prodLogEmpty: "No batches yet.",
  prodTimestamp: "Time", prodEvent: "Event", prodHourlyChart: "📈 Hourly Production",
  fleetTitle: "🚛 Fleet", fleetAddTruck: "+ Add Truck", fleetTruckNo: "Truck #",
  fleetDriver: "Driver", fleetDest: "Destination", fleetTons: "Tons", fleetStatus: "Status",
  fleetActions: "Actions", fleetLoading: "Loading", fleetLoaded: "Loaded",
  fleetDispatched: "Dispatched", fleetDelivered: "Delivered", fleetDispatch: "Dispatch",
  fleetDeliver: "Deliver", fleetNoTrucks: "No trucks.", fleetTrucks: "Trucks",
  fleetAvgDelivery: "Avg Delivery", fleetTotalDelivered: "Total Delivered",
  invTitle: "📦 Inventory", invMaterial: "Material", invStock: "Stock", invCapacity: "Capacity",
  invStatus: "Status", invOk: "OK", invLow: "Low", invCritical: "Critical",
  invRefill: "Refill", invRefillAmount: "Amount (tons):", invHistory: "History",
  maintTitle: "🔧 Maintenance & Scheduling", maintAdd: "+ Add Task", maintEquipment: "Equipment",
  maintType: "Type", maintDate: "Date", maintNextDue: "Next Due", maintStatus: "Status",
  maintSchedule: "Scheduled", maintCompleted: "Completed", maintOverdue: "Overdue", maintUpcoming: "Upcoming",
  maintAddTask: "Add Maintenance Task", maintTaskName: "Task Name", maintAssignedTo: "Assigned To",
  maintPriority: "Priority", maintHigh: "High", maintMed: "Medium", maintLow: "Low",
  maintDueDate: "Due Date", maintDone: "Done", maintPending: "Pending",
  maintNoTasks: "No maintenance tasks.", maintLogHistory: "Maintenance Log",
  maintTypes: ["Preventive", "Corrective", "Emergency", "Inspection", "Lubrication", "Calibration", "Replacement"],
  rdTitle: "🔬 Research & Development", rdProjects: "R&D Projects", rdAddProject: "+ New Project",
  rdProjectName: "Project Name", rdDescription: "Description", rdStatus: "Status",
  rdActive: "Active", rdCompleted: "Completed", rdOnHold: "On Hold",
  rdNewMixDesign: "New Mix Design", rdRecycledMix: "Recycled Mix (RAP)", rdWMA: "Warm Mix Asphalt",
  rdSMA: "Stone Mastic Asphalt", rdOther: "Other", rdFindings: "Findings & Notes",
  rdTeam: "Team", rdStartDate: "Start Date", rdTarget: "Target Date",
  rdNoProjects: "No R&D projects yet.", rdUploadReport: "Upload Report",
  repTitle: "📊 Reports & Export", repTotalBatches: "Total Batches", repTotalTons: "Total Tons",
  repTotalDispatched: "Trucks Dispatched", repExportJSON: "💾 Export All (JSON)",
  repClearData: "🗑 Clear All", repConfirmClear: "Clear all data? Cannot be undone.",
  setTitle: "⚙️ Settings", setLanguage: "Language", setPlantName: "Plant Name",
  setSave: "Save", setSaved: "✓ Saved",
};

const ar: Dict = {
  title: "نظام إدارة محطة الأسفلت الذكي المتكامل", subtitle: "إدارة المحطة كاملة وجودة المنتج",
  designedBy: "إعداد وتطوير", authorName: "د. أحمد عبده عليان", authorRole: "استشاري هندسة الطرق والمواد",
  footer: "© نظام إدارة محطة الأسفلت الذكي — د. أحمد عبده عليان",
  navDashboard: "الرئيسية", navQC: "المختبر / الجودة", navProduction: "الإنتاج", navFleet: "الأسطول",
  navInventory: "المخزون", navMaintenance: "الصيانة", navRD: "البحث والتطوير", navReports: "التقارير", navSettings: "الإعدادات",
  dashTitle: "لوحة قيادة المحطة", dashSubtitle: "نظرة شاملة على كل الأقسام", dashOpenModule: "فتح",
  modDashDesc: "مؤشرات حية لكل أقسام المحطة", modQCDesc: "تصميم الخلطات، الاختبارات، الاعتمادات والشهادات",
  modProdDesc: "تشغيل الباتشات والتحكم بالإنتاج", modFleetDesc: "السيارات، التحميل، تتبع التوصيل",
  modInvDesc: "الصوامع، الخزانات، مخزون المواد", modMainDesc: "صيانة المعدات والجدولة",
  modRDDesc: "الأبحاث، تصميم خلطات جديدة، إعادة التدوير", modRepDesc: "التقارير وتصدير البيانات", modSetDesc: "معلومات المحطة واللغة",
  kpiBatchesToday: "باتشات اليوم", kpiTonsToday: "الإنتاج (طن)", kpiActiveMix: "الخلطة الحالية",
  kpiPlantStatus: "حالة المحطة", plantRunning: "تعمل", plantIdle: "متوقفة",
  kpiFleetActive: "سيارات نشطة", kpiMaintenanceDue: "صيانة مستحقة", kpiStockAlerts: "تنبيه مخزون",
  qcGuidelineMix: "📘 خلطة إرشادية", qcDesignMix: "🧪 صمم خلطتك", qcApprovals: "📋 الاعتمادات",
  qcGuidelineHint: "النسب القياسية الجاهزة حسب تصنيف مارشال",
  qcDesignHint: "أدخل اختبارات المعمل أو ارفع شيت — والبرنامج يحسب النسب المثلى",
  qcApprovalsHint: "ارفع وأدر شهادات المعمل، اعتمادات هيئة الطرق، وتقارير اختبارات الخلطات",
  classLabel: "التصنيف", classA: "كلاس A", classB: "كلاس B", classC: "كلاس C", classD: "كلاس D",
  classAFull: "كلاس A — مرور ثقيل جداً، NMAS 37.5 مم (أساس)", classBFull: "كلاس B — مرور متوسط/ثقيل، NMAS 25 مم",
  classCFull: "كلاس C — مرور متوسط، NMAS 19 مم (رابطة)", classDFull: "كلاس D — مرور خفيف، NMAS 12.5 مم (سطحية)",
  nmasLabel: "أكبر مقاس NMAS",
  sectionParams: "معايير الدفعة والمكونات", sectionTable: "جدول المكونات والأوزان",
  sectionCurve: "منحنى التدرج الحبيبي", sectionUploads: "مكتبة الخلطات المعتمدة",
  batchSize: "سعة الباتشة (كجم):", batchHint: "المدى: 1000–3000 كجم", mixType: "نوع الطبقة:",
  bitumenPct: "نسبة البيتومين (%):", bitumenRange: "المدى المسموح", bitumenOk: "✅ مطابقة لمواصفات مارشال",
  bitumenBad: "⚠️ خارج المدى المسموح",
  mixWearing: "سطحية", mixBinder: "رابطة", mixBase: "أساس أسفلتي",
  aggA4: "بحص خشن جداً (صومعة 4)", aggA3: "بحص متوسط (صومعة 3)", aggA2: "بحص سمسمة (صومعة 2)",
  aggA1: "رمل كسارة (صومعة 1)", aggNS: "رمل طبيعي", aggFL: "بودرة فيلر",
  aggBitumen: "البتومين 60/70", bitumenSizeNote: "ميزان منفصل",
  aggNotes: { a4: '1.5" - 1"', a3: '3/4" - 3/8"', a2: '3/8" - #4', a1: "أقل من #4", ns: "التشغيلية", fl: "حجر جيري" },
  colMaterial: "المادة", colSize: "المقاس", colPct: "النسبة (%)", colWeight: "الوزن",
  totalRow: "إجمالي الدفعة", weightUnit: "كجم",
  pctSumWarn: (v) => `⚠️ مجموع النسب = ${v.toFixed(1)}% (يجب 100%) — تطبيع تلقائي.`,
  violations: (s) => `⚠️ مخالفات: ${s}`,
  statBatch: "السعة", statBitumenWeight: "البتومين", statAggWeight: "الركام", statCompliance: "المطابقة",
  specStd: "AASHTO T 245", sieveHeader: "المنخل (مم)", upperLimit: "الأعلى", combined: "المركب", lowerLimit: "الأدنى",
  axisX: "فتحة المنخل (مم) — لوغاريتمي", axisY: "% المار", legendCurve: "المركب", legendSpec: "حدود المواصفة",
  uploadBtn: "📤 رفع خلطة", uploadHint: "JSON, PDF, JPG, PNG, XLSX", approvedDesigns: "الخلطات المعتمدة",
  noDesigns: "لا توجد خلطات بعد.", apply: "تطبيق", remove: "حذف", designName: "الاسم", uploadedAt: "تاريخ الرفع",
  dymTitle: "🧪 صمم خلطتك", dymTabManual: "✏️ إدخال يدوي", dymTabUpload: "📤 رفع شيت",
  dymInputGradations: "أدخل التدرج (% المار)", dymInputHint: "نتائج تحليل المناخل لكل صومعة",
  dymComponent: "المكون", dymPctPassing: "% المار", dymTargetGradation: "الهدف",
  dymOptimize: "🎯 احسب الخلطة المثلى", dymUploadSheet: "ارفع شيت الاختبار", dymUploadHint: "CSV / TSV / JSON / صورة",
  dymExtracting: "⏳ جاري الاستخراج...", dymExtractDone: "✅ تم الاستخراج", dymExtractFail: "⚠️ تعذر الاستخراج — راجع يدوياً",
  dymResults: "نتائج التصميم", dymOptimalPcts: "النسب المثلى", dymOptimalAC: "نسبة البتومين المثلى",
  dymPerformance: "أداء مارشال", dymStability: "الثبات (كجم)", dymFlow: "الانسياب",
  dymVoids: "الفراغات (%)", dymVMA: "VMA (%)", dymVFA: "VFA (%)", dymDensity: "الكثافة (كجم/م³)",
  dymVerdict: "النتيجة", dymPass: "✅ ناجحة", dymFail: "❌ راسبة",
  dymApplyToMix: "تطبيق", dymReset: "إعادة تعيين", dymAddTest: "إضافة صف",
  dymChooseCode: "اختر كود التصميم", dymCrusher: "إعدادات الكسارة",
  dymCrusherName: "اسم الكسارة", dymCrusherType: "نوع الكسارة", dymCrusherLoc: "الموقع / المحجر",
  dymCrusherOwner: "المالك / المورد", dymCrusherCap: "الطاقة (طن/ساعة)",
  apprTitle: "📋 الاعتمادات والشهادات", apprHint: "ارفع شهادات المعمل، اعتمادات الهيئة، تقارير اختبارات الخلطات",
  apprAddCert: "+ إضافة اعتماد", apprName: "اسم الاعتماد", apprFile: "الملف",
  apprType: "النوع", apprDate: "التاريخ", apprStatus: "الحالة",
  apprApproved: "معتمد", apprPending: "قيد المراجعة", apprExpired: "منتهي الصلاحية",
  apprNoCerts: "لا توجد اعتمادات مرفوعة بعد.", apprRemove: "حذف", apprView: "عرض",
  apprTypes: ["تقرير تصميم الخلطة", "شهادة معامل", "اعتماد الهيئة", "تقرير اختبار المواد", "اعتماد مصدر الركام", "شهادة البتومين", "مواصفات المشروع"],
  prodTitle: "🏭 الإنتاج", prodStartBatch: "▶ إنتاج باتشة", prodStopPlant: "⏸ إيقاف",
  prodBatchCount: "الباتشات", prodCurrentMix: "الخلطة", prodTemp: "الحرارة (°م)",
  prodMixingTime: "زمن الخلط (ث)", prodLog: "سجل الإنتاج", prodLogEmpty: "لم يتم إنتاج باتشات بعد.",
  prodTimestamp: "الوقت", prodEvent: "الحدث", prodHourlyChart: "📈 الإنتاج بالساعة",
  fleetTitle: "🚛 الأسطول", fleetAddTruck: "+ إضافة سيارة", fleetTruckNo: "رقم السيارة",
  fleetDriver: "السائق", fleetDest: "الوجهة", fleetTons: "طن", fleetStatus: "الحالة",
  fleetActions: "إجراءات", fleetLoading: "جاري التحميل", fleetLoaded: "محملة",
  fleetDispatched: "مشحونة", fleetDelivered: "تم التسليم", fleetDispatch: "شحن",
  fleetDeliver: "تسليم", fleetNoTrucks: "لا توجد سيارات.", fleetTrucks: "السيارات",
  fleetAvgDelivery: "متوسط التوصيل", fleetTotalDelivered: "إجمالي التوصيل",
  invTitle: "📦 المخزون", invMaterial: "المادة", invStock: "الرصيد", invCapacity: "السعة",
  invStatus: "الحالة", invOk: "جيد", invLow: "منخفض", invCritical: "حرج",
  invRefill: "تعبئة", invRefillAmount: "الكمية (طن):", invHistory: "السجل",
  maintTitle: "🔧 الصيانة والجدولة", maintAdd: "+ إضافة مهمة", maintEquipment: "المعدة",
  maintType: "النوع", maintDate: "التاريخ", maintNextDue: "التالي", maintStatus: "الحالة",
  maintSchedule: "مجدول", maintCompleted: "مكتمل", maintOverdue: "متأخر", maintUpcoming: "قادم",
  maintAddTask: "إضافة مهمة صيانة", maintTaskName: "اسم المهمة", maintAssignedTo: "المسؤول",
  maintPriority: "الأولوية", maintHigh: "عالية", maintMed: "متوسطة", maintLow: "منخفضة",
  maintDueDate: "الاستحقاق", maintDone: "تم", maintPending: "قيد التنفيذ",
  maintNoTasks: "لا توجد مهام صيانة.", maintLogHistory: "سجل الصيانة",
  maintTypes: ["وقائية", "تصحيحية", "طارئة", "فحص", "تشحيم", "معايرة", "استبدال"],
  rdTitle: "🔬 البحث والتطوير", rdProjects: "مشاريع البحث", rdAddProject: "+ مشروع جديد",
  rdProjectName: "اسم المشروع", rdDescription: "الوصف", rdStatus: "الحالة",
  rdActive: "نشط", rdCompleted: "مكتمل", rdOnHold: "معلق",
  rdNewMixDesign: "تصميم خلطة جديدة", rdRecycledMix: "خلطة معاد تدويرها (RAP)", rdWMA: "خلطة دافئة (WMA)",
  rdSMA: "خلطة ماستيك (SMA)", rdOther: "أخرى", rdFindings: "النتائج والملاحظات",
  rdTeam: "الفريق", rdStartDate: "تاريخ البداية", rdTarget: "الموعد المستهدف",
  rdNoProjects: "لا توجد مشاريع بحث بعد.", rdUploadReport: "رفع تقرير",
  repTitle: "📊 التقارير والتصدير", repTotalBatches: "الباتشات", repTotalTons: "الإنتاج (طن)",
  repTotalDispatched: "السيارات المشحونة", repExportJSON: "💾 تصدير الكل (JSON)",
  repClearData: "🗑 مسح الكل", repConfirmClear: "مسح كل البيانات؟ لا يمكن التراجع.",
  setTitle: "⚙️ الإعدادات", setLanguage: "اللغة", setPlantName: "اسم المحطة",
  setSave: "حفظ", setSaved: "✓ تم الحفظ",
};

const ur: Dict = {
  title: "اسفالٹ پلانٹ کا مکمل انتظامی نظام", subtitle: "مکمل پلانٹ آپریشنز اور کوالٹی",
  designedBy: "تیار کردہ", authorName: "ڈاکٹر احمد عبدہ علیان", authorRole: "سڑکوں اور مواد کے انجینئرنگ مشیر",
  footer: "© اسفالٹ پلانٹ ذہین نظام — ڈاکٹر احمد عبدہ علیان",
  navDashboard: "ڈیش بورڈ", navQC: "لیب / کوالٹی", navProduction: "پروڈکشن", navFleet: "ٹرک فلیٹ",
  navInventory: "انوینٹری", navMaintenance: "دیکھ بھال", navRD: "تحقیق", navReports: "رپورٹس", navSettings: "ترتیبات",
  dashTitle: "پلانٹ مینیجر ڈیش بورڈ", dashSubtitle: "تمام شعبوں کا مکمل جائزہ", dashOpenModule: "کھولیں",
  modDashDesc: "براہ راست پلانٹ میٹرکس", modQCDesc: "مکس ڈیزائن، لیب ٹیسٹس، اعتمادات",
  modProdDesc: "بیچ بنائیں، پیداوار کنٹرول", modFleetDesc: "ٹرک، لوڈنگ، ڈلیوری ٹریکنگ",
  modInvDesc: "سائلو، ٹینک، مواد اسٹاک", modMainDesc: "آلات کی دیکھ بھال اور شیڈولنگ",
  modRDDesc: "تحقیق، نئے مکس ڈیزائن، ری سائکلنگ", modRepDesc: "رپورٹس اور ڈیٹا ایکسپورٹ", modSetDesc: "پلانٹ کی معلومات",
  kpiBatchesToday: "آج کے بیچ", kpiTonsToday: "آج کی پیداوار (طن)", kpiActiveMix: "فعال مکس",
  kpiPlantStatus: "پلانٹ کی حالت", plantRunning: "چل رہا ہے", plantIdle: "بند",
  kpiFleetActive: "فعال ٹرک", kpiMaintenanceDue: "دیکھ بھال واجب", kpiStockAlerts: "کم اسٹاک",
  qcGuidelineMix: "📘 گائیڈ لائن مکس", qcDesignMix: "🧪 مکس ڈیزائن کریں", qcApprovals: "📋 اعتمادات",
  qcGuidelineHint: "مارشل درجہ بندی کے مطابق معیاری تناسب",
  qcDesignHint: "لیب ٹیسٹ درج کریں یا شیٹ اپلوڈ کریں",
  qcApprovalsHint: "لیب شہادات، ہیئت اعتمادات، مکس رپورٹس اپلوڈ اور منظم کریں",
  classLabel: "کلاس", classA: "کلاس A", classB: "کلاس B", classC: "کلاس C", classD: "کلاس D",
  classAFull: "کلاس A — بھاری ٹریفک، NMAS 37.5mm", classBFull: "کلاس B — درمیانی بھاری، NMAS 25mm",
  classCFull: "کلاس C — درمیانی، NMAS 19mm", classDFull: "کلاس D — ہلکی، NMAS 12.5mm",
  nmasLabel: "NMAS",
  sectionParams: "بیچ پیرامیٹرز", sectionTable: "بیچ اجزاء اور وزن",
  sectionCurve: "گریڈیشن منحنی", sectionUploads: "منظور شدہ ڈیزائن لائبریری",
  batchSize: "بیچ گنجائش (کلوگرام):", batchHint: "1000–3000 کلوگرام", mixType: "ہدف پرت:",
  bitumenPct: "بٹومن فیصد (%):", bitumenRange: "اجازت شدہ حد", bitumenOk: "✅ معیار کے مطابق",
  bitumenBad: "⚠️ حد سے باہر",
  mixWearing: "سطحی", mixBinder: "بائنڈر", mixBase: "بیس",
  aggA4: "بہت موٹا (بن 4)", aggA3: "درمیانہ (بن 3)", aggA2: "چھوٹا (بن 2)",
  aggA1: "باریک ریت (بن 1)", aggNS: "قدرتی ریت", aggFL: "فلر",
  aggBitumen: "بٹومن 60/70", bitumenSizeNote: "علیحدہ وزن",
  aggNotes: { a4: '1.5"–1"', a3: '3/4"–3/8"', a2: '3/8"–#4', a1: "#4 سے گزرنے والا", ns: "کارکردگی", fl: "چونا" },
  colMaterial: "مواد", colSize: "سائز", colPct: "فیصد (%)", colWeight: "وزن",
  totalRow: "کل بیچ وزن", weightUnit: "کلوگرام",
  pctSumWarn: (v) => `⚠️ فیصد مجموعہ = ${v.toFixed(1)}% (100% ضروری)`,
  violations: (s) => `⚠️ خلاف ورزی: ${s}`,
  statBatch: "گنجائش", statBitumenWeight: "بٹومن", statAggWeight: "ایگریگیٹ", statCompliance: "مطابقت",
  specStd: "AASHTO T 245", sieveHeader: "چھلنی (mm)", upperLimit: "بالائی", combined: "مرکب", lowerLimit: "نچلی",
  axisX: "چھلنی سائز (mm) — لوگ", axisY: "% گزرنے والا", legendCurve: "مرکب", legendSpec: "معیاری حدود",
  uploadBtn: "📤 مکس اپلوڈ", uploadHint: "JSON, PDF, JPG, PNG, XLSX", approvedDesigns: "منظور شدہ ڈیزائن",
  noDesigns: "ابھی تک کوئی نہیں۔", apply: "لاگو", remove: "ہٹائیں", designName: "نام", uploadedAt: "اپلوڈ کیا گیا",
  dymTitle: "🧪 مکس ڈیزائن کریں", dymTabManual: "✏️ دستی", dymTabUpload: "📤 اپلوڈ",
  dymInputGradations: "گریڈیشن درج کریں", dymInputHint: "چھلنی تجزیہ کے نتائج",
  dymComponent: "جزو", dymPctPassing: "% گزرنے والا", dymTargetGradation: "ہدف",
  dymOptimize: "🎯 بہترین حساب", dymUploadSheet: "ٹیسٹ شیٹ اپلوڈ", dymUploadHint: "CSV / TSV / JSON",
  dymExtracting: "⏳ نکالا جا رہا ہے...", dymExtractDone: "✅ نکالا گیا", dymExtractFail: "⚠️ ناکام — دستی",
  dymResults: "نتائج", dymOptimalPcts: "بہترین تناسب", dymOptimalAC: "بہترین بٹومن",
  dymPerformance: "مارشل کارکردگی", dymStability: "استحکام (کلوگرام)", dymFlow: "بہاؤ",
  dymVoids: "ہوا خلا (%)", dymVMA: "VMA (%)", dymVFA: "VFA (%)", dymDensity: "کثافت (کلوگرام/م³)",
  dymVerdict: "نتیجہ", dymPass: "✅ کامیاب", dymFail: "❌ ناکام",
  dymApplyToMix: "لاگو", dymReset: "ری سیٹ", dymAddTest: "قطار",
  dymChooseCode: "ڈیزائن کوڈ منتخب کریں", dymCrusher: "کروشر سیٹ اپ",
  dymCrusherName: "کروشر کا نام", dymCrusherType: "کروشر کی قسم", dymCrusherLoc: "مقام / کان",
  dymCrusherOwner: "مالک / سپلائر", dymCrusherCap: "صلاحیت (ٹن/گھنٹہ)",
  apprTitle: "📋 اعتمادات اور شہادات", apprHint: "لیب شہادات، ہیئت اعتمادات، رپورٹس اپلوڈ کریں",
  apprAddCert: "+ اعتماد شامل کریں", apprName: "اعتماد کا نام", apprFile: "فائل",
  apprType: "قسم", apprDate: "تاریخ", apprStatus: "حالت",
  apprApproved: "منظور شدہ", apprPending: "زیر جائزہ", apprExpired: "مہلت ختم",
  apprNoCerts: "ابھی تک کوئی اعتماد نہیں۔", apprRemove: "ہٹائیں", apprView: "دیکھیں",
  apprTypes: ["مکس ڈیزائن رپورٹ", "لیب شہادت", "ہیئت اعتماد", "مواد رپورٹ", "ایگریگیٹ اعتماد", "بٹومن شہادت", "پروجیکٹ مواصفات"],
  prodTitle: "🏭 پروڈکشن", prodStartBatch: "▶ بیچ بنائیں", prodStopPlant: "⏸ روکیں",
  prodBatchCount: "کل بیچ", prodCurrentMix: "موجودہ مکس", prodTemp: "درجہ حرارت (°C)",
  prodMixingTime: "ملاوٹ (سیکنڈ)", prodLog: "پروڈکشن لاگ", prodLogEmpty: "ابھی تک بیچ نہیں۔",
  prodTimestamp: "وقت", prodEvent: "واقعہ", prodHourlyChart: "📈 گھنٹہ وار پیداوار",
  fleetTitle: "🚛 ٹرک فلیٹ", fleetAddTruck: "+ ٹرک شامل", fleetTruckNo: "ٹرک نمبر",
  fleetDriver: "ڈرائیور", fleetDest: " منزل", fleetTons: "طن", fleetStatus: "حالت",
  fleetActions: "اعمال", fleetLoading: "لوڈ ہو رہا", fleetLoaded: "لوڈ شدہ",
  fleetDispatched: "بھیج دیا", fleetDelivered: "پہنچا دیا", fleetDispatch: "بھیجیں",
  fleetDeliver: "ڈلیور", fleetNoTrucks: "کوئی ٹرک نہیں۔", fleetTrucks: "ٹرک",
  fleetAvgDelivery: "اوسط ڈلیوری", fleetTotalDelivered: "کل ڈلیوری",
  invTitle: "📦 انوینٹری", invMaterial: "مواد", invStock: "اسٹاک", invCapacity: "گنجائش",
  invStatus: "حالت", invOk: "ٹھیک", invLow: "کم", invCritical: "نازک",
  invRefill: "بھریں", invRefillAmount: "کمی (طن):", invHistory: "تاریخچہ",
  maintTitle: "🔧 دیکھ بھال اور شیڈولنگ", maintAdd: "+ مہم شامل", maintEquipment: "آلات",
  maintType: "قسم", maintDate: "تاریخ", maintNextDue: "اگلی", maintStatus: "حالت",
  maintSchedule: "شیڈول", maintCompleted: "مکمل", maintOverdue: "مہلت ختم", maintUpcoming: "آنے والا",
  maintAddTask: "دیکھ بھال مہم", maintTaskName: "مہم کا نام", maintAssignedTo: "ذمہ دار",
  maintPriority: "ترجیح", maintHigh: "اعلیٰ", maintMed: "درمیانی", maintLow: "کم",
  maintDueDate: "آخری تاریخ", maintDone: "ہو گیا", maintPending: "باقی",
  maintNoTasks: "کوئی مہم نہیں۔", maintLogHistory: "دیکھ بھال لاگ",
  maintTypes: ["预防ی", "ترمیمی", "ہنگامی", "معائنہ", "تیل", "معايرة", "تبدیلی"],
  rdTitle: "🔬 تحقیق و توسیع", rdProjects: "تحقیقی منصوبے", rdAddProject: "+ نیا منصوبہ",
  rdProjectName: "منصوبے کا نام", rdDescription: "تفصیل", rdStatus: "حالت",
  rdActive: "فعال", rdCompleted: "مکمل", rdOnHold: "معلق",
  rdNewMixDesign: "نیا مکس ڈیزائن", rdRecycledMix: "ری سائکلڈ مکس (RAP)", rdWMA: "ورم مکس اسفالٹ",
  rdSMA: "اسٹون ماسٹک", rdOther: "دیگر", rdFindings: "نتائج اور نوٹس",
  rdTeam: "ٹیم", rdStartDate: "تاریخ شروع", rdTarget: "ہدف تاریخ",
  rdNoProjects: "ابھی تک کوئی منصوبہ نہیں۔", rdUploadReport: "رپورٹ اپلوڈ",
  repTitle: "📊 رپورٹس اور ایکسپورٹ", repTotalBatches: "کل بیچ", repTotalTons: "کل پیداوار (طن)",
  repTotalDispatched: "بھیجے ٹرک", repExportJSON: "💾 سب ایکسپورٹ",
  repClearData: "🗑 سب صاف", repConfirmClear: "سب صاف کریں؟ واپس نہیں۔",
  setTitle: "⚙️ ترتیبات", setLanguage: "زبان", setPlantName: "پلانٹ کا نام",
  setSave: "محفوظ", setSaved: "✓ محفوظ ہو گیا",
};

export const DICTS: Record<Lang, Dict> = { en, ar, ur };
