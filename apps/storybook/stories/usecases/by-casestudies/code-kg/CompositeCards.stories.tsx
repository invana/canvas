/**
 * **Invana Code Knowledge Graph (elkjs, composite cards)** — the same real
 * code-intelligence graph of the Invana platform monorepo (602 source entities,
 * 1,329 typed relations, from the `understand-anything` static analyser), laid
 * out as a layered dependency DAG instead of a force cloud, and dressed in the
 * `<GraphCanvasApp>` shell.
 *
 * Every node renders as a **composite "card"** (a `FreeformStructure` compiling
 * to the `kind: 'composite'` shape) so the card itself surfaces the node's data
 * — label, complexity, name, summary, file path, line range. The card's accent bar + border colour follow
 * the active palette (entity **type** or the 8 architectural **clusters**), both
 * offered by the header's *Colour by* switch. `<ElkLayout>` is mounted as a
 * child and run via `config.activeLayout`; the header's **direction** picker
 * re-runs it, the **types** picker rebuilds `data`, and **Settings** docks
 * `<CanvasSettingsEditorPanel>` over the rest.
 *
 * Edges use the obstacle-aware `manhattan` router: the renderer collects every
 * card as an obstacle and A*-routes each edge through the lanes ELK reserved
 * (`edgeNodeSpacing`), recomputed on every re-route — so avoidance holds after
 * the layout moves nodes, with no per-edge waypoint step.
 *
 * ### The card is data too
 *
 * `apps/storybook/CLAUDE.md` § *"A story's settings are data"* wants every
 * engine setting as plain JSON, and **there is no function in this config**:
 *
 * - **The card** is `nodeStructureTemplates.codeCard`, one `FreeformStructure`
 *   of eight absolutely-positioned elements. It replaced a `shape` resolver
 *   that built the same composite by hand.
 * - **The accent** — the frame's border, the left bar and the complexity tag —
 *   is one `ValueLookup` the header's *Colour by* switch re-points between
 *   `type` and `data.cluster`. A template colour used to be a literal or a
 *   role, neither of which reads the record; that is what kept the card a
 *   callback.
 * - **`L123–187`** is `text: 'L{data.lineRange.0}–{data.lineRange.1}'` with
 *   `requires: 'data.lineRange'`, so the 253 records that carry no range show
 *   nothing rather than `L–`.
 * - **ELK sizing** is `config.layouts.elk.defaultNodeSize` — a *fallback* only,
 *   consulted when a node can't be measured, because `resolveNodeSize` measures
 *   the composed card itself.
 *
 * Scoped as `F4`–`F7` of
 * `docs/rfcs/feat/2026-09-21-only-colour-can-be-driven-by-a-second-data-field.md`.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout, MiniMapLayer } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type {
  GraphCanvas,
  GraphData,
  NodeStructureRegistry,
  NodeStylingRegistry,
  NodeTypeRegistry,
  TemplateColor,
  ValueLookup
} from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import {
  invanaCodeKg
} from '@invana/graph-datasets/usecase-demos';
import { Map, Moon, Settings, Sun } from 'lucide-react';

/** The entity kinds this story filters on. */
type InvanaCodeNodeLabel = 'file' | 'function' | 'class' | 'config' | 'document';

const meta: Meta = { title: 'usecases/by-casestudies/code-kg/CompositeCards' };
export default meta;
type Story = StoryObj;

export const CompositeCardsStory: Story = {
  name: 'CompositeCards',
  render: function Render() {
    const ALL_LABELS: InvanaCodeNodeLabel[] = ['file', 'function', 'class', 'config', 'document'];

    // Card geometry — the "node definition": an outer rounded frame, a left
    // accent bar, a header divider, and six text blocks. ELK is fed these exact
    // dimensions so it reserves room per card instead of treating nodes as
    // points.
    const CARD = { w: 300, h: 165, pad: 18, radius: 14 };

    const [colorMode, setColorMode] = useState<'type' | 'cluster'>('type');
    const [labels, setLabels] = useState<ReadonlySet<InvanaCodeNodeLabel>>(() => new Set(ALL_LABELS));
    const [direction, setDirection] = useState<ElkDirection>('RIGHT');
    const [minimapOn, setMinimapOn] = useState(true);

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          )
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    // `label → type`, `properties → data`, thinned to the picked entity types.
    // A new identity re-seeds the graph and re-runs ELK.
    const data: GraphData = useMemo(() => {
      const keep = invanaCodeKg.nodes.filter((n) => labels.has(n.type));
      const idSet = new Set(keep.map((n) => n.id));
      return {
        nodes: keep,
        edges: invanaCodeKg.edges
          .filter((e) => idSet.has(e.source) && idSet.has(e.target))
          .map((e) => e)
      };
    }, [labels]);

    const config: CanvasConfig = useMemo(() => {
      // Accent / border colour by node type / entity kind …
      const LABEL_FILL: Record<InvanaCodeNodeLabel, number> = {
        file: 0x3b82f6, // blue
        function: 0x10b981, // emerald
        class: 0x8b5cf6, // violet
        config: 0xf59e0b, // amber
        document: 0xec4899, // pink
      };
      // … or by the analyser's 8 architectural clusters (the source `layers`).
      const CLUSTER_FILL: Record<string, number> = {
        'layer:graph-connectors': 0x2563eb, // blue
        'layer:modeller': 0x8b5cf6, // violet
        'layer:engine-domain': 0x10b981, // emerald
        'layer:engine-platform': 0x14b8a6, // teal
        'layer:studio-ui': 0xf59e0b, // amber
        'layer:studio-data': 0xec4899, // pink
        'layer:studio-types': 0xef4444, // red
        'layer:config': 0x64748b, // slate
      };
      const UNCLUSTERED_FILL = 0x94a3b8; // slate-400 — node in no cluster
      const inner = CARD.w - CARD.pad * 2; // 264

      /**
       * **The *Colour by* switch, as data.** One `ValueLookup`, referenced by
       * the three things the accent colours (the frame's border, the left bar,
       * the complexity tag). Flipping the header switch swaps which *field*
       * drives it — `type` or `data.cluster` — and nothing else about the card
       * changes. That is the whole reason the card can be a template at all:
       * a template element's colour used to be a literal or a role, neither of
       * which reads the record.
       *
       * `fallback` catches a record in no cluster (`cluster: null`); in `type`
       * mode all five kinds are pinned, so it is unreachable there.
       */
      const accent: ValueLookup<TemplateColor> =
        colorMode === 'type'
          ? { bind: 'type', map: LABEL_FILL, fallback: UNCLUSTERED_FILL }
          : { bind: 'data.cluster', map: CLUSTER_FILL, fallback: UNCLUSTERED_FILL };

      /**
       * **The card, as one `FreeformStructure`** — the same 300×165 card the
       * `shape` resolver used to build, expressed as absolutely-positioned
       * elements. A `text` element's `y` is its **top**, and the compiler adds
       * the font size to reach the baseline the resolver wrote directly, so
       * every text `y` here is the old baseline minus its `fontSize`.
       *
       * Every colour that carries *meaning* stays literal (the card is a fixed
       * dark slate by design, like its `tasks-panel` cousins); every colour
       * that carries *identity* comes from `accent` above.
       */
      const structures: NodeStructureRegistry = {
        codeCard: {
          name: 'codeCard',
          kind: 'freeform',
          width: CARD.w,
          height: CARD.h,
          cornerRadius: CARD.radius,
          bg: 0x1f2937,
          // The silhouette's own border follows the accent — a lookup on the
          // structure, because the frame is not one of the elements.
          strokeLookup: accent,
          strokeWidth: 2,
          elements: [
            // Left accent bar, inset by the corner radius top and bottom.
            {
              id: 'accent-bar',
              type: 'rect',
              x: 0,
              y: CARD.radius,
              width: 4,
              height: CARD.h - 2 * CARD.radius,
              fillLookup: accent
            },
            // Header divider.
            {
              id: 'divider',
              type: 'line',
              x: CARD.pad,
              y: 46,
              x2: CARD.w - CARD.pad,
              y2: 46,
              color: 0x374151,
              strokeWidth: 1
            },
            // Top tags: entity kind (left, small-caps) + complexity (right).
            {
              id: 'kind',
              type: 'text',
              x: CARD.pad,
              y: 6,
              bind: 'type',
              fontSize: 10,
              fontWeight: 600,
              fontVariant: 'small-caps',
              color: 0x94a3b8
            },
            {
              id: 'complexity',
              type: 'text',
              x: CARD.w - CARD.pad,
              y: 6,
              bind: 'data.complexity',
              anchor: 'right',
              fontSize: 10,
              fontWeight: 600,
              colorLookup: accent
            },
            // Heading (name) + description (summary).
            {
              id: 'name',
              type: 'text',
              x: CARD.pad,
              y: 40,
              bind: 'data.name',
              fontSize: 16,
              fontWeight: 700,
              color: 0xf1f5f9,
              maxWidth: inner,
              maxLines: 1
            },
            {
              id: 'summary',
              type: 'text',
              x: CARD.pad,
              y: 74,
              bind: 'data.summary',
              fontSize: 12,
              color: 0x94a3b8,
              lineHeight: 16,
              align: 'left',
              maxWidth: inner,
              maxLines: 2
            },
            // Footer: file path (left) + line range (right).
            {
              id: 'path',
              type: 'text',
              x: CARD.pad,
              y: CARD.h - 39,
              bind: 'data.filePath',
              fontSize: 11,
              fontWeight: 500,
              color: 0x64748b,
              maxWidth: inner - 64,
              maxLines: 1
            },
            {
              id: 'lines',
              type: 'text',
              x: CARD.w - CARD.pad,
              y: CARD.h - 39,
              // `{path}` tokens interpolate against the record — the resolver
              // built this with a template literal. `requires` is what keeps it
              // honest: 253 of the 602 records carry no line range (every
              // `file`, every `config`), and without it they would read `L–`.
              text: 'L{data.lineRange.0}–{data.lineRange.1}',
              requires: 'data.lineRange',
              anchor: 'right',
              fontSize: 11,
              fontWeight: 500,
              color: 0x64748b
            }
          ]
        }
      };

      /**
       * A freeform structure is self-contained — it carries its own colours and
       * bindings — so the styling and binding halves are empty. The five kinds
       * are written out because the registry is the legend: this is the list of
       * entity kinds that render as a card.
       */
      const stylings: NodeStylingRegistry = { codeCard: { name: 'codeCard' } };
      const nodeTypes: NodeTypeRegistry = {
        file: { structure: 'codeCard', styling: 'codeCard', bindings: {} },
        function: { structure: 'codeCard', styling: 'codeCard', bindings: {} },
        class: { structure: 'codeCard', styling: 'codeCard', bindings: {} },
        config: { structure: 'codeCard', styling: 'codeCard', bindings: {} },
        document: { structure: 'codeCard', styling: 'codeCard', bindings: {} }
      };

      return {
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'elk',
        behaviours: {
          // The card carries its own colour — nothing else may repaint it.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] }
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            // The card IS the node visual — the structure above carries its
            // own fill, border and text, so there is no layer-level node style
            // at all. Everything that used to live in a `shape` resolver is now
            // `nodeStructureTemplates.codeCard`.
            nodeStructureTemplates: structures,
            nodeStylingTemplates: stylings,
            nodeTypes,
            node: {
              state: {
                // `bgStrokeColor` overrides the card's own border for the hover
                // / select ring; `dimmed` fades off-focus cards.
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.25 }
              }
            },
            edge: {
              style: {
                shape: { pathType: 'manhattan' },
                strokeColor: 0x94a3b8,
                strokeWidth: 0.8,
                strokeAlpha: 0.22,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 5,
                arrowTargetColor: 0x94a3b8
              },
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 1.6,
                  strokeAlpha: 0.95,
                  arrowTargetColor: 0xfbbf24
                },
                dimmed: { strokeAlpha: 0.03 }
              }
            }
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 }
        },
        layouts: {
          elk: {
            algorithm: 'layered',
            direction,
            nodeSpacing: 28,
            layerSpacing: 90,
            // Reserve a lane between nodes and edges so the manhattan router
            // has clear channels — fewer edges forced over cards.
            edgeNodeSpacing: 24,
            // Fallback only, and JSON where the deleted `nodeSize` callback was
            // a function: `resolveNodeSize` measures each card from its own
            // composed spec (`boundsOfNode`), and reaches this pair only when a
            // node cannot be measured at all. The card's own numbers, so the
            // fallback and the measurement agree.
            defaultNodeSize: { width: CARD.w, height: CARD.h }
          }
        }
      };
      // CARD is a render-local literal the resolvers close over.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colorMode, direction]);

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage(
        `${invanaCodeKg.project.name} · ${invanaCodeKg.nodes.length} entities · ${invanaCodeKg.edges.length} relations`,
      );
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'Invana Code KG — ELK cards',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'select',
                  key: 'color-mode',
                  label: 'Colour by',
                  value: colorMode,
                  options: { type: 'Entity type', cluster: 'Cluster' },
                  onChange: (v) => setColorMode(v as 'type' | 'cluster')
                },
                {
                  type: 'select',
                  key: 'direction',
                  label: 'Direction',
                  value: direction,
                  options: { RIGHT: 'Right', DOWN: 'Down', LEFT: 'Left', UP: 'Up' },
                  onChange: (v) => setDirection(v as ElkDirection)
                },
                {
                  type: 'select',
                  key: 'labels',
                  label: 'Types',
                  // One trigger toggling a single entity type at a time; a
                  // tick marks the ones in play.
                  value: '',
                  options: Object.fromEntries(
                    ALL_LABELS.map((l) => [l, `${labels.has(l) ? '✓ ' : ''}${l}`]),
                  ),
                  triggerLabelOnly: true,
                  onChange: (l) =>
                    setLabels((prev) => {
                      const next = new Set(prev);
                      if (next.has(l as InvanaCodeNodeLabel)) next.delete(l as InvanaCodeNodeLabel);
                      else next.add(l as InvanaCodeNodeLabel);
                      return next;
                    })
                },
                {
                  type: 'toggle',
                  key: 'minimap',
                  icon: Map,
                  label: 'Minimap: off',
                  activeLabel: 'Minimap: on',
                  active: minimapOn,
                  onToggle: () => setMinimapOn((v) => !v)
                },
                ...dock.items,
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme
                },
              ]}
            />
          )
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      >
        {/* Registered as `elk`; `config.activeLayout` runs it once data is in,
            and re-runs it whenever the direction patch lands. Every option it
            takes — including the `defaultNodeSize` that replaced its `nodeSize`
            callback — comes from `config.layouts.elk`. */}
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={80} />

        {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
      </GraphCanvasApp>
    );
  }
};
