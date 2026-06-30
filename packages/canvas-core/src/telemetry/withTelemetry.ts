import type { Patch } from 'immer';

import { changedPaths } from '../port/patch';
import type { ReactiveStore } from '../port/types';

/** One observable state mutation — OTel-agnostic; the app maps it to spans/metrics. */
export interface TelemetryEvent {
  /** Named action from `update(patch, action)`, or `'update'`. */
  action: string;
  /** Top-level keys the patch touched — bounded cardinality (span/metric-safe). */
  changedPaths: string[];
  /** The minimal forward delta (the patch *is* the diff — no deep-diff cost). */
  patches: Patch[];
  /** Timestamp (ms). */
  ts: number;
}

/** Where telemetry events go. The engine stays exporter-agnostic; the app wires this. */
export interface TelemetrySink {
  emit(event: TelemetryEvent): void;
}

/** A sink that drops everything — the default. */
export const NoopSink: TelemetrySink = { emit: () => {} };

/**
 * Attach telemetry to a {@link ReactiveStore} — a **port decorator**, not a zustand
 * middleware, so it survives a backend swap (zustand → Yjs) and is scoped to this
 * (view) store, never the bulk data hot path. One event per change, carrying the
 * action label + the patch diff. Returns the same store for chaining.
 */
export function withTelemetry<T>(
  store: ReactiveStore<T>,
  sink: TelemetrySink,
  now: () => number = () => Date.now(),
): ReactiveStore<T> {
  store.subscribeChanges((change) => {
    sink.emit({
      action: change.action ?? 'update',
      changedPaths: changedPaths(change.patches),
      patches: change.patches,
      ts: now(),
    });
  });
  return store;
}
