/**
 * Export the canvas as an image — `<ExportToolbar>` + the `useCanvasExport`
 * hook it wraps (both from `@invana/canvas-react`).
 *
 * Two toolbars drive the engine's `Canvas.export`:
 *   - **top-right** — the current **viewport** (WYSIWYG, at the on-screen zoom)
 *     in every format: `PNG` / `JPG` / `WebP` / `SVG`.
 *   - **top-left** — the whole **content** (auto-fits all nodes, off-screen
 *     included) as `PNG` / `SVG`.
 *
 * How to test: pan / zoom, then click a **viewport** button — the download
 * matches what's on screen (minus the React chrome + minimap-style overlays,
 * which are excluded by design). Click a **content** button to get the entire
 * graph regardless of the camera. Open the `SVG` download in a browser and zoom
 * in — it stays crisp (true vector: shapes, edges, and labels are real SVG
 * elements). The graph mixes `circle`, `rect`, and `arc` node shapes plus
 * labels so the vector serialiser is exercised across kinds.
 *
 * Raster (`PNG`/`JPG`/`WebP`) goes through the GPU `extract`; `SVG` is a
 * separate vector projection of the scene. `background: 'canvas'` (the default)
 * reproduces the on-screen background in both.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@invana/themes';
import {
  BackgroundLayer,
  DragPanBehaviour,
  ExportToolbar,
  GraphCanvasApp,
  GraphLayer,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData, GraphNode } from '@invana/graph';

const meta: Meta = { title: 'canvas-react/export/ExportImage' };
export default meta;
type Story = StoryObj;

// Fixed positions + a mix of shape kinds (circle / rect / arc) and labels so the
// SVG serialiser is exercised across shapes. `data` in a story reads cleanly per
// the light-per-item / heavy-layer-template convention.
const data: GraphData = {
  nodes: [
    { id: 'core', type: 'Service', position: { x: 0, y: 0 }, data: { name: 'Core API' },
      style: { shape: { kind: 'rect', width: 96, height: 44, cornerRadius: 8 }, bgFill: 0x6366f1 } },
    { id: 'auth', type: 'Service', position: { x: -190, y: -110 }, data: { name: 'Auth' } },
    { id: 'db', type: 'Store', position: { x: 190, y: -110 }, data: { name: 'Database' },
      style: { bgFill: 0x10b981 } },
    { id: 'cache', type: 'Store', position: { x: 200, y: 110 }, data: { name: 'Cache' },
      style: { bgFill: 0x10b981 } },
    { id: 'worker', type: 'Job', position: { x: -200, y: 120 }, data: { name: 'Worker' },
      style: { bgFill: 0xf59e0b } },
    { id: 'gauge', type: 'Metric', position: { x: 0, y: 190 }, data: { name: 'SLA' },
      // Arc node — full four-parameter annular sector, to exercise arc → SVG path.
      style: { shape: { kind: 'arc', innerR: 14, outerR: 26, startAngle: -1.9, endAngle: 1.2 }, bgFill: 0xef4444 } },
  ],
  edges: [
    { id: 'auth-core', source: 'auth', target: 'core' },
    { id: 'core-db', source: 'core', target: 'db' },
    { id: 'core-cache', source: 'core', target: 'cache' },
    { id: 'worker-core', source: 'worker', target: 'core' },
    { id: 'core-gauge', source: 'core', target: 'gauge' },
  ],
};

export const ExportImage: Story = {
  // `GraphCanvasApp` is the batteries-included shell; `bundle={false}` lets these
  // children own the graph. The app must sit under a `<ThemeProvider>`.
  render: () => (
    <ThemeProvider storageKey={null}>
      <GraphCanvasApp data={data} bundle={false} height="100vh">
        <BackgroundLayer id="background" type="pattern" patternType="dots" backgroundColor="#0b1220" color="#1e293b" />
        <GraphLayer
          id="graph"
          data={data}
          node={{
            style: {
              shape: { kind: 'circle', radius: 26 },
              bgFill: 0x6366f1,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelText: (n: GraphNode) => (n.data as { name: string }).name,
              labelColor: 0xf8fafc,
              labelFontSize: 12,
              labelPlacement: 'center',
            },
          }}
          edge={{ style: { strokeColor: 0x64748b, strokeWidth: 2 } }}
        />

        <DragPanBehaviour id="pan" enabled />
        <WheelZoomBehaviour id="zoom" enabled />

        {/* Viewport export — every format, WYSIWYG at the current zoom. */}
        <ExportToolbar
          position="top-right"
          area="viewport"
          formats={['png', 'jpeg', 'webp', 'svg']}
          filename="viewport"
        />

        {/* Whole-content export — the entire graph regardless of the camera. */}
        <ExportToolbar
          position="top-left"
          area="content"
          formats={['png', 'svg']}
          filename="graph"
        />
      </GraphCanvasApp>
    </ThemeProvider>
  ),
};
