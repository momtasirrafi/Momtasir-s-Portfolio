const fs = require('fs');
const https = require('https');
const path = require('path');

let xlsx;
let dotenv;

try {
  xlsx = require('xlsx');
  dotenv = require('dotenv');
} catch (error) {
  console.error(
    'Missing dependency. Install these first: npm install xlsx dotenv'
  );
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
const EXCEL_PATH =
  process.env.EXCEL_PATH || 'C:/Users/rafid/Java scripting/Workbook1.md.xlsx';
const SHEET_NAME = process.env.SHEET_NAME || '';
const ASSIGNEE_COLUMN = process.env.ASSIGNEE_COLUMN || 'Assignee';
const TITLE_COLUMN = process.env.TITLE_COLUMN || 'Title';

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

async function assignIssue(issueKey, accountId) {
  await jiraRequest(
    'PUT',
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}/assignee`,
    { accountId }
  );
}

function escapeJqlValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function buildTitleCandidates(title) {
  const raw = String(title || '').trim();

  if (!raw) {
    return [];
  }

  const candidates = new Set([raw]);
  const withoutIssueKeyPrefix = raw
    .replace(/^\s*\[[A-Z][A-Z0-9]+\s*-\s*\d+\]\s*[-:]?\s*/i, '')
    .trim();
  const withoutBrackets = withoutIssueKeyPrefix.replace(/[\[\]]/g, '').trim();
  const collapsed = withoutBrackets.replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ').trim();

  if (withoutIssueKeyPrefix) candidates.add(withoutIssueKeyPrefix);
  if (withoutBrackets) candidates.add(withoutBrackets);
  if (collapsed) candidates.add(collapsed);

  return [...candidates];
}

async function findIssueKeyFromTitle(title) {
  const candidates = buildTitleCandidates(title);

  if (!candidates.length) {
    return null;
  }

  for (const cleanTitle of candidates) {
    const jql = `project = "${escapeJqlValue(PROJECT_KEY)}" AND summary ~ "\\"${escapeJqlValue(
      cleanTitle
    )}\\"" ORDER BY created DESC`;

    const { data } = await jiraRequest('POST', '/rest/api/3/search/jql', {
      jql,
      maxResults: 10,
      fields: ['summary'],
    });

    const issues = Array.isArray(data?.issues) ? data.issues : [];

    const exactMatch = issues.find((issue) => {
      const summary = issue?.fields?.summary || '';
      return summary.trim().toLowerCase() === cleanTitle.toLowerCase();
    });

    if (exactMatch) {
      return exactMatch.key;
    }

    if (issues.length === 1) {
      return issues[0].key;
    }

    if (issues.length > 1) {
      const matchedKeys = issues.map((issue) => issue.key).join(', ');
      throw new Error(
        `Multiple Jira issues matched title "${cleanTitle}": ${matchedKeys}`
      );
    }
  }

  throw new Error(`No Jira issue found for title "${candidates[0]}"`);
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

  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  let success = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`Found ${rows.length} rows. Starting assignee update...\n`);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const title = getCell(row, [TITLE_COLUMN, 'Title ', 'Summary']);
    const assigneeValue = getCell(row, [ASSIGNEE_COLUMN, 'Assignee ', 'Owner']);

    if (!title) {
      console.log(`[${index + 1}/${rows.length}] Skipped: missing title`);
      skipped += 1;
      continue;
    }

    if (!assigneeValue) {
      console.log(
        `[${index + 1}/${rows.length}] Skipped: ${title} has no assignee value`
      );
      skipped += 1;
      continue;
    }

    try {
      const issueKey = await findIssueKeyFromTitle(title);

      const user = await findAssignableUser(assigneeValue, issueKey);

      if (!user || !user.accountId) {
        throw new Error(`Could not resolve accountId for "${assigneeValue}"`);
      }

      await assignIssue(issueKey, user.accountId);
      console.log(
        `[${index + 1}/${rows.length}] Updated: ${issueKey} -> ${user.displayName || assigneeValue}`
      );
      success += 1;
    } catch (error) {
      console.error(`[${index + 1}/${rows.length}] FAILED: ${title}`);
      console.error(
        '  Reason:',
        JSON.stringify(error.error || error.message || error)
      );
      failed += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(`\nDone. ${success} updated, ${failed} failed, ${skipped} skipped.`);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
