import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { join } from "node:path";

const BASE_URL = "http://127.0.0.1:8788";
const PROJECT_ROOT = join(import.meta.dirname, "..");

let serverProcess;

// Helper to wait for server to be ready
async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start in time`);
}

describe("API Endpoints", () => {
  before(async () => {
    // Start the dev server
    serverProcess = spawn("npm", ["run", "serve"], {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      detached: true,
    });

    // Wait for server to be ready
    await waitForServer(BASE_URL);
  });

  after(() => {
    // Kill the server process group
    if (serverProcess && serverProcess.pid) {
      try {
        process.kill(-serverProcess.pid, "SIGTERM");
      } catch {
        // Process may already be dead
      }
    }
  });

  // === Tests that DON'T hit external APIs ===

  describe("/api/settings", () => {
    it("returns JSON with expected fields", async () => {
      const res = await fetch(`${BASE_URL}/api/settings`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("content-type"), "application/json");

      const data = await res.json();
      assert.ok("liveDataEnabled" in data, "Should have liveDataEnabled field");
      assert.ok("stravaEnabled" in data, "Should have stravaEnabled field");
      assert.strictEqual(typeof data.liveDataEnabled, "boolean");
      assert.strictEqual(typeof data.stravaEnabled, "boolean");
    });
  });

  // Validation tests - these return 400 without calling external APIs
  describe("/api/youtube validation", () => {
    it("returns 400 when channelId is missing", async () => {
      const res = await fetch(`${BASE_URL}/api/youtube`);
      assert.strictEqual(res.status, 400);

      const data = await res.json();
      assert.ok(data.error, "Should have error field");
      assert.ok(
        data.error.toLowerCase().includes("channelid"),
        "Error should mention channelId"
      );
    });
  });

  describe("/api/books validation", () => {
    it("returns 400 when query is missing", async () => {
      const res = await fetch(`${BASE_URL}/api/books`);
      assert.strictEqual(res.status, 400);

      const data = await res.json();
      assert.ok(data.error, "Should have error field");
      assert.ok(
        data.error.toLowerCase().includes("query"),
        "Error should mention query"
      );
    });
  });

  describe("Static file serving", () => {
    it("serves homepage", async () => {
      const res = await fetch(BASE_URL);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.ok(
        text.includes("<!doctype html>") || text.includes("<!DOCTYPE html>")
      );
    });

    it("serves CSS file", async () => {
      const res = await fetch(`${BASE_URL}/styles.css`);
      assert.strictEqual(res.status, 200);
      const contentType = res.headers.get("content-type");
      assert.ok(contentType?.includes("text/css"), "Should serve CSS");
    });

    it("serves blog index", async () => {
      const res = await fetch(`${BASE_URL}/blog/`);
      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes("Blog"), "Should have Blog content");
    });

    it("serves JavaScript files", async () => {
      const res = await fetch(`${BASE_URL}/scripts/main.js`);
      assert.strictEqual(res.status, 200);
      const contentType = res.headers.get("content-type");
      assert.ok(
        contentType?.includes("javascript"),
        "Should serve JavaScript"
      );
    });
  });
});
