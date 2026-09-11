// Value helpers for `StylingViewPanel` — the bits of it that are plain functions
// over a type name rather than rendering.

import type { SchemaProperty } from '@invana/graph';

import { numberToHex } from '../../shared/color';
import { typeColor } from '../schema/schema';

/**
 * Sentinel `Select` value for "no label property override". `Select` cannot hold
 * `undefined`, so the panel round-trips this constant to and from
 * `NodeTypeStyling.labelKey`.
 */
export const LABEL_DEFAULT = '__default__';

/**
 * The colour a type shows while the host has set none — the same deterministic
 * `typeColor` the schema metagraph paints that type with, so an unstyled row's
 * swatch is not a lie about what the canvas draws.
 */
export function defaultTypeColor(name: string): string {
  return numberToHex(typeColor(name));
}

/** One choice in the label-key picker: the dot path plus how to show it. */
export interface LabelKeyOption {
  /** Root-relative dot path — `'id'`, `'type'`, `'data.<prop>'`. */
  value: string;
  /**
   * What the picker shows — `'id'` · `'type'` · `'property.<key>'`.
   *
   * Deliberately **not** the emitted {@link value}: a payload key reads as
   * `property.tier` but resolves as `data.tier`, because `data` is where the
   * store puts it. Showing the storage field would leak an engine-internal
   * name into a user-facing picker; showing the bare key would hide that
   * `tier` and the root `type` live in different places. Don't "fix" the
   * mismatch by aligning them.
   */
  label: string;
}

/**
 * The label-key choices for one node type: the two root fields every node
 * carries, then one `data.<key>` entry per property the schema observed.
 *
 * `id` / `type` are **not** in `SchemaNodeType.properties` — `deriveSchema` only
 * walks `node.data`, so its properties are `data` keys. They're added here
 * because they exist on every `GraphNode` unconditionally, and they're emitted
 * as bare paths (`'type'`) while properties are prefixed (`'data.type'`), which
 * is what keeps the two distinguishable.
 */
export function labelKeyOptions(properties: readonly SchemaProperty[]): LabelKeyOption[] {
  return [
    { value: 'id', label: 'id' },
    { value: 'type', label: 'type' },
    ...properties.map((p) => ({ value: `data.${p.name}`, label: `property.${p.name}` })),
  ];
}
