/**
 * Types for the HoverActivateBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `HoverActivateBehaviour`
 * and its options live) is imported for **types only** — actually not even that
 * here; the editable option shape is mirrored **structurally** as
 * {@link HoverActivateOptions}, a plain serialisable patch the consumer applies
 * via `setOptions`. Keep it in sync with `HoverActivateBehaviourOptions` by hand.
 */

/** Edge-traversal direction filter for neighbour expansion (mirrors the engine enum). */
export type HoverDirection = 'in' | 'out' | 'both';

/**
 * Which group frames never become the focal hover (mirrors the engine enum).
 * `'expanded'` is the engine default: an expanded frame is scenery, a
 * collapsed one behaves like an ordinary node.
 */
export type GroupExclusion = 'expanded' | 'always' | 'never';

/**
 * The serialisable subset of `HoverActivateBehaviourOptions` this editor
 * produces. Function options (`enable`, `onHover`, `onHoverEnd`) and the base
 * `id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope —
 * only the user-tunable scalars / enums round-trip.
 */
export interface HoverActivateOptions {
  hoverEdges?: boolean;
  excludeNodeTypes?: string[];
  excludeGroups?: GroupExclusion;
  excludeEdgeTypes?: string[];
  state?: string;
  inactiveState?: string;
  raiseActive?: boolean;
  degree?: number;
  direction?: HoverDirection;
  zoomThreshold?: number;
  zoomedOutState?: string;
  zoomedOutEdgeState?: string;
  zoomedOutScale?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. There are no
 * nested groups or unions in `HoverActivateBehaviourOptions`, so the fields map
 * 1:1 to {@link HoverActivateOptions}.
 */
export interface HoverActivateFields {
  hoverEdges?: boolean;
  /** Comma-separated `GraphNode.type` list — encoded, see `mapping.ts`. */
  excludeNodeTypes?: string;
  /** Structural group veto — a plain enum, no encoding. */
  excludeGroups?: GroupExclusion;
  /** Comma-separated `GraphEdge.type` list — encoded, see `mapping.ts`. */
  excludeEdgeTypes?: string;
  state?: string;
  inactiveState?: string;
  raiseActive?: boolean;
  degree?: number;
  direction?: HoverDirection;
  zoomThreshold?: number;
  zoomedOutState?: string;
  zoomedOutEdgeState?: string;
  zoomedOutScale?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface HoverActivateFormState {
  options: HoverActivateFields;
}
