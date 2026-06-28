import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Users,
  Building2, AlertTriangle, Activity, RefreshCw, Download, BarChart2,
  Wifi, WifiOff,
} from "lucide-react";
import { useLang } from "../context/LangContext";
import { useAuth } from "../context/AuthContext";
import DemoDataBanner from "../components/DemoDataBanner";
import * as GW from "../services/ServiceGateway";
import { checkEngConnection, ENG_PROJECT_ID } from "../services/EngineeringGateway";

// ── Constants ────────────────────────────────────────────────────────────────

const CONTRACT_STATUSES = [
  { key: "draft",        label: "Draft" },
  { key: "under_review", label: "Under Review" },
  { key: "approved",     label: "Approved" },
  { key: "signed",       label: "Signed" },
  { key: "active",       label: "Active" },
  { key: "completed",    label: "Completed" },
  { key: "terminated",   label: "Terminated" },
];

const STATUS_COLORS = {
  paid:    "#16a34a",
  pending: "#d97706",
  overdue: "#dc2626",
};

const CONTRACT_STATUS_COLORS = {
  draft:        "#6b7280",
  under_review: "#d97706",
  approved:     "#2563a8",
  signed:       "#16a34a",
  active:       "#16a34a",
  completed:    "#1a3c5e",
  terminated:   "#dc2626",
};

const PIE_COLORS = ["#16a34a", "#2563a8", "#d4a017", "#6b7280"];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ── Seed data ────────────────────────────────────────────────────────────────

const FINANCE_SEED = [
  { month: "Jul", collected: 480000,  pending: 120000 },
  { month: "Aug", collected: 620000,  pending: 95000  },
  { month: "Sep", collected: 540000,  pending: 200000 },
  { month: "Oct", collected: 780000,  pending: 85000  },
  { month: "Nov", collected: 920000,  pending: 140000 },
  { month: "Dec", collected: 1050000, pending: 60000  },
];

const PROJECT_SEED = [
  { name: "Active",    value: 3 },
  { name: "Planning",  value: 2 },
  { name: "Completed", value: 1 },
  { name: "On Hold",   value: 1 },
];

const DEPT_SEED = [
  { dept: "Engineering", count: 8 },
  { dept: "Legal",       count: 3 },
  { dept: "Finance",     count: 4 },
  { dept: "HR",          count: 2 },
  { dept: "Operations",  count: 6 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtETB(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) return `ETB ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `ETB ${(n / 1_000).toFixed(0)}K`;
  return `ETB ${n.toLocaleString("en-ET")}`;
}

function fmtETBFull(amount) {
  return `ETB ${(Number(amount) || 0).toLocaleString("en-ET")}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ETBTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "10px 14px",
      boxShadow: "var(--shadow-md)",
      fontSize: 13,
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text-main)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: "2px 0", color: p.color }}>
          {p.name}: {fmtETBFull(p.value)}
        </p>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const key = (status || "").toLowerCase();
  const color = STATUS_COLORS[key] || "#6b7280";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
    }}>
      {status || "—"}
    </span>
  );
}

function ContractBadge({ status }) {
  const key = (status || "").toLowerCase();
  const color = CONTRACT_STATUS_COLORS[key] || "#6b7280";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
    }}>
      {(status || "draft").replace("_", " ")}
    </span>
  );
}

function EmployeeStatusBadge({ status }) {
  const isActive = (status || "active").toLowerCase() === "active";
  const color = isActive ? "#16a34a" : "#6b7280";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
    }}>
      {status || "active"}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { user }     = useAuth();
  const { language: lang } = useLang();
  const language = lang;
  const bi = (en, am) => language === "am" ? am : en;

  // ── State ──────────────────────────────────────────────────────────────────
  const [projects,   setProjects]   = useState([]);
  const [invoices,   setInvoices]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [contracts,  setContracts]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [engStatus,  setEngStatus]  = useState(null); // null=checking, {connected,project}|{connected:false,error}

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    try {
      // Probe engineering connection in parallel with data fetch
      const [p, inv, emp, con, engConn] = await Promise.all([
        GW.getProjects(),
        GW.getInvoices(),
        GW.getEmployees(),
        GW.getContracts(),
        checkEngConnection(),
      ]);
      setProjects(p   || []);
      setInvoices(inv || []);
      setEmployees(emp || []);
      setContracts(con || []);
      setEngStatus(engConn);
    } catch (err) {
      console.error("[AnalyticsDashboard] Data load failed:", err);
      setEngStatus({ connected: false, error: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Access guard ───────────────────────────────────────────────────────────
  if (!user || (user.role !== 'ceo' && user.tier > 2)) {
    return (
      <>
        <style>{`
          .analytics-locked-page {
            min-height: calc(100vh - var(--nav-height));
            background: var(--background);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0;
            padding: 48px 24px;
          }
          .analytics-locked-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-top: 3px solid var(--accent);
            border-radius: var(--radius-lg);
            padding: 48px 44px;
            max-width: 460px;
            width: 100%;
            text-align: center;
            box-shadow: var(--shadow-md);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
        `}</style>
        <div className="analytics-locked-page">
          <div className="analytics-locked-card">
            <AlertTriangle size={40} style={{ color: "#d4a017" }} />
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: "var(--text-main)",
            }}>
              {bi("Access Restricted", "መዳረሻ ተከልክሏል")}
            </h2>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.65,
            }}>
              {bi(
                "Analytics requires Tier 1 or 2 access",
                "ትንተናው ለTier 1 ወይም 2 ተጠቃሚዎች ብቻ ነው",
              )}
            </p>
            <div style={{
              marginTop: 4,
              padding: "5px 18px",
              borderRadius: 20,
              background: "rgba(212,160,23,0.12)",
              border: "1px solid rgba(212,160,23,0.4)",
              color: "#d4a017",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
              {bi("TIER 3+ — ACCESS DENIED", "ደረጃ 3+ — ፈቃድ ተከልክሏል")}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`
          @keyframes analytics-spin { to { transform: rotate(360deg); } }
          .analytics-spinner-wrap {
            min-height: calc(100vh - var(--nav-height));
            background: var(--background);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
          }
          .analytics-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: analytics-spin 0.8s linear infinite;
          }
        `}</style>
        <div className="analytics-spinner-wrap">
          <div className="analytics-spinner" />
          <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0 }}>
            {bi("Loading intelligence...", "ትንተና እየጫነ...")}
          </p>
        </div>
      </>
    );
  }

  // ── Derived: KPI values ────────────────────────────────────────────────────
  const activeProjectCount = projects.filter(p => p.status === "active").length;

  const revenuePaid = invoices
    .filter(i => i.status === "paid")
    .reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const revenuePending = invoices
    .filter(i => i.status === "pending" || i.status === "overdue")
    .reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const overdueCount     = invoices.filter(i => i.status === "overdue").length;
  const paidInvCount     = invoices.filter(i => i.status === "paid").length;
  const activeContracts  = contracts.filter(c => c.status === "active" || c.status === "signed").length;
  const totalHeadcount   = employees.length;

  const avgCompletion = projects.length
    ? Math.round(projects.reduce((s, p) => s + (Number(p.completion) || 0), 0) / projects.length)
    : 0;

  const kpiCards = [
    {
      label:   bi("Total Projects",    "ጠቅላላ ፕሮጀክቶች"),
      value:   projects.length,
      icon:    Building2,
      trend:   `${activeProjectCount} ${bi("active", "ንቁ")}`,
      trendUp: activeProjectCount > 0,
    },
    {
      label:   bi("Revenue Collected", "የተሰበሰበ ገቢ"),
      value:   fmtETB(revenuePaid),
      icon:    DollarSign,
      trend:   `${paidInvCount} ${bi("invoices", "ደረሰኞች")}`,
      trendUp: true,
    },
    {
      label:   bi("Pending Revenue",   "ያልተሰበሰበ ገቢ"),
      value:   fmtETB(revenuePending),
      icon:    TrendingDown,
      trend:   `${overdueCount} ${bi("overdue", "ያለፈ")}`,
      trendUp: false,
    },
    {
      label:   bi("Active Contracts",  "ንቁ ውሎች"),
      value:   activeContracts,
      icon:    FileText,
      trend:   `${contracts.length} ${bi("total", "ጠቅላላ")}`,
      trendUp: activeContracts > 0,
    },
    {
      label:   bi("Total Headcount",   "ጠቅላላ ሰው ኃይል"),
      value:   totalHeadcount,
      icon:    Users,
      trend:   `${deptChartData().length} ${bi("departments", "ክፍሎች")}`,
      trendUp: totalHeadcount > 0,
    },
    {
      label:   bi("Avg Completion",    "አማካይ ፍጻሜ"),
      value:   `${avgCompletion}%`,
      icon:    Activity,
      trend:   projects.length
        ? `${projects.length} ${bi("projects", "ፕሮጀክቶች")}`
        : bi("No data", "ምንም ዳታ የለም"),
      trendUp: avgCompletion >= 50,
    },
  ];

  // ── Derived: Finance chart ─────────────────────────────────────────────────
  function financeChartData() {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES[d.getMonth()] });
    }
    const grouped = months.map(m => ({ month: m.label, collected: 0, pending: 0 }));
    let hasData = false;

    invoices.forEach(inv => {
      const raw = inv.issuedDate
        || (inv._ts?.seconds ? new Date(inv._ts.seconds * 1000).toISOString() : null)
        || inv.createdAt
        || null;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d)) return;
      const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (idx < 0) return;
      hasData = true;
      const amt = Number(inv.amount) || 0;
      if (inv.status === "paid") grouped[idx].collected += amt;
      else if (inv.status === "pending" || inv.status === "overdue") grouped[idx].pending += amt;
    });

    return { data: hasData ? grouped : FINANCE_SEED, seeded: !hasData };
  }

  // ── Derived: Project status pie ────────────────────────────────────────────
  function projectPieData() {
    const active    = projects.filter(p => p.status === "active").length;
    const planning  = projects.filter(p => p.status === "planning").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const hold      = projects.filter(p =>
      p.status === "on_hold" || p.status === "on hold" || p.status === "hold",
    ).length;
    if (active + planning + completed + hold === 0) {
      return { data: PROJECT_SEED, seeded: true };
    }
    return {
      data: [
        { name: "Active",    value: active    },
        { name: "Planning",  value: planning  },
        { name: "Completed", value: completed },
        { name: "On Hold",   value: hold      },
      ],
      seeded: false,
    };
  }

  // ── Derived: Department headcount ──────────────────────────────────────────
  function deptChartData() {
    if (!employees.length) return { data: DEPT_SEED, seeded: true };
    const map = {};
    employees.forEach(e => {
      const dept = e.department || "Other";
      map[dept] = (map[dept] || 0) + 1;
    });
    return {
      data: Object.entries(map).map(([dept, count]) => ({ dept, count })),
      seeded: false,
    };
  }

  // ── Derived: Contract pipeline ─────────────────────────────────────────────
  function contractPipelineData() {
    const map = {};
    contracts.forEach(c => {
      const s = (c.status || "draft").toLowerCase();
      map[s] = (map[s] || 0) + 1;
    });
    return CONTRACT_STATUSES.map(s => ({ status: s.label, count: map[s.key] || 0 }));
  }

  // ── Compute chart data once ────────────────────────────────────────────────
  const finChart  = financeChartData();
  const pieChart  = projectPieData();
  const deptChart = deptChartData();
  const finData   = finChart.data;
  const pieData   = pieChart.data;
  const deptData  = deptChart.data;
  const ctrData   = contractPipelineData();
  const usesSeedData =
    finChart.seeded || pieChart.seeded || deptChart.seeded;

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const TABS = [
    { key: "overview",  label: bi("Overview",  "አጠቃላይ እይታ") },
    { key: "finance",   label: bi("Finance",   "ፋይናንስ")      },
    { key: "hr",        label: bi("HR",        "ሰው ኃይል")     },
    { key: "contracts", label: bi("Contracts", "ውሎች")        },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {usesSeedData && (
        <DemoDataBanner label="Some charts use demo seed data until Firestore has enough invoices, projects, and employees." />
      )}
      {/* ── Scoped styles ───────────────────────────────────────────────── */}
      <style>{`
        /* ── Page wrapper ── */
        .analytics-page {
          width: 100%;
          min-height: calc(100vh - var(--nav-height));
          background: var(--background);
        }

        /* ── Header ── */
        .analytics-header {
          background: linear-gradient(135deg, #0f2540, #1a3c5e);
          border-bottom: 3px solid var(--accent);
          padding: 28px 32px;
          margin-bottom: 28px;
        }
        .analytics-header-inner {
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .analytics-header-left { flex: 1; min-width: 240px; }
        .analytics-header-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-inverse);
          font-size: clamp(18px, 3vw, 26px);
          font-weight: 800;
          margin: 0 0 4px;
          line-height: 1.2;
        }
        .analytics-header-sub {
          color: rgba(255,255,255,0.58);
          font-size: 13px;
          margin: 0 0 16px;
        }
        .analytics-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          padding-top: 4px;
        }
        .analytics-btn-ghost {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.22);
          color: rgba(255,255,255,0.88);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: background 0.2s;
        }
        .analytics-btn-ghost:hover { background: rgba(255,255,255,0.16); }
        .analytics-btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Tab pills ── */
        .analytics-tab-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .analytics-tab-pill {
          padding: 6px 18px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.18s;
          line-height: 1.4;
        }
        .analytics-tab-pill.active {
          background: var(--accent);
          color: var(--text-main);
          font-weight: 700;
        }
        .analytics-tab-pill.inactive {
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8);
        }
        .analytics-tab-pill.inactive:hover {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }

        /* ── Spin animation ── */
        @keyframes analytics-spin { to { transform: rotate(360deg); } }
        .analytics-spin { animation: analytics-spin 0.7s linear infinite; }

        /* ── Page container ── */
        .analytics-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 24px 48px;
        }

        /* ── KPI grid ── */
        .analytics-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) {
          .analytics-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .analytics-kpi-grid { grid-template-columns: 1fr; }
        }

        /* ── KPI card ── */
        .analytics-kpi-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: 3px solid var(--accent);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .analytics-kpi-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: rgba(212,160,23,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          margin-bottom: 2px;
          flex-shrink: 0;
        }
        .analytics-kpi-value {
          font-size: 26px;
          font-weight: 800;
          color: #d4a017;
          line-height: 1.1;
          margin: 0;
          word-break: break-word;
        }
        .analytics-kpi-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--text-muted);
          margin: 0;
        }
        .analytics-kpi-trend {
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0;
        }
        .analytics-kpi-trend.up   { color: #16a34a; }
        .analytics-kpi-trend.down { color: #dc2626; }

        /* ── 2-column chart grid ── */
        .analytics-chart-2col {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 860px) {
          .analytics-chart-2col { grid-template-columns: 1fr; }
        }

        /* ── Chart card ── */
        .analytics-chart-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .analytics-chart-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Section heading ── */
        .analytics-section-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin: 24px 0 10px;
        }

        /* ── Table ── */
        .analytics-table-wrap {
          overflow-x: auto;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
        }
        .analytics-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 520px;
        }
        .analytics-table thead tr { background: var(--surface-2); }
        .analytics-table th {
          text-align: left;
          padding: 11px 14px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .analytics-table td {
          padding: 10px 14px;
          color: var(--text-main);
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .analytics-table tbody tr:last-child td { border-bottom: none; }
        .analytics-table tbody tr:nth-child(even) { background: var(--surface-2); }
        .analytics-table tbody tr:hover { background: rgba(212,160,23,0.05); }
        .analytics-table-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 28px 0;
          font-size: 13px;
        }
      `}</style>

      <div className="analytics-page">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="analytics-header">
          <div className="analytics-header-inner">

            {/* Left: title + subtitle + tab pills */}
            <div className="analytics-header-left">
              <h1 className="analytics-header-title">
                <BarChart2 size={26} style={{ color: "#d4a017", flexShrink: 0 }} />
                {bi("Analytics Dashboard", "የትንተና ዳሽቦርድ")}
              </h1>
              <p className="analytics-header-sub">
                {bi(
                  "Real-time intelligence across all operations",
                  "በሁሉም ስራዎች ላይ የቀጥታ ትንተና",
                )}
              </p>
              <div className="analytics-tab-pills">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    className={`analytics-tab-pill ${activeTab === tab.key ? "active" : "inactive"}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="analytics-header-actions">

              {/* Engineering Sector connection status badge */}
              {engStatus !== null && (
                <div
                  title={engStatus.connected
                    ? `Live data from: ${engStatus.project}`
                    : `Engineering offline: ${engStatus.error}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20,
                    background: engStatus.connected
                      ? 'rgba(22,163,74,0.15)'
                      : 'rgba(220,38,38,0.15)',
                    border: `1px solid ${engStatus.connected ? 'rgba(22,163,74,0.5)' : 'rgba(220,38,38,0.5)'}`,
                    color: engStatus.connected ? '#16a34a' : '#dc2626',
                    fontSize: 12, fontWeight: 700, cursor: 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {engStatus.connected
                    ? <Wifi size={13} />
                    : <WifiOff size={13} />}
                  {engStatus.connected ? 'Eng. Live' : 'Eng. Offline'}
                </div>
              )}
              {engStatus === null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  background: 'rgba(212,160,23,0.12)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: '#d97706', fontSize: 12, fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  <Activity size={13} />
                  Connecting…
                </div>
              )}

              <button
                className="analytics-btn-ghost"
                onClick={() => loadData(true)}
                disabled={refreshing}
                title={bi("Refresh data", "ዳታ አድስ")}
              >
                <RefreshCw size={14} className={refreshing ? "analytics-spin" : ""} />
                {bi("Refresh", "አድስ")}
              </button>
              <button
                className="analytics-btn-ghost"
                onClick={() => console.log("[AnalyticsDashboard] Export PDF — not yet implemented")}
              >
                <Download size={14} />
                {bi("Export PDF", "PDF ወደ ውጭ ላክ")}
              </button>
            </div>


          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="analytics-container">

          {/* ═══════════════════════════════════════════ OVERVIEW TAB ══════ */}
          {activeTab === "overview" && (
            <>
              {/* 6 KPI Cards */}
              <div className="analytics-kpi-grid">
                {kpiCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div className="analytics-kpi-card" key={i}>
                      <div className="analytics-kpi-icon">
                        <Icon size={18} />
                      </div>
                      <p className="analytics-kpi-value">{card.value}</p>
                      <p className="analytics-kpi-label">{card.label}</p>
                      <p className={`analytics-kpi-trend ${card.trendUp ? "up" : "down"}`}>
                        {card.trendUp
                          ? <TrendingUp  size={12} />
                          : <TrendingDown size={12} />}
                        {card.trend}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 2-col: AreaChart + PieChart */}
              <div className="analytics-chart-2col">

                {/* Finance Trend Area */}
                <div className="analytics-chart-card">
                  <p className="analytics-chart-title">
                    <DollarSign size={15} style={{ color: "#d4a017" }} />
                    {bi("Finance Trend — 6 Months", "የፋይናንስ አዝማሚያ — 6 ወራት")}
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={finData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gcoll-ov" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#d4a017" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gpend-ov" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="rgba(37,99,168,0.6)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="rgba(37,99,168,0.6)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
                        width={48}
                      />
                      <Tooltip content={<ETBTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="collected"
                        name={bi("Collected", "የተሰበሰበ")}
                        stroke="#d4a017"
                        fill="url(#gcoll-ov)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        name={bi("Pending", "በመጠባበቅ ላይ")}
                        stroke="rgba(37,99,168,0.8)"
                        fill="url(#gpend-ov)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Project Status Pie */}
                <div className="analytics-chart-card">
                  <p className="analytics-chart-title">
                    <Building2 size={15} style={{ color: "#d4a017" }} />
                    {bi("Project Status", "የፕሮጀክት ሁኔታ")}
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="44%"
                        outerRadius={86}
                        dataKey="value"
                        label={({ name, percent }) =>
                          percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                        }
                        labelLine={false}
                        fontSize={11}
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Tooltip formatter={(v, name) => [v, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </>
          )}

          {/* ════════════════════════════════════════════ FINANCE TAB ══════ */}
          {activeTab === "finance" && (
            <>
              {/* Full-width AreaChart */}
              <div className="analytics-chart-card" style={{ marginBottom: 24 }}>
                <p className="analytics-chart-title">
                  <DollarSign size={15} style={{ color: "#d4a017" }} />
                  {bi("Finance Trend — 6 Months", "የፋይናንስ አዝማሚያ — 6 ወራት")}
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={finData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gcoll-fin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#d4a017" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gpend-fin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="rgba(37,99,168,0.6)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="rgba(37,99,168,0.6)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                      tickFormatter={v => `ETB ${(v / 1000).toFixed(0)}K`}
                      width={88}
                    />
                    <Tooltip content={<ETBTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      name={bi("Collected", "የተሰበሰበ")}
                      stroke="#d4a017"
                      fill="url(#gcoll-fin)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      name={bi("Pending", "በመጠባበቅ ላይ")}
                      stroke="rgba(37,99,168,0.8)"
                      fill="url(#gpend-fin)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Invoices table — last 10 by amount desc */}
              <p className="analytics-section-title">
                {bi("Recent Invoices", "የቅርብ ጊዜ ደረሰኞች")}
              </p>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>{bi("Client", "ደንበኛ")}</th>
                      <th>{bi("Amount (ETB)", "መጠን (ETB)")}</th>
                      <th>{bi("Status", "ሁኔታ")}</th>
                      <th>{bi("Due Date", "የሚከፈልበት ቀን")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="analytics-table-empty">
                          {bi("No invoice data available", "ምንም የደረሰኝ ዳታ የለም")}
                        </td>
                      </tr>
                    ) : (
                      [...invoices]
                        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
                        .slice(0, 10)
                        .map((inv, i) => (
                          <tr key={inv.id || i}>
                            <td style={{ fontWeight: 600 }}>
                              {inv.client || inv.clientName || "—"}
                            </td>
                            <td>{fmtETBFull(inv.amount)}</td>
                            <td><StatusBadge status={inv.status || "pending"} /></td>
                            <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                              {inv.dueDate || "—"}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════ HR TAB ═══════ */}
          {activeTab === "hr" && (
            <>
              {/* Department headcount BarChart */}
              <div className="analytics-chart-card" style={{ marginBottom: 24 }}>
                <p className="analytics-chart-title">
                  <Users size={15} style={{ color: "#d4a017" }} />
                  {bi("Headcount by Department", "ሰራተኛ ብዛት በክፍል")}
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={deptData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="dept"
                      tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name={bi("Employees", "ሰራተኞች")}
                      fill="var(--accent)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Employees table — 8 records */}
              <p className="analytics-section-title">
                {bi("Employee Directory", "የሰራተኞች ዝርዝር")}
              </p>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>{bi("Name", "ስም")}</th>
                      <th>{bi("Role", "ሚና")}</th>
                      <th>{bi("Department", "ክፍል")}</th>
                      <th>{bi("Salary (ETB)", "ደሞዝ (ETB)")}</th>
                      <th>{bi("Status", "ሁኔታ")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="analytics-table-empty">
                          {bi("No employee data available", "ምንም የሰራተኛ ዳታ የለም")}
                        </td>
                      </tr>
                    ) : (
                      employees.slice(0, 8).map((emp, i) => (
                        <tr key={emp.id || i}>
                          <td style={{ fontWeight: 600 }}>
                            {emp.name || emp.fullName || "—"}
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {emp.role || emp.position || "—"}
                          </td>
                          <td>{emp.department || "—"}</td>
                          <td>{fmtETBFull(emp.salary || emp.basicSalary || 0)}</td>
                          <td><EmployeeStatusBadge status={emp.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═════════════════════════════════════════ CONTRACTS TAB ═══════ */}
          {activeTab === "contracts" && (
            <>
              {/* Contract pipeline BarChart */}
              <div className="analytics-chart-card" style={{ marginBottom: 24 }}>
                <p className="analytics-chart-title">
                  <FileText size={15} style={{ color: "#d4a017" }} />
                  {bi("Contract Pipeline by Status", "ውሎች ፓይፕላይን በሁኔታ")}
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ctrData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="status"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name={bi("Contracts", "ውሎች")}
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Contracts table — last 10 by date desc */}
              <p className="analytics-section-title">
                {bi("Recent Contracts", "የቅርብ ጊዜ ውሎች")}
              </p>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>{bi("Title / Number", "ርዕስ / ቁጥር")}</th>
                      <th>{bi("Client", "ደንበኛ")}</th>
                      <th>{bi("Value (ETB)", "ዋጋ (ETB)")}</th>
                      <th>{bi("Status", "ሁኔታ")}</th>
                      <th>{bi("Date", "ቀን")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="analytics-table-empty">
                          {bi("No contract data available", "ምንም የውሎች ዳታ የለም")}
                        </td>
                      </tr>
                    ) : (
                      [...contracts]
                        .sort((a, b) => {
                          const da = new Date(a.createdAt || (a._ts?.seconds ? a._ts.seconds * 1000 : 0));
                          const db2 = new Date(b.createdAt || (b._ts?.seconds ? b._ts.seconds * 1000 : 0));
                          return db2 - da;
                        })
                        .slice(0, 10)
                        .map((con, i) => {
                          const dateRaw = con.createdAt
                            || (con._ts?.seconds ? new Date(con._ts.seconds * 1000).toISOString() : null)
                            || con.date
                            || null;
                          const dateLabel = dateRaw
                            ? new Date(dateRaw).toLocaleDateString("en-ET")
                            : "—";
                          return (
                            <tr key={con.id || i}>
                              <td style={{ fontWeight: 600 }}>
                                {con.title || con.contractNumber || `CON-${String(i + 1).padStart(3, "0")}`}
                              </td>
                              <td style={{ color: "var(--text-muted)" }}>
                                {con.client || con.clientName || "—"}
                              </td>
                              <td>{fmtETBFull(con.value || con.amount || con.contractValue || 0)}</td>
                              <td><ContractBadge status={con.status || "draft"} /></td>
                              <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {dateLabel}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
