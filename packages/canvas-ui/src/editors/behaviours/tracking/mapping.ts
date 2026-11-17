import type { TrackingFields, TrackingOptions } from './types';

/** Map a `TrackingBehaviourOptions`-shaped patch to the flat form fields. */
export function optionsToForm(o: TrackingOptions = {}): TrackingFields {
  return {
    renderDelayMs: o.renderDelayMs,
    maxExtrapolateMs: o.maxExtrapolateMs,
    staleAfterMs: o.staleAfterMs,
    lostAfterMs: o.lostAfterMs,
    stoppedBelowSpeed: o.stoppedBelowSpeed,
    stoppedAfterMs: o.stoppedAfterMs,
    courseKey: o.courseKey === null ? '' : o.courseKey,
    courseEpsilonDeg: o.courseEpsilonDeg,
    followTargetId: o.follow?.targetId ?? undefined,
  };
}

/**
 * Inverse of {@link optionsToForm}. Only fields the form set are included, so the
 * result is safe to spread over the behaviour's options. An empty `courseKey`
 * means "write no heading" (`null`); an empty follow id means "follow nothing".
 */
export function formToOptions(f: TrackingFields): TrackingOptions {
  const out: TrackingOptions = {};
  if (f.renderDelayMs !== undefined) out.renderDelayMs = f.renderDelayMs;
  if (f.maxExtrapolateMs !== undefined) out.maxExtrapolateMs = f.maxExtrapolateMs;
  if (f.staleAfterMs !== undefined) out.staleAfterMs = f.staleAfterMs;
  if (f.lostAfterMs !== undefined) out.lostAfterMs = f.lostAfterMs;
  if (f.stoppedBelowSpeed !== undefined) out.stoppedBelowSpeed = f.stoppedBelowSpeed;
  if (f.stoppedAfterMs !== undefined) out.stoppedAfterMs = f.stoppedAfterMs;
  if (f.courseKey !== undefined) out.courseKey = f.courseKey === '' ? null : f.courseKey;
  if (f.courseEpsilonDeg !== undefined) out.courseEpsilonDeg = f.courseEpsilonDeg;
  if (f.followTargetId !== undefined) out.follow = { targetId: f.followTargetId === '' ? null : f.followTargetId };
  return out;
}
