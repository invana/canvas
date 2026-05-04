/**
 * Demos `drawPolygon` — bypassing ShapesRenderer entirely.
 *
 * Stories:
 *   `Polygon`    — single hexagon then regular n-gons (3–8 sides) in one Graphics.
 *   `SBGNGlyphs` — polygon-based SBGN entity-pool-node glyphs:
 *                    Phenotype (flat hexagon), Complex (cut-corner octagon),
 *                    Perturbing Agent (parallelogram), Source/Sink (hollow triangle),
 *                    Gene locus (pentagon).
 *
 * All coordinates are pre-computed literals.  No Math.cos/sin at story runtime.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, draw } from '@invana/canvas';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Polygon' };
export default meta;
type Story = StoryObj;

// ─── Polygon ──────────────────────────────────────────────────────────────────

export const Polygon: Story = {
  render: () => createContainer({ id: 'cvs-polygon' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-polygon')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'polygon-layer', options: {} });
    canvas.layers.add(layer);

    // Single hexagon (pointy-top, r=55) — one Graphics, one shape.
    const g1 = layer.createGraphics('hex-single');
    draw.drawPolygon(g1, {
      kind: 'polygon', x: 0, y: 0,
      points: [
        { x:   0, y: -55 }, { x: 47.6, y: -27.5 },
        { x: 47.6, y: 27.5 }, { x:   0, y:  55 },
        { x: -47.6, y: 27.5 }, { x: -47.6, y: -27.5 },
      ],
      fill: 0x4f9cf9, fillAlpha: 0.2, stroke: 0x1e3a8a, strokeWidth: 3,
    });

    // Regular n-gons 3–8, r=50, all in one Graphics.
    // Points inscribed in circle of radius 50, all pointing up (first vertex at top).
    const g2 = layer.createGraphics('polygon-multi');

    // Triangle, r=50, pointing up.
    draw.drawPolygon(g2, {
      kind: 'polygon', x: 180, y: 0,
      points: [{ x: 0, y: -50 }, { x: 43.3, y: 25 }, { x: -43.3, y: 25 }],
      fill: 0xef4444, fillAlpha: 0.2, stroke: 0x991b1b, strokeWidth: 2,
    });

    // Diamond (4-sided), rx=40, ry=55.
    draw.drawPolygon(g2, {
      kind: 'polygon', x: 340, y: 0,
      points: [{ x: 0, y: -55 }, { x: 40, y: 0 }, { x: 0, y: 55 }, { x: -40, y: 0 }],
      fill: 0xf59e0b, fillAlpha: 0.2, stroke: 0x92400e, strokeWidth: 2,
    });

    // Pentagon, r=50, pointing up.
    draw.drawPolygon(g2, {
      kind: 'polygon', x: 500, y: 0,
      points: [
        { x:  0,    y: -50   }, { x:  47.6, y: -15.5 },
        { x:  29.4, y:  40.5 }, { x: -29.4, y:  40.5 },
        { x: -47.6, y: -15.5 },
      ],
      fill: 0x10b981, fillAlpha: 0.2, stroke: 0x065f46, strokeWidth: 2,
    });

    // Hexagon (flat-top), r=50.
    draw.drawPolygon(g2, {
      kind: 'polygon', x: 660, y: 0,
      points: [
        { x:  50, y:   0 }, { x:  25, y:  43.3 },
        { x: -25, y:  43.3 }, { x: -50, y:   0 },
        { x: -25, y: -43.3 }, { x:  25, y: -43.3 },
      ],
      fill: 0xa855f7, fillAlpha: 0.2, stroke: 0x6b21a8, strokeWidth: 2,
    });

    // Heptagon, r=50, pointing up.
    draw.drawPolygon(g2, {
      kind: 'polygon', x: 820, y: 0,
      points: [
        { x:  0,    y: -50   }, { x:  43.4, y: -21.7 },
        { x:  49.2, y:  17.1 }, { x:  21.7, y:  46.0 },
        { x: -21.7, y:  46.0 }, { x: -49.2, y:  17.1 },
        { x: -43.4, y: -21.7 },
      ],
      fill: 0x0ea5e9, fillAlpha: 0.2, stroke: 0x0369a1, strokeWidth: 2,
    });

    // Octagon, r=50, flat edges on top/bottom.
    draw.drawPolygon(g2, {
      kind: 'polygon', x: 980, y: 0,
      points: [
        { x:  20.7, y: -46.2 }, { x:  46.2, y: -20.7 },
        { x:  46.2, y:  20.7 }, { x:  20.7, y:  46.2 },
        { x: -20.7, y:  46.2 }, { x: -46.2, y:  20.7 },
        { x: -46.2, y: -20.7 }, { x: -20.7, y: -46.2 },
      ],
      fill: 0xec4899, fillAlpha: 0.2, stroke: 0x9d174d, strokeWidth: 2,
    });

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── SBGNGlyphs ───────────────────────────────────────────────────────────────
// Polygon-based SBGN entity-pool-node glyphs.
// Each glyph gets its own Graphics (independent redraw / decoration).

export const SBGNGlyphs: Story = {
  render: () => createContainer({ id: 'cvs-polygon-sbgn' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-polygon-sbgn')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'sbgn-layer', options: {} });
    canvas.layers.add(layer);

    // ── Phenotype (hexagon with flat left/right points) ───────────────────
    // SBGN: outcome node for a biological phenotype (e.g. cell proliferation).
    const gPhenotype = layer.createGraphics('phenotype');
    draw.drawPolygon(gPhenotype, {
      kind: 'polygon', x: 0, y: 0,
      points: [
        { x: -60, y:   0 }, { x: -30, y: -38 }, { x:  30, y: -38 },
        { x:  60, y:   0 }, { x:  30, y:  38 }, { x: -30, y:  38 },
      ],
      fill: 0x10b981, fillAlpha: 0.15, stroke: 0x065f46, strokeWidth: 2,
    });

    // ── Complex (cut-corner octagon) ──────────────────────────────────────
    // SBGN: non-covalent molecular complex (e.g. a receptor dimer, ribosome).
    // W=140, H=90, corner cut=18.
    const gComplex = layer.createGraphics('complex');
    draw.drawPolygon(gComplex, {
      kind: 'polygon', x: 210, y: 0,
      points: [
        { x: -52, y: -45 }, { x:  52, y: -45 },
        { x:  70, y: -27 }, { x:  70, y:  27 },
        { x:  52, y:  45 }, { x: -52, y:  45 },
        { x: -70, y:  27 }, { x: -70, y: -27 },
      ],
      fill: 0x8b5cf6, fillAlpha: 0.15, stroke: 0x6d28d9, strokeWidth: 2,
    });
    // Sub-units inside the complex — also polygons (small cut-corner quads).
    draw.drawPolygon(gComplex, {
      kind: 'polygon', x: 198, y: -10,
      points: [
        { x: -22, y: -14 }, { x: 22, y: -14 },
        { x: 26, y: -8  }, { x: 26, y:  8  },
        { x: 22, y:  14 }, { x: -22, y:  14 },
        { x: -26, y:  8 }, { x: -26, y:  -8 },
      ],
      fill: 0xc4b5fd, fillAlpha: 0.5, stroke: 0x7c3aed, strokeWidth: 1,
    });
    draw.drawPolygon(gComplex, {
      kind: 'polygon', x: 222, y: 10,
      points: [
        { x: -22, y: -14 }, { x: 22, y: -14 },
        { x: 26, y: -8  }, { x: 26, y:  8  },
        { x: 22, y:  14 }, { x: -22, y:  14 },
        { x: -26, y:  8 }, { x: -26, y:  -8 },
      ],
      fill: 0xc4b5fd, fillAlpha: 0.5, stroke: 0x7c3aed, strokeWidth: 1,
    });

    // ── Perturbing Agent (parallelogram) ──────────────────────────────────
    // SBGN: physical or chemical perturbation (drug, temperature, radiation).
    // W=130, H=60, lean=22.  Centroid at origin: (-43,-30),(87,-30),(43,30),(-87,30).
    const gPerturber = layer.createGraphics('perturbing-agent');
    draw.drawPolygon(gPerturber, {
      kind: 'polygon', x: 420, y: 0,
      points: [
        { x: -43, y: -30 }, { x:  87, y: -30 },
        { x:  43, y:  30 }, { x: -87, y:  30 },
      ],
      fill: 0xf59e0b, fillAlpha: 0.15, stroke: 0xb45309, strokeWidth: 2,
    });

    // ── Source / Sink (hollow triangle = degradation drain) ───────────────
    // SBGN: represents an unspecified source or a degradation target.
    // Rendered as two triangles (outer filled lightly, inner filled white).
    const gSourceSink = layer.createGraphics('source-sink');
    draw.drawPolygon(gSourceSink, {
      kind: 'polygon', x: 620, y: 0,
      points: [{ x: -46, y: -38 }, { x: 46, y: -38 }, { x: 0, y: 42 }],
      fill: 0x64748b, fillAlpha: 0.12, stroke: 0x334155, strokeWidth: 2,
    });
    draw.drawPolygon(gSourceSink, {
      kind: 'polygon', x: 620, y: 0,
      points: [{ x: -27, y: -20 }, { x: 27, y: -20 }, { x: 0, y: 26 }],
      fill: 0xffffff, fillAlpha: 0.9, stroke: 0x334155, strokeWidth: 1,
    });

    // ── Gene locus (5-sided right-arrow pentagon) ─────────────────────────
    // Common in pathway maps: a forward-facing pentagon to mark a gene or
    // promoter element on a chromosome.
    const gGene = layer.createGraphics('gene-locus');
    draw.drawPolygon(gGene, {
      kind: 'polygon', x: 800, y: 0,
      points: [
        { x: -52, y: -32 }, { x:  20, y: -32 },
        { x:  52, y:   0 }, { x:  20, y:  32 },
        { x: -52, y:  32 },
      ],
      fill: 0x3b82f6, fillAlpha: 0.15, stroke: 0x1d4ed8, strokeWidth: 2,
    });

    // ── Viral capsid (icosahedral approximation, 12-sided) ────────────────
    // Not strict SBGN but common in infection-pathway diagrams.
    // r=45, 12 equal vertices.
    const gVirus = layer.createGraphics('viral-capsid');
    draw.drawPolygon(gVirus, {
      kind: 'polygon', x: 970, y: 0,
      points: [
        { x:  0,    y: -45   }, { x:  22.5, y: -38.97 },
        { x:  38.97, y: -22.5 }, { x:  45,    y:   0    },
        { x:  38.97, y:  22.5 }, { x:  22.5, y:  38.97 },
        { x:  0,    y:  45   }, { x: -22.5, y:  38.97 },
        { x: -38.97, y:  22.5 }, { x: -45,    y:   0    },
        { x: -38.97, y: -22.5 }, { x: -22.5, y: -38.97 },
      ],
      fill: 0xef4444, fillAlpha: 0.12, stroke: 0x991b1b, strokeWidth: 2,
    });
    // Inner ring — double-membrane capsid wall.
    draw.drawPolygon(gVirus, {
      kind: 'polygon', x: 970, y: 0,
      points: [
        { x:  0,    y: -32   }, { x:  16,   y: -27.7 },
        { x:  27.7, y: -16   }, { x:  32,   y:   0   },
        { x:  27.7, y:  16   }, { x:  16,   y:  27.7 },
        { x:  0,    y:  32   }, { x: -16,   y:  27.7 },
        { x: -27.7, y:  16   }, { x: -32,   y:   0   },
        { x: -27.7, y: -16   }, { x: -16,   y: -27.7 },
      ],
      fill: 0xfef2f2, fillAlpha: 0.7, stroke: 0xfca5a5, strokeWidth: 1,
    });

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
