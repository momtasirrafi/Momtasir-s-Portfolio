const STORAGE_KEY = "employee-attendance-system-v1";
const WORKDAY_HOURS = 10;
const MISSED_CLOCK_IN_FINE = 50;
const DEFAULT_EMPLOYEES = [
  "Bashar",
  "Jahid",
  "Tanvir",
  "Shoheb",
  "Shukanto",
  "Rafi",
  "Shafwan",
  "Arnab",
  "Faiyaz",
];

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  clockLabel: document.querySelector("#clockLabel"),
  totalEmployees: document.querySelector("#totalEmployees"),
  clockedInToday: document.querySelector("#clockedInToday"),
  leaveToday: document.querySelector("#leaveToday"),
  fineToday: document.querySelector("#fineToday"),
  employeeCards: document.querySelector("#employeeCards"),
  employeeTemplate: document.querySelector("#employeeCardTemplate"),
  employeeForm: document.querySelector("#employeeForm"),
  employeeName: document.querySelector("#employeeName"),
  reportEmployee: document.querySelector("#reportEmployee"),
  reportFrom: document.querySelector("#reportFrom"),
  reportTo: document.querySelector("#reportTo"),
  exportBtn: document.querySelector("#exportBtn"),
  recordsTable: document.querySelector("#recordsTable"),
  weekendNotice: document.querySelector("#weekendNotice"),
  markMissedBtn: document.querySelector("#markMissedBtn"),
  clearDemoBtn: document.querySelector("#clearDemoBtn"),
};

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  return {
    employees: DEFAULT_EMPLOYEES.map((name, index) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `employee-${index + 1}`,
      name,
      active: true,
    })),
    records: [],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-BD", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat("en-BD", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getTodayRecord(employeeId) {
  const today = formatDate();
  let record = state.records.find((item) => item.employeeId === employeeId && item.date === today);

  if (!record) {
    record = {
      id: crypto.randomUUID ? crypto.randomUUID() : `record-${Date.now()}-${employeeId}`,
      employeeId,
      date: today,
      status: "Not Started",
      clockIn: "",
      clockOut: "",
      leaveType: "",
      fine: 0,
      note: "",
    };
    state.records.push(record);
  }

  return record;
}

function getEmployeeName(employeeId) {
  return state.employees.find((employee) => employee.id === employeeId)?.name || "Unknown";
}

function calculateHours(record) {
  if (!record.clockIn || !record.clockOut) return 0;

  const start = new Date(record.clockIn);
  const end = new Date(record.clockOut);
  const diff = Math.max(0, end - start);
  return diff / 1000 / 60 / 60;
}

function statusLabel(record) {
  if (record.leaveType === "full") return "Full Day Leave";
  if (record.leaveType === "half") return "Half Day Leave";
  if (record.clockOut) return calculateHours(record) >= WORKDAY_HOURS ? "Completed" : "Short Hours";
  if (record.clockIn) return "Clocked In";
  if (record.fine > 0) return "Missed Clock-In";
  return "Not Started";
}

function setLeave(employeeId, leaveType) {
  const record = getTodayRecord(employeeId);
  record.leaveType = leaveType;
  record.status = leaveType === "full" ? "Full Day Leave" : "Half Day Leave";
  record.fine = 0;

  if (leaveType === "full") {
    record.clockIn = "";
    record.clockOut = "";
  }

  saveState();
  render();
}

function clockIn(employeeId) {
  if (isWeekend()) return;

  const record = getTodayRecord(employeeId);
  if (record.leaveType === "full") return;

  record.clockIn = record.clockIn || new Date().toISOString();
  record.status = "Clocked In";
  record.fine = 0;
  saveState();
  render();
}

function clockOut(employeeId) {
  if (isWeekend()) return;

  const record = getTodayRecord(employeeId);
  if (!record.clockIn || record.leaveType === "full") return;

  const requiredEnd = new Date(new Date(record.clockIn).getTime() + WORKDAY_HOURS * 60 * 60 * 1000);
  const now = new Date();
  record.clockOut = now < requiredEnd ? requiredEnd.toISOString() : now.toISOString();
  record.status = statusLabel(record);
  saveState();
  render();
}

function applyMissedClockInFines() {
  if (isWeekend()) return;

  state.employees
    .filter((employee) => employee.active)
    .forEach((employee) => {
      const record = getTodayRecord(employee.id);
      if (!record.clockIn && !record.leaveType) {
        record.status = "Missed Clock-In";
        record.fine = MISSED_CLOCK_IN_FINE;
        record.note = "Employee did not clock in.";
      }
    });

  saveState();
  render();
}

function addEmployee(name) {
  const cleanName = name.trim();
  if (!cleanName) return;

  state.employees.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `employee-${Date.now()}`,
    name: cleanName,
    active: true,
  });
  saveState();
  render();
}

function removeEmployee(employeeId) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) return;

  employee.active = false;
  saveState();
  render();
}

function exportReport() {
  const employeeId = elements.reportEmployee.value;
  const from = elements.reportFrom.value || "0000-01-01";
  const to = elements.reportTo.value || "9999-12-31";
  const rows = state.records
    .filter((record) => (employeeId === "all" || record.employeeId === employeeId) && record.date >= from && record.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));

  const tableRows = rows
    .map((record) => {
      const hours = calculateHours(record);
      return `
        <tr>
          <td>${record.date}</td>
          <td>${escapeHtml(getEmployeeName(record.employeeId))}</td>
          <td>${statusLabel(record)}</td>
          <td>${record.clockIn ? formatTime(new Date(record.clockIn)) : ""}</td>
          <td>${record.clockOut ? formatTime(new Date(record.clockOut)) : ""}</td>
          <td>${hours.toFixed(2)}</td>
          <td>${record.fine}</td>
        </tr>`;
    })
    .join("");

  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Worked Hours</th>
              <th>Fine BDT</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const employeeName = employeeId === "all" ? "all-employees" : getEmployeeName(employeeId).toLowerCase().replace(/\s+/g, "-");
  link.href = URL.createObjectURL(blob);
  link.download = `attendance-report-${employeeName}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmployeeCards() {
  elements.employeeCards.innerHTML = "";
  const weekend = isWeekend();

  state.employees
    .filter((employee) => employee.active)
    .forEach((employee) => {
      const record = getTodayRecord(employee.id);
      const card = elements.employeeTemplate.content.cloneNode(true);
      const article = card.querySelector(".employee-card");
      const status = statusLabel(record);

      article.querySelector("h3").textContent = employee.name;
      article.querySelector(".status-pill").textContent = status;
      article.querySelector(".status-pill").dataset.status = status.toLowerCase().replace(/\s+/g, "-");
      article.querySelector(".clock-in-value").textContent = record.clockIn ? formatTime(new Date(record.clockIn)) : "--";
      article.querySelector(".clock-out-value").textContent = record.clockOut ? formatTime(new Date(record.clockOut)) : "--";
      article.querySelector(".worked-value").textContent = `${calculateHours(record).toFixed(1)}h`;

      article.querySelector(".clock-in-btn").disabled = weekend || Boolean(record.clockIn) || record.leaveType === "full";
      article.querySelector(".clock-out-btn").disabled = weekend || !record.clockIn || Boolean(record.clockOut) || record.leaveType === "full";
      article.querySelector(".half-leave-btn").disabled = weekend || record.leaveType === "full";
      article.querySelector(".full-leave-btn").disabled = weekend || Boolean(record.clockIn);

      article.querySelector(".clock-in-btn").addEventListener("click", () => clockIn(employee.id));
      article.querySelector(".clock-out-btn").addEventListener("click", () => clockOut(employee.id));
      article.querySelector(".half-leave-btn").addEventListener("click", () => setLeave(employee.id, "half"));
      article.querySelector(".full-leave-btn").addEventListener("click", () => setLeave(employee.id, "full"));
      article.querySelector(".remove-btn").addEventListener("click", () => removeEmployee(employee.id));

      elements.employeeCards.appendChild(card);
    });
}

function renderReportOptions() {
  const selected = elements.reportEmployee.value || "all";
  elements.reportEmployee.innerHTML = `<option value="all">All employees</option>`;
  state.employees
    .filter((employee) => employee.active)
    .forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee.id;
      option.textContent = employee.name;
      elements.reportEmployee.appendChild(option);
    });
  elements.reportEmployee.value = selected;
}

function renderRecordsTable() {
  const rows = [...state.records]
    .filter((record) => state.employees.some((employee) => employee.id === record.employeeId))
    .sort((a, b) => `${b.date}${b.clockIn || ""}`.localeCompare(`${a.date}${a.clockIn || ""}`))
    .slice(0, 30);

  elements.recordsTable.innerHTML = rows.length
    ? rows
        .map((record) => {
          const hours = calculateHours(record);
          return `
            <tr>
              <td>${record.date}</td>
              <td>${escapeHtml(getEmployeeName(record.employeeId))}</td>
              <td>${statusLabel(record)}</td>
              <td>${record.clockIn ? formatTime(new Date(record.clockIn)) : "--"}</td>
              <td>${record.clockOut ? formatTime(new Date(record.clockOut)) : "--"}</td>
              <td>${hours.toFixed(1)}h</td>
              <td>${record.fine ? `${record.fine} BDT` : "--"}</td>
            </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" class="empty-state">No records yet.</td></tr>`;
}

function renderStats() {
  const today = formatDate();
  const todayRecords = state.records.filter((record) => record.date === today);
  elements.totalEmployees.textContent = state.employees.filter((employee) => employee.active).length;
  elements.clockedInToday.textContent = todayRecords.filter((record) => record.clockIn).length;
  elements.leaveToday.textContent = todayRecords.filter((record) => record.leaveType).length;
  elements.fineToday.textContent = `${todayRecords.reduce((sum, record) => sum + Number(record.fine || 0), 0)} BDT`;
}

function render() {
  elements.todayLabel.textContent = formatDisplayDate();
  elements.clockLabel.textContent = formatTime();
  elements.weekendNotice.classList.toggle("hidden", !isWeekend());
  elements.markMissedBtn.disabled = isWeekend();
  renderStats();
  renderReportOptions();
  renderEmployeeCards();
  renderRecordsTable();
  saveState();
}

elements.employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEmployee(elements.employeeName.value);
  elements.employeeName.value = "";
});

elements.exportBtn.addEventListener("click", exportReport);
elements.markMissedBtn.addEventListener("click", applyMissedClockInFines);
elements.clearDemoBtn.addEventListener("click", () => {
  if (!confirm("Reset all local attendance data?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  render();
});

const today = formatDate();
elements.reportFrom.value = today;
elements.reportTo.value = today;

render();
setInterval(render, 1000);
