/**
 * Demos `drawPath` — bypassing ShapesRenderer entirely.
 *
 * Stories:
 *   `Path`              — single chevron + open L-shape, S-curve, lightning bolt.
 *   `NucleicAcidFeature`— SBGN nucleic acid feature glyph (flat top, rounded bottom),
 *                         for genes, mRNA, and other nucleic acid species.
 *   `Receptor`          — Y-shaped transmembrane receptor: extracellular arms, TM
 *                         stem, and a lipid-bilayer band — all as path commands only.
 *
 * No other draw primitives (circle, rect, ellipse, polygon) are used.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, draw } from '@invana/canvas';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Path' };
export default meta;
type Story = StoryObj;

// ─── Path ─────────────────────────────────────────────────────────────────────

export const Path: Story = {
  render: () => createContainer({ id: 'cvs-path' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-path')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'path-layer', options: {} });
    canvas.layers.add(layer);

    // Single closed path — right-pointing chevron arrow.
    const g1 = layer.createGraphics('chevron');
    draw.drawPath(g1, {
      kind: 'path', x: 0, y: 0,
      commands: [
        { kind: 'moveTo', x: -50, y: -45 },
        { kind: 'lineTo', x:  10, y: -45 },
        { kind: 'lineTo', x:  55, y:   0 },
        { kind: 'lineTo', x:  10, y:  45 },
        { kind: 'lineTo', x: -50, y:  45 },
        { kind: 'lineTo', x:  -5, y:   0 },
        { kind: 'close' },
      ],
      fill: 0x4f9cf9, fillAlpha: 0.25, stroke: 0x1e3a8a, strokeWidth: 2,
    });

    // Multiple paths in one Graphics — different open/closed shapes.
    const g2 = layer.createGraphics('path-multi');

    // Open L-shape (stroke only — no fill).
    draw.drawPath(g2, {
      kind: 'path', x: 200, y: 20,
      commands: [
        { kind: 'moveTo', x: -40, y: -55 },
        { kind: 'lineTo', x: -40, y:  45 },
        { kind: 'lineTo', x:  40, y:  45 },
      ],
      stroke: 0x10b981, strokeWidth: 4,
    });

    // Closed lightning bolt — signal cascade activation arrow.
    draw.drawPath(g2, {
      kind: 'path', x: 360, y: 0,
      commands: [
        { kind: 'moveTo', x:  18, y: -60 },
        { kind: 'lineTo', x: -15, y:   5 },
        { kind: 'lineTo', x:  12, y:   5 },
        { kind: 'lineTo', x: -18, y:  60 },
        { kind: 'lineTo', x:  15, y:  -5 },
        { kind: 'lineTo', x: -12, y:  -5 },
        { kind: 'close' },
      ],
      fill: 0xf59e0b, fillAlpha: 0.8, stroke: 0x92400e, strokeWidth: 1,
    });

    // Open S-curve via quadTo — models a kinked signalling pathway.
    draw.drawPath(g2, {
      kind: 'path', x: 530, y: 0,
      commands: [
        { kind: 'moveTo', x: -40, y: -55 },
        { kind: 'quadTo', cpx:  60, cpy: -20, x:   0, y:  0 },
        { kind: 'quadTo', cpx: -60, cpy:  20, x:  40, y: 55 },
      ],
      stroke: 0xa855f7, strokeWidth: 4,
    });

    // Closed starburst — cell stress / activation marker.
    draw.drawPath(g2, {
      kind: 'path', x: 700, y: 0,
      commands: [
        { kind: 'moveTo', x:   0, y: -55 },
        { kind: 'lineTo', x:  12, y: -18 },
        { kind: 'lineTo', x:  52, y: -18 },
        { kind: 'lineTo', x:  20, y:   5 },
        { kind: 'lineTo', x:  32, y:  47 },
        { kind: 'lineTo', x:   0, y:  25 },
        { kind: 'lineTo', x: -32, y:  47 },
        { kind: 'lineTo', x: -20, y:   5 },
        { kind: 'lineTo', x: -52, y: -18 },
        { kind: 'lineTo', x: -12, y: -18 },
        { kind: 'close' },
      ],
      fill: 0xef4444, fillAlpha: 0.2, stroke: 0x991b1b, strokeWidth: 2,
    });

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── NucleicAcidFeature ───────────────────────────────────────────────────────
// SBGN PD nucleic acid feature glyph: flat top, rounded (semicircular) bottom.
// Used for genes, mRNAs, miRNAs, and other nucleic acid species.

export const NucleicAcidFeature: Story = {
  render: () => createContainer({ id: 'cvs-path-naf' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-path-naf')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'naf-layer', options: {} });
    canvas.layers.add(layer);

    // Single glyph — flat top, two quadTo curves for the rounded bottom.
    const g1 = layer.createGraphics('naf-single');
    draw.drawPath(g1, {
      kind: 'path', x: 0, y: 0,
      commands: [
        { kind: 'moveTo', x: -55, y: -42 },  // top-left
        { kind: 'lineTo', x:  55, y: -42 },  // top-right
        { kind: 'lineTo', x:  55, y:   8 },  // right side down
        { kind: 'quadTo', cpx:  55, cpy:  50, x:   0, y:  50 },  // bottom-right arc
        { kind: 'quadTo', cpx: -55, cpy:  50, x: -55, y:   8 },  // bottom-left arc
        { kind: 'close' },
      ],
      fill: 0x10b981, fillAlpha: 0.15, stroke: 0x065f46, strokeWidth: 2,
    });

    // Gene cluster — four glyphs with different widths (gene length) and colours.
    const g2 = layer.createGraphics('naf-cluster');
    const genes = [
      { x: 210, y: 0, hw: 55, hh: 45, fill: 0x3b82f6, stroke: 0x1d4ed8 },  // gene A
      { x: 360, y: 0, hw: 38, hh: 45, fill: 0x8b5cf6, stroke: 0x6d28d9 },  // gene B (shorter)
      { x: 490, y: 0, hw: 65, hh: 45, fill: 0xf59e0b, stroke: 0xb45309 },  // gene C (longer)
      { x: 660, y: 0, hw: 45, hh: 45, fill: 0xef4444, stroke: 0x991b1b },  // gene D
    ];
    for (const gene of genes) {
      const { x, y, hw, hh, fill, stroke } = gene;
      const curveStart = hh * 0.25;
      draw.drawPath(g2, {
        kind: 'path', x, y,
        commands: [
          { kind: 'moveTo', x: -hw, y: -hh },
          { kind: 'lineTo', x:  hw, y: -hh },
          { kind: 'lineTo', x:  hw, y:  curveStart },
          { kind: 'quadTo', cpx:  hw, cpy: hh, x:  0, y:  hh },
          { kind: 'quadTo', cpx: -hw, cpy: hh, x: -hw, y: curveStart },
          { kind: 'close' },
        ],
        fill, fillAlpha: 0.15, stroke, strokeWidth: 2,
      });
    }

    // State variable indicators — small rectangular notches cut into the top
    // of each gene glyph, drawn as closed path overlays.
    const g3 = layer.createGraphics('naf-state-vars');
    const stateVarX = [210, 360, 490, 660];
    for (const x of stateVarX) {
      draw.drawPath(g3, {
        kind: 'path', x, y: -45,
        commands: [
          { kind: 'moveTo', x: -10, y:  0 },
          { kind: 'lineTo', x:  10, y:  0 },
          { kind: 'lineTo', x:  10, y: 14 },
          { kind: 'lineTo', x: -10, y: 14 },
          { kind: 'close' },
        ],
        fill: 0xfbbf24, fillAlpha: 0.8, stroke: 0xb45309, strokeWidth: 1,
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── Receptor ─────────────────────────────────────────────────────────────────
// Y-shaped transmembrane receptor drawn entirely with path commands:
//   - lipid bilayer: two horizontal open paths
//   - extracellular arms: curved open V-paths
//   - transmembrane stem: vertical open path
//   - intracellular kinase domain: closed diamond path
//
// No drawCircle / drawEllipse / drawRect — pure drawPath.

export const Receptor: Story = {
  render: () => createContainer({ id: 'cvs-path-receptor' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-path-receptor')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'receptor-layer', options: {} });
    canvas.layers.add(layer);

    // ── Lipid bilayer — two horizontal bands ─────────────────────────────
    const gMembrane = layer.createGraphics('bilayer');
    draw.drawPath(gMembrane, {
      kind: 'path', x: 0, y: 0,
      commands: [
        { kind: 'moveTo', x: -300, y: -5  },
        { kind: 'lineTo', x:  300, y: -5  },
        { kind: 'moveTo', x: -300, y:  15 },
        { kind: 'lineTo', x:  300, y:  15 },
      ],
      stroke: 0xd97706, strokeWidth: 8, strokeAlpha: 0.35,
    });

    // ── Four receptor monomers ────────────────────────────────────────────
    const receptors = [
      { x: -185, fillColor: 0x3b82f6, stemColor: 0x1d4ed8 },  // EGFR-A
      { x:  -65, fillColor: 0x3b82f6, stemColor: 0x1d4ed8 },  // EGFR-B (dimerising)
      { x:   85, fillColor: 0x8b5cf6, stemColor: 0x6d28d9 },  // Insulin receptor
      { x:  205, fillColor: 0xef4444, stemColor: 0x991b1b },  // Cytokine receptor
    ];

    for (const r of receptors) {
      // Extracellular V-arms — curved open path.
      const gArms = layer.createGraphics(`arms-${r.x}`);
      draw.drawPath(gArms, {
        kind: 'path', x: r.x, y: 0,
        commands: [
          { kind: 'moveTo', x: -44, y: -80 },
          { kind: 'quadTo', cpx: -20, cpy: -40, x: 0, y: -10 },
          { kind: 'quadTo', cpx:  20, cpy: -40, x: 44, y: -80 },
        ],
        stroke: r.fillColor, strokeWidth: 10, strokeAlpha: 0.7,
      });

      // Transmembrane + intracellular stem — vertical open path.
      const gStem = layer.createGraphics(`stem-${r.x}`);
      draw.drawPath(gStem, {
        kind: 'path', x: r.x, y: 0,
        commands: [
          { kind: 'moveTo', x: 0, y: -10 },
          { kind: 'lineTo', x: 0, y:  65 },
        ],
        stroke: r.stemColor, strokeWidth: 10, strokeAlpha: 0.7,
      });

      // Kinase domain — closed diamond path at stem base.
      const gKinase = layer.createGraphics(`kinase-${r.x}`);
      draw.drawPath(gKinase, {
        kind: 'path', x: r.x, y: 80,
        commands: [
          { kind: 'moveTo', x:  0, y: -18 },
          { kind: 'lineTo', x:  18, y:  0 },
          { kind: 'lineTo', x:  0, y:  18 },
          { kind: 'lineTo', x: -18, y:  0 },
          { kind: 'close' },
        ],
        fill: r.stemColor, fillAlpha: 0.3, stroke: r.stemColor, strokeWidth: 2,
      });
    }

    // ── Ligands — drawn as closed teardrop paths ──────────────────────────
    // Binding to extracellular domains of the EGFR dimer.
    const gLigands = layer.createGraphics('ligands');
    const ligandPositions = [{ x: -220, y: -108 }, { x: -30, y: -108 }];
    for (const lp of ligandPositions) {
      draw.drawPath(gLigands, {
        kind: 'path', x: lp.x, y: lp.y,
        commands: [
          { kind: 'moveTo', x:  0, y: -22 },
          { kind: 'quadTo', cpx:  22, cpy: -22, x:  22, y:  0 },
          { kind: 'quadTo', cpx:  22, cpy:  22, x:   0, y:  22 },
          { kind: 'quadTo', cpx: -22, cpy:  22, x: -22, y:  0 },
          { kind: 'quadTo', cpx: -22, cpy: -22, x:   0, y: -22 },
          { kind: 'close' },
        ],
        fill: 0xf59e0b, fillAlpha: 0.75, stroke: 0xb45309, strokeWidth: 2,
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
