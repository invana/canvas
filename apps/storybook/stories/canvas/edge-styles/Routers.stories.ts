/**
 * ElementPlugin - Routers
 *
 * Demonstrates the four built-in router functions used in the two-stage
 * connector pipeline. Each column shows the same source/target pair routed
 * differently.
 *
 * Routers:
 *   normal   - pass-through (no modification to user vertices)
 *   orth     - forces right-angle bends (auto L-shape when no vertices)
 *   oneSide  - exits from a fixed side; produces U-shape
 *   er       - Z-shaped stub routing for Entity-Relationship diagrams
 *
 * The router is set via `router: 'name'` or `router: { name, args: {...} }`
 * on any connector spec. Routers work with any connector type.
 *
 * lil-gui lets you toggle the orth router direction and the oneSide exit side.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec,
  type OrthRouterArgs,
  type OneSideRouterArgs,
  type ErRouterArgs,
} from '@invana/canvas';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Edge Styles/Routers' };
export default meta;
type Story = StoryObj;

// Layout constants
const COLS     = 4;
const COL_GAP  = 280;
const NODE_R   = 24;
const SRC_Y    = -90;
const TGT_Y    =  90;

const ANCHOR = { fill: '#0f172a', stroke: '#475569', strokeWidth: 1.5 };

const ROUTERS = [
  {
    name:    'normal',
    color:   '#4fc3f7',
    label:   'normal',
    caption: 'pass-through',
    args:    undefined,
  },
  {
    name:    'orth',
    color:   '#81c784',
    label:   'orth',
    caption: 'auto L-shape',
    args:    { direction: 'horizontal-first' } as OrthRouterArgs,
  },
  {
    name:    'oneSide',
    color:   '#ffb74d',
    label:   'oneSide',
    caption: 'exit bottom',
    args:    { side: 'bottom', offset: 40 } as OneSideRouterArgs,
  },
  {
    name:    'er',
    color:   '#f06292',
    label:   'er',
    caption: 'Z-shape stub',
    args:    { offset: 40, direction: 'H' } as ErRouterArgs,
  },
];

export const Routers: Story = {
  name: 'Routers',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 100 });
    await canvas.plugins.register(elements);

    const totalWidth = (COLS - 1) * COL_GAP;
    const startX     = -totalWidth / 2;

    ROUTERS.forEach((r, col) => {
      const cx = startX + col * COL_GAP;

      // Source node (top)
      elements.addSolid('circle', {
        id: `${r.name}-src`, x: cx, y: SRC_Y,
        radius: NODE_R, style: ANCHOR,
        label: r.caption,
      } as CircleElementSpec);

      // Target node (bottom, slightly offset right to make routing visible)
      elements.addSolid('circle', {
        id: `${r.name}-tgt`, x: cx + 60, y: TGT_Y,
        radius: NODE_R, style: ANCHOR,
      } as CircleElementSpec);

      // Connector using the router
      const spec: Record<string, unknown> = {
        id:        `${r.name}-conn`,
        from:      { x: cx,        y: SRC_Y + NODE_R },
        to:        { x: cx + 60,   y: TGT_Y - NODE_R },
        label:     r.label,
        endMarker: { type: 'triangle', size: 10 },
        style:     { stroke: r.color, strokeWidth: 2 },
        router:    r.args ? { name: r.name, args: r.args } : r.name,
      };
      elements.addConnector('straight', spec as never);
    });

    elements.fit();

    // ── lil-gui ────────────────────────────────────────────────────────────
    const params = {
      'orth direction': 'horizontal-first' as OrthRouterArgs['direction'],
      'oneSide exit':   'bottom' as OneSideRouterArgs['side'],
      'er direction':   'H' as ErRouterArgs['direction'],
      'er offset':      40,
    };

    const gui = new GUI({ title: 'Router args', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'orth direction', ['horizontal-first', 'vertical-first', 'auto'])
      .onChange((v: OrthRouterArgs['direction']) => {
        elements.updateConnector('orth-conn', {
          router: { name: 'orth', args: { direction: v } },
        } as never);
      });

    gui.add(params, 'oneSide exit', ['top', 'bottom', 'left', 'right'])
      .onChange((v: OneSideRouterArgs['side']) => {
        elements.updateConnector('oneSide-conn', {
          router: { name: 'oneSide', args: { side: v, offset: 40 } },
        } as never);
      });

    gui.add(params, 'er direction', ['H', 'V'])
      .onChange((v: ErRouterArgs['direction']) => {
        elements.updateConnector('er-conn', {
          router: { name: 'er', args: { direction: v, offset: params['er offset'] } },
        } as never);
      });

    gui.add(params, 'er offset', 10, 80, 5)
      .onChange((v: number) => {
        elements.updateConnector('er-conn', {
          router: { name: 'er', args: { direction: params['er direction'], offset: v } },
        } as never);
      });
  },
};
