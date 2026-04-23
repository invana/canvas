import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type ElementArrowSpec as ArrowSpec,
  type CircleElementSpec,
  type DrawContext,
  type ElementPoint as Point,
} from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ElementPlugin' };
export default meta;
type Story = StoryObj;

// ── Built-in marker catalogue ─────────────────────────────────────────────────

const BUILTIN_MARKERS: Array<{ type: ArrowSpec['type']; color: string }> = [
  { type: 'triangle',         color: '#4fc3f7' },
  { type: 'triangle-outline', color: '#38bdf8' },
  { type: 'diamond',          color: '#81c784' },
  { type: 'diamond-outline',  color: '#4ade80' },
  { type: 'circle',           color: '#ffb74d' },
  { type: 'circle-outline',   color: '#fb923c' },
  { type: 'circle-plus',      color: '#f59e0b' },
  { type: 'square',           color: '#f06292' },
  { type: 'square-outline',   color: '#f472b6' },
  { type: 'block',            color: '#ce93d8' },
  { type: 'classic',          color: '#c084fc' },
  { type: 'ellipse',          color: '#4dd0e1' },
  { type: 'cross',            color: '#a5f3fc' },
  { type: 'async',            color: '#67e8f9' },
];

const EXTRA_MARKERS: Array<{ type: string; color: string; label?: string }> = [
  { type: 'none',  color: '#64748b', label: "'none' — no marker" },
  { type: 'star5', color: '#fbbf24', label: 'custom: star5'      },
];

// ── Custom marker: 5-point star burst ─────────────────────────────────────────
// Uses only DrawContext.fillStar — no raw PixiJS imports needed.

function drawStar5Marker(
  ctx: DrawContext,
  tip: Point,
  angle: number,
  spec: ArrowSpec,
): void {
  const size   = spec.size ?? 14;
  const color  = spec.color ?? '#ffffff';
  const offset = size * 0.55;
  // Place star centre slightly behind the tip so the point touches `tip`
  const cx = tip.x - Math.cos(angle) * offset;
  const cy = tip.y - Math.sin(angle) * offset;
  ctx.fillStar(cx, cy, size * 0.8, {
    fill:        color,
    stroke:      '#ffffff',
    strokeWidth: 1,
    points:      5,
    innerRatio:  0.42,
    rotation:    angle - Math.PI / 2,
  });
}

// ── Layout ────────────────────────────────────────────────────────────────────

const ROW_GAP  = 52;
const CONN_LEN = 230;
const NODE_R   = 14;
const ANCHOR   = { fill: '#0f172a', stroke: '#334155', strokeWidth: 1 };

type AnyMarkerDef = { type: string; color: string; label?: string };
const ALL_ROWS: AnyMarkerDef[] = [
  ...BUILTIN_MARKERS,
  ...EXTRA_MARKERS,
];

// ── Story ─────────────────────────────────────────────────────────────────────

export const Markers: Story = {
  name: 'Markers',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.2, spacing: 28,
    }));

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 60 });
    await canvas.plugins.register(elements);

    // Register the custom star5 marker before adding any connectors
    elements.registerMarker('star5', drawStar5Marker);

    const params = { markerSize: 14 };
    const startY = -((ALL_ROWS.length - 1) * ROW_GAP) / 2;

    ALL_ROWS.forEach((m, i) => {
      const y   = startY + i * ROW_GAP;
      const lx  = -(CONN_LEN / 2 + NODE_R);
      const rx  =   CONN_LEN / 2 + NODE_R;
      const tid = m.type.replace(/[^a-zA-Z0-9]/g, '-');

      elements.addSolid('circle', {
        id: `${tid}-l`, x: lx, y,
        radius: NODE_R, style: ANCHOR,
      } as CircleElementSpec);

      elements.addSolid('circle', {
        id: `${tid}-r`, x: rx, y,
        radius: NODE_R, style: ANCHOR,
      } as CircleElementSpec);

      // startMarker — at the source end (mirror / approach angle)
      // endMarker   — at the target end
      elements.addConnector('straight', {
        id:          `${tid}-conn`,
        from:        { x: lx + NODE_R, y },
        to:          { x: rx - NODE_R, y },
        label:       m.label ?? m.type,
        startMarker: { type: m.type, size: params.markerSize, color: m.color } as ArrowSpec,
        endMarker:   { type: m.type, size: params.markerSize, color: m.color } as ArrowSpec,
        style:       { stroke: m.color, strokeWidth: 1.8 },
      } as never);
    });

    elements.fit();

    // ── lil-gui ────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Marker options', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'markerSize', 6, 28, 1)
      .name('size')
      .onChange((size: number) => {
        ALL_ROWS.forEach(m => {
          const tid = m.type.replace(/[^a-zA-Z0-9]/g, '-');
          elements.updateConnector(`${tid}-conn`, {
            startMarker: { type: m.type, size, color: m.color } as ArrowSpec,
            endMarker:   { type: m.type, size, color: m.color } as ArrowSpec,
          } as never);
        });
      });
  },
};
/**
 * ElementPlugin - Markers
 *
 * Demonstrates all 14 built-in arrowhead marker types available for
 * connector endpoints via `endMarker` / `startMarker`, plus:
 *   - `type: 'none'`  — explicitly suppress a marker
 *   - custom 'star5'  — registered via `elements.registerMarker()`
 *
 * Every row shows one marker type on BOTH ends of a short straight connector
 * so you can compare the source (flipped) and target orientations side by side.
 *
 * A lil-gui panel lets you adjust the marker size live across all connectors.
 *
 * Built-in marker types:
 *   triangle         filled triangle (default)
 *   triangle-outline outlined triangle
 *   diamond          filled diamond
 *   diamond-outline  outlined diamond
 *   circle           filled circle
 *   circle-outline   outlined circle
 *   circle-plus      circle with a plus sign inside
 *   square           filled square
 *   square-outline   outlined square
 *   block            wide filled block arrow
 *   classic          open V-shaped arrowhead
 *   ellipse          ellipse / oval marker
 *   cross            diagonal X marker
 *   async            single-wing half arrow
 *
 * Custom marker API:
 *   elements.registerMarker(name, fn) where fn is:
 *   (ctx: DrawContext, tip: Point, angle: number, spec: ArrowSpec) => void
 *   Only DrawContext methods may be used (no raw PixiJS imports needed).
 */
