/**
 * Compile a {@link NodeStructureTemplate} + {@link NodeStylingTemplate} +
 * bindings + a node's data + the active palette into a concrete `NodeStyle`
 * fragment the {@link GraphLayer} merges into the node's resolved style.
 *
 * - **simple** → label text/colour/typography + shape + fill/stroke fields.
 * - **card** → a `composite` shape (`CompositeShapeOption`) with parts laid out
 *   by a small auto-layout pass, plus `bgStrokeWidth: 0` so the layer's base
 *   node border doesn't double up on the card frame.
 *
 * Every colour role is resolved to a number here (or falls back to a direct
 * colour, then to a neutral) — nothing role-shaped escapes to the renderer.
 */

import type { CompositePart, CompositeRootSpec } from '@invana/canvas';

import type { ColorRole } from '../theme/types';
import type { RolePalette } from '../theme/roles';
import type { GraphNode } from '../store/types';
import type { CompositeShapeOption, NodeStyle } from '../layer/types';
import { resolveText } from './bindings';
import type {
  CardElement,
  CardSlot,
  CardStructure,
  CompositeFrame,
  FreeformStructure,
  NodeStylingTemplate,
  SimpleStructure,
  SlotStyling,
} from './types';

/** Solid stroke payload for a composite root shape. */
type RootStroke = { color: number; width: number };

/**
 * Map an authoring {@link CompositeFrame} (+ the card box, corner radius, and
 * resolved fill/stroke) to a concrete engine {@link CompositeRootSpec}. The
 * engine composite borrows a real shape for its silhouette, so there's no
 * geometry to duplicate here — only the box-fit policy:
 *   - `rect`            → rounded rectangle filling the box
 *   - `ellipse`         → ellipse inscribed in the box
 *   - `regular-polygon` → n-gon centred in the box (circum-radius = min/2)
 *   - `polygon`         → the normalised points mapped to centre-relative coords
 */
function frameToRoot(
  frame: CompositeFrame,
  width: number,
  height: number,
  cornerRadius: number,
  fill: number,
  stroke: RootStroke | undefined,
): CompositeRootSpec {
  const base = { x: 0, y: 0, fill, ...(stroke ? { stroke } : {}) };
  switch (frame.kind) {
    case 'rect':
      return { kind: 'rect', ...base, width, height, cornerRadius };
    case 'ellipse':
      return { kind: 'ellipse', ...base, radiusX: width / 2, radiusY: height / 2 };
    case 'regular-polygon':
      return {
        kind: 'regular-polygon',
        ...base,
        radius: Math.min(width, height) / 2,
        sides: frame.sides,
        ...(frame.rotation !== undefined ? { rotation: frame.rotation } : {}),
      };
    case 'polygon':
      return {
        kind: 'polygon',
        ...base,
        // Normalised [0,1] box points → centre-relative (PolygonSpec convention).
        vertices: frame.points.map((p) => ({ x: (p.x - 0.5) * width, y: (p.y - 0.5) * height })),
      };
  }
}

/** Resolve a colour pair (role wins, else direct, else `undefined`). */
function color(
  role: ColorRole | undefined,
  direct: number | undefined,
  palette: RolePalette,
): number | undefined {
  if (role !== undefined) {
    const v = palette[role];
    if (v !== undefined) return v;
  }
  return direct;
}

/** Compile a simple structure into label + shape + fill/stroke style fields. */
export function compileSimple(
  struct: SimpleStructure,
  styling: NodeStylingTemplate | undefined,
  bindings: Record<string, string>,
  node: GraphNode,
  palette: RolePalette,
): Partial<NodeStyle> {
  const out: Record<string, unknown> = { shape: struct.shape };

  const fill = color(styling?.fillRole, styling?.fill, palette);
  if (fill !== undefined) out.bgFill = fill;
  const stroke = color(styling?.strokeRole, styling?.stroke, palette);
  if (stroke !== undefined) {
    out.bgStrokeColor = stroke;
    out.bgStrokeWidth = styling?.strokeWidth ?? 1.5;
  } else if (styling?.strokeWidth !== undefined) {
    out.bgStrokeWidth = styling.strokeWidth;
  }

  // Label
  const labelPath = bindings.label;
  if (labelPath) out.labelText = resolveText(node, labelPath);
  const lbl = styling?.label;
  if (lbl) {
    const lc = color(lbl.colorRole, lbl.color, palette);
    if (lc !== undefined) out.labelColor = lc;
    if (lbl.fontSize !== undefined) out.labelFontSize = lbl.fontSize;
    if (lbl.fontFamily !== undefined) out.labelFontFamily = lbl.fontFamily;
    if (lbl.fontWeight !== undefined) out.labelFontWeight = lbl.fontWeight;
    if (lbl.fontStyle !== undefined) out.labelFontStyle = lbl.fontStyle;
    if (lbl.placement !== undefined) out.labelPlacement = lbl.placement;
    if (lbl.offsetX !== undefined) out.labelOffsetX = lbl.offsetX;
    if (lbl.offsetY !== undefined) out.labelOffsetY = lbl.offsetY;
    if (lbl.rotation !== undefined) out.labelRotation = lbl.rotation;
    if (lbl.align !== undefined) out.labelAlign = lbl.align;
    if (lbl.background) {
      const bg = color(lbl.backgroundColorRole, lbl.backgroundColor, palette);
      if (bg !== undefined) out.labelBackgroundFill = bg;
    }
  }
  return out as Partial<NodeStyle>;
}

// ─── Card auto-layout ──────────────────────────────────────────────────────────

const DEFAULT_PAD = 14;
const ROW_GAP = 8;
const STACK_GAP = 2;

/** Per-slot resolved text styling, defaulted. */
interface ResolvedSlotStyle {
  fill: number;
  fontSize: number;
  fontWeight: number | string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  uppercase: boolean;
}

function resolveSlotStyle(
  slotStyle: SlotStyling | undefined,
  palette: RolePalette,
  fallbackRole: ColorRole,
): ResolvedSlotStyle {
  return {
    fill: color(slotStyle?.colorRole, slotStyle?.color, palette) ?? palette[fallbackRole] ?? 0x111111,
    fontSize: slotStyle?.fontSize ?? 13,
    fontWeight: slotStyle?.fontWeight ?? 400,
    fontFamily: slotStyle?.fontFamily,
    fontStyle: slotStyle?.fontStyle,
    uppercase: slotStyle?.uppercase ?? false,
  };
}

/** Compile a card structure into a `composite` shape option with laid-out parts. */
export function compileCard(
  struct: CardStructure,
  styling: NodeStylingTemplate | undefined,
  bindings: Record<string, string>,
  node: GraphNode,
  palette: RolePalette,
): Partial<NodeStyle> {
  const { width, height } = struct;
  const pad = struct.padding ?? DEFAULT_PAD;
  const inner = width - pad * 2;
  const parts: CompositePart[] = [];

  const bg = color(styling?.bgRole, styling?.bg, palette) ?? palette.cardBg ?? 0xffffff;
  const accent = color(styling?.accentRole, styling?.accent, palette);
  const dividerColor =
    color(styling?.slots?.divider?.colorRole, styling?.slots?.divider?.color, palette) ??
    palette.divider ??
    0xe2e8f0;

  // Optional accent bar down the left edge when an accent colour is configured.
  if (accent !== undefined) {
    parts.push({ part: 'rect', x: 0, y: 0, width: 4, height, fill: accent });
  }

  let y = pad;
  for (const row of struct.rows) {
    if (row.divider) {
      parts.push({
        part: 'line',
        x: pad,
        y,
        x2: width - pad,
        y2: y,
        stroke: { color: dividerColor, width: 1 },
      });
      y += ROW_GAP;
      continue;
    }
    if (!row.slots || row.slots.length === 0) {
      y += ROW_GAP;
      continue;
    }
    y = layoutRow(row.slots, parts, { x: pad, y, inner, pad, width }, styling, bindings, node, palette);
    y += ROW_GAP;
  }

  const shape: CompositeShapeOption = {
    kind: 'composite',
    width,
    height,
    cornerRadius: 10,
    ...(struct.frame ? { root: frameToRoot(struct.frame, width, height, 10, bg, undefined) } : {}),
    fill: bg,
    parts,
  };
  // Express the card background as the node's `bgFill` too (not only the
  // composite's internal fill). Styling owns the card colour, so this asserts it
  // at the node level — overriding any layer-wide colour-by-category default,
  // exactly as `compileSimple` does for simple shapes. `bgStrokeWidth: 0` stops
  // the layer's base node border from framing the card.
  return { shape, bgFill: bg, bgStrokeWidth: 0 };
}

interface RowCursor {
  x: number;
  y: number;
  inner: number;
  pad: number;
  width: number;
}

/** Lay one row of cells left → right; returns the y cursor after the row. */
function layoutRow(
  slots: CardSlot[],
  parts: CompositePart[],
  cursor: RowCursor,
  styling: NodeStylingTemplate | undefined,
  bindings: Record<string, string>,
  node: GraphNode,
  palette: RolePalette,
): number {
  let x = cursor.x;
  let rowHeight = 0;

  for (const cell of slots) {
    if ('stack' in cell) {
      const remaining = cursor.width - cursor.pad - x;
      let sy = cursor.y;
      for (const sub of cell.stack) {
        if ('stack' in sub || sub.kind === 'image') continue; // stacks hold text/tag only
        const ss = resolveSlotStyle(styling?.slots?.[sub.slot], palette, 'foreground');
        const text = formatText(resolveText(node, bindings[sub.slot]), ss.uppercase);
        parts.push(label(text, x, sy + ss.fontSize, ss, remaining, 'left'));
        sy += ss.fontSize + STACK_GAP + 2;
      }
      rowHeight = Math.max(rowHeight, sy - cursor.y);
      x += remaining;
      continue;
    }
    if (cell.kind === 'image') {
      const size = cell.size ?? 40;
      const cx = x + size / 2;
      const cy = cursor.y + size / 2;
      // No photo support yet — render a coloured initials disc so the avatar
      // reads as a person (and stays legible on both light and dark cards),
      // rather than a near-invisible neutral placeholder.
      const discFill = palette.accent ?? palette.muted ?? 0xcbd5e1;
      if (cell.shape === 'rounded') {
        parts.push({ part: 'rect', x, y: cursor.y, width: size, height: size, cornerRadius: 8, fill: discFill });
      } else {
        parts.push({ part: 'circle', x: cx, y: cy, radius: size / 2, fill: discFill });
      }
      const initials = initialsOf(resolveText(node, bindings.title));
      if (initials) {
        const fontSize = Math.round(size * 0.4);
        parts.push({
          part: 'label',
          x: cx,
          y: cy - fontSize / 2,
          text: initials,
          anchor: 'center',
          fontSize,
          fontWeight: 700,
          fill: 0xffffff,
        });
      }
      x += size + 10;
      rowHeight = Math.max(rowHeight, size);
      continue;
    }
    // text | tag
    const ss = resolveSlotStyle(
      styling?.slots?.[cell.slot],
      palette,
      cell.kind === 'tag' ? 'muted' : 'heading',
    );
    const remaining = cursor.width - cursor.pad - x;
    const text = formatText(resolveText(node, bindings[cell.slot]), ss.uppercase);
    parts.push(label(text, x, cursor.y + ss.fontSize, ss, remaining, 'left'));
    x += remaining;
    rowHeight = Math.max(rowHeight, ss.fontSize + 2);
  }

  return cursor.y + (rowHeight || 14);
}

function formatText(text: string, uppercase: boolean): string {
  return uppercase ? text.toUpperCase() : text;
}

/** Initials for an avatar disc: first + last word's leading letter (e.g.
 * "Tim Berners-Lee" → "TL"), or the first two letters of a single word. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

/** Build a composite `label` part with single-line ellipsis clipping. */
function label(
  text: string,
  x: number,
  baselineY: number,
  ss: ResolvedSlotStyle,
  maxWidth: number,
  anchor: 'left' | 'center' | 'right',
): CompositePart {
  return {
    part: 'label',
    x,
    y: baselineY,
    text,
    anchor,
    fontSize: ss.fontSize,
    fontWeight: ss.fontWeight,
    ...(ss.fontStyle ? { fontStyle: ss.fontStyle } : {}),
    fill: ss.fill,
    maxWidth,
    maxLines: 1,
    overflow: 'ellipsis',
  };
}

// ─── Free-form structure (the card designer's output) ───────────────────────

/**
 * Compile a {@link FreeformStructure} into a `composite` shape. Element
 * coordinates are already absolute (the designer canvas is 1:1 with the card),
 * so this is a direct map: bind text to data, resolve every colour role against
 * the palette, and emit one {@link CompositePart} per element. Self-contained —
 * no styling/binding template needed.
 */
export function compileFreeform(
  struct: FreeformStructure,
  node: GraphNode,
  palette: RolePalette,
): Partial<NodeStyle> {
  const bg = color(struct.bgRole, struct.bg, palette) ?? palette.cardBg ?? 0xffffff;
  const strokeColor = color(struct.strokeRole, struct.stroke, palette);
  const parts: CompositePart[] = [];

  for (const el of struct.elements) {
    if (el.hidden) continue;
    parts.push(...elementToParts(el, node, palette));
  }

  const rootStroke: RootStroke | undefined =
    strokeColor !== undefined ? { color: strokeColor, width: struct.strokeWidth ?? 1 } : undefined;
  const shape: CompositeShapeOption = {
    kind: 'composite',
    width: struct.width,
    height: struct.height,
    cornerRadius: struct.cornerRadius ?? 10,
    ...(struct.frame
      ? { root: frameToRoot(struct.frame, struct.width, struct.height, struct.cornerRadius ?? 10, bg, rootStroke) }
      : {}),
    fill: bg,
    ...(rootStroke ? { stroke: rootStroke } : {}),
    parts,
  };
  // Assert the card background at the node level too — styling owns the colour
  // and wins over any layer-wide colour-by-category default (see `compileCard`).
  return { shape, bgFill: bg, bgStrokeWidth: 0 };
}

/** Map one {@link CardElement} to its composite part(s). */
function elementToParts(el: CardElement, node: GraphNode, palette: RolePalette): CompositePart[] {
  switch (el.type) {
    case 'text': {
      const raw = el.bind ? resolveText(node, el.bind) : (el.text ?? '');
      const text = el.uppercase ? raw.toUpperCase() : raw;
      const fill = color(el.colorRole, el.color, palette) ?? palette.foreground ?? 0x111111;
      const wrap =
        el.maxWidth !== undefined
          ? { maxWidth: el.maxWidth, maxLines: el.maxLines ?? 1, overflow: 'ellipsis' as const }
          : {};
      return [
        {
          part: 'label',
          x: el.x,
          y: el.y + (el.fontSize ?? 13),
          text,
          anchor: el.anchor ?? 'left',
          fontSize: el.fontSize ?? 13,
          fontWeight: el.fontWeight ?? 400,
          ...(el.fontStyle ? { fontStyle: el.fontStyle } : {}),
          fill,
          ...wrap,
        },
      ];
    }
    case 'rect': {
      const fill = color(el.fillRole, el.fill, palette);
      return [
        {
          part: 'rect',
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          ...(el.cornerRadius ? { cornerRadius: el.cornerRadius } : {}),
          ...(fill !== undefined ? { fill } : {}),
        },
      ];
    }
    case 'circle': {
      // `x`/`y` are the element's top-left (uniform with the designer canvas);
      // the composite `circle` part is centre-based.
      const fill = color(el.fillRole, el.fill, palette);
      return [
        {
          part: 'circle',
          x: el.x + el.radius,
          y: el.y + el.radius,
          radius: el.radius,
          ...(fill !== undefined ? { fill } : {}),
        },
      ];
    }
    case 'line': {
      const stroke = color(el.colorRole, el.color, palette) ?? palette.divider ?? 0xe2e8f0;
      return [
        { part: 'line', x: el.x, y: el.y, x2: el.x2, y2: el.y2, stroke: { color: stroke, width: el.strokeWidth ?? 1 } },
      ];
    }
    case 'image': {
      // No composite image part yet — render a themed placeholder.
      const fill = palette.divider ?? 0xcccccc;
      if (el.shape === 'rounded') {
        return [{ part: 'rect', x: el.x, y: el.y, width: el.size, height: el.size, cornerRadius: 8, fill }];
      }
      const r = el.size / 2;
      return [{ part: 'circle', x: el.x + r, y: el.y + r, radius: r, fill }];
    }
    default:
      return [];
  }
}
