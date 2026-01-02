import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 8080;

const clients = new Set();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

const sendReload = () => {
  for (const res of clients) {
    res.write("data: reload\n\n");
  }
};

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  if (req.url === "/__livereload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write("retry: 1000\n\n");
    clients.add(res);

    req.on("close", () => {
      clients.delete(res);
    });
    return;
  }

  if (req.url === "/__livereload-check") {
    res.writeHead(204, {
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });
    res.end();
    return;
  }

  const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  const safePath = path.normalize(requestPath).replace(/^\.\.(\/|\\)/, "");
  let filePath = path.join(rootDir, safePath);

  if (safePath === "/") {
    filePath = path.join(rootDir, "index.html");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

const shouldIgnore = (filePath) => {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.includes("/.git/") || normalized.includes("/node_modules/");
};

fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
  if (!filename || shouldIgnore(filename)) return;
  sendReload();
});

server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
});
