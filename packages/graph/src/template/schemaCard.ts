/**
 * **A schema card as a structure template** — the node type of an ER / schema
 * board drawn as a card: a header washed in the type's hue (icon, name, a
 * subtitle), a two-line description, then one row per property — type chip,
 * name, `key` when the property identifies the type, and its data type.
 *
 * It is a {@link FreeformStructure}, not a composite: a Detail level binds a
 * node type to a *structure* by name, and only structures take theme roles
 * and record lookups — so the card follows the theme, and its hue follows the
 * record's categorical slot (`data.hue`), with nothing re-read by the host.
 * The rows are the one per-type part, which is why there is one structure per
 * type (`schema:<type>`) built from that type's own properties.
 *
 * `SchemaTableCard` (the composite) draws the same rows for a story that wants
 * per-row hover; both read the chip from {@link schemaTypeChip}.
 *
 * @example
 * const structure = schemaCardStructure('schema:Airport', node.data, { subtitle: '{data.frame}' });
 */

import type { FreeformStructure, ValueLookup, TemplateColor } from './types';

/** One property of a {@link SchemaTypeData}. */
export interface SchemaCardProperty {
  name: string;
  /** Data-type token — `string`, `integer`, `date`, … */
  type: string;
  /** It identifies the type — the row says `key`. */
  identity?: boolean;
  /** Short markers the hover card lists after the type. */
  tags?: string[];
}

/** A schema type's `node.data`, as the schema card and hover card read it. */
export interface SchemaTypeData {
  label: string;
  description?: string;
  /** `lucide/<name>` — an iconify id. */
  icon?: string;
  /** The frame (model, schema) the type sits in — the default subtitle. */
  frame?: string;
  /** A 1-based slot of the theme's categorical ramp. */
  hue?: number;
  properties: SchemaCardProperty[];
}

/** Options for {@link schemaCardStructure}. */
export interface SchemaCardOptions {
  /**
   * The line under the name; `{data.x}` is interpolated from the record.
   * Left out, the card has no subtitle.
   */
  subtitle?: string;
}

/** A property type's chip: its glyph and fill. */
export interface SchemaTypeChip {
  char: string;
  color: number;
}

const CHIPS: Record<string, SchemaTypeChip> = {
  string: { char: 'Abc', color: 0x3b82f6 },
  text: { char: 'Abc', color: 0x3b82f6 },
  varchar: { char: 'Abc', color: 0x3b82f6 },
  uuid: { char: 'Abc', color: 0x3b82f6 },
  integer: { char: '123', color: 0x22c55e },
  int: { char: '123', color: 0x22c55e },
  number: { char: '#', color: 0x22c55e },
  float: { char: '#', color: 0x22c55e },
  boolean: { char: '01', color: 0xa855f7 },
  bool: { char: '01', color: 0xa855f7 },
  enum: { char: '≔', color: 0xec4899 },
  date: { char: '◷', color: 0xf59e0b },
  datetime: { char: '◷', color: 0xf59e0b },
  timestamp: { char: '◷', color: 0xf59e0b },
};
const OTHER_CHIP: SchemaTypeChip = { char: '{}', color: 0x64748b };

/** The chip a property row wears for its data type; `{}` for one not listed. */
export function schemaTypeChip(type: string): SchemaTypeChip {
  return CHIPS[type.toLowerCase()] ?? OTHER_CHIP;
}

const CARD_WIDTH = 300;
const ROWS_TOP = 90;
const ROW_HEIGHT = 22;
const HUE: ValueLookup<TemplateColor> = { bind: 'data.hue', categorical: true };

/**
 * One type's schema card, named `name`, with a row per property of `data`.
 * The height grows with the row count.
 */
export function schemaCardStructure(
  name: string,
  data: Pick<SchemaTypeData, 'properties'>,
  opts: SchemaCardOptions = {},
): FreeformStructure {
  const rows = data.properties.flatMap((p, i) => {
    const y = ROWS_TOP + i * ROW_HEIGHT;
    const chip = schemaTypeChip(p.type);
    return [
      { id: `row${i}-chip`, type: 'rect' as const, x: 14, y: y + 9, width: 22, height: 16, cornerRadius: 3, fill: chip.color },
      {
        id: `row${i}-chip-text`,
        type: 'text' as const,
        x: 25,
        y: y + 5,
        text: chip.char,
        anchor: 'center' as const,
        fontSize: 8,
        fontWeight: 700,
        color: 0xffffff,
      },
      {
        id: `row${i}-name`,
        type: 'text' as const,
        x: 44,
        y: y - 1,
        text: p.name,
        fontSize: 12,
        fontWeight: p.identity ? 700 : 400,
        colorRole: p.identity ? ('heading' as const) : ('foreground' as const),
        maxWidth: 150,
      },
      ...(p.identity
        ? [
            {
              id: `row${i}-tags`,
              type: 'text' as const,
              x: 196,
              y: y + 4,
              text: 'key',
              fontSize: 9,
              fontWeight: 700,
              colorRole: 'accent' as const,
              maxWidth: 50,
            },
          ]
        : []),
      {
        id: `row${i}-type`,
        type: 'text' as const,
        x: 286,
        y: y + 2,
        text: p.type,
        anchor: 'right' as const,
        fontSize: 10,
        colorRole: 'muted' as const,
        maxWidth: 56,
      },
    ];
  });
  return {
    name,
    kind: 'freeform',
    width: CARD_WIDTH,
    height: ROWS_TOP + 16 + data.properties.length * ROW_HEIGHT,
    cornerRadius: 10,
    bgRole: 'cardBg',
    strokeLookup: HUE,
    strokeWidth: 1.5,
    elements: [
      { id: 'header', type: 'rect', x: 4, y: 4, width: CARD_WIDTH - 8, height: 42, cornerRadius: 7, fillLookup: HUE, fillAlpha: 0.18 },
      { id: 'icon', type: 'icon', x: 14, y: 12, size: 24, bind: 'data.icon', colorLookup: HUE, strokeWidth: 2 },
      {
        id: 'name',
        type: 'text',
        x: 48,
        y: -5,
        bind: 'data.label',
        fontSize: 14,
        fontWeight: 700,
        colorRole: 'heading',
        maxWidth: 238,
      },
      ...(opts.subtitle
        ? [
            {
              id: 'subtitle',
              type: 'text' as const,
              x: 48,
              y: 17,
              text: opts.subtitle,
              fontSize: 10,
              fontWeight: 600,
              uppercase: true,
              colorRole: 'muted' as const,
              maxWidth: 238,
            },
          ]
        : []),
      {
        id: 'description',
        type: 'text',
        x: 14,
        y: 45,
        bind: 'data.description',
        fontSize: 11,
        colorRole: 'foreground',
        maxWidth: 272,
        maxLines: 2,
        lineHeight: 14,
      },
      { id: 'divider', type: 'line', x: 0, y: ROWS_TOP, x2: CARD_WIDTH, y2: ROWS_TOP, colorRole: 'divider' },
      ...rows,
    ],
  };
}
