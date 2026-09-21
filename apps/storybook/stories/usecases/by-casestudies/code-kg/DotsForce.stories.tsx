/**
 * **Invana Code Knowledge Graph (d3-force)** — a *real* code-intelligence graph
 * of the Invana platform monorepo (602 source entities, 1,329 typed relations),
 * produced by the `understand-anything` static analyser and shipped as
 * `invanaCodeKg` in `@invana/graph-datasets`. Files, functions, classes, configs
 * and docs are drawn as a force-directed cloud; `imports`, `contains`, `calls`,
 * `inherits`, … relations are the edges — the picture a Sourcegraph / CodeSee /
 * Gephi "repo map" shows, over an actual codebase rather than a synthetic one.
 *
 * Composed from `<GraphCanvasApp>`: the bundle's `graph-force` layout does the
 * work (`animate: false` — settle, then show), and the header adds a **colour
 * by** switch (entity *type* vs the 8 architectural **clusters** the analyser
 * found), a per-type **filter** that rebuilds `data` and re-runs the sim, a
 * minimap toggle, and **Settings** — `<CanvasSettingsEditorPanel>` docked in the
 * right region for the force params and every behaviour.
 *
 * ### Colour, size and label are all data
 *
 * Per `apps/storybook/CLAUDE.md` § *"A story's settings are data"*, **there is
 * no function in this config**:
 *
 * - **Colour** is `behaviours.color` — the header's *Colour by* switch flips
 *   `nodeValueKey` between the dotted paths `type` and `data.cluster`, with
 *   every colour pinned in `valueColors`. It replaced a `bgFill` resolver.
 * - **Radius** is `nodeStylingTemplates.dot.size`, a `ValueLookup` over
 *   `data.complexity` — a *second* field, orthogonal to `type`. It replaced a
 *   `shape` resolver.
 * - **The label** is `nodeTypes.<kind>.bindings.label`. It replaced a
 *   `labelText` resolver, and it could only be written once `size` existed:
 *   a type binding carries a structure, a structure carries the shape, and
 *   `NodeStyle.size` is applied *after* the merge — so the radius survives the
 *   binding rather than being overwritten by it.
 *
 * Scoped as `F1` · `F2` of
 * `docs/rfcs/feat/2026-09-21-only-colour-can-be-driven-by-a-second-data-field.md`.
 *
 * Exercises: `D3ForceLayout` at real scale, serialisable colour- and
 * size-by-field,
 * `labelMinZoom` + `<TextResolutionLODBehaviour>` to keep 602 labels legible
 * *and* crisp, 1-hop hover emphasis, shift+click multi-select, and a
 * `MiniMapLayer`.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MiniMapLayer, TextResolutionLODBehaviour } from '@invana/canvas-react';
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
import {
  invanaCodeKg
} from '@invana/graph-datasets/usecase-demos';
import { Map, Moon, Settings, Sun } from 'lucide-react';

/** The entity kinds this story filters on. */
type InvanaCodeNodeLabel = 'file' | 'function' | 'class' | 'config' | 'document';

const meta: Meta = { title: 'usecases/by-casestudies/code-kg/DotsForce' };
export default meta;
type Story = StoryObj;

export const DotsForceStory: Story = {
  name: 'DotsForce',
  render: function Render() {
    const ALL_LABELS: InvanaCodeNodeLabel[] = ['file', 'function', 'class', 'config', 'document'];

    const [colorMode, setColorMode] = useState<'type' | 'cluster'>('type');
    const [labels, setLabels] = useState<ReadonlySet<InvanaCodeNodeLabel>>(() => new Set(ALL_LABELS));
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

    // Map the dataset's property-graph shape (`label → type`, `properties →
    // data`) and thin it to the picked entity types. A new identity re-seeds the
    // graph and re-runs the force sim, so a filter change re-lays-out.
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
      /**
       * **One structure for every entity kind.** A dot is a circle with a
       * label under it — the lean `simple` path. The radius here is only the
       * skeleton's: `stylings.dot.size` rewrites it per record below.
       */
      const structures: NodeStructureRegistry = {
        dot: {
          name: 'dot',
          kind: 'simple',
          shape: { kind: 'circle', radius: 4 },
          slots: { label: true }
        }
      };

      /**
       * **Radius by complexity, as data.** `data.complexity` is a *second*
       * categorical field, orthogonal to `type` — the dataset has complex
       * files and simple ones, complex classes and simple ones (325 simple /
       * 213 moderate / 64 complex across all five kinds).
       *
       * `size` is the field that makes this expressible. It compiles to
       * `NodeStyle.size`, which the layer applies **after** the whole template
       * resolves and normalises onto whatever shape survived (`circle` →
       * `radius`), so it composes with the structure above instead of fighting
       * it. That ordering is also what frees the label: a type binding can now
       * carry `bindings.label` without its structure's shape overwriting the
       * per-complexity radius.
       *
       * Deliberately **no colours and no label typography** here: both are
       * theme-owned on the layer template below, and a styling template
       * out-ranks it.
       */
      const stylings: NodeStylingRegistry = {
        dot: {
          name: 'dot',
          size: {
            bind: 'data.complexity',
            map: { simple: 4, moderate: 5.5, complex: 8 }
          }
        }
      };

      /**
       * The five entity kinds, each bound to the same structure + styling and
       * the same label path. Written out rather than generated: a registry is
       * data, and the repetition is the legend — it is the list of kinds this
       * picture draws.
       */
      const nodeTypes: NodeTypeRegistry = {
        file: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } },
        function: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } },
        class: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } },
        config: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } },
        document: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } }
      };

      return {
        behaviours: {
          /**
           * **The "Colour by" switch, as data.** One behaviour, two dotted
           * paths: `type` is the entity kind (`file` · `function` · `class` ·
           * `config` · `document`), `data.cluster` the analyser's eight
           * architectural clusters. Both are root-relative paths over the
           * stored record, so the switch is a string swap in a saved config
           * rather than a new closure — which is what the settings panel reads
           * and what a `bgFill` resolver could never round-trip.
           *
           * One `valueColors` map serves both modes: the two key spaces don't
           * collide (`file` vs `layer:config`), and only the keys the active
           * path yields are ever looked up. Pinning them is what keeps a
           * cluster's colour from depending on which node the force sim happens
           * to seed first.
           *
           * `colorEdges: false` — at 1,329 relations the edges are deliberately
           * one faded grey; their aggregate is the picture.
           */
          color: {
            enabled: true,
            mode: 'categorical',
            nodeValueKey: colorMode === 'type' ? 'type' : 'data.cluster',
            colorEdges: false,
            valueColors: {
              // … by node type / entity kind …
              file: 0x3b82f6, // blue
              function: 0x10b981, // emerald
              class: 0x8b5cf6, // violet
              config: 0xf59e0b, // amber
              document: 0xec4899, // pink
              // … or by the analyser's 8 architectural clusters (the source `layers`).
              'layer:graph-connectors': 0x2563eb, // blue
              'layer:modeller': 0x8b5cf6, // violet
              'layer:engine-domain': 0x10b981, // emerald
              'layer:engine-platform': 0x14b8a6, // teal
              'layer:studio-ui': 0xf59e0b, // amber
              'layer:studio-data': 0xec4899, // pink
              'layer:studio-types': 0xef4444, // red
              'layer:config': 0x64748b // slate
            },
            // slate-400 — an entity in no cluster. Unreachable in `type` mode,
            // where all five kinds are pinned.
            fallbackColor: 0x94a3b8
          },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
          'label-lod': { enabled: true }
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            // The dot's circle, its radius-by-complexity and its label text all
            // come from the per-type templates above; the fill comes from the
            // `color` behaviour. What is left on the layer template is what the
            // theme owns and what is genuinely layer-wide (the LOD zoom floor)
            // — there is no resolver in this config.
            nodeStructureTemplates: structures,
            nodeStylingTemplates: stylings,
            nodeTypes,
            node: {
              style: {
                bgAlpha: 0.95,
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1,
                labelColor: 0x64748b, // slate-500 — reads on both light + dark bg
                labelFontSize: 9,
                labelPlacement: 'bottom',
                labelOffsetY: 2,
                // 602 labels would smother the cloud at the fitted overview, so
                // they only switch on past 0.6× — a small zoom-in from the
                // fitted view.
                labelMinZoom: 0.6
              },
              state: {
                highlighted: {
                  bgStrokeColor: 0xfbbf24,
                  bgStrokeWidth: 2.5,
                  // A hovered node is readable at any zoom.
                  labelForceShow: true
                },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.12 }
              }
            },
            edge: {
              style: {
                shape: { pathType: 'straight' },
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
          minimap: { position: 'bottom-right', width: 220, height: 160 },
          'label-lod': {
            levels: [
              { minZoom: 0, multiplier: 1 },
              { minZoom: 1.6, multiplier: 4 },
            ]
          }
        },
        layouts: {
          'graph-force': {
            // ~600 nodes / ~1.3k edges — skip intermediate renders and flush
            // once on settle, so the user sees the laid-out graph, not the
            // scatter.
            animate: false,
            link: { distance: 36 },
            charge: { strength: -90 },
            collide: { radius: 9 },
            center: { x: 0, y: 0 }
          }
        }
      };
    }, [colorMode]);

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
          title: 'Invana Code KG — d3-force',
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
                  key: 'labels',
                  label: 'Types',
                  // One trigger toggling a single entity type at a time keeps
                  // the header compact; a tick marks the ones in play.
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
        {/* Labels appear at 0.6× (`labelMinZoom`); this re-rasters them at 4×
            once you pass 1.6× so the text you zoomed in to read stays crisp.
            It never hides / shows labels — only their texture resolution. */}
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />

        {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
      </GraphCanvasApp>
    );
  }
};
