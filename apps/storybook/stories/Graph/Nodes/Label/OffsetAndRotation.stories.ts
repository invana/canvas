import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/OffsetAndRotation' };
export default meta;
type Story = StoryObj;

/**
 * `labelOffsetX` / `labelOffsetY` shift the label in pixels *after*
 * placement has resolved. `labelRotation` rotates the label about its
 * anchor (radians).
 *
 * Two side-by-side nodes:
 *
 * - **ref** (left) — `placement: 'bottom'` with no offset / no rotation.
 *   Acts as a baseline so the offset/rotation knobs on the right node
 *   read as visible motion rather than a static gap.
 * - **tweak** (right) — same placement; offsetX / offsetY / rotationDeg
 *   are driven by the GUI sliders. Sliders start at 0 so the initial
 *   render matches the reference.
 */
export const OffsetAndRotation: Story = {
  render: () => createContainer({ id: 'graph-label-offset-rotation' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'ref',
        position: { x: -90, y: 0 },
        style: {
          labelText: 'ref (no offset)',
          labelPlacement: 'bottom',
        },
      },
      {
        id: 'tweak',
        position: { x: 90, y: 0 },
        style: {
          labelText: 'tweak me',
          labelPlacement: 'bottom',
          labelOffsetX: 0,
          labelOffsetY: 0,
          labelRotation: 0,
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-offset-rotation')!;
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
            shape: { kind: 'circle', radius: 22 },
            bgFill: 0x10b981,
            bgStrokeColor: 0x047857,
            labelFontSize: 13,
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
    canvas.camera.fitContent(graph.getBounds(), 80);

    const settings = { offsetX: 0, offsetY: 0, rotationDeg: 0 };
    const apply = (): void => {
      const prev = (graph.store.getNode('tweak')?.style as NodeStyle | undefined) ?? {};
      graph.store.updateNode('tweak', {
        style: {
          ...prev,
          labelOffsetX: settings.offsetX,
          labelOffsetY: settings.offsetY,
          labelRotation: (settings.rotationDeg * Math.PI) / 180,
        },
      });
    };
    const gui = new GUI({ title: 'Offset & rotation (right node)' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'offsetX', -80, 80, 1).onChange(apply);
    gui.add(settings, 'offsetY', -80, 80, 1).onChange(apply);
    gui.add(settings, 'rotationDeg', -180, 180, 1).name('rotation (deg)').onChange(apply);
  },
};
