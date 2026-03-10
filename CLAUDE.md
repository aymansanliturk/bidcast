# CLAUDE.md — forecast.bid

This file documents the codebase structure, conventions, and workflows for AI assistants working on this project.

## Project Overview

**forecast.bid** is a self-contained, zero-installation web application suite for bid and project teams. It runs entirely in the browser — no server, no build step, no backend. The suite consists of six specialized planning tools plus a landing page.

## Tools in the Suite

| File | Tool Name | Purpose |
|------|-----------|---------|
| `index.html` | Landing page | Navigation hub with cards linking to all tools |
| `timecast.html` | TimeCast | Multi-project Gantt timeline with baseline tracking |
| `resourcecast.html` | ResourceCast | Team resource allocation, FTE calculations, cost planning |
| `orgcast.html` | OrgCast | Organization chart generator with SVG connectors |
| `rfqcast.html` | RFQCast | Supplier RFQ tracking dashboard |
| `dorcast.html` | DORCast | RACI/DOR responsibility matrix builder |
| `favicon.svg` | — | Brand favicon |
| `logo.svg` | — | Brand logo (34×34px grid) |

## Architecture

### No Build System

This project has no `package.json`, no npm, no bundler, no TypeScript. Every file is a standalone HTML page that runs directly in a browser. Do not introduce build tools unless explicitly requested.

### Monolithic HTML Files

Each tool lives entirely within a single `.html` file:
- `<style>` blocks contain all CSS (no external stylesheets)
- `<script>` blocks contain all JavaScript (no external JS files)
- HTML markup, styles, and logic are co-located per tool

### External Dependencies (CDN only)

No local node_modules. Libraries are loaded from CDN:
- **XLSX** `v0.18.5` or `v0.20.3` — Excel import/export via `cdnjs.cloudflare.com`
- **html2pdf.js** `v0.10.1` — PDF generation via `cdnjs.cloudflare.com`
- **Google Fonts** — DM Sans, DM Mono typefaces

### Client-Side Storage

All data persists in the browser via `localStorage`:
- `bidcast_logo` — company logo (base64-encoded data URL, shared across suite)
- `bidcast_suite_sync` — shared state object used for cross-tool sync

No cookies, no IndexedDB, no server storage.

## Code Conventions

### File Structure Per Tool

Each tool HTML file follows this layout:
1. `<!DOCTYPE html>` + `<head>` with CDN links and Google Fonts
2. `<style>` block with all CSS
3. `<body>` containing:
   - `#toolbar` — top action bar (save/load/export buttons)
   - `#editor` — interactive input section (screen-only)
   - `#output` — print-optimized rendered output
4. `<script>` block with all JavaScript

### Naming Conventions

- **HTML IDs**: kebab-case (e.g., `#proj-name`, `#chart-title`, `#suite-sync-badge`)
- **CSS classes**: kebab-case (e.g., `.phase-chip`, `.btn-add`, `.drag-handle`)
- **JavaScript functions**: camelCase (e.g., `saveLogo()`, `addPerson()`, `exportPDF()`)
- **Data attributes**: `data-fmt`, `data-idx` (used for drag-and-drop)
- **localStorage keys**: prefixed with `bidcast_`

### CSS Custom Properties

Colors and spacing are defined as CSS variables in the `:root` selector:
```css
:root {
  --bg: #f5f4f0;
  --surface: #ffffff;
  --border: #e0ddd6;
  --text: #1a1916;
  --accent: #2c4e87;
  --green: #107c41;
}
```
Always use these variables for colors — do not hardcode hex values outside of the `:root` block.

### State Management Pattern

Each tool uses a consistent `collectState()` / `applyState()` pattern:
- `collectState()` — reads all form inputs and returns a plain JSON object
- `applyState(state)` — populates all form inputs from a JSON object
- `saveJSON()` — calls `collectState()`, writes to localStorage and triggers file download
- `loadJSON()` — parses uploaded `.json` file and calls `applyState()`
- `exportHTML()` — creates a fully self-contained HTML snapshot with state embedded as base64

### Undo/Redo System

Each tool maintains an in-memory history stack:
- `_snapshot()` — takes an immediate state snapshot
- `_scheduleSnap()` — debounced snapshot (for text inputs)
- `undo()` — restores previous state
- `redo()` — replays next state

### Drag and Drop

Row reordering uses the native HTML5 drag API:
- `.drag-handle` — the grip element on each row
- `.dragging` — applied to the row being dragged
- `.drag-over` — applied to the drop target row
- Data attribute `data-idx` carries the source row index

### Suite Sync

Timecast → ResourceCast → OrgCast share data automatically:
- Timecast phases sync to ResourceCast phase columns
- ResourceCast roles sync to OrgCast team member list
- Sync state is serialized to `localStorage['bidcast_suite_sync']`
- A `#suite-sync-badge` element indicates sync availability

## Export Formats

| Format | Library | Function |
|--------|---------|----------|
| PDF | html2pdf.js | `exportPDF()` |
| Excel (.xlsx) | XLSX | `exportExcel()` or `exportXLSX()` |
| JSON (data backup) | Built-in | `saveJSON()` |
| Standalone HTML | Built-in | `exportHTML()` |

All exported files include a footer watermark: `"Generated with [TOOL] · [tagline]"`

Print layouts target **A4 portrait** or **A3 landscape** depending on the tool.

## Data Types and Enums

### Task/Row Types (Timecast, ResourceCast)
- `TASK` — standard work item
- `MILESTONE` — zero-duration point in time
- `LABOUR` — human resource cost line
- `EXPENSE` — non-labour cost line

### RFQ Status (RFQCast)
- `none` — not started
- `enquiry` — sent to supplier
- `waiting` — awaiting response
- `received` — quote received
- `expired` — validity date passed
- `binding` — binding quote accepted

### Responsibility Codes (DORCast)
- `D` — Decision maker
- `O` — Owner / accountable
- `R` — Responsible / doing the work
- `S` — Support / contributor
- `I` — Informed

## Development Workflow

### Running Locally

No installation required. Open any `.html` file directly in a browser:
```
open timecast.html
# or
python3 -m http.server 8080  # then visit http://localhost:8080
```

### Making Changes

1. Edit the relevant `.html` file directly
2. Reload the browser to test
3. All CSS and JS is inline — no compilation step
4. Test export formats (PDF, Excel, JSON, HTML) after logic changes

### Git Workflow

- Main branch: `master`
- Feature branches follow the convention: `claude/<description>-<id>`
- Commit messages use conventional commits format: `feat(tool):`, `fix(tool):`, `refactor:`, etc.
- Commits are signed with SSH key (`/home/claude/.ssh/commit_signing_key.pub`)

### What NOT to Do

- Do not introduce a build system (webpack, vite, esbuild) unless explicitly requested
- Do not add TypeScript — the project is intentionally vanilla JS
- Do not create separate `.css` or `.js` files — keep styles and scripts inline in each HTML file
- Do not add a backend or server component unless explicitly requested
- Do not use `npm install` or create `package.json`
- Do not add testing frameworks without explicit request
- Do not use `localStorage` keys outside the `bidcast_` prefix namespace

## Tool-Specific Notes

### TimeCast (`timecast.html`)
- Tracks project phases as column headers on the Gantt
- Supports baseline vs. current schedule comparison
- Phase data is the primary sync source for ResourceCast

### ResourceCast (`resourcecast.html`)
- Monthly hours grid — rows are roles, columns are months
- FTE calculation: `monthly hours / available hours per month`
- Cost: `hours × rate × hedge multiplier`
- Supports multi-currency rates with a hedge rate factor
- Has a full Resource Gantt chart in addition to the grid
- Excel import maps column headers to role names

### OrgCast (`orgcast.html`)
- Renders SVG connector lines between org chart nodes
- Supports vacancy placeholders
- Exports at A4 and A3 print formats

### RFQCast (`rfqcast.html`)
- Validity expiration is computed dynamically from `Date.now()`
- Equipment types are user-configurable categories for suppliers

### DORCast (`dorcast.html`)
- Has a preset modal to load standard responsibility templates
- Supports multiple parties (columns) with free-form naming
