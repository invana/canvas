import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Label/Placements/CenterVsInsideCenter' };
export default meta;
type Story = StoryObj;

/**
 * `'center'` and `'inside-center'` share the geometric anchor (shape
 * centre) but differ in **containment**:
 *
 * - `'center'` is an anchor-only placement — the label may overflow the
 *   host bounds when it doesn't fit.
 * - `'inside-center'` carries the containment contract — the shrink →
 *   truncate → hide cascade kicks in to keep the label inside.
 *
 * Two rows × six shapes:
 *
 * - **top row** — `placement: 'center'`
 * - **bottom row** — `placement: 'inside-center'`
 *
 * Grow `text` length and shrink shape size via the GUI to watch only the
 * top row spill out while the bottom row shrinks / truncates / hides.
 */
export const CenterVsInsideCenter: Story = {
  render: () => createContainer({ id: 'graph-label-center-vs-inside-center' }),

  play: async ({ canvasElement }) => {
    const INITIAL_TEXT = 'a moderately long label';

    const nodes: NodeData[] = [
      // 3-col × 4-row grid. Top block (center) overflows; bottom block
      // (inside-center) contains. Sub-rows separated by 160, blocks by 240.
      // ─── center block (may overflow) ─────────────────────────────────
      { id: 'center-circle',          position: { x: -280, y: -380 }, style: { shape: { kind: 'circle', radius: 25 },                                                                  labelText: INITIAL_TEXT, labelPlacement: 'center' } },
      { id: 'center-rect',            position: { x: 0,    y: -380 }, style: { shape: { kind: 'rect', width: 90, height: 50, cornerRadius: 8 },                                        labelText: INITIAL_TEXT, labelPlacement: 'center' } },
      { id: 'center-arc',             position: { x: 280,  y: -380 }, style: { shape: { kind: 'arc', innerR: 8, outerR: 30, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },         labelText: INITIAL_TEXT, labelPlacement: 'center' } },
      { id: 'center-regular-polygon', position: { x: -280, y: -220 }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 28 },                                               labelText: INITIAL_TEXT, labelPlacement: 'center' } },
      { id: 'center-star',            position: { x: 0,    y: -220 }, style: { shape: { kind: 'star', points: 5, outerRadius: 32, innerRadius: 14 },                                   labelText: INITIAL_TEXT, labelPlacement: 'center' } },
      { id: 'center-polygon',         position: { x: 280,  y: -220 }, style: { shape: { kind: 'polygon', vertices: [ { x: 28, y: 0 }, { x: 14, y: -24 }, { x: -14, y: -24 }, { x: -28, y: 0 }, { x: -14, y: 24 }, { x: 14, y: 24 } ] }, labelText: INITIAL_TEXT, labelPlacement: 'center' } },
      // ─── inside-center block (must fit) ──────────────────────────────
      { id: 'inside-circle',          position: { x: -280, y: 20  }, style: { shape: { kind: 'circle', radius: 25 },                                                                  labelText: INITIAL_TEXT, labelPlacement: 'inside-center' } },
      { id: 'inside-rect',            position: { x: 0,    y: 20  }, style: { shape: { kind: 'rect', width: 90, height: 50, cornerRadius: 8 },                                        labelText: INITIAL_TEXT, labelPlacement: 'inside-center' } },
      { id: 'inside-arc',             position: { x: 280,  y: 20  }, style: { shape: { kind: 'arc', innerR: 8, outerR: 30, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },         labelText: INITIAL_TEXT, labelPlacement: 'inside-center' } },
      { id: 'inside-regular-polygon', position: { x: -280, y: 180 }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 28 },                                               labelText: INITIAL_TEXT, labelPlacement: 'inside-center' } },
      { id: 'inside-star',            position: { x: 0,    y: 180 }, style: { shape: { kind: 'star', points: 5, outerRadius: 32, innerRadius: 14 },                                   labelText: INITIAL_TEXT, labelPlacement: 'inside-center' } },
      { id: 'inside-polygon',         position: { x: 280,  y: 180 }, style: { shape: { kind: 'polygon', vertices: [ { x: 28, y: 0 }, { x: 14, y: -24 }, { x: -14, y: -24 }, { x: -28, y: 0 }, { x: -14, y: 24 }, { x: 14, y: 24 } ] }, labelText: INITIAL_TEXT, labelPlacement: 'inside-center' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-center-vs-inside-center')!;
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
            bgFill: 0xf1f5f9,
            bgStrokeColor: 0x475569,
            bgStrokeWidth: 1,
            labelFontSize: 13,
            labelFontWeight: 600,
            labelColor: 0x454545,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const ALL_IDS = nodes.map((n) => n.id);
    const settings = { text: INITIAL_TEXT, sizeScale: 1 };
    const apply = (): void => {
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        const prevShape = prev.shape;
        // Uniform-scale the shape's size attributes. Keep `kind` and shape-
        // specific fields stable; only the scalar dimensions are touched.
        let nextShape = prevShape;
        if (prevShape?.kind === 'circle') {
          nextShape = { kind: 'circle', radius: 25 * settings.sizeScale };
        } else if (prevShape?.kind === 'rect') {
          nextShape = { kind: 'rect', width: 90 * settings.sizeScale, height: 50 * settings.sizeScale, cornerRadius: 8 };
        } else if (prevShape?.kind === 'arc') {
          nextShape = { kind: 'arc', innerR: 8 * settings.sizeScale, outerR: 30 * settings.sizeScale, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 };
        } else if (prevShape?.kind === 'regular-polygon') {
          nextShape = { kind: 'regular-polygon', sides: 5, radius: 28 * settings.sizeScale };
        } else if (prevShape?.kind === 'star') {
          nextShape = { kind: 'star', points: 5, outerRadius: 32 * settings.sizeScale, innerRadius: 14 * settings.sizeScale };
        } else if (prevShape?.kind === 'polygon') {
          const s = settings.sizeScale;
          nextShape = {
            kind: 'polygon',
            vertices: [
              { x: 28 * s, y: 0 },
              { x: 14 * s, y: -24 * s },
              { x: -14 * s, y: -24 * s },
              { x: -28 * s, y: 0 },
              { x: -14 * s, y: 24 * s },
              { x: 14 * s, y: 24 * s },
            ],
          };
        }
        graph.store.updateNode(id, { style: { ...prev, shape: nextShape, labelText: settings.text } });
      }
    };
    const gui = new GUI({ title: 'center vs inside-center' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'sizeScale', 0.3, 1.6, 0.05).onChange(apply);
  },
};
