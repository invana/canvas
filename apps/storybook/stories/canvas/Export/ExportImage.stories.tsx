/**
 * Export the canvas as an image via the reusable `<ExportImageToolbar>` (from
 * `@invana/canvas-react`) — a single toolbar nav item that reveals the full
 * export options on hover and saves through `useCanvasImageExport` → the engine's
 * `Canvas.export`.
 *
 * **Hover the ⬇ button in the app header** to open the export menu (it's wired
 * into `GraphCanvasApp`'s `header.right` slot). It exposes every option so you
 * can compare results:
 *   - **Format** (horizontal row) — `PNG` / `JPG` / `WebP` (raster via GPU
 *     `extract`) or `SVG` (true vector projection of the scene).
 *   - **Area** — `viewport` (WYSIWYG at the on-screen zoom) or `content` (the
 *     whole graph, off-screen included, regardless of the camera).
 *   - **Background** — `canvas` (matches the on-screen bg), `transparent`
 *     (alpha PNG/WebP/SVG), or a solid colour.
 *   - **Scale** — resolution multiplier for the raster formats (disabled for SVG).
 *   - **Aspect ratio** — force a specific output ratio. The capture region is
 *     *letterboxed* to it (grown + re-centred, never cropped), so pick e.g.
 *     `16:9` or `1:1` and the download keeps that ratio exactly while all
 *     content stays visible — the background fills the added margin.
 *
 * How to test the ratio: set **Aspect ratio = 1:1**, **Area = Content**, format
 * PNG, hit **Save as Image** — the file is square with the graph centred. Switch
 * to **16:9** and it's wide. Open an **SVG** export in a browser and zoom — it
 * stays crisp, and its `viewBox` carries the same ratio. The graph mixes
 * `circle`, `rect`, and `arc` node shapes plus labels so the vector serialiser
 * is exercised across kinds.
 *
 * `<ExportImageToolbar>` is self-wiring (pulls the engine from the `<Canvas>`
 * context); the underlying `<ExportImagePanel>` is a reusable engine-agnostic
 * building block you can drop into any popover / dialog / sheet of your own.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@invana/themes';
import { BackgroundLayer, DragPanBehaviour, GraphLayer, WheelZoomBehaviour } from '@invana/canvas-react';
import { ExportImageToolbar, GraphCanvasApp } from '@invana/canvas-ui';
import type { GraphData, GraphNode } from '@invana/graph';

const meta: Meta = { title: 'canvas/Export/ExportImage' };
export default meta;
type Story = StoryObj;

// Fixed positions + a mix of shape kinds (circle / rect / arc) and labels so the
// SVG serialiser is exercised across shapes.
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
      style: { shape: { kind: 'arc', innerR: 14, outerR: 26, startAngle: -1.9, endAngle: 1.2 }, bgFill: 0xef4444 } },
  ],
  edges: [
    { type: 'edge', id: 'auth-core', source: 'auth', target: 'core' },
    { type: 'edge', id: 'core-db', source: 'core', target: 'db' },
    { type: 'edge', id: 'core-cache', source: 'core', target: 'cache' },
    { type: 'edge', id: 'worker-core', source: 'worker', target: 'core' },
    { type: 'edge', id: 'core-gauge', source: 'core', target: 'gauge' },
  ],
};

export const ExportImageStory: Story = {
  name: 'ExportImage',
  render: () => (
    <ThemeProvider defaultMode="dark" storageKey={null}>
      <GraphCanvasApp
        data={data}
        bundle={false}
        height="100vh"
        header={{
          title: 'Export Demo',
          // The header rail sits outside the `<Canvas>` context, so hand the
          // exporter the live engine from the control context. `bare` renders
          // just the hover-card trigger (no floating `<Panel>`), so it drops
          // straight into the header as a nav item.
          right: (ctx) => (
            <ExportImageToolbar
              bare
              filename="export"
              defaultValue={{ area: 'content', scale: 2 }}
              canvas={ctx.canvas}
            />
          ),
        }}
      >
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
      </GraphCanvasApp>
    </ThemeProvider>
  ),
};
