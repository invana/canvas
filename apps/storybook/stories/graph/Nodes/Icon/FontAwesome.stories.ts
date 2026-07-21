import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, loadIconFont, WheelZoomBehaviour } from '@invana/canvas';
import type { InsetAnchor } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Icon/FontAwesome' };
export default meta;
type Story = StoryObj;

/**
 * `NodeStyle.icon` with `kind: 'glyph'` driving a **Font Awesome 6 Free
 * Solid** codepoint. The engine itself is icon-vendor-agnostic — FA-
 * specific bits (codepoint table, font family, CDN URL) live entirely in
 * this story file. Deleting it removes Font Awesome from the codebase.
 *
 * `loadIconFont` injects the stylesheet and waits for the font face to
 * be ready before resolving — without that wait, Pixi paints the first
 * frame with the system fallback (blank glyphs). Probe at weight 900
 * because FA 6 Free Solid lives there; weight 400 preloads only the
 * Regular face.
 */
export const FontAwesome: Story = {
  render: () => createContainer({ id: 'graph-nodes-icon-fa' }),

  play: async ({ canvasElement }) => {
    // FA 6.5 Solid codepoints stored as literal Private-Use chars
    // (U+F004..U+F1C0). Editors render them as blank boxes; git tracks
    // them as UTF-8 bytes regardless. If your editor / VCS workflow
    // mangles PUA chars, swap to `\uXXXX` escapes — the runtime behaviour
    // is identical (the Pixi text renderer sees the same codepoints).
    const FA: Record<string, string> = {
      'fa-database': '',
      'fa-rocket':   '',
      'fa-user':     '',
      'fa-heart':    '',
      'fa-star':     '',
      'fa-bell':     '',
      'fa-gear':     '',
      'fa-bolt':     '',
    };
    const FA_FAMILY = 'Font Awesome 6 Free';
    const FA_WEIGHT = 900;

    await loadIconFont(
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
      FA_FAMILY,
      FA_WEIGHT,
    );

    const nodes: NodeData[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    const settings = {
      icon: 'fa-database' as keyof typeof FA,
      color: 0xffffff,
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-icon-fa')!;
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
              char: FA[settings.icon]!,
              fontFamily: FA_FAMILY,
              fontWeight: FA_WEIGHT,
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

    const gui = new GUI({ title: 'Font Awesome icon' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'icon', Object.keys(FA)).onChange(rerenderAll);
    gui.addColor(settings, 'color').name('icon color').onChange(rerenderAll);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.05).onChange(rerenderAll);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);
  },
};
