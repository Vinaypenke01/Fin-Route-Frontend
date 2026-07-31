#!/usr/bin/env node
// Detect TanStack Router route ID collisions and filename/createFileRoute mismatches.
// Fails fast — prevents bugs like `field.tsx` colliding with `field.route.tsx` (both → /field).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROUTES_DIR = "src/routes";

const c = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  dim: "\x1b[90m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?)$/.test(name) && name !== "__root.tsx" && !name.endsWith(".gen.ts"))
      out.push(p);
  }
  return out;
}

// Filename → expected createFileRoute("...") argument.
// Rules: dots and folders both become "/"; trailing `.route` maps to the folder path
// (layout module for a folder); trailing `.index` becomes a trailing "/" on the parent.
function fileToRouteId(file) {
  const rel = relative(ROUTES_DIR, file).replace(/\\/g, "/").replace(/\.(tsx?|jsx?)$/, "");
  let segs = rel.split("/").flatMap((s) => s.split("."));
  let trailingSlash = false;
  if (segs[segs.length - 1] === "route") segs.pop();
  if (segs[segs.length - 1] === "index") {
    segs.pop();
    trailingSlash = true;
  }
  const base = segs.length ? "/" + segs.join("/") : "";
  const id = trailingSlash ? (base === "" ? "/" : base + "/") : base || "/";
  return id;
}

function extractCreateFileRouteArg(src) {
  const m = src.match(/createFileRoute\(\s*["'`]([^"'`]+)["'`]\s*\)/);
  return m ? m[1] : null;
}

const files = walk(ROUTES_DIR);
const byId = new Map();
const mismatches = [];

for (const file of files) {
  const src = readFileSync(file, "utf8");
  if (!/createFileRoute\s*\(/.test(src)) continue;
  const expected = fileToRouteId(file);
  const declared = extractCreateFileRouteArg(src);

  if (declared && declared !== expected) {
    mismatches.push({ file, expected, declared });
  }
  if (!byId.has(expected)) byId.set(expected, []);
  byId.get(expected).push(file);
}

const collisions = [];
for (const [id, entries] of byId) {
  if (entries.length > 1) {
    collisions.push({ id, files: entries });
  }
}

const totalIssues = mismatches.length + collisions.length;

if (totalIssues > 0) {
  console.error(`\n${c.red}${c.bold}✖ TanStack route validation failed${c.reset}\n`);

  if (collisions.length) {
    console.error(`${c.red}${c.bold}  Duplicate route IDs (${collisions.length})${c.reset}`);
    for (const { id, files: entries } of collisions) {
      console.error(`  ${c.yellow}• Route ID: ${c.bold}${id}${c.reset}`);
      for (const f of entries) {
        console.error(`      ${c.dim}─${c.reset} ${f}`);
      }
    }
    console.error();
  }

  if (mismatches.length) {
    console.error(`${c.red}${c.bold}  Filename / createFileRoute mismatches (${mismatches.length})${c.reset}`);
    for (const { file, expected, declared } of mismatches) {
      console.error(`  ${c.yellow}• File:     ${c.reset}${file}`);
      console.error(`    ${c.dim}─${c.reset} Declared: ${c.cyan}createFileRoute("${declared}")${c.reset}`);
      console.error(`    ${c.dim}─${c.reset} Expected: ${c.cyan}"${expected}"${c.reset} (derived from filename)`);
    }
    console.error();
  }

  console.error(
    `${c.dim}  Hint: .route.tsx is a reserved suffix for folder layout modules and maps to the${c.reset}\n` +
      `${c.dim}  parent folder’s route ID. For a child route under /foo, use foo.<child>.tsx${c.reset}\n` +
      `${c.dim}  (e.g., foo.about.tsx → /foo/about) instead of foo.route.tsx.${c.reset}\n`,
  );
  console.error(
    `${c.dim}  ${"─".repeat(60)}${c.reset}\n` +
      `${c.dim}  ${files.length} route files scanned | ${byId.size} unique IDs | ${totalIssues} problem(s) found${c.reset}\n`,
  );
  process.exit(1);
}

console.log(
  `${c.green}${c.bold}✓ Routes OK${c.reset} — ${files.length} route files, ${byId.size} unique IDs, no collisions or mismatches.`,
);
