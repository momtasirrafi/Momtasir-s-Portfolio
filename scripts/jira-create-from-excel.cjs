const fs = require('fs');
const https = require('https');
const path = require('path');

let xlsx;
let dotenv;

try {
  xlsx = require('xlsx');
  dotenv = require('dotenv');
} catch (error) {
  console.error('Missing dependency. Install these first: npm install xlsx dotenv');
  process.exit(1);
}

const envCandidates = [
  process.env.ENV_PATH,
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '..', '.env'),
  path.join('C:', 'Users', 'rafid', 'Java scripting', '.env'),
].filter(Boolean);

let loadedEnvPath = null;

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    loadedEnvPath = candidate;
    break;
  }
}

const JIRA_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const PROJECT_KEY = process.env.PROJECT_KEY;
const ISSUE_TYPE = process.env.ISSUE_TYPE || 'Task';
const EXCEL_PATH =
  process.env.EXCEL_PATH || 'C:/Users/rafid/Java scripting/Workbook1.md.xlsx';
const SHEET_NAME = process.env.SHEET_NAME || '';

const TITLE_COLUMN = process.env.TITLE_COLUMN || 'Title';
const DESCRIPTION_COLUMN = process.env.DESCRIPTION_COLUMN || 'Description';
const PRIORITY_COLUMN = process.env.PRIORITY_COLUMN || 'Priority';
const ASSIGNEE_COLUMN = process.env.ASSIGNEE_COLUMN || 'Assignee';
const DUE_DATE_COLUMN = process.env.DUE_DATE_COLUMN || 'Due Date';
const STATUS_COLUMN = process.env.STATUS_COLUMN || 'Status';

const missing = ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_TOKEN', 'PROJECT_KEY'].filter(
  (key) => !process.env[key]
);

if (missing.length) {
  if (!loadedEnvPath) {
    console.error('No .env file found. Checked:', envCandidates.join(', '));
  }
  console.error('Missing required .env values:', missing.join(', '));
  process.exit(1);
}

if (!fs.existsSync(EXCEL_PATH)) {
  console.error(`Excel file not found: ${EXCEL_PATH}`);
  process.exit(1);
}

function getAuthHeader() {
  return `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`;
}

function safeJsonParse(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function jiraRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${JIRA_URL}${apiPath}`);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
    };

    if (payload) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const parsed = safeJsonParse(data);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: parsed });
          return;
        }

        reject({
          statusCode: res.statusCode,
          error: parsed || data || 'Unknown Jira API error',
        });
      });
    });

    req.on('error', (error) => {
      reject({ error: error.message });
    });

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

function getCell(row, candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim();
    }
  }

  return '';
}

function mapArrayRowToObject(row) {
  return {
    [TITLE_COLUMN]: String(row[0] ?? '').trim(),
    [DESCRIPTION_COLUMN]: String(row[1] ?? '').trim(),
    [PRIORITY_COLUMN]: String(row[2] ?? '').trim(),
    [ASSIGNEE_COLUMN]: String(row[3] ?? '').trim(),
    [DUE_DATE_COLUMN]: row[4] ?? '',
    [STATUS_COLUMN]: String(row[5] ?? '').trim(),
  };
}

function loadRows(worksheet) {
  const objectRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  const hasRecognizedHeaders =
    objectRows.length > 0 &&
    objectRows.every((row) => {
      const title = getCell(row, [TITLE_COLUMN, 'Title', 'Summary']);
      return title && title.toLowerCase() !== TITLE_COLUMN.toLowerCase();
    });

  if (hasRecognizedHeaders) {
    return objectRows;
  }

  const arrayRows = xlsx.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  const normalizedHeaders = [
    TITLE_COLUMN,
    DESCRIPTION_COLUMN,
    PRIORITY_COLUMN,
    ASSIGNEE_COLUMN,
    DUE_DATE_COLUMN,
    STATUS_COLUMN,
  ].map((value) => String(value).trim().toLowerCase());

  return arrayRows
    .filter((row, index) => {
      if (!Array.isArray(row)) {
        return false;
      }

      const normalizedRow = row
        .slice(0, 6)
        .map((value) => String(value ?? '').trim().toLowerCase());

      const looksLikeHeaderRow =
        normalizedRow[0] === String(TITLE_COLUMN).trim().toLowerCase() ||
        normalizedRow[0] === 'title' ||
        normalizedRow[1] === String(DESCRIPTION_COLUMN).trim().toLowerCase() ||
        normalizedRow[1] === 'description' ||
        normalizedRow[2] === String(PRIORITY_COLUMN).trim().toLowerCase() ||
        normalizedRow[2] === 'priority' ||
        normalizedRow[3] === String(ASSIGNEE_COLUMN).trim().toLowerCase() ||
        normalizedRow[3] === 'assignee' ||
        normalizedRow.every((value, columnIndex) => value === normalizedHeaders[columnIndex]);

      if (index === 0 && looksLikeHeaderRow) {
        return false;
      }

      return true;
    })
    .map((row) => (Array.isArray(row) ? mapArrayRowToObject(row) : null))
    .filter((row) => row && Object.values(row).some((value) => String(value).trim() !== ''));
}

function normalizeTitle(value) {
  return String(value || '').replace(/[\[\]]/g, '').trim();
}

function normalizePriority(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const map = {
    highest: 'Highest',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    lowest: 'Lowest',
  };

  return map[raw.toLowerCase()] || raw;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function excelSerialToDate(value) {
  const serial = Number(value);

  if (!Number.isFinite(serial)) {
    return '';
  }

  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);

  return `${dateInfo.getUTCFullYear()}-${pad2(dateInfo.getUTCMonth() + 1)}-${pad2(
    dateInfo.getUTCDate()
  )}`;
}

function normalizeDueDate(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    return excelSerialToDate(value);
  }

  const raw = String(value).trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parts = raw.split(/[\/.-]/).map((part) => part.trim()).filter(Boolean);

  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    let month = parts[1];
    let day = parts[2];

    if (Number(month) > 12 && Number(day) <= 12) {
      [month, day] = [day, month];
    }

    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return '';
}

function formatDescription(description) {
  const text = String(description || '').trim();

  if (!text) {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Imported from Excel' }],
        },
      ],
    };
  }

  const paragraphs = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    }));

  return {
    type: 'doc',
    version: 1,
    content: paragraphs.length
      ? paragraphs
      : [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }],
          },
        ],
  };
}

function isExplicitAccountId(value) {
  return value.toLowerCase().startsWith('accountid:');
}

async function findAssignableUser(assigneeValue, issueKey) {
  if (!assigneeValue) {
    return null;
  }

  const rawValue = assigneeValue.trim();
  if (!rawValue) {
    return null;
  }

  if (isExplicitAccountId(rawValue)) {
    const accountId = rawValue.split(':').slice(1).join(':').trim();
    return { accountId, displayName: accountId };
  }

  const query = encodeURIComponent(rawValue);
  const scope = issueKey
    ? `issueKey=${encodeURIComponent(issueKey)}`
    : `project=${encodeURIComponent(PROJECT_KEY)}`;

  const { data } = await jiraRequest(
    'GET',
    `/rest/api/2/user/assignable/search?query=${query}&${scope}&maxResults=50`
  );

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No assignable Jira user found for "${rawValue}"`);
  }

  const exactMatch = data.find((user) => {
    const displayName = (user.displayName || '').toLowerCase();
    const emailAddress = (user.emailAddress || '').toLowerCase();
    const needle = rawValue.toLowerCase();

    return displayName === needle || emailAddress === needle;
  });

  return exactMatch || data.find((user) => user.active) || data[0];
}

async function createIssue(row) {
  const title = normalizeTitle(getCell(row, [TITLE_COLUMN, 'Title', 'Summary']));
  const description = getCell(row, [DESCRIPTION_COLUMN, 'Description', 'Details']);
  const priority = normalizePriority(getCell(row, [PRIORITY_COLUMN, 'Priority']));
  const dueDate = normalizeDueDate(getCell(row, [DUE_DATE_COLUMN, 'Due Date', 'DueDate']));

  if (!title) {
    throw new Error('Missing title');
  }

  const fields = {
    project: { key: PROJECT_KEY },
    summary: title,
    description: formatDescription(description),
    issuetype: { name: ISSUE_TYPE },
  };

  if (priority) {
    fields.priority = { name: priority };
  }

  if (dueDate) {
    fields.duedate = dueDate;
  }

  const { data } = await jiraRequest('POST', '/rest/api/3/issue', { fields });
  return { key: data.key, title, dueDate };
}

async function assignIssue(issueKey, assigneeValue) {
  if (!assigneeValue) {
    return null;
  }

  const user = await findAssignableUser(assigneeValue, issueKey);

  if (!user?.accountId) {
    throw new Error(`Could not resolve accountId for "${assigneeValue}"`);
  }

  await jiraRequest(
    'PUT',
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}/assignee`,
    { accountId: user.accountId }
  );

  return user.displayName || assigneeValue;
}

async function getTransitions(issueKey) {
  const { data } = await jiraRequest(
    'GET',
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`
  );

  return Array.isArray(data?.transitions) ? data.transitions : [];
}

async function transitionIssue(issueKey, targetStatus) {
  const normalizedStatus = String(targetStatus || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (!normalizedStatus) {
    return false;
  }

  const transitions = await getTransitions(issueKey);
  const match = transitions.find((transition) => {
    const transitionName = String(transition?.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    const destinationStatus = String(transition?.to?.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

    return transitionName === normalizedStatus || destinationStatus === normalizedStatus;
  });

  if (!match) {
    const available = transitions
      .map((transition) => {
        const transitionName = transition?.name || 'Unknown transition';
        const destinationStatus = transition?.to?.name || 'Unknown status';
        return `${transitionName} -> ${destinationStatus}`;
      })
      .join(', ');

    throw new Error(
      `No transition found for status "${targetStatus}". Available transitions: ${available || 'none'}`
    );
  }

  await jiraRequest(
    'POST',
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`,
    { transition: { id: match.id } }
  );

  return true;
}

async function main() {
  const workbook = xlsx.readFile(EXCEL_PATH);
  const worksheet = SHEET_NAME
    ? workbook.Sheets[SHEET_NAME]
    : workbook.Sheets[workbook.SheetNames[0]];

  if (!worksheet) {
    console.error(`Sheet not found: ${SHEET_NAME}`);
    process.exit(1);
  }

  const rows = loadRows(worksheet);

  let success = 0;
  let failed = 0;

  console.log(`Found ${rows.length} rows in Excel. Starting Jira creation...\n`);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const title = normalizeTitle(getCell(row, [TITLE_COLUMN, 'Title', 'Summary'])) || `Row ${index + 2}`;
    const assigneeValue = getCell(row, [ASSIGNEE_COLUMN, 'Assignee']);
    const targetStatus = getCell(row, [STATUS_COLUMN, 'Status']);

    try {
      const created = await createIssue(row);

      let assigneeLabel = '';
      if (assigneeValue) {
        assigneeLabel = await assignIssue(created.key, assigneeValue);
      }

      let statusLabel = '';
      if (targetStatus) {
        await transitionIssue(created.key, targetStatus);
        statusLabel = targetStatus;
      }

      const extra = [
        assigneeLabel ? `assignee: ${assigneeLabel}` : '',
        created.dueDate ? `due: ${created.dueDate}` : '',
        statusLabel ? `status: ${statusLabel}` : '',
      ].filter(Boolean);

      console.log(
        `[${index + 1}/${rows.length}] Created: ${created.key} - ${created.title}${
          extra.length ? ` (${extra.join(', ')})` : ''
        }`
      );
      success += 1;
    } catch (error) {
      console.error(`[${index + 1}/${rows.length}] FAILED: ${title}`);
      console.error('  Reason:', JSON.stringify(error.error || error.message || error));
      failed += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\nDone. ${success} created, ${failed} failed.`);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
