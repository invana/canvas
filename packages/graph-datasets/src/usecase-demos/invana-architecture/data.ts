/**
 * **Invana end-to-end architecture** — the "build systems that learn" reference
 * diagram as a graph: eleven stages (the numbered 1–8 pipeline plus Memory,
 * Audit and Reversibility) framing 34 component boxes, wired by the 33-edge
 * learning loop.
 *
 * This is a **hand-authored diagram**, not a measurement, and three things
 * follow from that:
 *
 *   - **Positions are content.** Every node carries the `x` / `y` it has in the
 *     source diagram (a box's top-left corner; a stage's frame origin). The
 *     arrangement *is* the information — a solver run over this graph produces a
 *     different, and worse, picture. Consumers that want a layout anyway have a
 *     ready-made "authored vs solved" comparison.
 *   - **Containment is a two-level `stageId`,** not a general hierarchy: a `box`
 *     names the `stage` that frames it, and stages never nest.
 *   - **A box's `width` / `height` are content too** — captions are 1–3 lines
 *     (`\n` in `title`) and each box was sized to its text.
 *
 * Colour is deliberately *absent*: stage tints belong to whichever theme renders
 * the diagram, so a consumer keys its own palette off the stage ids.
 *
 * Placement, containment and the caption are hoisted onto the node itself
 * (`position` / `parentId` / `style.labelText`) rather than left in `data`, so
 * the dataset drops straight in — a consumer supplies only the *look*.
 *
 * @example
 * import { invanaArchitecture, invanaArchitectureSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={invanaArchitecture} config={invanaArchitectureSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';

export const invanaArchitecture = {
  nodes: [
    // ── Stage frames ──────────────────────────────────────────────────────
    { id: 'simulation', type: 'stage', states: ['stage'], position: { x: 1202, y: 84 }, style: { labelText: '5 · Simulation Layer — weigh it first' } },
    { id: 'memory', type: 'stage', states: ['stage'], position: { x: 792, y: 210 }, style: { labelText: 'Memory' } },
    { id: 'decision', type: 'stage', states: ['stage'], position: { x: 1242, y: 260 }, style: { labelText: '4 · Decision Runtime — decide' } },
    { id: 'learning', type: 'stage', states: ['stage'], position: { x: 16, y: 288 }, style: { labelText: '8 · Learning Layer — learn' } },
    { id: 'observe', type: 'stage', states: ['stage'], position: { x: 1518, y: 372 }, style: { labelText: '7 · Observe' } },
    { id: 'audit', type: 'stage', states: ['stage'], position: { x: 1818, y: 392 }, style: { labelText: 'Audit Layer' } },
    { id: 'context', type: 'stage', states: ['stage'], position: { x: 1192, y: 476 }, style: { labelText: '3 · Context Layer — define the system' } },
    { id: 'data-sources', type: 'stage', states: ['stage'], position: { x: 210, y: 494 }, style: { labelText: '1 · Data Sources' } },
    { id: 'reversibility', type: 'stage', states: ['stage'], position: { x: 1818, y: 562 }, style: { labelText: 'Reversibility Layer' } },
    { id: 'ingestion', type: 'stage', states: ['stage'], position: { x: 498, y: 660 }, style: { labelText: '2 · Ingestion' } },
    { id: 'action', type: 'stage', states: ['stage'], position: { x: 1518, y: 722 }, style: { labelText: '6 · Action — act, reversibly' } },

    // ── 5 · Simulation Layer ──────────────────────────────────────────────
    { id: 'sim-strategy', type: 'box', parentId: 'simulation', position: { x: 1216, y: 126 }, style: { labelText: 'Strategy Generation' }, data: { width: 142, height: 28 } },
    { id: 'sim-model', type: 'box', parentId: 'simulation', position: { x: 1216, y: 184 }, style: { labelText: 'Forward Model /\nDomain Simulator' }, data: { width: 136, height: 40 } },
    { id: 'sim-score', type: 'box', parentId: 'simulation', position: { x: 1518, y: 184 }, style: { labelText: 'Performance &\nImpact Scoring' }, data: { width: 130, height: 40 } },

    // ── Memory ────────────────────────────────────────────────────────────
    { id: 'mem-episodes', type: 'box', parentId: 'memory', position: { x: 806, y: 252 }, style: { labelText: 'Experience /\nEpisode Store' }, data: { width: 130, height: 40 } },
    { id: 'mem-weights', type: 'box', parentId: 'memory', position: { x: 806, y: 318 }, style: { labelText: 'Updated Policy &\nStrategy Weights' }, data: { width: 130, height: 40 } },

    // ── 4 · Decision Runtime ──────────────────────────────────────────────
    { id: 'dec-policy', type: 'box', parentId: 'decision', position: { x: 1256, y: 330 }, style: { labelText: 'Policy' }, data: { width: 62, height: 28 } },
    { id: 'dec-agents', type: 'box', parentId: 'decision', position: { x: 1518, y: 314 }, style: { labelText: 'AI Assistants / Agents\n(LLM + tools)' }, data: { width: 150, height: 40 } },
    { id: 'dec-gates', type: 'box', parentId: 'decision', position: { x: 1828, y: 302 }, style: { labelText: 'Confidence &\nApproval Gates\n(human-in-the-loop)' }, data: { width: 148, height: 52 } },

    // ── 8 · Learning Layer ────────────────────────────────────────────────
    { id: 'lrn-reward', type: 'box', parentId: 'learning', position: { x: 30, y: 330 }, style: { labelText: 'Reward Computation\n(predicted vs actual)' }, data: { width: 152, height: 40 } },
    { id: 'lrn-credit', type: 'box', parentId: 'learning', position: { x: 272, y: 336 }, style: { labelText: 'Credit Assignment' }, data: { width: 132, height: 28 } },
    { id: 'lrn-reinforced', type: 'box', parentId: 'learning', position: { x: 514, y: 336 }, style: { labelText: 'Reinforced Learnings' }, data: { width: 146, height: 28 } },

    // ── 7 · Observe ───────────────────────────────────────────────────────
    { id: 'obs-outcome', type: 'box', parentId: 'observe', position: { x: 1532, y: 414 }, style: { labelText: 'Outcome collection\n(back from the world)' }, data: { width: 150, height: 40 } },

    // ── Audit Layer ───────────────────────────────────────────────────────
    { id: 'aud-lineage', type: 'box', parentId: 'audit', position: { x: 1832, y: 434 }, style: { labelText: 'Provenance & Lineage' }, data: { width: 146, height: 28 } },
    { id: 'aud-log', type: 'box', parentId: 'audit', position: { x: 1832, y: 490 }, style: { labelText: 'Append-only\nDecision Log' }, data: { width: 146, height: 40 } },

    // ── 3 · Context Layer ─────────────────────────────────────────────────
    { id: 'ctx-obj', type: 'box', parentId: 'context', position: { x: 1206, y: 518 }, style: { labelText: "Objectives & Rewards\n(what 'good' means)" }, data: { width: 158, height: 40 } },
    { id: 'ctx-ontology', type: 'box', parentId: 'context', position: { x: 1206, y: 588 }, style: { labelText: 'Ontology\n(entities · relationships\n· rules · constraints)' }, data: { width: 158, height: 52 } },
    { id: 'ctx-kg', type: 'box', parentId: 'context', position: { x: 1518, y: 590 }, style: { labelText: 'Knowledge Graph\n(live world state)' }, data: { width: 138, height: 40 } },

    // ── 1 · Data Sources ──────────────────────────────────────────────────
    { id: 'ds-apis', type: 'box', parentId: 'data-sources', position: { x: 274, y: 536 }, style: { labelText: 'APIs & Services' }, data: { width: 122, height: 28 } },
    { id: 'ds-db', type: 'box', parentId: 'data-sources', position: { x: 274, y: 590 }, style: { labelText: 'Databases\n(SQL / NoSQL)' }, data: { width: 122, height: 40 } },
    { id: 'ds-graph', type: 'box', parentId: 'data-sources', position: { x: 224, y: 658 }, style: { labelText: 'Graph DBs\n(Neo4j · JanusGraph · ArcadeDB)' }, data: { width: 222, height: 40 } },
    { id: 'ds-files', type: 'box', parentId: 'data-sources', position: { x: 274, y: 726 }, style: { labelText: 'Files & Documents' }, data: { width: 122, height: 28 } },
    { id: 'ds-streams', type: 'box', parentId: 'data-sources', position: { x: 274, y: 780 }, style: { labelText: 'Event Streams\n(Kafka · queues)' }, data: { width: 122, height: 40 } },
    { id: 'ds-sensors', type: 'box', parentId: 'data-sources', position: { x: 250, y: 848 }, style: { labelText: 'Sensors / IoT / Telemetry' }, data: { width: 170, height: 28 } },

    // ── Reversibility Layer ───────────────────────────────────────────────
    { id: 'rev-state', type: 'box', parentId: 'reversibility', position: { x: 1832, y: 604 }, style: { labelText: 'Event-sourced State' }, data: { width: 146, height: 28 } },
    { id: 'rev-undo', type: 'box', parentId: 'reversibility', position: { x: 1832, y: 660 }, style: { labelText: 'Undo / Rollback' }, data: { width: 146, height: 28 } },

    // ── 2 · Ingestion ─────────────────────────────────────────────────────
    { id: 'in-etl', type: 'box', parentId: 'ingestion', position: { x: 520, y: 706 }, style: { labelText: 'Connectors & ETL' }, data: { width: 132, height: 28 } },
    { id: 'in-schema', type: 'box', parentId: 'ingestion', position: { x: 808, y: 706 }, style: { labelText: 'Schema Mapping' }, data: { width: 128, height: 28 } },
    { id: 'in-entity', type: 'box', parentId: 'ingestion', position: { x: 1222, y: 702 }, style: { labelText: 'Entity Resolution\n& Dedup' }, data: { width: 128, height: 40 } },
    { id: 'in-cdc', type: 'box', parentId: 'ingestion', position: { x: 512, y: 760 }, style: { labelText: 'Change Data Capture\n(streaming)' }, data: { width: 148, height: 40 } },

    // ── 6 · Action ────────────────────────────────────────────────────────
    { id: 'act-exec', type: 'box', parentId: 'action', position: { x: 1532, y: 764 }, style: { labelText: 'Action Executor' }, data: { width: 138, height: 28 } },
    { id: 'act-effectors', type: 'box', parentId: 'action', position: { x: 1828, y: 764 }, style: { labelText: 'Effectors → real systems' }, data: { width: 152, height: 28 } },
    { id: 'act-inverse', type: 'box', parentId: 'action', position: { x: 1828, y: 820 }, style: { labelText: 'Compensating Inverse' }, data: { width: 152, height: 28 } },
  ],

  edges: [
    // 1 · sources → ingestion
    { id: 'e-apis-etl', type: 'flow', source: 'ds-apis', target: 'in-etl', data: { dashed: false } },
    { id: 'e-db-etl', type: 'flow', source: 'ds-db', target: 'in-etl', data: { dashed: false } },
    { id: 'e-graph-etl', type: 'flow', source: 'ds-graph', target: 'in-etl', data: { dashed: false } },
    { id: 'e-files-etl', type: 'flow', source: 'ds-files', target: 'in-etl', data: { dashed: false } },
    { id: 'e-streams-cdc', type: 'flow', source: 'ds-streams', target: 'in-cdc', data: { dashed: false } },
    { id: 'e-sensors-cdc', type: 'flow', source: 'ds-sensors', target: 'in-cdc', data: { dashed: false } },
    // 2 · ingestion chain → the knowledge graph
    { id: 'e-etl-schema', type: 'flow', source: 'in-etl', target: 'in-schema', data: { dashed: false } },
    { id: 'e-schema-entity', type: 'flow', source: 'in-schema', target: 'in-entity', data: { dashed: false } },
    { id: 'e-entity-kg', type: 'flow', source: 'in-entity', target: 'ctx-kg', data: { caption: '2 · normalize → graph', dashed: false } },
    { id: 'e-cdc-kg', type: 'flow', source: 'in-cdc', target: 'ctx-kg', data: { dashed: false } },
    // 3 · context → the runtime
    { id: 'e-ontology-kg', type: 'flow', source: 'ctx-ontology', target: 'ctx-kg', data: { caption: 'shapes', dashed: true } },
    { id: 'e-kg-agents', type: 'flow', source: 'ctx-kg', target: 'dec-agents', data: { caption: '3 · grounded context', dashed: false } },
    // 4 · simulate before acting
    { id: 'e-weights-strategy', type: 'flow', source: 'mem-weights', target: 'sim-strategy', data: { caption: 'reweight strategies', dashed: false } },
    { id: 'e-strategy-score', type: 'flow', source: 'sim-strategy', target: 'sim-score', data: { dashed: false } },
    { id: 'e-score-model', type: 'flow', source: 'sim-score', target: 'sim-model', data: { caption: '4 · simulate', dashed: false } },
    { id: 'e-score-agents', type: 'flow', source: 'sim-score', target: 'dec-agents', data: { caption: 'ranked strategies', dashed: false } },
    { id: 'e-policy-agents', type: 'flow', source: 'dec-policy', target: 'dec-agents', data: { dashed: true } },
    { id: 'e-agents-gates', type: 'flow', source: 'dec-agents', target: 'dec-gates', data: { dashed: false } },
    // 5–6 · act, reversibly → observe
    { id: 'e-agents-exec', type: 'flow', source: 'dec-agents', target: 'act-exec', data: { caption: '5 · approved action', dashed: true } },
    { id: 'e-exec-effectors', type: 'flow', source: 'act-exec', target: 'act-effectors', data: { dashed: false } },
    { id: 'e-exec-inverse', type: 'flow', source: 'act-exec', target: 'act-inverse', data: { dashed: false } },
    { id: 'e-effectors-observe', type: 'flow', source: 'act-effectors', target: 'obs-outcome', data: { caption: '6 · real-world effects', dashed: true } },
    // 7–8 · learn from the outcome
    { id: 'e-observe-reward', type: 'flow', source: 'obs-outcome', target: 'lrn-reward', data: { caption: '7', dashed: false } },
    { id: 'e-reward-credit', type: 'flow', source: 'lrn-reward', target: 'lrn-credit', data: { dashed: false } },
    { id: 'e-credit-reinforced', type: 'flow', source: 'lrn-credit', target: 'lrn-reinforced', data: { dashed: false } },
    { id: 'e-reinforced-memory', type: 'flow', source: 'lrn-reinforced', target: 'mem-episodes', data: { caption: '8 · store outcome', dashed: false } },
    // 9 · memory feeds the runtime back
    { id: 'e-weights-policy', type: 'flow', source: 'mem-weights', target: 'dec-policy', data: { caption: '9 · update policy — learn from mistakes', dashed: false } },
    { id: 'e-episodes-agents', type: 'flow', source: 'mem-episodes', target: 'dec-agents', data: { caption: 'recall past episodes', dashed: true } },
    { id: 'e-weights-objectives', type: 'flow', source: 'mem-weights', target: 'ctx-obj', data: { caption: 'refine objectives', dashed: false } },
    // side layers — everything is logged and undoable
    { id: 'e-agents-lineage', type: 'flow', source: 'dec-agents', target: 'aud-lineage', data: { dashed: true } },
    { id: 'e-agents-log', type: 'flow', source: 'dec-agents', target: 'aud-log', data: { dashed: true } },
    { id: 'e-exec-state', type: 'flow', source: 'act-exec', target: 'rev-state', data: { dashed: true } },
    { id: 'e-inverse-undo', type: 'flow', source: 'act-inverse', target: 'rev-undo', data: { dashed: true } },
  ],
};

/** {@link invanaArchitecture} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = invanaArchitecture;

/**
 * Recommended look for the **Invana end-to-end architecture** diagram.
 *
 * The arrangement *is* the diagram — every node ships its authored position — so
 * there is **no layout** (`activeLayout: ''`). Colour-by-type is off for the same
 * reason: the stage tints are the diagram's own palette, carried by the `stage`
 * state overlay a consumer defines (each stage node names it in `states`).
 *
 * Boxes are plain rects sized from `data.width` / `data.height` via a consumer
 * `shape` resolver; what's here is everything about the look that serialises —
 * hairline grey arrows, small centred captions, and the label pill behind a flow
 * annotation.
 */
export const settings: CanvasConfig = {
  activeLayout: '',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          bgFill: 0xffffff,
          bgStrokeColor: 0x9ca3af,
          bgStrokeWidth: 1,
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
          shape: {
            pathType: 'smooth',
            sourceAnchor: 'boundary',
            targetAnchor: 'boundary',
          },
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
    color: { enabled: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
    // `collapse` and `click-select` both claim `pointer+click`; selection stands
    // down so the stage +/- toggles win.
    'click-select': { enabled: false },
  },
};
