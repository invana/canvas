/**
 * Types for the ElkLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-elkjs` (home of `ElkLayout` and its
 * options) is **not** imported — canvas-ui may only use `@invana/graph` types
 * (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link ElkLayoutOptions}, a serialisable patch the consumer applies (a layout
 * re-run / `setOptions`). Keep the enums / fields in sync by hand.
 */

/**
 * Built-in ELK algorithm names. Mirrors the layout's `ElkAlgorithmName` (minus
 * the open `string` fallback — the select only offers the shipped algorithms).
 */
export type ElkAlgorithm =
  | 'layered'
  | 'mrtree'
  | 'radial'
  | 'force'
  | 'stress'
  | 'disco'
  | 'box'
  | 'rectpacking'
  | 'random'
  | 'fixed';

/** Direction of the primary layout axis. Mapped to `elk.direction`. */
export type ElkDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/** Edge-routing strategy. Mapped to `elk.edgeRouting`. */
export type ElkEdgeRouting = 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';

/**
 * The subset of `ElkLayoutOptions` this editor produces — a serialisable patch.
 * `padding` is modelled as a single symmetric number (the per-side object form
 * is out of scope); `defaultNodeSize` is flattened into `defaultNodeWidth` /
 * `defaultNodeHeight`. Function options (`nodeSize`, `workerFactory`), the
 * free-form `layoutOptions` bag, and registry wiring (`id` / `targetLayerId`)
 * are out of scope; the tunable scalars round-trip. `transition` /
 * `transitionEase` come from the shared one-shot layout base.
 */
export interface ElkLayoutOptions {
  algorithm?: ElkAlgorithm;
  direction?: ElkDirection;
  nodeSpacing?: number;
  layerSpacing?: number;
  edgeNodeSpacing?: number;
  edgeSpacing?: number;
  edgeRouting?: ElkEdgeRouting;
  /** `elk.padding` — symmetric graph padding (per-side object form omitted). */
  padding?: number;
  defaultNodeSize?: { width?: number; height?: number };
  /** Lay out `parentId` groups as nested containers (compound layout). */
  includeGroups?: boolean;
  transition?: boolean;
  transitionEase?: string;
}

/**
 * Flat form-field shape. `defaultNodeSize: { width, height }` is split into
 * `defaultNodeWidth` / `defaultNodeHeight` (see `mapping.ts`); everything else
 * matches {@link ElkLayoutOptions} 1:1.
 */
export interface ElkLayoutFields {
  algorithm?: ElkAlgorithm;
  direction?: ElkDirection;
  nodeSpacing?: number;
  layerSpacing?: number;
  edgeNodeSpacing?: number;
  edgeSpacing?: number;
  edgeRouting?: ElkEdgeRouting;
  padding?: number;
  defaultNodeWidth?: number;
  defaultNodeHeight?: number;
  includeGroups?: boolean;
  transition?: boolean;
  transitionEase?: string;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface ElkLayoutFormState {
  options: ElkLayoutFields;
}
