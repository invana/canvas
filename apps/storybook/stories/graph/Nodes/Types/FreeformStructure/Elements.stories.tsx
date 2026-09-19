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
 * **`FreeformStructure` — the five element kinds.** `elements[]` is the whole
 * drawing vocabulary, and it is deliberately small: `text` · `rect` · `circle`
 * · `line` · `image`. One card per kind, each drawing its own variants.
 *
 * | Kind | Geometry | Colour pair(s) | Notable fields |
 * |---|---|---|---|
 * | `text` | `x`,`y` (top-left, see below) | `colorRole` / `color` | `fontSize`, `fontWeight`, `fontStyle`, `uppercase`, `anchor`, `maxWidth` + `maxLines` |
 * | `rect` | `x`,`y`,`width`,`height` | `fillRole`/`fill` + `strokeRole`/`stroke` | `cornerRadius`, `fillAlpha`, `strokeWidth`, `hitId` |
 * | `circle` | `x`,`y` (**bounding-box top-left**), `radius` | `fillRole`/`fill` + `strokeRole`/`stroke` | `fillAlpha`, `strokeWidth`, `hitId` |
 * | `line` | `x`,`y` → `x2`,`y2` | `colorRole` / `color` | `strokeWidth` |
 * | `image` | `x`,`y`,`size` | — (themed placeholder) | `shape: 'circle' \| 'rounded'`, `bind` |
 *
 * Three things worth knowing before you author one:
 *
 * - **Order in `elements[]` is z-order** — later elements paint on top. Every
 *   card here puts its plates first and its text last.
 * - **A `circle`'s authored `x`/`y` is its bounding box's top-left**, uniform
 *   with every other element; the compiler converts to the centre-based part
 *   (`file:packages/graph/src/template/compile.ts#L476`). A `rect` and a
 *   `circle` at the same `x`,`y` line up.
 * - **`image` is a placeholder today** — no composite image part exists yet, so
 *   the compiler emits a themed circle or rounded rect
 *   (`file:packages/graph/src/template/compile.ts#L497`). `bind` is accepted
 *   and carried, but nothing is loaded. The last card says so on its face.
 *
 * Text `y` is authored as `renderedTop − fontSize` throughout — see the
 * `Anatomy` sibling for why.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/Elements' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, one structure per element kind ────────────
const STRUCTURES: NodeStructureRegistry = {
  /** `text` — the only element that can carry data, and the only one that wraps. */
  textEl: {
    name: 'textEl',
    kind: 'freeform',
    width: 260,
    height: 170,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.2,
    elements: [
      { id: 'kind', type: 'text', x: 14, y: 2, text: 'text', fontSize: 12, fontWeight: 700, uppercase: true, colorRole: 'accent' },
      { id: 'rule', type: 'line', x: 14, y: 34, x2: 246, y2: 34, colorRole: 'divider' },
      { id: 'big', type: 'text', x: 14, y: 28, text: 'fontSize 16 · weight 700', fontSize: 16, fontWeight: 700, colorRole: 'heading' },
      { id: 'italic', type: 'text', x: 14, y: 58, text: "fontStyle: 'italic'", fontSize: 12, fontStyle: 'italic', colorRole: 'muted' },
      { id: 'upper', type: 'text', x: 14, y: 79, text: 'uppercase: true', fontSize: 11, uppercase: true, colorRole: 'foreground' },
      // One `anchor` per horizontal position: `x` is the left edge, the centre
      // and the right edge respectively.
      { id: 'a-left', type: 'text', x: 14, y: 101.5, text: 'left', fontSize: 10.5, colorRole: 'muted' },
      { id: 'a-center', type: 'text', x: 130, y: 101.5, text: 'center', anchor: 'center', fontSize: 10.5, colorRole: 'muted' },
      { id: 'a-right', type: 'text', x: 246, y: 101.5, text: 'right', anchor: 'right', fontSize: 10.5, colorRole: 'muted' },
      // `maxWidth` turns the single unbounded line into a wrapped block;
      // `maxLines` caps it and the overflow ellipsises.
      { id: 'wrap', type: 'text', x: 14, y: 120, text: 'maxWidth 232 · maxLines 2 — a sentence long enough to need both of them, and then some.', fontSize: 10, maxWidth: 232, maxLines: 2, colorRole: 'muted' }
    ]
  },

  /** `rect` — plates, chips, strips, zebra rows. */
  rectEl: {
    name: 'rectEl',
    kind: 'freeform',
    width: 260,
    height: 170,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.2,
    elements: [
      { id: 'kind', type: 'text', x: 14, y: 2, text: 'rect', fontSize: 12, fontWeight: 700, uppercase: true, colorRole: 'accent' },
      { id: 'rule', type: 'line', x: 14, y: 34, x2: 246, y2: 34, colorRole: 'divider' },
      { id: 'solid', type: 'rect', x: 14, y: 46, width: 70, height: 36, fillRole: 'accent' },
      { id: 'tint', type: 'rect', x: 96, y: 46, width: 70, height: 36, cornerRadius: 10, fillRole: 'accent', fillAlpha: 0.25 },
      // No fill at all → an outlined glyph. The pair is independent: fill and
      // stroke are set (or omitted) separately.
      { id: 'outline', type: 'rect', x: 178, y: 46, width: 70, height: 36, cornerRadius: 6, strokeRole: 'accent', strokeWidth: 1.5 },
      { id: 'c-solid', type: 'text', x: 49, y: 80.5, text: 'fillRole', anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'c-tint', type: 'text', x: 131, y: 80.5, text: 'fillAlpha .25', anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'c-out', type: 'text', x: 213, y: 80.5, text: 'stroke only', anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n1', type: 'text', x: 14, y: 104, text: 'x/y = top-left · cornerRadius per rect', fontSize: 10, colorRole: 'muted' },
      { id: 'n2', type: 'text', x: 14, y: 122, text: 'fillAlpha tints a themed fill —', fontSize: 10, colorRole: 'muted' },
      { id: 'n3', type: 'text', x: 14, y: 140, text: 'a zebra row that survives a theme swap', fontSize: 10, colorRole: 'muted' }
    ]
  },

  /** `circle` — chips, dots, status markers. */
  circleEl: {
    name: 'circleEl',
    kind: 'freeform',
    width: 260,
    height: 170,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.2,
    elements: [
      { id: 'kind', type: 'text', x: 14, y: 2, text: 'circle', fontSize: 12, fontWeight: 700, uppercase: true, colorRole: 'accent' },
      { id: 'rule', type: 'line', x: 14, y: 34, x2: 246, y2: 34, colorRole: 'divider' },
      { id: 'solid', type: 'circle', x: 22, y: 48, radius: 18, fillRole: 'accent' },
      { id: 'tint', type: 'circle', x: 104, y: 48, radius: 18, fillRole: 'accent', fillAlpha: 0.3 },
      { id: 'outline', type: 'circle', x: 186, y: 48, radius: 18, strokeRole: 'accent', strokeWidth: 2 },
      { id: 'c-solid', type: 'text', x: 40, y: 82.5, text: 'fillRole', anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'c-tint', type: 'text', x: 122, y: 82.5, text: 'fillAlpha .3', anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'c-out', type: 'text', x: 204, y: 82.5, text: 'stroke only', anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n1', type: 'text', x: 14, y: 108, text: 'authored x/y is the bounding box top-left, not the centre — the compiler converts.', fontSize: 10, maxWidth: 232, maxLines: 2, colorRole: 'muted' },
      { id: 'n2', type: 'text', x: 14, y: 142, text: 'so a rect and a circle at the same x/y align', fontSize: 9.5, colorRole: 'muted' }
    ]
  },

  /** `line` — dividers, rules, connectors drawn inside the card. */
  lineEl: {
    name: 'lineEl',
    kind: 'freeform',
    width: 260,
    height: 170,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.2,
    elements: [
      { id: 'kind', type: 'text', x: 14, y: 2, text: 'line', fontSize: 12, fontWeight: 700, uppercase: true, colorRole: 'accent' },
      { id: 'rule', type: 'line', x: 14, y: 34, x2: 246, y2: 34, colorRole: 'divider' },
      { id: 'l1', type: 'line', x: 14, y: 46, x2: 246, y2: 46, colorRole: 'divider' },
      { id: 'c1', type: 'text', x: 14, y: 40.5, text: "strokeWidth 1 · 'divider' (the default colour)", fontSize: 9.5, colorRole: 'muted' },
      { id: 'l2', type: 'line', x: 14, y: 76, x2: 246, y2: 76, colorRole: 'muted', strokeWidth: 2 },
      { id: 'c2', type: 'text', x: 14, y: 70.5, text: "strokeWidth 2 · 'muted'", fontSize: 9.5, colorRole: 'muted' },
      // `x2`/`y2` are free — a line is not restricted to a rule.
      { id: 'l3', type: 'line', x: 14, y: 104, x2: 246, y2: 128, colorRole: 'accent', strokeWidth: 3 },
      { id: 'c3', type: 'text', x: 14, y: 122, text: 'x2 / y2 → any diagonal', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n1', type: 'text', x: 14, y: 146, text: 'a line has no fill and no hitId', fontSize: 9.5, colorRole: 'muted' }
    ]
  },

  /** `image` — the one element the renderer cannot draw yet. */
  imageEl: {
    name: 'imageEl',
    kind: 'freeform',
    width: 260,
    height: 170,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.2,
    elements: [
      { id: 'kind', type: 'text', x: 14, y: 2, text: 'image', fontSize: 12, fontWeight: 700, uppercase: true, colorRole: 'accent' },
      { id: 'rule', type: 'line', x: 14, y: 34, x2: 246, y2: 34, colorRole: 'divider' },
      { id: 'round', type: 'image', x: 20, y: 46, size: 56, shape: 'circle', bind: 'data.avatar' },
      { id: 'square', type: 'image', x: 104, y: 46, size: 56, shape: 'rounded', bind: 'data.avatar' },
      { id: 'c-round', type: 'text', x: 48, y: 98.5, text: "shape: 'circle'", anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'c-square', type: 'text', x: 132, y: 98.5, text: "shape: 'rounded'", anchor: 'center', fontSize: 9.5, colorRole: 'muted' },
      { id: 'n1', type: 'text', x: 14, y: 108, text: 'placeholder only: the compiler emits a themed circle / rounded rect. `bind` is carried, nothing is loaded.', fontSize: 10, maxWidth: 232, maxLines: 3, colorRole: 'muted' }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  textEl: { structure: 'textEl', styling: '', bindings: {} },
  rectEl: { structure: 'rectEl', styling: '', bindings: {} },
  circleEl: { structure: 'circleEl', styling: '', bindings: {} },
  lineEl: { structure: 'lineEl', styling: '', bindings: {} },
  imageEl: { structure: 'imageEl', styling: '', bindings: {} }
};

const DATA: GraphData = {
  nodes: [
    { id: 'text', type: 'textEl', position: { x: -600, y: 0 }, data: {} },
    { id: 'rect', type: 'rectEl', position: { x: -300, y: 0 }, data: {} },
    { id: 'circle', type: 'circleEl', position: { x: 0, y: 0 }, data: {} },
    { id: 'line', type: 'lineEl', position: { x: 300, y: 0 }, data: {} },
    { id: 'image', type: 'imageEl', position: { x: 600, y: 0 }, data: { avatar: 'https://example.invalid/ada.png' } }
  ],
  edges: []
};

const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const Elements: Story = {
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
