import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const DEFAULT_MONTH = "2026-04";

const emptyEmployee = {
  name: "",
  email: "",
  designation: "",
  basicSalary: "",
  hourlyRate: "",
};

const emptyAttendance = {
  employeeId: "",
  month: DEFAULT_MONTH,
  totalWorkingHours: 168,
  overtimeHours: 0,
  absenceDays: 0,
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatMonth(value) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`));
}

async function fetchJson(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function StatCard({ label, value, helper }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [dashboard, setDashboard] = useState({
    totalEmployees: 0,
    totalMonthlyPayroll: 0,
    pendingPayrollCount: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [attendanceForm, setAttendanceForm] = useState(emptyAttendance);
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedPayslip = useMemo(
    () => payroll.find((item) => item.attendanceId === selectedPayslipId) || payroll[0],
    [payroll, selectedPayslipId],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const [employeeRows, attendanceRows, payrollRows, dashboardData] =
      await Promise.all([
        fetchJson("/employees"),
        fetchJson("/attendance"),
        fetchJson(`/payroll?month=${selectedMonth}`),
        fetchJson(`/dashboard?month=${selectedMonth}`),
      ]);

    setEmployees(employeeRows);
    setAttendance(attendanceRows);
    setPayroll(payrollRows);
    setDashboard(dashboardData);
    setSelectedPayslipId((currentId) => {
      if (payrollRows.some((item) => item.attendanceId === currentId)) {
        return currentId;
      }

      return payrollRows[0]?.attendanceId || null;
    });
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    loadData().catch((error) => {
      setNotice(error.message);
      setLoading(false);
    });
  }, [loadData]);

  async function handleAddEmployee(event) {
    event.preventDefault();

    try {
      await fetchJson("/employees", {
        method: "POST",
        body: JSON.stringify(employeeForm),
      });
      setEmployeeForm(emptyEmployee);
      setNotice("Employee added successfully.");
      await loadData();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleAddAttendance(event) {
    event.preventDefault();

    try {
      await fetchJson("/attendance", {
        method: "POST",
        body: JSON.stringify(attendanceForm),
      });
      setSelectedMonth(attendanceForm.month);
      setNotice("Attendance captured and payroll recalculated.");
      setAttendanceForm((form) => ({
        ...emptyAttendance,
        month: form.month,
        employeeId: form.employeeId,
      }));
    } catch (error) {
      setNotice(error.message);
    }
  }

  function downloadPayslip(item) {
    const doc = new jsPDF();
    const rows = [
      ["Employee", item.name],
      ["Designation", item.designation],
      ["Email", item.email],
      ["Month", formatMonth(item.month)],
      ["Basic salary", formatCurrency(item.basicSalary)],
      ["Overtime amount", formatCurrency(item.overtimeAmount)],
      ["Deduction", formatCurrency(item.deduction)],
      ["Net salary", formatCurrency(item.netSalary)],
    ];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Payroll Automation Payslip", 20, 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Demo SaaS payroll breakdown", 20, 32);

    let y = 48;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 82, y);
      y += 10;
    });

    doc.save(`${item.name.replaceAll(" ", "-").toLowerCase()}-${item.month}-payslip.pdf`);
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Beginner friendly SaaS demo</p>
          <h1>Payroll Automation</h1>
          <p className="intro">
            Manage employees, enter attendance, calculate monthly payroll, and
            download PDF payslips from a simple SQLite-backed app.
          </p>
        </div>
        <label className="month-picker">
          Payroll month
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          />
        </label>
      </section>

      {notice ? <p className="notice">{notice}</p> : null}

      <section className="dashboard-grid">
        <StatCard
          label="Total employees"
          value={dashboard.totalEmployees}
          helper="People in the payroll database"
        />
        <StatCard
          label="Monthly payroll"
          value={formatCurrency(dashboard.totalMonthlyPayroll)}
          helper={`Calculated for ${formatMonth(selectedMonth)}`}
        />
        <StatCard
          label="Pending payroll"
          value={dashboard.pendingPayrollCount}
          helper="Employees missing attendance"
        />
      </section>

      <section className="workspace-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Add employee</h2>
            <span>Step 1</span>
          </div>
          <form className="form-grid" onSubmit={handleAddEmployee}>
            <label>
              Name
              <input
                required
                value={employeeForm.name}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, name: event.target.value })
                }
                placeholder="Nadia Akter"
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={employeeForm.email}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, email: event.target.value })
                }
                placeholder="nadia@company.com"
              />
            </label>
            <label>
              Designation
              <input
                required
                value={employeeForm.designation}
                onChange={(event) =>
                  setEmployeeForm({
                    ...employeeForm,
                    designation: event.target.value,
                  })
                }
                placeholder="Payroll Specialist"
              />
            </label>
            <div className="two-columns">
              <label>
                Basic salary
                <input
                  required
                  min="1"
                  type="number"
                  value={employeeForm.basicSalary}
                  onChange={(event) =>
                    setEmployeeForm({
                      ...employeeForm,
                      basicSalary: event.target.value,
                    })
                  }
                  placeholder="50000"
                />
              </label>
              <label>
                Hourly rate
                <input
                  required
                  min="1"
                  type="number"
                  value={employeeForm.hourlyRate}
                  onChange={(event) =>
                    setEmployeeForm({
                      ...employeeForm,
                      hourlyRate: event.target.value,
                    })
                  }
                  placeholder="350"
                />
              </label>
            </div>
            <button type="submit">Add employee</button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Attendance input</h2>
            <span>Step 2</span>
          </div>
          <form className="form-grid" onSubmit={handleAddAttendance}>
            <label>
              Employee
              <select
                required
                value={attendanceForm.employeeId}
                onChange={(event) =>
                  setAttendanceForm({
                    ...attendanceForm,
                    employeeId: event.target.value,
                  })
                }
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option value={employee.id} key={employee.id}>
                    {employee.name} - {employee.designation}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Month
              <input
                required
                type="month"
                value={attendanceForm.month}
                onChange={(event) =>
                  setAttendanceForm({ ...attendanceForm, month: event.target.value })
                }
              />
            </label>
            <label>
              Total working hours
              <input
                required
                min="0"
                type="number"
                value={attendanceForm.totalWorkingHours}
                onChange={(event) =>
                  setAttendanceForm({
                    ...attendanceForm,
                    totalWorkingHours: event.target.value,
                  })
                }
              />
            </label>
            <div className="two-columns">
              <label>
                Overtime hours
                <input
                  min="0"
                  type="number"
                  value={attendanceForm.overtimeHours}
                  onChange={(event) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      overtimeHours: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Absence days
                <input
                  min="0"
                  type="number"
                  value={attendanceForm.absenceDays}
                  onChange={(event) =>
                    setAttendanceForm({
                      ...attendanceForm,
                      absenceDays: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <button type="submit">Calculate payroll</button>
          </form>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Employee list</h2>
            <span>{employees.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Basic salary</th>
                  <th>Hourly rate</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.name}</strong>
                      <small>{employee.email}</small>
                    </td>
                    <td>{employee.designation}</td>
                    <td>{formatCurrency(employee.basic_salary)}</td>
                    <td>{formatCurrency(employee.hourly_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Recent attendance</h2>
            <span>{attendance.length} entries</span>
          </div>
          <div className="attendance-list">
            {attendance.slice(0, 6).map((entry) => (
              <article key={entry.id}>
                <strong>{entry.employee_name}</strong>
                <span>{formatMonth(entry.month)}</span>
                <small>
                  {entry.total_working_hours}h total, {entry.overtime_hours}h OT,{" "}
                  {entry.absence_days} absent
                </small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel payroll-panel">
        <div className="panel-heading">
          <h2>Payroll calculation</h2>
          <span>{loading ? "Loading" : `${payroll.length} payslips`}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic</th>
                <th>Overtime amount</th>
                <th>Deduction</th>
                <th>Net salary</th>
                <th>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((item) => (
                <tr key={item.attendanceId}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>
                      {item.overtimeHours}h overtime x {formatCurrency(item.hourlyRate)} x 1.5
                    </small>
                  </td>
                  <td>{formatCurrency(item.basicSalary)}</td>
                  <td>{formatCurrency(item.overtimeAmount)}</td>
                  <td>{formatCurrency(item.deduction)}</td>
                  <td>
                    <strong>{formatCurrency(item.netSalary)}</strong>
                  </td>
                  <td>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setSelectedPayslipId(item.attendanceId)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!payroll.length && !loading ? (
                <tr>
                  <td colSpan="6">No payroll entries for this month yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedPayslip ? (
        <section className="payslip-card">
          <div className="payslip-head">
            <div>
              <p className="eyebrow">Payslip</p>
              <h2>{selectedPayslip.name}</h2>
              <span>
                {selectedPayslip.designation} - {formatMonth(selectedPayslip.month)}
              </span>
            </div>
            <button type="button" onClick={() => downloadPayslip(selectedPayslip)}>
              Download PDF
            </button>
          </div>
          <div className="breakdown-grid">
            <div>
              <span>Basic salary</span>
              <strong>{formatCurrency(selectedPayslip.basicSalary)}</strong>
            </div>
            <div>
              <span>Overtime amount</span>
              <strong>{formatCurrency(selectedPayslip.overtimeAmount)}</strong>
            </div>
            <div>
              <span>Deduction</span>
              <strong>{formatCurrency(selectedPayslip.deduction)}</strong>
            </div>
            <div className="net-pay">
              <span>Net salary</span>
              <strong>{formatCurrency(selectedPayslip.netSalary)}</strong>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
