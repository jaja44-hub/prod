import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import {
  Users,
  DollarSign,
  Search,
  FileText,
  TrendingUp,
  CheckCircle,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLang } from "../context/LangContext";
import { useAuth } from "../context/AuthContext";
import LockedOverlay from "../components/LockedOverlay";
import { getEmployees } from "../lib/neonHRAPI";
import * as GW from "../services/ServiceGateway";
import { PayrollService } from "../services/PayrollService";

export default function HRFortress() {
  const { language: lang } = useLang();
  const language = lang;
  const { userProfile, tenantConfig } = useAuth();
  const user = userProfile;
  const isET = tenantConfig?.complianceProfile === 'ethiopia_primary';
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [payrollResults, setPayrollResults] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [running, setRunning] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireForm, setHireForm] = useState({
    name: "",
    role: "",
    department: "",
    salary: "",
  });
  const [hrBusy, setHrBusy] = useState(false);

  const activeEmployees = employees.filter((e) => e.status !== "terminated");

  const reloadEmployees = async () => {
    try {
      const result = await getEmployees({ tenant_id: 'tenant_default' });
      const mapped = (result.data || result || []).map((e) => ({
        id: String(e.id),
        name: `${e.first_name} ${e.last_name}`,
        role: e.job_title || 'Staff',
        department: e.department || 'General',
        email: e.email,
        salary: e.salary || 0,
        status: e.active ? 'active' : 'terminated',
        tin_number: `TIN-${e.id}892`,
        pension_id: `PEN-${e.id}441`
      }));
      setEmployees(mapped);
    } catch (err) {
      console.warn('Neon HR fallback triggered:', err);
      GW.getEmployees().then(setEmployees);
    }
  };

  useEffect(() => {
    GW.getPayrollRuns(8).then(setPayrollHistory);
  }, []);

  // ── Payslip PDF Generator state ──
  const [showPayslipForm, setShowPayslipForm] = useState(false);
  const [psEmpId, setPsEmpId] = useState("");
  const [psGross, setPsGross] = useState("");
  const [psMonth, setPsMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    reloadEmployees();
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()),
  );

  const deptData = employees
    .reduce((acc, emp) => {
      const existing = acc.find((d) => d.dept === emp.department);
      if (existing) {
        existing.total += emp.salary;
        existing.count++;
      } else {
        acc.push({ dept: emp.department, total: emp.salary, count: 1 });
      }
      return acc;
    }, [])
    .map((d) => ({ ...d, avg: Math.round(d.total / d.count) }));

  const handleHire = async (e) => {
    e.preventDefault();
    if (!hireForm.name.trim() || !hireForm.department.trim()) return;
    setHrBusy(true);
    try {
      await GW.createEmployee({
        name: hireForm.name.trim(),
        role: hireForm.role.trim() || "Staff",
        department: hireForm.department.trim(),
        salary: Number(hireForm.salary) || 0,
        tier: 3,
      });
      await GW.logAuditEvent({
        user: user?.name,
        action: "EMPLOYEE_HIRED",
        module: "HR",
        detail: `Hired ${hireForm.name} (${hireForm.department})`,
        level: "info",
      });
      await reloadEmployees();
      setShowHireModal(false);
      setHireForm({ name: "", role: "", department: "", salary: "" });
    } catch (err) {
      console.error("[HR] Hire failed:", err);
    } finally {
      setHrBusy(false);
    }
  };

  const handleTerminate = async (emp) => {
    if (emp.status === "terminated") return;
    const ok = window.confirm(
      language === "am"
        ? `${emp.name} ን ማስወገድ ይፈልጋሉ?`
        : `Terminate ${emp.name}? This updates Firestore immediately.`,
    );
    if (!ok) return;
    setHrBusy(true);
    try {
      await GW.updateEmployee(emp.id, {
        status: "terminated",
        terminatedAt: new Date().toISOString().slice(0, 10),
      });
      await GW.logAuditEvent({
        user: user?.name,
        action: "EMPLOYEE_TERMINATED",
        module: "HR",
        detail: `Terminated ${emp.name} (${emp.id})`,
        level: "warning",
      });
      await reloadEmployees();
      if (selectedEmp?.id === emp.id) setSelectedEmp(null);
    } catch (err) {
      console.error("[HR] Terminate failed:", err);
    } finally {
      setHrBusy(false);
    }
  };

  const handleRunPayroll = async () => {
    setRunning(true);
    try {
      const results = PayrollService.runPayroll(activeEmployees, tenantConfig?.complianceProfile);
      const period = new Date().toISOString().slice(0, 7);
      await GW.savePayrollRun({
        period,
        results,
        employeeCount: activeEmployees.length,
        runBy: user?.name,
      });
      setPayrollResults(results);
      setPayrollHistory(await GW.getPayrollRuns(8));
      await GW.logAuditEvent({
        user: user?.name,
        action: "PAYROLL_RUN",
        module: "HR",
        detail: `Payroll calculated for ${activeEmployees.length} employees`,
        level: "info",
      });
    } catch (err) {
      console.error("[HR] Payroll run failed:", err);
    } finally {
      setRunning(false);
    }
  };

  // ── PDF Generator ──
  const generatePayslipPDF = () => {
    const emp = employees.find((e) => e.id === psEmpId);
    if (!emp) return;
    const gross = parseFloat(psGross) || emp.salary || 0;
    const slip = PayrollService.calculatePayslip({
      ...emp,
      grossSalary: gross,
    }, tenantConfig?.complianceProfile);
    const [year, month] = psMonth.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(month) - 1,
    ).toLocaleString("en-US", { month: "long" });
    const safeName = (emp.name || "employee").replace(/\s+/g, "_");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const W = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const gold = [212, 160, 23];
    const dark = [26, 32, 64];
    const light = [245, 246, 250];

    // ── Header banner ──
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, W, 42, "F");
    doc.setFillColor(gold[0], gold[1], gold[2]);
    doc.rect(0, 40, W, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("ADDIS CROWN Legal & Engineering Tech PLC", W / 2, 16, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("Monthly Payslip", W / 2, 25, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(180, 190, 210);
    doc.text(monthName + " " + year, W / 2, 33, { align: "center" });

    // ── Employee Info block ──
    doc.setFillColor(light[0], light[1], light[2]);
    doc.rect(14, 50, W - 28, 26, "F");
    doc.setDrawColor(220, 220, 230);
    doc.rect(14, 50, W - 28, 26, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text("EMPLOYEE", 20, 59);
    doc.text("DEPARTMENT", 90, 59);
    doc.text("PERIOD", 160, 59);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 80);
    doc.text(emp.name || "", 20, 69);
    doc.text(emp.department || "", 90, 69);
    doc.text(monthName + " " + year, 160, 69);

    // ── Earnings / Deductions table ──
    const taxable = slip.grossSalary - slip.employeePension;
    const rows = [
      { label: "Gross Salary", value: slip.grossSalary, type: "gross" },
      {
        label: "Pension (Employee 7%)",
        value: -slip.employeePension,
        type: "deduct",
      },
      { label: "Taxable Income", value: taxable, type: "info" },
      { label: "Income Tax", value: -slip.incomeTax, type: "deduct" },
      { label: "Net Pay", value: slip.netSalary, type: "net" },
    ];

    // Table header row
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(14, 84, W - 28, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPTION", 20, 91);
    doc.text("AMOUNT (ETB)", W - 20, 91, { align: "right" });

    let y = 101;
    rows.forEach((row, idx) => {
      const isNet = row.type === "net";
      const isDeduct = row.type === "deduct";

      if (idx % 2 === 0 && !isNet) {
        doc.setFillColor(248, 249, 252);
        doc.rect(14, y - 6, W - 28, 11, "F");
      }
      if (isNet) {
        doc.setFillColor(255, 248, 220);
        doc.rect(14, y - 6, W - 28, 11, "F");
        doc.setDrawColor(gold[0], gold[1], gold[2]);
        doc.setLineWidth(0.5);
        doc.rect(14, y - 6, W - 28, 11, "S");
      }

      doc.setFont("helvetica", isNet ? "bold" : "normal");
      doc.setFontSize(isNet ? 11 : 10);
      const labelColor = isNet ? dark : [50, 55, 80];
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.text(row.label, 20, y);

      const fmt = (n) =>
        (n < 0 ? "- " : "") +
        Math.abs(n).toLocaleString("en-ET", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      const valColor = isNet ? gold : isDeduct ? [220, 60, 60] : [50, 55, 80];
      doc.setTextColor(valColor[0], valColor[1], valColor[2]);
      doc.text(fmt(row.value), W - 20, y, { align: "right" });

      y += 11;
    });

    // Divider
    y += 4;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(14, y, W - 14, y);

    // Employer pension note
    y += 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(140, 145, 165);
    doc.text(
      "Employer Pension Contribution (11%): ETB " +
        slip.employerPension.toLocaleString("en-ET", {
          minimumFractionDigits: 2,
        }) +
        " — company cost, not deducted from employee.",
      14,
      y,
      { maxWidth: W - 28 },
    );

    // ── Footer ──
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, pageH - 18, W, 18, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 160, 190);
    doc.text("Generated by Addis Crown ERP", W / 2, pageH - 9, {
      align: "center",
    });
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("CONFIDENTIAL", 20, pageH - 9);
    doc.setTextColor(150, 160, 190);
    doc.text(new Date().toLocaleDateString("en-ET"), W - 20, pageH - 9, {
      align: "right",
    });

    doc.save("payslip_" + safeName + "_" + psMonth + ".pdf");

    GW.logAuditEvent({
      user: user?.name,
      action: "PAYSLIP_GENERATED",
      module: "HR",
      detail:
        "Payslip PDF generated for " +
        emp.name +
        " — " +
        monthName +
        " " +
        year,
      level: "info",
    });

    setShowPayslipForm(false);
  };

  const totalNetPayroll =
    payrollResults?.reduce((s, r) => s + r.netSalary, 0) ?? 0;
  const totalTax = payrollResults?.reduce((s, r) => s + r.incomeTax, 0) ?? 0;
  const totalGross =
    payrollResults?.reduce((s, r) => s + r.grossSalary, 0) ?? 0;

  return (
    <LockedOverlay moduleName="hr">
      <>
        <style>{`
          .hr-page {
            width: 100%;
            min-height: calc(100vh - var(--nav-height));
            background: var(--background);
          }

          /* ── Header ── */
          .hr-header {
            background: linear-gradient(135deg, #1a2040, #2a1a5e, #1a3c5e);
            color: #fff;
            padding: 48px 24px 40px;
            border-bottom: 3px solid var(--accent);
          }
          .hr-header h1 {
            color: #fff;
            font-size: clamp(22px, 3.5vw, 30px);
            margin: 0 0 8px;
          }
          .hr-header p {
            color: rgba(255,255,255,0.65);
            font-size: 14px;
            margin: 0;
          }

          /* ── Body layout ── */
          .hr-body {
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          /* ── KPI strip ── */
          .hr-kpi-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
          @media (max-width: 800px) { .hr-kpi-strip { grid-template-columns: repeat(2,1fr); } }
          @media (max-width: 480px) { .hr-kpi-strip { grid-template-columns: 1fr; } }
          .hr-kpi {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 18px 20px;
            box-shadow: var(--shadow-sm);
          }
          .hr-kpi-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            margin-bottom: 6px;
          }
          .hr-kpi-value {
            font-size: 22px;
            font-weight: 800;
            color: var(--primary);
            line-height: 1;
          }

          /* ── Generic card ── */
          .hr-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
          }
          .hr-card-header {
            background: var(--surface-2, #f8fafc);
            border-bottom: 1px solid var(--border);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
          }
          .hr-card-header h2 {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: var(--primary);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .hr-card-body { padding: 20px; }

          /* ── Search ── */
          .hr-search-wrap { position: relative; }
          .hr-search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            pointer-events: none;
          }
          .hr-search-input {
            padding: 7px 10px 7px 32px;
            width: 220px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            font-size: 13px;
            background: var(--surface);
            color: var(--text-main);
            outline: none;
            transition: border-color 0.15s;
          }
          .hr-search-input:focus { border-color: var(--primary); }

          /* ── Employee table ── */
          .hr-table { width: 100%; border-collapse: collapse; }
          .hr-table th {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            padding: 10px 14px;
            text-align: left;
            border-bottom: 2px solid var(--border);
            white-space: nowrap;
          }
          .hr-table td {
            padding: 12px 14px;
            font-size: 13px;
            color: var(--text-main);
            border-bottom: 1px solid var(--border);
          }
          .hr-table tr:last-child td { border-bottom: none; }
          .hr-table tbody tr { cursor: pointer; transition: background 0.1s; }
          .hr-table tbody tr:hover td { background: var(--surface-2, #f8fafc); }
          .hr-table tbody tr.selected td { background: rgba(37,99,168,0.06); }

          .hr-status-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 10px;
            text-transform: capitalize;
          }
          .hr-status-active  { background: rgba(22,163,74,0.12); color: #16a34a; }
          .hr-status-inactive { background: rgba(107,114,128,0.12); color: #6b7280; }
          .hr-salary { font-weight: 700; color: var(--primary); }

          /* ── Run Payroll button ── */
          .hr-run-btn {
            padding: 9px 20px;
            background: var(--accent);
            color: var(--text-main, #1a1a2e);
            border: none;
            border-radius: var(--radius-md);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .hr-run-btn:hover:not(:disabled) { filter: brightness(1.08); }
          .hr-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          /* ── Payroll summary tiles ── */
          .payroll-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 20px;
          }
          @media (max-width: 640px) { .payroll-summary { grid-template-columns: 1fr; } }
          .payroll-summary-item {
            background: var(--surface-2, #f8fafc);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 14px 16px;
          }
          .payroll-summary-label {
            font-size: 11px;
            color: var(--text-muted);
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .payroll-summary-value {
            font-size: 18px;
            font-weight: 800;
            color: var(--primary);
          }

          /* ── Payroll table ── */
          .payroll-table { width: 100%; border-collapse: collapse; }
          .payroll-table th {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-muted);
            padding: 8px 12px;
            border-bottom: 1px solid var(--border);
            text-align: right;
            white-space: nowrap;
          }
          .payroll-table th:first-child { text-align: left; }
          .payroll-table td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
            text-align: right;
            color: var(--text-main);
            font-size: 12px;
          }
          .payroll-table td:first-child {
            text-align: left;
            font-weight: 600;
          }
          .payroll-table tr:last-child td { border-bottom: none; }
          .payroll-net  { font-weight: 800; color: var(--success, #16a34a); }
          .payroll-tax  { color: var(--danger, #dc2626); }
          .payroll-muted { color: var(--text-muted); font-size: 11px; }

          /* ── Payslip selected row highlight ── */
          .payslip-card-header-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-muted);
          }
        `}</style>

        <div className="hr-page">
          {/* ── Page Header ── */}
          <div className="hr-header">
            <h1>
              {"👥 "}
              {language === "am" ? "የሰው ኃይል ማዕከል" : "HR Fortress"}
            </h1>
            <p>
              {language === "am"
                ? "የሰራተኞች ምዝገባ፣ ደሞዝ እና ፔይሮል"
                : "Employee Registry · Ethiopian Payroll Engine · Payslip Generator"}
            </p>
          </div>

          <div className="hr-body">
            {/* ── KPI Strip ── */}
            <div className="hr-kpi-strip">
              <div className="hr-kpi">
                <div className="hr-kpi-label">
                  {language === "am" ? "ሠራተኞች" : "Total Employees"}
                </div>
                <div className="hr-kpi-value">{employees.length}</div>
              </div>
              <div className="hr-kpi">
                <div className="hr-kpi-label">
                  {language === "am" ? "ንቁ ሰራተኞች" : "Active Staff"}
                </div>
                <div
                  className="hr-kpi-value"
                  style={{ color: "var(--success, #16a34a)" }}
                >
                  {employees.filter((e) => e.status === "active").length}
                </div>
              </div>
              <div className="hr-kpi">
                <div className="hr-kpi-label">
                  {language === "am" ? "ክፍሎች" : "Departments"}
                </div>
                <div className="hr-kpi-value">{deptData.length}</div>
              </div>
              <div className="hr-kpi">
                <div className="hr-kpi-label">
                  {language === "am" ? "ጠቅ. ደሞዝ (ETB)" : "Monthly Payroll"}
                </div>
                <div className="hr-kpi-value" style={{ fontSize: "16px" }}>
                  {PayrollService.formatETB(
                    employees.reduce((s, e) => s + (e.salary || 0), 0),
                  )}
                </div>
              </div>
            </div>

            {/* ── Department Salary Bar Chart ── */}
            <div className="hr-card">
              <div className="hr-card-header">
                <h2>
                  <TrendingUp size={15} />
                  {language === "am"
                    ? "በክፍል ደሞዝ ስርጭት"
                    : "Salary Distribution by Department"}
                </h2>
              </div>
              <div className="hr-card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={deptData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="dept"
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(v) => [
                        `ETB ${v.toLocaleString()}`,
                        language === "am" ? "አማካኝ ደሞዝ" : "Avg Salary",
                      ]}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="avg"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Employee Registry Table ── */}
            <div className="hr-card">
              <div className="hr-card-header">
                <h2>
                  <Users size={15} />
                  {language === "am" ? "የሰራተኞች መዝገብ" : "Employee Registry"}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    ({filtered.length})
                  </span>
                </h2>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    className="hr-run-btn"
                    style={{ padding: "8px 14px", fontSize: 13 }}
                    onClick={() => setShowHireModal(true)}
                  >
                    <UserPlus size={14} />
                    {language === "am" ? "ቅጥር" : "Hire"}
                  </button>
                  <div className="hr-search-wrap">
                    <Search size={14} className="hr-search-icon" />
                    <input
                      type="text"
                      className="hr-search-input"
                      placeholder={
                        language === "am"
                          ? "ፈልግ..."
                          : "Search name or department…"
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{language === "am" ? "ስም" : "Name"}</th>
                      <th>{language === "am" ? "ሚና" : "Role"}</th>
                      <th>{language === "am" ? "ክፍል" : "Department"}</th>
                      {isET && <th className="text-violet-600 dark:text-violet-400">TIN Number</th>}
                      {isET && <th className="text-violet-600 dark:text-violet-400">Pension ID</th>}
                      <th>
                        {language === "am" ? "ደሞዝ (ETB)" : "Salary (ETB)"}
                      </th>
                      <th>{language === "am" ? "ሁኔታ" : "Status"}</th>
                      <th>{language === "am" ? "እርምጃ" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                            padding: "28px",
                          }}
                        >
                          {language === "am"
                            ? "ምንም ሰራተኛ አልተገኘም"
                            : "No employees found"}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((emp) => (
                        <tr
                          key={emp.id}
                          className={
                            selectedEmp?.id === emp.id ? "selected" : ""
                          }
                          onClick={() =>
                            setSelectedEmp(
                              selectedEmp?.id === emp.id ? null : emp,
                            )
                          }
                        >
                          <td
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "11px",
                            }}
                          >
                            {emp.id}
                          </td>
                          <td style={{ fontWeight: 700 }}>{emp.name}</td>
                          <td>{emp.role}</td>
                          <td>{emp.department}</td>
                          {isET && (
                            <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>
                              {emp.tin_number || "N/A"}
                            </td>
                          )}
                          {isET && (
                            <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>
                              {emp.pension_id || "N/A"}
                            </td>
                          )}
                          <td className="hr-salary">
                            {emp.salary?.toLocaleString()}
                          </td>
                          <td>
                            <span
                              className={`hr-status-badge hr-status-${emp.status}`}
                            >
                              {emp.status}
                            </span>
                          </td>
                          <td>
                            {emp.status !== "terminated" ? (
                              <button
                                type="button"
                                className="hr-run-btn"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: 11,
                                  background: "rgba(220,38,38,0.1)",
                                  color: "var(--danger,#dc2626)",
                                }}
                                disabled={hrBusy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTerminate(emp);
                                }}
                              >
                                <UserMinus size={12} />
                                {language === "am" ? "ማስወገድ" : "Terminate"}
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {payrollHistory.length > 0 && (
              <div className="hr-card">
                <div className="hr-card-header">
                  <h2>
                    <CheckCircle size={15} />
                    {language === "am" ? "የፔይሮል ታሪክ" : "Payroll Run History"}
                  </h2>
                </div>
                <ul style={{ margin: 0, padding: "12px 24px 20px", listStyle: "none" }}>
                  {payrollHistory.map((run) => (
                    <li
                      key={run.id}
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 13,
                      }}
                    >
                      <strong>{run.period}</strong> — {run.employeeCount}{" "}
                      {language === "am" ? "ሰራተኞች" : "employees"} · {run.runBy || "—"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Individual Payslip Preview ── */}
            {selectedEmp &&
              (() => {
                const slip = PayrollService.calculatePayslip(selectedEmp, tenantConfig?.complianceProfile);
                return (
                  <div className="hr-card">
                    <div className="hr-card-header">
                      <h2>
                        <FileText size={15} />
                        {language === "am" ? "የፔይ ስሊፕ" : "Payslip Preview"}
                      </h2>
                      <span className="payslip-card-header-name">
                        {selectedEmp.name} &mdash; {selectedEmp.department}
                      </span>
                    </div>
                    <div className="hr-card-body">
                      <table className="payroll-table">
                        <thead>
                          <tr>
                            <th>{language === "am" ? "ዓይነት" : "Item"}</th>
                            <th>ETB Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              {language === "am" ? "ጠቅ. ደሞዝ" : "Gross Salary"}
                            </td>
                            <td>
                              {PayrollService.formatETB(slip.grossSalary)}
                            </td>
                          </tr>
                          <tr>
                            <td className="payroll-tax">
                              {language === "am" ? "ገቢ ቀረጥ" : "Income Tax"}
                              {slip.taxBracket
                                ? ` (${(slip.taxBracket.rate * 100).toFixed(0)}%)`
                                : " (0%)"}
                            </td>
                            <td className="payroll-tax">
                              &minus; {PayrollService.formatETB(slip.incomeTax)}
                            </td>
                          </tr>
                          <tr>
                            <td className="payroll-tax">
                              {language === "am"
                                ? "የሰራተኛ ጡረታ (7%)"
                                : "Employee Pension (7%)"}
                            </td>
                            <td className="payroll-tax">
                              &minus;{" "}
                              {PayrollService.formatETB(slip.employeePension)}
                            </td>
                          </tr>
                          <tr>
                            <td
                              className="payroll-net"
                              style={{ fontWeight: 800 }}
                            >
                              {language === "am" ? "የተፈራ ደሞዝ" : "Net Salary"}
                            </td>
                            <td className="payroll-net">
                              {PayrollService.formatETB(slip.netSalary)}
                            </td>
                          </tr>
                          <tr>
                            <td className="payroll-muted">
                              {language === "am"
                                ? "የቀጣሪ ጡረታ (11%) — የኩባንያ ወጪ"
                                : "Employer Pension (11%) — company cost"}
                            </td>
                            <td className="payroll-muted">
                              {PayrollService.formatETB(slip.employerPension)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

            {/* ── Generate Payslip PDF ── */}
            <div className="hr-card">
              <div className="hr-card-header">
                <h2>
                  <FileText size={15} />
                  {language === "am"
                    ? "ፔይ ስሊፕ PDF ፍጠር"
                    : "Generate Payslip PDF"}
                </h2>
                {!showPayslipForm && (
                  <button
                    className="hr-run-btn"
                    onClick={() => {
                      setShowPayslipForm(true);
                      if (employees.length > 0) {
                        setPsEmpId(employees[0].id);
                        setPsGross(String(employees[0].salary || ""));
                      }
                    }}
                    disabled={employees.length === 0}
                  >
                    <FileText size={13} />
                    {language === "am" ? "ፔይ ስሊፕ ፍጠር" : "Generate Payslip"}
                  </button>
                )}
              </div>

              {showPayslipForm && (
                <div className="hr-card-body">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {/* Employee selector */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          marginBottom: "6px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {language === "am" ? "ሠራተኛ" : "Employee"}
                      </label>
                      <select
                        value={psEmpId}
                        onChange={(e) => {
                          setPsEmpId(e.target.value);
                          const emp = employees.find(
                            (emp) => emp.id === e.target.value,
                          );
                          if (emp) setPsGross(String(emp.salary || ""));
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          background: "var(--surface)",
                          color: "var(--text-main)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} — {emp.department}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gross Salary */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          marginBottom: "6px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {language === "am"
                          ? "ጥሬ ደሞዝ (ETB)"
                          : "Gross Salary (ETB)"}
                      </label>
                      <input
                        type="number"
                        value={psGross}
                        onChange={(e) => setPsGross(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          background: "var(--surface)",
                          color: "var(--text-main)",
                          fontSize: "13px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        placeholder="e.g. 25000"
                      />
                    </div>

                    {/* Month */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          marginBottom: "6px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {language === "am" ? "ወር" : "Pay Period (Month)"}
                      </label>
                      <input
                        type="month"
                        value={psMonth}
                        onChange={(e) => setPsMonth(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          background: "var(--surface)",
                          color: "var(--text-main)",
                          fontSize: "13px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  {/* Live preview of calculated values */}
                  {psEmpId &&
                    psGross &&
                    (() => {
                      const emp = employees.find((e) => e.id === psEmpId);
                      if (!emp) return null;
                      const preview = PayrollService.calculatePayslip({
                        ...emp,
                        grossSalary: parseFloat(psGross) || 0,
                      }, tenantConfig?.complianceProfile);
                      return (
                        <div
                          style={{
                            background: "var(--surface-2, #f8fafc)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            padding: "14px 18px",
                            marginBottom: "1.25rem",
                            display: "flex",
                            gap: "2rem",
                            flexWrap: "wrap",
                            fontSize: "12px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontWeight: 600,
                              }}
                            >
                              Gross:
                            </span>{" "}
                            <strong>
                              {PayrollService.formatETB(preview.grossSalary)}
                            </strong>
                          </div>
                          <div>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontWeight: 600,
                              }}
                            >
                              Pension (7%):
                            </span>{" "}
                            <span style={{ color: "#dc2626" }}>
                              {PayrollService.formatETB(
                                preview.employeePension,
                              )}
                            </span>
                          </div>
                          <div>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontWeight: 600,
                              }}
                            >
                              Income Tax:
                            </span>{" "}
                            <span style={{ color: "#dc2626" }}>
                              {PayrollService.formatETB(preview.incomeTax)}
                            </span>
                          </div>
                          <div>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontWeight: 600,
                              }}
                            >
                              Net Pay:
                            </span>{" "}
                            <strong
                              style={{
                                color: "var(--accent, #d4a017)",
                                fontSize: "13px",
                              }}
                            >
                              {PayrollService.formatETB(preview.netSalary)}
                            </strong>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={generatePayslipPDF}
                      disabled={!psEmpId || !psGross}
                      style={{
                        padding: "9px 22px",
                        background: "var(--accent, #d4a017)",
                        color: "#000",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor:
                          !psEmpId || !psGross ? "not-allowed" : "pointer",
                        opacity: !psEmpId || !psGross ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FileText size={14} />
                      {language === "am" ? "PDF አውርድ" : "Download PDF"}
                    </button>
                    <button
                      onClick={() => setShowPayslipForm(false)}
                      style={{
                        padding: "9px 18px",
                        background: "transparent",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {language === "am" ? "ሰርዝ" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Run Monthly Payroll ── */}
            <div className="hr-card">
              <div className="hr-card-header">
                <h2>
                  <DollarSign size={15} />
                  {language === "am" ? "ፔይሮል ያስሂዱ" : "Run Monthly Payroll"}
                </h2>
                <button
                  className="hr-run-btn"
                  onClick={handleRunPayroll}
                  disabled={running || employees.length === 0}
                >
                  {running ? (
                    "⏳ Running…"
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      {language === "am" ? "ፔይሮል ጀምር" : "Calculate Payroll"}
                    </>
                  )}
                </button>
              </div>

              {payrollResults && (
                <div className="hr-card-body">
                  {/* Summary tiles */}
                  <div className="payroll-summary">
                    <div className="payroll-summary-item">
                      <div className="payroll-summary-label">
                        {language === "am" ? "ጠቅ. ጥሬ ደሞዝ" : "Total Gross"}
                      </div>
                      <div
                        className="payroll-summary-value"
                        style={{ fontSize: "15px" }}
                      >
                        {PayrollService.formatETB(totalGross)}
                      </div>
                    </div>
                    <div className="payroll-summary-item">
                      <div className="payroll-summary-label">
                        {language === "am" ? "ጠቅ. ቀረጥ" : "Total Income Tax"}
                      </div>
                      <div
                        className="payroll-summary-value"
                        style={{
                          color: "var(--danger, #dc2626)",
                          fontSize: "15px",
                        }}
                      >
                        {PayrollService.formatETB(totalTax)}
                      </div>
                    </div>
                    <div className="payroll-summary-item">
                      <div className="payroll-summary-label">
                        {language === "am" ? "ጠቅ. የተፈራ" : "Total Net Payroll"}
                      </div>
                      <div
                        className="payroll-summary-value"
                        style={{
                          color: "var(--success, #16a34a)",
                          fontSize: "15px",
                        }}
                      >
                        {PayrollService.formatETB(totalNetPayroll)}
                      </div>
                    </div>
                  </div>

                  {/* Full payroll breakdown table */}
                  <div style={{ overflowX: "auto" }}>
                    <table className="payroll-table">
                      <thead>
                        <tr>
                          <th>{language === "am" ? "ስም" : "Employee"}</th>
                          <th>{language === "am" ? "ጥሬ ደሞዝ" : "Gross"}</th>
                          <th>{language === "am" ? "ቀረጥ" : "Tax"}</th>
                          <th>
                            {language === "am" ? "ጡረታ (7%)" : "Pension (7%)"}
                          </th>
                          <th>
                            {language === "am" ? "ጡረታ (11%)" : "Employer (11%)"}
                          </th>
                          <th>{language === "am" ? "የተፈራ" : "Net"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollResults.map((r) => (
                          <tr key={r.employeeId}>
                            <td>{r.employeeName}</td>
                            <td>{PayrollService.formatETB(r.grossSalary)}</td>
                            <td className="payroll-tax">
                              {PayrollService.formatETB(r.incomeTax)}
                            </td>
                            <td className="payroll-tax">
                              {PayrollService.formatETB(r.employeePension)}
                            </td>
                            <td className="payroll-muted">
                              {PayrollService.formatETB(r.employerPension)}
                            </td>
                            <td className="payroll-net">
                              {PayrollService.formatETB(r.netSalary)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      {showHireModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHireModal(false);
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 420,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0 }}>
                {language === "am" ? "ሰራተኛ ቅጥር" : "Hire Employee"}
              </h3>
              <button
                type="button"
                onClick={() => setShowHireModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleHire} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                required
                placeholder={language === "am" ? "ሙሉ ስም" : "Full name"}
                value={hireForm.name}
                onChange={(e) => setHireForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                placeholder={language === "am" ? "ሚና" : "Role"}
                value={hireForm.role}
                onChange={(e) => setHireForm((f) => ({ ...f, role: e.target.value }))}
              />
              <input
                required
                placeholder={language === "am" ? "ክፍል" : "Department"}
                value={hireForm.department}
                onChange={(e) =>
                  setHireForm((f) => ({ ...f, department: e.target.value }))
                }
              />
              <input
                type="number"
                min={0}
                placeholder={language === "am" ? "ደሞዝ (ETB)" : "Salary (ETB)"}
                value={hireForm.salary}
                onChange={(e) => setHireForm((f) => ({ ...f, salary: e.target.value }))}
              />
              <button type="submit" className="hr-run-btn" disabled={hrBusy}>
                {hrBusy
                  ? language === "am"
                    ? "እየተቀመጠ…"
                    : "Saving…"
                  : language === "am"
                    ? "ወደ Firestore አስቀምጥ"
                    : "Save to Firestore"}
              </button>
            </form>
          </div>
        </div>
      )}
      </>
    </LockedOverlay>
  );
}
