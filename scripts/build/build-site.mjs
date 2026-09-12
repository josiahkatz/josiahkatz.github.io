import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = "dist";
const STATIC_FILES = ["index.html", "styles.css", "favicon.svg", "_headers"];
const STATIC_DIRECTORIES = ["fonts", "images", "scripts"];

rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

for (const file of STATIC_FILES) {
  cpSync(file, join(DIST_DIR, file));
}

for (const directory of STATIC_DIRECTORIES) {
  cpSync(directory, join(DIST_DIR, directory), { recursive: true });
}

await import("./hash-assets.mjs");
