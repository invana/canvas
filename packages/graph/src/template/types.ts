/**
 * Node **structure** + **styling** templates — the two reusable layers above a
 * node's data that, together with the active {@link Theme}, decide how a node of
 * a given *type* looks.
 *
 * - **Structure** (`NodeStructureTemplate`) — the skeleton: a simple shape +
 *   label, or a composite *card* with rows/slots. **No colours.**
 * - **Styling** (`NodeStylingTemplate`) — which {@link ColorRole} each slot/label
 *   uses + typography. **No hex** (roles resolve to numbers against the theme;
 *   direct colours are an escape hatch via the paired non-`Role` fields).
 * - **Binding** (`NodeTypeBinding`) — ties a node *type* to a structure + styling
 *   and maps each slot to a dotted data path.
 *
 * The {@link GraphLayer} resolves these to a concrete `NodeStyle` (simple) or a
 * composite shape (card) — with every role already substituted for a number —
 * before anything reaches the renderer.
 */

import type { ShapeLabelPlacement } from '@invana/canvas';
import type { ColorRole } from '../theme/types';
import type { GroupOptions, NodeBadge, NodeShapeOptions } from '../layer/types';

/**
 * Authoring descriptor for a composite card's background silhouette, sized to
 * fill the card's `width × height` box. This is the *template* concept; the
 * compiler maps it to a concrete engine root shape ({@link CompositeRootSpec})
 * — `rect` → rounded rect, `ellipse` → sampled polygon, `regular-polygon` →
 * n-gon, `polygon` → the given normalised points. Omit for a rounded rectangle.
 */
export type CompositeFrame =
  | { readonly kind: 'rect'; readonly cornerRadius?: number }
  | { readonly kind: 'ellipse' }
  | { readonly kind: 'regular-polygon'; readonly sides: number; readonly rotation?: number }
  | { readonly kind: 'polygon'; readonly points: readonly { readonly x: number; readonly y: number }[] };

// ─── Value lookups — the one way a template reads a second field ──────────────

/**
 * A colour in a template: a literal `0xRRGGBB`, or a {@link ColorRole} name
 * resolved against the live palette. The two are distinguishable at runtime by
 * `typeof`, which is what lets a value→colour map hold either.
 */
export type TemplateColor = number | ColorRole;

/**
 * One band of a {@link ValueLookup.bands} scale: a half-open numeric interval
 * mapped to a value.
 *
 * A band matches when the bound value is `>= from` (when given) **and** `< to`
 * (when given); a band with neither bound is the catch-all. Bands are scanned
 * in declaration order and the **first match wins**, so the common shape is
 * descending thresholds ending in a catch-all — the data form of
 * `v >= 80 ? green : v >= 60 ? amber : red`.
 */
export interface ValueBand<T> {
  /** Inclusive lower bound. Omit for "no lower bound". */
  readonly from?: number;
  /** Exclusive upper bound. Omit for "no upper bound". */
  readonly to?: number;
  /** What this band resolves to. */
  readonly value: T;
}

/**
 * **A second data field, mapped to a presentation value.** The one construct a
 * template uses to say "this depends on the record" — shared by badge fills,
 * node size, card element colours and a card's border, so there is exactly one
 * thing to learn and one thing to edit.
 *
 * A node's *look* is otherwise selected by `node.type` alone (via
 * {@link NodeTypeBinding}), and colour by a dotted path (via
 * `ColorByBehaviour.nodeValueKey`). This is the same addressing — a
 * root-relative dot path — made available wherever a template needs it, which
 * is what turns a resolver into data.
 *
 * Resolution order: {@link map} (categorical, keyed by the value stringified),
 * then {@link bands} (numeric), then {@link fallback}. Nothing matching yields
 * `undefined`, and the caller keeps whatever it had.
 *
 * @example
 * // "size by complexity" — categorical
 * { bind: 'data.complexity', map: { simple: 4, moderate: 5.5, complex: 8 } }
 * @example
 * // "colour by coverage" — numeric, first match wins
 * { bind: 'data.coverage', bands: [{ from: 80, value: 0x16a34a }, { value: 0xdc2626 }] }
 */
export interface ValueLookup<T> {
  /**
   * Dotted path to the driving field, rooted at the node (`'data.complexity'`,
   * `'type'`). Inside a {@link NodeBadgeTemplate} it may be omitted to reuse
   * that badge's own {@link NodeBadgeTemplate.bind}.
   */
  readonly bind?: string;
  /** Categorical map, keyed by the bound value stringified. Consulted first. */
  readonly map?: Readonly<Record<string, T>>;
  /** Numeric bands; first match wins. See {@link ValueBand}. */
  readonly bands?: readonly ValueBand<T>[];
  /** Used when neither {@link map} nor {@link bands} matched. */
  readonly fallback?: T;
}

// ─── Structure ──────────────────────────────────────────────────────────────

/**
 * A reusable node skeleton:
 * - {@link SimpleStructure} — one shape + a label (lean path).
 * - {@link CardStructure} — a composite card auto-laid-out as rows of slots.
 * - {@link FreeformStructure} — a composite card whose elements are placed at
 *   absolute coordinates (what the visual **card designer** produces). It's
 *   self-contained: each element carries its own data binding + colour role, so
 *   it needs no separate styling/binding template.
 */
export type NodeStructureTemplate = SimpleStructure | CardStructure | FreeformStructure;

/** Simple structure: one shape with a single label slot (the lean render path). */
export interface SimpleStructure {
  name: string;
  kind: 'simple';
  /** The node's shape (circle / rect / arc / regular-polygon / star / polygon). */
  shape: NodeShapeOptions;
  /** Declared slots. `label` is always present; icon/badge reserved for later. */
  slots?: { label?: boolean; icon?: boolean; badge?: boolean };
}

/** Composite card structure: a fixed-size body laid out as rows of slots. */
export interface CardStructure {
  name: string;
  kind: 'card';
  /** Fixed card width in world units. Overflow text ellipsizes. */
  width: number;
  /** Fixed card height in world units. */
  height: number;
  /** Inner padding (default 14). */
  padding?: number;
  /**
   * Background silhouette filling the card box. Omit for a rounded rectangle;
   * set a circle/ellipse, polygon, etc. to make the card that shape (fill,
   * border and every state decoration follow it).
   */
  frame?: CompositeFrame;
  /** Ordered rows, laid out top → bottom. */
  rows: CardRow[];
}

/** One row of a {@link CardStructure}: either content slots or a divider line. */
export interface CardRow {
  /** Left → right cells. Omit for a pure divider row. */
  slots?: CardSlot[];
  /** Render a hairline divider for this row (uses the `divider` slot styling). */
  divider?: boolean;
}

/** A cell within a {@link CardRow}. */
export type CardSlot =
  | { slot: string; kind: 'tag' | 'text' }
  | { slot: string; kind: 'image'; shape?: 'circle' | 'rounded'; size?: number }
  | { stack: CardSlot[] };

// ─── Free-form structure (the card designer's output) ───────────────────────

/** Fields shared by every {@link CardElement}: identity, position, visibility. */
export interface CardElementCommon {
  id: string;
  /** Top-left X relative to the card (1:1 with the designer canvas). */
  x: number;
  /** Top-left Y relative to the card. */
  y: number;
  /** Optional human label shown in the designer's layers list. */
  label?: string;
  /** Hidden elements are kept in the template but not drawn (layers eye-toggle). */
  hidden?: boolean;
  /**
   * Promotes this element to an addressable **sub-part**: the renderer reports
   * the topmost `hitId` under the pointer and turns it into `shape:partover` /
   * `shape:partout`, so a consumer can hover, right-click or anchor against a
   * *row* rather than the whole card. Honoured on `rect` / `circle` elements
   * (the engine's `CompositePart` carries it on those kinds); ignored on the
   * rest. A transparent full-width `rect` with a `hitId` is the idiomatic way
   * to make a whole row hoverable.
   */
  hitId?: string;

  /**
   * Draw this element only when this dotted path resolves to a **non-nullish**
   * value. `0` and `''` are values, not absences.
   *
   * The card equivalent of a badge's presence rule, and the thing that lets an
   * interpolated string stay honest: a footer reading
   * `'L{data.lineRange.0}–{data.lineRange.1}'` must not render `L–` for the 253
   * records of `invanaCodeKg` that carry no line range. A resolver said this
   * with `p.lineRange ? … : ''`; this says it as data.
   */
  requires?: string;
}

/**
 * One absolutely-positioned element of a {@link FreeformStructure}. Colours are
 * a **pair** — a `*Role` (themed) or a direct numeric field (fixed). `text`
 * elements bind their content to a dotted data path via `bind` (falling back to
 * the literal `text`). Order in `elements[]` is the **z-order** (later = on top).
 */
export type CardElement =
  | (CardElementCommon & {
      type: 'text';
      /** Dotted data path bound to this text (e.g. `data.name`). */
      bind?: string;
      /**
       * Literal text, **or a template** over the record: `{}` stands for the
       * {@link bind} value and `{dotted.path}` for any field, so
       * `'L{data.lineRange.0}–{data.lineRange.1}'` reads `L123–187`. Used
       * whenever it is set; `bind` alone renders the bound value verbatim.
       *
       * Pair a template with {@link CardElementCommon.requires} so the element
       * disappears rather than rendering its punctuation around nothing.
       */
      text?: string;
      fontSize?: number;
      fontWeight?: number | string;
      fontStyle?: 'normal' | 'italic';
      /** Small-caps rendering — an entity-kind tag, a column flag. Distinct
       * from {@link uppercase}, which rewrites the string itself. */
      fontVariant?: 'normal' | 'small-caps';
      uppercase?: boolean;
      colorRole?: ColorRole;
      color?: number;
      /** Text colour read off the record; wins over the pair above. */
      colorLookup?: ValueLookup<TemplateColor>;
      /** Wrap/ellipsis width; omitted = single unbounded line. */
      maxWidth?: number;
      maxLines?: number;
      /** Line box height for wrapped text — a 2-line summary that must not
       * collide with the row under it. */
      lineHeight?: number;
      /** Which point of the text box sits at `x`. */
      anchor?: 'left' | 'center' | 'right';
      /** Horizontal alignment *within* a wrapped block. Independent of
       * {@link anchor}, which places the block. */
      align?: 'left' | 'center' | 'right';
    })
  | (CardElementCommon & {
      type: 'rect';
      width: number;
      height: number;
      cornerRadius?: number;
      fillRole?: ColorRole;
      fill?: number;
      /** Fill read off the record; wins over the pair above. An accent bar
       * whose colour follows the node's cluster. */
      fillLookup?: ValueLookup<TemplateColor>;
      /** Fill opacity (0–1). A tint of a themed fill — zebra rows, header strips. */
      fillAlpha?: number;
      /** Outline colour pair — an outlined glyph (a hollow key square, a chip). */
      strokeRole?: ColorRole;
      stroke?: number;
      strokeWidth?: number;
    })
  | (CardElementCommon & {
      type: 'circle';
      radius: number;
      fillRole?: ColorRole;
      fill?: number;
      /** Fill read off the record; wins over the pair above. */
      fillLookup?: ValueLookup<TemplateColor>;
      /** Fill opacity (0–1). */
      fillAlpha?: number;
      /** Outline colour pair. */
      strokeRole?: ColorRole;
      stroke?: number;
      strokeWidth?: number;
    })
  | (CardElementCommon & {
      type: 'line';
      x2: number;
      y2: number;
      colorRole?: ColorRole;
      color?: number;
      /** Colour read off the record; wins over the pair above. */
      colorLookup?: ValueLookup<TemplateColor>;
      strokeWidth?: number;
    })
  | (CardElementCommon & {
      type: 'image';
      size: number;
      shape?: 'circle' | 'rounded';
      /** Dotted data path for the image source (rendered as a placeholder today). */
      bind?: string;
    });

/**
 * A self-contained composite card placed by absolute coordinates — the JSON the
 * visual card designer emits. Carries its own background, element list, data
 * bindings and colour roles, so a node type only needs to reference it by name
 * (no separate styling/binding template). Compiles straight to the engine's
 * `composite` shape; themed because every colour is a {@link ColorRole}.
 */
export interface FreeformStructure {
  name: string;
  kind: 'freeform';
  width: number;
  height: number;
  cornerRadius?: number;
  /**
   * Background silhouette filling the card box. Omit for a rounded rectangle
   * (using {@link cornerRadius}); set a circle/ellipse, polygon, etc. to make
   * the card that shape — fill, border and decorations follow it.
   */
  frame?: CompositeFrame;
  bgRole?: ColorRole;
  bg?: number;
  strokeRole?: ColorRole;
  stroke?: number;
  /**
   * Border colour read off the record; wins over the pair above.
   *
   * On the **structure** rather than on an element because the silhouette is
   * the card's own outline — a card accented by cluster traces that colour
   * round the whole frame, not just the bar inside it. (There is deliberately
   * no `bgLookup` yet: no caller needs a per-record card *fill*, and an unused
   * door is a door to maintain.)
   */
  strokeLookup?: ValueLookup<TemplateColor>;
  strokeWidth?: number;
  elements: CardElement[];
}

// ─── Styling ──────────────────────────────────────────────────────────────────

/**
 * Per-type styling: roles + typography. Every colour is a **pair** — a `*Role`
 * field (themed, resolved from the active palette) **or** a direct numeric field
 * (fixed literal). `*Role` wins when both are set.
 */
export interface NodeStylingTemplate {
  name: string;
  // simple:
  fillRole?: ColorRole;
  fill?: number;
  /**
   * Border colour — applies to **both** structure kinds: it becomes the shape's
   * `bgStrokeColor` on a `simple` structure, and the composite silhouette's own
   * stroke on a `card` (so it traces a custom `frame` too). Defaults to no
   * border when unset; {@link strokeWidth} defaults to `1` on a card and `1.5`
   * on a simple shape.
   */
  strokeRole?: ColorRole;
  stroke?: number;
  strokeWidth?: number;

  /**
   * Opacity of the **fill only**, `0`–`1`. Default opaque.
   *
   * Deliberately not the shape's overall opacity: `NodeStyle.bgAlpha` fades the
   * border with the fill, so a hairline under a low `bgAlpha` all but vanishes.
   * This compiles onto the fill layer (`{ kind: 'solid', color, alpha }`) and
   * leaves {@link strokeAlpha} to say what the outline does.
   *
   * The use that motivates it is a **theme-agnostic tint**: a neutral at low
   * alpha composites against whatever backdrop is behind it, so one value reads
   * correctly in light *and* dark, where a literal picked for one is wrong in
   * the other.
   *
   * **Scope: `simple` structures.** A `card` paints its fill through the
   * composite root rather than `bgFill`, and takes no alpha yet.
   */
  fillAlpha?: number;

  /**
   * Opacity of the border only, `0`–`1`. Default opaque. Sibling of
   * {@link fillAlpha}, and `simple`-structure-scoped for the same reason.
   */
  strokeAlpha?: number;

  label?: LabelStyling;
  // card:
  bgRole?: ColorRole;
  bg?: number;
  accentRole?: ColorRole;
  accent?: number;
  /** Per-slot styling, keyed by slot name (e.g. `title`, `subtitle`, `divider`). */
  slots?: Record<string, SlotStyling>;

  /**
   * Render nodes of this type as a **compound group frame** — a container drawn
   * behind the descendants that point at it via `parentId`. See
   * {@link GroupOptions} for the full contract (auto-fit, header band, collapse
   * semantics).
   *
   * Why this lives on *styling* rather than on the structure or the binding: the
   * data says which nodes are children of which (`parentId` is hierarchy, and a
   * tree has it whether or not anything is drawn round it). Whether that
   * hierarchy *renders as a frame* is a presentation decision — the same call as
   * fill and stroke, and one a second styling template can answer differently
   * for the same skeleton.
   *
   * Declaring it here is what keeps a group out of `node.style` resolvers: it is
   * a per-type constant, so it belongs in the per-type template, and a config
   * that uses it stays serialisable. Equivalent to
   * `node: { style: { group: (n) => n.type === 'x' ? {…} : undefined } }`,
   * without the callback.
   *
   * Presence is the discriminator, exactly as on `NodeStyle.group` — an empty
   * object still makes the node a frame.
   */
  group?: GroupOptions;

  /**
   * Badges drawn on every node of this type, each one **bound to a field** of
   * the record rather than decided in advance.
   *
   * This is the declarative form of a `node: { style: { badges: (n) => … } }`
   * resolver. {@link NodeStyle.badges} is a list of already-decided badges, so
   * a health pill whose text, colour and very existence depend on the record
   * could only be written as a callback — and a callback cannot be saved,
   * diffed or edited in the settings panel. A {@link NodeBadgeTemplate} says
   * the same three things as data: {@link NodeBadgeTemplate.bind} names the
   * field, {@link NodeBadgeTemplate.fillLookup} maps its value to a colour, and
   * a badge whose bound field is absent is simply not drawn.
   *
   * Badges **concatenate** rather than override: the layer template's badges,
   * these, per-node `style.badges` and each active state's overlay all
   * contribute, deduped by `id` with later precedence winning (see
   * `GraphLayer.resolveNodeBadges`). Give every template an `id` when a state
   * overlay needs to replace one.
   */
  badges?: readonly NodeBadgeTemplate[];

  /**
   * The node's size, as a flat number or **read off a second field**.
   *
   * Compiles to {@link NodeStyle.size}, which `GraphLayer` applies *after* the
   * whole template has been resolved and normalises onto whatever shape
   * survived (`circle` → `radius`, `rect` → a square side, `arc` / `star` →
   * outer radius with the inner one scaled). That ordering is the point: a type
   * binding necessarily carries a **structure**, and a structure carries the
   * shape — so a size declared here *composes with* the skeleton instead of
   * fighting it, and a second field (`data.complexity`) can drive the radius
   * while `node.type` still picks the look and the label binding.
   *
   * Without it, "big dot for a complex module" is only sayable as a
   * `shape: (n) => …` resolver — and because a binding's structure would
   * overwrite that shape, the *label* could not be bound either. One field
   * frees both.
   */
  size?: number | ValueLookup<number>;
}

/**
 * A {@link NodeBadge} whose text, colour and presence are **read off the
 * record** instead of being fixed at authoring time.
 *
 * Everything a `NodeBadge` carries — `placement`, `origin`, `shape`, `icon`,
 * `offsetX`/`offsetY`, `decorations`, `effects`, … — is inherited unchanged.
 * What this adds is the binding: `bind` names the field, `when*` decides
 * whether the badge exists at all for a given record, `labelText` interpolates
 * the value into a string, and the colour fields gain the `*Role` pair + the
 * two value→colour maps.
 *
 * `GraphLayer` compiles one of these per node against the live palette, so a
 * template survives a save, a theme switch and a round trip through
 * `CanvasSettingsEditorPanel`.
 */
export interface NodeBadgeTemplate
  extends Omit<NodeBadge, 'fill' | 'labelText' | 'labelColor' | 'strokeColor'> {
  /**
   * Dotted path to the field that drives this badge, rooted at the node
   * (`'data.coverage'`, `'type'`). Omit for a **static** badge that every node
   * of the type gets.
   *
   * Presence is the default rule: when `bind` is set and the path resolves to
   * `undefined` / `null`, the badge is **not drawn**. `0` and `''` are values,
   * not absences. It is the same rule {@link CardElementCommon.requires} applies
   * to a card element.
   */
  readonly bind?: string;

  /** Draw only when the bound value is strictly greater than this. */
  readonly whenGreaterThan?: number;
  /** Draw only when the bound value is strictly less than this. */
  readonly whenLessThan?: number;
  /** Draw only when the bound value is exactly this. */
  readonly whenEquals?: string | number | boolean;

  /**
   * Label text, with `{}` standing for the bound value and `{dotted.path}` for
   * any other field of the record — `'{}%'` on a `data.coverage` binding reads
   * `87%`. Omit to render the bound value verbatim; a badge with no `bind` and
   * no `labelText` is a plain plate.
   */
  readonly labelText?: string;

  /** Themed plate colour (wins over {@link fill}). */
  readonly fillRole?: ColorRole;
  /** Literal plate colour, and the fallback when {@link fillLookup} matches
   * nothing. */
  readonly fill?: number;
  /**
   * Plate colour read off the record — a {@link ValueLookup} over colours, so a
   * coverage pill can band its number to green/amber/red and a status chip can
   * map a string to a colour. Its `bind` defaults to this badge's own
   * {@link bind}, so the common case names the field once.
   */
  readonly fillLookup?: ValueLookup<TemplateColor>;

  /** Themed border colour (wins over {@link strokeColor}). */
  readonly strokeColorRole?: ColorRole;
  /** Literal border colour. */
  readonly strokeColor?: number;
  /** Themed label colour (wins over {@link labelColor}). */
  readonly labelColorRole?: ColorRole;
  /** Literal label colour. */
  readonly labelColor?: number;
}

/** Styling for one card slot. */
export interface SlotStyling {
  colorRole?: ColorRole;
  color?: number;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  /** Render the text in UPPERCASE (e.g. a type tag). */
  uppercase?: boolean;
}

/** Styling for a simple structure's label (maps onto the `NodeStyle` label* fields). */
export interface LabelStyling {
  colorRole?: ColorRole;
  color?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  placement?: ShapeLabelPlacement;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  align?: 'left' | 'center' | 'right';
  background?: boolean;
  backgroundColorRole?: ColorRole;
  backgroundColor?: number;
}

// ─── Per-type binding ──────────────────────────────────────────────────────────

/** Ties a node *type* to a structure + styling + slot→data bindings. */
export interface NodeTypeBinding {
  /** Name of the {@link NodeStructureTemplate} to use. */
  structure: string;
  /** Name of the {@link NodeStylingTemplate} to use. */
  styling: string;
  /** Slot name → dotted data path (`'data.name'`, `'type'`). */
  bindings: Record<string, string>;
  /** Optional host-provided field schema for editor pickers. */
  fields?: { key: string; label: string }[];
}

/** Registries keyed by template name. */
export type NodeStructureRegistry = Record<string, NodeStructureTemplate>;
export type NodeStylingRegistry = Record<string, NodeStylingTemplate>;
export type NodeTypeRegistry = Record<string, NodeTypeBinding>;
