/**
 * ElementPlugin — Custom Router
 *
 * Shows how to register a custom router function via
 * `elementPlugin.registerRouter(name, fn)` and use it on any connector.
 *
 * Routers are the first stage of the two-stage connector pipeline:
 *   Router (waypoints) → Connector (path commands)
 *
 * A router receives `(from, to, vertices, args, ctx)` and returns an augmented
 * list of intermediate waypoints.  These are then passed to the connector's
 * `route()` method to generate the final `PathCommand[]`.
 *
 * Three custom routers shown:
 *
 *   **arcRouter**    — inserts a single midpoint offset by `arcHeight` pixels
 *                      perpendicular to the chord, creating a gentle arc even
 *                      on connectors that don't support curvature natively.
 *
 *   **bounceRouter** — adds three waypoints that form a U-shape dropping below
 *                      both endpoints, useful for "return" edges in DAGs.
 *
 *   **zigzagRouter** — inserts alternating waypoints above/below the midline,
 *                      similar to ZigZagConnector but implemented as a router
 *                      so any connector type can use it.
 *
 * All three are applied to `straight` connectors so the waypoint influence is
 * clearly visible.
 *
 * lil-gui lets you tune each router's args live.
 *
 * API used:
 *   `registerRouter(name, fn)`          — install a custom router
 *   `router: { name, args }` spec field — use a named router on a connector
 *   `updateConnector(id, partial)`      — live-update router args
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec,
  type RouterFn,
  type ElementPoint as Point,
} from '@invana/canvas';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Edge Styles/Custom Router' };
export default meta;
type Story = StoryObj;

// ── Custom router implementations ─────────────────────────────────────────────

/**
 * Arc router — inserts a single waypoint perpendicular to the chord at the
 * midpoint.  The perpendicular offset is `arcHeight` (default 60).
 */
const arcRouter: RouterFn = (from, to, vertices, args) => {
  if (vertices.length > 0) return vertices; // don't override explicit vertices
  const h   = (args?.['arcHeight'] as number | undefined) ?? 60;
  const mx  = (from.x + to.x) / 2;
  const my  = (from.y + to.y) / 2;
  const dx  = to.x - from.x;
  const dy  = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px  = (-dy / len) * h; // perpendicular offset
  const py  = ( dx / len) * h;
  return [{ x: mx + px, y: my + py }];
};

/**
 * Bounce router — adds three waypoints that drop the connector below both
 * endpoints, creating a U-shape.  `depth` controls how far it drops (default 80).
 */
const bounceRouter: RouterFn = (from, to, vertices, args) => {
  if (vertices.length > 0) return vertices;
  const depth  = (args?.['depth'] as number | undefined) ?? 80;
  const bottom = Math.max(from.y, to.y) + depth;
  return [
    { x: from.x, y: bottom },
    { x: (from.x + to.x) / 2, y: bottom + depth * 0.3 },
    { x: to.x,   y: bottom },
  ];
};

/**
 * Zigzag router — inserts alternating waypoints above/below the chord midline.
 * `teeth` sets the number of zigzag segments (default 4).
 * `amplitude` sets the perpendicular offset (default 40).
 */
const zigzagRouter: RouterFn = (from: Point, to: Point, vertices: Point[], args?: Record<string, unknown>) => {
  if (vertices.length > 0) return vertices;
  const teeth     = Math.max(2, (args?.['teeth'] as number | undefined) ?? 4);
  const amplitude = (args?.['amplitude'] as number | undefined) ?? 40;

  const pts: Point[] = [];
  const dx  = to.x - from.x;
  const dy  = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px  = (-dy / len) * amplitude;
  const py  = ( dx / len) * amplitude;

  for (let i = 1; i < teeth; i++) {
    const t   = i / teeth;
    const bx  = from.x + dx * t;
    const by  = from.y + dy * t;
    const dir = (i % 2 === 0) ? 1 : -1;
    pts.push({ x: bx + px * dir, y: by + py * dir });
  }
  return pts;
};

// ── Layout ────────────────────────────────────────────────────────────────────

const NODE_R  = 20;
const HALF_W  = 200;
const ROW_GAP = 160;
const ANCHOR  = { fill: '#0f172a', stroke: '#475569', strokeWidth: 1.5 };

export const CustomRouter: Story = {
  name: 'Custom Router',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 30,
    }));

    const elements = new ElementPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    // Register all three custom routers
    elements.registerRouter('arc',     arcRouter);
    elements.registerRouter('bounce',  bounceRouter);
    elements.registerRouter('zigzag-r', zigzagRouter);

    const rows = [
      { id: 'arc',     label: 'arcRouter',    color: '#4fc3f7', routerName: 'arc',      args: { arcHeight: 60 } },
      { id: 'bounce',  label: 'bounceRouter',  color: '#81c784', routerName: 'bounce',   args: { depth: 80 } },
      { id: 'zigzag-r', label: 'zigzagRouter', color: '#f06292', routerName: 'zigzag-r', args: { teeth: 4, amplitude: 40 } },
    ];

    const startY = -((rows.length - 1) * ROW_GAP) / 2;

    rows.forEach((row, i) => {
      const rowY = startY + i * ROW_GAP;

      elements.addSolid('circle', {
        id: `${row.id}-l`, x: -HALF_W, y: rowY,
        radius: NODE_R, style: ANCHOR,
      } as CircleElementSpec);

      elements.addSolid('circle', {
        id: `${row.id}-r`, x: HALF_W, y: rowY,
        radius: NODE_R, style: ANCHOR,
      } as CircleElementSpec);

      elements.addConnector('straight', {
        id:        `${row.id}-conn`,
        from:      { x: -HALF_W + NODE_R, y: rowY },
        to:        { x:  HALF_W - NODE_R, y: rowY },
        label:     row.label,
        endMarker: { type: 'triangle', size: 10 },
        style:     { stroke: row.color, strokeWidth: 2 },
        router:    { name: row.routerName, args: row.args },
      } as never);
    });

    elements.fitContent();

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Custom Routers', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    // Arc
    const arcParams = { arcHeight: 60 };
    const arcF = gui.addFolder('arcRouter').open();
    arcF.add(arcParams, 'arcHeight', -200, 200, 5).onChange((v: number) => {
      elements.updateConnector('arc-conn', {
        router: { name: 'arc', args: { arcHeight: v } },
      } as never);
    });

    // Bounce
    const bounceParams = { depth: 80 };
    const bounceF = gui.addFolder('bounceRouter').open();
    bounceF.add(bounceParams, 'depth', 20, 200, 5).onChange((v: number) => {
      elements.updateConnector('bounce-conn', {
        router: { name: 'bounce', args: { depth: v } },
      } as never);
    });

    // Zigzag router
    const zzrParams = { teeth: 4, amplitude: 40 };
    const zzrF = gui.addFolder('zigzagRouter').open();
    zzrF.add(zzrParams, 'teeth', 2, 12, 1).onChange((v: number) => {
      elements.updateConnector('zigzag-r-conn', {
        router: { name: 'zigzag-r', args: { teeth: v, amplitude: zzrParams.amplitude } },
      } as never);
    });
    zzrF.add(zzrParams, 'amplitude', 5, 100, 5).onChange((v: number) => {
      elements.updateConnector('zigzag-r-conn', {
        router: { name: 'zigzag-r', args: { teeth: zzrParams.teeth, amplitude: v } },
      } as never);
    });
  },
};
