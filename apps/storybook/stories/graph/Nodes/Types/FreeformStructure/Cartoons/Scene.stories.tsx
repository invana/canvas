import {
  BackgroundLayer,
  CanvasThemeSync,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphCanvas,
  GraphLayer,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, NodeStructureRegistry, NodeTypeRegistry } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Cartoons, part 2 — a wired scene.** The same drawing vocabulary as the
 * `Characters` sheet, but the drawings are now *graph nodes*: a whiteboard
 * doodle of "what happens when I hit deploy", with real connectors between real
 * silhouettes.
 *
 * `dev → laptop → cloud → server → database`, plus a speech bubble parked over
 * the developer's head.
 *
 * What this adds over the character sheet:
 *
 * - **Connectors attach to the silhouette, not the box.** Each edge is routed
 *   against the compiled shape, so the line meets the rocket-or-blob outline
 *   rather than an invisible bounding rectangle — the `frame` earns its keep
 *   twice, once for the drawing and once for the routing.
 * - **A speech bubble is a `polygon` frame with a tail** — seven normalised
 *   points, six for the box and one dropped below the baseline. No element can
 *   draw a tail; the silhouette has to.
 * - **Edge captions come from the edge `type`**, resolved by the layer's
 *   `labelText` — the doodle's verbs (`types` · `deploys` · `routes` ·
 *   `queries`) are data, not decoration.
 * - **Text inside a drawing still binds.** The laptop's screen line, the
 *   cloud's name and the bubble's sentence are all `bind`ed paths, so the same
 *   five structures redraw for any story you feed them.
 *
 * Positions are explicit and there is no layout: a doodle is composed, not
 * solved. Drag the nodes around — the connectors re-route against the
 * silhouettes as they move.
 *
 * Colours are literal for the same reason as the character sheet: a drawing is
 * content, and the role vocabulary is chrome. The backdrop and the edge
 * captions are the only things following the theme.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/Cartoons/Scene' };
export default meta;
type Story = StoryObj;

// ── The cast — literal JSON ─────────────────────────────────────────────────
const STRUCTURES: NodeStructureRegistry = {
  /** A stick-ish developer: circle head, rounded body, four `line` limbs. */
  dev: {
    name: 'dev',
    kind: 'freeform',
    width: 150,
    height: 190,
    cornerRadius: 0,
    bg: 0x0f172a,
    elements: [
      { id: 'arm-l', type: 'line', x: 38, y: 104, x2: 8, y2: 132, color: 0x6366f1, strokeWidth: 8 },
      { id: 'arm-r', type: 'line', x: 112, y: 104, x2: 142, y2: 132, color: 0x6366f1, strokeWidth: 8 },
      { id: 'leg-l', type: 'line', x: 60, y: 152, x2: 52, y2: 186, color: 0x334155, strokeWidth: 8 },
      { id: 'leg-r', type: 'line', x: 90, y: 152, x2: 98, y2: 186, color: 0x334155, strokeWidth: 8 },
      { id: 'body', type: 'rect', x: 40, y: 84, width: 70, height: 72, cornerRadius: 16, fill: 0x6366f1 },
      { id: 'head', type: 'circle', x: 47, y: 14, radius: 28, fill: 0xfde68a, stroke: 0x92400e, strokeWidth: 2.5 },
      { id: 'hair', type: 'line', x: 54, y: 24, x2: 96, y2: 20, color: 0x92400e, strokeWidth: 7 },
      { id: 'eye-l', type: 'circle', x: 63, y: 38, radius: 4, fill: 0x0f172a },
      { id: 'eye-r', type: 'circle', x: 83, y: 38, radius: 4, fill: 0x0f172a },
      { id: 'smile-l', type: 'line', x: 66, y: 54, x2: 75, y2: 60, color: 0x92400e, strokeWidth: 2.5 },
      { id: 'smile-r', type: 'line', x: 75, y: 60, x2: 84, y2: 54, color: 0x92400e, strokeWidth: 2.5 },
      { id: 'badge', type: 'rect', x: 62, y: 104, width: 26, height: 18, cornerRadius: 4, fill: 0xe0e7ff },
      { id: 'badge-text', type: 'text', x: 75, y: 100, text: 'dev', anchor: 'center', fontSize: 9, fontWeight: 700, color: 0x3730a3 }
    ]
  },

  /**
   * The tail is the whole reason this is a `polygon` frame: `(0.3, 1)` drops
   * below the baseline the other six points hold at `0.72`.
   */
  bubble: {
    name: 'bubble',
    kind: 'freeform',
    width: 210,
    height: 120,
    frame: {
      kind: 'polygon',
      points: [
        { x: 0.04, y: 0 },
        { x: 0.96, y: 0 },
        { x: 0.96, y: 0.72 },
        { x: 0.44, y: 0.72 },
        { x: 0.3, y: 1 },
        { x: 0.28, y: 0.72 },
        { x: 0.04, y: 0.72 }
      ]
    },
    bg: 0xffffff,
    stroke: 0x0f172a,
    strokeWidth: 2.5,
    elements: [
      { id: 'says', type: 'text', x: 105, y: 16, bind: 'data.says', anchor: 'center', fontSize: 13, fontWeight: 600, color: 0x0f172a, maxWidth: 170, maxLines: 2 }
    ]
  },

  /** Screen, bezel, a few code bars and one bound line of "source". */
  laptop: {
    name: 'laptop',
    kind: 'freeform',
    width: 230,
    height: 150,
    cornerRadius: 0,
    bg: 0x0f172a,
    elements: [
      { id: 'lid', type: 'rect', x: 22, y: 10, width: 186, height: 108, cornerRadius: 10, fill: 0x1e293b, stroke: 0x475569, strokeWidth: 3 },
      { id: 'screen', type: 'rect', x: 32, y: 20, width: 166, height: 88, cornerRadius: 6, fill: 0x020617 },
      { id: 'bar-1', type: 'rect', x: 44, y: 32, width: 62, height: 6, cornerRadius: 3, fill: 0x38bdf8 },
      { id: 'bar-2', type: 'rect', x: 44, y: 44, width: 96, height: 6, cornerRadius: 3, fill: 0x475569 },
      { id: 'bar-3', type: 'rect', x: 56, y: 56, width: 74, height: 6, cornerRadius: 3, fill: 0x22c55e },
      { id: 'bar-4', type: 'rect', x: 56, y: 68, width: 48, height: 6, cornerRadius: 3, fill: 0x475569 },
      { id: 'prompt', type: 'text', x: 44, y: 78, bind: 'data.line', fontSize: 10, fontWeight: 600, color: 0xfacc15 },
      { id: 'base', type: 'rect', x: 8, y: 120, width: 214, height: 14, cornerRadius: 7, fill: 0x94a3b8 },
      { id: 'notch', type: 'rect', x: 100, y: 124, width: 30, height: 5, cornerRadius: 3, fill: 0x64748b }
    ]
  },

  /** Three puffs fused by a pill, with the name written across the belly. */
  cloud: {
    name: 'cloud',
    kind: 'freeform',
    width: 230,
    height: 150,
    cornerRadius: 0,
    bg: 0x0f172a,
    elements: [
      { id: 'puff-l', type: 'circle', x: 16, y: 44, radius: 38, fill: 0xe0f2fe },
      { id: 'puff-c', type: 'circle', x: 66, y: 14, radius: 50, fill: 0xe0f2fe },
      { id: 'puff-r', type: 'circle', x: 138, y: 42, radius: 40, fill: 0xe0f2fe },
      { id: 'base', type: 'rect', x: 16, y: 78, width: 198, height: 42, cornerRadius: 21, fill: 0xe0f2fe },
      { id: 'hem', type: 'line', x: 22, y: 120, x2: 208, y2: 120, color: 0x7dd3fc, strokeWidth: 3 },
      { id: 'name', type: 'text', x: 115, y: 82, bind: 'data.name', anchor: 'center', fontSize: 13, fontWeight: 700, uppercase: true, color: 0x0369a1 }
    ]
  },

  /** A little tower: three slots, three static lights, one bound hostname. */
  server: {
    name: 'server',
    kind: 'freeform',
    width: 170,
    height: 200,
    cornerRadius: 10,
    bg: 0x1e293b,
    stroke: 0x475569,
    strokeWidth: 3,
    elements: [
      { id: 'slot-1', type: 'rect', x: 16, y: 20, width: 138, height: 44, cornerRadius: 6, fill: 0x0f172a },
      { id: 'slot-2', type: 'rect', x: 16, y: 74, width: 138, height: 44, cornerRadius: 6, fill: 0x0f172a },
      { id: 'slot-3', type: 'rect', x: 16, y: 128, width: 138, height: 44, cornerRadius: 6, fill: 0x0f172a },
      { id: 'led-1', type: 'circle', x: 28, y: 36, radius: 6, fill: 0x22c55e },
      { id: 'led-2', type: 'circle', x: 28, y: 90, radius: 6, fill: 0x22c55e },
      { id: 'led-3', type: 'circle', x: 28, y: 144, radius: 6, fill: 0xf59e0b },
      { id: 'vent-1', type: 'line', x: 54, y: 42, x2: 142, y2: 42, color: 0x334155, strokeWidth: 3 },
      { id: 'vent-2', type: 'line', x: 54, y: 96, x2: 142, y2: 96, color: 0x334155, strokeWidth: 3 },
      { id: 'vent-3', type: 'line', x: 54, y: 150, x2: 142, y2: 150, color: 0x334155, strokeWidth: 3 },
      { id: 'host', type: 'text', x: 85, y: 168, bind: 'data.host', anchor: 'center', fontSize: 11, fontWeight: 600, color: 0xe2e8f0 }
    ]
  },

  /** The classic doodle database: three stacked pills, lightest on top. */
  database: {
    name: 'database',
    kind: 'freeform',
    width: 170,
    height: 180,
    cornerRadius: 0,
    bg: 0x0f172a,
    elements: [
      { id: 'disc-3', type: 'rect', x: 15, y: 104, width: 140, height: 46, cornerRadius: 23, fill: 0x0e7490, stroke: 0x164e63, strokeWidth: 2.5 },
      { id: 'disc-2', type: 'rect', x: 15, y: 62, width: 140, height: 46, cornerRadius: 23, fill: 0x0891b2, stroke: 0x164e63, strokeWidth: 2.5 },
      { id: 'disc-1', type: 'rect', x: 15, y: 20, width: 140, height: 46, cornerRadius: 23, fill: 0x22d3ee, stroke: 0x164e63, strokeWidth: 2.5 },
      { id: 'name', type: 'text', x: 85, y: 30, bind: 'data.name', anchor: 'center', fontSize: 12, fontWeight: 700, color: 0x083344 },
      { id: 'rows', type: 'text', x: 85, y: 150, bind: 'data.rows', anchor: 'center', fontSize: 10, color: 0x67e8f9 }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  dev: { structure: 'dev', styling: '', bindings: {} },
  bubble: { structure: 'bubble', styling: '', bindings: {} },
  laptop: { structure: 'laptop', styling: '', bindings: {} },
  cloud: { structure: 'cloud', styling: '', bindings: {} },
  server: { structure: 'server', styling: '', bindings: {} },
  database: { structure: 'database', styling: '', bindings: {} }
};

// Composed, not solved: a doodle has no layout. The bubble is positioned over
// the developer rather than wired to them — it is a thought, not a hop.
const DATA: GraphData = {
  nodes: [
    { id: 'bubble', type: 'bubble', position: { x: -470, y: -150 }, data: { says: 'it deploys itself, right?' } },
    { id: 'dev', type: 'dev', position: { x: -560, y: 40 }, data: {} },
    { id: 'laptop', type: 'laptop', position: { x: -280, y: 40 }, data: { line: '$ git push' } },
    { id: 'cloud', type: 'cloud', position: { x: 0, y: 0 }, data: { name: 'the internet' } },
    { id: 'server', type: 'server', position: { x: 280, y: 30 }, data: { host: 'kepler-01' } },
    { id: 'database', type: 'database', position: { x: 540, y: 40 }, data: { name: 'orders', rows: '8.4M rows' } }
  ],
  edges: [
    { id: 'e1', source: 'dev', target: 'laptop', type: 'types' },
    { id: 'e2', source: 'laptop', target: 'cloud', type: 'deploys' },
    { id: 'e3', source: 'cloud', target: 'server', type: 'routes' },
    { id: 'e4', source: 'server', target: 'database', type: 'queries' }
  ]
};

// Each drawing writes its own words, so no node label.
const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };

// Fat, soft, arrow-tipped: doodle lines. The caption is the edge's own `type`,
// and its colour is left to `GraphLayer.applyTheme` so it follows the palette.
const EDGE: GraphLayerProps['edge'] = {
  style: {
    shape: { pathType: 'smooth' },
    strokeWidth: 3.5,
    arrowSourceShape: 'none',
    arrowTargetShape: 'triangle',
    arrowTargetSize: 14,
    labelText: (e) => String(e.type ?? ''),
    labelFontSize: 11,
    labelPlacement: 'center',
    labelAutoRotate: false
  }
};

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const Scene: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="grid" />
        <ThemeBehaviour id="theme" mode="document" />
        <CanvasThemeSync />
        <GraphLayer
          id="graph"
          data={DATA}
          node={NODE}
          edge={EDGE}
          nodeStructureTemplates={STRUCTURES}
          nodeTypes={TYPES}
        />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        {/* Drag a drawing and watch the connectors re-route against the
            silhouettes rather than a bounding box. */}
        <DragNodeBehaviour id="drag" />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
      </GraphCanvas>
    </div>
  )
};
