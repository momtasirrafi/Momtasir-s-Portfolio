const LEGACY_STORAGE_KEY = "employee-attendance-system-v1";
const LOGIN_USER_ID = "CodeLab";
const LOGIN_PASSWORD = "Admin";
const ADMIN_PASSWORD = "1234";
const DEFAULT_SETTINGS = {
  checkInTime: "08:00",
  checkOutTime: "18:00",
  requiredHours: 10,
  missedClockInFine: 20,
  missedFineActionEnabled: true,
  missedClockOutDeadline: "12:00 PM",
  missedClockOutFine: 20,
};
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
  loginScreen: document.querySelector("#loginScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginUserId: document.querySelector("#loginUserId"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  logoutBtn: document.querySelector("#logoutBtn"),
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
  removeEmployeeModal: document.querySelector("#removeEmployeeModal"),
  removeEmployeeForm: document.querySelector("#removeEmployeeForm"),
  removeEmployeeName: document.querySelector("#removeEmployeeName"),
  removeEmployeeCancel: document.querySelector("#removeEmployeeCancel"),
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
  officeRuleText: document.querySelector("#officeRuleText"),
  rulesForm: document.querySelector("#rulesForm"),
  ruleCheckIn: document.querySelector("#ruleCheckIn"),
  ruleCheckOut: document.querySelector("#ruleCheckOut"),
  ruleRequiredHours: document.querySelector("#ruleRequiredHours"),
  ruleFine: document.querySelector("#ruleFine"),
  ruleClockOutDeadline: document.querySelector("#ruleClockOutDeadline"),
  ruleClockOutFine: document.querySelector("#ruleClockOutFine"),
  missedFineActionToggle: document.querySelector("#missedFineActionToggle"),
  missedFineActionLabel: document.querySelector("#missedFineActionLabel"),
  clearDemoBtn: document.querySelector("#clearDemoBtn"),
};

let state = createDefaultState();
let activePanel = "employee";
let pendingRemoveEmployeeId = "";
let isLoggedIn = sessionStorage.getItem("attendance-login") === "true";
let databaseAvailable = false;

function createDefaultState() {
  return {
    settings: { ...DEFAULT_SETTINGS },
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
    databaseAvailable = true;
    state.settings = {
      ...DEFAULT_SETTINGS,
      ...(state.settings || {}),
    };
    migrateLegacyLocalStorage();
  } catch (error) {
    console.error(error);
    databaseAvailable = false;
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
      state.settings = {
        ...DEFAULT_SETTINGS,
        ...(state.settings || {}),
      };
    }
  }
}

function migrateLegacyLocalStorage() {
  const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved || state.records.length > 0) return;

  try {
    const legacyState = JSON.parse(saved);
    if (!Array.isArray(legacyState.employees) || !Array.isArray(legacyState.records)) return;
    state = {
      ...legacyState,
      settings: { ...DEFAULT_SETTINGS, ...(legacyState.settings || {}) },
    };
    saveState();
  } catch (error) {
    console.error(error);
  }
}

async function saveState() {
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));
  if (!databaseAvailable) return;

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
  if (isFineActionEnabled() && record.missedClockOutFineApplied) return "Missed Clock-Out";
  if (record.clockOut) return calculateHours(record) >= getRuleNumber(state.settings.requiredHours, DEFAULT_SETTINGS.requiredHours) ? "Completed" : "Short Hours";
  if (record.clockIn) return "Clocked In";
  if (isFineActionEnabled() && record.fine > 0) return "Missed Clock-In";
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
  if (isWeekend() || !isFineActionEnabled()) return;

  state.employees
    .filter((employee) => employee.active)
    .forEach((employee) => {
      const record = getTodayRecord(employee.id);
      if (!record.clockIn && !record.leaveType) {
        record.status = "Missed Clock-In";
        record.fine = getRuleNumber(state.settings.missedClockInFine, DEFAULT_SETTINGS.missedClockInFine);
        record.missedClockInFineApplied = true;
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

function openRemoveEmployeeModal(employeeId) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) return;

  pendingRemoveEmployeeId = employeeId;
  elements.removeEmployeeName.textContent = employee.name;
  elements.removeEmployeeModal.classList.remove("hidden");
}

function closeRemoveEmployeeModal() {
  pendingRemoveEmployeeId = "";
  elements.removeEmployeeModal.classList.add("hidden");
}

function applyMissedClockOutFines() {
  if (isWeekend() || !isFineActionEnabled()) return;

  const deadline = parseRuleTimeToDate(state.settings.missedClockOutDeadline);
  if (!deadline || new Date() < deadline) return;

  let changed = false;
  const today = formatDate();
  state.records
    .filter((record) => record.date === today && record.clockIn && !record.clockOut && !record.leaveType && !record.missedClockOutFineApplied)
    .forEach((record) => {
      record.status = "Missed Clock-Out";
      record.fine = Number(record.fine || 0) + getRuleNumber(state.settings.missedClockOutFine, DEFAULT_SETTINGS.missedClockOutFine);
      record.missedClockOutFineApplied = true;
      record.note = "Employee did not clock out before deadline.";
      changed = true;
    });

  if (changed) saveState();
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

function formatLeaveDays(record) {
  const leaveDays = getLeaveDays(record);
  return leaveDays ? leaveDays.toString() : "--";
}

function getRuleNumber(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseRuleTimeToDate(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, "");
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const period = match[3];
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function isFineActionEnabled() {
  return Boolean(state.settings?.missedFineActionEnabled);
}

function formatRuleTime(value) {
  if (!value) return "Not set";
  const parsedDate = parseRuleTimeToDate(value);
  if (parsedDate) {
    return new Intl.DateTimeFormat("en-BD", {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsedDate);
  }
  if (!String(value).includes(":")) return value;
  const [hour, minute] = String(value).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en-BD", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function updateRules(event) {
  event.preventDefault();
  state.settings = {
    checkInTime: elements.ruleCheckIn.value || DEFAULT_SETTINGS.checkInTime,
    checkOutTime: elements.ruleCheckOut.value || DEFAULT_SETTINGS.checkOutTime,
    requiredHours: elements.ruleRequiredHours.value,
    missedClockInFine: elements.ruleFine.value,
    missedFineActionEnabled: elements.missedFineActionToggle.checked,
    missedClockOutDeadline: elements.ruleClockOutDeadline.value || DEFAULT_SETTINGS.missedClockOutDeadline,
    missedClockOutFine: elements.ruleClockOutFine.value,
  };
  saveState();
  render();
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
  const fullDayLeaveCount = rows.filter((record) => record.leaveType === "full").length;
  const halfDayLeaveCount = rows.filter((record) => record.leaveType === "half").length;
  const totalLeaveDays = rows.reduce((sum, record) => sum + getLeaveDays(record), 0);

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
            <td>${getLeaveDays(record)}</td>
            <td>${isFineActionEnabled() ? record.fine : 0}</td>
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
              <th colspan="2">Full Day Leave Count</th>
              <td>${fullDayLeaveCount}</td>
              <th colspan="2">Half Day Leave Count</th>
              <td>${halfDayLeaveCount}</td>
              <th>Total Leave Days</th>
              <td>${totalLeaveDays}</td>
            </tr>
            <tr></tr>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Worked Hours</th>
              <th>Leave Days</th>
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
      article.querySelector(".remove-btn").addEventListener("click", () => openRemoveEmployeeModal(employee.id));

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
  const totalFine = isFineActionEnabled() ? personalRecords.reduce((sum, item) => sum + Number(item.fine || 0), 0) : 0;
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
                <td>${formatLeaveDays(record)}</td>
                <td>${isFineActionEnabled() && record.fine ? `${record.fine} BDT` : "--"}</td>
              </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" class="empty-state">No records yet.</td></tr>`;
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
                <td>${formatLeaveDays(record)}</td>
                <td>${isFineActionEnabled() && record.fine ? `${record.fine} BDT` : "--"}</td>
              </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" class="empty-state">No records yet.</td></tr>`;
}

function renderStats() {
  const today = formatDate();
  const todayRecords = state.records.filter((record) => record.date === today);
  elements.totalEmployees.textContent = getActiveEmployees().length;
  elements.clockedInToday.textContent = todayRecords.filter((record) => record.clockIn).length;
  elements.leaveToday.textContent = todayRecords.filter((record) => record.leaveType).length;
  const fineTotal = isFineActionEnabled() ? todayRecords.reduce((sum, record) => sum + Number(record.fine || 0), 0) : 0;
  elements.fineToday.textContent = `${fineTotal} BDT`;
}

function renderRules() {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(state.settings || {}),
  };
  state.settings = settings;
  const isEditingRules = elements.rulesForm.contains(document.activeElement);
  if (!isEditingRules) {
    elements.ruleCheckIn.value = settings.checkInTime;
    elements.ruleCheckOut.value = settings.checkOutTime;
    elements.ruleRequiredHours.value = settings.requiredHours;
    elements.ruleFine.value = settings.missedClockInFine;
    elements.ruleClockOutDeadline.value = settings.missedClockOutDeadline;
    elements.ruleClockOutFine.value = settings.missedClockOutFine;
  }
  elements.missedFineActionToggle.checked = isFineActionEnabled();
  elements.missedFineActionLabel.textContent = isFineActionEnabled() ? "On" : "Off";
  elements.officeRuleText.textContent = `Office hours: ${formatRuleTime(settings.checkInTime)} to ${formatRuleTime(settings.checkOutTime)}. Required work: ${settings.requiredHours} hours. Missed clock-in fine: ${settings.missedClockInFine} BDT. Missed clock-out deadline: ${formatRuleTime(settings.missedClockOutDeadline)}. Saturday and Sunday are weekends.`;
  elements.markMissedBtn.textContent = isFineActionEnabled() ? `Apply ${settings.missedClockInFine} BDT Missed Clock-In Fine` : "Missed Clock-In Fine Off";
}

function render() {
  elements.loginScreen.classList.toggle("hidden", isLoggedIn);
  elements.appShell.classList.toggle("hidden", !isLoggedIn);
  if (!isLoggedIn) return;

  elements.todayLabel.textContent = formatDisplayDate();
  elements.clockLabel.textContent = formatTime();
  applyMissedClockOutFines();
  renderPanelTabs();
  renderEmployeePanelOptions();
  renderEmployeePanel();
  elements.weekendNotice.classList.toggle("hidden", !isWeekend());
  renderRules();
  elements.markMissedBtn.disabled = isWeekend() || !isFineActionEnabled();
  renderStats();
  renderReportOptions();
  renderEmployeeCards();
  renderRecordsTable();
}

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const userId = elements.loginUserId.value.trim();
  const password = elements.loginPassword.value;

  if (userId !== LOGIN_USER_ID || password !== LOGIN_PASSWORD) {
    elements.loginError.classList.remove("hidden");
    elements.loginPassword.select();
    return;
  }

  sessionStorage.setItem("attendance-login", "true");
  isLoggedIn = true;
  elements.loginError.classList.add("hidden");
  render();
});

elements.logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("attendance-login");
  isLoggedIn = false;
  activePanel = "employee";
  elements.loginPassword.value = "";
  render();
});

elements.employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEmployee(elements.employeeName.value);
  elements.employeeName.value = "";
});

elements.exportBtn.addEventListener("click", exportReport);
elements.markMissedBtn.addEventListener("click", applyMissedClockInFines);
elements.rulesForm.addEventListener("submit", updateRules);
elements.missedFineActionToggle.addEventListener("change", () => {
  state.settings.missedFineActionEnabled = elements.missedFineActionToggle.checked;
  saveState();
  render();
});
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
elements.removeEmployeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (pendingRemoveEmployeeId) {
    removeEmployee(pendingRemoveEmployeeId);
  }
  closeRemoveEmployeeModal();
});
elements.removeEmployeeCancel.addEventListener("click", closeRemoveEmployeeModal);
elements.removeEmployeeModal.addEventListener("click", (event) => {
  if (event.target === elements.removeEmployeeModal) {
    closeRemoveEmployeeModal();
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
