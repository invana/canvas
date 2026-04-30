/**
 * GraphPlugin — Custom Connector
 *
 * Shows how to create and register a custom connector type via
 * `elementPlugin.registerEdge(name, class)`.
 *
 * Two custom connector types are demonstrated:
 *
 * **ZigZagConnector** — alternates between diagonal and horizontal segments,
 *   producing a staircase / lightning-bolt path.
 *   Spec options: `steps` (number of zig-zag segments, default 4).
 *
 * **RippleConnector** — a sinusoidal (wave) connector drawn as many short
 *   line segments approximating a sine curve along the chord from `from`→`to`.
 *   Spec options: `amplitude` (wave height, default 30), `frequency` (cycles, default 3).
 *
 * Demonstrates:
 *   - Extending `BaseEdge` — only `route()` must be implemented
 *   - Custom spec interfaces extending `BaseConnectorSpec`
 *   - `registerEdge(name, cls)` API
 *   - Using `ctx.strokePath()` via the default `draw()` in BaseEdge
 *   - lil-gui controls to adjust connector parameters at runtime
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  ShapesPlugin,
  BaseEdge,
  type CircleShapeSpec,
  type BaseConnectorSpec,
  type PathCommand,
  type Point,
} from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Plugins/ShapesPlugin/Custom Connector' };
export default meta;
type Story = StoryObj;

// ── ZigZagConnector ───────────────────────────────────────────────────────────

interface ZigZagSpec extends BaseConnectorSpec {
  /** Number of zig-zag teeth (segments). Default: 4. */
  steps?: number;
}

/** Produces a staircase path between `from` and `to`. */
class ZigZagConnector extends BaseEdge<ZigZagSpec> {
  route(from: Point, to: Point): PathCommand[] {
    const steps = Math.max(2, this.spec.steps ?? 4);
    const cmds: PathCommand[] = [{ cmd: 'M', x: from.x, y: from.y }];

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const amplitude = Math.abs(dy) / 2 + 30;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const base = from.y + dy * t;
      // Alternate above/below the chord
      const offset = (i % 2 === 1) ? -amplitude : amplitude;
      const y = (i === steps) ? to.y : base + offset * (1 - Math.abs(2 * t - 1));
      cmds.push({ cmd: 'L', x, y });
    }

    return cmds;
  }
}

// ── RippleConnector ───────────────────────────────────────────────────────────

interface RippleSpec extends BaseConnectorSpec {
  /** Wave amplitude in world pixels. Default: 30. */
  amplitude?: number;
  /** Number of complete wave cycles. Default: 3. */
  frequency?: number;
}

/** Approximates a sine wave along the chord from `from` to `to`. */
class RippleConnector extends BaseEdge<RippleSpec> {
  route(from: Point, to: Point): PathCommand[] {
    const amplitude = this.spec.amplitude ?? 30;
    const frequency = this.spec.frequency ?? 3;
    const SEGMENTS  = 80;

    const dx  = to.x - from.x;
    const dy  = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // Perpendicular unit vector for wave offset
    const px = -dy / len;
    const py =  dx / len;

    const cmds: PathCommand[] = [{ cmd: 'M', x: from.x, y: from.y }];

    for (let i = 1; i <= SEGMENTS; i++) {
      const t      = i / SEGMENTS;
      const wave   = Math.sin(t * Math.PI * 2 * frequency) * amplitude;
      const along  = { x: from.x + dx * t,  y: from.y + dy * t  };
      const offset = { x: px * wave,         y: py * wave         };
      cmds.push({ cmd: 'L', x: along.x + offset.x, y: along.y + offset.y });
    }

    return cmds;
  }
}

// ── Story ─────────────────────────────────────────────────────────────────────

const NODE_R = 22;
const ANCHOR = { fill: '#0f172a', stroke: '#475569', strokeWidth: 1.5 };

export const CustomConnector: Story = {
  name: 'Custom Connector',
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

    const elements = new ShapesPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    // Register custom connector types
    elements.registerEdge('zigzag', ZigZagConnector as never);
    elements.registerEdge('ripple', RippleConnector as never);

    // ── ZigZag row ────────────────────────────────────────────────────────
    const ZZ_Y = -100;
    elements.addShape('circle', { id: 'zz-l', x: -200, y: ZZ_Y, radius: NODE_R, style: ANCHOR } as CircleShapeSpec);
    elements.addShape('circle', { id: 'zz-r', x:  200, y: ZZ_Y, radius: NODE_R, style: ANCHOR } as CircleShapeSpec);
    elements.addConnector('zigzag', {
      id: 'zz-conn',
      from:      { x: -200 + NODE_R, y: ZZ_Y },
      to:        { x:  200 - NODE_R, y: ZZ_Y },
      label:     'zigzag (custom connector)',
      endMarker: { type: 'triangle', size: 10 },
      style:     { stroke: '#f97316', strokeWidth: 2.5 },
      steps: 6,
    } as ZigZagSpec);

    // ── Ripple row ────────────────────────────────────────────────────────
    const RP_Y = 100;
    elements.addShape('circle', { id: 'rp-l', x: -200, y: RP_Y, radius: NODE_R, style: ANCHOR } as CircleShapeSpec);
    elements.addShape('circle', { id: 'rp-r', x:  200, y: RP_Y, radius: NODE_R, style: ANCHOR } as CircleShapeSpec);
    elements.addConnector('ripple', {
      id: 'rp-conn',
      from:      { x: -200 + NODE_R, y: RP_Y },
      to:        { x:  200 - NODE_R, y: RP_Y },
      label:     'ripple (custom connector)',
      endMarker: { type: 'triangle', size: 10 },
      style:     { stroke: '#a78bfa', strokeWidth: 2 },
      amplitude: 30,
      frequency: 3,
    } as RippleSpec);

    elements.fitContent();

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Custom Connectors', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const zzParams = { steps: 6 };
    const zzFolder = gui.addFolder('ZigZag').open();
    zzFolder.add(zzParams, 'steps', 2, 16, 1).onChange((v: number) => {
      elements.updateConnector('zz-conn', { steps: v } as Partial<ZigZagSpec>);
    });

    const rpParams = { amplitude: 30, frequency: 3 };
    const rpFolder = gui.addFolder('Ripple').open();
    rpFolder.add(rpParams, 'amplitude', 5, 80, 1).onChange((v: number) => {
      elements.updateConnector('rp-conn', { amplitude: v } as Partial<RippleSpec>);
    });
    rpFolder.add(rpParams, 'frequency', 1, 10, 0.5).onChange((v: number) => {
      elements.updateConnector('rp-conn', { frequency: v } as Partial<RippleSpec>);
    });
  },
};
