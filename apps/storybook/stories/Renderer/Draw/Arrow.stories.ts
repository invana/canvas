/**
 * Demos `drawArrow` — the triangular arrowhead paint primitive from
 * `@invana/canvas`'s draw module, bypassing ShapesRenderer entirely.
 *
 * `ArrowSpec` places the tip at `(x, y)` and the tail at `x - size`.
 * The third parameter to `drawArrow(g, spec, ox, oy, rot)` is `rot` —
 * rotation around the tip, so 0 = pointing right, π/2 = pointing down, etc.
 *
 * Stories:
 *   `Arrow`           — single arrowhead then eight directional arrows + size variants.
 *   `PathwayArrows`   — arrows as used in biological pathway / SBGN diagrams:
 *                       activation (→), inhibition (⊣ flat-end), catalysis,
 *                       and modulation arrows pointing in typical cascade directions.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, draw } from '@invana/canvas';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Arrow' };
export default meta;
type Story = StoryObj;

// Convenience: Math.PI expressed as pre-computed fractions for readability.
const PI   = Math.PI;
const PI_2 = Math.PI / 2;
const PI_4 = Math.PI / 4;

// ─── Arrow ────────────────────────────────────────────────────────────────────

export const Arrow: Story = {
  render: () => createContainer({ id: 'cvs-arrow' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-arrow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'arrow-layer', options: {} });
    canvas.layers.add(layer);

    // Single arrowhead — tip at (0, 0), pointing right.
    const g1 = layer.createGraphics('arrow-single');
    draw.drawArrow(g1, {
      kind: 'arrow', x: 0, y: 0, size: 50,
      fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
    });

    // Eight directional arrows arranged in a compass rose.
    // rot=0 → right, increasing rot rotates clockwise.
    const g2 = layer.createGraphics('compass');
    const radius = 90;  // distance from centre to tip
    const compassArrows = [
      { label: 'E',  rot: 0,         tipX:  radius, tipY:  0       },
      { label: 'SE', rot:  PI_4,     tipX:  64,     tipY:  64      },
      { label: 'S',  rot:  PI_2,     tipX:  0,      tipY:  radius  },
      { label: 'SW', rot:  3 * PI_4, tipX: -64,     tipY:  64      },
      { label: 'W',  rot:  PI,       tipX: -radius, tipY:  0       },
      { label: 'NW', rot: -3 * PI_4, tipX: -64,     tipY: -64      },
      { label: 'N',  rot: -PI_2,     tipX:  0,      tipY: -radius  },
      { label: 'NE', rot: -PI_4,     tipX:  64,     tipY: -64      },
    ];
    for (const a of compassArrows) {
      draw.drawArrow(
        g2,
        { kind: 'arrow', x: 240 + a.tipX, y: a.tipY, size: 40, fill: 0xa855f7, fillAlpha: 0.8 },
        0, 0, a.rot,
      );
    }

    // Size variants — all pointing right, stacked vertically.
    const g3 = layer.createGraphics('size-variants');
    const sizes = [20, 30, 45, 60, 80];
    for (let i = 0; i < sizes.length; i++) {
      draw.drawArrow(
        g3,
        {
          kind: 'arrow', x: 530, y: -80 + i * 40, size: sizes[i]!,
          fill: 0x10b981, fillAlpha: 0.75, stroke: 0x065f46, strokeWidth: 1,
        },
      );
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};

// ─── PathwayArrows ────────────────────────────────────────────────────────────
// Arrows as they appear in systems-biology pathway and SBGN diagrams.
//
// Four arc types are shown:
//   Activation   — filled arrowhead (→)
//   Stimulation  — hollow arrowhead (same shape, white fill)
//   Inhibition   — T-bar drawn as a stack of two arrowheads pointing away
//                  (approximation; the canonical blunt-end uses a line + bar)
//   Catalysis    — arrow with a small filled circle at the tip (approximated
//                  here as two arrows — a circle arrow + the main shaft arrow)
//   Modulation   — diamond arrowhead = two arrows back-to-back

export const PathwayArrows: Story = {
  render: () => createContainer({ id: 'cvs-arrow-pathway' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-arrow-pathway')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'pathway-arrow-layer', options: {} });
    canvas.layers.add(layer);

    // ── Activation arrows (→) ─────────────────────────────────────────────
    // Filled arrowheads — standard "stimulates" arc in SBGN PD.
    const gActivation = layer.createGraphics('activation');
    const activationArrows = [
      { x: 50,  y: -120, rot: 0       },  // horizontal →
      { x: 50,  y:  -60, rot: PI_4    },  // diagonal ↘
      { x:  0,  y:    0, rot: PI_2    },  // vertical ↓
      { x: 50,  y:   60, rot: -PI_4   },  // diagonal ↗
    ];
    for (const a of activationArrows) {
      draw.drawArrow(
        gActivation,
        { kind: 'arrow', x: a.x, y: a.y, size: 45, fill: 0x10b981, fillAlpha: 0.85 },
        0, 0, a.rot,
      );
    }

    // ── Inhibition T-bars (⊣) ────────────────────────────────────────────
    // A T-bar is two back-to-back arrows (one pointing at the target, one
    // mirrored) to approximate a flat blunt end.
    const gInhibition = layer.createGraphics('inhibition');
    const inhibitionTips = [
      { x: 220, y: -120 }, { x: 220, y: -60 },
      { x: 220, y:    0 }, { x: 220, y:  60 },
    ];
    for (const t of inhibitionTips) {
      // Forward arrowhead (points at target).
      draw.drawArrow(
        gInhibition,
        { kind: 'arrow', x: t.x, y: t.y, size: 35, fill: 0xef4444, fillAlpha: 0.85 },
      );
      // Mirror arrowhead pointing the other way — together they form a flat-end bar.
      draw.drawArrow(
        gInhibition,
        { kind: 'arrow', x: t.x - 35, y: t.y, size: 35, fill: 0xef4444, fillAlpha: 0.85 },
        0, 0, PI,
      );
    }

    // ── Catalysis arrows ──────────────────────────────────────────────────
    // Two arrowheads stacked at the same tip — doubles the visual weight.
    // A real catalysis arc would composite a circle marker; here a second
    // smaller arrowhead approximates the filled-circle head.
    const gCatalysis = layer.createGraphics('catalysis');
    const catalysisTips = [
      { x: 400, y: -120 }, { x: 400, y: -60 },
      { x: 400, y:    0 }, { x: 400, y:  60 },
    ];
    for (const t of catalysisTips) {
      draw.drawArrow(
        gCatalysis,
        { kind: 'arrow', x: t.x, y: t.y, size: 45, fill: 0xf59e0b, fillAlpha: 0.85 },
      );
      // Inner smaller arrow fills the head visually.
      draw.drawArrow(
        gCatalysis,
        { kind: 'arrow', x: t.x, y: t.y, size: 25, fill: 0xfef3c7, fillAlpha: 0.9 },
      );
    }

    // ── Modulation (bidirectional / diamond) ──────────────────────────────
    // Diamond head = two back-to-back filled arrows at the same point.
    const gModulation = layer.createGraphics('modulation');
    const modulationTips = [
      { x: 580, y: -120 }, { x: 580, y: -60 },
      { x: 580, y:    0 }, { x: 580, y:  60 },
    ];
    for (const t of modulationTips) {
      draw.drawArrow(
        gModulation,
        { kind: 'arrow', x: t.x, y: t.y, size: 38, fill: 0x8b5cf6, fillAlpha: 0.8 },
      );
      draw.drawArrow(
        gModulation,
        { kind: 'arrow', x: t.x - 38, y: t.y, size: 38, fill: 0x8b5cf6, fillAlpha: 0.8 },
        0, 0, PI,
      );
    }

    // ── Phosphorylation cascade — downward activation chain ───────────────
    // A vertical ladder showing EGFR→RAS→RAF→MEK→ERK arrow chain.
    const gCascade = layer.createGraphics('cascade-arrows');
    const cascadeY = [-220, -130, -40, 50, 140];
    for (const cy of cascadeY) {
      draw.drawArrow(
        gCascade,
        { kind: 'arrow', x: 720, y: cy, size: 50, fill: 0xec4899, fillAlpha: 0.8 },
        0, 0, PI_2,   // pointing down (↓)
      );
    }

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
