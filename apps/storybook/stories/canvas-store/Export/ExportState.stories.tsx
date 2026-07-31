/**
 * Save / load the **full canvas state as JSON** via the reusable
 * `<ExportStateToolbar>` (from `@invana/canvas-react`) — a single toolbar nav
 * item that reveals the state actions on hover and round-trips through
 * `useCanvasStateJson` → the engine's `Canvas.exportState` / `Canvas.importState`.
 *
 * Unlike `ExportImage` (which rasterises a *picture*), this serialises the
 * **document**: the view definition (scene / layer / behaviour / layout options,
 * `activeLayout`, templates, theme — i.e. all the styling), the live interaction
 * (camera / selection / hover), and every layer's node/edge data **with their
 * positions**. The result is a plain `.json` you can persist, diff, or reload.
 *
 * **Try it — the app header has two nav items: 🗑 clear and ⧉ state:**
 *   1. Rearrange the scene — **drag nodes** around, **pan** and **zoom** the camera.
 *   2. Hover ⧉ and hit **Download JSON** — a `my-scene.json` file saves with the
 *      current node positions, camera, and styling baked in.
 *   3. Click the 🗑 **Clear canvas** button — every node and edge is wiped.
 *   4. Hover ⧉ and hit **Load JSON…**, pick the file you saved — the whole scene
 *      is restored to the exact positions + camera + styling from step 2.
 *
 * The **Restore view** toggle controls whether loading also restores the camera
 * & selection (`On`) or only the definition + data, keeping your current view
 * (`Off` → the engine's `skipInteraction`).
 *
 * `<ExportStateToolbar>` is self-wiring (pulls the engine from the `<Canvas>`
 * context); the underlying `<ExportStatePanel>` is a reusable engine-agnostic
 * building block you can drop into any popover / dialog / sheet of your own.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeProvider } from '@invana/themes';
import { BackgroundLayer, DragNodeBehaviour, DragPanBehaviour, GraphLayer, WheelZoomBehaviour } from '@invana/canvas-react';
import { ClearCanvasToolbar, ExportStateToolbar, GraphCanvasApp } from '@invana/canvas-ui';
import type { GraphData, GraphNode } from '@invana/graph';

const meta: Meta = { title: 'canvas-store/Export/ExportState' };
export default meta;
type Story = StoryObj;

// Fixed starting positions + a mix of shape kinds and per-node styling so the
// serialised document carries real styling + geometry to round-trip.
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
    { id: 'auth-core', source: 'auth', target: 'core' },
    { id: 'core-db', source: 'core', target: 'db' },
    { id: 'core-cache', source: 'core', target: 'cache' },
    { id: 'worker-core', source: 'worker', target: 'core' },
    { id: 'core-gauge', source: 'core', target: 'gauge' },
  ],
};

export const ExportStateStory: Story = {
  name: 'ExportState',
  render: () => (
    <ThemeProvider defaultMode="dark" storageKey={null}>
      <GraphCanvasApp
        data={data}
        bundle={false}
        height="100vh"
        header={{
          title: 'State Save / Load Demo',
          // The header rail sits outside the `<Canvas>` context, so hand the
          // toolbar the live engine from the control context. `bare` renders
          // just the hover-card trigger (no floating `<Panel>`), so it drops
          // straight into the header as a nav item.
          // Two `bare` nav items side by side: clear the canvas, then reload a
          // saved document from file. `<ClearCanvasToolbar>` wipes the graph
          // layer; `<ExportStateToolbar>` saves / loads the full state JSON.
          right: (ctx) => (
            <>
              <ClearCanvasToolbar bare targetLayerId="graph" canvas={ctx.canvas} />
              <ExportStateToolbar bare filename="my-scene" canvas={ctx.canvas} />
            </>
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

        <DragNodeBehaviour id="drag-node" targetLayerId="graph" pinOnRelease />
        <DragPanBehaviour id="pan" enabled />
        <WheelZoomBehaviour id="zoom" enabled />
      </GraphCanvasApp>
    </ThemeProvider>
  ),
};
