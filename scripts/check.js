#!/usr/bin/env node
/**
 * scripts/check.js — PYL0N Suite lint / health check
 * Run: node scripts/check.js
 * Exits 1 if any errors are found.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TOOL_FILES = [
  'index.html', 'timecast.html', 'resourcecast.html', 'orgcast.html',
  'rfqcast.html', 'dorcast.html', 'riskcast.html', 'calccast.html',
  'lettercast.html', 'cashflow.html', 'w2w-report.html', 'cvcast.html',
];

// Tools that intentionally omit pyl0n-native.js (no file-save IPC needed)
const NO_NATIVE = new Set(['cashflow.html', 'w2w-report.html', 'index.html']);

// Tools that intentionally omit pyl0n-state.js (no undo stack)
const NO_STATE = new Set(['cashflow.html', 'w2w-report.html', 'index.html']);

const REQUIRED_SCRIPTS = [
  { file: 'vendor/pyl0n-suite.js',    skip: new Set() },
  { file: 'vendor/pyl0n-validate.js', skip: new Set(['index.html', 'login.html', '403.html']) },
  { file: 'vendor/pyl0n-native.js',   skip: NO_NATIVE },
  { file: 'vendor/pyl0n-state.js',    skip: NO_STATE },
];

// CDN domains that should never appear in tool files
const BANNED_CDN = [
  'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'unpkg.com',
  'ajax.googleapis.com', 'maxcdn.bootstrapcdn.com',
];

// localStorage keys that must use bidcast_ prefix (not legacy pyl0n_)
const LEGACY_KEY_RE = /localStorage\.(getItem|setItem|removeItem)\s*\(\s*['"`]pyl0n_/g;

let errors = 0;
let warnings = 0;

function err(file, msg)  { console.error(`  ✗ [${file}] ${msg}`); errors++; }
function warn(file, msg) { console.warn(`  ⚠ [${file}] ${msg}`); warnings++; }
function ok(msg)         { console.log(`  ✓ ${msg}`); }

console.log('\nPYL0N Suite — health check\n');

// ── 1. Required vendor script tags ────────────────────────────────────────
console.log('1. Vendor script tags');
for (const tool of TOOL_FILES) {
  const filePath = path.join(ROOT, tool);
  if (!fs.existsSync(filePath)) { err(tool, 'File not found'); continue; }
  const src = fs.readFileSync(filePath, 'utf8');
  for (const { file, skip } of REQUIRED_SCRIPTS) {
    if (skip.has(tool)) continue;
    if (!src.includes(file)) {
      err(tool, `Missing <script src="${file}">`);
    }
  }
}
if (!errors) ok('All required vendor script tags present');

// ── 2. Legacy localStorage key usage ──────────────────────────────────────
console.log('\n2. Legacy localStorage keys (pyl0n_ prefix)');
let legacyFound = false;
for (const tool of TOOL_FILES) {
  const filePath = path.join(ROOT, tool);
  if (!fs.existsSync(filePath)) continue;
  const src = fs.readFileSync(filePath, 'utf8');
  const matches = src.match(LEGACY_KEY_RE);
  if (matches) {
    err(tool, `Found ${matches.length} legacy pyl0n_ localStorage call(s) — use bidcast_ prefix`);
    legacyFound = true;
  }
}
if (!legacyFound) ok('No legacy pyl0n_ localStorage keys found');

// ── 3. Banned CDN URLs ────────────────────────────────────────────────────
console.log('\n3. CDN dependency check');
let cdnFound = false;
for (const tool of TOOL_FILES) {
  const filePath = path.join(ROOT, tool);
  if (!fs.existsSync(filePath)) continue;
  const src = fs.readFileSync(filePath, 'utf8');
  for (const cdn of BANNED_CDN) {
    if (src.includes(cdn)) {
      err(tool, `References banned CDN: ${cdn} — use local libs/ copy`);
      cdnFound = true;
    }
  }
}
if (!cdnFound) ok('No banned CDN URLs found');

// ── 4. manifest.json link ─────────────────────────────────────────────────
console.log('\n4. PWA manifest link');
let manifestMissing = false;
for (const tool of TOOL_FILES) {
  const filePath = path.join(ROOT, tool);
  if (!fs.existsSync(filePath)) continue;
  const src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes('manifest.json')) {
    warn(tool, 'Missing <link rel="manifest"> — PWA install unavailable');
    manifestMissing = true;
  }
}
if (!manifestMissing) ok('All tools link to manifest.json');

// ── 5. bidcast_state_ key consistency ────────────────────────────────────
console.log('\n5. State key naming');
const STATE_KEY_RE = /bidcast_state_([a-z0-9_-]+)/g;
const toolStem = t => t.replace('.html','').replace('-','');
for (const tool of TOOL_FILES) {
  if (tool === 'index.html') continue;
  const filePath = path.join(ROOT, tool);
  if (!fs.existsSync(filePath)) continue;
  const src = fs.readFileSync(filePath, 'utf8');
  const keys = [...new Set([...src.matchAll(STATE_KEY_RE)].map(m => m[1]))];
  const stem = toolStem(tool);
  if (keys.length > 0 && !keys.some(k => stem.startsWith(k) || k.startsWith(stem))) {
    warn(tool, `State key(s) [${keys.join(', ')}] may not match tool name "${stem}"`);
  }
}
ok('State key check complete');

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n── Summary: ${errors} error(s), ${warnings} warning(s) ──\n`);
if (errors > 0) {
  console.error('Health check FAILED. Fix errors above before releasing.\n');
  process.exit(1);
} else {
  console.log('Health check PASSED.\n');
}
