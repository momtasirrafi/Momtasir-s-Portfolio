const LEGACY_STORAGE_KEY = "employee-attendance-system-v1";
const ADMIN_PASSWORD = "1234";
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
  employeePanelTab: document.querySelector("#employeePanelTab"),
  adminPanelTab: document.querySelector("#adminPanelTab"),
  employeePanel: document.querySelector("#employeePanel"),
  adminPanel: document.querySelector("#adminPanel"),
  adminPasswordModal: document.querySelector("#adminPasswordModal"),
  adminPasswordForm: document.querySelector("#adminPasswordForm"),
  adminPasswordInput: document.querySelector("#adminPasswordInput"),
  adminPasswordError: document.querySelector("#adminPasswordError"),
  adminPasswordCancel: document.querySelector("#adminPasswordCancel"),
  employeePanelSelect: document.querySelector("#employeePanelSelect"),
  employeeWeekendNotice: document.querySelector("#employeeWeekendNotice"),
  selectedEmployeeName: document.querySelector("#selectedEmployeeName"),
  selectedEmployeeStatus: document.querySelector("#selectedEmployeeStatus"),
  selfClockIn: document.querySelector("#selfClockIn"),
  selfClockOut: document.querySelector("#selfClockOut"),
  selfWorked: document.querySelector("#selfWorked"),
  selfClockInBtn: document.querySelector("#selfClockInBtn"),
  selfClockOutBtn: document.querySelector("#selfClockOutBtn"),
  selfHalfLeaveBtn: document.querySelector("#selfHalfLeaveBtn"),
  selfFullLeaveBtn: document.querySelector("#selfFullLeaveBtn"),
  selfTotalLeave: document.querySelector("#selfTotalLeave"),
  selfTotalFine: document.querySelector("#selfTotalFine"),
  selfCompletedDays: document.querySelector("#selfCompletedDays"),
  selfRecordsTable: document.querySelector("#selfRecordsTable"),
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

let state = createDefaultState();
let activePanel = "employee";

function createDefaultState() {
  return {
    employees: DEFAULT_EMPLOYEES.map((name, index) => ({
      id: `employee-${index + 1}`,
      name,
      active: true,
    })),
    records: [],
  };
}

async function loadStateFromDatabase() {
  try {
    const response = await fetch("/api/db");
    if (!response.ok) throw new Error("Database load failed");
    state = await response.json();
    migrateLegacyLocalStorage();
  } catch (error) {
    console.error(error);
  }
}

function migrateLegacyLocalStorage() {
  const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved || state.records.length > 0) return;

  try {
    const legacyState = JSON.parse(saved);
    if (!Array.isArray(legacyState.employees) || !Array.isArray(legacyState.records)) return;
    state = legacyState;
    saveState();
  } catch (error) {
    console.error(error);
  }
}

async function saveState() {
  try {
    await fetch("/api/db", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error(error);
  }
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
    saveState();
  }

  return record;
}

function getEmployeeName(employeeId) {
  return state.employees.find((employee) => employee.id === employeeId)?.name || "Unknown";
}

function calculateHours(record) {
  if (!record.clockIn) return 0;

  const start = new Date(record.clockIn);
  const end = record.clockOut ? new Date(record.clockOut) : new Date();
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

  record.clockOut = new Date().toISOString();
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

function getActiveEmployees() {
  return state.employees.filter((employee) => employee.active);
}

function getSelectedEmployeeId() {
  const employees = getActiveEmployees();
  const selected = elements.employeePanelSelect.value;
  if (employees.some((employee) => employee.id === selected)) {
    return selected;
  }
  return employees[0]?.id || "";
}

function getLeaveDays(record) {
  if (record.leaveType === "half") return 0.5;
  if (record.leaveType === "full") return 1;
  return 0;
}

function renderPanelTabs() {
  const employeeActive = activePanel === "employee";
  elements.employeePanel.classList.toggle("hidden", !employeeActive);
  elements.adminPanel.classList.toggle("hidden", employeeActive);
  elements.employeePanelTab.classList.toggle("active", employeeActive);
  elements.adminPanelTab.classList.toggle("active", !employeeActive);
}

function openAdminPasswordModal() {
  elements.adminPasswordModal.classList.remove("hidden");
  elements.adminPasswordError.classList.add("hidden");
  elements.adminPasswordInput.value = "";
  setTimeout(() => elements.adminPasswordInput.focus(), 0);
}

function closeAdminPasswordModal() {
  elements.adminPasswordModal.classList.add("hidden");
  elements.adminPasswordInput.value = "";
  elements.adminPasswordError.classList.add("hidden");
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

  getActiveEmployees()
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
  getActiveEmployees()
    .forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee.id;
      option.textContent = employee.name;
      elements.reportEmployee.appendChild(option);
    });
  elements.reportEmployee.value = selected;
}

function renderEmployeePanelOptions() {
  const employees = getActiveEmployees();
  const selected = getSelectedEmployeeId();
  elements.employeePanelSelect.innerHTML = "";

  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.id;
    option.textContent = employee.name;
    elements.employeePanelSelect.appendChild(option);
  });

  elements.employeePanelSelect.value = selected;
}

function renderEmployeePanel() {
  const employeeId = getSelectedEmployeeId();
  const employee = state.employees.find((item) => item.id === employeeId);
  const weekend = isWeekend();

  elements.employeeWeekendNotice.classList.toggle("hidden", !weekend);

  if (!employee) {
    elements.selectedEmployeeName.textContent = "No employee found";
    elements.selectedEmployeeStatus.textContent = "Unavailable";
    elements.selfClockIn.textContent = "--";
    elements.selfClockOut.textContent = "--";
    elements.selfWorked.textContent = "0h";
    elements.selfTotalLeave.textContent = "0 days";
    elements.selfTotalFine.textContent = "0 BDT";
    elements.selfCompletedDays.textContent = "0";
    elements.selfRecordsTable.innerHTML = `<tr><td colspan="6" class="empty-state">No employee available.</td></tr>`;
    [elements.selfClockInBtn, elements.selfClockOutBtn, elements.selfHalfLeaveBtn, elements.selfFullLeaveBtn].forEach((button) => {
      button.disabled = true;
    });
    return;
  }

  const record = getTodayRecord(employee.id);
  const status = statusLabel(record);
  const personalRecords = state.records.filter((item) => item.employeeId === employee.id);
  const totalLeave = personalRecords.reduce((sum, item) => sum + getLeaveDays(item), 0);
  const totalFine = personalRecords.reduce((sum, item) => sum + Number(item.fine || 0), 0);
  const completedDays = personalRecords.filter((item) => statusLabel(item) === "Completed").length;

  elements.selectedEmployeeName.textContent = employee.name;
  elements.selectedEmployeeStatus.textContent = status;
  elements.selectedEmployeeStatus.dataset.status = status.toLowerCase().replace(/\s+/g, "-");
  elements.selfClockIn.textContent = record.clockIn ? formatTime(new Date(record.clockIn)) : "--";
  elements.selfClockOut.textContent = record.clockOut ? formatTime(new Date(record.clockOut)) : "--";
  elements.selfWorked.textContent = `${calculateHours(record).toFixed(1)}h`;
  elements.selfTotalLeave.textContent = `${totalLeave.toFixed(1).replace(".0", "")} days`;
  elements.selfTotalFine.textContent = `${totalFine} BDT`;
  elements.selfCompletedDays.textContent = completedDays;

  elements.selfClockInBtn.disabled = weekend || Boolean(record.clockIn) || record.leaveType === "full";
  elements.selfClockOutBtn.disabled = weekend || !record.clockIn || Boolean(record.clockOut) || record.leaveType === "full";
  elements.selfHalfLeaveBtn.disabled = weekend || record.leaveType === "full";
  elements.selfFullLeaveBtn.disabled = weekend || Boolean(record.clockIn);

  renderSelfRecords(employee.id);
}

function renderSelfRecords(employeeId) {
  const rows = state.records
    .filter((record) => record.employeeId === employeeId)
    .sort((a, b) => `${b.date}${b.clockIn || ""}`.localeCompare(`${a.date}${a.clockIn || ""}`))
    .slice(0, 20);

  elements.selfRecordsTable.innerHTML = rows.length
    ? rows
        .map((record) => {
          const hours = calculateHours(record);
          return `
            <tr>
              <td>${record.date}</td>
              <td>${statusLabel(record)}</td>
              <td>${record.clockIn ? formatTime(new Date(record.clockIn)) : "--"}</td>
              <td>${record.clockOut ? formatTime(new Date(record.clockOut)) : "--"}</td>
              <td>${hours.toFixed(1)}h</td>
              <td>${record.fine ? `${record.fine} BDT` : "--"}</td>
            </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" class="empty-state">No records yet.</td></tr>`;
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
  elements.totalEmployees.textContent = getActiveEmployees().length;
  elements.clockedInToday.textContent = todayRecords.filter((record) => record.clockIn).length;
  elements.leaveToday.textContent = todayRecords.filter((record) => record.leaveType).length;
  elements.fineToday.textContent = `${todayRecords.reduce((sum, record) => sum + Number(record.fine || 0), 0)} BDT`;
}

function render() {
  elements.todayLabel.textContent = formatDisplayDate();
  elements.clockLabel.textContent = formatTime();
  renderPanelTabs();
  renderEmployeePanelOptions();
  renderEmployeePanel();
  elements.weekendNotice.classList.toggle("hidden", !isWeekend());
  elements.markMissedBtn.disabled = isWeekend();
  renderStats();
  renderReportOptions();
  renderEmployeeCards();
  renderRecordsTable();
}

elements.employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEmployee(elements.employeeName.value);
  elements.employeeName.value = "";
});

elements.exportBtn.addEventListener("click", exportReport);
elements.markMissedBtn.addEventListener("click", applyMissedClockInFines);
elements.employeePanelSelect.addEventListener("change", render);
elements.employeePanelTab.addEventListener("click", () => {
  activePanel = "employee";
  render();
});
elements.adminPanelTab.addEventListener("click", () => {
  openAdminPasswordModal();
});
elements.adminPasswordForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (elements.adminPasswordInput.value !== ADMIN_PASSWORD) {
    elements.adminPasswordError.classList.remove("hidden");
    elements.adminPasswordInput.select();
    return;
  }

  activePanel = "admin";
  closeAdminPasswordModal();
  render();
});
elements.adminPasswordCancel.addEventListener("click", closeAdminPasswordModal);
elements.adminPasswordModal.addEventListener("click", (event) => {
  if (event.target === elements.adminPasswordModal) {
    closeAdminPasswordModal();
  }
});
elements.selfClockInBtn.addEventListener("click", () => clockIn(getSelectedEmployeeId()));
elements.selfClockOutBtn.addEventListener("click", () => clockOut(getSelectedEmployeeId()));
elements.selfHalfLeaveBtn.addEventListener("click", () => setLeave(getSelectedEmployeeId(), "half"));
elements.selfFullLeaveBtn.addEventListener("click", () => setLeave(getSelectedEmployeeId(), "full"));
elements.clearDemoBtn.addEventListener("click", () => {
  if (!confirm("Reset all database attendance data?")) return;
  fetch("/api/db/reset", { method: "POST" })
    .then((response) => response.json())
    .then((result) => {
      state = result.data || createDefaultState();
      render();
    });
});

const today = formatDate();
elements.reportFrom.value = today;
elements.reportTo.value = today;

async function initialize() {
  await loadStateFromDatabase();
  render();
  setInterval(render, 1000);
}

initialize();
