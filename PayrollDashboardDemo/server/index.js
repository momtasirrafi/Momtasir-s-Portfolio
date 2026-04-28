import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "payroll.sqlite");
const seedPath = path.join(dataDir, "demo-data.json");

fs.mkdirSync(dataDir, { recursive: true });

sqlite3.verbose();
const db = new sqlite3.Database(dbPath);
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });

function calculatePayroll(employee, attendance) {
  const basicSalary = Number(employee.basic_salary);
  const hourlyRate = Number(employee.hourly_rate);
  const overtimeHours = Number(attendance.overtime_hours);
  const absenceDays = Number(attendance.absence_days);
  const dailySalary = basicSalary / 30;
  const overtimeAmount = overtimeHours * hourlyRate * 1.5;
  const deduction = absenceDays * dailySalary;

  return {
    basicSalary,
    overtimeAmount,
    deduction,
    netSalary: basicSalary + overtimeAmount - deduction,
  };
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      designation TEXT NOT NULL,
      basic_salary REAL NOT NULL,
      hourly_rate REAL NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      total_working_hours REAL NOT NULL,
      overtime_hours REAL NOT NULL,
      absence_days REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
  `);

  const existing = await get("SELECT COUNT(*) AS count FROM employees");

  if (existing.count > 0) {
    return;
  }

  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  for (const employee of seed.employees) {
    await run(
      `INSERT INTO employees (name, email, designation, basic_salary, hourly_rate)
       VALUES (?, ?, ?, ?, ?)`,
      [
        employee.name,
        employee.email,
        employee.designation,
        employee.basicSalary,
        employee.hourlyRate,
      ],
    );
  }

  for (const entry of seed.attendance) {
    await run(
      `INSERT INTO attendance
        (employee_id, month, total_working_hours, overtime_hours, absence_days)
       VALUES (?, ?, ?, ?, ?)`,
      [
        entry.employeeId,
        entry.month,
        entry.totalWorkingHours,
        entry.overtimeHours,
        entry.absenceDays,
      ],
    );
  }
}

app.get("/api/employees", async (_request, response, next) => {
  try {
    response.json(await all("SELECT * FROM employees ORDER BY name"));
  } catch (error) {
    next(error);
  }
});

app.post("/api/employees", async (request, response, next) => {
  try {
    const { name, email, designation, basicSalary, hourlyRate } = request.body;

    if (!name || !email || !designation || !basicSalary || !hourlyRate) {
      response.status(400).json({ message: "All employee fields are required." });
      return;
    }

    const result = await run(
      `INSERT INTO employees (name, email, designation, basic_salary, hourly_rate)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, designation, Number(basicSalary), Number(hourlyRate)],
    );

    response.status(201).json(await get("SELECT * FROM employees WHERE id = ?", [result.id]));
  } catch (error) {
    next(error);
  }
});

app.get("/api/attendance", async (_request, response, next) => {
  try {
    response.json(
      await all(`
        SELECT attendance.*, employees.name AS employee_name
        FROM attendance
        JOIN employees ON employees.id = attendance.employee_id
        ORDER BY attendance.month DESC, attendance.created_at DESC
      `),
    );
  } catch (error) {
    next(error);
  }
});

app.post("/api/attendance", async (request, response, next) => {
  try {
    const { employeeId, month, totalWorkingHours, overtimeHours, absenceDays } =
      request.body;

    if (!employeeId || !month) {
      response.status(400).json({ message: "Employee and month are required." });
      return;
    }

    const result = await run(
      `INSERT INTO attendance
        (employee_id, month, total_working_hours, overtime_hours, absence_days)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Number(employeeId),
        month,
        Number(totalWorkingHours || 0),
        Number(overtimeHours || 0),
        Number(absenceDays || 0),
      ],
    );

    response.status(201).json(await get("SELECT * FROM attendance WHERE id = ?", [result.id]));
  } catch (error) {
    next(error);
  }
});

app.get("/api/payroll", async (request, response, next) => {
  try {
    const month = request.query.month || "2026-04";
    const rows = await all(
      `
        SELECT attendance.*, employees.name, employees.email, employees.designation,
          employees.basic_salary, employees.hourly_rate
        FROM attendance
        JOIN employees ON employees.id = attendance.employee_id
        WHERE attendance.month = ?
        ORDER BY employees.name
      `,
      [month],
    );

    response.json(
      rows.map((row) => {
        const totals = calculatePayroll(row, row);

        return {
          attendanceId: row.id,
          employeeId: row.employee_id,
          month: row.month,
          name: row.name,
          email: row.email,
          designation: row.designation,
          totalWorkingHours: row.total_working_hours,
          overtimeHours: row.overtime_hours,
          absenceDays: row.absence_days,
          hourlyRate: row.hourly_rate,
          ...totals,
        };
      }),
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard", async (request, response, next) => {
  try {
    const month = request.query.month || "2026-04";
    const employeeCount = await get("SELECT COUNT(*) AS count FROM employees");
    const processedCount = await get(
      "SELECT COUNT(DISTINCT employee_id) AS count FROM attendance WHERE month = ?",
      [month],
    );
    const payrollRows = await all(
      `
        SELECT employees.basic_salary, employees.hourly_rate, attendance.*
        FROM attendance
        JOIN employees ON employees.id = attendance.employee_id
        WHERE attendance.month = ?
      `,
      [month],
    );

    const totalMonthlyPayroll = payrollRows.reduce(
      (sum, row) => sum + calculatePayroll(row, row).netSalary,
      0,
    );

    response.json({
      totalEmployees: employeeCount.count,
      totalMonthlyPayroll,
      pendingPayrollCount: Math.max(employeeCount.count - processedCount.count, 0),
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  response.status(error?.code === "SQLITE_CONSTRAINT" ? 409 : 500).json({
    message:
      error?.code === "SQLITE_CONSTRAINT"
        ? "An employee with this email already exists."
        : "Something went wrong on the payroll server.",
  });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Payroll API running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize payroll database", error);
    process.exit(1);
  });
