import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Image/Jpeg' };
export default meta;
type Story = StoryObj;

/**
 * `NodeStyle.image` with opaque JPEG sources. The texture is cover-fitted
 * into the host silhouette (uniform scale, may crop on the cross-axis);
 * the engine does not expose CSS-style `background-size` /
 * `background-repeat` knobs on raster fills. Three picsum seeds at
 * different aspect ratios so cover-cropping is visible per shape.
 *
 * For transparent-source rasters (showing the underlying `bgFill`
 * through holes in the image) see the companion `Image/Png` story.
 */
export const Jpeg: Story = {
  render: () => createContainer({ id: 'graph-nodes-image-jpeg' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    // Three picsum seeds at different aspect ratios so cover-cropping is
    // visible per silhouette. Picsum is deterministic-by-seed and
    // CORS-friendly; the URL pattern serves JPEG.
    const IMAGES: Record<string, string> = {
      'square': 'https://picsum.photos/seed/canvas-square/200/200',
      'wide':   'https://picsum.photos/seed/canvas-wide/300/120',
      'tall':   'https://picsum.photos/seed/canvas-tall/120/300',
    };

    const settings = {
      image: 'square' as keyof typeof IMAGES,
      alpha: 1,
      fit: 'cover' as 'cover' | 'contain',
      padding: 0,
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-image-jpeg')!;
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

    const gui = new GUI({ title: 'JPEG image' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'image', Object.keys(IMAGES)).onChange(rerenderAll);
    gui.add(settings, 'fit', ['cover', 'contain']).onChange(rerenderAll);
    gui.add(settings, 'padding', 0, 30, 1).onChange(rerenderAll);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);
  },
};
