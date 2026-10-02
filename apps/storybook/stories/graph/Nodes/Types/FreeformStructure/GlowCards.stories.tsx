import { useCallback, useMemo } from 'react';
import {
  BackgroundLayer,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  DragPanBehaviour,
  FocusBehaviour,
  GraphCanvas,
  GraphLayer,
  TextResolutionLODBehaviour,
  WheelZoomBehaviour,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type {
  GraphCanvas as GraphCanvasEngine,
  GraphData,
  GraphEdge,
  NodeStructureRegistry,
  NodeTypeRegistry
} from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Glowing evidence cards — and the ones that fade.** Neon-on-dark cards whose
 * borders glow, where everything more than two hops from the selected card
 * fades back automatically. Click any card to move the focus; click the empty
 * canvas to bring everything back.
 *
 * Nothing here is new engine code. It's four existing pieces put together:
 *
 * | Look | Comes from |
 * |---|---|
 * | Card (icon square, title, subtitle) | one `FreeformStructure`, `evidenceCard`, shared by every type |
 * | Glowing border | `glow` decoration on the layer's `node.style`. It follows the card's outline (`file:packages/renderer-pixijs/src/primitives/decorations/shape/GlowDecoration.ts`) |
 * | Double border on the selected card | `ClickSelectBehaviour` sets `selected`, and the `selected` overlay adds a `ring` (`gap: 7`) and a wider glow |
 * | Distant cards fade | the selection handler calls `focus.set(2-hop neighbourhood)`. `FocusBehaviour` then sets `dimmed` on everything else, and the `dimmed` overlay fades the card (`bgAlpha`) and removes its glow (`remove: true`) |
 * | Grid backdrop | `BackgroundLayer` grid pattern |
 *
 * **The colours are fixed on purpose** (like `graph/Groups/HackerStyle`). The look
 * *is* the subject, so the story mounts no `ThemeBehaviour`.
 * `GraphLayer.applyTheme` would otherwise repaint the edge colour from the
 * palette. The Theme toolbar doesn't recolour this canvas.
 *
 * **Gaps the reference image shows** (named here, not worked around):
 * - **Monospace card subtitle.** Freeform `text` elements have no `fontFamily`, though
 *   the composite `label` part supports one. Edge labels *are* monospace (`labelFontFamily`).
 * - **Concentric guide rings** in the backdrop. `BackgroundLayer` only offers dots, grid and lines.
 * - **Edge label from the edge type.** Edges have no `nodeTypes`-style `bindings.label`, so
 *   `labelText` is the story's one resolver.
 * - **Kind initial (`C`, `M`, `R` …).** A text element has no value lookup, so the letter is
 *   stored in the record as `data.glyph`.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/GlowCards' };
export default meta;
type Story = StoryObj;

export const GlowCardsStory: Story = {
  name: 'GlowCards',
  render: function Render() {
    // ── The record set — positioned by hand, no layout ──────────────────────
    // `acme` is the opening selection. Within two hops: q3 / seriesC / owner
    // (1) and formD / press (2). Outside the focus: globex (3 hops, via press)
    // and the initech ↔ northwind pair (a separate component).
    const data = useMemo<GraphData>(
      () => ({
        nodes: [
          { id: 'acme', type: 'company', position: { x: -210, y: -30 }, data: { glyph: 'C', title: 'Acme Robotics', subtitle: 'v14 · 3 sources' } },
          { id: 'q3', type: 'metric', position: { x: -470, y: -260 }, data: { glyph: 'M', title: 'Q3 revenue', subtitle: '+11% vs Q2' } },
          { id: 'seriesC', type: 'round', position: { x: 315, y: -260 }, data: { glyph: 'R', title: 'Series C · $90M', subtitle: 'closed 8 Jul' } },
          { id: 'owner', type: 'person', position: { x: -510, y: 210 }, data: { glyph: 'P', title: 'Account owner', subtitle: 'name masked by policy' } },
          { id: 'formD', type: 'filing', position: { x: 430, y: 130 }, data: { glyph: 'F', title: 'Form D filing', subtitle: 'SEC · primary' } },
          { id: 'press', type: 'source', position: { x: 195, y: 390 }, data: { glyph: 'S', title: 'Press release', subtitle: '2 Jul · secondary' } },
          { id: 'initech', type: 'company', position: { x: -350, y: -450 }, data: { glyph: 'C', title: 'Initech', subtitle: 'raised · Series B' } },
          { id: 'northwind', type: 'company', position: { x: 475, y: -450 }, data: { glyph: 'C', title: 'Northwind', subtitle: 'raised · Series A' } },
          { id: 'globex', type: 'company', position: { x: 520, y: 570 }, data: { glyph: 'C', title: 'Globex', subtitle: 'raised · −2% Q3' } }
        ],
        edges: [
          { id: 'e-metric', source: 'acme', target: 'q3', type: 'HAS_METRIC' },
          { id: 'e-raised', source: 'acme', target: 'seriesC', type: 'RAISED' },
          { id: 'e-owner', source: 'acme', target: 'owner', type: 'OWNED_BY' },
          { id: 'e-formd', source: 'seriesC', target: 'formD', type: 'EVIDENCED_BY' },
          { id: 'e-press', source: 'seriesC', target: 'press', type: 'EVIDENCED_BY' },
          { id: 'e-cites', source: 'press', target: 'formD', type: 'CITES' },
          { id: 'e-mentions', source: 'press', target: 'globex', type: 'MENTIONS' },
          { id: 'e-rivals', source: 'initech', target: 'northwind', type: 'COMPETES_WITH' }
        ]
      }),
      []
    );

    // ── One card for every type — literal JSON ──────────────────────────────
    // Square corners (`cornerRadius: 0`), so the glow traces a sharp rectangle.
    // Text `y` values are the intended top minus `fontSize`: the compiler adds
    // `fontSize` to a text element's `y` (`file:packages/graph/src/template/compile.ts#L669`)
    // while the renderer places a label part by its top
    // (`file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L303`).
    const structures = useMemo<NodeStructureRegistry>(
      () => ({
        evidenceCard: {
          name: 'evidenceCard',
          kind: 'freeform',
          width: 300,
          height: 84,
          cornerRadius: 0,
          bg: 0x0b1213,
          stroke: 0x5eead4,
          strokeWidth: 1.5,
          elements: [
            { id: 'glyph-box', type: 'rect', x: 18, y: 20, width: 44, height: 44, stroke: 0x5eead4, strokeWidth: 1.5 },
            { id: 'glyph', type: 'text', x: 40, y: 13, bind: 'data.glyph', anchor: 'center', fontSize: 18, fontWeight: 600, color: 0x5eead4 },
            { id: 'title', type: 'text', x: 80, y: 0, bind: 'data.title', fontSize: 18, fontWeight: 700, color: 0xf1f5f9, maxWidth: 204 },
            { id: 'subtitle', type: 'text', x: 80, y: 34, bind: 'data.subtitle', fontSize: 13, color: 0x8fa3a0, maxWidth: 204 }
          ]
        }
      }),
      []
    );

    const nodeTypes = useMemo<NodeTypeRegistry>(
      () => ({
        company: { structure: 'evidenceCard', styling: '', bindings: {} },
        metric: { structure: 'evidenceCard', styling: '', bindings: {} },
        round: { structure: 'evidenceCard', styling: '', bindings: {} },
        person: { structure: 'evidenceCard', styling: '', bindings: {} },
        filing: { structure: 'evidenceCard', styling: '', bindings: {} },
        source: { structure: 'evidenceCard', styling: '', bindings: {} }
      }),
      []
    );

    // ── The glow, the selected ring and the fade — layer template + overlays ──
    // Overlays merge per decoration `id`, so `selected` widens the same
    // `glow` slot and `dimmed` drops it. `highlighted` (what FocusBehaviour puts
    // on the focused set) is emptied: the cards in focus keep their normal glow.
    const node = useMemo<GraphLayerProps['node']>(
      () => ({
        style: {
          labelText: '',
          decorations: [{ id: 'glow', kind: 'glow', color: 0x2dd4bf, strokeWidth: 12, layers: 6, innerAlpha: 0.4 }]
        },
        state: {
          highlighted: {},
          selected: {
            decorations: [
              { id: 'anchor-ring', kind: 'ring', color: 0x5eead4, width: 1.5, gap: 7, alpha: 0.9 },
              { id: 'glow', kind: 'glow', color: 0x2dd4bf, strokeWidth: 22, layers: 7, innerAlpha: 0.55 }
            ]
          },
          dimmed: {
            bgAlpha: 0.22,
            decorations: [{ id: 'glow', kind: 'glow', color: 0x2dd4bf, remove: true }]
          }
        }
      }),
      []
    );

    const edge = useMemo<GraphLayerProps['edge']>(
      () => ({
        style: {
          strokeColor: 0x5eead4,
          strokeAlpha: 0.8,
          strokeWidth: 1.5,
          arrowTargetShape: 'none',
          labelText: (e: GraphEdge) => e.type,
          labelColor: 0x5eead4,
          labelFontSize: 12,
          labelFontWeight: 600,
          labelFontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          labelLetterSpacing: 1.5,
          labelAutoRotate: false,
          labelBackgroundFill: 0x0a1112,
          labelBackgroundAlpha: 1,
          labelBackgroundPadding: 5,
          labelBackgroundCornerRadius: 2
        },
        state: {
          highlighted: {},
          selected: { strokeWidth: 2.5 },
          dimmed: { strokeAlpha: 0.1, labelAlpha: 0.2, labelBackgroundAlpha: 0.2 }
        }
      }),
      []
    );

    const config = useMemo<CanvasConfig>(() => ({ fitOnLoad: true }), []);

    // ── Selection → focus ───────────────────────────────────────────────────
    // The fade is computed from the graph, not authored per node: whatever is
    // selected (a clicked edge counts as both its endpoints) plus everything
    // within HOPS of it is the focus; FocusBehaviour dims the rest. An empty
    // selection (a background click) clears the focus and lights everything.
    // Fires once the engine exists. Seeding `acme` here is safe: ClickSelect
    // and FocusBehaviour read the store when they enable.
    const onEngine = useCallback(
      (canvas: GraphCanvasEngine | null) => {
        if (!canvas) return;
        const HOPS = 2;
        const nodeIds = new Set(data.nodes.map((n) => n.id));
        const edgesById = new Map(data.edges.map((e) => [e.id, e]));

        canvas.store.view.subscribe((state, prev) => {
          const selection = state.interaction.selection;
          if (selection === prev.interaction.selection) return;

          const lit = new Set<string>();
          for (const id of selection) {
            if (nodeIds.has(id)) lit.add(id);
            const e = edgesById.get(id);
            if (e) lit.add(e.source).add(e.target);
          }
          if (lit.size === 0) {
            canvas.store.actions.focus.clear();
            return;
          }

          let frontier = [...lit];
          for (let hop = 0; hop < HOPS; hop++) {
            const next: string[] = [];
            for (const e of data.edges) {
              if (frontier.includes(e.source) && !lit.has(e.target)) next.push(e.target);
              if (frontier.includes(e.target) && !lit.has(e.source)) next.push(e.source);
            }
            for (const id of next) lit.add(id);
            frontier = next;
          }
          canvas.store.actions.focus.set(lit);
        });

        canvas.store.actions.selection.set(['acme']);
      },
      [data]
    );

    return (
      <div style={{ width: '100%', height: '100dvh' }}>
        <GraphCanvas ref={onEngine} autoResize config={config}>
          <BackgroundLayer
            id="bg"
            type="pattern"
            patternType="grid"
            backgroundColor={0x080d0d}
            color={0x1d3b37}
            spacing={48}
            size={1}
            alpha={0.7}
            hidePatternBelowZoom={0}
          />
          <GraphLayer id="graph" data={data} node={node} edge={edge} nodeStructureTemplates={structures} nodeTypes={nodeTypes} />
          <ClickSelectBehaviour id="select" targetLayerId="graph" />
          <FocusBehaviour id="focus" targetLayerId="graph" />
          <DragNodeBehaviour id="drag" targetLayerId="graph" />
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="wheel" />
          <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
        </GraphCanvas>
      </div>
    );
  }
};
