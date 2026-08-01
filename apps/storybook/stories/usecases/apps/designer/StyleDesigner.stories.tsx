/**
 * **Style Designer** — the third product surface, beside the modeller (draw the
 * graph) and the visualiser (explore it): **design how the graph looks**. Built
 * on `<GraphCanvasApp>` with the node-template stack docked into the app's
 * resizable `right` region as a three-tab designer.
 *
 * The sample is a 44-entity slice of the **real** Invana code knowledge graph
 * (`invanaCodeKg`, the same analyser output behind `usecases/domains/code-kg/*`),
 * narrowed to one architectural cluster so every edit repaints in a frame — a
 * designer needs a fast preview loop, not 602 cards. The header's **cluster**
 * picker swaps the working set.
 *
 * Three tabs, one per layer of the node-template model:
 *
 *   - **Templates** — `<NodeStructureEditorPanel>` edits the `NodeTypeBinding`
 *     for the picked entity type: which **structure** template (`idCard`,
 *     `circle`, `star`, …), which **styling** template, and the slot → data-path
 *     map (`title` → `data.name`). Applied on **Apply**, not per keystroke: a
 *     structure swap changes the node's *size*, so it wants a settled relayout
 *     rather than one per character.
 *   - **Styling** — `<NodeStylingEditorPanel>` edits the styling template's
 *     colour **roles** + typography. Wired **live** through `onChange`: styling
 *     is a repaint, never a relayout, so it's safe to push on every keystroke
 *     and that's what makes it feel like a design tool.
 *   - **Canvas** — `<CanvasSettingsEditorPanel>` for everything else the
 *     visualisation's state holds (layers · behaviours · layouts), so the
 *     designer isn't a node-only surface.
 *
 * The header's **preset** switch is itself a template edit, and the reason this
 * story sits next to the code-kg domain stories: *Cards* binds every type to
 * `idCard`, *Dots* binds them to `circle` — the two pictures
 * `domains/code-kg/CompositeCards` and `domains/code-kg/DotsForce` show, reached
 * here by changing a binding rather than a source file. Both presets share one
 * slot→field map (`title`/`subtitle` for the card, `label` for the circle);
 * slots a structure doesn't declare are simply ignored, so the switch only ever
 * flips `structure` + `styling`.
 *
 * Every editor is an engine-agnostic `@invana/canvas-ui` form — it emits pure
 * JSON and the story pushes it with `canvas.update({ layers: { graph: … } })`.
 * `config` is memoised **stable** (seed values only); all subsequent edits go
 * through that imperative `update`, so no edit ever hands the app a new `config`
 * identity and reloads the engine mid-design.
 *
 * Exercises: `NodeStructureEditorPanel` + `NodeStylingEditorPanel` +
 * `CanvasSettingsEditorPanel` docked in one `TabbedPanel`, the structure /
 * styling / binding three-layer model over real data, live `onChange` styling
 * preview vs Apply-gated structure edits, and `nodeTypes` /
 * `nodeStylingTemplates` registry patches.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  NodeStructureEditorPanel,
  NodeStylingEditorPanel,
  ToolbarItems,
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import {
  BUILT_IN_STRUCTURES,
  BUILT_IN_STYLINGS,
  type GraphCanvas,
  type GraphData,
  type NodeStylingTemplate,
  type NodeTypeBinding,
} from '@invana/graph';
import { invanaCodeKg, type InvanaCodeNodeLabel } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { TabbedPanel } from '@invana/ui';
import { Moon, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/apps/designer/StyleDesigner' };
export default meta;
type Story = StoryObj;

export const StyleDesignerStory: Story = {
  name: 'StyleDesigner',
  render: function Render() {
    /** The analyser's entity kinds — one `NodeTypeBinding` per kind is what the Templates tab edits. */
    const TYPES: InvanaCodeNodeLabel[] = ['file', 'function', 'class', 'config', 'document'];

    /** The architectural clusters the analyser found; one is the designer's working sample. */
    const CLUSTERS: Record<string, string> = {
      'layer:engine-domain': 'Engine · domain (44)',
      'layer:graph-connectors': 'Graph connectors (56)',
      'layer:studio-ui': 'Studio · UI (59)',
      'layer:engine-platform': 'Engine · platform (32)',
      'layer:studio-data': 'Studio · data (21)',
      'layer:modeller': 'Modeller (20)',
      'layer:config': 'Config (13)',
    };

    /**
     * A preset is nothing but a structure + styling swap across every type, plus
     * the force spacing that presentation needs — 220×96 cards want room that
     * dots don't.
     */
    const PRESETS = {
      cards: { structure: 'idCard', styling: 'idCard', collide: 130, distance: 190, charge: -700 },
      dots: { structure: 'circle', styling: 'circle', collide: 26, distance: 70, charge: -180 },
    };

    const [cluster, setCluster] = useState('layer:engine-domain');
    const [preset, setPreset] = useState<'cards' | 'dots'>('cards');
    const [editingType, setEditingType] = useState<InvanaCodeNodeLabel>('function');
    const [editingStyling, setEditingStyling] = useState<'idCard' | 'circle'>('idCard');

    /**
     * Seed bindings: every type on the card structure, its slots mapped onto the
     * analyser's fields. `label` is carried alongside `title`/`subtitle` so the
     * Dots preset has its slot filled too — a structure ignores slots it doesn't
     * declare, so one map serves both presets.
     */
    const SEED_BINDINGS = useMemo(() => {
      const seed: Record<string, NodeTypeBinding> = {};
      for (const t of TYPES) {
        seed[t] = {
          structure: 'idCard',
          styling: 'idCard',
          bindings: {
            type: 'type',
            title: 'data.name',
            subtitle: 'data.summary',
            label: 'data.name',
          },
        };
      }
      return seed;
      // TYPES is a render-local literal the seed closes over.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [bindings, setBindings] = useState<Record<string, NodeTypeBinding>>(SEED_BINDINGS);
    const [stylings, setStylings] = useState<Record<string, NodeStylingTemplate>>(
      () => ({ ...BUILT_IN_STYLINGS }),
    );

    /** The live engine, captured at ready so the editors' callbacks stay identity-stable. */
    const canvasRef = useRef<GraphCanvas | null>(null);

    const structureNames = useMemo(() => Object.keys(BUILT_IN_STRUCTURES), []);
    const stylingNames = useMemo(() => Object.keys(BUILT_IN_STYLINGS), []);

    // `label → type`, `properties → data`, narrowed to the picked cluster. A new
    // identity re-seeds the graph and re-runs the force layout.
    const data: GraphData = useMemo(() => {
      const keep = invanaCodeKg.nodes.filter((n) => n.data.cluster === cluster);
      const idSet = new Set(keep.map((n) => n.id));
      return {
        nodes: keep,
        edges: invanaCodeKg.edges
          .filter((e) => idSet.has(e.source) && idSet.has(e.target))
          .map((e) => e),
      };
    }, [cluster]);

    // Seed config only — stable identity for the app's lifetime. Every later edit
    // is an imperative `canvas.update(...)`, so designing never reloads the engine.
    const config: CanvasConfig = useMemo(
      () => ({
        behaviours: {
          // The templates carry the node's colour; nothing else may repaint it.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            nodeTypes: SEED_BINDINGS,
            nodeStylingTemplates: BUILT_IN_STYLINGS,
            edge: { style: { strokeWidth: 1.1, strokeAlpha: 0.35, arrowTargetShape: 'triangle', arrowTargetSize: 5 } },
          },
        },
        layouts: {
          'graph-force': {
            charge: { strength: PRESETS.cards.charge },
            link: { distance: PRESETS.cards.distance },
            collide: { radius: PRESETS.cards.collide },
            animate: false,
          },
        },
      }),
      // Seed literals are render-local and identical on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    /**
     * Styling edits ride `onChange` — a repaint, never a relayout — so they land
     * on every keystroke. The template carries its own `name`, so this stays
     * stable across type / tab switches and the editor never re-subscribes.
     */
    const applyStyling = useCallback((styling: NodeStylingTemplate) => {
      canvasRef.current?.update({ layers: { graph: { nodeStylingTemplates: { [styling.name]: styling } } } });
      setStylings((prev) => ({ ...prev, [styling.name]: styling }));
    }, []);

    /** Binding edits are Apply-gated — a structure swap resizes the node, so it wants a settled relayout. */
    const applyBinding = useCallback(
      (binding: NodeTypeBinding) => {
        canvasRef.current?.update({ layers: { graph: { nodeTypes: { [editingType]: binding } } } });
        setBindings((prev) => ({ ...prev, [editingType]: binding }));
      },
      [editingType],
    );

    /** The preset switch: one structure + styling across every type, plus the spacing that presentation needs. */
    const applyPreset = useCallback(
      (next: 'cards' | 'dots') => {
        const p = PRESETS[next];
        const nextBindings: Record<string, NodeTypeBinding> = {};
        for (const t of TYPES) {
          // Keep the type's own field map; only the two template names move.
          nextBindings[t] = {
            structure: p.structure,
            styling: p.styling,
            bindings: bindings[t]?.bindings ?? {},
          };
        }
        setPreset(next);
        setEditingStyling(next === 'cards' ? 'idCard' : 'circle');
        setBindings(nextBindings);
        canvasRef.current?.update({
          layers: { graph: { nodeTypes: nextBindings } },
          layouts: {
            'graph-force': {
              charge: { strength: p.charge },
              link: { distance: p.distance },
              collide: { radius: p.collide },
            },
          },
        });
        // A preset changes the node's *size* by an order of magnitude (220×96
        // card ⇄ small circle), so the old camera framing is meaningless. `refresh()`
        // — not a hand-rolled `fitView` — because it goes through `runLayout`, and
        // only a real run bridges the `layout:run:*` events that `fitOnLoad`'s
        // follow-fit listens on. (A bare `update({ layouts })` re-heats the sim
        // *directly*, off-bus by design, so any fit scheduled beside it races the
        // settle and frames a collapsed graph.)
        void canvasRef.current?.refresh();
      },
      // PRESETS / TYPES are render-local literals.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [bindings],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      canvasRef.current = c;
      c?.showMessage('Design the node templates in the right panel — styling previews live, structure applies on Apply');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Style Designer',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'preset',
                    label: 'Preset',
                    value: preset,
                    options: { cards: 'Cards (idCard)', dots: 'Dots (circle)' },
                    onChange: (v) => applyPreset(v as 'cards' | 'dots'),
                  },
                  {
                    type: 'select',
                    key: 'cluster',
                    label: 'Sample',
                    value: cluster,
                    options: CLUSTERS,
                    onChange: setCluster,
                  },
                  {
                    type: 'toggle',
                    key: 'theme',
                    icon: Sun,
                    activeIcon: Moon,
                    label: 'Switch to dark theme',
                    activeLabel: 'Switch to light theme',
                    active: ctx.themeKind === 'dark',
                    onToggle: ctx.toggleTheme,
                  },
                ]}
              />
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          // The three-layer designer fills the resizable right region. `ctx.canvas`
          // is `null` until every layer / behaviour registers — the settings editor
          // handles that itself, and the two template forms are pure (JSON in →
          // JSON out), so nothing here needs a readiness gate.
          right={{
            defaultSize: '380px',
            maxSize: '520px',
            collapsible: true,
            content: (ctx) => (
              <TabbedPanel
                className="h-full border-0 bg-transparent shadow-none"
                bodyClassName="overflow-y-auto"
                defaultTab="templates"
                tabs={[
                  {
                    value: 'templates',
                    label: 'Templates',
                    content: (
                      <div className="flex flex-col gap-2 p-3">
                        <ToolbarItems
                          orientation="horizontal"
                          items={[
                            {
                              type: 'select',
                              key: 'editing-type',
                              label: 'Entity type',
                              value: editingType,
                              options: Object.fromEntries(TYPES.map((t) => [t, t])),
                              onChange: (v) => setEditingType(v as InvanaCodeNodeLabel),
                            },
                          ]}
                        />
                        {/* `defaults` loads once per mount, so the key carries both the
                            picked type *and* its structure — a preset switch rewrites
                            every binding, and the form has to reload with it. */}
                        <NodeStructureEditorPanel
                          key={`${editingType}:${bindings[editingType]?.structure ?? ''}`}
                          defaults={bindings[editingType]}
                          structures={structureNames}
                          stylings={stylingNames}
                          onSubmit={applyBinding}
                          submitLabel={`Apply to ${editingType}`}
                        />
                      </div>
                    ),
                  },
                  {
                    value: 'styling',
                    label: 'Styling',
                    content: (
                      <div className="flex flex-col gap-2 p-3">
                        <ToolbarItems
                          orientation="horizontal"
                          items={[
                            {
                              type: 'select',
                              key: 'editing-styling',
                              label: 'Styling template',
                              value: editingStyling,
                              options: { idCard: 'idCard (card)', circle: 'circle (simple)' },
                              onChange: (v) => setEditingStyling(v as 'idCard' | 'circle'),
                            },
                          ]}
                        />
                        {/* Remount when the edited template changes, same reason. */}
                        <NodeStylingEditorPanel
                          key={editingStyling}
                          defaults={stylings[editingStyling]}
                          variant={editingStyling === 'idCard' ? 'card' : 'simple'}
                          onChange={applyStyling}
                          onSubmit={applyStyling}
                        />
                      </div>
                    ),
                  },
                  {
                    value: 'canvas',
                    label: 'Canvas',
                    content: (
                      <CanvasSettingsEditorPanel
                        canvas={ctx.canvas}
                        className="border-0 bg-transparent shadow-none"
                      />
                    ),
                  },
                ]}
              />
            ),
          }}
        />
      </ThemeProvider>
    );
  },
};
