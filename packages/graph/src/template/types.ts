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

import type { ShapeLabelPlacement } from '@invana/canvas/specs';
import type { ColorRole } from '../theme/types';
import type { NodeShapeOptions } from '../layer/types';

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
      /** Literal fallback when `bind` is empty / unresolved. */
      text?: string;
      fontSize?: number;
      fontWeight?: number | string;
      fontStyle?: 'normal' | 'italic';
      uppercase?: boolean;
      colorRole?: ColorRole;
      color?: number;
      /** Wrap/ellipsis width; omitted = single unbounded line. */
      maxWidth?: number;
      maxLines?: number;
      anchor?: 'left' | 'center' | 'right';
    })
  | (CardElementCommon & {
      type: 'rect';
      width: number;
      height: number;
      cornerRadius?: number;
      fillRole?: ColorRole;
      fill?: number;
    })
  | (CardElementCommon & { type: 'circle'; radius: number; fillRole?: ColorRole; fill?: number })
  | (CardElementCommon & {
      type: 'line';
      x2: number;
      y2: number;
      colorRole?: ColorRole;
      color?: number;
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
  label?: LabelStyling;
  // card:
  bgRole?: ColorRole;
  bg?: number;
  accentRole?: ColorRole;
  accent?: number;
  /** Per-slot styling, keyed by slot name (e.g. `title`, `subtitle`, `divider`). */
  slots?: Record<string, SlotStyling>;
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
