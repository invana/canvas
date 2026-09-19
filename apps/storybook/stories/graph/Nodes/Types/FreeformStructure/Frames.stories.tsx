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
 * **`FreeformStructure` — the `frame` silhouette.** A card is not necessarily a
 * rectangle. `frame` swaps the background silhouette the card is drawn on, and
 * the fill, the border and any decorations follow it — because the engine's
 * composite **borrows a real shape** for its root rather than duplicating the
 * geometry (`file:packages/graph/src/template/compile.ts#L46`).
 *
 * Four kinds, all sized to fill the `width × height` box:
 *
 * | `frame.kind` | Becomes | Sizing |
 * |---|---|---|
 * | omitted | rounded rect | `cornerRadius` |
 * | `rect` | rounded rect | its own `cornerRadius`, else the structure's |
 * | `ellipse` | ellipse | inscribed in the box (`radiusX/Y` = half the box) |
 * | `regular-polygon` | n-gon | circum-radius = `min(width, height) / 2`, optional `rotation` in radians |
 * | `polygon` | free polygon | `points` are **normalised `[0, 1]`** box coordinates, mapped centre-relative |
 *
 * **Elements do not follow the silhouette.** They are still absolute
 * coordinates in the same `width × height` box, and the compiler sets no clip —
 * so anything near a corner escapes an ellipse or a hexagon. Every card below
 * keeps its content in the middle band for that reason; a diamond has roughly a
 * quarter of the box usable.
 *
 * All four cards carry an identical element list. Only `frame` differs.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/Frames' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, one structure per frame kind ──────────────
// The same three elements four times over, written out rather than spread: the
// registry is the designer's output format, so it stays plain JSON.
const STRUCTURES: NodeStructureRegistry = {
  /** The default, stated explicitly. `frame.cornerRadius` wins over the structure's. */
  frameRect: {
    name: 'frameRect',
    kind: 'freeform',
    width: 210,
    height: 210,
    cornerRadius: 18,
    frame: { kind: 'rect', cornerRadius: 18 },
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.5,
    elements: [
      { id: 'title', type: 'text', x: 105, y: 62, bind: 'data.frame', anchor: 'center', fontSize: 14, fontWeight: 600, colorRole: 'heading' },
      { id: 'note', type: 'text', x: 105, y: 87.5, bind: 'data.note', anchor: 'center', fontSize: 10.5, colorRole: 'muted' },
      { id: 'dot', type: 'circle', x: 99, y: 122, radius: 6, fillRole: 'accent' }
    ]
  },

  /** Inscribed in the box — a 210×210 box gives a circle, a wider one an oval. */
  frameEllipse: {
    name: 'frameEllipse',
    kind: 'freeform',
    width: 210,
    height: 210,
    cornerRadius: 18,
    frame: { kind: 'ellipse' },
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.5,
    elements: [
      { id: 'title', type: 'text', x: 105, y: 62, bind: 'data.frame', anchor: 'center', fontSize: 14, fontWeight: 600, colorRole: 'heading' },
      { id: 'note', type: 'text', x: 105, y: 87.5, bind: 'data.note', anchor: 'center', fontSize: 10.5, colorRole: 'muted' },
      { id: 'dot', type: 'circle', x: 99, y: 122, radius: 6, fillRole: 'accent' }
    ]
  },

  /**
   * `rotation` is **radians**, and it is what turns a pointy-top hexagon into a
   * flat-top one: 0.5236 ≈ π/6. Written as a literal so the template survives a
   * `JSON.stringify` round trip.
   */
  frameHex: {
    name: 'frameHex',
    kind: 'freeform',
    width: 210,
    height: 210,
    cornerRadius: 18,
    frame: { kind: 'regular-polygon', sides: 6, rotation: 0.5236 },
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.5,
    elements: [
      { id: 'title', type: 'text', x: 105, y: 62, bind: 'data.frame', anchor: 'center', fontSize: 14, fontWeight: 600, colorRole: 'heading' },
      { id: 'note', type: 'text', x: 105, y: 87.5, bind: 'data.note', anchor: 'center', fontSize: 10.5, colorRole: 'muted' },
      { id: 'dot', type: 'circle', x: 99, y: 122, radius: 6, fillRole: 'accent' }
    ]
  },

  /**
   * Arbitrary geometry: `points` are fractions of the box, so the same list
   * rescales with `width` / `height`. This one is a diamond — the tightest of
   * the four for element room.
   */
  framePoly: {
    name: 'framePoly',
    kind: 'freeform',
    width: 210,
    height: 210,
    cornerRadius: 18,
    frame: {
      kind: 'polygon',
      points: [
        { x: 0.5, y: 0 },
        { x: 1, y: 0.5 },
        { x: 0.5, y: 1 },
        { x: 0, y: 0.5 }
      ]
    },
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.5,
    elements: [
      { id: 'title', type: 'text', x: 105, y: 62, bind: 'data.frame', anchor: 'center', fontSize: 14, fontWeight: 600, colorRole: 'heading' },
      { id: 'note', type: 'text', x: 105, y: 87.5, bind: 'data.note', anchor: 'center', fontSize: 10.5, colorRole: 'muted' },
      { id: 'dot', type: 'circle', x: 99, y: 122, radius: 6, fillRole: 'accent' }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  frameRect: { structure: 'frameRect', styling: '', bindings: {} },
  frameEllipse: { structure: 'frameEllipse', styling: '', bindings: {} },
  frameHex: { structure: 'frameHex', styling: '', bindings: {} },
  framePoly: { structure: 'framePoly', styling: '', bindings: {} }
};

// The two captions on every card are bound, not literal — one element list,
// four different readings of it.
const DATA: GraphData = {
  nodes: [
    { id: 'rect', type: 'frameRect', position: { x: -360, y: 0 }, data: { frame: "kind: 'rect'", note: 'cornerRadius: 18' } },
    { id: 'ellipse', type: 'frameEllipse', position: { x: -120, y: 0 }, data: { frame: "kind: 'ellipse'", note: 'inscribed in the box' } },
    { id: 'hex', type: 'frameHex', position: { x: 120, y: 0 }, data: { frame: "kind: 'regular-polygon'", note: 'sides 6 · rotation 0.5236' } },
    { id: 'poly', type: 'framePoly', position: { x: 360, y: 0 }, data: { frame: "kind: 'polygon'", note: '4 normalised points' } }
  ],
  edges: []
};

const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const Frames: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <CanvasThemeSync />
        <GraphLayer id="graph" data={DATA} node={NODE} nodeStructureTemplates={STRUCTURES} nodeTypes={TYPES} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
      </GraphCanvas>
    </div>
  )
};
