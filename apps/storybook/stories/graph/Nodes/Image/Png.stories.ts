import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Image/Png' };
export default meta;
type Story = StoryObj;

/**
 * `NodeStyle.image` with transparent PNG sources. The underlying `bgFill`
 * (a solid silhouette layer painted before the image) shows through the
 * PNG's transparent regions — the texture is cover-fitted into the host
 * silhouette and Pixi blends the image's alpha against the layer
 * beneath. Try changing `bg fill` in the GUI to see the colour read
 * through the logo's gaps.
 *
 * Three Wikimedia-thumbnail logos at different aspect ratios so
 * cover-cropping is visible per shape. The thumbnailer renders the
 * SVG-source files to PNG preserving alpha.
 */
export const Png: Story = {
  render: () => createContainer({ id: 'graph-nodes-image-png' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    // Three twemoji glyphs hosted on jsDelivr (pinned to v15.1.0 for
    // stability). The 72x72 PNGs have transparent backgrounds — the
    // surrounding negative space within each silhouette reveals the
    // underlying `bgFill` solid layer.
    const IMAGES: Record<string, string> = {
      'rocket':    'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/1f680.png',
      'star':      'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/1f31f.png',
      'lightbulb': 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/1f4a1.png',
    };

    const settings = {
      image: 'rocket' as keyof typeof IMAGES,
      alpha: 1,
      fit: 'cover' as 'cover' | 'contain',
      padding: 10,
      bgFill: 0x6366f1,
    };

    const shapeForType = (type: string | undefined): NodeShapeOptions => {
      const r = 38;
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-image-png')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolver fields (shape / bgFill / image) read live from `settings`,
    // so they stay in the constructor; literal label / stroke style moves
    // into canvasOptions. Static positions ride on initData — no layout.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            shape:  (n) => shapeForType(n.type),
            bgFill: () => settings.bgFill,
            image: () => ({
              url: IMAGES[settings.image]!,
              alpha: settings.alpha,
              fit: settings.fit,
              padding: settings.padding,
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

    const gui = new GUI({ title: 'PNG (transparent)' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'image', Object.keys(IMAGES)).onChange(rerenderAll);
    gui.add(settings, 'fit', ['cover', 'contain']).onChange(rerenderAll);
    gui.add(settings, 'padding', 0, 30, 1).onChange(rerenderAll);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);
  },
};
