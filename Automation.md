# Automation
const xlsx = require('xlsx');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── Config from .env ────────────────────────────────────────────────────────
const JIRA_URL      = process.env.JIRA_URL;       // e.g. https://yourcompany.atlassian.net
const JIRA_EMAIL    = process.env.JIRA_EMAIL;     // your Jira login email
const JIRA_TOKEN    = process.env.JIRA_TOKEN;     // API token
const PROJECT_KEY   = process.env.PROJECT_KEY;    // e.g. CN
const ISSUE_TYPE    = process.env.ISSUE_TYPE || 'Task';
const EXCEL_PATH    = process.env.EXCEL_PATH || 'C:/Users/rafid/Downloads/Workbook1.xlsx';

// ── Validate config ─────────────────────────────────────────────────────────
const missing = ['JIRA_URL','JIRA_EMAIL','JIRA_TOKEN','PROJECT_KEY'].filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required .env values:', missing.join(', '));
  process.exit(1);
}

// ── Read Excel ───────────────────────────────────────────────────────────────
const wb   = xlsx.readFile(EXCEL_PATH);
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws);

console.log(`Found ${rows.length} rows in Excel. Starting ticket creation...\n`);

// ── Helper: POST to Jira API ─────────────────────────────────────────────────
function createTicket(row) {
  return new Promise((resolve, reject) => {
    const title       = (row['Title '] || row['Title'] || '').trim();
    const description = (row['Description '] || row['Description'] || '').trim();
    const priority    = (row['Priority'] || 'Medium').trim();
    const assignee    = (row['Assignee '] || row['Assignee'] || '').trim();
    const dueDate     = (row['Due Date'] || '').toString().trim();

    const body = JSON.stringify({
      fields: {
        project:     { key: PROJECT_KEY },
        summary:     title,
        description: {
          type:    'doc',
          version: 1,
          content: [{
            type:    'paragraph',
            content: [{ type: 'text', text: description }]
          }]
        },
        issuetype: { name: ISSUE_TYPE },
        priority:  { name: priority },
        // assignee and duedate require extra Jira permissions — safely ignored if not available
      }
    });

    const auth    = Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
    const urlObj  = new URL(`${JIRA_URL}/rest/api/3/issue`);

    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (res.statusCode === 201) {
          resolve({ title, key: json.key });
        } else {
          reject({ title, status: res.statusCode, error: json });
        }
      });
    });

    req.on('error', err => reject({ title, error: err.message }));
    req.write(body);
    req.end();
  });
}

// ── Process rows sequentially ────────────────────────────────────────────────
(async () => {
  let success = 0;
  let failed  = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = (row['Title '] || row['Title'] || `Row ${i + 2}`).trim();

    try {
      const result = await createTicket(row);
      console.log(`[${i + 1}/${rows.length}] Created: ${result.key} — ${result.title}`);
      success++;
    } catch (err) {
      console.error(`[${i + 1}/${rows.length}] FAILED: ${title}`);
      console.error('  Reason:', JSON.stringify(err.error || err));
      failed++;
    }

    // small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone. ${success} created, ${failed} failed.`);
})();

