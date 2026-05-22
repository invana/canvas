import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Stroke' };
export default meta;
type Story = StoryObj;

/**
 * Background stroke options on `NodeStyle` — `bgStrokeColor`,
 * `bgStrokeAlpha`, `bgStrokeWidth`, `bgStrokeAlignment` (`inside` /
 * `center` / `outside`), `bgStrokeDashArray` (`[on, off]`),
 * `bgStrokeDashOffset`, `bgStrokeCap`, and `bgStrokeJoin`.
 *
 * One column per built-in shape kind, in a 3×2 grid, so each tweak is
 * exercised against every silhouette. The lil-gui knobs all fan out to
 * every cell via field-level resolvers on the layer template — the
 * per-node data stays minimal (`{ id, type, position }`).
 *
 * Set both `dash on` and `dash off` to 0 to disable dashing (solid line).
 */
export const Stroke: Story = {
  render: () => createContainer({ id: 'graph-nodes-stroke' }),

  play: async ({ canvasElement }) => {
    // 3-col × 2-row grid. Per-node data carries no style — geometry,
    // stroke, fill, and label all flow from the layer-template resolvers.
    const nodes: NodeData[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    // Closed over by the resolvers below. Mutated by lil-gui handlers.
    const settings = {
      size: 36,
      bgFill: 0xeff6ff,
      strokeColor: 0x1d4ed8,
      strokeAlpha: 1,
      strokeWidth: 3,
      strokeAlignment: 'center' as 'inside' | 'center' | 'outside',
      dashOn: 0,
      dashOff: 0,
      dashOffset: 0,
      strokeCap: 'butt' as 'butt' | 'round' | 'square',
      strokeJoin: 'miter' as 'miter' | 'round' | 'bevel',
    };

    const shapeForType = (type: string | undefined): NodeShapeOptions => {
      const r = settings.size;
      switch (type) {
        case 'circle':
          return { kind: 'circle', radius: r };
        case 'rect':
          return { kind: 'rect', width: r * 2.2, height: r * 1.5, cornerRadius: 8 };
        case 'arc':
          return { kind: 'arc', innerR: r * 0.4, outerR: r, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 };
        case 'regular-polygon':
          return { kind: 'regular-polygon', sides: 5, radius: r };
        case 'star':
          return { kind: 'star', points: 5, outerRadius: r * 1.06, innerRadius: r * 0.45 };
        case 'polygon':
          return {
            kind: 'polygon',
            vertices: [
              { x: r,        y: 0 },
              { x: r * 0.5,  y: -r * 0.866 },
              { x: -r * 0.5, y: -r * 0.866 },
              { x: -r,       y: 0 },
              { x: -r * 0.5, y: r * 0.866 },
              { x: r * 0.5,  y: r * 0.866 },
            ],
          };
        default:
          throw new Error(`unknown node type "${type}"`);
      }
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-stroke')!;
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
            shape:              (n) => shapeForType(n.type),
            bgFill:             () => settings.bgFill,
            bgStrokeColor:      () => settings.strokeColor,
            bgStrokeAlpha:      () => settings.strokeAlpha,
            bgStrokeWidth:      () => settings.strokeWidth,
            bgStrokeAlignment:  () => settings.strokeAlignment,
            // The Resolvable form requires a non-undefined return, so the
            // tuple is always set. Both endpoints at 0 reads as a solid
            // stroke (no dash period). Bump either > 0 to dash.
            bgStrokeDashArray:  () => [settings.dashOn, settings.dashOff] as const,
            bgStrokeDashOffset: () => settings.dashOffset,
            bgStrokeCap:        () => settings.strokeCap,
            bgStrokeJoin:       () => settings.strokeJoin,
            labelText:          (n) => n.type ?? '?',
            labelFontSize: 12,
            labelFontWeight: 600,
            labelColor: 0x454545,
            labelPlacement: 'bottom',
            labelOffsetY: 8,
            labelBackgroundFill: 0xffffff,
            labelBackgroundStrokeColor: 0xcbd5e1,
            labelBackgroundStrokeWidth: 1,
            labelBackgroundCornerRadius: 4,
            labelBackgroundPadding: 3,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);

    // Trigger re-resolve on every cell so resolvers pick up the mutated
    // `settings` and re-emit the spec to the renderer.
    const rerenderAll = (): void => {
      for (const node of graph.store.nodes()) {
        graph.store.updateNode(node.id, { style: undefined });
      }
    };

    const gui = new GUI({ title: 'Stroke' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'size', 12, 64, 1).name('size (px)').onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);

    const s = gui.addFolder('stroke');
    s.addColor(settings, 'strokeColor').name('color').onChange(rerenderAll);
    s.add(settings, 'strokeAlpha', 0, 1, 0.05).name('alpha').onChange(rerenderAll);
    s.add(settings, 'strokeWidth', 0, 16, 0.5).name('width').onChange(rerenderAll);
    s.add(settings, 'strokeAlignment', ['inside', 'center', 'outside']).name('alignment').onChange(rerenderAll);
    s.add(settings, 'strokeCap', ['butt', 'round', 'square']).name('cap').onChange(rerenderAll);
    s.add(settings, 'strokeJoin', ['miter', 'round', 'bevel']).name('join').onChange(rerenderAll);

    const d = gui.addFolder('dash');
    d.add(settings, 'dashOn', 0, 40, 1).name('on (0 = solid)').onChange(rerenderAll);
    d.add(settings, 'dashOff', 0, 40, 1).name('off (0 = solid)').onChange(rerenderAll);
    d.add(settings, 'dashOffset', 0, 40, 1).name('offset').onChange(rerenderAll);
  },
};
