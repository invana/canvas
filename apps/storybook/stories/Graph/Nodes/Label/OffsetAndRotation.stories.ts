import type { Meta, StoryObj } from '@storybook/react-vite';
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
 * Two parallel rows × six shapes each:
 *
 * - **top row** (`ref-*`) — `placement: 'bottom'` with no offset / no
 *   rotation. Baseline for every silhouette.
 * - **bottom row** (`tweak-*`) — same placement and shape; the GUI's
 *   offsetX / offsetY / rotationDeg sliders fan out to all six tweak
 *   nodes. Sliders start at 0 so the first nudge produces visible motion.
 */
export const OffsetAndRotation: Story = {
  render: () => createContainer({ id: 'graph-label-offset-rotation' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      // 3-col × 4-row grid: ref block on top (sub-rows at y=-380/-220), tweak
      // block below (sub-rows at y=20/180). Sub-rows arrange the 6 shapes as
      // 3 + 3 instead of one wide row so adjacent labels don't collide.
      // ─── ref block ───────────────────────────────────────────────────
      { id: 'ref-circle',          position: { x: -260, y: -380 }, style: { shape: { kind: 'circle', radius: 24 },                                                                  labelText: 'ref',     labelPlacement: 'bottom' } },
      { id: 'ref-rect',            position: { x: 0,    y: -380 }, style: { shape: { kind: 'rect', width: 56, height: 40, cornerRadius: 8 },                                        labelText: 'ref',     labelPlacement: 'bottom' } },
      { id: 'ref-arc',             position: { x: 260,  y: -380 }, style: { shape: { kind: 'arc', innerR: 10, outerR: 26, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },        labelText: 'ref',     labelPlacement: 'bottom' } },
      { id: 'ref-regular-polygon', position: { x: -260, y: -220 }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 26 },                                               labelText: 'ref',     labelPlacement: 'bottom' } },
      { id: 'ref-star',            position: { x: 0,    y: -220 }, style: { shape: { kind: 'star', points: 5, outerRadius: 28, innerRadius: 12 },                                   labelText: 'ref',     labelPlacement: 'bottom' } },
      { id: 'ref-polygon',         position: { x: 260,  y: -220 }, style: { shape: { kind: 'polygon', vertices: [ { x: 24, y: 0 }, { x: 12, y: -21 }, { x: -12, y: -21 }, { x: -24, y: 0 }, { x: -12, y: 21 }, { x: 12, y: 21 } ] }, labelText: 'ref', labelPlacement: 'bottom' } },
      // ─── tweak block ─────────────────────────────────────────────────
      { id: 'tweak-circle',          position: { x: -260, y: 20  }, style: { shape: { kind: 'circle', radius: 24 },                                                                  labelText: 'tweak me', labelPlacement: 'bottom', labelOffsetX: 0, labelOffsetY: 0, labelRotation: 0 } },
      { id: 'tweak-rect',            position: { x: 0,    y: 20  }, style: { shape: { kind: 'rect', width: 56, height: 40, cornerRadius: 8 },                                        labelText: 'tweak me', labelPlacement: 'bottom', labelOffsetX: 0, labelOffsetY: 0, labelRotation: 0 } },
      { id: 'tweak-arc',             position: { x: 260,  y: 20  }, style: { shape: { kind: 'arc', innerR: 10, outerR: 26, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },        labelText: 'tweak me', labelPlacement: 'bottom', labelOffsetX: 0, labelOffsetY: 0, labelRotation: 0 } },
      { id: 'tweak-regular-polygon', position: { x: -260, y: 180 }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 26 },                                               labelText: 'tweak me', labelPlacement: 'bottom', labelOffsetX: 0, labelOffsetY: 0, labelRotation: 0 } },
      { id: 'tweak-star',            position: { x: 0,    y: 180 }, style: { shape: { kind: 'star', points: 5, outerRadius: 28, innerRadius: 12 },                                   labelText: 'tweak me', labelPlacement: 'bottom', labelOffsetX: 0, labelOffsetY: 0, labelRotation: 0 } },
      { id: 'tweak-polygon',         position: { x: 260,  y: 180 }, style: { shape: { kind: 'polygon', vertices: [ { x: 24, y: 0 }, { x: 12, y: -21 }, { x: -12, y: -21 }, { x: -24, y: 0 }, { x: -12, y: 21 }, { x: 12, y: 21 } ] }, labelText: 'tweak me', labelPlacement: 'bottom', labelOffsetX: 0, labelOffsetY: 0, labelRotation: 0 } },
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

    const TWEAK_IDS = ['tweak-circle', 'tweak-rect', 'tweak-arc', 'tweak-regular-polygon', 'tweak-star', 'tweak-polygon'];
    const settings = { offsetX: 0, offsetY: 0, rotationDeg: 0 };
    const apply = (): void => {
      for (const id of TWEAK_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, {
          style: {
            ...prev,
            labelOffsetX: settings.offsetX,
            labelOffsetY: settings.offsetY,
            labelRotation: (settings.rotationDeg * Math.PI) / 180,
          },
        });
      }
    };
    const gui = new GUI({ title: 'Offset & rotation (bottom row)' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'offsetX', -80, 80, 1).onChange(apply);
    gui.add(settings, 'offsetY', -80, 80, 1).onChange(apply);
    gui.add(settings, 'rotationDeg', -180, 180, 1).name('rotation (deg)').onChange(apply);
  },
};
