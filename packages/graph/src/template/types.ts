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
import type { NodeShapeOptions } from '../layer/types';

// ─── Structure ──────────────────────────────────────────────────────────────

/** A reusable node skeleton — either a simple shape+label or a composite card. */
export type NodeStructureTemplate = SimpleStructure | CardStructure;

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
