/**
 * ElementPlugin — Large Graph (Performance)
 *
 * Stress-tests the ElementPlugin renderer with a configurable number of nodes
 * arranged in a grid, all connected with edges.
 *
 * Default: 100 nodes in a 10×10 grid, ~150 edges (nearest neighbours).
 *
 * Demonstrates:
 *   - `setData()` bulk load (all nodes + edges at once)
 *   - LOD: elements render as dots when zoomed far out
 *   - Viewport culling: off-screen elements are skipped
 *   - DevInfoPlugin: shows fps + element count
 *   - `fit()` on load
 *   - `fitPadding` option on ElementPlugin
 *
 * lil-gui lets you regenerate the graph with different sizes.
 */
import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import {
  Canvas, BackgroundPlugin, ElementPlugin, DevInfoPlugin,
  type BaseSolidSpec, type BaseConnectorSpec, type CircleElementSpec,
} from '@invana/canvas';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: '16. Performance' };
export default meta;
type Story = StoryObj;

const NODE_R     = 5;
const CELL_SIZE  = 80;

const PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4dd0e1', '#a5f3fc', '#fcd34d',
];
const EDGE_STYLE = { stroke: '#334155', strokeWidth: 1.5 };

function generateGrid(
  cols: number,
  rows: number,
): { solids: Array<{ type: string; spec: BaseSolidSpec }>;
    connectors: Array<{ type: string; spec: BaseConnectorSpec }>; } {
  const solids: Array<{ type: string; spec: BaseSolidSpec }> = [];
  const connectors: Array<{ type: string; spec: BaseConnectorSpec }> = [];

  const totalW = (cols - 1) * CELL_SIZE;
  const totalH = (rows - 1) * CELL_SIZE;
  const ox     = -totalW / 2;
  const oy     = -totalH / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `n-${r}-${c}`;
      const x  = ox + c * CELL_SIZE;
      const y  = oy + r * CELL_SIZE;
      solids.push({
        type: 'circle',
        spec: {
          id, x, y, radius: NODE_R,
          label: id,
          style: { fill: PALETTE[(r * cols + c) % PALETTE.length]!, stroke: '#0f172a', strokeWidth: 1 },
          interactive: true,
          draggable: true,
          cursor: 'grab',
          states: { hovered: { strokeWidth: 3, stroke: '#ffffff' } },
        } as CircleElementSpec,
      });

      // Right neighbour
      if (c < cols - 1) {
        const rx  = ox + (c + 1) * CELL_SIZE;
        connectors.push({
          type: 'straight',
          spec: {
            id: `e-${r}-${c}-r`,
            from:      { x: x  + NODE_R, y },
            to:        { x: rx - NODE_R, y },
            endMarker: { type: 'none'    },
            style: EDGE_STYLE,
          },
        });
      }

      // Bottom neighbour
      if (r < rows - 1) {
        const by  = oy + (r + 1) * CELL_SIZE;
        connectors.push({
          type: 'straight',
          spec: {
            id: `e-${r}-${c}-d`,
            from:      { x, y:  y + NODE_R },
            to:        { x, y: by - NODE_R },
            endMarker: { type: 'none'    },
            style: EDGE_STYLE,
          },
        });
      }
    }
  }

  return { solids, connectors };
}

export const LargeGraph: Story = {
  name: 'Large Graph',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 800,
      backgroundColor: '#0a0f1e',
    });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e2d3d', backgroundColor: '#0a0f1e', size: 1, spacing: 32,
    }));

    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);

    const elements = new ElementPlugin({
      key: 'elements',
      fitOnRender: false,
      fitPadding: 60,
    });
    await canvas.plugins.register(elements);

    const params = { cols: 20, rows: 20 };

    function rebuild(): void {
      const { solids, connectors } = generateGrid(params.cols, params.rows);
      elements.setData(solids, connectors);
      // Defer fit one frame so camera bounds/culling run after initial layout.
      requestAnimationFrame(() => elements.fit(60));
    }

    rebuild();

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Large Graph', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'cols', 2, 20, 1).name('Columns');
    gui.add(params, 'rows', 2, 20, 1).name('Rows');
    gui.add({ rebuild }, 'rebuild').name('Regenerate');
    gui.add({ fit: () => elements.fit(60) }, 'fit').name('Fit camera');
    gui.add(params, 'cols').name('').disable().listen(); // spacer
  },
};
