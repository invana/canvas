import type { ContentLODFields, ContentLODOptions } from './types';

/** A positive number, or `null` — `0` (the form's "blank") means unset. */
function positiveOrNull(v: number): number | null {
  return v > 0 ? v : null;
}

/**
 * Map a content-LOD options patch to the flat {@link ContentLODFields} the
 * `@invana/forms` generator renders. `null` (unset) shows as blank.
 */
export function optionsToForm(o: ContentLODOptions = {}): ContentLODFields {
  return {
    minZoom: o.minZoom,
    maxZoom: o.maxZoom ?? undefined,
    alwaysShowTop: o.alwaysShowTop,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ContentLODOptions} patch. Fields the form never set are omitted, so the
 * result is safe to spread over the behaviour's current options on `setOptions`.
 * A cleared `maxZoom` arrives as `0` and is sent as `null` (no upper bound) —
 * `0` would hide the content at every zoom.
 */
export function formToOptions(f: ContentLODFields): ContentLODOptions {
  const out: ContentLODOptions = {};
  if (f.minZoom !== undefined) out.minZoom = f.minZoom;
  if (f.maxZoom !== undefined) out.maxZoom = positiveOrNull(f.maxZoom);
  if (f.alwaysShowTop !== undefined) out.alwaysShowTop = f.alwaysShowTop;
  return out;
}

/**
 * {@link optionsToForm} for the **label** LOD editors (`NodeLabelLODBehaviour` /
 * `EdgeLabelLODBehaviour`): adds the size fields and derives the form-only
 * `sizeLabels` switch — on when any size option is set.
 */
export function labelLodOptionsToForm(o: ContentLODOptions = {}): ContentLODFields {
  const zoomGrowth = o.zoomGrowth ?? undefined;
  const minFontPx = o.minFontPx ?? undefined;
  const maxFontPx = o.maxFontPx ?? undefined;
  return {
    ...optionsToForm(o),
    sizeLabels: zoomGrowth !== undefined || minFontPx !== undefined || maxFontPx !== undefined,
    zoomGrowth,
    minFontPx,
    maxFontPx,
  };
}

/**
 * Inverse of {@link labelLodOptionsToForm}. With `sizeLabels` off the three size
 * options go out as `null` — the behaviour pushes no policy and labels keep their
 * natural size. With it on they pass through, `zoomGrowth: 0` meaning a fixed
 * on-screen size, and a cleared (`0`) font bound becoming `null` (no floor / cap).
 */
export function labelLodFormToOptions(f: ContentLODFields): ContentLODOptions {
  const out = formToOptions(f);
  if (f.sizeLabels === false) {
    out.zoomGrowth = null;
    out.minFontPx = null;
    out.maxFontPx = null;
  } else if (f.sizeLabels === true) {
    out.zoomGrowth = f.zoomGrowth ?? 0;
    out.minFontPx = f.minFontPx === undefined ? null : positiveOrNull(f.minFontPx);
    out.maxFontPx = f.maxFontPx === undefined ? null : positiveOrNull(f.maxFontPx);
  }
  return out;
}
