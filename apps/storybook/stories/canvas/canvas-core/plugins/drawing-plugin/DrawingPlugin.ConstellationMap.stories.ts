/**
 * DrawingPlugin — Constellation Map
 *
 * A night-sky atlas built entirely with DrawingPlugin primitives.
 *
 * ── WHAT'S DEMONSTRATED ─────────────────────────────────────────────────────
 * • circle + circleGlow   Stars — radius and glow scaled by visual magnitude
 * • dashedLine            Constellation stick figures connecting the stars
 * • bezier                The Milky Way diffuse band sweeping across the sky
 * • rippleRing            A pulsating pulsar / neutron star
 * • label                 Star names and constellation titles
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ── ARCHITECTURAL NOTE ──────────────────────────────────────────────────────
 * DrawingPlugin renders ALL shapes onto a SINGLE shared PixiJS Graphics object.
 *   • No per-shape identity — clear() wipes the entire canvas in one call
 *   • Suitable for: static overlays, decorative backgrounds, diagrams
 *   • NOT suitable for: interactive nodes / edges (use graph-canvas for that)
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DrawingPlugin } from '@invana/canvas';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = {
  title: 'canvas/Plugins/Drawing',
};
export default meta;
type Story = StoryObj;

// ── Star catalogue ───────────────────────────────────────────────────────────
// Each star: { id, x, y, mag (0=brightest), name? }
// Positions are in normalised [0,1] space — scaled to canvas size at render time.
const STARS: { id: string; nx: number; ny: number; mag: number; name?: string }[] = [
  // ── Orion ──────────────────────────────────────────────────────────────────
  { id: 'betelgeuse',  nx: 0.335, ny: 0.295, mag: 0.5, name: 'Betelgeuse' },
  { id: 'rigel',       nx: 0.415, ny: 0.500, mag: 0.1, name: 'Rigel' },
  { id: 'bellatrix',   nx: 0.390, ny: 0.295, mag: 1.6 },
  { id: 'saiph',       nx: 0.365, ny: 0.495, mag: 2.1 },
  { id: 'mintaka',     nx: 0.350, ny: 0.385, mag: 2.2 },
  { id: 'alnilam',     nx: 0.365, ny: 0.390, mag: 1.7 },
  { id: 'alnitak',     nx: 0.382, ny: 0.395, mag: 1.8 },
  // ── Ursa Major (Big Dipper) ────────────────────────────────────────────────
  { id: 'dubhe',       nx: 0.580, ny: 0.155, mag: 1.8, name: 'Dubhe' },
  { id: 'merak',       nx: 0.598, ny: 0.188, mag: 2.4 },
  { id: 'phecda',      nx: 0.622, ny: 0.195, mag: 2.4 },
  { id: 'megrez',      nx: 0.635, ny: 0.172, mag: 3.3 },
  { id: 'alioth',      nx: 0.663, ny: 0.167, mag: 1.8 },
  { id: 'mizar',       nx: 0.688, ny: 0.152, mag: 2.1 },
  { id: 'alkaid',      nx: 0.718, ny: 0.132, mag: 1.9, name: 'Alkaid' },
  // ── Scorpius ──────────────────────────────────────────────────────────────
  { id: 'antares',     nx: 0.660, ny: 0.530, mag: 0.6, name: 'Antares' },
  { id: 'graffias',    nx: 0.625, ny: 0.490, mag: 2.6 },
  { id: 'dschubba',    nx: 0.640, ny: 0.495, mag: 2.3 },
  { id: 'sigma_sco',   nx: 0.660, ny: 0.500, mag: 2.9 },
  { id: 'tau_sco',     nx: 0.675, ny: 0.510, mag: 2.8 },
  { id: 'shaula',      nx: 0.695, ny: 0.600, mag: 1.6, name: 'Shaula' },
  { id: 'lesath',      nx: 0.710, ny: 0.608, mag: 2.7 },
  { id: 'sargas',      nx: 0.688, ny: 0.588, mag: 1.9 },
  { id: 'eta_sco',     nx: 0.678, ny: 0.570, mag: 3.3 },
  { id: 'mu_sco',      nx: 0.673, ny: 0.550, mag: 3.0 },
  // ── Cassiopeia (W shape) ──────────────────────────────────────────────────
  { id: 'schedar',     nx: 0.780, ny: 0.240, mag: 2.2, name: 'Schedar' },
  { id: 'caph',        nx: 0.760, ny: 0.215, mag: 2.3 },
  { id: 'gamma_cas',   nx: 0.800, ny: 0.220, mag: 1.6 },
  { id: 'ruchbah',     nx: 0.820, ny: 0.238, mag: 2.7 },
  { id: 'segin',       nx: 0.840, ny: 0.220, mag: 3.4 },
  // ── Lone bright stars ─────────────────────────────────────────────────────
  { id: 'sirius',      nx: 0.420, ny: 0.580, mag: -1.5, name: 'Sirius' },
  { id: 'vega',        nx: 0.720, ny: 0.280, mag: 0.0,  name: 'Vega' },
  { id: 'altair',      nx: 0.780, ny: 0.390, mag: 0.8,  name: 'Altair' },
  { id: 'deneb',       nx: 0.750, ny: 0.310, mag: 1.3,  name: 'Deneb' },
  // ── Pulsar — special animated element ────────────────────────────────────
  { id: 'psr_b0833',   nx: 0.510, ny: 0.650, mag: 3.5, name: 'Vela Pulsar' },
  // ── Medium-magnitude stars (mag 3–4) — visible with naked eye ─────────────
  { id: 'md01', nx: 0.08,  ny: 0.14, mag: 3.1 },
  { id: 'md02', nx: 0.17,  ny: 0.05, mag: 3.6 },
  { id: 'md03', nx: 0.26,  ny: 0.22, mag: 3.8 },
  { id: 'md04', nx: 0.30,  ny: 0.10, mag: 3.4 },
  { id: 'md05', nx: 0.40,  ny: 0.06, mag: 3.2 },
  { id: 'md06', nx: 0.52,  ny: 0.17, mag: 3.7 },
  { id: 'md07', nx: 0.57,  ny: 0.32, mag: 3.3 },
  { id: 'md08', nx: 0.46,  ny: 0.42, mag: 3.9 },
  { id: 'md09', nx: 0.20,  ny: 0.50, mag: 3.5 },
  { id: 'md10', nx: 0.10,  ny: 0.72, mag: 3.8 },
  { id: 'md11', nx: 0.25,  ny: 0.82, mag: 3.2 },
  { id: 'md12', nx: 0.38,  ny: 0.65, mag: 3.6 },
  { id: 'md13', nx: 0.50,  ny: 0.76, mag: 3.9 },
  { id: 'md14', nx: 0.60,  ny: 0.68, mag: 3.4 },
  { id: 'md15', nx: 0.72,  ny: 0.60, mag: 3.7 },
  { id: 'md16', nx: 0.82,  ny: 0.52, mag: 3.1 },
  { id: 'md17', nx: 0.88,  ny: 0.30, mag: 3.5 },
  { id: 'md18', nx: 0.94,  ny: 0.42, mag: 3.8 },
  { id: 'md19', nx: 0.96,  ny: 0.12, mag: 3.3 },
  { id: 'md20', nx: 0.84,  ny: 0.78, mag: 3.6 },
  { id: 'md21', nx: 0.62,  ny: 0.85, mag: 3.2 },
  { id: 'md22', nx: 0.42,  ny: 0.90, mag: 3.9 },
  { id: 'md23', nx: 0.14,  ny: 0.90, mag: 3.7 },
  { id: 'md24', nx: 0.05,  ny: 0.55, mag: 3.4 },
  { id: 'md25', nx: 0.55,  ny: 0.47, mag: 3.8 },
  // ── Background scatter (faint, unnamed) — mag 4–5 ─────────────────────────
  { id: 'bg01', nx: 0.12, ny: 0.08, mag: 4.5 },
  { id: 'bg02', nx: 0.22, ny: 0.18, mag: 4.8 },
  { id: 'bg03', nx: 0.48, ny: 0.12, mag: 4.2 },
  { id: 'bg04', nx: 0.55, ny: 0.22, mag: 4.9 },
  { id: 'bg05', nx: 0.16, ny: 0.62, mag: 4.3 },
  { id: 'bg06', nx: 0.28, ny: 0.70, mag: 4.7 },
  { id: 'bg07', nx: 0.44, ny: 0.82, mag: 4.6 },
  { id: 'bg08', nx: 0.86, ny: 0.45, mag: 4.4 },
  { id: 'bg09', nx: 0.92, ny: 0.62, mag: 4.9 },
  { id: 'bg10', nx: 0.70, ny: 0.72, mag: 4.1 },
  { id: 'bg11', nx: 0.18, ny: 0.35, mag: 4.8 },
  { id: 'bg12', nx: 0.32, ny: 0.48, mag: 4.5 },
  { id: 'bg13', nx: 0.90, ny: 0.18, mag: 4.3 },
  { id: 'bg14', nx: 0.08, ny: 0.88, mag: 4.7 },
  { id: 'bg15', nx: 0.76, ny: 0.82, mag: 4.2 },
  { id: 'bg16', nx: 0.04, ny: 0.30, mag: 4.6 },
  { id: 'bg17', nx: 0.33, ny: 0.32, mag: 4.9 },
  { id: 'bg18', nx: 0.43, ny: 0.55, mag: 4.4 },
  { id: 'bg19', nx: 0.58, ny: 0.42, mag: 4.8 },
  { id: 'bg20', nx: 0.66, ny: 0.20, mag: 4.1 },
  { id: 'bg21', nx: 0.74, ny: 0.44, mag: 4.7 },
  { id: 'bg22', nx: 0.80, ny: 0.62, mag: 4.3 },
  { id: 'bg23', nx: 0.93, ny: 0.75, mag: 4.9 },
  { id: 'bg24', nx: 0.36, ny: 0.78, mag: 4.5 },
  { id: 'bg25', nx: 0.15, ny: 0.78, mag: 4.2 },
  { id: 'bg26', nx: 0.06, ny: 0.45, mag: 4.8 },
  { id: 'bg27', nx: 0.24, ny: 0.58, mag: 4.6 },
  { id: 'bg28', nx: 0.38, ny: 0.20, mag: 4.3 },
  { id: 'bg29', nx: 0.68, ny: 0.38, mag: 4.7 },
  { id: 'bg30', nx: 0.88, ny: 0.08, mag: 4.4 },
  // ── Very faint (mag 5+) — barely visible, tiny pinpricks ─────────────────
  { id: 'vf01', nx: 0.03, ny: 0.20, mag: 5.2 },
  { id: 'vf02', nx: 0.09, ny: 0.60, mag: 5.5 },
  { id: 'vf03', nx: 0.14, ny: 0.42, mag: 5.1 },
  { id: 'vf04', nx: 0.19, ny: 0.28, mag: 5.6 },
  { id: 'vf05', nx: 0.23, ny: 0.68, mag: 5.3 },
  { id: 'vf06', nx: 0.29, ny: 0.40, mag: 5.8 },
  { id: 'vf07', nx: 0.35, ny: 0.60, mag: 5.0 },
  { id: 'vf08', nx: 0.41, ny: 0.30, mag: 5.4 },
  { id: 'vf09', nx: 0.47, ny: 0.70, mag: 5.7 },
  { id: 'vf10', nx: 0.53, ny: 0.08, mag: 5.2 },
  { id: 'vf11', nx: 0.59, ny: 0.78, mag: 5.5 },
  { id: 'vf12', nx: 0.64, ny: 0.48, mag: 5.1 },
  { id: 'vf13', nx: 0.69, ny: 0.12, mag: 5.3 },
  { id: 'vf14', nx: 0.75, ny: 0.68, mag: 5.6 },
  { id: 'vf15', nx: 0.79, ny: 0.92, mag: 5.0 },
  { id: 'vf16', nx: 0.83, ny: 0.35, mag: 5.4 },
  { id: 'vf17', nx: 0.87, ny: 0.88, mag: 5.7 },
  { id: 'vf18', nx: 0.91, ny: 0.50, mag: 5.2 },
  { id: 'vf19', nx: 0.95, ny: 0.30, mag: 5.8 },
  { id: 'vf20', nx: 0.97, ny: 0.80, mag: 5.1 },
  { id: 'vf21', nx: 0.07, ny: 0.95, mag: 5.3 },
  { id: 'vf22', nx: 0.31, ny: 0.92, mag: 5.6 },
  { id: 'vf23', nx: 0.52, ny: 0.95, mag: 5.4 },
  { id: 'vf24', nx: 0.73, ny: 0.95, mag: 5.2 },
  { id: 'vf25', nx: 0.46, ny: 0.18, mag: 5.5 },
  { id: 'vf26', nx: 0.61, ny: 0.35, mag: 5.0 },
  { id: 'vf27', nx: 0.11, ny: 0.50, mag: 5.8 },
  { id: 'vf28', nx: 0.20, ny: 0.92, mag: 5.3 },
  { id: 'vf29', nx: 0.78, ny: 0.12, mag: 5.1 },
  { id: 'vf30', nx: 0.50, ny: 0.38, mag: 5.6 },
];

// ── Constellation lines (pairs of star ids) ──────────────────────────────────
const CONSTELLATION_LINES: { stars: [string, string]; constellation: string }[] = [
  // Orion — belt + shoulders + feet
  { stars: ['betelgeuse', 'mintaka'],  constellation: 'Orion' },
  { stars: ['bellatrix',  'mintaka'],  constellation: 'Orion' },
  { stars: ['mintaka',    'alnilam'],  constellation: 'Orion' },
  { stars: ['alnilam',    'alnitak'],  constellation: 'Orion' },
  { stars: ['alnitak',    'saiph'],    constellation: 'Orion' },
  { stars: ['alnitak',    'rigel'],    constellation: 'Orion' },
  { stars: ['betelgeuse', 'bellatrix'],constellation: 'Orion' },
  // Big Dipper
  { stars: ['dubhe',   'merak'],   constellation: 'Ursa Major' },
  { stars: ['merak',   'phecda'],  constellation: 'Ursa Major' },
  { stars: ['phecda',  'megrez'],  constellation: 'Ursa Major' },
  { stars: ['megrez',  'alioth'],  constellation: 'Ursa Major' },
  { stars: ['alioth',  'mizar'],   constellation: 'Ursa Major' },
  { stars: ['mizar',   'alkaid'],  constellation: 'Ursa Major' },
  { stars: ['dubhe',   'megrez'],  constellation: 'Ursa Major' },
  // Scorpius
  { stars: ['graffias', 'dschubba'],  constellation: 'Scorpius' },
  { stars: ['dschubba', 'sigma_sco'], constellation: 'Scorpius' },
  { stars: ['sigma_sco', 'antares'],  constellation: 'Scorpius' },
  { stars: ['antares',  'tau_sco'],   constellation: 'Scorpius' },
  { stars: ['tau_sco',  'mu_sco'],    constellation: 'Scorpius' },
  { stars: ['mu_sco',   'eta_sco'],   constellation: 'Scorpius' },
  { stars: ['eta_sco',  'sargas'],    constellation: 'Scorpius' },
  { stars: ['sargas',   'shaula'],    constellation: 'Scorpius' },
  { stars: ['shaula',   'lesath'],    constellation: 'Scorpius' },
  // Cassiopeia W
  { stars: ['caph',      'schedar'],   constellation: 'Cassiopeia' },
  { stars: ['schedar',   'gamma_cas'], constellation: 'Cassiopeia' },
  { stars: ['gamma_cas', 'ruchbah'],   constellation: 'Cassiopeia' },
  { stars: ['ruchbah',   'segin'],     constellation: 'Cassiopeia' },
  // Summer Triangle
  { stars: ['vega',   'deneb'],  constellation: 'Summer Triangle' },
  { stars: ['deneb',  'altair'], constellation: 'Summer Triangle' },
  { stars: ['altair', 'vega'],   constellation: 'Summer Triangle' },
];

// ── Constellation label positions (normalised) ────────────────────────────────
const CONSTELLATION_LABELS: { label: string; nx: number; ny: number }[] = [
  { label: 'ORION',          nx: 0.367, ny: 0.545 },
  { label: 'URSA MAJOR',     nx: 0.645, ny: 0.215 },
  { label: 'SCORPIUS',       nx: 0.660, ny: 0.640 },
  { label: 'CASSIOPEIA',     nx: 0.800, ny: 0.270 },
  { label: 'SUMMER TRIANGLE',nx: 0.760, ny: 0.440 },
];

// ── Helper: map magnitude → radius ──────────────────────────────────────────
// Full range: −2 (Sirius) → 6 (naked-eye limit)
// Produces radii from ~12 px (brightest) down to ~0.8 px (faintest pinpricks)
function magToRadius(mag: number): number {
  const clamped = Math.max(-2, Math.min(6, mag));
  return Math.max(0.8, 9.5 - clamped * 1.35);
}

// ── Helper: star disc colour by spectral type / magnitude ────────────────────
function starColor(id: string, mag: number): string {
  if (id === 'betelgeuse' || id === 'antares') return '#ff8050';  // M-type red giants
  if (id === 'rigel'  || id === 'vega')        return '#cce8ff';  // B-type blue-white
  if (id === 'sirius')                          return '#e8f4ff';  // A-type hot white
  if (id === 'altair' || id === 'deneb')        return '#ffffee';  // A/F yellow-white
  if (mag > 4)                                  return '#60607a';  // very faint
  if (mag > 3)                                  return '#8888a0';  // faint
  return '#ffffff';                                                // generic white
}

export const ConstellationMap: Story = {
  name: 'Constellation Map',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const W = container.clientWidth  || 900;
    const H = container.clientHeight || 620;

    const canvas = new Canvas({
      container,
      width:  W,
      height: H,
      backgroundColor: '#05040f',
    });
    await canvas.init();

    const draw = new DrawingPlugin({ key: 'constellation-map', zIndex: 10 });
    await canvas.plugins.register(draw);

    // Build a lookup from star id → canvas pixel position
    const pos = new Map<string, { x: number; y: number }>();
    for (const s of STARS) {
      pos.set(s.id, { x: s.nx * W, y: s.ny * H });
    }

    // ── Milky Way band — soft bezier swaths ─────────────────────────────────
    // Three overlapping semi-transparent bezier ribbons to simulate the band
    const milkyWayStrokes: Array<{
      from: { x: number; y: number };
      cp1:  { x: number; y: number };
      cp2:  { x: number; y: number };
      to:   { x: number; y: number };
      width: number;
      alpha: number;
    }> = [
      {
        from: { x: W * 0.05, y: H * 0.40 },
        cp1:  { x: W * 0.30, y: H * 0.20 },
        cp2:  { x: W * 0.65, y: H * 0.55 },
        to:   { x: W * 0.95, y: H * 0.65 },
        width: 90, alpha: 0.06,
      },
      {
        from: { x: W * 0.05, y: H * 0.45 },
        cp1:  { x: W * 0.28, y: H * 0.25 },
        cp2:  { x: W * 0.62, y: H * 0.52 },
        to:   { x: W * 0.95, y: H * 0.60 },
        width: 55, alpha: 0.09,
      },
      {
        from: { x: W * 0.05, y: H * 0.43 },
        cp1:  { x: W * 0.32, y: H * 0.22 },
        cp2:  { x: W * 0.64, y: H * 0.54 },
        to:   { x: W * 0.95, y: H * 0.62 },
        width: 28, alpha: 0.13,
      },
    ];

    for (const mw of milkyWayStrokes) {
      draw.bezier(
        mw.from, mw.cp1, mw.to,
        { stroke: '#c8b8ff', strokeWidth: mw.width, strokeAlpha: mw.alpha },
        mw.cp2,
      );
    }

    // ── Constellation stick figures (dashed lines) ───────────────────────────
    for (const line of CONSTELLATION_LINES) {
      const a = pos.get(line.stars[0]);
      const b = pos.get(line.stars[1]);
      if (!a || !b) continue;

      draw.dashedLine(a.x, a.y, b.x, b.y, {
        color:       '#7090c8',
        strokeWidth: 1,
        alpha:       0.55,
        dashLength:  6,
        gapLength:   5,
      });
    }

    // ── Stars: glow halo + solid disc ────────────────────────────────────────
    for (const star of STARS) {
      const { x, y } = pos.get(star.id)!;
      const r = magToRadius(star.mag);

      // Outer glow — only for stars bright enough to warrant it (mag < 3.5)
      if (star.mag < 3.5) {
        const glowSize = r * (star.mag < 1 ? 3.5 : 2.2);
        const glowAlpha = Math.max(0.06, 0.48 - star.mag * 0.09);
        draw.circleGlow(
          { x, y, radius: r, glowSize },
          { color: '#ffffff', alpha: glowAlpha },
        );
      }

      const fill = starColor(star.id, star.mag);
      draw.circle(x, y, r, {
        fill,
        stroke:      fill,
        strokeWidth: r > 1.5 ? 0.5 : 0,
      });
    }

    // ── Pulsar: ripple rings ──────────────────────────────────────────────────
    const pulsar = pos.get('psr_b0833')!;
    // Three concentric rings of decreasing opacity to simulate EM pulses
    const pulseRings = [
      { r: 22, alpha: 0.60 },
      { r: 38, alpha: 0.35 },
      { r: 55, alpha: 0.18 },
    ];
    for (const pr of pulseRings) {
      draw.rippleRing(pulsar.x, pulsar.y, pr.r, {
        color: '#00ffcc',
        alpha: pr.alpha,
      });
    }
    // Bright core
    draw.circleGlow(
      { x: pulsar.x, y: pulsar.y, radius: 5, glowSize: 20 },
      { color: '#00ffcc', alpha: 0.55 },
    );
    draw.circle(pulsar.x, pulsar.y, 4, { fill: '#00ffcc' });

    // ── Star name labels ─────────────────────────────────────────────────────
    for (const star of STARS) {
      if (!star.name) continue;
      const { x, y } = pos.get(star.id)!;
      const r = magToRadius(star.mag);
      draw.label(star.name, x, y + r + 7, {
        color:    '#a8bce0',
        fontSize: 10,
        align:    'center',
      });
    }

    // ── Constellation title labels ────────────────────────────────────────────
    for (const cl of CONSTELLATION_LABELS) {
      draw.label(cl.label, cl.nx * W, cl.ny * H, {
        color:    '#4a6a9a',
        fontSize: 11,
        align:    'center',
      });
    }

    // ── Chart title ───────────────────────────────────────────────────────────
    draw.label('NORTHERN SKY — CONSTELLATION ATLAS', W / 2, 14, {
      color:    '#8899bb',
      fontSize: 13,
      align:    'center',
    });
  },
};
