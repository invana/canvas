/**
 * Layout presets — a layout, its options, the edge shape and how the run starts,
 * switched together by one name.
 *
 * A user picks a card (*Network · Tree ↓ · Flow → · Radial*), not an algorithm,
 * and the board changes shape as one. A preset is **data**: it names a layout
 * the host registered (`layoutId`) and patches that layout's JSON options, so
 * function-valued options (a force's `collide.radius`) stay on the instance and
 * the spec stays serialisable.
 *
 * Each option of a preset (Direction, Edges, Spacing, Root / Centre) maps every
 * value it offers to a {@link LayoutPresetPatch}. {@link expandLayoutPreset}
 * folds the defaults, the user's overrides and those patches into the slices
 * `GraphCanvas.applyLayoutPreset` writes in one `update()`:
 *
 * - the layout's options — **every** key any preset of that layout sets is
 *   written, the ones this preset leaves unset as `undefined`, so nothing leaks
 *   from the preset before (Radial clears Tree's `direction`);
 * - the layer's edge `pathType` and `pathStyleOpts`, which may depend on the
 *   resolved `direction` (a curved top-to-bottom tree is a vertical S-curve).
 *   Only the `pathStyleOpts` keys presets set are replaced; the rest of the
 *   layer's edge shape is left alone;
 * - how the switch's run starts (`reseed` for a force solved from scratch).
 *
 * {@link DEFAULT_LAYOUT_PRESETS} are the four presets of the Explorer's design
 * (GC22), naming the layout ids `network` (a `D3ForceLayout`) and `elk` (an
 * `ElkLayout`). A host that registered its layouts under other ids remaps them
 * with {@link remapLayoutPresets}; a preset whose layout isn't registered is
 * offered disabled.
 */

import type { LayoutRunOptions } from '@invana/canvas';

import type { EdgePathType } from '../layer/types';

/** A layered layout's flow direction, as `ElkLayout`'s `direction` takes it. */
export type LayoutPresetDirection = 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';

/** The layer's edge shape a preset sets. */
export interface LayoutPresetEdge {
  readonly pathType: EdgePathType;
  readonly pathStyleOpts?: Readonly<Record<string, unknown>>;
}

/** What one option value sets. */
export interface LayoutPresetPatch {
  /** Options merged onto the preset's layout (deep, as `Canvas.update` merges them). */
  readonly layout?: Readonly<Record<string, unknown>>;
  /**
   * The layer's edge shape: one value, or one per resolved layout `direction`
   * (a direction missing from the map falls back to `DOWN`'s).
   */
  readonly edge?: LayoutPresetEdge | Readonly<Partial<Record<LayoutPresetDirection, LayoutPresetEdge>>>;
}

/** One preset. Plain JSON — persist it, ship it as config. */
export interface LayoutPresetSpec {
  /** Stable id, as `definition.layoutPreset.id` stores it. */
  readonly id: string;
  readonly label: string;
  /** The registered layout this preset drives. */
  readonly layoutId: string;
  /** Options every switch to this preset writes, before the option patches. */
  readonly layout?: Readonly<Record<string, unknown>>;
  /** The value each option starts at, by option key. */
  readonly defaults: Readonly<Record<string, string>>;
  /** Option key → value → what it sets. Keys are applied in this object's order. */
  readonly options: Readonly<Record<string, Readonly<Record<string, LayoutPresetPatch>>>>;
  /**
   * Offered disabled above this many nodes in the layout's target layer. The
   * host decides the limit; absent = no limit.
   */
  readonly maxNodes?: number;
  /** A switch to this preset solves from scratch rather than from the current positions. */
  readonly reseed?: boolean;
}

/** {@link expandLayoutPreset}'s result: the slices one switch writes, and how its run starts. */
export interface LayoutPresetExpansion {
  readonly layoutId: string;
  /** Every option key the layout's presets set — the unset ones as `undefined`. */
  readonly layout: Record<string, unknown>;
  readonly edge?: LayoutPresetEdge;
  /** The `pathStyleOpts` keys any preset sets — replaced on every switch, the unset ones removed. */
  readonly edgeOptionKeys: readonly string[];
  /** The overrides that differ from the preset's defaults and name a value it offers. */
  readonly overrides: Record<string, string>;
  readonly run: LayoutRunOptions;
}

const SPACING_ELK = {
  compact: { nodeSpacing: 20, layerSpacing: 40 },
  comfortable: { nodeSpacing: 40, layerSpacing: 80 },
  roomy: { nodeSpacing: 70, layerSpacing: 130 },
} as const;

const DIRECTION: LayoutPresetSpec['options'][string] = {
  down: { layout: { direction: 'DOWN' } },
  right: { layout: { direction: 'RIGHT' } },
  left: { layout: { direction: 'LEFT' } },
  up: { layout: { direction: 'UP' } },
};

/**
 * A curve along the flow — vertical S-curves top-to-bottom, horizontal ones
 * left-to-right (d3's `linkVertical` / `linkHorizontal`). `bezier` with a fixed
 * axis, because it ignores the anchors' surface normals: on a circle those
 * point at the other node and flatten a normal-following curve into a line.
 */
const CURVE_ALONG_FLOW: Record<LayoutPresetDirection, LayoutPresetEdge> = {
  DOWN: { pathType: 'bezier', pathStyleOpts: { axis: 'v' } },
  UP: { pathType: 'bezier', pathStyleOpts: { axis: 'v' } },
  RIGHT: { pathType: 'bezier', pathStyleOpts: { axis: 'h' } },
  LEFT: { pathType: 'bezier', pathStyleOpts: { axis: 'h' } },
};

const SPACING_LAYERED: LayoutPresetSpec['options'][string] = {
  compact: { layout: SPACING_ELK.compact },
  comfortable: { layout: SPACING_ELK.comfortable },
  roomy: { layout: SPACING_ELK.roomy },
};

const ROOT: LayoutPresetSpec['options'][string] = {
  auto: { layout: { root: 'auto' } },
  selection: { layout: { root: 'selection' } },
};

/**
 * Network · Tree ↓ · Flow → · Radial — the Explorer's four presets (GC22), over
 * the layout ids `network` and `elk`.
 */
export const DEFAULT_LAYOUT_PRESETS: readonly LayoutPresetSpec[] = [
  {
    id: 'network',
    label: 'Network',
    layoutId: 'network',
    reseed: true,
    defaults: { edges: 'straight', spacing: 'comfortable' },
    options: {
      edges: {
        straight: { edge: { pathType: 'straight' } },
        curved: { edge: { pathType: 'bezier' } },
        orthogonal: { edge: { pathType: 'orth' } },
      },
      spacing: {
        compact: { layout: { link: { distance: 40 }, charge: { strength: -150 } } },
        comfortable: { layout: { link: { distance: 80 }, charge: { strength: -350 } } },
        roomy: { layout: { link: { distance: 140 }, charge: { strength: -700 } } },
      },
    },
  },
  {
    id: 'tree',
    label: 'Tree ↓',
    layoutId: 'elk',
    layout: { algorithm: 'layered' },
    defaults: { direction: 'down', edges: 'orthogonal', spacing: 'comfortable', root: 'auto' },
    options: {
      direction: DIRECTION,
      edges: {
        straight: { edge: { pathType: 'straight' } },
        curved: { edge: CURVE_ALONG_FLOW },
        orthogonal: { layout: { edgeRouting: 'ORTHOGONAL' }, edge: { pathType: 'orth' } },
      },
      spacing: SPACING_LAYERED,
      root: ROOT,
    },
  },
  {
    id: 'flow',
    label: 'Flow →',
    layoutId: 'elk',
    layout: { algorithm: 'layered' },
    defaults: { direction: 'right', edges: 'curved', spacing: 'comfortable', root: 'auto' },
    options: {
      direction: DIRECTION,
      edges: {
        straight: { edge: { pathType: 'straight' } },
        // ELK's own splines; an edge it doesn't route curves along the flow.
        curved: { layout: { edgeRouting: 'SPLINES' }, edge: CURVE_ALONG_FLOW },
        orthogonal: { layout: { edgeRouting: 'ORTHOGONAL' }, edge: { pathType: 'orth' } },
      },
      spacing: SPACING_LAYERED,
      root: ROOT,
    },
  },
  {
    id: 'radial',
    label: 'Radial',
    layoutId: 'elk',
    layout: { algorithm: 'radial' },
    defaults: { edges: 'curved', spacing: 'comfortable', centre: 'auto' },
    options: {
      edges: {
        straight: { edge: { pathType: 'straight' } },
        curved: { edge: { pathType: 'bump-radial' } },
        orthogonal: { edge: { pathType: 'orth' } },
      },
      spacing: {
        compact: { layout: { ringSpacing: 60, nodeSpacing: SPACING_ELK.compact.nodeSpacing } },
        comfortable: { layout: { ringSpacing: 120, nodeSpacing: SPACING_ELK.comfortable.nodeSpacing } },
        roomy: { layout: { ringSpacing: 200, nodeSpacing: SPACING_ELK.roomy.nodeSpacing } },
      },
      centre: ROOT,
    },
  },
];

/**
 * `presets` with each `layoutId` replaced as `ids` maps it — for a host whose
 * layouts are registered under other ids (`{ network: 'graph-force' }`).
 */
export function remapLayoutPresets(
  presets: readonly LayoutPresetSpec[],
  ids: Readonly<Record<string, string>>,
): LayoutPresetSpec[] {
  return presets.map((p) => (ids[p.layoutId] ? { ...p, layoutId: ids[p.layoutId]! } : p));
}

/**
 * Expand preset `id` with `overrides` into the slices one switch writes. An
 * override for an option the preset doesn't have, or a value it doesn't offer,
 * is dropped. `null` when `presets` has no such id.
 */
export function expandLayoutPreset(
  presets: readonly LayoutPresetSpec[],
  id: string,
  overrides: Readonly<Record<string, string>> = {},
): LayoutPresetExpansion | null {
  const spec = presets.find((p) => p.id === id);
  if (!spec) return null;

  let layout: Record<string, unknown> = { ...spec.layout };
  let edge: LayoutPresetPatch['edge'];
  const kept: Record<string, string> = {};
  for (const [key, values] of Object.entries(spec.options)) {
    const chosen = overrides[key];
    const valid = chosen !== undefined && values[chosen] !== undefined;
    if (valid && chosen !== spec.defaults[key]) kept[key] = chosen;
    const patch = values[valid ? chosen : (spec.defaults[key] ?? '')];
    if (!patch) continue;
    if (patch.layout) layout = merge(layout, patch.layout);
    if (patch.edge !== undefined) edge = patch.edge;
  }

  // Clear what another preset of this layout set and this one doesn't.
  for (const key of controlledKeys(presets, spec.layoutId)) {
    if (!(key in layout)) layout[key] = undefined;
  }

  const direction = (layout['direction'] as LayoutPresetDirection | undefined) ?? 'DOWN';
  const resolved = edgeFor(edge, direction);

  return {
    layoutId: spec.layoutId,
    layout,
    ...(resolved ? { edge: resolved } : {}),
    edgeOptionKeys: [...edgeOptionKeys(presets)],
    overrides: kept,
    run: { fitCamera: true, ...(spec.reseed ? { reseed: true } : {}) },
  };
}

/** A patch's edge shape for the resolved direction (`DOWN`'s when the map lacks it). */
function edgeFor(edge: LayoutPresetPatch['edge'], direction: LayoutPresetDirection): LayoutPresetEdge | undefined {
  if (!edge) return undefined;
  if (isEdge(edge)) return edge;
  return edge[direction] ?? edge.DOWN;
}

function isEdge(e: NonNullable<LayoutPresetPatch['edge']>): e is LayoutPresetEdge {
  return typeof (e as LayoutPresetEdge).pathType === 'string';
}

/** The edge `pathStyleOpts` keys any preset sets. */
function edgeOptionKeys(presets: readonly LayoutPresetSpec[]): Set<string> {
  const keys = new Set<string>();
  const add = (e: LayoutPresetEdge | undefined): void => {
    for (const k of Object.keys(e?.pathStyleOpts ?? {})) keys.add(k);
  };
  for (const p of presets) {
    for (const values of Object.values(p.options)) {
      for (const patch of Object.values(values)) {
        if (!patch.edge) continue;
        if (isEdge(patch.edge)) add(patch.edge);
        else for (const e of Object.values(patch.edge)) add(e);
      }
    }
  }
  return keys;
}

/** Top-level layout option keys any preset of `layoutId` sets. */
function controlledKeys(presets: readonly LayoutPresetSpec[], layoutId: string): Set<string> {
  const keys = new Set<string>();
  for (const p of presets) {
    if (p.layoutId !== layoutId) continue;
    for (const k of Object.keys(p.layout ?? {})) keys.add(k);
    for (const values of Object.values(p.options)) {
      for (const patch of Object.values(values)) for (const k of Object.keys(patch.layout ?? {})) keys.add(k);
    }
  }
  return keys;
}

function isPlain(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function merge(base: Record<string, unknown>, patch: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = isPlain(v) && isPlain(out[k]) ? merge(out[k], v) : v;
  return out;
}
