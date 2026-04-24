const fs = require("fs");
const path = require("path");

const outputPath = path.join(process.cwd(), "Sentry_Bug_Testing_Guide_Styled.pdf");

const pageWidth = 612;
const pageHeight = 792;
const left = 72;
const right = 540;
const top = 74;
const bottom = 64;
const contentWidth = right - left;

const fontRegular = "F1";
const fontBold = "F2";

const sections = [
  {
    title: "1. Standard Workflow (Steps to Follow Each Time)",
    blocks: [
      { type: "subhead", text: "A. Prepare Sentry for Bug Testing" },
      { type: "step", text: "Step 1: Create the right Sentry projects" },
      {
        type: "bullets",
        items: [
          "Create a frontend project for the browser app.",
          "Create a backend project if your server talks to the database.",
          "Copy the DSN for each project from Sentry.",
        ],
      },
      { type: "step", text: "Step 2: Add environment variables" },
      {
        type: "bullets",
        items: [
          "Store the frontend and backend DSNs in environment files.",
          "Set environment values like staging or production.",
          "Set a release name so issues can be tied to deployments.",
        ],
      },
      {
        type: "code",
        lines: [
          "VITE_SENTRY_DSN=https://public@example.ingest.sentry.io/123456",
          "SENTRY_DSN=https://public@example.ingest.sentry.io/654321",
          "SENTRY_ENVIRONMENT=staging",
          "SENTRY_RELEASE=webapp-1.0.0",
        ],
      },
      { type: "step", text: "Step 3: Install the SDKs" },
      {
        type: "code",
        lines: [
          "npm install @sentry/react @sentry/browser",
          "npm install @sentry/node",
        ],
      },
      {
        type: "note",
        text: "Use the frontend SDK for browser-side issues and the backend SDK for API and database-related errors.",
      },
      { type: "step", text: "Step 4: Initialize Sentry in the application" },
      {
        type: "bullets",
        items: [
          "Initialize Sentry at frontend startup.",
          "Initialize Sentry as early as possible in the backend.",
          "Restart the app after adding the DSN and config.",
        ],
      },
      {
        type: "code",
        lines: [
          "Sentry.init({",
          "  dsn: import.meta.env.VITE_SENTRY_DSN,",
          "  environment: import.meta.env.MODE,",
          "  release: \"webapp-1.0.0\",",
          "  tracesSampleRate: 1.0,",
          "});",
        ],
      },
      { type: "subhead", text: "B. Run Bug Tests / Common Testing Patterns" },
      {
        type: "numbered",
        items: [
          "Test a handled frontend exception with captureException.",
          "Test an unhandled frontend crash with throw new Error(...).",
          "Test an unhandled promise rejection.",
          "Test a backend route that throws a controlled error.",
          "Test a database/query failure through the backend.",
          "Test a failed API flow seen by both frontend and backend.",
        ],
      },
    ],
  },
  {
    title: "2. Detailed Test Procedure",
    blocks: [
      { type: "subhead", text: "A. Frontend Bug Tests" },
      { type: "step", text: "Step 1: Verify the SDK is active" },
      {
        type: "bullets",
        items: [
          "Open the web app in a browser.",
          "Open DevTools and keep the Network tab visible.",
          "Look for requests to sentry.io, ingest.sentry.io, or /envelope/ after a test event.",
        ],
      },
      { type: "step", text: "Step 2: Trigger a handled exception" },
      {
        type: "code",
        lines: [
          "Sentry.captureException(new Error(\"Frontend handled test bug\"));",
        ],
      },
      {
        type: "bullets",
        items: [
          "Confirm that an issue appears in Sentry.",
          "Check the stack trace, browser, URL, environment, and release.",
        ],
      },
      { type: "step", text: "Step 3: Trigger an unhandled crash" },
      {
        type: "code",
        lines: [
          "throw new Error(\"Frontend unhandled crash test\");",
        ],
      },
      {
        type: "bullets",
        items: [
          "Confirm the event is captured separately from the handled test.",
          "If an error boundary exists, confirm the fallback UI appears.",
        ],
      },
      { type: "step", text: "Step 4: Trigger an unhandled promise rejection" },
      {
        type: "code",
        lines: [
          "Promise.reject(new Error(\"Unhandled promise rejection test\"));",
        ],
      },
      { type: "subhead", text: "B. Backend and Database Bug Tests" },
      { type: "step", text: "Step 5: Trigger a backend exception" },
      {
        type: "code",
        lines: [
          "app.get(\"/test-backend-error\", (req, res) => {",
          "  throw new Error(\"Backend crash test\");",
          "});",
        ],
      },
      { type: "step", text: "Step 6: Trigger a database error through the backend" },
      {
        type: "code",
        lines: [
          "app.get(\"/test-db-error\", async (req, res, next) => {",
          "  try {",
          "    const result = await db.query(\"SELECT * FROM missing_table\");",
          "    res.json(result.rows);",
          "  } catch (error) {",
          "    Sentry.captureException(error);",
          "    next(error);",
          "  }",
          "});",
        ],
      },
      {
        type: "note",
        text: "Sentry does not test the database directly. It captures the database error when your backend throws or records it.",
      },
      {
        type: "bullets",
        items: [
          "Use safe staging-only failures like a missing table, missing column, timeout, or duplicate key test data.",
          "Do not use destructive production tests.",
        ],
      },
    ],
  },
  {
    title: "3. Verification and Cleanup",
    blocks: [
      { type: "subhead", text: "A. What to Verify in Sentry" },
      {
        type: "numbered",
        items: [
          "Issue title is clear and grouped correctly.",
          "Stack trace points to the right source files.",
          "Environment and release values are present.",
          "User, tags, and breadcrumbs are visible if configured.",
          "Frontend and backend failures can be correlated when the API fails.",
        ],
      },
      { type: "subhead", text: "B. Common Safe Context to Add" },
      {
        type: "code",
        lines: [
          "Sentry.setUser({ id: \"123\", email: \"tester@example.com\" });",
          "Sentry.setTag(\"area\", \"checkout\");",
          "Sentry.setContext(\"test_case\", { name: \"db-timeout-simulation\" });",
        ],
      },
      { type: "subhead", text: "C. Final Checklist" },
      {
        type: "numbered",
        items: [
          "DSN present and SDK installed.",
          "Frontend and backend initialized.",
          "Handled and unhandled frontend issues captured.",
          "Backend and DB-related issues captured.",
          "Source maps, grouping, and alerts verified.",
          "Temporary crash buttons and test routes removed.",
        ],
      },
    ],
  },
];

function escapePdfText(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text, maxChars) {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const out = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
      continue;
    }
    if (line) out.push(line);
    line = word;
  }

  if (line) out.push(line);
  return out;
}

function estimateLines(text, maxChars) {
  return wrapText(text, maxChars).length;
}

function createPage() {
  return { ops: [], y: top };
}

function pushText(page, x, y, text, font, size, color) {
  page.ops.push("BT");
  page.ops.push(`/${font} ${size} Tf`);
  page.ops.push(`${color[0]} ${color[1]} ${color[2]} rg`);
  page.ops.push(`1 0 0 1 ${x} ${pageHeight - y} Tm`);
  page.ops.push(`(${escapePdfText(text)}) Tj`);
  page.ops.push("ET");
}

function pushRect(page, x, y, w, h, fillColor) {
  page.ops.push(`${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`);
  page.ops.push(`${x} ${pageHeight - y - h} ${w} ${h} re f`);
}

function pushLine(page, x1, y1, x2, y2, width, color) {
  page.ops.push(`${color[0]} ${color[1]} ${color[2]} RG`);
  page.ops.push(`${width} w`);
  page.ops.push(`${x1} ${pageHeight - y1} m ${x2} ${pageHeight - y2} l S`);
}

function ensureSpace(pages, needed, reserveFooter = 26) {
  let page = pages[pages.length - 1];
  if (page.y + needed > pageHeight - bottom - reserveFooter) {
    page = createPage();
    pages.push(page);
  }
  return page;
}

function renderFooter(page, pageNumber) {
  pushText(
    page,
    230,
    754,
    `Sentry Bug Testing Manual - Page ${pageNumber}`,
    fontRegular,
    9,
    [0.55, 0.55, 0.55],
  );
}

function renderDocument() {
  const pages = [createPage()];
  const maxChars = 70;
  const bulletMaxChars = 61;
  const codeMaxChars = 66;

  for (const section of sections) {
    let page = ensureSpace(pages, 60);
    pushText(page, left, page.y, section.title, fontBold, 17, [0.78, 0.12, 0.08]);
    page.y += 12;
    pushLine(page, left, page.y, right, page.y, 1, [0.86, 0.16, 0.13]);
    page.y += 26;

    for (const block of section.blocks) {
      if (block.type === "subhead") {
        page = ensureSpace(pages, 28);
        pushText(page, left, page.y, block.text, fontBold, 11.5, [0.12, 0.12, 0.12]);
        page.y += 24;
        continue;
      }

      if (block.type === "step") {
        page = ensureSpace(pages, 22);
        pushText(page, left, page.y, block.text, fontBold, 10.8, [0.14, 0.14, 0.14]);
        page.y += 18;
        continue;
      }

      if (block.type === "bullets") {
        for (const item of block.items) {
          const wrapped = wrapText(item, bulletMaxChars);
          page = ensureSpace(pages, wrapped.length * 14 + 4);
          for (let i = 0; i < wrapped.length; i += 1) {
            if (i === 0) pushText(page, left + 18, page.y, "\u2022", fontRegular, 11, [0.1, 0.1, 0.1]);
            pushText(page, left + 34, page.y, wrapped[i], fontRegular, 10.6, [0.12, 0.12, 0.12]);
            page.y += 14;
          }
        }
        page.y += 8;
        continue;
      }

      if (block.type === "numbered") {
        let n = 1;
        for (const item of block.items) {
          const wrapped = wrapText(item, bulletMaxChars);
          page = ensureSpace(pages, wrapped.length * 14 + 4);
          for (let i = 0; i < wrapped.length; i += 1) {
            if (i === 0) pushText(page, left + 8, page.y, `${n}.`, fontRegular, 10.8, [0.1, 0.1, 0.1]);
            pushText(page, left + 34, page.y, wrapped[i], fontRegular, 10.6, [0.12, 0.12, 0.12]);
            page.y += 14;
          }
          n += 1;
        }
        page.y += 8;
        continue;
      }

      if (block.type === "code") {
        const wrappedLines = block.lines.flatMap((line) => wrapText(line, codeMaxChars));
        const height = wrappedLines.length * 14 + 10;
        page = ensureSpace(pages, height + 8);
        pushRect(page, left + 16, page.y - 2, contentWidth - 16, height, [0.94, 0.94, 0.94]);
        pushRect(page, left + 16, page.y - 2, 2, height, [0.12, 0.73, 0.58]);
        let y = page.y + 10;
        for (const line of wrappedLines) {
          pushText(page, left + 24, y, line, fontRegular, 10.3, [0.16, 0.22, 0.32]);
          y += 14;
        }
        page.y += height + 10;
        continue;
      }

      if (block.type === "note") {
        const wrapped = wrapText(block.text, maxChars);
        const height = wrapped.length * 14 + 10;
        page = ensureSpace(pages, height + 8);
        pushRect(page, left + 16, page.y - 2, contentWidth - 16, height, [1, 0.97, 0.88]);
        let y = page.y + 10;
        for (const line of wrapped) {
          pushText(page, left + 24, y, line, fontRegular, 10.1, [0.35, 0.24, 0.06]);
          y += 14;
        }
        page.y += height + 10;
      }
    }
  }

  pages.forEach((page, index) => renderFooter(page, index + 1));
  return pages;
}

function buildPdf(pages) {
  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];

  for (const page of pages) {
    const stream = page.ops.join("\n");
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /${fontRegular} ${fontRegularId} 0 R /${fontBold} ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

const pages = renderDocument();
const pdf = buildPdf(pages);
fs.writeFileSync(outputPath, pdf, "utf8");
console.log(`Created ${outputPath}`);
