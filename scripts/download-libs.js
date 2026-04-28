#!/usr/bin/env node
/**
 * scripts/download-libs.js
 *
 * Downloads all required libraries AND fonts into libs/ for fully offline use.
 * Run once after cloning: node scripts/download-libs.js
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const LIBS_DIR  = path.join(__dirname, '..', 'libs');
const FONTS_DIR = path.join(LIBS_DIR, 'fonts');

fs.mkdirSync(LIBS_DIR,  { recursive: true });
fs.mkdirSync(FONTS_DIR, { recursive: true });

// ── JS Libraries ─────────────────────────────────────────────────────────────

const LIBS = [
  {
    name: 'xlsx.full.min.js',
    url:  'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
  },
  {
    name: 'html2pdf.bundle.min.js',
    url:  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  },
  {
    name: 'html2canvas.min.js',
    url:  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  },
  {
    name: 'chart.js',
    url:  'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js',
  },
  {
    name: 'msal-browser.min.js',
    url:  'https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    function request(u) {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    }
    request(url);
  });
}

function download(url, dest) {
  return new Promise(async (resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  ✓ ${path.basename(dest)} (already exists, skipping)`);
      return resolve();
    }
    console.log(`  ↓ ${path.basename(dest)}...`);
    try {
      const buf = await get(url);
      fs.writeFileSync(dest, buf);
      console.log(`    → ${(buf.length / 1024).toFixed(0)} KB`);
      resolve();
    } catch (err) { reject(err); }
  });
}

// ── Font downloader ───────────────────────────────────────────────────────────
// Fetches Google Fonts CSS (with Chrome UA to get woff2), parses @font-face
// blocks, downloads each woff2 file, rewrites CSS to use local paths.

async function downloadFonts() {
  // Full set: DM Sans (ital+normal, 300-700) + DM Mono (400,500)
  const googleUrl =
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=DM+Mono:wght@400;500&display=swap';

  const cssFile = path.join(LIBS_DIR, 'fonts.css');

  console.log('\n  Fetching Google Fonts CSS...');
  let css;
  try {
    css = (await get(googleUrl)).toString('utf8');
  } catch (err) {
    console.warn(`  ⚠ Could not fetch Google Fonts CSS: ${err.message}`);
    console.warn('    Fonts will load from Google CDN when online.\n');
    return false;
  }

  // Extract all woff2 URLs from the CSS
  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/g;
  const urls = [];
  let m;
  while ((m = urlRegex.exec(css)) !== null) {
    urls.push(m[1]);
  }

  console.log(`  Found ${urls.length} font files. Downloading...`);

  // Download each woff2 and rewrite URL in CSS
  let localCss = css;
  for (const url of urls) {
    // Build a safe filename from the URL path
    const segments = new URL(url).pathname.split('/');
    const filename  = segments[segments.length - 1]; // e.g. abc123.woff2
    const dest      = path.join(FONTS_DIR, filename);

    await download(url, dest);

    // Replace the remote URL with a local relative path
    localCss = localCss.replace(url, `fonts/${filename}`);
  }

  // Remove the /* latin */ style comments Google adds (keep the CSS clean)
  localCss = localCss.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '').trim();

  fs.writeFileSync(cssFile, localCss, 'utf8');
  console.log(`  ✓ libs/fonts.css written (${urls.length} woff2 files in libs/fonts/)`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n── JS Libraries ─────────────────────────────────────────\n');
  for (const lib of LIBS) {
    await download(lib.url, path.join(LIBS_DIR, lib.name));
  }

  console.log('\n── Fonts (DM Sans + DM Mono) ────────────────────────────');
  await downloadFonts();

  console.log('\nAll done. PYL0N suite is now fully offline.\n');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
