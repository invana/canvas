import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeFillLayer } from '@invana/canvas/primitives';
import { GraphCanvas, GraphLayer, type GraphNode, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/BgFill/Stacked' };
export default meta;
type Story = StoryObj;

/**
 * `NodeStyle.bgFill` accepts the full `ShapeFill` union — `number` for the
 * solid shorthand, a single `ShapeFillLayer`, or `ReadonlyArray<ShapeFillLayer>`
 * for stacked composition. Array layers paint **bottom-up** (index 0 sits
 * underneath).
 *
 * The stack here composes:
 *
 * 1. **base** — `kind: 'solid'` (the host plate).
 * 2. **accent** — another `kind: 'solid'` with `alpha`, washing the plate.
 * 3. **svg badge** — `kind: 'svg'` anchored top-right (corner vector inset).
 * 4. **glyph** — large centred glyph.
 *
 * Each layer can be toggled in the GUI; the stack updates live across
 * every shape kind.
 */
export const Stacked: Story = {
  render: () => createContainer({ id: 'graph-nodes-bgfill-stacked' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { id: 'circle',          type: 'circle',          position: { x: -280, y: -150 } },
      { id: 'rect',            type: 'rect',            position: { x: 0,    y: -150 } },
      { id: 'arc',             type: 'arc',             position: { x: 280,  y: -150 } },
      { id: 'regular-polygon', type: 'regular-polygon', position: { x: -280, y: 150 } },
      { id: 'star',            type: 'star',            position: { x: 0,    y: 150 } },
      { id: 'polygon',         type: 'polygon',         position: { x: 280,  y: 150 } },
    ];

    const settings = {
      baseEnabled: true,
      baseColor: 0x1e3a8a,
      accentEnabled: true,
      accentColor: 0xfacc15,
      accentAlpha: 0.25,
      svgEnabled: false,
      svgColor: 0xfbbf24,
      svgAnchor: 'top-right' as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      svgSizeRatio: 0.35,
      glyphEnabled: true,
      glyphChar: '★',
      glyphColor: 0xffffff,
      glyphSizeRatio: 0.5,
    };

    const buildLayers = (): ShapeFillLayer[] => {
      const layers: ShapeFillLayer[] = [];
      if (settings.baseEnabled) {
        layers.push({ kind: 'solid', color: settings.baseColor });
      }
      if (settings.accentEnabled) {
        layers.push({ kind: 'solid', color: settings.accentColor, alpha: settings.accentAlpha });
      }
      if (settings.svgEnabled) {
        layers.push({
          kind: 'svg',
          pathD: 'M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z',
          viewBox: { width: 24, height: 24 },
          strokeWidth: 2,
          color: settings.svgColor,
          sizeRatio: settings.svgSizeRatio,
          anchor: settings.svgAnchor,
        });
      }
      if (settings.glyphEnabled) {
        layers.push({
          kind: 'glyph',
          char: settings.glyphChar,
          color: settings.glyphColor,
          sizeRatio: settings.glyphSizeRatio,
        });
      }
      return layers;
    };

    const shapeForType = (type: string | undefined): NodeShapeOptions => {
      const r = 40;
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-bgfill-stacked')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolver fields (shape / bgFill / labelText are functions) stay in the
    // constructor; the pure-literal style fields move into canvasOptions.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            shape:  (n) => shapeForType(n.type),
            bgFill: () => buildLayers(),
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

    const gui = new GUI({ title: 'Stacked bgFill layers' });
    onStoryTeardown(() => gui.destroy());

    const base = gui.addFolder('1. base (solid)');
    base.add(settings, 'baseEnabled').name('enabled').onChange(rerenderAll);
    base.addColor(settings, 'baseColor').name('color').onChange(rerenderAll);

    const accent = gui.addFolder('2. accent (solid + alpha)');
    accent.add(settings, 'accentEnabled').name('enabled').onChange(rerenderAll);
    accent.addColor(settings, 'accentColor').name('color').onChange(rerenderAll);
    accent.add(settings, 'accentAlpha', 0, 1, 0.05).name('alpha').onChange(rerenderAll);

    const svg = gui.addFolder('3. svg badge');
    svg.add(settings, 'svgEnabled').name('enabled').onChange(rerenderAll);
    svg.addColor(settings, 'svgColor').name('color').onChange(rerenderAll);
    svg.add(settings, 'svgSizeRatio', 0.1, 1, 0.05).name('sizeRatio').onChange(rerenderAll);
    svg.add(settings, 'svgAnchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(rerenderAll);

    const glyph = gui.addFolder('4. glyph');
    glyph.add(settings, 'glyphEnabled').name('enabled').onChange(rerenderAll);
    glyph.add(settings, 'glyphChar').name('char').onChange(rerenderAll);
    glyph.addColor(settings, 'glyphColor').name('color').onChange(rerenderAll);
    glyph.add(settings, 'glyphSizeRatio', 0.1, 1, 0.05).name('sizeRatio').onChange(rerenderAll);
  },
};
