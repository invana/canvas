/**
 * Types for the TrackingBehaviour editor. Engine-agnostic: the editable option
 * shape is mirrored here as a serialisable patch the consumer applies via
 * `setOptions`. Keep it in sync with `TrackingBehaviourOptions` by hand; the
 * constructor-only wiring (`onUnknownFix`, `onFollowReleased`, `cameraDriver`) is
 * not editable.
 */

/** The subset of `TrackingBehaviourOptions` this editor produces. */
export interface TrackingOptions {
  /** Draw objects this far in the past. Default `1500`. */
  renderDelayMs?: number;
  /** Dead-reckon past the newest fix for at most this long. Default `30000`. */
  maxExtrapolateMs?: number;
  /** No fix for longer than this → `stale`. Default `60000`. */
  staleAfterMs?: number;
  /** No fix for longer than this → `lost`. Default `180000`. */
  lostAfterMs?: number;
  /** Speed (world units/s) below which an object is stopped. Unset = no `stopped` state. */
  stoppedBelowSpeed?: number;
  /** How long the speed stays below the threshold before `stopped`. Default `30000`. */
  stoppedAfterMs?: number;
  /** The `data` key the heading is written to, or `null` for none. Default `'course'`. */
  courseKey?: string | null;
  /** Write the heading only when it moved by this many degrees. Default `1`. */
  courseEpsilonDeg?: number;
  /** Keep the camera on one object. */
  follow?: { targetId: string | null };
}

/** Flat form-field shape. `follow.targetId` is flattened to `followTargetId`. */
export interface TrackingFields {
  renderDelayMs?: number;
  maxExtrapolateMs?: number;
  staleAfterMs?: number;
  lostAfterMs?: number;
  stoppedBelowSpeed?: number;
  stoppedAfterMs?: number;
  /** Empty = write no heading. */
  courseKey?: string;
  courseEpsilonDeg?: number;
  /** Empty = follow nothing. */
  followTargetId?: string;
}

/** Form state wrapper — the generator reads `options.<field>`. */
export interface TrackingFormState {
  options: TrackingFields;
}
