/**
 * GraphPlugin — Large Graph (Performance)
 *
 * Stress-tests the GraphPlugin renderer with a configurable number of nodes
 * arranged in a grid, all connected with edges.
 *
 * Default: 100 nodes in a 10×10 grid, ~150 edges (nearest neighbours).
 *
 * Demonstrates:
 *   - `setData()` bulk load (all nodes + edges at once)
 *   - LOD: elements render as dots when zoomed far out
 *   - Viewport culling: off-screen elements are skipped
 *   - DevInfoPlugin: shows fps + element count
 *   - `fitContent()` on load
 *
 * lil-gui lets you regenerate the graph with different sizes.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, DevInfoPlugin } from '@invana/canvas';
import {
  ShapesPlugin,
  type BaseShapeSpec, type BaseConnectorSpec, type CircleShapeSpec,
} from '@invana/plugins-shapes';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: '1. Showcase/Performance/Large Graph' };
export default meta;
type Story = StoryObj;

const CELL_SIZE  = 80;

const PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4dd0e1', '#a5f3fc', '#fcd34d',
];
const EDGE_STYLE = { stroke: '#334155', strokeWidth: 1.5 };

function generateGrid(
  cols: number,
  rows: number,
  nodeRadius: number,
): { solids: Array<{ type: string; spec: BaseShapeSpec }>;
    connectors: Array<{ type: string; spec: BaseConnectorSpec }>; } {
  const solids: Array<{ type: string; spec: BaseShapeSpec }> = [];
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
          id, x, y, radius: nodeRadius,
          label: id,
          style: { fill: PALETTE[(r * cols + c) % PALETTE.length]!, stroke: '#0f172a', strokeWidth: 1 },
          interactive: true,
          draggable: true,
          cursor: 'grab',
          states: { hovered: { strokeWidth: 3, stroke: '#ffffff' } },
        } as CircleShapeSpec,
      });

      // Right neighbour
      if (c < cols - 1) {
        const rx  = ox + (c + 1) * CELL_SIZE;
        connectors.push({
          type: 'straight',
          spec: {
            id: `e-${r}-${c}-r`,
            from:      { x: x  + nodeRadius, y },
            to:        { x: rx - nodeRadius, y },
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
            from:      { x, y:  y + nodeRadius },
            to:        { x, y: by - nodeRadius },
            endMarker: { type: 'none'    },
            style: EDGE_STYLE,
          },
        });
      }
    }
  }

  return { solids, connectors };
}

export const LargeGridGraph: Story = {
  name: 'Large Grid Graph',
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

    const elements = new ShapesPlugin({
      key: 'elements',
    });
    await canvas.plugins.register(elements);

    const params = { cols: 20, rows: 20, nodeSize: 5, nodeCount: 0, edgeCount: 0 };

    function rebuild(): void {
      const { solids, connectors } = generateGrid(params.cols, params.rows, params.nodeSize);
      params.nodeCount = solids.length;
      params.edgeCount = connectors.length;
      elements.setData(solids, connectors);
      // Defer fit one frame so camera bounds/culling run after initial layout.
      requestAnimationFrame(() => elements.fitContent(60));
    }

    rebuild();

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Large Graph', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    gui.add(params, 'cols', 2, 500, 1).name('Columns');
    gui.add(params, 'rows', 2, 500, 1).name('Rows');
    gui.add(params, 'nodeSize', 1, 20, 0.5).name('Node size');
    gui.add({ rebuild }, 'rebuild').name('Regenerate');
    gui.add({ fit: () => elements.fitContent(60) }, 'fit').name('Fit camera');
    gui.add(params, 'nodeCount').name('Nodes loaded').disable().listen();
    gui.add(params, 'edgeCount').name('Edges loaded').disable().listen();
  },
};
