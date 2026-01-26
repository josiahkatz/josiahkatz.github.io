/**
 * Asset Hashing and Minification Build Script
 *
 * This script:
 * 1. Minifies CSS files
 * 2. Generates content hashes for CSS and JS files
 * 3. Renames files with hashes (e.g., styles.a1b2c3d4.css)
 * 4. Updates HTML files to reference the hashed filenames
 *
 * Run after Eleventy build: node scripts/build/hash-assets.mjs
 */

import { createHash } from "crypto";
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { join, basename, dirname, extname } from "path";
import { execSync } from "child_process";

const DIST_DIR = "dist";

// Files to hash (relative to dist)
const ASSETS_TO_HASH = [
  { path: "styles.css", minify: true },
  { path: "scripts/main.js", minify: false },
];

// HTML files to update (relative to dist)
const HTML_FILES = [
  "index.html",
  "blog/index.html",
];

// Also find all blog post HTML files
function findBlogPostHtmlFiles() {
  const blogDir = join(DIST_DIR, "blog");
  const htmlFiles = [];

  function walkDir(dir) {
    try {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = join(dir, file.name);
        if (file.isDirectory()) {
          walkDir(fullPath);
        } else if (file.name === "index.html") {
          // Get path relative to dist
          htmlFiles.push(fullPath.replace(DIST_DIR + "/", ""));
        }
      }
    } catch (e) {
      // Directory doesn't exist, skip
    }
  }

  walkDir(blogDir);
  return htmlFiles;
}

function generateHash(content) {
  return createHash("md5").update(content).digest("hex").slice(0, 8);
}

function minifyCSS(inputPath, outputPath) {
  console.log(`  Minifying ${inputPath}...`);
  execSync(`npx cleancss -o "${outputPath}" "${inputPath}"`, {
    stdio: "inherit",
  });
}

function processAssets() {
  console.log("\n📦 Processing assets for production...\n");

  const hashMap = {}; // original filename -> hashed filename

  for (const asset of ASSETS_TO_HASH) {
    const originalPath = join(DIST_DIR, asset.path);
    const ext = extname(asset.path);
    const dir = dirname(asset.path);
    const name = basename(asset.path, ext);

    console.log(`Processing: ${asset.path}`);

    // Read original file
    let content;
    if (asset.minify && ext === ".css") {
      // Minify CSS to a temp file, then read it
      const tempPath = join(DIST_DIR, `${name}.min${ext}`);
      minifyCSS(originalPath, tempPath);
      content = readFileSync(tempPath);
      unlinkSync(tempPath); // Remove temp file
    } else {
      content = readFileSync(originalPath);
    }

    // Generate hash
    const hash = generateHash(content);
    const hashedFilename = `${name}.${hash}${ext}`;
    const hashedPath = join(DIST_DIR, dir, hashedFilename);

    // Write hashed file
    writeFileSync(hashedPath, content);
    console.log(`  Created: ${dir ? dir + "/" : ""}${hashedFilename}`);

    // Store mapping for HTML updates
    // Handle paths correctly (dir is "." for root files)
    const isRootFile = dir === ".";
    const originalRef = `./${asset.path}`;
    const hashedRef = isRootFile
      ? `./${hashedFilename}`
      : `./${dir}/${hashedFilename}`;

    hashMap[originalRef] = hashedRef;

    // Also handle absolute path references
    const absoluteHashed = isRootFile
      ? `/${hashedFilename}`
      : `/${dir}/${hashedFilename}`;
    hashMap[`/${asset.path}`] = absoluteHashed;
  }

  return hashMap;
}

function updateHtmlFiles(hashMap) {
  console.log("\n📝 Updating HTML files...\n");

  // Get all HTML files including dynamically found blog posts
  const allHtmlFiles = [...new Set([...HTML_FILES, ...findBlogPostHtmlFiles()])];

  for (const htmlFile of allHtmlFiles) {
    const htmlPath = join(DIST_DIR, htmlFile);

    try {
      let content = readFileSync(htmlPath, "utf-8");
      let updated = false;

      for (const [original, hashed] of Object.entries(hashMap)) {
        if (content.includes(original)) {
          content = content.split(original).join(hashed);
          updated = true;
        }
      }

      if (updated) {
        writeFileSync(htmlPath, content);
        console.log(`  Updated: ${htmlFile}`);
      }
    } catch (e) {
      // File doesn't exist, skip
    }
  }
}

function cleanOldHashedFiles() {
  console.log("\n🧹 Cleaning old hashed files...\n");

  // Clean hashed CSS files in dist root
  const distFiles = readdirSync(DIST_DIR);
  for (const file of distFiles) {
    // Match pattern: name.hash.ext where hash is 8 hex chars
    if (/^styles\.[a-f0-9]{8}\.css$/.test(file)) {
      unlinkSync(join(DIST_DIR, file));
      console.log(`  Removed: ${file}`);
    }
  }

  // Clean hashed JS files in dist/scripts
  try {
    const scriptFiles = readdirSync(join(DIST_DIR, "scripts"));
    for (const file of scriptFiles) {
      if (/^main\.[a-f0-9]{8}\.js$/.test(file)) {
        unlinkSync(join(DIST_DIR, "scripts", file));
        console.log(`  Removed: scripts/${file}`);
      }
    }
  } catch (e) {
    // scripts dir doesn't exist yet
  }
}

// Main execution
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Asset Hashing & Minification");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

cleanOldHashedFiles();
const hashMap = processAssets();
updateHtmlFiles(hashMap);

console.log("\n✅ Asset processing complete!\n");
console.log("Hash mappings:");
for (const [original, hashed] of Object.entries(hashMap)) {
  if (original.startsWith("./")) {
    console.log(`  ${original} → ${hashed}`);
  }
}
console.log("");
