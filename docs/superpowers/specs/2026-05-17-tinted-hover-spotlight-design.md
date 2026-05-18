# Tinted Hover Spotlight — Design

**Date:** 2026-05-17
**Scope:** Add a subtle, color-locked cursor spotlight to the major boxes in the org-chart presentation. Inspired by the `spotlight-card` / `GlowCard` component, but dialed down significantly and color-locked to each box's existing brand accent (no hue shifting).

## Problem

The reference `GlowCard` component is too bright for an executive presentation. It also rotates hue based on cursor position, which conflicts with the meaning the existing box colors carry (DPM teal, WOM pink, specialist colors). We want the *idea* of the effect — a soft tinted light that follows the cursor — without the loud delivery and without overriding brand colors.

## Approach

A small custom hook, `useSpotlight(accentColor)`, encapsulates per-card cursor tracking and exposes a render-friendly API. The hook does **not** listen globally — only when the cursor is over the card. The spotlight overlay is a single absolutely-positioned `<div>` rendered inside the card, above the background but below the content, with `pointer-events: none`.

### Hook API

```js
const { ref, handlers, overlayStyle } = useSpotlight(accentColor);
```

- `ref` — attached to the outer card element
- `handlers` — `{ onMouseMove, onMouseEnter, onMouseLeave }` spread onto the card
- `overlayStyle` — inline style for the overlay div (radial gradient + opacity transition)

Internally the hook updates CSS custom properties `--mx`, `--my` (pixel offsets) and `--spot-opacity` on the card element. The overlay reads those vars via `background-image: radial-gradient(...)` and `opacity`.

### Intensity targets

| Param | Value | Notes |
| --- | --- | --- |
| Spot radius | 180px | Smaller than demo's 200 |
| Background spot opacity (hover) | 0.10 | Demo uses 0.10 already but compounds with border + halo |
| Background spot opacity (rest) | 0 | Gated by hover state |
| Enter transition | 250ms ease-out | Fade-in on `mouseenter` |
| Leave transition | 400ms ease-out | Slower fade-out so it doesn't blink |
| Border ring | none | Removed (demo's `::before` with `brightness(2)`) |
| Inner white halo | none | Removed (demo's `::after`) |
| Hue shifting | none | Color comes from accent prop |
| Static glow underneath | unchanged | `SHADOWS.glowDpm`/`glowWom` stay |

### Color sourcing

The hook receives the same accent value already used by the box's border (e.g., `D.dpm`, `D.wom`, `OWNER.cps.color`). The radial gradient uses that color directly at the tuned opacity — no transformation.

## Scope

**Apply to (major boxes):**
- **Org Chart tab:** COO box, DPD (Caela), WOD (Ingrid), CPS (Sylvi), DDS (Shayna), Launch team box
- **Vision tab:** Today column, Proposed column, Outcomes strip, ↓ Operational cost card, ↑ Top-line revenue card

**Skip:**
- **Project Timelines tab** — cards are de-boxed/minimal; adding glow would re-clutter
- All chips, role-key badges, small inline labels
- Tab buttons, section headers, connector lines

## File changes

Single file: `creative_team_structure.jsx`
- Add `useSpotlight` hook near the top with other helpers
- Modify `FocusBox` (DPD/WOD), `MoreBox` (CPS/DDS), the COO box, the Launch box, and `VisionColumn` to use the hook
- Add overlay layer to outcomes strip and the two bottom-line cards inline

No new files, no new dependencies.

## Out of scope

- Touch/mobile interaction (presentation runs on a laptop)
- Reduced-motion media query (current presentation already uses motion; add later if needed)
- Per-tab opt-in (Timelines is excluded by design choice, not toggle)

## Iteration plan

User has signaled they want to tune intensity live in the browser after seeing it. The intensity targets above are a starting point; we expect to adjust opacity / radius / timing once it's rendering.
