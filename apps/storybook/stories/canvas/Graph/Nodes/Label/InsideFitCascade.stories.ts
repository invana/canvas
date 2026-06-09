import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelStyle } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData, type NodeShapeOptions, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Label/InsideFitCascade' };
export default meta;
type Story = StoryObj;

/**
 * For `inside-*` placements the decoration runs a **shrink → truncate →
 * hide** cascade to honour the containment contract:
 *
 * 1. Shrink the font down toward `minFontSize`.
 * 2. If it still doesn't fit at the floor, truncate (ellipsis) to the
 *    width budget.
 * 3. If neither shrink nor truncate produces a renderable result, hide.
 *
 * Row of six shapes, each carrying the same long `inside-center` label.
 * The `sizeScale` slider shrinks every shape uniformly — watch each
 * silhouette walk the cascade at a different threshold (rect with the
 * largest inner box holds the longest, then star with its concave
 * geometry hits "hide" earliest).
 */
export const InsideFitCascade: Story = {
  render: () => createContainer({ id: 'graph-label-inside-fit-cascade' }),

  play: async ({ canvasElement }) => {
    const LONG = 'A long descriptive label that has to fit inside';

    // Per-shape base size used by `scaledShape` below. Hardcoded literal
    // dimensions per the storybook data-pattern convention — no helpers.
    const nodes: NodeData[] = [
      {
        id: 'circle',
        position: { x: -320, y: -180 },
        style: {
          shape: { kind: 'circle', radius: 60 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 16, fontWeight: 600, fill: 0x454545 },
            placement: 'inside-center',
            minFontSize: 9,
          },
        },
      },
      {
        id: 'rect',
        position: { x: 0, y: -180 },
        style: {
          shape: { kind: 'rect', width: 180, height: 100, cornerRadius: 8 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 16, fontWeight: 600, fill: 0x454545 },
            placement: 'inside-center',
            minFontSize: 9,
          },
        },
      },
      {
        id: 'arc',
        position: { x: 320, y: -180 },
        style: {
          shape: { kind: 'arc', innerR: 20, outerR: 65, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 16, fontWeight: 600, fill: 0x454545 },
            placement: 'inside-center',
            minFontSize: 9,
          },
        },
      },
      {
        id: 'regular-polygon',
        position: { x: -320, y: 180 },
        style: {
          shape: { kind: 'regular-polygon', sides: 5, radius: 65 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 16, fontWeight: 600, fill: 0x454545 },
            placement: 'inside-center',
            minFontSize: 9,
          },
        },
      },
      {
        id: 'star',
        position: { x: 0, y: 180 },
        style: {
          shape: { kind: 'star', points: 5, outerRadius: 70, innerRadius: 30 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 16, fontWeight: 600, fill: 0x454545 },
            placement: 'inside-center',
            minFontSize: 9,
          },
        },
      },
      {
        id: 'polygon',
        position: { x: 320, y: 180 },
        style: {
          shape: { kind: 'polygon', vertices: [ { x: 60, y: 0 }, { x: 30, y: -52 }, { x: -30, y: -52 }, { x: -60, y: 0 }, { x: -30, y: 52 }, { x: 30, y: 52 } ] },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 16, fontWeight: 600, fill: 0x454545 },
            placement: 'inside-center',
            minFontSize: 9,
          },
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-inside-fit-cascade')!;
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
        graph: { node: { style: { bgFill: 0xf1f5f9, bgStrokeColor: 0x475569, bgStrokeWidth: 1 } } },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 100);

    // Compute a per-shape scaled geometry. The base sizes above are the
    // 1.0× values; the scale slider multiplies the relevant radius / extent.
    const scaledShape = (id: string, scale: number): NodeShapeOptions => {
      switch (id) {
        case 'circle':
          return { kind: 'circle', radius: 60 * scale };
        case 'rect':
          return { kind: 'rect', width: 180 * scale, height: 100 * scale, cornerRadius: 8 };
        case 'arc':
          return { kind: 'arc', innerR: 20 * scale, outerR: 65 * scale, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 };
        case 'regular-polygon':
          return { kind: 'regular-polygon', sides: 5, radius: 65 * scale };
        case 'star':
          return { kind: 'star', points: 5, outerRadius: 70 * scale, innerRadius: 30 * scale };
        case 'polygon':
          return {
            kind: 'polygon',
            vertices: [
              { x: 60 * scale, y: 0 },
              { x: 30 * scale, y: -52 * scale },
              { x: -30 * scale, y: -52 * scale },
              { x: -60 * scale, y: 0 },
              { x: -30 * scale, y: 52 * scale },
              { x: 30 * scale, y: 52 * scale },
            ],
          };
        default:
          throw new Error(`unknown id ${id}`);
      }
    };

    const ALL_IDS = ['circle', 'rect', 'arc', 'regular-polygon', 'star', 'polygon'];
    const settings = { sizeScale: 1, fontSize: 16, minFontSize: 9, text: LONG };
    const apply = (): void => {
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        const prevLs = prev.labelStyle;
        if (!prevLs || prevLs.content.kind !== 'text') continue;
        const nextLs: ShapeLabelStyle = {
          ...prevLs,
          content: { ...prevLs.content, text: settings.text, fontSize: settings.fontSize },
          minFontSize: settings.minFontSize,
        };
        graph.store.updateNode(id, {
          style: { ...prev, shape: scaledShape(id, settings.sizeScale), labelStyle: nextLs },
        });
      }
    };
    const gui = new GUI({ title: 'Inside-fit cascade' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'sizeScale', 0.2, 1.5, 0.05).onChange(apply);
    gui.add(settings, 'fontSize', 9, 28, 1).onChange(apply);
    gui.add(settings, 'minFontSize', 6, 24, 1).onChange(apply);
  },
};
