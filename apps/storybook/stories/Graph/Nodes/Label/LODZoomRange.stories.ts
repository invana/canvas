import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/LODZoomRange' };
export default meta;
type Story = StoryObj;

/**
 * `labelMinZoom` / `labelMaxZoom` declare a **camera zoom band** for the
 * label. The label is hidden when `camera.scale < labelMinZoom` or
 * `> labelMaxZoom`. Common uses: hide noisy detail when zoomed out,
 * hide a coarse summary when zoomed in.
 *
 * Three nodes in a column, each with a different band:
 *
 * - **always**:        no `min` / `max` — visible at every zoom.
 * - **zoomed-in**:     `labelMinZoom: 1.0` — appears only when zoomed in.
 * - **zoomed-out**:    `labelMaxZoom: 0.8` — disappears once you zoom in.
 *
 * Scroll-wheel to zoom and watch the labels mount / unmount at the
 * configured thresholds. The current zoom is shown in the GUI.
 */
export const LODZoomRange: Story = {
  render: () => createContainer({ id: 'graph-label-lod-zoom-range' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'always',
        position: { x: 0, y: -100 },
        style: {
          labelText: 'always (no band)',
          labelPlacement: 'right',
          labelOffsetX: 6,
        },
      },
      {
        id: 'zoomed-in',
        position: { x: 0, y: 0 },
        style: {
          labelText: 'zoomed-in (min 1.0)',
          labelPlacement: 'right',
          labelOffsetX: 6,
          labelMinZoom: 1.0,
        },
      },
      {
        id: 'zoomed-out',
        position: { x: 0, y: 100 },
        style: {
          labelText: 'zoomed-out (max 0.8)',
          labelPlacement: 'right',
          labelOffsetX: 6,
          labelMaxZoom: 0.8,
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-lod-zoom-range')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 14 },
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
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 200);

    const settings = {
      zoom: canvas.camera.scale,
      zoomedInMin: 1.0,
      zoomedOutMax: 0.8,
    };
    const zoomCtl = { value: canvas.camera.scale };
    const gui = new GUI({ title: 'LOD zoom range' });
    onStoryTeardown(() => gui.destroy());
    const liveZoom = gui.add(zoomCtl, 'value').name('current zoom').listen().disable();
    gui.add(settings, 'zoomedInMin', 0.5, 3, 0.05).name('min (zoomed-in)').onChange(() => {
      const prev = (graph.store.getNode('zoomed-in')?.style as NodeStyle | undefined) ?? {};
      graph.store.updateNode('zoomed-in', { style: { ...prev, labelMinZoom: settings.zoomedInMin } });
    });
    gui.add(settings, 'zoomedOutMax', 0.2, 2, 0.05).name('max (zoomed-out)').onChange(() => {
      const prev = (graph.store.getNode('zoomed-out')?.style as NodeStyle | undefined) ?? {};
      graph.store.updateNode('zoomed-out', { style: { ...prev, labelMaxZoom: settings.zoomedOutMax } });
    });
    // Mirror the camera zoom into the GUI display so the user can see the
    // threshold they're crossing.
    const offZoom = canvas.events.on('camera:zoom', () => {
      zoomCtl.value = Number(canvas.camera.scale.toFixed(3));
      liveZoom.updateDisplay();
    });
    onStoryTeardown(() => offZoom());
  },
};
