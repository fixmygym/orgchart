import { useState, memo, Fragment, useRef } from "react";
import IsoWaveGrid from "./src/IsoWaveGrid.jsx";

/* ─── DESIGN TOKENS ─────────────────────────────
   OKLCH palette. Neutrals tinted toward a cool 265° hue.
   Brand colors refined off the original teal/rose toward
   a director-level (less candy, more considered) read.
─────────────────────────────────────────────── */
const D = {
  dpm:       "oklch(0.72 0.105 195)",
  dpmLight:  "oklch(0.72 0.105 195 / 0.10)",
  dpmBorder: "oklch(0.72 0.105 195 / 0.32)",
  dpmGlow:   "oklch(0.72 0.105 195 / 0.18)",
  wom:       "oklch(0.62 0.155 5)",
  womLight:  "oklch(0.62 0.155 5 / 0.10)",
  womBorder: "oklch(0.62 0.155 5 / 0.32)",
  womGlow:   "oklch(0.62 0.155 5 / 0.16)",
  bg:        "oklch(0.135 0.012 270)",
  surface:   "oklch(0.180 0.014 268)",
  surface2:  "oklch(0.215 0.016 266)",
  border:    "oklch(0.275 0.018 264)",
  line:      "oklch(0.330 0.020 264)",
  text:      "oklch(0.955 0.006 95)",
  muted:     "oklch(0.730 0.018 262)",
  subtle:    "oklch(0.640 0.018 262)",
  hairline:  "oklch(1 0 0 / 0.04)",
};

/* ─── ELEVATION ─────────────────────────────── */
const SHADOWS = {
  flat:    "0 0 0 1px oklch(1 0 0 / 0.02), 0 1px 2px oklch(0 0 0 / 0.4)",
  card:    "0 0 0 1px oklch(1 0 0 / 0.02), 0 4px 16px oklch(0 0 0 / 0.4)",
  raised:  "0 0 0 1px oklch(1 0 0 / 0.02), 0 8px 32px oklch(0 0 0 / 0.55)",
  glowDpm: `0 0 0 1px oklch(1 0 0 / 0.02), 0 8px 32px oklch(0 0 0 / 0.55), 0 0 56px ${D.dpmGlow}`,
  glowWom: `0 0 0 1px oklch(1 0 0 / 0.02), 0 8px 32px oklch(0 0 0 / 0.55), 0 0 56px ${D.womGlow}`,
};

/* ─── GEOMETRY (CSS variables — set per breakpoint in GLOBAL_CSS) ──
   Default base values: NODE_W=340, SPACER=48, TREE_W=728, L_OFF=R_OFF=170, CTR_X=364.
   All values are strings referencing CSS custom properties so the org-chart
   geometry can fluidly scale via media queries instead of fixed px.
─────────────────────────────────────────────── */
const NODE_W = "var(--cts-node-w, 340px)";
const SPACER = "var(--cts-spacer, 48px)";
const TREE_W = "var(--cts-tree-w, 728px)";
const L_OFF  = "var(--cts-l-off, 170px)";
const R_OFF  = "var(--cts-r-off, 170px)";
const CTR_X  = "var(--cts-ctr-x, 364px)";
const HALF_PX = "0.5px";
const px = (v, delta) => `calc(${v} - ${delta}px)`;

/* ─── TYPE SYSTEM (single-family Manrope) ──── */
const TYPE = {
  display:  { fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 },
  heading:  { fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.05 },
  title:    { fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: "-0.02em",  lineHeight: 1.25 },
  body:     { fontFamily: "'Manrope', sans-serif", fontWeight: 400, letterSpacing: "-0.005em", lineHeight: 1.55 },
  step:     { fontFamily: "'Manrope', sans-serif", fontWeight: 500, letterSpacing: "-0.005em", lineHeight: 1.45 },
  eyebrow:  { fontFamily: "'Manrope', sans-serif", fontWeight: 700, letterSpacing: "0.18em",   textTransform: "uppercase" },
  label:    { fontFamily: "'Manrope', sans-serif", fontWeight: 700, letterSpacing: "0.14em",   textTransform: "uppercase" },
  chip:     { fontFamily: "'Manrope', sans-serif", fontWeight: 600, letterSpacing: "0.03em" },
};

/* ─── TINTED HOVER SPOTLIGHT ────────────────── */
function useSpotlight(accent, options = {}) {
  const {
    haloRadius   = 180,   // soft outer halo
    coreRadius   = 90,    // sharper inner peak (tracks cursor visibly)
    borderRadius = 140,   // border-ring gradient radius
    haloIntensity   = 0.07,
    coreIntensity   = 0.16,
    borderIntensity = 0.60,
    borderWidth     = 2,  // thickness of the glowing inner ring (px)
    fadeIn  = 220,
    fadeOut = 380,
  } = options;
  const ref = useRef(null);

  const setPos = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const handlers = {
    onMouseEnter: (e) => {
      const el = ref.current;
      if (!el) return;
      setPos(e);
      el.style.setProperty("--spot-transition", `opacity ${fadeIn}ms ease-out`);
      el.style.setProperty("--spot-opacity", "1");
    },
    onMouseMove: setPos,
    onMouseLeave: () => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--spot-transition", `opacity ${fadeOut}ms ease-out`);
      el.style.setProperty("--spot-opacity", "0");
    },
  };

  const pct = (n) => Math.round(n * 100);
  const cm = (n) => `color-mix(in oklch, ${accent} ${pct(n)}%, transparent)`;

  const bgGradient =
    `radial-gradient(${coreRadius}px ${coreRadius}px at var(--mx, -200px) var(--my, -200px), ${cm(coreIntensity)} 0%, transparent 60%),` +
    `radial-gradient(${haloRadius}px ${haloRadius}px at var(--mx, -200px) var(--my, -200px), ${cm(haloIntensity)} 0%, transparent 75%)`;

  const borderGradient =
    `radial-gradient(${borderRadius}px ${borderRadius}px at var(--mx, -200px) var(--my, -200px), ${cm(borderIntensity)} 0%, transparent 75%)`;

  const ringMask =
    "linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0) border-box";

  const overlay = (
    <Fragment>
      {/* Soft tinted glow behind content (sharpened center for cursor tracking) */}
      <div aria-hidden style={{
        position: "absolute",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        borderRadius: "inherit",
        opacity: "var(--spot-opacity, 0)",
        transition: "var(--spot-transition, opacity 400ms ease-out)",
        backgroundImage: bgGradient,
      }} />
      {/* Border glow ring — masked to a thin ring along the inner edge */}
      <div aria-hidden style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        border: `${borderWidth}px solid transparent`,
        opacity: "var(--spot-opacity, 0)",
        transition: "var(--spot-transition, opacity 400ms ease-out)",
        backgroundImage: borderGradient,
        WebkitMask: ringMask,
        WebkitMaskComposite: "xor",
        mask: ringMask,
        maskComposite: "exclude",
      }} />
    </Fragment>
  );

  return { ref, handlers, overlay };
}

const spotlightRootStyle = { position: "relative", isolation: "isolate" };

/* ─── PRIMITIVES ────────────────────────────── */
function Label({ children, style }) {
  return (
    <span style={{
      ...TYPE.label,
      fontSize: 11,
      color: D.muted,
      ...style,
    }}>{children}</span>
  );
}

function Chip({ color, bg, border, children }) {
  return (
    <span style={{
      ...TYPE.chip,
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 4,
      fontSize: 11,
      lineHeight: 1.5,
      background: bg || D.hairline,
      color: color || D.muted,
      border: `1px solid ${border || D.border}`,
      flexShrink: 0,
      fontVariantNumeric: "tabular-nums",
    }}>{children}</span>
  );
}

/* ─── ORG NODES ─────────────────────────────── */
const nodeBase = {
  width: NODE_W,
  background: D.surface,
  borderRadius: 12,
  overflow: "hidden",
  flexShrink: 0,
};

function NodeBullet({ children, marker, accent }) {
  return (
    <li style={{
      ...TYPE.body,
      fontSize: 13,
      color: D.text,
      display: "flex",
      gap: 10,
    }}>
      <span style={{ color: accent || D.subtle, opacity: accent ? 0.55 : 1, flexShrink: 0, marginTop: 1 }} aria-hidden>{marker || "·"}</span>
      <span>{children}</span>
    </li>
  );
}

const LeaderNode = memo(function LeaderNode({ tag, sub, title, name, color, colorLight, colorBorder, responsibilities, focus }) {
  const spot = useSpotlight(color);
  return (
    <div id={sub} ref={spot.ref} {...spot.handlers} style={{
      ...nodeBase,
      ...spotlightRootStyle,
      border: `1px solid ${colorBorder}`,
      boxShadow: color === D.dpm ? SHADOWS.glowDpm : SHADOWS.glowWom,
      scrollMarginTop: 32,
    }}>
      {spot.overlay}
      <div style={{ height: 3, background: color }} />
      <div style={{ padding: "22px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
          <Label style={{ color, opacity: 0.85 }}>{tag}</Label>
          {sub && <span style={{ ...TYPE.eyebrow, fontSize: 9, color: D.subtle }}>{sub}</span>}
        </div>
        <h2 style={{ ...TYPE.title, fontSize: "clamp(15px, 1.35vw, 20px)", color, margin: 0, marginBottom: name ? 6 : 20 }}>{title}</h2>
        {name && <div style={{ ...TYPE.body, fontSize: 13, fontWeight: 500, color: D.muted, marginBottom: 20 }}>{name}</div>}

        <Label style={{ display: "block", marginBottom: 11 }}>Responsibilities</Label>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {responsibilities.map((r, i) => <NodeBullet key={i} accent={color}>{r}</NodeBullet>)}
        </ul>

        <div style={{ height: 1, background: colorBorder, opacity: 0.5, marginBottom: 15 }} />
        <Label style={{ display: "block", marginBottom: 10 }}>Focus</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {focus.map((b, i) => <Chip key={i} color={b.color} bg={b.bg} border={b.border}>{b.text}</Chip>)}
        </div>
      </div>
    </div>
  );
});

const SpecialistNode = memo(function SpecialistNode({ tag, sub, title, name, responsibilities, reporting, accent }) {
  const spot = useSpotlight(accent || D.text);
  return (
    <div id={sub} ref={spot.ref} {...spot.handlers} style={{
      ...nodeBase,
      ...spotlightRootStyle,
      border: `1px solid ${D.border}`,
      boxShadow: SHADOWS.raised,
      scrollMarginTop: 32,
    }}>
      {spot.overlay}
      <div style={{ padding: "22px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
          <Label>{tag}</Label>
          {sub && <span style={{ ...TYPE.eyebrow, fontSize: 9, color: D.subtle }}>{sub}</span>}
        </div>
        <h3 style={{ ...TYPE.title, fontSize: "clamp(14px, 1.28vw, 19px)", color: D.text, margin: 0, marginBottom: name ? 6 : 20 }}>{title}</h3>
        {name && <div style={{ ...TYPE.body, fontSize: 13, fontWeight: 500, color: D.muted, marginBottom: 20 }}>{name}</div>}

        <Label style={{ display: "block", marginBottom: 11 }}>Responsibilities</Label>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {responsibilities.map((r, i) => <NodeBullet key={i}>{r}</NodeBullet>)}
        </ul>

        <div style={{ height: 1, background: D.border, opacity: 0.7, marginBottom: 15 }} />
        <Label style={{ display: "block", marginBottom: 10 }}>Reports to</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {reporting.map((b, i) => <Chip key={i} color={b.color} bg={b.bg} border={b.border}>{b.text}</Chip>)}
        </div>
      </div>
    </div>
  );
});

/* ─── CONNECTORS ────────────────────────────── */
function line(top, left, right, width, height, color) {
  // When both left and right are set without explicit width, let CSS stretch between them.
  const hasStretch = left !== undefined && right !== undefined && width === undefined;
  return (
    <div style={{
      position: "absolute",
      top,
      ...(left  !== undefined ? { left }  : {}),
      ...(right !== undefined ? { right } : {}),
      ...(hasStretch ? {} : { width: width || 1 }),
      height: height || 1,
      background: color || D.line,
    }} />
  );
}

function ForkConnector() {
  return (
    <div style={{ position: "relative", width: TREE_W, maxWidth: "100%", height: 68, alignSelf: "center", flexShrink: 0 }}>
      {line(0, px(CTR_X, 0.5), undefined, 1, 24)}
      {line(24, L_OFF, R_OFF, undefined, 1)}
      <div style={{
        ...TYPE.eyebrow,
        position: "absolute",
        top: 24,
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: D.surface,
        border: `1px solid ${D.border}`,
        borderRadius: 4,
        padding: "4px 11px",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        color: D.muted,
        zIndex: 1,
        whiteSpace: "nowrap",
      }}>Co-equal</div>
      {line(24, px(L_OFF, 0.5), undefined, 1, 44)}
      {line(24, undefined, px(R_OFF, 0.5), 1, 44)}
    </div>
  );
}

function DoubleVertical({ height }) {
  return (
    <div style={{ position: "relative", width: TREE_W, maxWidth: "100%", height, alignSelf: "center", flexShrink: 0 }}>
      {line(0, px(L_OFF, 0.5), undefined, 1, height)}
      {line(0, undefined, px(R_OFF, 0.5), 1, height)}
    </div>
  );
}

function MergeConnector() {
  return (
    <div style={{ position: "relative", width: TREE_W, maxWidth: "100%", height: 60, alignSelf: "center", flexShrink: 0 }}>
      {line(0,  px(L_OFF, 0.5), undefined, 1, 26)}
      {line(0,  undefined, px(R_OFF, 0.5), 1, 26)}
      {line(26, L_OFF, R_OFF, undefined, 1)}
      {line(26, px(CTR_X, 0.5), undefined, 1, 34)}
    </div>
  );
}

/* ─── OWNER PALETTE (for timeline + RoleKey) ─── */
const OWNER = {
  dpm:    { color: D.dpm,                          bg: D.dpmLight,                          border: D.dpmBorder },
  wom:    { color: D.wom,                          bg: D.womLight,                          border: D.womBorder },
  dds:    { color: D.wom,                          bg: D.womLight,                          border: D.womBorder },
  cps:    { color: "oklch(0.78 0.025 270)",        bg: "oklch(0.78 0.025 270 / 0.08)",      border: "oklch(0.78 0.025 270 / 0.22)" },
  am:     { color: "oklch(0.78 0.115 75)",         bg: "oklch(0.78 0.115 75 / 0.10)",       border: "oklch(0.78 0.115 75 / 0.24)" },
  seo:    { color: "oklch(0.72 0.105 290)",        bg: "oklch(0.72 0.105 290 / 0.10)",      border: "oklch(0.72 0.105 290 / 0.24)" },
  launch: { color: D.muted,                        bg: D.hairline,                          border: D.border },
  client: { color: D.muted,                        bg: D.hairline,                          border: D.border },
};

/* ─── ORG CHART ─────────────────────────────── */
const ROLE_KEY = [
  { code: "DPD",     name: "Digital Production Director",   color: D.dpm,           bg: D.dpmLight,    border: D.dpmBorder },
  { code: "WOD",     name: "Web Operations Director",       color: D.wom,           bg: D.womLight,    border: D.womBorder },
  { code: "DDS",     name: "Digital Design Specialist",     color: D.wom,           bg: D.womLight,    border: D.womBorder },
  { code: "CPS",     name: "Content Production Specialist", color: OWNER.cps.color, bg: OWNER.cps.bg,  border: OWNER.cps.border },
  { code: "Launch",  name: "Mason & Kasey",                 color: D.muted,         bg: D.hairline,    border: D.border },
];

const ROLE_KEY_TIMELINES = [
  ...ROLE_KEY.slice(0, 4),
  { code: "Acct Mgr", name: "Account Manager", color: OWNER.am.color,  bg: OWNER.am.bg,  border: OWNER.am.border },
  { code: "SEO",      name: "SEO Specialist",  color: OWNER.seo.color, bg: OWNER.seo.bg, border: OWNER.seo.border },
  ROLE_KEY[4],
];

function RoleKey({ roles = ROLE_KEY }) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "center",
      marginTop: 22,
      maxWidth: 720,
      marginLeft: "auto",
      marginRight: "auto",
    }} aria-label="Role abbreviations">
      {roles.map(r => (
        <a key={r.code} href={`#${r.code}`} className="role-link" style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 7,
          padding: "6px 11px",
          borderRadius: 6,
          background: r.bg,
          border: `1px solid ${r.border}`,
          fontVariantNumeric: "tabular-nums",
          cursor: "pointer",
        }}>
          <span style={{ ...TYPE.eyebrow, fontSize: 9.5, color: r.color }}>{r.code}</span>
          <span style={{ ...TYPE.body, fontSize: 11, color: D.muted }}>{r.name}</span>
        </a>
      ))}
    </div>
  );
}

function MapLegend({ roles = ROLE_KEY_TIMELINES }) {
  return (
    <div style={{
      display: "inline-block",
      textAlign: "left",
      padding: "9px 12px 10px",
      background: D.surface,
      border: `1px solid ${D.border}`,
      borderRadius: 5,
      boxShadow: SHADOWS.card,
      fontVariantNumeric: "tabular-nums",
    }} aria-label="Legend">
      <div style={{
        ...TYPE.eyebrow,
        fontSize: 8.5,
        letterSpacing: "0.22em",
        color: D.muted,
        marginBottom: 7,
        paddingBottom: 6,
        borderBottom: `1px solid ${D.border}`,
      }}>Legend</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        columnGap: 12,
        rowGap: 4,
        alignItems: "center",
      }}>
        {roles.map(r => (
          <Fragment key={r.code}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{
                display: "inline-block",
                width: 9,
                height: 9,
                background: r.color,
                border: `1px solid ${r.border}`,
                borderRadius: 2,
                flexShrink: 0,
              }} />
              <span style={{ ...TYPE.eyebrow, fontSize: 8.5, color: r.color, letterSpacing: "0.12em" }}>{r.code}</span>
            </div>
            <span style={{ ...TYPE.body, fontSize: 10, color: D.muted }}>{r.name}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, children }) {
  return (
    <div className="cts-section-header" style={{
      textAlign: "center",
      marginBottom: "clamp(36px, 4.5vw, 64px)",
    }}>
      <Label style={{ display: "block", marginBottom: 14 }}>{eyebrow}</Label>
      <h1 style={{
        ...TYPE.display,
        fontSize: "clamp(28px, 3.8vw, 56px)",
        color: D.text,
        margin: 0,
      }}>{title}</h1>
      {children}
    </div>
  );
}

/* ─── VISION ────────────────────────────────── */
const VISION_BEFORE = [
  { k: "Roles",      v: "Overlapping positions, blurred ownership" },
  { k: "Workflow",   v: "Improvised handoffs, inconsistent timelines" },
  { k: "Reporting",  v: "Unclear chain of command, decisions stall" },
  { k: "Operations", v: "Manual management, bloat, rising cost" },
];

const VISION_AFTER = [
  { k: "Roles",      v: "Consolidated into focused, well-scoped positions" },
  { k: "Workflow",   v: "One documented path from kickoff to launch" },
  { k: "Reporting",  v: "One director per role: approvals move" },
  { k: "Operations", v: "Templated, organized, scalable without chaos" },
];

const VISION_OUTCOMES = [
  "Less manual management",
  "Less bloat",
  "Faster turnaround",
  "Higher project throughput",
  "Higher overall efficiency",
];

function VisionColumn({ side, title, eyebrow, items, accent, accentBg, accentBorder, glow }) {
  const spot = useSpotlight(accent);
  return (
    <div ref={spot.ref} {...spot.handlers} style={{
      ...spotlightRootStyle,
      background: D.surface,
      border: `1px solid ${accentBorder}`,
      borderRadius: 14,
      padding: "26px 28px 28px",
      boxShadow: glow,
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}>
      {spot.overlay}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          ...TYPE.eyebrow,
          fontSize: 10,
          color: accent,
          padding: "4px 9px",
          borderRadius: 4,
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          letterSpacing: "0.16em",
        }}>{eyebrow}</span>
        <span style={{
          ...TYPE.label,
          fontSize: 10,
          color: D.subtle,
        }}>{side === "before" ? "01" : "02"}</span>
      </div>

      <h2 style={{
        ...TYPE.heading,
        fontSize: "clamp(20px, 2.2vw, 30px)",
        color: D.text,
        margin: 0,
      }}>{title}</h2>

      <div style={{ height: 1, background: D.border }} />

      <ul style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {items.map(it => (
          <li key={it.k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{
              ...TYPE.label,
              fontSize: 10,
              color: accent,
              letterSpacing: "0.14em",
            }}>{it.k}</span>
            <span style={{
              ...TYPE.body,
              fontSize: 13.5,
              color: D.muted,
              textDecoration: side === "before" ? "line-through" : "none",
              textDecorationColor: side === "before" ? D.subtle : "transparent",
              textDecorationThickness: "1px",
            }}>{it.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Vision() {
  const outcomesSpot = useSpotlight(D.wom, { radius: 280 });
  const costSpot = useSpotlight(D.wom);
  const revenueSpot = useSpotlight(D.dpm);
  return (
    <div className="cts-vision-pane" style={{
      maxWidth: "min(var(--cts-vision-max, 1180px), 100%)",
      margin: "0 auto",
      zoom: "var(--cts-vision-zoom, 0.86)",
    }}>

      <SectionHeader eyebrow="The Vision" title="A leaner machine. A stronger top line." />

      {/* Mission statement */}
      <div style={{
        maxWidth: 820,
        margin: "-32px auto 56px",
        textAlign: "center",
      }}>
        <p style={{
          ...TYPE.body,
          fontSize: "clamp(14.5px, 1.4vw, 20px)",
          lineHeight: 1.6,
          color: D.muted,
          margin: 0,
        }}>
          Creative is the engine room behind every client deliverable. Consolidate roles, define
          the workflow, clarify ownership: each project costs less to produce, and more work moves
          through the department at current headcount. The compounding effect across the company:
          {" "}<span style={{ color: D.text, fontWeight: 600 }}>operating cost down, top-line revenue up.</span>
        </p>
      </div>

      {/* Before / After comparison */}
      <div className="cts-vision-grid" style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr 56px 1fr",
        alignItems: "stretch",
        gap: 0,
        marginBottom: 56,
      }}>
        <VisionColumn
          side="before"
          eyebrow="Today"
          title="Department as-is"
          items={VISION_BEFORE}
          accent={D.wom}
          accentBg={D.womLight}
          accentBorder={D.womBorder}
          glow={SHADOWS.glowWom}
        />

        {/* Arrow connector */}
        <div className="cts-vision-arrow" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: D.surface2,
            border: `1px solid ${D.dpmBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 24px ${D.dpmGlow}, 0 0 24px ${D.womGlow}`,
            position: "relative",
          }}>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
              <defs>
                <linearGradient id="vision-arrow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"  stopColor={D.wom} />
                  <stop offset="100%" stopColor={D.dpm} />
                </linearGradient>
              </defs>
              <path d="M1 7h17M13 2l5 5-5 5" stroke="url(#vision-arrow)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <VisionColumn
          side="after"
          eyebrow="Proposed"
          title="Department as-proposed"
          items={VISION_AFTER}
          accent={D.dpm}
          accentBg={D.dpmLight}
          accentBorder={D.dpmBorder}
          glow={SHADOWS.glowDpm}
        />
      </div>

      {/* Outcomes strip */}
      <div ref={outcomesSpot.ref} {...outcomesSpot.handlers} style={{
        ...spotlightRootStyle,
        background: D.surface,
        border: `1px solid ${D.womBorder}`,
        borderRadius: 12,
        padding: "22px 28px",
        boxShadow: SHADOWS.card,
      }}>
        {outcomesSpot.overlay}
        <Label style={{ display: "block", marginBottom: 14, textAlign: "center", color: D.wom }}>
          What it delivers
        </Label>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
        }}>
          {VISION_OUTCOMES.map(o => (
            <span key={o} style={{
              ...TYPE.chip,
              fontSize: 12,
              color: D.text,
              background: D.womLight,
              border: `1px solid ${D.womBorder}`,
              padding: "8px 14px",
              borderRadius: 4,
            }}>{o}</span>
          ))}
        </div>
      </div>

      {/* Executive bottom line */}
      <div style={{ marginTop: 36 }}>
        <Label style={{ display: "block", marginBottom: 14, textAlign: "center" }}>
          Executive bottom line
        </Label>
        <div className="cts-bottom-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}>
          {/* Cost down */}
          <div ref={costSpot.ref} {...costSpot.handlers} className="cts-vision-cost-revenue-card" style={{
            ...spotlightRootStyle,
            background: D.surface,
            border: `1px solid ${D.womBorder}`,
            borderRadius: 14,
            padding: "clamp(20px, 2.4vw, 32px) clamp(22px, 2.8vw, 36px)",
            boxShadow: SHADOWS.glowWom,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {costSpot.overlay}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                ...TYPE.display,
                fontSize: "clamp(28px, 3.2vw, 44px)",
                color: D.wom,
                lineHeight: 1,
              }}>↓</span>
              <h3 style={{
                ...TYPE.heading,
                fontSize: "clamp(18px, 1.9vw, 26px)",
                color: D.text,
                margin: 0,
              }}>Operational cost</h3>
            </div>
            <p style={{
              ...TYPE.body,
              fontSize: "clamp(12.5px, 1.1vw, 16px)",
              color: D.muted,
              margin: 0,
            }}>
              Consolidated roles and templated workflow strip out manual coordination,
              redundancy, and rework. Every project costs less to deliver.
            </p>
          </div>

          {/* Revenue up */}
          <div ref={revenueSpot.ref} {...revenueSpot.handlers} className="cts-vision-cost-revenue-card" style={{
            ...spotlightRootStyle,
            background: D.surface,
            border: `1px solid ${D.dpmBorder}`,
            borderRadius: 14,
            padding: "clamp(20px, 2.4vw, 32px) clamp(22px, 2.8vw, 36px)",
            boxShadow: SHADOWS.glowDpm,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {revenueSpot.overlay}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                ...TYPE.display,
                fontSize: "clamp(28px, 3.2vw, 44px)",
                color: D.dpm,
                lineHeight: 1,
              }}>↑</span>
              <h3 style={{
                ...TYPE.heading,
                fontSize: "clamp(18px, 1.9vw, 26px)",
                color: D.text,
                margin: 0,
              }}>Top-line revenue</h3>
            </div>
            <p style={{
              ...TYPE.body,
              fontSize: "clamp(12.5px, 1.1vw, 16px)",
              color: D.muted,
              margin: 0,
            }}>
              Faster turnaround and higher throughput mean more billable work shipped,
              healthier client retention, and capacity to take on new business.
            </p>
          </div>
        </div>

        {/* Thesis line */}
        <div style={{
          marginTop: 24,
          textAlign: "center",
          padding: "0 12px",
        }}>
          <p style={{
            ...TYPE.body,
            fontSize: "clamp(13px, 1.25vw, 18px)",
            color: D.text,
            fontStyle: "italic",
            margin: 0,
          }}>
            One backend tune-up. Company-wide impact on the P&amp;L.
          </p>
        </div>
      </div>
    </div>
  );
}

function OrgChart() {
  return (
    <div className="cts-org-scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

      <SectionHeader eyebrow="Proposed structure" title="Creative Department">
        <RoleKey />
      </SectionHeader>

      {/* COO */}
      <div style={{
        background: D.surface2,
        border: `1px solid ${D.border}`,
        borderRadius: 10,
        padding: "16px 36px",
        textAlign: "center",
        boxShadow: SHADOWS.card,
      }}>
        <Label style={{ display: "block", marginBottom: 8 }}>Reports to</Label>
        <h2 style={{
          ...TYPE.eyebrow,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: D.text,
          margin: 0,
        }}>Chief Operating Officer</h2>
        <div style={{
          ...TYPE.body,
          fontSize: 12,
          color: D.muted,
          marginTop: 4,
        }}>Annabelle</div>
      </div>

      <ForkConnector />

      {/* Leaders row */}
      <div className="cts-leaders-row" style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
        <LeaderNode
          tag="Co-lead 01"
          sub="DPD"
          title="Digital Production Director"
          name="Caela"
          color={D.dpm}
          colorLight={D.dpmLight}
          colorBorder={D.dpmBorder}
          responsibilities={[
            "Leads kickoff call for new website builds",
            "Designs and presents website mockups",
            "Reviews mockups and secures client approval",
            "AI-assisted design and development",
            "Oversees Content Production on new builds",
            "Sends staging link, reviews with client",
            "Coordinates website launch",
            "Approves all Digital Design Specialist work",
          ]}
          focus={[
            { text: "New website builds", color: D.dpm, bg: D.dpmLight, border: D.dpmBorder },
            { text: "Design approval",    color: D.muted, bg: D.hairline, border: D.border },
          ]}
        />
        <div style={{ width: SPACER, flexShrink: 0 }} />
        <LeaderNode
          tag="Co-lead 02"
          sub="WOD"
          title="Web Operations Director"
          name="Ingrid"
          color={D.wom}
          colorLight={D.womLight}
          colorBorder={D.womBorder}
          responsibilities={[
            "Tasks and manages all ongoing projects",
            "Oversees and sets project timelines",
            "Assigns work to CPS, DDS, and launch team",
            "Communicates with account managers",
            "Secures client approval before go-live",
            "Builds and owns all workflow templates",
            "Strategy",
            "Conversion audits",
          ]}
          focus={[
            { text: "Ongoing projects", color: D.wom, bg: D.womLight, border: D.womBorder },
            { text: "Workflow ops",     color: D.muted, bg: D.hairline, border: D.border },
          ]}
        />
      </div>

      <DoubleVertical height={48} />

      {/* Specialists row */}
      <div className="cts-specialists-row" style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
        <SpecialistNode
          tag="Role 03"
          sub="CPS"
          title="Content Production Specialist"
          name="Sylvi"
          accent={OWNER.cps.color}
          responsibilities={[
            "Writes content for new builds and ongoing projects",
            "Transfers content onto new websites",
            "Transfers content for ongoing work",
          ]}
          reporting={[
            { text: "DPD, new builds", color: D.dpm, bg: D.dpmLight, border: D.dpmBorder },
            { text: "WOD, ongoing",    color: D.wom, bg: D.womLight, border: D.womBorder },
          ]}
        />
        <div style={{ width: SPACER, flexShrink: 0 }} />
        <SpecialistNode
          tag="Role 04"
          sub="DDS"
          title="Digital Design Specialist"
          name="Shayna"
          accent={D.wom}
          responsibilities={[
            "AI-assisted design and dev for existing sites",
            "Builds sections, pages, banners, promotions",
            "All designs approved by DPD before publishing",
          ]}
          reporting={[
            { text: "WOD, timeline and tasks", color: D.wom, bg: D.womLight, border: D.womBorder },
            { text: "DPD, design approval",    color: D.dpm, bg: D.dpmLight, border: D.dpmBorder },
          ]}
        />
      </div>

      <MergeConnector />

      {/* Launch team */}
      <div id="Launch" className="cts-launch" style={{
        width: "var(--cts-launch-w, 480px)",
        maxWidth: "100%",
        background: D.surface,
        border: `1px solid ${D.border}`,
        borderRadius: 12,
        padding: "20px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        boxShadow: SHADOWS.raised,
        scrollMarginTop: 32,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <Label>Role 05</Label>
            <span style={{ ...TYPE.eyebrow, fontSize: 9, color: D.subtle }}>Mason &amp; Kasey</span>
          </div>
          <h3 style={{
            ...TYPE.eyebrow,
            fontSize: "clamp(12.5px, 1.15vw, 17px)",
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: D.text,
            margin: 0,
          }}>Launch Specialists</h3>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {["Bug fixes", "Site launch", "Execution only"].map(t => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TIMELINE DATA ─────────────────────────── */
const NEW_BUILD = [
  {
    phase: "Kickoff",
    steps: [
      { title: "Kickoff call", owners: [["dpm","DPD"],["am","Acct Mgr"],["seo","SEO"],["cps","CPS"]] },
    ],
  },
  {
    phase: "Design",
    steps: [
      { title: "Mockup design",        owners: [["dpm","DPD"]] },
      { title: "Review scheduled",     owners: [["am","Acct Mgr"]] },
      { title: "Mockup approval",      owners: [["dpm","DPD"],["am","Acct Mgr"],["client","Client"]] },
    ],
  },
  {
    phase: "Build",
    steps: [
      { title: "Design & development", owners: [["dpm","DPD"]] },
      { title: "Content writing",      owners: [["cps","CPS"]] },
    ],
  },
  {
    phase: "Review",
    steps: [
      { title: "Bug fixes",            owners: [["launch","Mason & Kasey"]] },
      { title: "Staging link sent",    owners: [["dpm","DPD"]] },
      { title: "Final approval",       owners: [["dpm","DPD"],["am","Acct Mgr"],["client","Client"]] },
    ],
  },
  {
    phase: "Launch",
    steps: [
      { title: "Site launch",          owners: [["launch","Mason & Kasey"]] },
    ],
  },
];

const ONGOING = [
  {
    phase: "Intake",
    steps: [
      { title: "Client request",        owners: [["client","Client"],["am","Acct Mgr"]] },
      { title: "Project tasked out",    owners: [["wom","WOD"],["am","Acct Mgr"]] },
    ],
  },
  {
    phase: "Design",
    steps: [
      { title: "Design assigned",       owners: [["wom","WOD"],["dds","DDS"]] },
      { title: "Dev + DPD approval",    owners: [["dds","DDS"],["dpm","DPD"]] },
    ],
  },
  {
    phase: "Content",
    steps: [
      { title: "Content (if needed)",   owners: [["cps","CPS"]] },
    ],
  },
  {
    phase: "Approval",
    steps: [
      { title: "Client approval chain", owners: [["wom","WOD"],["am","Acct Mgr"],["client","Client"]] },
    ],
  },
  {
    phase: "Launch",
    steps: [
      { title: "Bug fixes & go live",   owners: [["launch","Mason & Kasey"]] },
    ],
  },
];

/* ─── TIMELINE COMPONENTS ───────────────────── */
function StepCard({ steps }) {
  return (
    <div style={{
      width: "calc(100% - 14px)",
      padding: "4px 10px 0",
      textAlign: "center",
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{ marginBottom: i < steps.length - 1 ? 10 : 0 }}>
          <div style={{
            ...TYPE.step,
            fontSize: 12.5,
            color: D.text,
            marginBottom: 3,
            lineHeight: 1.35,
          }}>{step.title}</div>
          <div style={{
            fontSize: 10.5,
            lineHeight: 1.5,
            color: D.muted,
            letterSpacing: "0.01em",
          }}>
            {step.owners.map(([type, label], j) => {
              const s = OWNER[type] || {};
              return (
                <span key={j}>
                  <span style={{ color: s.color || D.muted, fontWeight: 600 }}>{label}</span>
                  {j < step.owners.length - 1 ? <span style={{ opacity: 0.5 }}> · </span> : null}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const HorizontalTimeline = memo(function HorizontalTimeline({ title, subtitle, color, phases }) {
  const ARROW_W = 28;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: "clamp(28px, 3.5vw, 52px)" }}>
        <Label style={{ display: "block", marginBottom: 12 }}>{subtitle}</Label>
        <h2 style={{ ...TYPE.heading, fontSize: "clamp(22px, 2.8vw, 40px)", color, margin: 0 }}>{title}</h2>
      </div>

      {/* Phase labels */}
      <div style={{ display: "flex", marginLeft: ARROW_W, marginRight: ARROW_W }}>
        {phases.map((p, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              ...TYPE.eyebrow,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color,
              marginBottom: 12,
              opacity: 0.9,
            }}>{p.phase}</div>
          </div>
        ))}
      </div>

      {/* Axis */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: ARROW_W, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M13 5H1M1 5L5 1M1 5L5 9" stroke={D.line} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, position: "relative", height: 12, display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: D.line }} />
          {phases.map((_, i) => (
            <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: color, flexShrink: 0,
                boxShadow: `0 0 0 3px ${D.bg}, 0 0 14px ${color}`,
              }} />
            </div>
          ))}
        </div>
        <div style={{ width: ARROW_W, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke={D.line} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Drop lines + step cards */}
      <div style={{ display: "flex", marginLeft: ARROW_W, marginRight: ARROW_W }}>
        {phases.map((p, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 1, height: 18, background: D.line }} />
            <StepCard steps={p.steps} />
          </div>
        ))}
      </div>
    </div>
  );
});

/* ─── GLOBAL STYLES (responsive variables, hover, focus, motion, print) ─── */
const GLOBAL_CSS = `
  /* ============================================================
     RESPONSIVE DESIGN SYSTEM
     Single source of truth for fluid scaling across every screen
     size — mobile, tablet, laptop, desktop, 4K, ultra-wide, and
     curved monitors. All major dimensions reference these vars.
     ============================================================ */

  .cts-root {
    /* Org-chart geometry */
    --cts-node-w: 340px;
    --cts-spacer: 48px;
    --cts-tree-w: calc(var(--cts-node-w) * 2 + var(--cts-spacer));
    --cts-l-off: calc(var(--cts-node-w) / 2);
    --cts-r-off: calc(var(--cts-node-w) / 2);
    --cts-ctr-x: calc(var(--cts-node-w) + var(--cts-spacer) / 2);
    --cts-launch-w: 480px;

    /* Content scale */
    --cts-zoom: 1.5;
    --cts-vision-zoom: 0.86;
    --cts-content-max: 1280px;
    --cts-vision-max: 1180px;
    --cts-timelines-max: 1180px;
  }

  /* ───────────── ULTRA-WIDE & 4K SCALING (≥1920px) ─────────────
     Curved 21:9 (3440×1440), super-wide (5120×1440), 4K (3840×2160),
     and 5K monitors. Scale up so the design fills the screen without
     looking lost in whitespace, but cap so it never balloons. */
  @media (min-width: 1920px) {
    .cts-root {
      --cts-zoom: 1.55;
      --cts-content-max: 1400px;
      --cts-vision-max: 1300px;
      --cts-timelines-max: 1300px;
    }
  }
  @media (min-width: 2400px) {
    .cts-root {
      --cts-zoom: 1.75;
      --cts-content-max: 1560px;
      --cts-vision-max: 1440px;
      --cts-timelines-max: 1440px;
      --cts-node-w: 360px;
      --cts-spacer: 52px;
      --cts-launch-w: 520px;
    }
  }
  @media (min-width: 3200px) {
    .cts-root {
      --cts-zoom: 2.0;
      --cts-content-max: 1720px;
      --cts-vision-max: 1600px;
      --cts-timelines-max: 1600px;
      --cts-node-w: 400px;
      --cts-spacer: 60px;
      --cts-launch-w: 580px;
    }
  }
  @media (min-width: 4200px) {
    .cts-root {
      --cts-zoom: 2.4;
      --cts-content-max: 1900px;
      --cts-vision-max: 1780px;
      --cts-timelines-max: 1780px;
    }
  }

  /* ───────────── LARGE DESKTOP (1500–1900px) ───────────── */
  @media (max-width: 1900px) and (min-width: 1500px) {
    .cts-root { --cts-zoom: 1.4; }
  }

  /* ───────────── STANDARD DESKTOP (1280–1500px) ───────────── */
  @media (max-width: 1500px) {
    .cts-root { --cts-zoom: 1.2; }
  }
  @media (max-width: 1366px) {
    .cts-root { --cts-zoom: 1.08; }
  }

  /* ───────────── LAPTOP (1100–1280) ───────────── */
  @media (max-width: 1280px) {
    .cts-root {
      --cts-zoom: 1.0;
      --cts-node-w: 320px;
      --cts-spacer: 40px;
    }
  }

  /* ───────────── SMALL LAPTOP / LARGE TABLET (≤1100px) ───────────── */
  @media (max-width: 1100px) {
    .cts-root {
      --cts-zoom: 0.98;
      --cts-node-w: 300px;
      --cts-spacer: 36px;
      --cts-launch-w: 440px;
    }
  }

  /* ───────────── TABLET (≤900px) ───────────── */
  @media (max-width: 900px) {
    .cts-root {
      --cts-zoom: 0.95;
      --cts-vision-zoom: 1;
      --cts-node-w: 280px;
      --cts-spacer: 32px;
      --cts-launch-w: 420px;
    }
    .cts-vision-grid {
      grid-template-columns: 1fr !important;
      gap: 22px !important;
    }
    .cts-vision-arrow {
      transform: rotate(90deg);
      min-height: 48px;
    }
    .cts-bottom-grid {
      grid-template-columns: 1fr !important;
    }
    .cts-tab { margin-right: 22px; padding: 12px 2px; }
    .cts-timelines-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 18px !important;
    }
  }

  /* ───────────── MOBILE LANDSCAPE / SMALL TABLET (≤768px) ───────────── */
  @media (max-width: 768px) {
    .cts-root {
      --cts-zoom: 0.9;
      --cts-node-w: 270px;
      --cts-spacer: 26px;
      --cts-launch-w: 100%;
    }
    .cts-doc-strip {
      flex-wrap: wrap !important;
      row-gap: 8px !important;
    }
    .cts-org-scroll {
      overflow-x: auto;
      overflow-y: visible;
      align-items: flex-start !important;
      padding-bottom: 14px;
      width: 100%;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }
    .cts-tabs {
      overflow-x: auto;
      flex-wrap: nowrap !important;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .cts-tabs::-webkit-scrollbar { display: none; }
    .cts-tab {
      margin-right: 20px;
      padding: 12px 2px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .cts-vision-pane {
      padding-left: 4px !important;
      padding-right: 4px !important;
    }
  }

  /* ───────────── MOBILE PORTRAIT (≤540px) ───────────── */
  @media (max-width: 540px) {
    .cts-root {
      --cts-zoom: 0.85;
      --cts-node-w: 260px;
      --cts-spacer: 22px;
    }
    .cts-tab {
      margin-right: 16px;
      padding: 11px 2px;
      font-size: 12px !important;
      letter-spacing: 0.06em !important;
    }
    .cts-section-header {
      margin-bottom: 36px !important;
    }
    .cts-timeline-section {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .cts-timeline-section > * {
      min-width: 520px;
    }
    .cts-vision-cost-revenue-card {
      padding: 22px 20px !important;
    }
  }

  /* ───────────── SMALL MOBILE (≤400px) ───────────── */
  @media (max-width: 400px) {
    .cts-root {
      --cts-zoom: 0.78;
      --cts-node-w: 240px;
      --cts-spacer: 18px;
    }
  }

  /* ───────────── EXTRA-SMALL MOBILE (≤340px) ───────────── */
  @media (max-width: 340px) {
    .cts-root {
      --cts-zoom: 0.72;
      --cts-node-w: 220px;
      --cts-spacer: 16px;
    }
  }

  /* ───────────── PORTRAIT ORIENTATION GUARD ─────────────
     On portrait tablets, lock zoom to fit width better */
  @media (max-width: 1100px) and (orientation: portrait) {
    .cts-root { --cts-zoom: 0.9; }
  }

  /* ───────────── SHORT-HEIGHT GUARD (mobile landscape <=520h) ───────────── */
  @media (max-height: 520px) and (max-width: 1100px) {
    .cts-root { --cts-zoom: 0.78; }
  }

  /* ============================================================
     TABS
     ============================================================ */
  .cts-tab {
    background: none;
    border: none;
    margin-bottom: -1px;
    padding: 14px 2px;
    margin-right: 32px;
    cursor: pointer;
    font-family: 'Manrope', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${D.muted};
    border-bottom: 2px solid transparent;
    transition: color 220ms cubic-bezier(0.16, 1, 0.3, 1),
                border-color 220ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .cts-tab:hover { color: ${D.text}; }
  .cts-tab:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${D.bg}, 0 0 0 4px ${D.dpmBorder};
    border-radius: 3px;
  }
  .cts-tab[aria-selected="true"] {
    color: ${D.text};
    border-bottom-color: ${D.text};
  }

  /* ============================================================
     PANE TRANSITIONS
     ============================================================ */
  .cts-pane {
    animation: cts-fade 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .cts-pane:focus { outline: none; }
  @keyframes cts-fade {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .cts-org-scroll {
    width: 100%;
    box-sizing: border-box;
  }

  /* Prevent any element from forcing horizontal overflow at the page level */
  html, body { max-width: 100vw; overflow-x: hidden; }
  .cts-root { max-width: 100vw; overflow-x: clip; }

  /* ============================================================
     ACCESSIBILITY
     ============================================================ */
  @media (prefers-reduced-motion: reduce) {
    .cts-pane { animation: none; }
    .cts-tab { transition: none; }
  }

  /* ============================================================
     PRINT
     ============================================================ */
  @media print {
    .cts-root {
      background: white !important;
      color: black !important;
      padding: 0 !important;
      --cts-zoom: 1 !important;
      --cts-vision-zoom: 1 !important;
      --cts-node-w: 320px !important;
      --cts-spacer: 40px !important;
      --cts-launch-w: 460px !important;
    }
    .cts-tabs, .cts-tab { display: none !important; }
    .cts-pane { animation: none !important; }
    .cts-print-both > * + * { margin-top: 32px; }
  }
`;

/* ─── MAIN ──────────────────────────────────── */
const TABS = [
  ["vision", "Vision"],
  ["org", "Org Chart"],
  ["timelines", "Project Timelines"],
];

export default function CreativeTeamStructure() {
  const [tab, setTab] = useState("vision");

  const onTabKeyDown = (e) => {
    const ids = TABS.map(t => t[0]);
    const i = ids.indexOf(tab);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setTab(ids[(i + 1) % ids.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setTab(ids[(i - 1 + ids.length) % ids.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setTab(ids[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      setTab(ids[ids.length - 1]);
    }
  };

  return (
    <Fragment>
      <IsoWaveGrid />
      <div className="cts-root" style={{
      minHeight: "100vh",
      position: "relative",
      zIndex: 1,
      background: "transparent",
      padding: "clamp(20px, 4vw, 56px) clamp(16px, 5vw, 64px) clamp(48px, 6vw, 96px)",
      fontFamily: "'Manrope', sans-serif",
      color: D.text,
      zoom: "var(--cts-zoom, 1.5)",
    }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ maxWidth: "min(var(--cts-content-max, 1280px), 100%)", margin: "0 auto" }}>

        {/* Document meta strip */}
        <div className="cts-doc-strip" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 36,
          paddingBottom: 18,
          borderBottom: `1px solid ${D.border}`,
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 900, fontSize: "clamp(15px, 1.4vw, 22px)", letterSpacing: "-0.01em", lineHeight: 1 }}>
              <span style={{ color: D.text }}>WIT</span>
              <span style={{ color: D.dpm }}>DELIVERS</span>
            </span>
            <span style={{ width: 1, height: 14, background: D.border }} />
            <span style={{ ...TYPE.label, fontSize: "clamp(9.5px, 0.85vw, 12px)", color: D.muted }}>Creative dept restructure</span>
          </div>
          <span style={{ ...TYPE.label, fontSize: "clamp(9.5px, 0.85vw, 12px)", color: D.subtle, fontVariantNumeric: "tabular-nums" }}>
            Proposal · May 2026
          </span>
        </div>

        {/* Tab nav */}
        <div className="cts-tabs" role="tablist" aria-label="Sections" style={{
          display: "flex",
          flexWrap: "wrap",
          marginBottom: "clamp(32px, 4vw, 56px)",
          borderBottom: `1px solid ${D.border}`,
        }}>
          {TABS.map(([id, label]) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              className="cts-tab"
              onClick={() => setTab(id)}
              onKeyDown={onTabKeyDown}
            >{label}</button>
          ))}
        </div>

        {/* Tab panels */}
        <div
          key={tab}
          id={`panel-${tab}`}
          className="cts-pane"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
        >
          {tab === "vision" && <Vision />}
          {tab === "org" && <OrgChart />}
          {tab === "timelines" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 48,
              maxWidth: "min(var(--cts-timelines-max, 1180px), 100%)",
              margin: "0 auto",
            }}>
              <div className="cts-timelines-header" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 24,
                marginBottom: 4,
                flexWrap: "wrap",
              }}>
                <div style={{ textAlign: "left" }}>
                  <Label style={{ display: "block", marginBottom: 10 }}>Workflows</Label>
                  <h1 style={{
                    ...TYPE.display,
                    fontSize: "clamp(26px, 3.4vw, 44px)",
                    color: D.text,
                    display: "inline-block",
                    margin: 0,
                  }}>
                    Project Timelines
                    <div style={{
                      height: 3,
                      background: D.wom,
                      borderRadius: 2,
                      marginTop: 6,
                      width: "100%",
                      boxShadow: `0 0 12px ${D.womGlow}`,
                    }} />
                  </h1>
                </div>
                <MapLegend />
              </div>
              <div className="cts-timeline-section" style={{ marginTop: -30 }}>
                <HorizontalTimeline
                  title="New Website Build"
                  subtitle="Kickoff through launch"
                  color={D.dpm}
                  phases={NEW_BUILD}
                />
              </div>
              <div style={{ height: 1, background: D.border, opacity: 0.7 }} />
              <div className="cts-timeline-section" style={{ marginTop: -30 }}>
                <HorizontalTimeline
                  title="Ongoing Projects"
                  subtitle="Existing client creative requests"
                  color={D.wom}
                  phases={ONGOING}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </Fragment>
  );
}
