import React, { useRef, useEffect } from "react";

/* ─── ISO WAVE GRID ──────────────────────────────
   Ambient canvas background: a slow "breathing"
   isometric mesh tinted to the WOM rose, fixed to
   the viewport so it stays behind all content.
   Ported from the 21st.dev IsoLevelWarp to JSX +
   inline styles. Pointer events pass through, so
   tabs/buttons still work above it.
──────────────────────────────────────────────── */

const VIGNETTE_COLOR = "oklch(0.135 0.012 270)"; // matches PAGE_BG center

export default function IsoWaveGrid({
  color = "212, 96, 109",  // ~ oklch(0.62 0.155 5) — WOM rose in RGB
  speed = 0.6,
  density = 55,
  peakAlpha = 0.24,         // gradient mid stop — lower = subtler
  layerOpacity = 0.5,       // whole-canvas opacity — keeps it ambient
  driftX = 0.22,            // px/frame horizontal drift (diagonal scroll)
  driftY = 0.18,            // px/frame vertical drift
  waveAmplitude = 6,        // residual breathing — keep low so drift reads
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId;

    const gridGap = density;
    let rows = Math.ceil(height / gridGap) + 5;
    let cols = Math.ceil(width / gridGap) + 5;

    let time = 0;
    let dxAccum = 0;
    let dyAccum = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      rows = Math.ceil(height / gridGap) + 5;
      cols = Math.ceil(width / gridGap) + 5;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (!reducedMotion) {
        time += 0.01 * speed;
        dxAccum = (dxAccum + driftX) % gridGap;
        dyAccum = (dyAccum + driftY) % gridGap;
      }

      ctx.beginPath();

      for (let y = 0; y <= rows; y++) {
        let isFirst = true;

        for (let x = 0; x <= cols; x++) {
          // Drift the whole grid diagonally; modulo gridGap keeps it seamless
          // (extra buffer rows/cols hide the wrap edge).
          const baseX = x * gridGap - gridGap * 2 + dxAccum;
          const baseY = y * gridGap - gridGap * 2 + dyAccum;

          // Residual breathing keeps the iso/topo character.
          const wave = reducedMotion
            ? 0
            : Math.sin(x * 0.2 + time) * Math.cos(y * 0.2 + time) * waveAmplitude;

          const finalX = baseX;
          const finalY = baseY + wave;

          if (isFirst) {
            ctx.moveTo(finalX, finalY);
            isFirst = false;
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
      }

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(${color}, 0)`);
      gradient.addColorStop(0.5, `rgba(${color}, ${peakAlpha})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (reducedMotion) return; // draw once, no loop
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);

    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed, density, peakAlpha, driftX, driftY, waveAmplitude]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: layerOpacity,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, transparent 0%, ${VIGNETTE_COLOR} 100%)`,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
