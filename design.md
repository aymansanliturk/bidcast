---
description: "Design system and architectural guidelines for the PYL0N Suite."
schema_version: "1.0"
colors:
  bg_light: "#f5f4f0"
  surface_light: "#ffffff"
  border_light: "#e0ddd6"
  text_light: "#1a1916"
  muted_light: "#6b6860"
  faint_light: "#a8a49e"
  bg_dark: "#1a1917"
  surface_dark: "#242320"
  border_dark: "#3a3835"
  text_dark: "#e8e6e1"
  muted_dark: "#9b9891"
  faint_dark: "#6b6860"
  accent: "#2c4e87"
  accent_hover: "#1e3a6b"
  success: "#107c41"
  danger: "#c0392b"
  warning: "#b45309"
typography:
  primary: "'DM Sans', sans-serif"
  monospace: "'DM Mono', monospace"
---

# PYL0N Suite Design System & Architecture

## 1. Architectural Philosophy (Zero-Build)
- **NO BUILD TOOLS:** Do not use Webpack, Babel, npm build scripts, React, or Vue.
- **Vanilla Everything:** Use pure HTML5, CSS3 (with CSS Variables), and ES6+ JavaScript.
- **Monolithic Tools:** Each tool (e.g., `timecast.html`, `calccast.html`) is a standalone file containing its own HTML structure and specific UI logic.
- **Shared Vendor Logic:** Core functionalities (Native OS bridges, State Management, Cloud Sync) are extracted to the `vendor/` directory (`pyl0n-native.js`, `pyl0n-suite.js`, `pyl0n-state.js`).
- **Offline First:** State is always persisted to `localStorage` synchronously.

## 2. Layout & Structure
- **Unified Toolbar:** Every tool MUST have the standard `#toolbar` at the top.
  - Contains `.tb-left` (Logo, Tool Name, Back to Dashboard) and `.tb-right` (Controls, Formats, Theme Toggle, Save/Export).
  - Use `div.tb-sep` to separate logical groups of buttons. NEVER use `<hr>`.
- **Editor vs. Output:** Tools generally have an `#editor` div (data entry) and an `#output` div (printable/exportable report). They are toggled via JS (`display: none`).
- **Sections:** Group form inputs and tables inside `<div class="section">`. Sections have a 12px border radius, a surface background, and a 1px border.

## 3. Typography & Styling
- **Fonts:** Always use `DM Sans` for UI text and `DM Mono` for metadata, timestamps, or hex codes.
- **CSS Variables:** ALWAYS use the defined CSS variables (`var(--accent)`, `var(--bg)`, etc.) for colors. NEVER hardcode hex values in component styles, as this breaks Dark Mode.
- **Dark Mode:** Dark mode is handled via `[data-theme="dark"]` attribute on the `<html>` tag. Ensure all new UI elements inherit variables so they invert automatically.

## 4. Components
- **Buttons (`.tb-btn`):**
  - Default: Bordered, transparent background, muted text.
  - Primary Action: Add `.primary` or `.active` class (Accent background, white text).
  - Success Action: Add `.green` class (Green background, white text).
  - Destructive Action: Use plain buttons with a red hover state, or a specific `.btn-del` class.
- **Inputs:** - Text inputs and selects must have an 8px border radius, a specific background (`var(--input-bg)`), and an accent border on `:focus`.

## 5. Coding Conventions
- **DO:** Use `document.getElementById` and `document.querySelector`.
- **DO:** Wrap generic logical blocks in IIFEs to prevent global scope pollution, unless the function needs to be triggered by an inline HTML `onclick`.
- **DON'T:** Do not use inline styles (`style="..."`) unless calculating dynamic positions (e.g., absolute coordinates in OrgCast or Gantt charts). Use CSS classes instead.
- **DON'T:** Do not alter the `vendor/` files without explicit instruction, as they break the entire suite if malformed.