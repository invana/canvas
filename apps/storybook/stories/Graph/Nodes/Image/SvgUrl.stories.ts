import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { InsetAnchor } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Image/SvgUrl' };
export default meta;
type Story = StoryObj;

/**
 * `NodeStyle.icon` with `kind: 'svg-url'` — the engine fetches the SVG
 * from a remote URL, concatenates every drawing primitive (`path`,
 * `circle`, `rect`, `line`, `polyline`, `polygon`, `ellipse`) into a
 * single `pathD`, and renders it as a Pixi Graphics path. The result is
 * cached globally per URL after the first fetch.
 *
 * Sibling stories:
 * - `Graph/Nodes/Image/Raster` — raster image via `NodeStyle.image`.
 * - `Graph/Nodes/Icon/Svg` — inline pathD (no fetch).
 * - `Graph/Nodes/Icon/Glyph` / `Icon/FontAwesome` — font-glyph variants.
 *
 * Use `kind: 'svg-url'` when the consumer wants to point at their own
 * remote SVG (logo, sample artwork). For curated icon-library usage,
 * prefer a font glyph or an inline pathD — the engine is icon-vendor-
 * agnostic and has no vendor-specific fetch glue.
 *
 * URLs below pull from Iconify's CDN (Lucide icon pack). Iconify
 * serves SVG with CORS enabled and the icons have plain `path` data
 * the engine's extractor handles cleanly.
 */
export const SvgUrl: Story = {
  render: () => createContainer({ id: 'graph-nodes-image-svg-url' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    const URLS: Record<string, string> = {
      heart:    'https://api.iconify.design/lucide/heart.svg',
      star:     'https://api.iconify.design/lucide/star.svg',
      database: 'https://api.iconify.design/lucide/database.svg',
      bell:     'https://api.iconify.design/lucide/bell.svg',
      rocket:   'https://api.iconify.design/lucide/rocket.svg',
      bolt:     'https://api.iconify.design/lucide/zap.svg',
    };

    const settings = {
      icon: 'heart' as keyof typeof URLS,
      color: 0xffffff,
      strokeWidth: 2,
      sizeRatio: 0.55,
      anchor: 'center' as InsetAnchor,
      alpha: 1,
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-image-svg-url')!;
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
              kind: 'svg-url',
              url: URLS[settings.icon]!,
              color: settings.color,
              strokeWidth: settings.strokeWidth,
              sizeRatio: settings.sizeRatio,
              anchor: settings.anchor,
              alpha: settings.alpha,
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

    const gui = new GUI({ title: 'SVG-URL icon' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'icon', Object.keys(URLS)).onChange(rerenderAll);
    gui.addColor(settings, 'color').name('icon color').onChange(rerenderAll);
    gui.add(settings, 'strokeWidth', 0, 16, 0.5).onChange(rerenderAll);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.05).onChange(rerenderAll);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(rerenderAll);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);
  },
};
