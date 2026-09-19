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
 * **`FreeformStructure` — the anatomy of the card box.** A free-form structure
 * is the JSON the visual card designer emits: a self-contained composite card
 * whose elements are placed at **absolute coordinates**. `GraphLayer` compiles
 * it (`compileFreeform`) into the engine's `composite` shape, so nothing here
 * is a new engine kind — it's a template that a `composite` renders.
 *
 * This story is about the **structure-level fields**, the five that describe the
 * box itself before a single element is placed:
 *
 * | Field | What it does |
 * |---|---|
 * | `width` / `height` | the card box; also what a layout packs against |
 * | `cornerRadius` | the default rounded-rect silhouette (see `Frames` for the rest) |
 * | `bgRole` / `bg` | body fill — the themed half wins the pair |
 * | `strokeRole` / `stroke` + `strokeWidth` | the card border; **omit the colour and there is no border** |
 * | `elements[]` | the element list, in **z-order** (later = on top) |
 *
 * Two coordinate facts the fourth card draws out, because both cost an hour the
 * first time:
 *
 * 1. **`x` / `y` are the card's top-left**, not its centre — `(0, 0)` is the
 *    corner, `x` grows right and `y` grows down.
 * 2. **A `text` element's `y` is not where the text lands.** `compileFreeform`
 *    emits the label part at `el.y + fontSize`
 *    (`file:packages/graph/src/template/compile.ts#L441`) and the renderer
 *    treats that as the block's **top**
 *    (`file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L303`).
 *    So a 13px title whose rendered top must land at 18 is authored as `y: 5`.
 *    Every text element below is written that way.
 *
 * **A full-bleed strip needs square corners.** `compileFreeform` never sets the
 * composite's `clip` flag, so a `rect` that runs edge to edge pokes out of a
 * rounded corner. The second card takes `cornerRadius: 0` for exactly that
 * reason — the same call `designs/SchemaER` makes. Inset the strip (or square
 * the card) rather than reaching for a clip that the template can't express.
 *
 * Themed by role, so the whole page follows the Storybook theme toolbar; see
 * the `Theming` sibling for the role/literal pair in detail.
 */
const meta: Meta = { title: 'graph/Nodes/Types/FreeformStructure/Anatomy' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, top to bottom ─────────────────────────────
// Nothing below is computed: no helpers, no factories, no spread. The whole
// registry survives `JSON.stringify` and comes back identical, which is what
// makes it the designer's output format rather than a builder API.
const STRUCTURES: NodeStructureRegistry = {
  /** The default silhouette: a rounded rect with a themed body + border. */
  box: {
    name: 'box',
    kind: 'freeform',
    width: 240,
    height: 132,
    cornerRadius: 16,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1.5,
    elements: [
      // Rendered top 18 = y 5 + fontSize 13.
      { id: 'title', type: 'text', x: 16, y: 5, bind: 'data.title', fontSize: 13, fontWeight: 600, colorRole: 'heading' },
      { id: 'rule', type: 'line', x: 16, y: 42, x2: 224, y2: 42, colorRole: 'divider' },
      { id: 'w', type: 'text', x: 16, y: 41, text: 'width: 240', fontSize: 11, colorRole: 'muted' },
      { id: 'h', type: 'text', x: 16, y: 59, text: 'height: 132', fontSize: 11, colorRole: 'muted' },
      { id: 'r', type: 'text', x: 16, y: 77, text: 'cornerRadius: 16', fontSize: 11, colorRole: 'muted' },
      { id: 's', type: 'text', x: 16, y: 95, text: "strokeRole: 'stroke'", fontSize: 11, colorRole: 'muted' }
    ]
  },

  /**
   * Square corners, a heavier accent border, and the full-bleed header strip
   * that only square corners make safe (no `clip` in the compiled shape).
   */
  square: {
    name: 'square',
    kind: 'freeform',
    width: 240,
    height: 132,
    cornerRadius: 0,
    bgRole: 'cardBg',
    strokeRole: 'accent',
    strokeWidth: 3,
    elements: [
      // Edge to edge: safe here, and only here.
      { id: 'strip', type: 'rect', x: 0, y: 0, width: 240, height: 28, fillRole: 'accent', fillAlpha: 0.16 },
      { id: 'title', type: 'text', x: 16, y: -4, bind: 'data.title', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
      { id: 'r', type: 'text', x: 16, y: 33, text: 'cornerRadius: 0', fontSize: 11, colorRole: 'muted' },
      { id: 's', type: 'text', x: 16, y: 51, text: "strokeRole: 'accent'", fontSize: 11, colorRole: 'muted' },
      { id: 'w', type: 'text', x: 16, y: 69, text: 'strokeWidth: 3', fontSize: 11, colorRole: 'muted' },
      { id: 'note', type: 'text', x: 16, y: 88, text: 'full-bleed strip needs this', fontSize: 10, colorRole: 'muted' },
      { id: 'note2', type: 'text', x: 16, y: 104, text: '(the compiler sets no clip)', fontSize: 10, colorRole: 'muted' }
    ]
  },

  /**
   * `cornerRadius` = half the height is a pill; **no `strokeRole` / `stroke` at
   * all** is a borderless card (the default — a border is opt-in).
   */
  pill: {
    name: 'pill',
    kind: 'freeform',
    width: 240,
    height: 72,
    cornerRadius: 36,
    bgRole: 'cardBg',
    elements: [
      { id: 'chip', type: 'circle', x: 14, y: 20, radius: 16, fillRole: 'accent', fillAlpha: 0.28 },
      { id: 'title', type: 'text', x: 62, y: 9, bind: 'data.title', fontSize: 13, fontWeight: 600, colorRole: 'heading' },
      { id: 'sub', type: 'text', x: 62, y: 29.5, text: 'cornerRadius: 36 · no stroke', fontSize: 10.5, colorRole: 'muted' }
    ]
  },

  /**
   * The coordinate system, drawn. The dot sits **on** `(0, 0)` — a `circle`'s
   * authored `x`/`y` is the top-left of its bounding box, so a radius-4 dot
   * centred on the corner is authored at `-4, -4`.
   */
  origin: {
    name: 'origin',
    kind: 'freeform',
    width: 240,
    height: 132,
    cornerRadius: 8,
    bgRole: 'cardBg',
    strokeRole: 'stroke',
    strokeWidth: 1,
    elements: [
      { id: 'x-axis', type: 'line', x: 0, y: 0, x2: 64, y2: 0, colorRole: 'accent', strokeWidth: 3 },
      { id: 'y-axis', type: 'line', x: 0, y: 0, x2: 0, y2: 48, colorRole: 'accent', strokeWidth: 3 },
      { id: 'dot', type: 'circle', x: -4, y: -4, radius: 4, fillRole: 'accent' },
      { id: 'zero', type: 'text', x: 14, y: 0, text: '(0, 0) = card top-left', fontSize: 10, colorRole: 'heading' },
      { id: 'axes', type: 'text', x: 14, y: 43.5, text: 'x → right · y ↓ down', fontSize: 10.5, colorRole: 'muted' },
      { id: 'text1', type: 'text', x: 14, y: 61.5, text: 'a text element renders at', fontSize: 10.5, colorRole: 'muted' },
      { id: 'text2', type: 'text', x: 14, y: 79.5, text: 'y + fontSize (its top)', fontSize: 10.5, colorRole: 'foreground' },
      { id: 'text3', type: 'text', x: 14, y: 97.5, text: 'so top 18 @ 13px → y: 5', fontSize: 10.5, colorRole: 'muted' }
    ]
  }
};

// A node type names its structure. `styling` / `bindings` stay empty: a
// free-form structure is self-contained — every element carries its own colour
// role and its own data path, so there is no second template to write.
const TYPES: NodeTypeRegistry = {
  box: { structure: 'box', styling: '', bindings: {} },
  square: { structure: 'square', styling: '', bindings: {} },
  pill: { structure: 'pill', styling: '', bindings: {} },
  origin: { structure: 'origin', styling: '', bindings: {} }
};

// Explicit positions, no layout — the cards are a reference row, not a graph.
const DATA: GraphData = {
  nodes: [
    { id: 'box', type: 'box', position: { x: -430, y: 0 }, data: { title: 'the box' } },
    { id: 'square', type: 'square', position: { x: -145, y: 0 }, data: { title: 'square + strip' } },
    { id: 'pill', type: 'pill', position: { x: 145, y: 0 }, data: { title: 'pill, no border' } },
    { id: 'origin', type: 'origin', position: { x: 430, y: 0 }, data: { title: 'origin' } }
  ],
  edges: []
};

// Each card draws its own words; the node-level label would double them up.
const NODE: GraphLayerProps['node'] = { style: { labelText: '' } };

const CONFIG: CanvasConfig = { fitOnLoad: true };

export const Anatomy: Story = {
  render: () => (
    // The host <div> sizes the engine's render surface — structural, and exempt
    // from the no-inline-CSS rule (root rule 13).
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        {/* The sole publisher of `theme:change` — without it the roles above
            have no palette to resolve against. */}
        <ThemeBehaviour id="theme" mode="document" />
        {/* Carries the toolbar's family *and* mode into the canvas. */}
        <CanvasThemeSync />
        <GraphLayer id="graph" data={DATA} node={NODE} nodeStructureTemplates={STRUCTURES} nodeTypes={TYPES} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        {/* 10–13px composite labels: re-rasterise them in tiers as the camera
            comes in so the annotations stay crisp. */}
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
      </GraphCanvas>
    </div>
  )
};
