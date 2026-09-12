import { before, describe, it } from "node:test";
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dirname, "..");
const DIST_DIR = join(ROOT_DIR, "dist");

describe("Static site build", () => {
  before(() => {
    execSync("npm run build", { cwd: ROOT_DIR });
  });

  for (const file of [
    "index.html",
    "styles.css",
    "favicon.svg",
    "scripts/main.js",
    "images/avatar.jpg",
  ]) {
    it(`copies ${file}`, () => {
      assert.ok(existsSync(join(DIST_DIR, file)), `${file} should exist`);
    });
  }

  it("does not emit removed blog or feed files", () => {
    assert.ok(!existsSync(join(DIST_DIR, "blog")));
    assert.ok(!existsSync(join(DIST_DIR, "blog/feed.xml")));
  });

  it("does not link to the removed blog", () => {
    const html = readFileSync(join(DIST_DIR, "index.html"), "utf8");
    assert.ok(!html.includes("/blog"));
  });

  it("references hashed production assets", () => {
    const html = readFileSync(join(DIST_DIR, "index.html"), "utf8");
    assert.match(html, /styles\.[a-f0-9]{8}\.css/);
    assert.match(html, /scripts\/main\.[a-f0-9]{8}\.js/);
  });
});
