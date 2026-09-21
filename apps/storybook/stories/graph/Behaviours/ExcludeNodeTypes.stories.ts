/**
 * **Scenery that is not a frame** — the case `excludeNodeTypes` exists for.
 *
 * Since 2026-09-22 hover and click-select decline an expanded **group frame** on
 * their own (`excludeGroups: 'expanded'`), keyed on what a node *is*. That
 * covers the common scenery — but only nodes carrying `style.group`. This graph
 * has no frames at all. It has a **legend**: six `legend` nodes (a title, four
 * tier swatches, a footnote) drawn in world space beside the topology, plus a
 * `watermark` caption under it. They are nodes because they must pan and zoom
 * with the graph, and they are scenery because nobody wants to hover them.
 *
 * They are drawn as ordinary circles on purpose — a caption-sized hit area
 * would make the symptom hard to reproduce, and the four swatches genuinely
 * *are* dots. A legend node is indistinguishable from a service until you read
 * its `type`.
 *
 * Nothing structural distinguishes them from a service — same shape kinds, no
 * `group`, no parent. The only thing that separates content from decoration
 * here is `GraphNode.type`, which is exactly what `excludeNodeTypes` keys on.
 *
 * **Turn the exclusion off in the panel to see why it matters.** With it off,
 * sweeping the pointer across the legend makes each caption the focal hover;
 * since a legend node carries no edges for `degree` to expand into,
 * `inactiveState: 'dimmed'` then dims all eleven services at once — the graph
 * greys out because the pointer crossed a label. Clicking one selects it, and a
 * legend entry in a selection is meaningless downstream. With it on, both are
 * inert: the pointer passes over, and a click leaves the selection untouched
 * rather than clearing it.
 *
 * Three properties of the veto the panel makes visible:
 *
 *   - **Focal only.** Set `degree` to 2 and hover a service — the veto never
 *     stops a node from lighting up as a *neighbour*. It says "don't hover at
 *     me", not "never show me as related". (No legend node has an edge, so
 *     here that is a promise about the mechanism rather than a visible effect.)
 *   - **Input, not picking.** `drag-node` is on and unexcluded: a legend node
 *     still drags. The veto removes the behaviour's *reaction* to a pick, not
 *     the node from the picking index — which is the same reason a group frame
 *     can be dragged and collapsed while being unhoverable.
 *   - **Independent of `excludeGroups`.** Switch it through all three values:
 *     nothing changes, because no node here is a group. The two vetoes compose
 *     and neither can do the other's job.
 *
 * `excludeEdgeTypes` is the third of the set, and the one with no structural
 * counterpart at all — an edge is never a group. The `annotates` edges tying
 * each swatch to its service are excluded that way; turn edge hover on and try
 * them.
 *
 * See `docs/rfcs/fix/2026-09-21-group-frames-hover-and-select-as-nodes.md` (the
 * type lists) and
 * `docs/rfcs/feat/2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so.md`
 * (the structural default that replaced their commonest use).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  ThemeBehaviour,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ExcludeNodeTypes' };
export default meta;
type Story = StoryObj;

export const ExcludeNodeTypesStory: Story = {
  name: 'ExcludeNodeTypes',
  render: () => createContainer({ id: 'graph-exclude-node-types' }),

  play: async ({ canvasElement }) => {
    // ── The content: a small service topology, laid out by hand ─────────────
    // Positions are authored so the legend can sit in a known place beside it;
    // no layout runs, which also keeps the scenery from being flung about by a
    // solver that has no idea it is decoration.
    //
    // Only `bgFill` is authored per node — a tier colour is meaning, and the
    // role map has no `gateway` / `store` role to carry it. Everything the
    // palette covers (label colour, borders, edge strokes) is left out so the
    // theme owns it.
    const services: GraphNode[] = [
      { id: 'edge-gw', type: 'service', position: { x: 0, y: 0 },
        style: { labelText: 'edge-gw', bgFill: 0x0b73da } },
      { id: 'auth', type: 'service', position: { x: 150, y: -70 },
        style: { labelText: 'auth', bgFill: 0x8b5cf6 } },
      { id: 'catalog', type: 'service', position: { x: 150, y: 0 },
        style: { labelText: 'catalog', bgFill: 0x8b5cf6 } },
      { id: 'orders', type: 'service', position: { x: 150, y: 70 },
        style: { labelText: 'orders', bgFill: 0x8b5cf6 } },
      { id: 'pricing', type: 'service', position: { x: 300, y: 35 },
        style: { labelText: 'pricing', bgFill: 0x8b5cf6 } },
      { id: 'sessions', type: 'service', position: { x: 300, y: -70 },
        style: { labelText: 'sessions', bgFill: 0x1da54f } },
      { id: 'products', type: 'service', position: { x: 450, y: -20 },
        style: { labelText: 'products', bgFill: 0x1da54f } },
      { id: 'ledger', type: 'service', position: { x: 450, y: 90 },
        style: { labelText: 'ledger', bgFill: 0x1da54f } },
      { id: 'search', type: 'service', position: { x: 300, y: 140 },
        style: { labelText: 'search', bgFill: 0xce8509 } },
      { id: 'recs', type: 'service', position: { x: 450, y: 195 },
        style: { labelText: 'recs', bgFill: 0xce8509 } },
      { id: 'events', type: 'service', position: { x: 600, y: 90 },
        style: { labelText: 'events', bgFill: 0xce8509 } },
    ];

    // ── The scenery: a legend + a watermark, in world space ─────────────────
    // `type: 'legend'` / `'watermark'` is the *only* thing marking these as
    // decoration — no `group`, no parent, no separate layer, and the same
    // circle every service uses. That is the point: there is no structural
    // signal for a behaviour to key on, only the type.
    const scenery: GraphNode[] = [
      { id: 'legend-title', type: 'legend', position: { x: 0, y: 230 },
        style: { labelText: 'Tiers', labelFontWeight: 700, labelFontSize: 13 } },
      { id: 'legend-edge', type: 'legend', position: { x: 0, y: 260 },
        style: { labelText: 'edge', bgFill: 0x0b73da } },
      { id: 'legend-app', type: 'legend', position: { x: 0, y: 285 },
        style: { labelText: 'application', bgFill: 0x8b5cf6 } },
      { id: 'legend-data', type: 'legend', position: { x: 0, y: 310 },
        style: { labelText: 'data', bgFill: 0x1da54f } },
      { id: 'legend-async', type: 'legend', position: { x: 0, y: 335 },
        style: { labelText: 'async', bgFill: 0xce8509 } },
      { id: 'legend-note', type: 'legend', position: { x: 0, y: 365 },
        style: { labelText: 'arrow = synchronous call', labelFontSize: 10 } },
      { id: 'watermark', type: 'watermark', position: { x: 300, y: 400 },
        style: { labelText: 'internal · do not circulate', labelFontSize: 11 } },
    ];

    const calls: GraphEdge[] = [
      { id: 'e1', type: 'calls', source: 'edge-gw', target: 'auth' },
      { id: 'e2', type: 'calls', source: 'edge-gw', target: 'catalog' },
      { id: 'e3', type: 'calls', source: 'edge-gw', target: 'orders' },
      { id: 'e4', type: 'calls', source: 'auth', target: 'sessions' },
      { id: 'e5', type: 'calls', source: 'catalog', target: 'products' },
      { id: 'e6', type: 'calls', source: 'catalog', target: 'pricing' },
      { id: 'e7', type: 'calls', source: 'orders', target: 'pricing' },
      { id: 'e8', type: 'calls', source: 'orders', target: 'ledger' },
      { id: 'e9', type: 'calls', source: 'catalog', target: 'search' },
      { id: 'e10', type: 'calls', source: 'search', target: 'recs' },
      { id: 'e11', type: 'calls', source: 'orders', target: 'events' },
      // Scenery edges: each swatch points at one service it describes. Their
      // type is what `excludeEdgeTypes` keys on — there is no structural
      // signal for "this edge is a caption line".
      { id: 'a1', type: 'annotates', source: 'legend-edge', target: 'edge-gw' },
      { id: 'a2', type: 'annotates', source: 'legend-app', target: 'catalog' },
      { id: 'a3', type: 'annotates', source: 'legend-data', target: 'products' },
      { id: 'a4', type: 'annotates', source: 'legend-async', target: 'search' },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-exclude-node-types')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // No colours on the background — its options default to the `inherit`
    // sentinel, so it adopts `surface` + `divider` and repaints on every
    // palette publish.
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes: [...services, ...scenery], edges: calls } }
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    // Deliberately *not* excluded — a legend node still drags, which is what
    // proves the veto is scoped to input rather than removing the node from
    // the picking index.
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }));
    // The named-palette path: no `targetLayerId`, no `light`/`dark` shorthand,
    // so every theme-aware layer recolours off the published palette and the
    // toolbar's Theme × Variant globals reach the pixels.
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));

    const canvasOptions = {
      layers: {
        bg: {},
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 11 },
              labelPlacement: 'right',
              labelFontSize: 11
            }
          },
          edge: { style: { strokeWidth: 1, arrowTargetShape: 'triangle', arrowTargetSize: 6 } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        hover: {
          enabled: true,
          state: 'highlighted',
          // On, and the point of the story: with the legend hoverable, one
          // stray pointer pass greys out the whole topology.
          inactiveState: 'dimmed',
          degree: 1,
          direction: 'both',
          // The subject. Neither list overlaps `excludeGroups` — no node here
          // carries `style.group`, so the structural default never fires and
          // these two are the only thing keeping the scenery quiet.
          excludeNodeTypes: ['legend', 'watermark'],
          excludeEdgeTypes: ['annotates']
        },
        select: {
          enabled: true,
          multiple: true,
          excludeNodeTypes: ['legend', 'watermark'],
          excludeEdgeTypes: ['annotates']
        },
        theme: { enabled: true, mode: 'document' }
      },
      // Authored positions are the layout — the scenery has a place, and no
      // solver should move it.
      activeLayout: ''
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.fitView(60);

    // Every option this story is about is bound below, on both behaviours at
    // once — the two vetoes are the same setting on two surfaces, and seeing
    // them move together is the lesson.
    const settings = {
      'exclude scenery nodes': true,
      'exclude scenery edges': true,
      'hover edges': false,
      'excludeGroups (no groups here)': 'expanded' as 'expanded' | 'always' | 'never',
      'inactiveState (dim the rest)': 'dimmed' as 'dimmed' | 'none',
      'degree (neighbour hops)': 1
    };
    const apply = (): void => {
      const nodes = settings['exclude scenery nodes'] ? ['legend', 'watermark'] : [];
      const edges = settings['exclude scenery edges'] ? ['annotates'] : [];
      const inactive =
        settings['inactiveState (dim the rest)'] === 'none'
          ? undefined
          : settings['inactiveState (dim the rest)'];
      canvas.update({
        behaviours: {
          hover: {
            excludeNodeTypes: nodes,
            excludeEdgeTypes: edges,
            excludeGroups: settings['excludeGroups (no groups here)'],
            hoverEdges: settings['hover edges'],
            inactiveState: inactive,
            degree: settings['degree (neighbour hops)']
          },
          select: {
            excludeNodeTypes: nodes,
            excludeEdgeTypes: edges,
            excludeGroups: settings['excludeGroups (no groups here)'],
            degree: settings['degree (neighbour hops)']
          }
        }
      });
    };

    const gui = new GUI({ title: 'Exclude node types' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'exclude scenery nodes').onChange(apply);
    gui.add(settings, 'exclude scenery edges').onChange(apply);
    gui.add(settings, 'hover edges').onChange(apply);
    gui
      .add(settings, 'excludeGroups (no groups here)', ['expanded', 'always', 'never'])
      .onChange(apply);
    gui.add(settings, 'inactiveState (dim the rest)', ['dimmed', 'none']).onChange(apply);
    gui.add(settings, 'degree (neighbour hops)', 0, 3, 1).onChange(apply);
  }
};
