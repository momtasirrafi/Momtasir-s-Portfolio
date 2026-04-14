# 📋 Jira Ticket Automation — Excel to Jira

Automate the creation of Jira tickets directly from an Excel spreadsheet using Node.js and the Jira REST API v3. No more manual copy-pasting — one command creates your entire backlog.

---

## 🚀 Features

- ✅ Bulk Jira ticket creation from any `.xlsx` file
- ✅ Maps Title, Description, Priority, Assignee, and Due Date from spreadsheet columns
- ✅ Secure credential management via `.env` configuration
- ✅ Rate-limit-safe sequential processing with built-in delay
- ✅ Per-row error logging — one failure doesn't stop the entire run
- ✅ Supports Jira Cloud REST API v3 with Basic Auth

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| Node.js | Runtime environment |
| Jira REST API v3 | Ticket creation endpoint |
| `xlsx` | Excel file parsing |
| `dotenv` | Secure environment config |
| `https` | Native HTTP requests |

---

## 📁 Project Structure

```
jira-automation/
├── index.js           # Main script
├── .env               # Environment variables (not committed)
├── .env.example       # Example env file
├── Workbook1.xlsx     # Your Excel input file
└── README.md          # This file
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/jira-automation.git
cd jira-automation
```

### 2. Install dependencies

```bash
npm install xlsx dotenv
```

### 3. Configure your `.env` file

Create a `.env` file in the root directory:

```env
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_TOKEN=your_jira_api_token
PROJECT_KEY=CN
ISSUE_TYPE=Task
EXCEL_PATH=C:/Users/yourname/Downloads/Workbook1.xlsx
```

> ⚠️ **Never commit your `.env` file.** Add it to `.gitignore`.

### 4. Get your Jira API Token

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Copy and paste it into your `.env` file as `JIRA_TOKEN`

---

## 📊 Excel File Format

Your Excel file should have the following column headers in the first row:

| Column | Required | Description |
|---|---|---|
| `Title` | ✅ Yes | The ticket summary/title |
| `Description` | ✅ Yes | Detailed description of the task |
| `Priority` | ❌ No | `Highest`, `High`, `Medium`, `Low`, `Lowest` (default: `Medium`) |
| `Assignee` | ❌ No | Assignee name (requires extra Jira permissions) |
| `Due Date` | ❌ No | Due date for the ticket |

**Example Excel layout:**

| Title | Description | Priority | Assignee | Due Date |
|---|---|---|---|---|
| Fix login bug | Users cannot login with SSO | High | John Doe | 2025-05-01 |
| Update dashboard UI | Redesign the analytics dashboard | Medium | Jane Smith | 2025-05-15 |

---

## ▶️ Running the Script

```bash
node index.js
```

**Sample output:**

```
Found 5 rows in Excel. Starting ticket creation...

[1/5] Created: CN-101 — Fix login bug
[2/5] Created: CN-102 — Update dashboard UI
[3/5] FAILED: Add payment gateway
  Reason: {"errorMessages":["Field 'priority' cannot be set..."]}
[4/5] Created: CN-103 — Write unit tests
[5/5] Created: CN-104 — Deploy to staging

Done. 4 created, 1 failed.
```

---

## 🔒 Security Best Practices

- Store all credentials in `.env` — never hardcode them in `index.js`
- Add `.env` to your `.gitignore` file:

```bash
echo ".env" >> .gitignore
```

- Use a `.env.example` file to show required variables without values:

```env
JIRA_URL=
JIRA_EMAIL=
JIRA_TOKEN=
PROJECT_KEY=
ISSUE_TYPE=
EXCEL_PATH=
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `Missing required .env values` | Check your `.env` file has all required fields |
| `401 Unauthorized` | Verify your `JIRA_EMAIL` and `JIRA_TOKEN` are correct |
| `404 Not Found` | Check your `JIRA_URL` and `PROJECT_KEY` are correct |
| `Field cannot be set` error | Some fields need extra Jira project permissions |
| Excel columns not found | Make sure column names match exactly (watch for trailing spaces) |

---

## 🔮 Future Improvements

- [ ] Add support for custom fields (labels, story points, sprint)
- [ ] Add a dry-run mode to preview tickets before creating
- [ ] Export a report of created/failed tickets to CSV
- [ ] Add support for subtasks and epics
- [ ] Build a simple UI for non-technical users

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- LinkedIn: [linkedin.com/in/your-profile](https://www.linkedin.com/in/md-momtasir-rahman-rafi-11b904243/)
- GitHub: https://github.com/momtasirrafi
