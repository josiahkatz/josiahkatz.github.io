/**
 * Asset Hashing and Minification Build Script
 *
 * This script:
 * 1. Minifies CSS files
 * 2. Generates content hashes for CSS and ALL JS files
 * 3. Renames files with hashes (e.g., styles.a1b2c3d4.css)
 * 4. Updates imports within JS files to reference hashed filenames
 * 5. Updates HTML files to reference the hashed filenames
 *
 * Run after Eleventy build: node scripts/build/hash-assets.mjs
 */

import { createHash } from "crypto";
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { join, basename, dirname, extname } from "path";
import CleanCSS from "clean-css";

const DIST_DIR = "dist";

// CSS files to hash
const CSS_FILES = [{ path: "styles.css", minify: true }];

// JS files are discovered automatically from dist/scripts

function findAllJsFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip build directory
      if (entry.name !== "build") {
        findAllJsFiles(fullPath, files);
      }
    } else if (entry.name.endsWith(".js") && !entry.name.includes(".")) {
      // Skip already-hashed files (contain hash pattern)
      files.push(fullPath);
    } else if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

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
          htmlFiles.push(fullPath.replace(DIST_DIR + "/", ""));
        }
      }
    } catch {
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
  const output = new CleanCSS({ returnPromise: false }).minify([inputPath]);
  if (output.errors.length > 0) {
    throw new Error(`CSS minification failed: ${output.errors.join(", ")}`);
  }
  writeFileSync(outputPath, output.styles);
}

function buildDependencyGraph(jsFiles) {
  // Map of file path -> files it imports (local only)
  const graph = new Map();

  for (const file of jsFiles) {
    const relativePath = file.replace(DIST_DIR + "/", "");
    graph.set(relativePath, []);
  }

  for (const file of jsFiles) {
    const relativePath = file.replace(DIST_DIR + "/", "");
    const content = readFileSync(file, "utf-8");
    const fileDir = dirname(relativePath);

    // Find all imports
    const importRegex = /from\s+["'](\.[^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // Resolve the import path relative to the file
      let resolvedPath;
      if (importPath.startsWith("./utils/")) {
        resolvedPath = join(fileDir, importPath.slice(2)).replace(/\\/g, "/");
      } else if (importPath.startsWith("../")) {
        resolvedPath = join(fileDir, importPath).replace(/\\/g, "/");
      } else if (importPath.startsWith("./")) {
        resolvedPath = join(fileDir, importPath.slice(2)).replace(/\\/g, "/");
      } else {
        continue;
      }

      if (graph.has(resolvedPath)) {
        graph.get(relativePath).push(resolvedPath);
      }
    }
  }

  return graph;
}

function topologicalSort(graph) {
  const visited = new Set();
  const result = [];

  function visit(node) {
    if (visited.has(node)) return;
    visited.add(node);

    for (const dep of graph.get(node) || []) {
      visit(dep);
    }

    result.push(node);
  }

  for (const node of graph.keys()) {
    visit(node);
  }

  return result; // Leaves first, then dependents
}

function processAssets() {
  console.log("\n📦 Processing assets for production...\n");

  const hashMap = {}; // original path -> hashed path

  // Process CSS files first
  for (const asset of CSS_FILES) {
    const originalPath = join(DIST_DIR, asset.path);
    const ext = extname(asset.path);
    const dir = dirname(asset.path);
    const name = basename(asset.path, ext);

    console.log(`Processing: ${asset.path}`);

    let content;
    if (asset.minify && ext === ".css") {
      const tempPath = join(DIST_DIR, `${name}.min${ext}`);
      minifyCSS(originalPath, tempPath);
      content = readFileSync(tempPath);
      unlinkSync(tempPath);
    } else {
      content = readFileSync(originalPath);
    }

    const hash = generateHash(content);
    const hashedFilename = `${name}.${hash}${ext}`;
    const hashedPath = join(DIST_DIR, dir === "." ? "" : dir, hashedFilename);

    writeFileSync(hashedPath, content);
    console.log(`  Created: ${hashedFilename}`);

    hashMap[`./${asset.path}`] = `./${hashedFilename}`;
    hashMap[`/${asset.path}`] = `/${hashedFilename}`;
  }

  // Find all JS files in dist/scripts
  const scriptsDir = join(DIST_DIR, "scripts");
  const jsFiles = findAllJsFiles(scriptsDir);

  console.log(`\nFound ${jsFiles.length} JS files to process\n`);

  // Build dependency graph and get processing order
  const graph = buildDependencyGraph(jsFiles);
  const processingOrder = topologicalSort(graph);

  // Process JS files in dependency order (leaves first)
  const jsHashMap = new Map(); // relativePath -> hashedFilename

  for (const relativePath of processingOrder) {
    const fullPath = join(DIST_DIR, relativePath);
    const ext = extname(relativePath);
    const dir = dirname(relativePath);
    const name = basename(relativePath, ext);

    console.log(`Processing: ${relativePath}`);

    // Read content and update imports to use hashed paths
    let content = readFileSync(fullPath, "utf-8");

    // Update imports to reference hashed files
    for (const [origPath, hashedName] of jsHashMap) {
      // Build the correct relative import path from this file to the hashed file
      const origDir = dirname(origPath);
      const thisDir = dirname(relativePath);

      let newImportPath;
      if (thisDir === origDir) {
        newImportPath = `./${hashedName}`;
      } else if (thisDir === "scripts" && origDir === "scripts/utils") {
        newImportPath = `./utils/${hashedName}`;
      } else if (thisDir === "scripts/utils" && origDir === "scripts") {
        newImportPath = `../${hashedName}`;
      } else if (thisDir === "scripts/utils" && origDir === "scripts/utils") {
        newImportPath = `./${hashedName}`;
      }

      if (newImportPath) {
        const origFilename = basename(origPath);
        // Match various import patterns
        const patterns = [
          [`"./${origFilename}"`, `"${newImportPath}"`],
          [`'./${origFilename}'`, `'${newImportPath}'`],
          [`"./utils/${origFilename}"`, `"./utils/${hashedName}"`],
          [`'./utils/${origFilename}'`, `'./utils/${hashedName}'`],
          [`"../${origFilename}"`, `"../${hashedName}"`],
          [`'../${origFilename}'`, `'../${hashedName}'`],
        ];

        for (const [from, to] of patterns) {
          if (content.includes(from)) {
            content = content.split(from).join(to);
          }
        }
      }
    }

    // Generate hash of updated content
    const hash = generateHash(content);
    const hashedFilename = `${name}.${hash}${ext}`;
    const hashedPath = join(DIST_DIR, dir, hashedFilename);

    // Write hashed file with updated imports
    writeFileSync(hashedPath, content);
    console.log(`  Created: ${dir}/${hashedFilename}`);

    // Store mapping
    jsHashMap.set(relativePath, hashedFilename);

    // Add to main hashMap for HTML updates
    if (relativePath === "scripts/main.js") {
      hashMap[`./scripts/main.js`] = `./scripts/${hashedFilename}`;
      hashMap[`/scripts/main.js`] = `/scripts/${hashedFilename}`;
    }
  }

  return hashMap;
}

function updateHtmlFiles(hashMap) {
  console.log("\n📝 Updating HTML files...\n");

  const htmlFiles = ["index.html", "blog/index.html", ...findBlogPostHtmlFiles()];
  const uniqueHtmlFiles = [...new Set(htmlFiles)];

  for (const htmlFile of uniqueHtmlFiles) {
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
    } catch {
      // File doesn't exist, skip
    }
  }
}

function cleanOldHashedFiles() {
  console.log("\n🧹 Cleaning old hashed files...\n");

  // Clean hashed CSS files in dist root
  const distFiles = readdirSync(DIST_DIR);
  for (const file of distFiles) {
    if (/^styles\.[a-f0-9]{8}\.css$/.test(file)) {
      unlinkSync(join(DIST_DIR, file));
      console.log(`  Removed: ${file}`);
    }
  }

  // Clean ALL hashed JS files in dist/scripts (recursively)
  function cleanHashedJs(dir) {
    try {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = join(dir, file.name);
        if (file.isDirectory()) {
          cleanHashedJs(fullPath);
        } else if (/\.[a-f0-9]{8}\.js$/.test(file.name)) {
          unlinkSync(fullPath);
          const relPath = fullPath.replace(DIST_DIR + "/", "");
          console.log(`  Removed: ${relPath}`);
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  cleanHashedJs(join(DIST_DIR, "scripts"));
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
