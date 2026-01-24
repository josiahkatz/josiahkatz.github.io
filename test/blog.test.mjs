import { describe, it, before } from "node:test";
import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const DIST_DIR = join(import.meta.dirname, "..", "dist");

describe("Blog Build", () => {
  before(() => {
    // Ensure we have a fresh build
    execSync("npm run build", { cwd: join(import.meta.dirname, "..") });
  });

  describe("Required files exist", () => {
    const requiredFiles = [
      "index.html",
      "styles.css",
      "favicon.svg",
      "blog/index.html",
      "blog/feed.xml",
      "blog/tags/index.html",
    ];

    for (const file of requiredFiles) {
      it(`${file} exists`, () => {
        assert.ok(existsSync(join(DIST_DIR, file)), `${file} should exist`);
      });
    }
  });

  describe("Removed files do not exist", () => {
    const removedPaths = [
      "admin/index.html",
      "admin/config.yml",
      "notes/index.html",
      "notes/feed.xml",
    ];

    for (const file of removedPaths) {
      it(`${file} does not exist`, () => {
        assert.ok(
          !existsSync(join(DIST_DIR, file)),
          `${file} should not exist`
        );
      });
    }
  });

  describe("Blog index content", () => {
    it("contains correct title", () => {
      const content = readFileSync(join(DIST_DIR, "blog/index.html"), "utf-8");
      assert.ok(content.includes("<title>Blog"), "Should have Blog title");
    });

    it("contains RSS feed link", () => {
      const content = readFileSync(join(DIST_DIR, "blog/index.html"), "utf-8");
      assert.ok(
        content.includes('href="/blog/feed.xml"'),
        "Should link to RSS feed"
      );
    });

    it("does not reference notes", () => {
      const content = readFileSync(join(DIST_DIR, "blog/index.html"), "utf-8");
      assert.ok(
        !content.includes('href="/notes'),
        "Should not link to notes"
      );
    });
  });

  describe("RSS feed", () => {
    it("is valid XML with correct channel", () => {
      const content = readFileSync(join(DIST_DIR, "blog/feed.xml"), "utf-8");
      assert.ok(content.includes("<rss"), "Should be RSS format");
      assert.ok(content.includes("<channel>"), "Should have channel element");
      assert.ok(content.includes("Blog</title>"), "Should have Blog in title");
    });
  });

  describe("Blog post generation", () => {
    it("generates post with date-based URL", () => {
      // Check that at least one post exists with YYYY/MM/slug structure
      const helloWorldPath = "blog/2026/01/hello-world/index.html";
      assert.ok(
        existsSync(join(DIST_DIR, helloWorldPath)),
        "Hello world post should exist at date-based URL"
      );
    });

    it("post contains expected elements", () => {
      const content = readFileSync(
        join(DIST_DIR, "blog/2026/01/hello-world/index.html"),
        "utf-8"
      );
      assert.ok(content.includes("Hello World"), "Should have post title");
      assert.ok(content.includes("<time"), "Should have time element");
      assert.ok(content.includes('href="/blog/"'), "Should link back to blog");
    });
  });

  describe("Tag pages", () => {
    it("generates tag index", () => {
      assert.ok(
        existsSync(join(DIST_DIR, "blog/tags/index.html")),
        "Tag index should exist"
      );
    });

    it("generates individual tag pages", () => {
      // Check for at least one tag page (design tag from hello-world post)
      assert.ok(
        existsSync(join(DIST_DIR, "blog/tags/design/index.html")),
        "Design tag page should exist"
      );
    });
  });

  describe("Static assets", () => {
    it("copies scripts directory", () => {
      assert.ok(
        existsSync(join(DIST_DIR, "scripts/main.js")),
        "Main script should exist"
      );
    });

    it("copies images directory", () => {
      assert.ok(
        existsSync(join(DIST_DIR, "images")),
        "Images directory should exist"
      );
    });
  });
});
