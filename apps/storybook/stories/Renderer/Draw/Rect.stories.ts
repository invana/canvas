/**
 * Demos `drawRect` — bypassing ShapesRenderer entirely.
 *
 * Stories:
 *   `Rect`         — single rect then a set of rects showing corner-radius variants.
 *   `Macromolecule`— SBGN macromolecule glyphs (proteins): rounded rectangles.
 *   `Compartment`  — SBGN compartment hierarchy: outer cell, inner nucleus, process nodes.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, draw } from '@invana/canvas';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Rect' };
export default meta;
type Story = StoryObj;

// ─── Rect ─────────────────────────────────────────────────────────────────────

export const Rect: Story = {
  render: () => createContainer({ id: 'cvs-rect' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-rect')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'rect-layer', options: {} });
    canvas.layers.add(layer);

    // Single rect — one Graphics, one shape.
    const g1 = layer.createGraphics('rect-single');
    draw.drawRect(g1, {
      kind: 'rect', x: 0, y: 0, width: 160, height: 90,
      cornerRadius: 12, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 3,
    });

    // Multiple rects — all in one Graphics.
    const g2 = layer.createGraphics('rect-multi');
    const rects = [
      // sharp corners
      { x: 250, y: -25, width: 130, height: 70, cornerRadius: 0,  fill: 0xef4444, stroke: 0x991b1b, strokeWidth: 2 },
      // mild radius
      { x: 420, y: -25, width: 130, height: 70, cornerRadius: 12, fill: 0xf59e0b, stroke: 0x92400e, strokeWidth: 2 },
      // pill
      { x: 590, y: -25, width: 130, height: 70, cornerRadius: 35, fill: 0x10b981, stroke: 0x065f46, strokeWidth: 2 },
      // semi-transparent fill
      { x: 340, y:  90, width: 160, height: 60, cornerRadius: 8,  fill: 0xa855f7, fillAlpha: 0.3, stroke: 0x6b21a8, strokeWidth: 2 },
      // stroke only
      { x: 545, y:  90, width: 140, height: 60, cornerRadius: 8,  stroke: 0x64748b, strokeWidth: 3 },
    ];
    for (const r of rects) {
      draw.drawRect(g2, { kind: 'rect', ...r });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── Macromolecule ────────────────────────────────────────────────────────────
// SBGN PD: macromolecule glyph = rectangle with rounded corners.
// Used for proteins, enzymes, and other macromolecular species.
// Each protein gets its own Graphics so the layer can redraw it independently.

export const Macromolecule: Story = {
  render: () => createContainer({ id: 'cvs-rect-macro' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-rect-macro')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'macro-layer', options: {} });
    canvas.layers.add(layer);

    // EGFR→RAS→RAF→MEK→ERK signalling cascade.
    const proteins = [
      { label: 'EGFR', x:  0,   y:   0, width: 130, height: 60, fill: 0x3b82f6 },
      { label: 'RAS',  x: 200,  y:   0, width: 110, height: 60, fill: 0x3b82f6 },
      { label: 'RAF',  x: 380,  y:   0, width: 110, height: 60, fill: 0x8b5cf6 },
      { label: 'MEK',  x: 100,  y: 110, width: 110, height: 60, fill: 0x8b5cf6 },
      { label: 'ERK',  x: 280,  y: 110, width: 110, height: 60, fill: 0xec4899 },
    ];
    for (const p of proteins) {
      const g = layer.createGraphics(`protein-${p.label}`);
      draw.drawRect(g, {
        kind: 'rect', x: p.x, y: p.y, width: p.width, height: p.height,
        cornerRadius: 14, fill: p.fill, fillAlpha: 0.15, stroke: p.fill, strokeWidth: 2,
      });
    }

    // Phosphorylated (active) state — bolder fill, same batch per state.
    const gActive = layer.createGraphics('proteins-active');
    const active = [
      { x: 490, y:   0, width: 110, height: 60, fill: 0xf97316 },
      { x: 490, y: 110, width: 110, height: 60, fill: 0xf97316 },
    ];
    for (const a of active) {
      draw.drawRect(gActive, {
        kind: 'rect', x: a.x, y: a.y, width: a.width, height: a.height,
        cornerRadius: 14, fill: a.fill, fillAlpha: 0.5, stroke: a.fill, strokeWidth: 3,
      });
    }

    // State variable badge — small square overlaid on protein corner.
    const gBadge = layer.createGraphics('state-badges');
    const badges = [
      { x: 335, y: -25 }, { x: 430, y: -25 },
      { x: 145, y:  85 }, { x: 325, y:  85 }, { x: 535, y:  85 },
    ];
    for (const b of badges) {
      draw.drawRect(gBadge, {
        kind: 'rect', x: b.x, y: b.y, width: 20, height: 20,
        cornerRadius: 4, fill: 0xf97316, stroke: 0xc2410c, strokeWidth: 1,
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── Compartment ──────────────────────────────────────────────────────────────
// SBGN compartment = rounded rectangle wrapping entity-pool nodes.
// Process nodes (SBGN reaction squares) appear between macromolecules.

export const Compartment: Story = {
  render: () => createContainer({ id: 'cvs-rect-compartment' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-rect-compartment')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'compartment-layer', options: {} });
    canvas.layers.add(layer);

    // Outer cell compartment.
    const gOuter = layer.createGraphics('cell');
    draw.drawRect(gOuter, {
      kind: 'rect', x: 270, y: 155, width: 540, height: 310,
      cornerRadius: 36, fill: 0xfef9f0, fillAlpha: 0.6, stroke: 0x92400e, strokeWidth: 3,
    });

    // Nuclear compartment (sub-region inside cell).
    const gNucleus = layer.createGraphics('nucleus');
    draw.drawRect(gNucleus, {
      kind: 'rect', x: 270, y: 120, width: 220, height: 120,
      cornerRadius: 24, fill: 0xdbeafe, fillAlpha: 0.7, stroke: 0x1d4ed8, strokeWidth: 2,
    });

    // Macromolecule nodes inside the compartments.
    const gProteins = layer.createGraphics('proteins');
    const proteins = [
      { x:  90, y:  90 }, { x: 270, y:  90 }, { x: 440, y:  90 },
      { x:  90, y: 215 }, { x: 440, y: 215 },
    ];
    for (const p of proteins) {
      draw.drawRect(gProteins, {
        kind: 'rect', x: p.x, y: p.y, width: 110, height: 52,
        cornerRadius: 12, fill: 0x3b82f6, fillAlpha: 0.18, stroke: 0x3b82f6, strokeWidth: 2,
      });
    }

    // Process nodes — small squares representing biochemical reactions.
    const gProcesses = layer.createGraphics('processes');
    const processes = [
      { x: 183, y:  90 }, { x: 357, y:  90 },
      { x: 183, y: 215 }, { x: 357, y: 215 },
      { x: 270, y: 152 },
    ];
    for (const p of processes) {
      draw.drawRect(gProcesses, {
        kind: 'rect', x: p.x, y: p.y, width: 22, height: 22,
        fill: 0x0f172a, stroke: 0x0f172a, strokeWidth: 1,
      });
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
