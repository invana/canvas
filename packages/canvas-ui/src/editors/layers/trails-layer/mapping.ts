import { hexToNumber, numberToHex } from '../../../shared/color';
import type { TrailsLayerFields, TrailsLayerOptions } from './types';

const listToText = (ids: readonly string[] | undefined): string | undefined => (ids ? ids.join(', ') : undefined);
const textToList = (text: string): string[] =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Map a `TrailsLayerOptions`-shaped patch to the flat form fields. */
export function optionsToForm(o: TrailsLayerOptions = {}): TrailsLayerFields {
  return {
    ids: o.ids === 'all' ? 'all' : listToText(o.ids),
    maxPoints: o.maxPoints,
    maxAgeMs: o.maxAgeMs,
    fadeBands: o.fadeBands,
    color: typeof o.color === 'number' ? numberToHex(o.color) : undefined,
    alpha: o.alpha,
    strokeWidthPx: o.strokeWidthPx,
    fullTrackIds: listToText(o.fullTrackIds),
    fullTrackMaxPoints: o.fullTrackMaxPoints,
    publishDebounceMs: o.publishDebounceMs,
  };
}

/** Inverse of {@link optionsToForm}. Only fields the form set are included. */
export function formToOptions(f: TrailsLayerFields): TrailsLayerOptions {
  const out: TrailsLayerOptions = {};
  if (f.ids !== undefined) out.ids = f.ids.trim().toLowerCase() === 'all' ? 'all' : textToList(f.ids);
  if (f.maxPoints !== undefined) out.maxPoints = f.maxPoints;
  if (f.maxAgeMs !== undefined) out.maxAgeMs = f.maxAgeMs;
  if (f.fadeBands !== undefined) out.fadeBands = f.fadeBands;
  if (f.color) out.color = hexToNumber(f.color);
  if (f.alpha !== undefined) out.alpha = f.alpha;
  if (f.strokeWidthPx !== undefined) out.strokeWidthPx = f.strokeWidthPx;
  if (f.fullTrackIds !== undefined) out.fullTrackIds = textToList(f.fullTrackIds);
  if (f.fullTrackMaxPoints !== undefined) out.fullTrackMaxPoints = f.fullTrackMaxPoints;
  if (f.publishDebounceMs !== undefined) out.publishDebounceMs = f.publishDebounceMs;
  return out;
}
