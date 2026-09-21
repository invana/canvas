/**
 * **Code Knowledge Graph — health badges** — Sourcegraph-Cody / Cursor /
 * Augment-style code intelligence overview, composed from `<GraphCanvasApp>`.
 * The same real `invanaCodeKg` graph its two siblings render (`DotsForce`,
 * `CompositeCards`), narrowed to the **file-level import DAG**: 242 source files
 * and the 590 `imports` between them, laid out by `<ElkLayout>` `layered`
 * (pointed at by `config.activeLayout`).
 *
 * Per-file test coverage and error counts ride along as node **badges** bound to
 * each record's data, so the picture doubles as a code-health dashboard. (Those
 * two fields are the dataset's one synthetic pair — `data.coverage` /
 * `data.errors`.) Fills come from the analyser's eight architectural clusters,
 * so the badge colours read against a stable backdrop.
 *
 * The header's **direction** picker re-runs ELK through
 * `config.layouts.elk.direction`, and **Settings** docks
 * `<CanvasSettingsEditorPanel>` for the rest of the ELK params, the hover
 * emphasis, and every other registered surface.
 *
 * ### The settings are data
 *
 * Per `apps/storybook/CLAUDE.md` § *"A story's settings are data"*, every engine
 * setting here is plain JSON:
 *
 * - **Cluster fill** is `behaviours.color` — `ColorByBehaviour` in categorical
 *   mode reading the serialisable path `data.cluster`, with the eight cluster
 *   colours pinned through `valueColors` so a colour never depends on data
 *   arrival order. It replaced a `bgFill` resolver.
 * - **The label** is `nodeTypes.file.bindings.label`, a dotted path read off the
 *   record. It replaced a `labelText` resolver.
 * - **The badges** are `nodeStylingTemplates.fileNode.badges` — each one binds
 *   to a field (`data.coverage` / `data.errors`), bands that value to a colour,
 *   and is dropped for a record that doesn't carry the field. They replaced the
 *   last resolver in this file; see `F3` of
 *   `docs/rfcs/feat/2026-09-21-only-colour-can-be-driven-by-a-second-data-field.md`.
 *
 * **There is no function in this config** — it round-trips through save / load
 * and `<CanvasSettingsEditorPanel>` intact.
 *
 * Exercises: `ElkLayout` (layered DAG), data-bound node `badges`, 1-hop hover
 * focal emphasis, shift+click multi-select, node dragging, and a `MiniMapLayer`
 * for navigation on larger codebases.
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
  NodeTypeRegistry
} from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import { invanaCodeKg } from '@invana/graph-datasets/usecase-demos';
import { Map, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/by-casestudies/code-kg/HealthBadges' };
export default meta;
type Story = StoryObj;

export const HealthBadgesStory: Story = {
  name: 'HealthBadges',
  render: function Render() {
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

    // The dataset is engine-ready; this only narrows it to the file-level import
    // DAG — `file` entities, and the `imports` between two of them. (Every
    // `imports` edge in the dataset is already file→file.)
    const data: GraphData = useMemo(() => {
      const files = new Set(invanaCodeKg.nodes.filter((n) => n.type === 'file').map((n) => n.id));
      return {
        nodes: invanaCodeKg.nodes.filter((n) => files.has(n.id)),
        edges: invanaCodeKg.edges.filter(
          (e) => e.type === 'imports' && files.has(e.source) && files.has(e.target),
        )
      };
    }, []);

    const config: CanvasConfig = useMemo(() => {
      /**
       * One structure for the one type this story draws. A `file` is a plain rounded
       * rectangle with a centred label — the lean `simple` path, not a card.
       *
       * The box lives here rather than in `node.style.shape` because the **type is
       * the selector**: every node in this graph is a `file`, and a second entity kind
       * would get its own structure rather than a branch inside a resolver.
       */
      const structures: NodeStructureRegistry = {
        fileNode: {
          name: 'fileNode',
          kind: 'simple',
          shape: { kind: 'rect', width: 168, height: 46, cornerRadius: 8 },
          slots: { label: true }
        }
      };

      /**
       * Typography only — deliberately **no colours**.
       *
       * Precedence is layer `node.style` → **type binding** → per-node `style` →
       * state overlays, and `ThemeBehaviour` recolours `labelColor` / `bgStrokeColor`
       * by writing the *layer* template (`paletteToNodeDefaults`). Declaring either of
       * those here would out-rank the theme and freeze this story's nodes at a literal
       * white in both light and dark — a visible change, not a refactor. So the label
       * colour and the border stay on the layer template where the theme can reach
       * them, and the fill comes from `ColorByBehaviour`, which writes the same layer
       * template.
       */
      const stylings: NodeStylingRegistry = {
        fileNode: {
          name: 'fileNode',
          label: { fontSize: 12, fontWeight: 600, placement: 'center' },
          /**
           * **The health badges, as data.** Each entry `bind`s to a field of the
           * record, so the engine decides per node what the badge says, what colour
           * it is, and whether it exists at all — the three things that used to force
           * a `badges` resolver.
           *
           * The colours stay literal on purpose: the role map has no `success` /
           * `warning` / `danger`, and a coverage scale is meaning, not chrome (see
           * `apps/storybook/CLAUDE.md` § *"Only meaning stays literal"*).
           */
          badges: [
            {
              // Coverage pill. `data.coverage` is optional on the dataset — 591 of
              // 602 records have it — and a badge whose bound field is absent is
              // simply not drawn, which is how the other 11 files show no pill.
              id: 'coverage',
              bind: 'data.coverage',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'rect', width: 34, height: 16, cornerRadius: 8 },
              // `{}` is the bound value: 87 → "87%".
              labelText: '{}%',
              // First matching band wins, so this reads top-down as the Codecov
              // convention: ≥80 green, ≥60 amber, everything else red. The lookup
              // inherits this badge's own `bind`, so the field is named once.
              fillLookup: {
                bands: [
                  { from: 80, value: 0x16a34a },
                  { from: 60, value: 0xd97706 },
                  { value: 0xdc2626 }
                ]
              },
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              labelColor: 0xffffff,
              labelFontSize: 10
            },
            {
              // Error circle — present only where there is something to report. The
              // label defaults to the bound value, so the count needs no template.
              id: 'errors',
              bind: 'data.errors',
              whenGreaterThan: 0,
              placement: 'top-left',
              origin: 'center',
              shape: { kind: 'circle', radius: 9 },
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              labelColor: 0xffffff,
              labelFontSize: 11
            }
          ]
        }
      };

      /**
       * The type binding — the whole reason the `labelText` resolver is gone.
       *
       * `bindings.label` is a **dotted path read off the record**: `data.name` is the
       * file's short name. Content stays declarative, so this config survives being
       * saved, edited in `CanvasSettingsEditorPanel`, and handed to a collaborator.
       */
      const nodeTypes: NodeTypeRegistry = {
        file: { structure: 'fileNode', styling: 'fileNode', bindings: { label: 'data.name' } }
      };

      return {
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'elk',
        behaviours: {
          /**
           * **Cluster fill, as data.** `ColorByBehaviour` in its default
           * categorical mode, pointed at the serialisable root-relative path
           * `data.cluster` — the analyser's eight architectural clusters, the
           * dataset's own grouping and the closest thing it has to "which
           * package is this in".
           *
           * `valueColors` pins each cluster to its colour. Without it the
           * palette is handed out in order of *first appearance*, so a colour
           * would depend on which file ELK happens to see first — the reason a
           * pinned map is the right form here rather than a bare palette.
           *
           * `colorEdges: false` keeps the 590 import edges on their own muted
           * grey; only the fill is being coloured by cluster.
           */
          color: {
            enabled: true,
            mode: 'categorical',
            nodeValueKey: 'data.cluster',
            colorEdges: false,
            valueColors: {
              'layer:graph-connectors': 0x2563eb, // blue
              'layer:modeller': 0x8b5cf6, // violet
              'layer:engine-domain': 0x10b981, // emerald
              'layer:engine-platform': 0x14b8a6, // teal
              'layer:studio-ui': 0xf59e0b, // amber
              'layer:studio-data': 0xec4899, // pink
              'layer:studio-types': 0xef4444, // red
              'layer:config': 0x64748b // slate
            },
            // A file in no cluster (`cluster: null`) lands here — slate-400.
            fallbackColor: 0x94a3b8
          },
          hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] }
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            // The node's box, label text, label typography and health badges
            // all come from the per-type templates at the top of this file; the
            // fill comes from the `color` behaviour above. What is left on the
            // layer template is only what the theme owns (label colour,
            // border) — there is no resolver in this config.
            nodeStructureTemplates: structures,
            nodeStylingTemplates: stylings,
            nodeTypes,
            node: {
              style: {
                // Theme-owned pair: `ThemeBehaviour` writes `labelColor` +
                // `bgStrokeColor` onto this same layer template, so these are
                // the story's opening values rather than the last word. Keeping
                // them here — instead of in the styling template, which
                // out-ranks the theme — is what leaves the theme switch working.
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1.5,
                labelColor: 0xffffff
              },
              state: {
                // Sharper highlight ring against the saturated cluster fills.
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 }
              }
            },
            edge: {
              style: {
                shape: { pathType: 'rounded', pathStyleOpts: { radius: 8 } },
                strokeColor: 0x94a3b8,
                strokeWidth: 1.3,
                strokeAlpha: 0.75,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 8,
                arrowTargetColor: 0x94a3b8
              },
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 2,
                  strokeAlpha: 1,
                  arrowTargetColor: 0xfbbf24
                }
              }
            }
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 }
        },
        layouts: {
          elk: { algorithm: 'layered', direction, nodeSpacing: 28, layerSpacing: 90 }
        }
      };
    }, [direction]);

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Badges show test coverage · red circle = open errors');
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'Code Knowledge Graph',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'select',
                  key: 'direction',
                  label: 'Direction',
                  value: direction,
                  options: { RIGHT: 'Right', DOWN: 'Down', LEFT: 'Left', UP: 'Up' },
                  onChange: (v) => setDirection(v as ElkDirection)
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
            and re-runs it whenever the direction patch lands. */}
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={80} />

        {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
      </GraphCanvasApp>
    );
  }
};
