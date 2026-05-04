/**
 * Demos `drawEllipse` — bypassing ShapesRenderer entirely.
 *
 * Stories:
 *   `Ellipse`          — single ellipse then varied rx/ry shapes in one Graphics.
 *   `CellCrossSection` — nested ellipses: plasma membrane, nucleus, nucleolus,
 *                        mitochondria, endosomes.
 *   `Vesicles`         — Golgi cisternae + secretory/endocytic vesicles.
 *
 * All shapes use only `drawEllipse`.  "Simple chemical" circles are rendered
 * as ellipses with rx === ry — no drawCircle needed.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, draw } from '@invana/canvas';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Ellipse' };
export default meta;
type Story = StoryObj;

// ─── Ellipse ──────────────────────────────────────────────────────────────────

export const Ellipse: Story = {
  render: () => createContainer({ id: 'cvs-ellipse' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-ellipse')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'ellipse-layer', options: {} });
    canvas.layers.add(layer);

    // Single ellipse — one Graphics, one shape.
    const g1 = layer.createGraphics('ellipse-single');
    draw.drawEllipse(g1, {
      kind: 'ellipse', x: 0, y: 0, rx: 100, ry: 60,
      fill: 0x4f9cf9, fillAlpha: 0.2, stroke: 0x1e3a8a, strokeWidth: 3,
    });

    // Multiple ellipses — one Graphics, varied rx/ry.
    const g2 = layer.createGraphics('ellipse-multi');
    const ellipses = [
      // near-circle
      { x: 280, y: -20, rx: 55,  ry: 50,  fill: 0xef4444, fillAlpha: 0.2, stroke: 0x991b1b, strokeWidth: 2 },
      // wide / flat
      { x: 470, y:  10, rx: 90,  ry: 35,  fill: 0xf59e0b, fillAlpha: 0.2, stroke: 0x92400e, strokeWidth: 2 },
      // tall / narrow
      { x: 640, y:   0, rx: 30,  ry: 70,  fill: 0x10b981, fillAlpha: 0.2, stroke: 0x065f46, strokeWidth: 2 },
      // large semi-transparent
      { x: 460, y: 130, rx: 120, ry: 45,  fill: 0xa855f7, fillAlpha: 0.12, stroke: 0x6b21a8, strokeWidth: 2 },
      // stroke-only
      { x: 280, y: 120, rx: 48,  ry: 48,  stroke: 0x64748b, strokeWidth: 3 },
    ];
    for (const e of ellipses) {
      draw.drawEllipse(g2, { kind: 'ellipse', ...e });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── CellCrossSection ─────────────────────────────────────────────────────────
// Classic systems-biology cell cross-section.  Every sub-structure is an ellipse:
//   large outer ellipse  = plasma membrane
//   medium ellipse       = nucleus (with inner nucleolus)
//   small flat ellipses  = mitochondria (double-membrane: outer + inner)
//   tiny round ellipses  = endosomes / lysosomes

export const CellCrossSection: Story = {
  render: () => createContainer({ id: 'cvs-ellipse-cell' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-ellipse-cell')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'cell-layer', options: {} });
    canvas.layers.add(layer);

    // Plasma membrane.
    const gMembrane = layer.createGraphics('plasma-membrane');
    draw.drawEllipse(gMembrane, {
      kind: 'ellipse', x: 0, y: 0, rx: 240, ry: 170,
      fill: 0xfef9f0, fillAlpha: 0.6, stroke: 0x92400e, strokeWidth: 3,
    });

    // Nuclear envelope + nucleolus.
    const gNucleus = layer.createGraphics('nucleus');
    draw.drawEllipse(gNucleus, {
      kind: 'ellipse', x: -30, y: -20, rx: 90, ry: 70,
      fill: 0xdbeafe, fillAlpha: 0.7, stroke: 0x1d4ed8, strokeWidth: 2,
    });
    // Nucleolus — dense RNA/protein body.
    draw.drawEllipse(gNucleus, {
      kind: 'ellipse', x: -20, y: -15, rx: 30, ry: 22,
      fill: 0x1d4ed8, fillAlpha: 0.25, stroke: 0x1d4ed8, strokeWidth: 1,
    });

    // Mitochondria — each as outer + inner ellipse (cristae approximation).
    const gMito = layer.createGraphics('mitochondria');
    const mitochondria = [
      // outer, inner
      { ox: 130, oy: -60,  orx: 45, ory: 22, irx: 28, iry: 12 },
      { ox: 150, oy:  70,  orx: 50, ory: 20, irx: 32, iry: 11 },
      { ox: -140, oy: 50,  orx: 42, ory: 19, irx: 26, iry: 11 },
    ];
    for (const m of mitochondria) {
      draw.drawEllipse(gMito, {
        kind: 'ellipse', x: m.ox, y: m.oy, rx: m.orx, ry: m.ory,
        fill: 0xfde68a, fillAlpha: 0.5, stroke: 0xd97706, strokeWidth: 2,
      });
      draw.drawEllipse(gMito, {
        kind: 'ellipse', x: m.ox, y: m.oy, rx: m.irx, ry: m.iry,
        fill: 0xfbbf24, fillAlpha: 0.5, stroke: 0xd97706, strokeWidth: 1,
      });
    }

    // Endosomes / lysosomes — small round ellipses in the cytoplasm.
    const gEndosomes = layer.createGraphics('endosomes');
    const endosomes = [
      { x:  90, y:  90, rx: 14, ry: 14 },
      { x: 112, y: 110, rx: 10, ry: 10 },
      { x: -90, y: -80, rx: 12, ry: 12 },
      { x: -62, y: -96, rx:  9, ry:  9 },
      { x: 170, y:  12, rx: 11, ry: 11 },
    ];
    for (const v of endosomes) {
      draw.drawEllipse(gEndosomes, {
        kind: 'ellipse', x: v.x, y: v.y, rx: v.rx, ry: v.ry,
        fill: 0x10b981, fillAlpha: 0.3, stroke: 0x065f46, strokeWidth: 1,
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 60);
  },
};

// ─── Vesicles ─────────────────────────────────────────────────────────────────
// Secretory pathway: ER → Golgi → plasma membrane.
// All drawn with drawEllipse:
//   flat stacked ellipses  = Golgi cisternae
//   small round ellipses   = COP-II (anterograde), COP-I (retrograde), clathrin vesicles

export const Vesicles: Story = {
  render: () => createContainer({ id: 'cvs-ellipse-vesicles' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-ellipse-vesicles')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'vesicle-layer', options: {} });
    canvas.layers.add(layer);

    // Rough ER membrane — wide, very flat ellipse at the top.
    const gER = layer.createGraphics('rough-er');
    draw.drawEllipse(gER, {
      kind: 'ellipse', x: 0, y: -160, rx: 140, ry: 28,
      fill: 0xe0f2fe, fillAlpha: 0.7, stroke: 0x0284c7, strokeWidth: 2,
    });

    // Golgi stack — five progressively offset flat cisternae.
    const gGolgi = layer.createGraphics('golgi');
    const cisternae = [
      { x:  0, y: -70, rx: 100, ry: 14 },
      { x:  5, y: -45, rx: 110, ry: 14 },
      { x:  8, y: -20, rx: 115, ry: 14 },
      { x:  5, y:   5, rx: 110, ry: 14 },
      { x:  0, y:  30, rx: 100, ry: 14 },
    ];
    for (const c of cisternae) {
      draw.drawEllipse(gGolgi, {
        kind: 'ellipse', x: c.x, y: c.y, rx: c.rx, ry: c.ry,
        fill: 0xbfdbfe, fillAlpha: 0.7, stroke: 0x3b82f6, strokeWidth: 2,
      });
    }

    // COP-II vesicles — anterograde (ER → Golgi, right side, orange).
    const gCopII = layer.createGraphics('copII');
    const copII = [
      { x: 160, y: -130, rx: 18, ry: 16 },
      { x: 180, y: -105, rx: 16, ry: 15 },
      { x: 170, y:  -80, rx: 15, ry: 14 },
    ];
    for (const v of copII) {
      draw.drawEllipse(gCopII, {
        kind: 'ellipse', x: v.x, y: v.y, rx: v.rx, ry: v.ry,
        fill: 0xf97316, fillAlpha: 0.4, stroke: 0xc2410c, strokeWidth: 2,
      });
    }

    // COP-I vesicles — retrograde (Golgi → ER, left side, indigo).
    const gCopI = layer.createGraphics('copI');
    const copI = [
      { x: -160, y: -70, rx: 18, ry: 16 },
      { x: -178, y: -45, rx: 16, ry: 15 },
      { x: -168, y: -20, rx: 15, ry: 14 },
      { x: -158, y:   5, rx: 14, ry: 13 },
    ];
    for (const v of copI) {
      draw.drawEllipse(gCopI, {
        kind: 'ellipse', x: v.x, y: v.y, rx: v.rx, ry: v.ry,
        fill: 0x6366f1, fillAlpha: 0.4, stroke: 0x4338ca, strokeWidth: 2,
      });
    }

    // Clathrin-coated vesicles — endocytic, bottom (purple).
    const gClathrin = layer.createGraphics('clathrin');
    const clathrin = [
      { x: -45, y: 120, rx: 22, ry: 20 },
      { x:  20, y: 130, rx: 19, ry: 18 },
      { x:  82, y: 122, rx: 17, ry: 16 },
    ];
    for (const v of clathrin) {
      draw.drawEllipse(gClathrin, {
        kind: 'ellipse', x: v.x, y: v.y, rx: v.rx, ry: v.ry,
        fill: 0xa855f7, fillAlpha: 0.35, stroke: 0x7e22ce, strokeWidth: 2,
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
