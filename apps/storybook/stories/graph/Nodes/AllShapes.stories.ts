import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData, type NodeShapeOptions } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Nodes/AllShapes' };
export default meta;
type Story = StoryObj;

/**
 * Test rig: every built-in node shape kind × every canonical state in one
 * grid. Columns vary the shape kind (`circle`, `rect`, `arc`,
 * `regular-polygon`, `star`, `polygon`). Rows vary the state — top row is
 * the base (no state); the five rows below carry one of the canonical
 * states from `DEFAULT_NODE_STATES` (`hovered`, `selected`, `highlighted`,
 * `dimmed`, `disabled`).
 *
 * Per-node data is minimal — `{ id, type, position, states? }`. The shape
 * geometry, label text, and base colours all live on the layer template
 * via **field-level resolvers** (`NodeOption.style.shape = (n) => ...`).
 * The lil-gui knobs mutate a single `settings` object the resolvers close
 * over, so a slider change re-flows the new value to every cell once we
 * poke each node into a re-resolve.
 */
export const AllShapes: Story = {
  render: () => createContainer({ id: 'graph-nodes-all-shapes' }),

  play: async ({ canvasElement }) => {
    // Per-cell data: just position, type tag, and (optional) active state.
    // No style here — geometry, label, fill, stroke all come from the
    // layer-template resolvers below.
    const nodes: NodeData[] = [
      // ─── row: default (no state) — y = -360 ────────────────────────
      { id: 'default-circle',          type: 'circle',          position: { x: -500, y: -360 } },
      { id: 'default-rect',            type: 'rect',            position: { x: -300, y: -360 } },
      { id: 'default-arc',             type: 'arc',             position: { x: -100, y: -360 } },
      { id: 'default-regular-polygon', type: 'regular-polygon', position: { x: 100,  y: -360 } },
      { id: 'default-star',            type: 'star',            position: { x: 300,  y: -360 } },
      { id: 'default-polygon',         type: 'polygon',         position: { x: 500,  y: -360 } },
      // ─── row: hovered — y = -200 ──────────────────────────────────
      { id: 'hovered-circle',          type: 'circle',          position: { x: -500, y: -200 }, states: ['hovered'] },
      { id: 'hovered-rect',            type: 'rect',            position: { x: -300, y: -200 }, states: ['hovered'] },
      { id: 'hovered-arc',             type: 'arc',             position: { x: -100, y: -200 }, states: ['hovered'] },
      { id: 'hovered-regular-polygon', type: 'regular-polygon', position: { x: 100,  y: -200 }, states: ['hovered'] },
      { id: 'hovered-star',            type: 'star',            position: { x: 300,  y: -200 }, states: ['hovered'] },
      { id: 'hovered-polygon',         type: 'polygon',         position: { x: 500,  y: -200 }, states: ['hovered'] },
      // ─── row: selected — y = -40 ──────────────────────────────────
      { id: 'selected-circle',          type: 'circle',          position: { x: -500, y: -40 }, states: ['selected'] },
      { id: 'selected-rect',            type: 'rect',            position: { x: -300, y: -40 }, states: ['selected'] },
      { id: 'selected-arc',             type: 'arc',             position: { x: -100, y: -40 }, states: ['selected'] },
      { id: 'selected-regular-polygon', type: 'regular-polygon', position: { x: 100,  y: -40 }, states: ['selected'] },
      { id: 'selected-star',            type: 'star',            position: { x: 300,  y: -40 }, states: ['selected'] },
      { id: 'selected-polygon',         type: 'polygon',         position: { x: 500,  y: -40 }, states: ['selected'] },
      // ─── row: highlighted — y = 120 ───────────────────────────────
      { id: 'highlighted-circle',          type: 'circle',          position: { x: -500, y: 120 }, states: ['highlighted'] },
      { id: 'highlighted-rect',            type: 'rect',            position: { x: -300, y: 120 }, states: ['highlighted'] },
      { id: 'highlighted-arc',             type: 'arc',             position: { x: -100, y: 120 }, states: ['highlighted'] },
      { id: 'highlighted-regular-polygon', type: 'regular-polygon', position: { x: 100,  y: 120 }, states: ['highlighted'] },
      { id: 'highlighted-star',            type: 'star',            position: { x: 300,  y: 120 }, states: ['highlighted'] },
      { id: 'highlighted-polygon',         type: 'polygon',         position: { x: 500,  y: 120 }, states: ['highlighted'] },
      // ─── row: dimmed — y = 280 ────────────────────────────────────
      { id: 'dimmed-circle',          type: 'circle',          position: { x: -500, y: 280 }, states: ['dimmed'] },
      { id: 'dimmed-rect',            type: 'rect',            position: { x: -300, y: 280 }, states: ['dimmed'] },
      { id: 'dimmed-arc',             type: 'arc',             position: { x: -100, y: 280 }, states: ['dimmed'] },
      { id: 'dimmed-regular-polygon', type: 'regular-polygon', position: { x: 100,  y: 280 }, states: ['dimmed'] },
      { id: 'dimmed-star',            type: 'star',            position: { x: 300,  y: 280 }, states: ['dimmed'] },
      { id: 'dimmed-polygon',         type: 'polygon',         position: { x: 500,  y: 280 }, states: ['dimmed'] },
      // ─── row: disabled — y = 440 ──────────────────────────────────
      { id: 'disabled-circle',          type: 'circle',          position: { x: -500, y: 440 }, states: ['disabled'] },
      { id: 'disabled-rect',            type: 'rect',            position: { x: -300, y: 440 }, states: ['disabled'] },
      { id: 'disabled-arc',             type: 'arc',             position: { x: -100, y: 440 }, states: ['disabled'] },
      { id: 'disabled-regular-polygon', type: 'regular-polygon', position: { x: 100,  y: 440 }, states: ['disabled'] },
      { id: 'disabled-star',            type: 'star',            position: { x: 300,  y: 440 }, states: ['disabled'] },
      { id: 'disabled-polygon',         type: 'polygon',         position: { x: 500,  y: 440 }, states: ['disabled'] },
    ];

    // Mutated by the lil-gui handlers; read by the resolvers below on
    // every `resolveNodeStyle` pass.
    const settings = {
      size: 32,
      bgFill: 0x4f9cf9,
      bgStrokeColor: 0x1d4ed8,
      bgStrokeWidth: 1,
    };

    // Build the shape geometry for a given type tag at the current size.
    // `size` is the dominant radius-equivalent in pixels; rect / polygon
    // dimensions derive from it so all shapes share a single px control.
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

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-all-shapes')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolver fields close over the mutable `settings`, so they stay in the
    // constructor `options` (functions aren't serialisable). The pure literal
    // label style fields ride in `canvasOptions.layers.graph` and shallow-merge
    // with these at init.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            shape:         (n) => shapeForType(n.type),
            bgFill:        () => settings.bgFill,
            bgStrokeColor: () => settings.bgStrokeColor,
            bgStrokeWidth: () => settings.bgStrokeWidth,
            labelText:     (n) => n.states?.[0] ?? 'default',
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
              labelFontSize: 12,
              labelFontWeight: 600,
              labelColor: 0x454545,
              labelPlacement: 'bottom',
              labelOffsetY: 6,
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

    // Force every node to re-resolve its style against the (mutated) layer
    // template + current `settings`. `updateNode` with `style: undefined`
    // clears the per-instance overlay and triggers `resolveNodeStyle`.
    const rerenderAll = (): void => {
      for (const node of graph.store.nodes()) {
        graph.store.updateNode(node.id, { style: undefined });
      }
    };

    const gui = new GUI({ title: 'AllShapes' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'size', 12, 96, 1).name('size (px)').onChange(rerenderAll);
    gui.addColor(settings, 'bgFill').name('bg fill').onChange(rerenderAll);
    gui.addColor(settings, 'bgStrokeColor').name('stroke color').onChange(rerenderAll);
    gui.add(settings, 'bgStrokeWidth', 0, 8, 0.5).name('stroke width').onChange(rerenderAll);
  },
};
