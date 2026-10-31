# Accessibility and contrast

## Measured contrast (WCAG 2.2 AA needs 4.5:1 for body text, 3:1 for large text)

Static computation from the CSS colours; it is **not** a substitute for an automated browser audit.

| Pair | Ratio | Status |
|------|-------|--------|
| dark theme: `text-slate-500` on page / card (before) | 4.24 / 3.78 | fails → remapped to `#8a9ab3` (≥ 5.4) |
| dark theme: `text-slate-600` (before) | 2.66 / 2.37 | fails → remapped to `#8190a8` (≥ 5.4) |
| light theme: placeholder `#78869a` (before) | 3.5 | fails → `#64748b` (≥ 4.5) |
| light theme body/secondary text overrides (`#334155`, `#475569`, `#64748b`) | 4.5–10 | pass |
| light theme accent text (`#6d28d9`, `#0e7490`, `#4338ca`, `#047857`) | 5.4–8 | pass |

Known remaining item: white text on `cyan-600` buttons measures 3.7:1 (fine for large/bold labels only). Not changed.

## Keyboard and screen readers

- All modals carry `role="dialog"`, `aria-modal`, close on **Escape** (`useEscapeKey`), move focus inside on open, trap
  Tab/Shift+Tab and restore focus to the opener on close (`useModalFocus`).
- The note modal close button has a translated accessible name.
- Visible `:focus-visible` outlines are defined for both themes in `src/index.css`; `prefers-reduced-motion` is honoured.

## Not verified in this environment

Screen-reader testing, real-browser contrast scans (axe/Lighthouse), text-zoom and 320 px layout checks. Run
`npm run test:visual` (Playwright) and an axe or Lighthouse pass after installing dependencies.
