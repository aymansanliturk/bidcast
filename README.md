# PYL0N

Self-contained, zero-installation bid & project planning suite. Runs entirely
in the browser — no server, no build step, no backend. Ships as 12 monolithic
HTML tools plus a landing page, and can also be packaged as a macOS desktop
app via Electron.

## Tools

| File | Tool | Purpose |
|------|------|---------|
| `index.html` | Landing page | Navigation hub + suite-wide import/export |
| `timecast.html` | TimeCast | Multi-project Gantt timeline with baselines and month/week/quarter scales |
| `resourcecast.html` | ResourceCast | Team allocation, FTE calc, monthly cost grid |
| `orgcast.html` | OrgCast | Organization chart generator with SVG connectors |
| `rfqcast.html` | RFQCast | Supplier RFQ tracking dashboard |
| `dorcast.html` | DORCast | RACI/DOR responsibility matrix builder |
| `riskcast.html` | RiskCast | Risk & opportunity register with 5×5 matrix |
| `calccast.html` | CalcCast | Cost breakdown calculator; receives quotes from RFQCast |
| `lettercast.html` | LetterCast | Commercial cover letter / offer document generator |
| `cashflow.html` | CashFlow | Monthly cash-flow simulation with cancellation curve |
| `w2w-report.html` | W2W Report | Wall-to-Wall financial report (factory KPI breakdown) |
| `cvcast.html` | CVCast | CV / résumé generator with A4 PDF export |

## Run it

Open any `.html` file directly in a browser — no install, no build:

```bash
open index.html
# or serve the whole suite over localhost:
python3 -m http.server 8080   # visit http://localhost:8080
```

All libraries (XLSX, html2pdf, html2canvas, Chart.js) and fonts (DM Sans,
DM Mono) are bundled in `libs/`. After cloning, populate it once:

```bash
node scripts/download-libs.js
```

## Electron desktop app

```bash
npm install
npm start              # opens the app with DevTools available
npm run build:mac      # produces dist/PYL0N-1.0.0.dmg
```

Build guide: [`BUILD.md`](BUILD.md).
AI-assistant reference: [`CLAUDE.md`](CLAUDE.md).

## Storage

All data persists in the browser via `localStorage` under the `bidcast_`
prefix. No cookies, no IndexedDB, no server storage.
