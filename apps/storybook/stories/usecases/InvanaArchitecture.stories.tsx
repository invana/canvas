/**
 * **Invana — end-to-end architecture** — the "build systems that learn" diagram
 * rebuilt as a live graph on `<GraphCanvasApp>`, styled to match the source
 * diagram one-to-one: a white page, pastel stage frames with a folder tab at the
 * top-left, white boxes with a centred 1–3 line caption, and thin grey arrows
 * carrying the numbered flow.
 *
 * It maps the diagram onto three engine primitives:
 *
 *   - **Stages → auto-fitting group frames.** Each numbered stage (1 · Data
 *     Sources … 8 · Learning) plus Memory / Audit / Reversibility is a *group
 *     node* (`style.group`): a pastel `tabbed-rect` drawn behind its `parentId`
 *     members (`autoFit: true` → the frame wraps its children; `headerHeight`
 *     is the folder tab above them). The stage title is an ordinary
 *     `inside-center` label — a `tabbed-rect` routes every `inside-*` placement
 *     into its tab, since the body belongs to the boxes it frames, and the tab
 *     auto-sizes to the title. So a stage carries **no** label offsets and no
 *     background pill: the tab is real geometry, not a floated chip.
 *   - **Items → plain rect nodes.** Every box is a `rect` shape with a centred
 *     `labelText`; multi-line captions are plain `\n`s in that string, so no
 *     composite card / resolver is needed. The white fill + grey border + label
 *     font live **once** on the layer template (`layers.graph.node.style`); a
 *     node only carries what differs — its id, `parentId`, position, box size
 *     and caption.
 *   - **The learning loop → labelled edges.** The numbered flow (1→9) is thin
 *     smooth arrows; the feedback / side links (ranked strategies, recall
 *     episodes, decision log, compensating inverse) are dashed.
 *
 * **Positions are authored, not laid out** (`activeLayout: ''`) — the arrangement
 * *is* the diagram, so every box carries the coordinate it has in the source.
 * A `rect` node's `position` is its **top-left** corner (only `composite` is
 * centre-shifted), and an auto-fitting frame lands at
 * `childrenBBox.min − padding − headerHeight`, which is what each group's
 * `position` repeats so a *collapsed* stage stays put. On a `tabbed-rect` that
 * top-left is the top of the **tab**, and `shape.height` describes the body
 * alone — so the footprint is identical to the plain-rect version it replaced.
 *
 * Two engine details this story has to respect, both easy to trip over:
 *
 *   1. `bgFill` always wins over a shape's own `fill`, so the white box fill is
 *      set as `bgFill` on the layer template — otherwise `GraphCanvasApp`'s
 *      default slate `bgFill: 0x94a3b8` paints every box.
 *   2. The `theme` behaviour's `light` / `dark` shorthand publishes an **empty**
 *      palette, which is what keeps role-based recolour from repainting these
 *      hand-picked pastel frames when the app theme flips. The page stays white
 *      in both modes; the app chrome around it still themes.
 */

import { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphCanvas, GraphData, GraphEdge, GraphLayer, GraphNode } from '@invana/graph';
import { CollapseExpandBehaviour, MiniMapLayer } from '@invana/canvas-react';
import { CanvasMessageBar, GraphCanvasApp, GraphControlsToolbar, GraphStatusBar, ToolbarItems } from '@invana/canvas-ui';
import { ThemeProvider } from '@invana/themes';
import { Moon, Sun } from 'lucide-react';

const meta: Meta = { title: 'Usecases/InvanaArchitecture' };
export default meta;
type Story = StoryObj;

export const InvanaArchitecture: Story = {
  render: () => {
    // Stage frames. `position` = the frame's top-left (children bbox − 14 pad −
    // 28 tab); `shape.width/height` is the auto-fit *floor*, which doubles as
    // the size a stage collapses to. `tabWidth` here is only the pre-measure
    // fallback — the layer overwrites it with the title's measured width once
    // the renderer is up, which is why every stage reads identically no matter
    // how long its title is.
    //
    // The stage tint rides on a **state overlay** (`states: ['stage']`), not on
    // `style`: publishing a palette rewrites every group node's `style.bgFill` /
    // `style.bgStrokeColor` from the theme's `cardBg` / `divider` roles, so a
    // tint written to `style` is painted over the moment a theme lands. State
    // overlays resolve *above* `style`, so these survive a theme flip.
    const data: GraphData = useMemo(
      () => ({
        nodes: [
          // ── Stage frames ────────────────────────────────────────────────
          {
            id: 'simulation',
            states: ['stage'],
            state: { stage: { bgFill: 0xf5f3ff, bgStrokeColor: 0xa1a1aa } },
            position: { x: 1202, y: 84 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '5 · Simulation Layer — weigh it first',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'memory',
            states: ['stage'],
            state: { stage: { bgFill: 0xfefce8, bgStrokeColor: 0xa1a1aa } },
            position: { x: 792, y: 210 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: 'Memory',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'decision',
            states: ['stage'],
            state: { stage: { bgFill: 0xf0fdfa, bgStrokeColor: 0xa1a1aa } },
            position: { x: 1242, y: 260 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '4 · Decision Runtime — decide',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'learning',
            states: ['stage'],
            state: { stage: { bgFill: 0xfff7ed, bgStrokeColor: 0xa1a1aa } },
            position: { x: 16, y: 288 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '8 · Learning Layer — learn',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'observe',
            states: ['stage'],
            state: { stage: { bgFill: 0xfefce8, bgStrokeColor: 0xa1a1aa } },
            position: { x: 1518, y: 372 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '7 · Observe',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'audit',
            states: ['stage'],
            state: { stage: { bgFill: 0xf4f4f5, bgStrokeColor: 0xa1a1aa } },
            position: { x: 1818, y: 392 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: 'Audit Layer',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'context',
            states: ['stage'],
            state: { stage: { bgFill: 0xecfdf5, bgStrokeColor: 0xa1a1aa } },
            position: { x: 1192, y: 476 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '3 · Context Layer — define the system',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'data-sources',
            states: ['stage'],
            state: { stage: { bgFill: 0xeef2ff, bgStrokeColor: 0xa1a1aa } },
            position: { x: 210, y: 494 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '1 · Data Sources',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'reversibility',
            states: ['stage'],
            state: { stage: { bgFill: 0xf4f4f5, bgStrokeColor: 0xa1a1aa } },
            position: { x: 1818, y: 562 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: 'Reversibility Layer',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'ingestion',
            states: ['stage'],
            state: { stage: { bgFill: 0xecfeff, bgStrokeColor: 0xa1a1aa } },
            position: { x: 498, y: 660 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '2 · Ingestion',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },
          {
            id: 'action',
            states: ['stage'],
            state: { stage: { bgFill: 0xfef2f2, bgStrokeColor: 0xa1a1aa } },
            position: { x: 1518, y: 722 },
            style: {
              shape: { kind: 'tabbed-rect', width: 130, height: 36, tabWidth: 130, tabHeight: 28, cornerRadius: 6 },
              bgStrokeWidth: 1,
              group: {
                autoFit: true,
                padding: 14,
                headerHeight: 28,
                tabSkew: 12,
                behindChildren: true,
                togglePlacement: 'top-right',
              },
              labelText: '6 · Action — act, reversibly',
              labelPlacement: 'inside-center',
              labelColor: 0x27272a,
              labelFontSize: 11,
              labelFontWeight: 600,
            },
          },

          // ── 5 · Simulation Layer ────────────────────────────────────────
          {
            id: 'sim-strategy',
            parentId: 'simulation',
            position: { x: 1216, y: 126 },
            style: { shape: { kind: 'rect', width: 142, height: 28, cornerRadius: 3 }, labelText: 'Strategy Generation' },
          },
          {
            id: 'sim-model',
            parentId: 'simulation',
            position: { x: 1216, y: 184 },
            style: { shape: { kind: 'rect', width: 136, height: 40, cornerRadius: 3 }, labelText: 'Forward Model /\nDomain Simulator' },
          },
          {
            id: 'sim-score',
            parentId: 'simulation',
            position: { x: 1518, y: 184 },
            style: { shape: { kind: 'rect', width: 130, height: 40, cornerRadius: 3 }, labelText: 'Performance &\nImpact Scoring' },
          },

          // ── Memory ─────────────────────────────────────────────────────
          {
            id: 'mem-episodes',
            parentId: 'memory',
            position: { x: 806, y: 252 },
            style: { shape: { kind: 'rect', width: 130, height: 40, cornerRadius: 3 }, labelText: 'Experience /\nEpisode Store' },
          },
          {
            id: 'mem-weights',
            parentId: 'memory',
            position: { x: 806, y: 318 },
            style: { shape: { kind: 'rect', width: 130, height: 40, cornerRadius: 3 }, labelText: 'Updated Policy &\nStrategy Weights' },
          },

          // ── 4 · Decision Runtime ───────────────────────────────────────
          {
            id: 'dec-policy',
            parentId: 'decision',
            position: { x: 1256, y: 330 },
            style: { shape: { kind: 'rect', width: 62, height: 28, cornerRadius: 3 }, labelText: 'Policy' },
          },
          {
            id: 'dec-agents',
            parentId: 'decision',
            position: { x: 1518, y: 314 },
            style: { shape: { kind: 'rect', width: 150, height: 40, cornerRadius: 3 }, labelText: 'AI Assistants / Agents\n(LLM + tools)' },
          },
          {
            id: 'dec-gates',
            parentId: 'decision',
            position: { x: 1828, y: 302 },
            style: {
              shape: { kind: 'rect', width: 148, height: 52, cornerRadius: 3 },
              labelText: 'Confidence &\nApproval Gates\n(human-in-the-loop)',
            },
          },

          // ── 8 · Learning Layer ─────────────────────────────────────────
          {
            id: 'lrn-reward',
            parentId: 'learning',
            position: { x: 30, y: 330 },
            style: { shape: { kind: 'rect', width: 152, height: 40, cornerRadius: 3 }, labelText: 'Reward Computation\n(predicted vs actual)' },
          },
          {
            id: 'lrn-credit',
            parentId: 'learning',
            position: { x: 272, y: 336 },
            style: { shape: { kind: 'rect', width: 132, height: 28, cornerRadius: 3 }, labelText: 'Credit Assignment' },
          },
          {
            id: 'lrn-reinforced',
            parentId: 'learning',
            position: { x: 514, y: 336 },
            style: { shape: { kind: 'rect', width: 146, height: 28, cornerRadius: 3 }, labelText: 'Reinforced Learnings' },
          },

          // ── 7 · Observe ────────────────────────────────────────────────
          {
            id: 'obs-outcome',
            parentId: 'observe',
            position: { x: 1532, y: 414 },
            style: { shape: { kind: 'rect', width: 150, height: 40, cornerRadius: 3 }, labelText: 'Outcome collection\n(back from the world)' },
          },

          // ── Audit Layer ────────────────────────────────────────────────
          {
            id: 'aud-lineage',
            parentId: 'audit',
            position: { x: 1832, y: 434 },
            style: { shape: { kind: 'rect', width: 146, height: 28, cornerRadius: 3 }, labelText: 'Provenance & Lineage' },
          },
          {
            id: 'aud-log',
            parentId: 'audit',
            position: { x: 1832, y: 490 },
            style: { shape: { kind: 'rect', width: 146, height: 40, cornerRadius: 3 }, labelText: 'Append-only\nDecision Log' },
          },

          // ── 3 · Context Layer ──────────────────────────────────────────
          {
            id: 'ctx-obj',
            parentId: 'context',
            position: { x: 1206, y: 518 },
            style: { shape: { kind: 'rect', width: 158, height: 40, cornerRadius: 3 }, labelText: "Objectives & Rewards\n(what 'good' means)" },
          },
          {
            id: 'ctx-ontology',
            parentId: 'context',
            position: { x: 1206, y: 588 },
            style: {
              shape: { kind: 'rect', width: 158, height: 52, cornerRadius: 3 },
              labelText: 'Ontology\n(entities · relationships\n· rules · constraints)',
            },
          },
          {
            id: 'ctx-kg',
            parentId: 'context',
            position: { x: 1518, y: 590 },
            style: { shape: { kind: 'rect', width: 138, height: 40, cornerRadius: 3 }, labelText: 'Knowledge Graph\n(live world state)' },
          },

          // ── 1 · Data Sources ───────────────────────────────────────────
          {
            id: 'ds-apis',
            parentId: 'data-sources',
            position: { x: 274, y: 536 },
            style: { shape: { kind: 'rect', width: 122, height: 28, cornerRadius: 3 }, labelText: 'APIs & Services' },
          },
          {
            id: 'ds-db',
            parentId: 'data-sources',
            position: { x: 274, y: 590 },
            style: { shape: { kind: 'rect', width: 122, height: 40, cornerRadius: 3 }, labelText: 'Databases\n(SQL / NoSQL)' },
          },
          {
            id: 'ds-graph',
            parentId: 'data-sources',
            position: { x: 224, y: 658 },
            style: { shape: { kind: 'rect', width: 222, height: 40, cornerRadius: 3 }, labelText: 'Graph DBs\n(Neo4j · JanusGraph · ArcadeDB)' },
          },
          {
            id: 'ds-files',
            parentId: 'data-sources',
            position: { x: 274, y: 726 },
            style: { shape: { kind: 'rect', width: 122, height: 28, cornerRadius: 3 }, labelText: 'Files & Documents' },
          },
          {
            id: 'ds-streams',
            parentId: 'data-sources',
            position: { x: 274, y: 780 },
            style: { shape: { kind: 'rect', width: 122, height: 40, cornerRadius: 3 }, labelText: 'Event Streams\n(Kafka · queues)' },
          },
          {
            id: 'ds-sensors',
            parentId: 'data-sources',
            position: { x: 250, y: 848 },
            style: { shape: { kind: 'rect', width: 170, height: 28, cornerRadius: 3 }, labelText: 'Sensors / IoT / Telemetry' },
          },

          // ── Reversibility Layer ────────────────────────────────────────
          {
            id: 'rev-state',
            parentId: 'reversibility',
            position: { x: 1832, y: 604 },
            style: { shape: { kind: 'rect', width: 146, height: 28, cornerRadius: 3 }, labelText: 'Event-sourced State' },
          },
          {
            id: 'rev-undo',
            parentId: 'reversibility',
            position: { x: 1832, y: 660 },
            style: { shape: { kind: 'rect', width: 146, height: 28, cornerRadius: 3 }, labelText: 'Undo / Rollback' },
          },

          // ── 2 · Ingestion ──────────────────────────────────────────────
          {
            id: 'in-etl',
            parentId: 'ingestion',
            position: { x: 520, y: 706 },
            style: { shape: { kind: 'rect', width: 132, height: 28, cornerRadius: 3 }, labelText: 'Connectors & ETL' },
          },
          {
            id: 'in-schema',
            parentId: 'ingestion',
            position: { x: 808, y: 706 },
            style: { shape: { kind: 'rect', width: 128, height: 28, cornerRadius: 3 }, labelText: 'Schema Mapping' },
          },
          {
            id: 'in-entity',
            parentId: 'ingestion',
            position: { x: 1222, y: 702 },
            style: { shape: { kind: 'rect', width: 128, height: 40, cornerRadius: 3 }, labelText: 'Entity Resolution\n& Dedup' },
          },
          {
            id: 'in-cdc',
            parentId: 'ingestion',
            position: { x: 512, y: 760 },
            style: { shape: { kind: 'rect', width: 148, height: 40, cornerRadius: 3 }, labelText: 'Change Data Capture\n(streaming)' },
          },

          // ── 6 · Action ─────────────────────────────────────────────────
          {
            id: 'act-exec',
            parentId: 'action',
            position: { x: 1532, y: 764 },
            style: { shape: { kind: 'rect', width: 138, height: 28, cornerRadius: 3 }, labelText: 'Action Executor' },
          },
          {
            id: 'act-effectors',
            parentId: 'action',
            position: { x: 1828, y: 764 },
            style: { shape: { kind: 'rect', width: 152, height: 28, cornerRadius: 3 }, labelText: 'Effectors → real systems' },
          },
          {
            id: 'act-inverse',
            parentId: 'action',
            position: { x: 1828, y: 820 },
            style: { shape: { kind: 'rect', width: 152, height: 28, cornerRadius: 3 }, labelText: 'Compensating Inverse' },
          },
        ] satisfies GraphNode[],

        // Solid = the numbered loop; dashed (`strokeDashArray`) = the feedback /
        // side links. Everything else about an edge — colour, weight, arrowhead,
        // smooth path, label font + white pill — is on the layer template.
        edges: [
          // 1 · sources → ingestion
          { id: 'e-apis-etl', source: 'ds-apis', target: 'in-etl' },
          { id: 'e-db-etl', source: 'ds-db', target: 'in-etl' },
          { id: 'e-graph-etl', source: 'ds-graph', target: 'in-etl' },
          { id: 'e-files-etl', source: 'ds-files', target: 'in-etl' },
          { id: 'e-streams-cdc', source: 'ds-streams', target: 'in-cdc' },
          { id: 'e-sensors-cdc', source: 'ds-sensors', target: 'in-cdc' },
          // 2 · ingestion chain → the knowledge graph
          { id: 'e-etl-schema', source: 'in-etl', target: 'in-schema' },
          { id: 'e-schema-entity', source: 'in-schema', target: 'in-entity' },
          { id: 'e-entity-kg', source: 'in-entity', target: 'ctx-kg', style: { labelText: '2 · normalize → graph' } },
          { id: 'e-cdc-kg', source: 'in-cdc', target: 'ctx-kg' },
          // 3 · context → the runtime
          { id: 'e-ontology-kg', source: 'ctx-ontology', target: 'ctx-kg', style: { labelText: 'shapes', strokeDashArray: [5, 4] } },
          { id: 'e-kg-agents', source: 'ctx-kg', target: 'dec-agents', style: { labelText: '3 · grounded context' } },
          // 4 · simulate before acting
          { id: 'e-weights-strategy', source: 'mem-weights', target: 'sim-strategy', style: { labelText: 'reweight strategies' } },
          { id: 'e-strategy-score', source: 'sim-strategy', target: 'sim-score' },
          { id: 'e-score-model', source: 'sim-score', target: 'sim-model', style: { labelText: '4 · simulate' } },
          { id: 'e-score-agents', source: 'sim-score', target: 'dec-agents', style: { labelText: 'ranked strategies' } },
          { id: 'e-policy-agents', source: 'dec-policy', target: 'dec-agents', style: { strokeDashArray: [5, 4] } },
          { id: 'e-agents-gates', source: 'dec-agents', target: 'dec-gates' },
          // 5–6 · act, reversibly → observe
          { id: 'e-agents-exec', source: 'dec-agents', target: 'act-exec', style: { labelText: '5 · approved action', strokeDashArray: [5, 4] } },
          { id: 'e-exec-effectors', source: 'act-exec', target: 'act-effectors' },
          { id: 'e-exec-inverse', source: 'act-exec', target: 'act-inverse' },
          {
            id: 'e-effectors-observe',
            source: 'act-effectors',
            target: 'obs-outcome',
            style: { labelText: '6 · real-world effects', strokeDashArray: [5, 4] },
          },
          // 7–8 · learn from the outcome
          { id: 'e-observe-reward', source: 'obs-outcome', target: 'lrn-reward', style: { labelText: '7' } },
          { id: 'e-reward-credit', source: 'lrn-reward', target: 'lrn-credit' },
          { id: 'e-credit-reinforced', source: 'lrn-credit', target: 'lrn-reinforced' },
          { id: 'e-reinforced-memory', source: 'lrn-reinforced', target: 'mem-episodes', style: { labelText: '8 · store outcome' } },
          // 9 · memory feeds the runtime back
          {
            id: 'e-weights-policy',
            source: 'mem-weights',
            target: 'dec-policy',
            style: { labelText: '9 · update policy — learn from mistakes' },
          },
          {
            id: 'e-episodes-agents',
            source: 'mem-episodes',
            target: 'dec-agents',
            style: { labelText: 'recall past episodes', strokeDashArray: [5, 4] },
          },
          { id: 'e-weights-objectives', source: 'mem-weights', target: 'ctx-obj', style: { labelText: 'refine objectives' } },
          // side layers — everything is logged and undoable
          { id: 'e-agents-lineage', source: 'dec-agents', target: 'aud-lineage', style: { strokeDashArray: [5, 4] } },
          { id: 'e-agents-log', source: 'dec-agents', target: 'aud-log', style: { strokeDashArray: [5, 4] } },
          { id: 'e-exec-state', source: 'act-exec', target: 'rev-state', style: { strokeDashArray: [5, 4] } },
          { id: 'e-inverse-undo', source: 'act-inverse', target: 'rev-undo', style: { strokeDashArray: [5, 4] } },
        ] satisfies GraphEdge[],
      }),
      [],
    );

    const config = useMemo(
      () => ({
        // Positions are authored — no layout runs. `fitOnLoad` (on by default)
        // frames the diagram once the first paint lands.
        activeLayout: '',
        layers: {
          background: { type: 'solid', backgroundColor: '#ffffff' },
          graph: {
            // Every box shares this look; a node only overrides its box size +
            // caption. `bgFill` (not the shape's own `fill`) is what the
            // renderer paints, and it must be set here or the app's default
            // slate node fill wins.
            node: {
              style: {
                shape: { kind: 'rect', width: 130, height: 28, cornerRadius: 3 },
                bgFill: 0xffffff,
                bgStrokeColor: 0x9ca3af,
                bgStrokeWidth: 1,
                labelPlacement: 'center',
                labelAlign: 'center',
                labelColor: 0x111827,
                labelFontSize: 11,
                labelLineHeight: 14,
              },
            },
            edge: {
              style: {
                strokeColor: 0x9ca3af,
                strokeWidth: 1,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 7,
                shape: { pathType: 'smooth', sourceAnchor: 'boundary', targetAnchor: 'boundary' },
                labelColor: 0x3f3f46,
                labelFontSize: 10,
                labelAutoRotate: false,
                labelBackgroundFill: 0xffffff,
                labelBackgroundPadding: 2,
              },
            },
          },
        },
        behaviours: {
          // Colour-by-label off — the diagram's own palette is the point.
          color: { enabled: false },
          // Hovering a stage frame floats what it contains — its boxes and the
          // arrows between them — above the neighbouring stages. That's the
          // behaviour's own `raiseActive` doing the right thing for a group:
          // the frame is a backdrop, so it lifts its contents, not itself.
          hover: { enabled: true, state: 'highlighted', degree: 1 },
          // `collapse` and `click-select` both claim the `pointer+click` gesture
          // and the engine refuses the second claimant, so selection stands down
          // for the +/− toggles.
          'click-select': { enabled: false },
          // The light/dark shorthand publishes an *empty* palette, so the theme
          // never repaints these pastel frames. The page stays white in both
          // modes (the app chrome around it still themes).
          theme: {
            light: { backgroundColor: '#ffffff', color: '#e4e4e7' },
            dark: { backgroundColor: '#ffffff', color: '#e4e4e7' },
          },
        },
      }),
      [],
    );

    const onReady = useCallback((canvas: GraphCanvas | null) => {
      if (!canvas) return;
      const graph = canvas.layers.get('graph') as GraphLayer | undefined;
      const renderer = graph?.getRenderer();
      if (!graph || !renderer) return;

      // ── Keep the flow labels readable ───────────────────────────────────
      // An edge label is part of its connector, and connectors paint *below*
      // every shape — so a label that lands over a stage frame is covered by it
      // ("recall past episodes" disappearing into the Decision frame). Raising
      // a labelled connector reparents it to the overlay, above every
      // non-raised node, which is how the source diagram reads.
      const labelledEdges = new Set<string>();
      const raiseLabelledEdges = (): void => {
        for (const id of labelledEdges) {
          if (renderer.hasConnector(id)) renderer.raiseConnector(id, 1);
        }
      };
      for (const edge of graph.store.edges()) {
        if (graph.resolveEdgeStyle(edge).labelText === undefined) continue;
        labelledEdges.add(edge.id);
      }
      raiseLabelledEdges();
      // `HoverActivateBehaviour` lifts a hovered stage's internal edges and
      // drops them back to z 0 on release — it has no way to know some of them
      // were already lifted by this story. Re-assert after each hover so the
      // two labels that live *inside* a stage ("shapes", "4 · simulate") don't
      // sink behind their frame once you've hovered it.
      renderer.events.on('shape:pointerout', raiseLabelledEdges);
      renderer.events.on('connector:pointerout', raiseLabelledEdges);

      canvas.showMessage('Hover a stage to raise it · click − to collapse it · drag to move it');
    }, []);

    return (
      // A real consumer mounts the app under its own <ThemeProvider> — the app
      // reads light/dark from it (and throws without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Invana — end-to-end architecture',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
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
        >
          <CollapseExpandBehaviour id="collapse" targetLayerId="graph" />
          <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
