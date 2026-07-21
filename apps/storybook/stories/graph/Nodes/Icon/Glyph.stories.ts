import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { InsetAnchor } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Icon/Glyph' };
export default meta;
type Story = StoryObj;

/**
 * `NodeStyle.icon` with `kind: 'glyph'` — a single character drawn inside
 * the host shape. Uses system Unicode glyphs (★, ♥, ⚙, ☂, ☎, ♻) so no
 * font loading is needed; see `IconFontAwesome` for the icon-font variant.
 *
 * 3-col × 2-row grid of every built-in shape kind. The lil-gui knobs fan
 * out to every cell via the layer-template resolver — pick a glyph,
 * tweak `sizeRatio` / `color` / `anchor`, and watch every silhouette pick
 * the same inset.
 */
export const Glyph: Story = {
  render: () => createContainer({ id: 'graph-nodes-icon-glyph' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    // Curated BMP Unicode glyphs from the Miscellaneous Symbols / Dingbats
    // ranges — render reliably across system fonts without needing an
    // external icon-font CDN. Each value is the literal char; replace with
    // `'\uXXXX'` escapes if your workflow needs ASCII-only source.
    const GLYPHS: Record<string, string> = {
      star:     '★', // U+2605
      heart:    '❤', // U+2764
      gear:     '⚙', // U+2699
      umbrella: '☂', // U+2602
      phone:    '☎', // U+260E
      recycle:  '♻', // U+267B
    };

    const settings = {
      glyph: 'star' as keyof typeof GLYPHS,
      color: 0xffffff,
      sizeRatio: 0.5,
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-icon-glyph')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolver fields (shape / bgFill / icon / labelText) read live `settings`,
    // so they stay in the constructor; pure literal style fields move to config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            shape:  (n) => shapeForType(n.type),
            bgFill: () => settings.bgFill,
            icon: () => ({
              kind: 'glyph',
              char: GLYPHS[settings.glyph]!,
              color: settings.color,
              sizeRatio: settings.sizeRatio,
              anchor: settings.anchor,
            }),
            labelText: (n) => n.type ?? '?',
          },
        },
      },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              bgStrokeColor: 0x111827,
              bgStrokeWidth: 1,
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
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const rerenderAll = (): void => {
      for (const node of graph.store.nodes()) {
        graph.store.updateNode(node.id, { style: undefined });
      }
    };

    const gui = new GUI({ title: 'Glyph icon' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'glyph', Object.keys(GLYPHS)).onChange(rerenderAll);
    gui.addColor(settings, 'color').name('glyph color').onChange(rerenderAll);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.05).onChange(rerenderAll);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);
  },
};
