import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 5500);
const root = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.join(root, "database.json");
const defaultDatabase = {
  employees: [
    "Bashar",
    "Jahid",
    "Tanvir",
    "Shoheb",
    "Shukanto",
    "Rafi",
    "Shafwan",
    "Arnab",
    "Faiyaz",
  ].map((name, index) => ({
    id: `employee-${index + 1}`,
    name,
    active: true,
  })),
  records: [],
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function ensureDatabase() {
  if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(databasePath, JSON.stringify(defaultDatabase, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return fs.readFileSync(databasePath, "utf8");
}

function writeDatabase(data) {
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);

  if (requestPath === "/api/db" && request.method === "GET") {
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(readDatabase());
    return;
  }

  if (requestPath === "/api/db" && request.method === "PUT") {
    readRequestBody(request)
      .then((body) => {
        const data = JSON.parse(body);
        writeDatabase(data);
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ ok: true }));
      })
      .catch(() => {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ ok: false, error: "Invalid database payload" }));
      });
    return;
  }

  if (requestPath === "/api/db/reset" && request.method === "POST") {
    writeDatabase(defaultDatabase);
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, data: defaultDatabase }));
    return;
  }

  const filePath = path.join(root, requestPath === "/" ? "index.html" : requestPath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Attendance app running at http://127.0.0.1:${port}/index.html`);
});
