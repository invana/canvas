import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { InsetAnchor } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Icon/Svg' };
export default meta;
type Story = StoryObj;

/**
 * `NodeStyle.icon` with `kind: 'svg'` — an inline SVG `pathD` rendered
 * inside the host shape. Use this kind when you have the path data in
 * hand (Lucide JSON, Fluent System Icons export, hand-authored). For
 * URL-based loading, see `kind: 'svg-url'`.
 *
 * 3-col × 2-row grid of every built-in shape kind. The lil-gui knobs fan
 * out to every cell via the layer-template resolver — pick a path, tweak
 * `color` / `strokeWidth` / `sizeRatio` / `anchor`, and watch every
 * silhouette pick the same inset.
 */
export const Svg: Story = {
  render: () => createContainer({ id: 'graph-nodes-icon-svg' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    // Inline SVG `d` attribute strings authored against a 100×100 viewBox.
    // Closed paths (`Z`) are filled; open paths render as stroke-only when
    // `strokeWidth > 0`.
    const PATHS: Record<string, string> = {
      check:       'M 15 52 L 42 80 L 88 22',
      plus:        'M 42 12 H 58 V 42 H 88 V 58 H 58 V 88 H 42 V 58 H 12 V 42 H 42 Z',
      triangle:    'M 50 10 L 90 88 L 10 88 Z',
      diamond:     'M 50 8 L 92 50 L 50 92 L 8 50 Z',
      'arrow-right': 'M 10 40 H 56 V 20 L 92 50 L 56 80 V 60 H 10 Z',
      bolt:        'M 56 8 L 22 56 H 44 L 36 92 L 76 40 H 52 L 58 8 Z',
    };

    const settings = {
      path: 'check' as keyof typeof PATHS,
      color: 0xffffff,
      strokeWidth: 6,
      sizeRatio: 0.55,
      anchor: 'center' as InsetAnchor,
      bgFill: 0x6366f1,
    };

    const shapeForType = (type: string | undefined): NodeShapeOptions => {
      const r = 36;
      switch (type) {
        case 'circle':          return { kind: 'circle', radius: r };
        case 'rect':            return { kind: 'rect', width: r * 2.2, height: r * 1.5, cornerRadius: 8 };
        case 'arc':             return { kind: 'arc', innerR: r * 0.4, outerR: r, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 };
        case 'regular-polygon': return { kind: 'regular-polygon', sides: 5, radius: r };
        case 'star':            return { kind: 'star', points: 5, outerRadius: r * 1.06, innerRadius: r * 0.45 };
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-icon-svg')!;
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
            shape:         (n) => shapeForType(n.type),
            bgFill:        () => settings.bgFill,
            bgStrokeColor: 0x111827,
            bgStrokeWidth: 1,
            icon: () => ({
              kind: 'svg',
              pathD: PATHS[settings.path]!,
              viewBox: { width: 100, height: 100 },
              color: settings.color,
              strokeWidth: settings.strokeWidth,
              sizeRatio: settings.sizeRatio,
              anchor: settings.anchor,
            }),
            labelText: (n) => n.type ?? '?',
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

    const rerenderAll = (): void => {
      for (const node of graph.store.nodes()) {
        graph.store.updateNode(node.id, { style: undefined });
      }
    };

    const gui = new GUI({ title: 'SVG icon' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'path', Object.keys(PATHS)).onChange(rerenderAll);
    gui.addColor(settings, 'color').name('icon color').onChange(rerenderAll);
    gui.add(settings, 'strokeWidth', 0, 16, 0.5).onChange(rerenderAll);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.05).onChange(rerenderAll);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);
  },
};
