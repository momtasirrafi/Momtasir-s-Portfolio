# Payroll Dashboard Demo

A simple beginner-friendly payroll automation SaaS demo saved separately from the portfolio app.

## Features

- Employee list
- Add employee form
- Attendance input by employee and month
- Payroll calculation
- Dashboard metrics
- Payslip preview
- Download payslip as PDF
- SQLite database
- Seed data in `server/data/demo-data.json`

## Payroll Formula

```text
Overtime amount = overtime hours x hourly rate x 1.5
Deduction = absence days x daily salary
Net salary = basic salary + overtime amount - deduction
```

Daily salary is calculated as:

```text
basic salary / 30
```

## Setup

From this folder:

```bash
cd PayrollDashboardDemo
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:4000
```

## Run Separately

Backend only:

```bash
npm run server
```

Frontend only:

```bash
npm run client
```

## Demo Data

The seed data lives here:

```text
server/data/demo-data.json
```

The SQLite database is created automatically on first server start:

```text
server/data/payroll.sqlite
```
