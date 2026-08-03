import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/LODZoomRange' };
export default meta;
type Story = StoryObj;

/**
 * `labelMinZoom` / `labelMaxZoom` declare a **camera zoom band**. The
 * label is hidden when `camera.scale < labelMinZoom` or `> labelMaxZoom`.
 *
 * 3 rows × 6 shapes:
 *
 * - **top row (always)**:        no `min` / `max` — visible at every zoom.
 * - **middle row (zoomed-in)**:  `labelMinZoom: 1.0` — appears once you zoom in.
 * - **bottom row (zoomed-out)**: `labelMaxZoom: 0.8` — disappears once you zoom in.
 *
 * Scroll-wheel to zoom; watch each row's labels mount / unmount at its
 * threshold. Current zoom is shown in the GUI.
 */
export const LODZoomRangeStory: Story = {
  name: 'LODZoomRange',
  render: () => createContainer({ id: 'graph-label-lod-zoom-range' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      // 3-col × 6-row grid. Each band gets 2 sub-rows (3 shapes each).
      // ─── always band ─────────────────────────────────────────────────
      { type: 'node', id: 'always-circle',          position: { x: -260, y: -440 }, style: { shape: { kind: 'circle', radius: 16 },                                                                  labelText: 'always: circle',          labelPlacement: 'right', labelOffsetX: 6 } },
      { type: 'node', id: 'always-rect',            position: { x: 0,    y: -440 }, style: { shape: { kind: 'rect', width: 40, height: 28, cornerRadius: 6 },                                        labelText: 'always: rect',            labelPlacement: 'right', labelOffsetX: 6 } },
      { type: 'node', id: 'always-arc',             position: { x: 260,  y: -440 }, style: { shape: { kind: 'arc', innerR: 8, outerR: 20, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },         labelText: 'always: arc',             labelPlacement: 'right', labelOffsetX: 6 } },
      { type: 'node', id: 'always-regular-polygon', position: { x: -260, y: -300 }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 18 },                                               labelText: 'always: pentagon',        labelPlacement: 'right', labelOffsetX: 6 } },
      { type: 'node', id: 'always-star',            position: { x: 0,    y: -300 }, style: { shape: { kind: 'star', points: 5, outerRadius: 20, innerRadius: 9 },                                    labelText: 'always: star',            labelPlacement: 'right', labelOffsetX: 6 } },
      { type: 'node', id: 'always-polygon',         position: { x: 260,  y: -300 }, style: { shape: { kind: 'polygon', vertices: [ { x: 18, y: 0 }, { x: 9, y: -16 }, { x: -9, y: -16 }, { x: -18, y: 0 }, { x: -9, y: 16 }, { x: 9, y: 16 } ] }, labelText: 'always: polygon', labelPlacement: 'right', labelOffsetX: 6 } },
      // ─── zoomed-in band ──────────────────────────────────────────────
      { type: 'node', id: 'in-circle',          position: { x: -260, y: -100 }, style: { shape: { kind: 'circle', radius: 16 },                                                                  labelText: 'in: circle',          labelPlacement: 'right', labelOffsetX: 6, labelMinZoom: 1.0 } },
      { type: 'node', id: 'in-rect',            position: { x: 0,    y: -100 }, style: { shape: { kind: 'rect', width: 40, height: 28, cornerRadius: 6 },                                        labelText: 'in: rect',            labelPlacement: 'right', labelOffsetX: 6, labelMinZoom: 1.0 } },
      { type: 'node', id: 'in-arc',             position: { x: 260,  y: -100 }, style: { shape: { kind: 'arc', innerR: 8, outerR: 20, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },         labelText: 'in: arc',             labelPlacement: 'right', labelOffsetX: 6, labelMinZoom: 1.0 } },
      { type: 'node', id: 'in-regular-polygon', position: { x: -260, y: 40   }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 18 },                                               labelText: 'in: pentagon',        labelPlacement: 'right', labelOffsetX: 6, labelMinZoom: 1.0 } },
      { type: 'node', id: 'in-star',            position: { x: 0,    y: 40   }, style: { shape: { kind: 'star', points: 5, outerRadius: 20, innerRadius: 9 },                                    labelText: 'in: star',            labelPlacement: 'right', labelOffsetX: 6, labelMinZoom: 1.0 } },
      { type: 'node', id: 'in-polygon',         position: { x: 260,  y: 40   }, style: { shape: { kind: 'polygon', vertices: [ { x: 18, y: 0 }, { x: 9, y: -16 }, { x: -9, y: -16 }, { x: -18, y: 0 }, { x: -9, y: 16 }, { x: 9, y: 16 } ] }, labelText: 'in: polygon', labelPlacement: 'right', labelOffsetX: 6, labelMinZoom: 1.0 } },
      // ─── zoomed-out band ─────────────────────────────────────────────
      { type: 'node', id: 'out-circle',          position: { x: -260, y: 240 }, style: { shape: { kind: 'circle', radius: 16 },                                                                  labelText: 'out: circle',          labelPlacement: 'right', labelOffsetX: 6, labelMaxZoom: 0.8 } },
      { type: 'node', id: 'out-rect',            position: { x: 0,    y: 240 }, style: { shape: { kind: 'rect', width: 40, height: 28, cornerRadius: 6 },                                        labelText: 'out: rect',            labelPlacement: 'right', labelOffsetX: 6, labelMaxZoom: 0.8 } },
      { type: 'node', id: 'out-arc',             position: { x: 260,  y: 240 }, style: { shape: { kind: 'arc', innerR: 8, outerR: 20, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },         labelText: 'out: arc',             labelPlacement: 'right', labelOffsetX: 6, labelMaxZoom: 0.8 } },
      { type: 'node', id: 'out-regular-polygon', position: { x: -260, y: 380 }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 18 },                                               labelText: 'out: pentagon',        labelPlacement: 'right', labelOffsetX: 6, labelMaxZoom: 0.8 } },
      { type: 'node', id: 'out-star',            position: { x: 0,    y: 380 }, style: { shape: { kind: 'star', points: 5, outerRadius: 20, innerRadius: 9 },                                    labelText: 'out: star',            labelPlacement: 'right', labelOffsetX: 6, labelMaxZoom: 0.8 } },
      { type: 'node', id: 'out-polygon',         position: { x: 260,  y: 380 }, style: { shape: { kind: 'polygon', vertices: [ { x: 18, y: 0 }, { x: 9, y: -16 }, { x: -9, y: -16 }, { x: -18, y: 0 }, { x: -9, y: 16 }, { x: 9, y: 16 } ] }, labelText: 'out: polygon', labelPlacement: 'right', labelOffsetX: 6, labelMaxZoom: 0.8 } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-lod-zoom-range')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: [] } },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              bgFill: 0x4f9cf9,
              bgStrokeColor: 0x1d4ed8,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelColor: 0x454545,
              labelBackgroundFill: 0xffffff,
              labelBackgroundStrokeColor: 0xcbd5e1,
              labelBackgroundStrokeWidth: 1,
              labelBackgroundCornerRadius: 4,
              labelBackgroundPadding: 4,
            },
          },
        },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const IN_IDS = ['in-circle', 'in-rect', 'in-arc', 'in-regular-polygon', 'in-star', 'in-polygon'];
    const OUT_IDS = ['out-circle', 'out-rect', 'out-arc', 'out-regular-polygon', 'out-star', 'out-polygon'];
    const settings = { zoomedInMin: 1.0, zoomedOutMax: 0.8 };
    const zoomCtl = { value: canvas.camera.scale };
    const gui = new GUI({ title: 'LOD zoom range' });
    onStoryTeardown(() => gui.destroy());
    const liveZoom = gui.add(zoomCtl, 'value').name('current zoom').listen().disable();
    gui.add(settings, 'zoomedInMin', 0.5, 3, 0.05).name('min (zoomed-in row)').onChange(() => {
      for (const id of IN_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, { style: { ...prev, labelMinZoom: settings.zoomedInMin } });
      }
    });
    gui.add(settings, 'zoomedOutMax', 0.2, 2, 0.05).name('max (zoomed-out row)').onChange(() => {
      for (const id of OUT_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, { style: { ...prev, labelMaxZoom: settings.zoomedOutMax } });
      }
    });
    const offZoom = canvas.events.on('input:camera:zoom', () => {
      zoomCtl.value = Number(canvas.camera.scale.toFixed(3));
      liveZoom.updateDisplay();
    });
    onStoryTeardown(() => offZoom());
  },
};
