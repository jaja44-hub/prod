import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Briefcase, FileText,
  Download, Plus, Calculator, ShieldCheck, Clock, Archive,
  X, Layers, AlertTriangle,
} from "lucide-react";
import { useLang } from "../context/LangContext";
import { useAuth } from "../context/AuthContext";
import { FinanceService, formatETB } from "../services/FinanceService";
import * as GW from "../services/ServiceGateway";

// ── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  "Materials", "Labor", "Equipment", "Services", "Admin", "Other",
];

const INCOME_CATEGORIES = [
  "Consultation Fee", "Contract Payment", "Retainer", "Commission", "Other",
];

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImperialFinanceMinistry() {
  const { language: lang } = useLang();
  const language = lang;
  const { user } = useAuth();

  // Data state
  const [ledger, setLedger]         = useState([]);
  const [vatReport, setVatReport]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("ledger");

  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({
    desc: "", amount: "", category: "Materials",
  });

  // Income modal
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeData, setIncomeData] = useState({
    desc: "", amount: "", category: "Consultation Fee",
  });

  // ── Data Loading ───────────────────────────────────────────────────────────

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgerData, vatData] = await Promise.all([
        FinanceService.getLedger(CURRENT_MONTH, CURRENT_YEAR),
        FinanceService.generateVATReport(CURRENT_MONTH, CURRENT_YEAR),
      ]);
      setLedger(ledgerData || []);
      setVatReport(vatData);
    } catch (err) {
      console.error("[Treasury] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── KPI Calculations ───────────────────────────────────────────────────────

  const totalRevenue = ledger
    .filter(e => e.type?.toUpperCase() === "INCOME")
    .reduce((s, e) => s + (e.amount || 0), 0);

  const operationalCost = ledger
    .filter(e => e.type?.toUpperCase() === "EXPENSE")
    .reduce((s, e) => s + (e.amount || 0), 0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    if (!expenseData.desc || !expenseData.amount) return;
    try {
      await FinanceService.recordTransaction({
        type: "EXPENSE",
        desc: expenseData.desc,
        amount: Number(expenseData.amount),
        category: expenseData.category,
      });
      await GW.logAuditEvent({
        user: user?.name || "Unknown",
        action: "EXPENSE_RECORDED",
        module: "Treasury",
        detail: `Expense: ${expenseData.desc} — ${formatETB(expenseData.amount)}`,
        level: "info",
      });
      setShowExpenseModal(false);
      setExpenseData({ desc: "", amount: "", category: "Materials" });
      loadData();
    } catch (err) {
      console.error("[Treasury] Expense record error:", err);
    }
  };

  const handleRecordIncome = async (e) => {
    e.preventDefault();
    if (!incomeData.desc || !incomeData.amount) return;
    try {
      await FinanceService.recordTransaction({
        type: "INCOME",
        desc: incomeData.desc,
        amount: Number(incomeData.amount),
        category: incomeData.category,
      });
      await GW.logAuditEvent({
        user: user?.name || "Unknown",
        action: "INCOME_RECORDED",
        module: "Treasury",
        detail: `Income: ${incomeData.desc} — ${formatETB(incomeData.amount)}`,
        level: "info",
      });
      setShowIncomeModal(false);
      setIncomeData({ desc: "", amount: "", category: "Consultation Fee" });
      loadData();
    } catch (err) {
      console.error("[Treasury] Income record error:", err);
    }
  };

  // ── Access Guard ───────────────────────────────────────────────────────────
  // Imperial Treasury — CEO + Manager (tier 1) only. tier > 1 → locked.

  if (user?.tier > 1) {
    return (
      <>
        <style>{`
          .ministry-locked-wrap {
            min-height: calc(100vh - var(--nav-height));
            display: flex; align-items: center; justify-content: center;
            background: var(--background);
          }
          .ministry-locked-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-top: 4px solid var(--accent);
            border-radius: var(--radius-lg);
            padding: 56px 48px;
            text-align: center;
            max-width: 480px;
            box-shadow: var(--shadow-md);
            display: flex; flex-direction: column; align-items: center; gap: 14px;
          }
          .ministry-locked-card h2 { margin: 0; color: var(--primary); font-size: 20px; font-weight: 700; }
          .ministry-locked-card p { margin: 0; color: var(--text-muted); font-size: 14px; line-height: 1.6; }
          .ministry-locked-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(212,160,23,0.12); border: 1px solid rgba(212,160,23,0.4);
            color: var(--accent); font-size: 11px; font-weight: 800; letter-spacing: 1px;
            text-transform: uppercase; padding: 5px 14px; border-radius: 20px;
          }
        `}</style>
        <div className="ministry-locked-wrap">
          <div className="ministry-locked-card">
            <AlertTriangle size={44} style={{ color: "var(--accent)" }} />
            <div className="ministry-locked-badge">Imperial Access Only</div>
            <h2>Access Restricted / ፍቃድ የለዎትም</h2>
            <p>
              The Imperial Treasury is restricted to Tier 1 executives only.<br />
              Contact your CEO to request elevated access.
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
              ይህ ሞጁል ለሥራ አስፈፃሚዎች (Tier 1) ብቻ ነው።
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Tabs Definition ────────────────────────────────────────────────────────

  const TABS = [
    {
      key: "ledger",
      label: language === "am" ? "ሒሳብ ደብተር" : "Ledger",
      icon: <FileText size={13} />,
    },
    {
      key: "vat",
      label: language === "am" ? "ቫት ሪፖርት" : "VAT Report",
      icon: <Layers size={13} />,
    },
    {
      key: "annual",
      label: language === "am" ? "ዓመታዊ ሪፖርት" : "Annual",
      icon: <Briefcase size={13} />,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Scoped CSS ── */}
      <style>{`
        /* ─────────────────────────────────────
           Page Shell
           ───────────────────────────────────── */
        .ministry-page {
          width: 100%;
          min-height: calc(100vh - var(--nav-height));
          background: var(--background);
        }

        /* ─────────────────────────────────────
           Header
           ───────────────────────────────────── */
        .ministry-header {
          background: linear-gradient(135deg, #0f2540, #1a3c5e);
          color: #fff;
          border-bottom: 3px solid var(--accent);
        }
        .ministry-header-top {
          max-width: 1300px;
          margin: 0 auto;
          padding: 36px 24px 24px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .ministry-header-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(212,160,23,0.2);
          border: 1px solid var(--accent);
          color: var(--accent);
          font-size: 11px; font-weight: 800; letter-spacing: 1px;
          text-transform: uppercase; padding: 4px 12px;
          border-radius: 20px; margin-bottom: 10px; width: fit-content;
        }
        .ministry-page-title {
          color: #fff;
          font-size: clamp(20px, 3.5vw, 30px);
          font-weight: 700; margin: 0;
        }
        .ministry-page-subtitle {
          color: rgba(255,255,255,0.55);
          font-size: 13px; margin: 5px 0 0;
        }
        .ministry-header-actions {
          display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
          flex-shrink: 0; padding-top: 6px;
        }

        /* ─────────────────────────────────────
           Tab Pills
           ───────────────────────────────────── */
        .ministry-tab-bar {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 24px 0;
          display: flex; gap: 4px; align-items: center;
        }
        .ministry-tab-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.65);
          padding: 9px 20px;
          border-radius: 20px 20px 0 0;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .ministry-tab-pill:hover {
          background: rgba(255,255,255,0.16);
          color: #fff;
        }
        .ministry-tab-pill.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #1a1a2e;
          font-weight: 800;
        }

        /* ─────────────────────────────────────
           Body
           ───────────────────────────────────── */
        .ministry-body {
          max-width: 1300px;
          margin: 0 auto;
          padding: 28px 24px;
          display: flex; flex-direction: column; gap: 22px;
        }

        /* ─────────────────────────────────────
           Buttons (header-context defaults: dark bg)
           ───────────────────────────────────── */
        .ministry-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: var(--radius-md);
          color: rgba(255,255,255,0.8);
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .ministry-btn-ghost:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.55);
          color: #fff;
        }
        .ministry-btn-gold {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px;
          background: var(--accent);
          border: none;
          border-radius: var(--radius-md);
          color: #1a1a2e;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .ministry-btn-gold:hover {
          background: var(--accent-light);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .ministry-btn-green {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px;
          background: rgba(22,163,74,0.15);
          border: 1px solid rgba(22,163,74,0.4);
          border-radius: var(--radius-md);
          color: #4ade80;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .ministry-btn-green:hover { background: var(--success); color: #fff; }

        /* Ghost button — light surface overrides */
        .ministry-annual-footer .ministry-btn-ghost,
        .ministry-modal-card .ministry-btn-ghost {
          border-color: var(--border);
          color: var(--text-muted);
          background: transparent;
        }
        .ministry-annual-footer .ministry-btn-ghost:hover,
        .ministry-modal-card .ministry-btn-ghost:hover {
          background: var(--surface-2);
          color: var(--text-main);
          border-color: var(--primary);
        }

        /* ─────────────────────────────────────
           KPI Grid
           ───────────────────────────────────── */
        .ministry-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .ministry-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 580px) {
          .ministry-kpi-grid { grid-template-columns: 1fr; }
        }
        .ministry-kpi-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: 4px solid transparent;
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .ministry-kpi-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .ministry-kpi-card.income  { border-top-color: var(--success); }
        .ministry-kpi-card.expense { border-top-color: var(--danger); }
        .ministry-kpi-card.vat     { border-top-color: var(--warning); }
        .ministry-kpi-card.profit  { border-top-color: var(--accent); }

        .ministry-kpi-icon {
          width: 50px; height: 50px;
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ministry-kpi-card.income  .ministry-kpi-icon { background: rgba(22,163,74,0.1);  color: var(--success); }
        .ministry-kpi-card.expense .ministry-kpi-icon { background: rgba(220,38,38,0.1);  color: var(--danger); }
        .ministry-kpi-card.vat     .ministry-kpi-icon { background: rgba(217,119,6,0.1);  color: var(--warning); }
        .ministry-kpi-card.profit  .ministry-kpi-icon { background: rgba(212,160,23,0.1); color: var(--accent); }

        .ministry-kpi-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.6px; color: var(--text-muted); margin-bottom: 5px;
        }
        .ministry-kpi-value { font-size: 17px; font-weight: 800; color: var(--text-main); }

        /* ─────────────────────────────────────
           Section Card (generic container)
           ───────────────────────────────────── */
        .ministry-section-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          overflow: hidden;
        }
        .ministry-section-header {
          background: var(--surface-2);
          border-bottom: 1px solid var(--border);
          padding: 16px 24px;
          display: flex; align-items: center; gap: 10px;
        }
        .ministry-section-header h2 {
          margin: 0; font-size: 15px; font-weight: 700; color: var(--primary);
        }

        /* ─────────────────────────────────────
           Ledger Table
           ───────────────────────────────────── */
        .ministry-table-wrap { overflow-x: auto; }
        .ministry-table {
          width: 100%; border-collapse: collapse; font-size: 13px;
        }
        .ministry-table th {
          text-align: left; padding: 12px 18px;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
          white-space: nowrap;
        }
        .ministry-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          color: var(--text-main);
          vertical-align: middle;
        }
        .ministry-table tr:last-child td { border-bottom: none; }
        .ministry-table tbody tr:hover { background: var(--surface-2); }

        .ministry-empty-row td {
          text-align: center; color: var(--text-muted);
          padding: 52px 16px; font-style: italic; font-size: 14px;
        }
        .ministry-category-pill {
          display: inline-block;
          padding: 2px 10px;
          background: rgba(37,99,168,0.09);
          color: var(--primary-light);
          border-radius: 10px;
          font-size: 11px; font-weight: 600;
          white-space: nowrap;
        }
        .ministry-amount-income { color: var(--success); font-weight: 700; }
        .ministry-amount-expense { color: var(--danger); font-weight: 700; }

        /* ─────────────────────────────────────
           VAT Tab — Two-Column Layout
           ───────────────────────────────────── */
        .ministry-vat-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .ministry-vat-grid { grid-template-columns: 1fr; }
        }

        .ministry-vat-body { padding: 24px; display: flex; flex-direction: column; gap: 10px; }
        .ministry-vat-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 14px; color: var(--text-main); padding: 10px 0;
        }
        .ministry-vat-row.total {
          font-weight: 800; font-size: 16px; color: var(--primary);
        }
        .ministry-vat-divider {
          border: none; border-top: 1px dashed var(--border); margin: 4px 0;
        }
        .ministry-vat-due-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(217,119,6,0.1);
          border: 1px solid rgba(217,119,6,0.35);
          color: var(--warning);
          font-size: 11px; font-weight: 800; letter-spacing: 0.6px;
          padding: 6px 16px; border-radius: 20px;
          margin-top: 10px; width: fit-content;
          text-transform: uppercase;
        }

        .ministry-vat-info-col { display: flex; flex-direction: column; gap: 12px; }
        .ministry-vat-info-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          box-shadow: var(--shadow-sm);
        }
        .ministry-vat-info-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 5px;
        }
        .ministry-vat-info-value { font-size: 15px; font-weight: 700; color: var(--text-main); }

        /* Download button in VAT col — full width */
        .ministry-vat-info-col .ministry-btn-gold {
          width: 100%; justify-content: center;
        }

        /* ─────────────────────────────────────
           Annual Tab
           ───────────────────────────────────── */
        .ministry-annual-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: var(--border);
          gap: 1px;
        }
        @media (max-width: 860px) {
          .ministry-annual-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .ministry-annual-stats { grid-template-columns: 1fr; }
        }
        .ministry-annual-stat { background: var(--surface); padding: 28px 24px; }
        .ministry-annual-stat-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px;
        }
        .ministry-annual-stat-value { font-size: 18px; font-weight: 800; }
        .ministry-annual-stat-value.clr-success { color: var(--success); }
        .ministry-annual-stat-value.clr-danger   { color: var(--danger); }
        .ministry-annual-stat-value.clr-primary  { color: var(--primary); }
        .ministry-annual-stat-value.clr-warning  { color: var(--warning); }

        .ministry-annual-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          flex-wrap: wrap; gap: 14px;
        }
        .ministry-annual-doc {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; font-weight: 600; color: var(--text-main);
        }
        .ministry-annual-actions { display: flex; gap: 10px; flex-wrap: wrap; }

        /* ─────────────────────────────────────
           Loading / Empty States
           ───────────────────────────────────── */
        .ministry-loading {
          text-align: center; color: var(--text-muted);
          padding: 80px 24px; font-size: 15px;
        }

        /* ─────────────────────────────────────
           Modal (inline — no Modal import)
           ───────────────────────────────────── */
        .ministry-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 2000;
          display: flex; align-items: center; justify-content: center;
        }
        .ministry-modal-card {
          width: 440px;
          max-width: calc(100vw - 32px);
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 28px;
          box-shadow: var(--shadow-lg);
        }
        .ministry-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .ministry-modal-header h3 {
          margin: 0; font-size: 18px; font-weight: 700; color: var(--text-main);
        }
        .ministry-modal-close {
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer; padding: 6px 8px;
          display: flex; align-items: center;
          transition: all 0.2s;
        }
        .ministry-modal-close:hover {
          background: var(--danger); color: #fff; border-color: var(--danger);
        }

        .ministry-form-group { margin-bottom: 18px; }
        .ministry-form-label {
          display: block;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 7px;
        }
        .ministry-form-input {
          width: 100%; padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 14px; color: var(--text-main);
          background: var(--surface);
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          outline: none;
        }
        .ministry-form-input:focus {
          border-color: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(37,99,168,0.12);
        }
        .ministry-form-actions {
          display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;
        }
      `}</style>

      {/* ── Page ── */}
      <div className="ministry-page">

        {/* ── Header ── */}
        <div className="ministry-header">
          <div className="ministry-header-top">
            {/* Title Group */}
            <div>
              <div className="ministry-header-badge">
                <Calculator size={13} /> Imperial Treasury
              </div>
              <h1 className="ministry-page-title">
                {language === "am" ? "የፋይናንስ ሚኒስቴር" : "Ministry of Treasury"}
              </h1>
              <p className="ministry-page-subtitle">
                {language === "am"
                  ? "ፋይናንሻል ሒሳብ · ቫት ሪፖርት · ዓመታዊ ዘገባ"
                  : "Financial Ledger · VAT Reporting · Annual Declaration"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="ministry-header-actions">
              <button
                className="ministry-btn-ghost"
                onClick={() => FinanceService.generateInvoice()}
                title="Archive"
              >
                <Archive size={14} />
                {language === "am" ? "መዝገብ" : "Archive"}
              </button>
              <button
                className="ministry-btn-green"
                onClick={() => setShowIncomeModal(true)}
              >
                <TrendingUp size={14} />
                {language === "am" ? "ገቢ ይመዝግቡ" : "Record Income"}
              </button>
              <button
                className="ministry-btn-gold"
                onClick={() => setShowExpenseModal(true)}
              >
                <Plus size={14} />
                {language === "am" ? "ወጪ ይመዝግቡ" : "Record Expense"}
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="ministry-tab-bar">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`ministry-tab-pill${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ministry-body">

          {/* KPI Cards */}
          <div className="ministry-kpi-grid">
            <div className="ministry-kpi-card income">
              <div className="ministry-kpi-icon"><TrendingUp size={22} /></div>
              <div>
                <div className="ministry-kpi-label">
                  {language === "am" ? "ጠቅላላ ገቢ" : "Total Revenue"}
                </div>
                <div className="ministry-kpi-value">{formatETB(totalRevenue)}</div>
              </div>
            </div>

            <div className="ministry-kpi-card expense">
              <div className="ministry-kpi-icon"><TrendingDown size={22} /></div>
              <div>
                <div className="ministry-kpi-label">
                  {language === "am" ? "የሥራ ወጪ" : "Operational Cost"}
                </div>
                <div className="ministry-kpi-value">{formatETB(operationalCost)}</div>
              </div>
            </div>

            <div className="ministry-kpi-card vat">
              <div className="ministry-kpi-icon"><Layers size={22} /></div>
              <div>
                <div className="ministry-kpi-label">
                  {language === "am" ? "ቫት ዕዳ" : "VAT Liability"}
                </div>
                <div className="ministry-kpi-value">{formatETB(vatReport?.payableVAT)}</div>
              </div>
            </div>

            <div className="ministry-kpi-card profit">
              <div className="ministry-kpi-icon"><ShieldCheck size={22} /></div>
              <div>
                <div className="ministry-kpi-label">
                  {language === "am" ? "ተጣራ ትርፍ" : "Net Profit"}
                </div>
                <div className="ministry-kpi-value">{formatETB(vatReport?.netProfit)}</div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="ministry-loading">
              {language === "am" ? "ፋይናንሻል ዳታ በመጫን ላይ..." : "Loading financial data..."}
            </div>
          ) : (
            <>
              {/* ── LEDGER TAB ── */}
              {activeTab === "ledger" && (
                <div className="ministry-section-card">
                  <div className="ministry-section-header">
                    <FileText size={15} style={{ color: "var(--primary)" }} />
                    <h2>
                      {language === "am" ? "የሒሳብ ደብተር" : "Financial Ledger"}
                    </h2>
                    <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-muted)" }}>
                      {ledger.length} {language === "am" ? "ግቤቶች" : "entries"}
                    </span>
                  </div>
                  <div className="ministry-table-wrap">
                    <table className="ministry-table">
                      <thead>
                        <tr>
                          <th>{language === "am" ? "መግለጫ" : "Description"}</th>
                          <th>{language === "am" ? "ምድብ" : "Category"}</th>
                          <th>{language === "am" ? "መጠን" : "Amount"}</th>
                          <th>VAT</th>
                          <th>{language === "am" ? "ቀን" : "Date"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.length === 0 ? (
                          <tr className="ministry-empty-row">
                            <td colSpan={5}>
                              <em>
                                {language === "am"
                                  ? "ምንም ሒሳብ አልተመዘገበም..."
                                  : "No transactions recorded..."}
                              </em>
                            </td>
                          </tr>
                        ) : (
                          ledger.map((entry, i) => {
                            const isIncome = entry.type?.toUpperCase() === "INCOME";
                            const rawTs = entry.timestamp ?? entry.ts;
                            const entryDate = rawTs?.toDate
                              ? rawTs.toDate()
                              : rawTs
                                ? new Date(rawTs)
                                : null;
                            return (
                              <tr key={entry.id || i}>
                                <td>{entry.description || entry.desc || "—"}</td>
                                <td>
                                  <span className="ministry-category-pill">
                                    {entry.category || "—"}
                                  </span>
                                </td>
                                <td className={isIncome ? "ministry-amount-income" : "ministry-amount-expense"}>
                                  {isIncome ? "+" : "−"}{formatETB(entry.amount)}
                                </td>
                                <td style={{ color: "var(--text-muted)" }}>
                                  {formatETB(entry.vatAmount || 0)}
                                </td>
                                <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                  {entryDate
                                    ? entryDate.toLocaleDateString("en-ET")
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── VAT TAB ── */}
              {activeTab === "vat" && (
                <div className="ministry-vat-grid">
                  {/* Left: VAT Calculation Detail */}
                  <div className="ministry-section-card">
                    <div className="ministry-section-header">
                      <Calculator size={15} style={{ color: "var(--primary)" }} />
                      <h2>
                        {language === "am" ? "ቫት ሒሳብ" : "VAT Calculation"}
                      </h2>
                    </div>
                    <div className="ministry-vat-body">
                      <div className="ministry-vat-row">
                        <span>{language === "am" ? "ውጪ ቫት (15%)" : "Output VAT (15%)"}</span>
                        <span style={{ fontWeight: 700 }}>
                          {formatETB(vatReport?.outputVAT)}
                        </span>
                      </div>
                      <div className="ministry-vat-row">
                        <span>{language === "am" ? "ግቤት ቫት (ሊጠየቅ)" : "Input VAT (Claimable)"}</span>
                        <span style={{ color: "var(--success)", fontWeight: 700 }}>
                          ({formatETB(vatReport?.inputVAT)})
                        </span>
                      </div>
                      <hr className="ministry-vat-divider" />
                      <div className="ministry-vat-row total">
                        <span>{language === "am" ? "ተጣራ ቫት የሚከፈል" : "Net VAT Payable"}</span>
                        <span>{formatETB(vatReport?.payableVAT)}</span>
                      </div>
                      <div>
                        <div className="ministry-vat-due-badge">
                          <Clock size={12} />
                          {language === "am" ? "የክፍያ ቀን፡ ቀን 25" : "DUE: DAY 25 OF EACH MONTH"}
                        </div>
                      </div>
                      <div style={{ marginTop: 12, padding: "14px", background: "var(--surface-2)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--text-muted)" }}>
                        <strong style={{ color: "var(--text-main)" }}>
                          {language === "am" ? "ማሳሰቢያ:" : "Note:"}
                        </strong>{" "}
                        {language === "am"
                          ? "ቫት ሪፖርት እያንዳንዱ ወር ቀን 25 በፊት ወደ ERCA መቅረብ አለበት።"
                          : "VAT returns must be filed with ERCA before the 25th of each month."}
                      </div>
                    </div>
                  </div>

                  {/* Right: Info Cards */}
                  <div className="ministry-vat-info-col">
                    <div className="ministry-vat-info-card">
                      <div className="ministry-vat-info-label">
                        {language === "am" ? "ወቅት" : "Period"}
                      </div>
                      <div className="ministry-vat-info-value">
                        {CURRENT_MONTH}/{CURRENT_YEAR}
                      </div>
                    </div>

                    <div className="ministry-vat-info-card">
                      <div className="ministry-vat-info-label">
                        {language === "am" ? "ዓይነት" : "Regime Type"}
                      </div>
                      <div className="ministry-vat-info-value">
                        Standard VAT — ET
                      </div>
                    </div>

                    <div className="ministry-vat-info-card">
                      <div className="ministry-vat-info-label">
                        {language === "am" ? "ሁኔታ" : "Filing Status"}
                      </div>
                      <div className="ministry-vat-info-value" style={{ color: "var(--warning)" }}>
                        {language === "am" ? "ያልቀረበ" : "Pending Declaration"}
                      </div>
                    </div>

                    <button className="ministry-btn-gold">
                      <Download size={14} />
                      {language === "am" ? "ቫት ዘገባ አውርድ" : "Download VAT Declaration"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── ANNUAL TAB ── */}
              {activeTab === "annual" && (
                <div className="ministry-section-card">
                  <div className="ministry-section-header">
                    <Briefcase size={15} style={{ color: "var(--primary)" }} />
                    <h2>
                      {language === "am"
                        ? `ዓመታዊ ሒሳብ ሪፖርት — ${CURRENT_YEAR}`
                        : `Annual Financial Report — ${CURRENT_YEAR}`}
                    </h2>
                  </div>

                  {/* Stats Row */}
                  <div className="ministry-annual-stats">
                    <div className="ministry-annual-stat">
                      <div className="ministry-annual-stat-label">
                        {language === "am" ? "ጠቅላላ ገቢ" : "Total Revenue"}
                      </div>
                      <div className="ministry-annual-stat-value clr-success">
                        {formatETB(totalRevenue)}
                      </div>
                    </div>
                    <div className="ministry-annual-stat">
                      <div className="ministry-annual-stat-label">
                        {language === "am" ? "ጠቅላላ ወጪ" : "Total Expense"}
                      </div>
                      <div className="ministry-annual-stat-value clr-danger">
                        {formatETB(operationalCost)}
                      </div>
                    </div>
                    <div className="ministry-annual-stat">
                      <div className="ministry-annual-stat-label">
                        {language === "am" ? "ተጣራ ትርፍ" : "Net Profit"}
                      </div>
                      <div className="ministry-annual-stat-value clr-primary">
                        {formatETB(vatReport?.netProfit)}
                      </div>
                    </div>
                    <div className="ministry-annual-stat">
                      <div className="ministry-annual-stat-label">
                        {language === "am" ? "ኮርፖሬት ግብር (30%)" : "Corporate Tax (30%)"}
                      </div>
                      <div className="ministry-annual-stat-value clr-warning">
                        {formatETB((vatReport?.netProfit || 0) * 0.3)}
                      </div>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="ministry-annual-footer">
                    <div className="ministry-annual-doc">
                      <FileText size={16} style={{ color: "var(--primary)" }} />
                      <span>ANNUAL-{CURRENT_YEAR}.pdf auto-generated</span>
                    </div>
                    <div className="ministry-annual-actions">
                      <button className="ministry-btn-ghost">
                        <Download size={14} />
                        {language === "am" ? "ሪፖርት አውርድ" : "Download Report"}
                      </button>
                      <button className="ministry-btn-gold">
                        <ShieldCheck size={14} />
                        {language === "am" ? "ሕጋዊ ፊርማ ያረጋግጡ" : "VERIFY LEGAL HANDSHAKE"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          EXPENSE MODAL — inline, no Modal import
          ═══════════════════════════════════════════════════════ */}
      {showExpenseModal && (
        <div
          className="ministry-modal-overlay"
          onClick={() => setShowExpenseModal(false)}
        >
          <div
            className="ministry-modal-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="ministry-modal-header">
              <h3>
                <TrendingDown size={18} style={{ color: "var(--danger)", marginRight: 8, verticalAlign: "middle" }} />
                {language === "am" ? "ወጪ ይመዝግቡ" : "Record Expense"}
              </h3>
              <button
                className="ministry-modal-close"
                onClick={() => setShowExpenseModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordExpense}>
              <div className="ministry-form-group">
                <label className="ministry-form-label">
                  {language === "am" ? "መግለጫ" : "Description"}
                </label>
                <input
                  className="ministry-form-input"
                  type="text"
                  placeholder={language === "am" ? "ወጪ ይግለጹ..." : "Enter expense description..."}
                  value={expenseData.desc}
                  onChange={e =>
                    setExpenseData(prev => ({ ...prev, desc: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="ministry-form-group">
                <label className="ministry-form-label">
                  {language === "am" ? "መጠን (ብር)" : "Amount (ETB)"}
                </label>
                <input
                  className="ministry-form-input"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={expenseData.amount}
                  onChange={e =>
                    setExpenseData(prev => ({ ...prev, amount: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="ministry-form-group">
                <label className="ministry-form-label">
                  {language === "am" ? "ምድብ" : "Category"}
                </label>
                <select
                  className="ministry-form-input"
                  value={expenseData.category}
                  onChange={e =>
                    setExpenseData(prev => ({ ...prev, category: e.target.value }))
                  }
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="ministry-form-actions">
                <button
                  type="button"
                  className="ministry-btn-ghost"
                  onClick={() => setShowExpenseModal(false)}
                >
                  {language === "am" ? "ሰርዝ" : "Cancel"}
                </button>
                <button type="submit" className="ministry-btn-gold">
                  <Plus size={14} />
                  {language === "am" ? "ወጪ ምዝግብ" : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          INCOME MODAL — inline
          ═══════════════════════════════════════════════════════ */}
      {showIncomeModal && (
        <div
          className="ministry-modal-overlay"
          onClick={() => setShowIncomeModal(false)}
        >
          <div
            className="ministry-modal-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="ministry-modal-header">
              <h3>
                <TrendingUp size={18} style={{ color: "var(--success)", marginRight: 8, verticalAlign: "middle" }} />
                {language === "am" ? "ገቢ ይመዝግቡ" : "Record Income"}
              </h3>
              <button
                className="ministry-modal-close"
                onClick={() => setShowIncomeModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordIncome}>
              <div className="ministry-form-group">
                <label className="ministry-form-label">
                  {language === "am" ? "መግለጫ" : "Description"}
                </label>
                <input
                  className="ministry-form-input"
                  type="text"
                  placeholder={language === "am" ? "ገቢ ይግለጹ..." : "Enter income description..."}
                  value={incomeData.desc}
                  onChange={e =>
                    setIncomeData(prev => ({ ...prev, desc: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="ministry-form-group">
                <label className="ministry-form-label">
                  {language === "am" ? "መጠን (ብር)" : "Amount (ETB)"}
                </label>
                <input
                  className="ministry-form-input"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={incomeData.amount}
                  onChange={e =>
                    setIncomeData(prev => ({ ...prev, amount: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="ministry-form-group">
                <label className="ministry-form-label">
                  {language === "am" ? "ምድብ" : "Category"}
                </label>
                <select
                  className="ministry-form-input"
                  value={incomeData.category}
                  onChange={e =>
                    setIncomeData(prev => ({ ...prev, category: e.target.value }))
                  }
                >
                  {INCOME_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="ministry-form-actions">
                <button
                  type="button"
                  className="ministry-btn-ghost"
                  onClick={() => setShowIncomeModal(false)}
                >
                  {language === "am" ? "ሰርዝ" : "Cancel"}
                </button>
                <button type="submit" className="ministry-btn-gold">
                  <TrendingUp size={14} />
                  {language === "am" ? "ገቢ ምዝግብ" : "Record Income"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
