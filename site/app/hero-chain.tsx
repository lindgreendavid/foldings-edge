"use client";

import { useEffect, useRef } from "react";

/**
 * Real per-residue AlphaFold2 pLDDT for UniProt Q92793 (DisProt DP02004), residues 645–704 —
 * a 60-residue slice of this 2,442-residue protein, read directly from the project's own
 * joined dataset (`data/external/joined_residues.csv`, `plddt` column, rows where
 * `acc == "Q92793"` and `645 <= residue_number <= 704`). Q92793 carries the largest curated-
 * disorder region in this project's sample (613 residues; per `docs/research-report.md`,
 * "the largest disorder region in the sample"), and its curated "disorder" annotation begins
 * at residue 674 in the same file — so this slice spans the real transition from ordered
 * flank to the start of that curated-disorder region. These are the exact values in the CSV,
 * not a synthesized or representative sequence.
 */
const RESIDUE_START = 645;
const PLDDT: number[] = [
  82.75, 90.0, 87.25, 85.88, 85.62, 92.0, 91.25, 83.62, 86.06, 89.62, 84.62, 84.19, 83.81, 83.69,
  80.31, 80.94, 82.12, 77.31, 79.44, 76.81, 71.62, 74.19, 75.19, 69.75, 66.75, 70.19, 63.12,
  50.38, 50.06, 49.47, 49.25, 39.62, 33.66, 35.75, 29.59, 27.52, 27.92, 26.47, 28.45, 25.56,
  27.64, 29.89, 30.19, 31.83, 33.19, 33.91, 30.38, 37.22, 40.34, 34.12, 36.16, 39.84, 27.5, 33.22,
  26.48, 35.0, 32.25, 27.47, 47.81, 39.69,
];
// Residue 674 (DisProt-curated disorder start) is index 674 - 645 = 29 in PLDDT.
const DISORDER_START_INDEX = 674 - RESIDUE_START;

const N = PLDDT.length;
const SPACING = 10;
const WAVE_AMP = 16;
const WAVE_WAVELENGTH = 18;
const JITTER_SCALE_Y = 0.4;
const JITTER_SCALE_X = 0.18;
const GOLDEN_ANGLE = 2.399963229728653;
const FRAMES_PER_LOOP = 480;
const NODE_RADIUS = 3;
const PADDING = 18;

// The real content extent of this exact chain (60 nodes, this exact PLDDT array, this exact
// jitter formula) was verified numerically by simulating every frame of one full loop and
// taking the min/max screen-space x and y across all nodes: x in [-2.98, 600.43], y in
// [-41.67, 44.69] (see the verification script used to derive these — same technique as
// three-body-lab's hero-orbit.tsx, which hardcodes its own numerically-verified content
// extents rather than guessing a square box). The canvas below is sized from those exact
// numbers plus PADDING, so nothing clips and nothing sits as a sliver in an oversized box.
const CONTENT_MIN_X = -2.98;
const CONTENT_MAX_X = 600.43;
const CONTENT_MIN_Y = -41.67;
const CONTENT_MAX_Y = 44.69;
const CANVAS_WIDTH = Math.ceil(CONTENT_MAX_X - CONTENT_MIN_X) + 2 * PADDING;
const CANVAS_HEIGHT = Math.ceil(CONTENT_MAX_Y - CONTENT_MIN_Y) + 2 * PADDING;
const OFFSET_X = PADDING - CONTENT_MIN_X;
const OFFSET_Y = PADDING - CONTENT_MIN_Y;

function baseX(i: number): number {
  return i * SPACING;
}
function baseY(i: number): number {
  return WAVE_AMP * Math.sin((2 * Math.PI * i) / WAVE_WAVELENGTH);
}
function amplitude(i: number): number {
  return 100 - PLDDT[i];
}
function jitter(i: number, t: number): { dx: number; dy: number } {
  const amp = amplitude(i);
  const phase1 = i * GOLDEN_ANGLE;
  const phase2 = i * GOLDEN_ANGLE * 1.7;
  const dy =
    amp *
    JITTER_SCALE_Y *
    (0.6 * Math.sin((2 * Math.PI * 3 * t) / FRAMES_PER_LOOP + phase1) +
      0.4 * Math.sin((2 * Math.PI * 5 * t) / FRAMES_PER_LOOP + phase2));
  const dx =
    amp *
    JITTER_SCALE_X *
    (0.6 * Math.cos((2 * Math.PI * 4 * t) / FRAMES_PER_LOOP + phase1) +
      0.4 * Math.cos((2 * Math.PI * 7 * t) / FRAMES_PER_LOOP + phase2));
  return { dx, dy };
}

function readPalette(): { dark: string; helix: string; sheet: string } {
  if (typeof window === "undefined") return { dark: "#04101a", helix: "#12d1c4", sheet: "#8fd400" };
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    dark: read("--dark", "#04101a"),
    helix: read("--helix", "#12d1c4"),
    sheet: read("--sheet", "#8fd400"),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const match = hex.match(/[0-9a-f]{2}/gi);
  if (!match || match.length < 3) return [255, 255, 255];
  return [parseInt(match[0], 16), parseInt(match[1], 16), parseInt(match[2], 16)];
}

function mixColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * Small, autoplaying, looping canvas animation for the hero section: a real 60-residue slice
 * of UniProt Q92793's per-residue AlphaFold2 pLDDT (see PLDDT above), rendered as a connected
 * chain. Each node's positional jitter amplitude is (100 - that residue's real pLDDT): nodes
 * with high pLDDT stay nearly still, nodes with low pLDDT (the curated-disorder region this
 * slice enters) wiggle visibly. Node/line color also interpolates from --helix (high pLDDT)
 * to --sheet (low pLDDT) by the same amplitude. Purely decorative — aria-hidden; the caption
 * beside it in page.tsx carries the accessible, factual description.
 */
export default function HeroChain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { dark, helix, sheet } = readPalette();
    const helixRgb = hexToRgb(helix);
    const sheetRgb = hexToRgb(sheet);
    const maxAmp = Math.max(...PLDDT.map((_, i) => amplitude(i)));
    const colorFor = (i: number) => mixColor(helixRgb, sheetRgb, amplitude(i) / maxAmp);

    const toScreen = (x: number, y: number) => ({ x: x + OFFSET_X, y: y + OFFSET_Y });

    const drawFrame = (t: number) => {
      ctx.fillStyle = dark;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const points = Array.from({ length: N }, (_, i) => {
        const { dx, dy } = jitter(i, t);
        return toScreen(baseX(i) + dx, baseY(i) + dy);
      });

      // Connecting backbone, segment color driven by the amplitude of its trailing residue.
      for (let i = 0; i < N - 1; i += 1) {
        ctx.strokeStyle = colorFor(i);
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      points.forEach((p, i) => {
        ctx.fillStyle = colorFor(i);
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === DISORDER_START_INDEX ? NODE_RADIUS + 1.5 : NODE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const reduced =
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Static frame: draw the real chain once at t=0, no animation, for visitors who asked
      // for reduced motion.
      drawFrame(0);
      return;
    }

    let frame = 0;
    let frameId: number | null = null;
    const draw = () => {
      drawFrame(frame);
      frame = (frame + 1) % FRAMES_PER_LOOP;
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="hero-chain"
      aria-hidden="true"
    />
  );
}
