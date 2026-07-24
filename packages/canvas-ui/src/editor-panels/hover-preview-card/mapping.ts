import type { HoverElementPreviewCardSpec, PreviewRowSpec } from '@invana/graph';

import type { CardSpecFields } from './types';

/** Seed the form from a serializable card spec (use as `defaults`). */
export function specToForm(spec: HoverElementPreviewCardSpec = {}): CardSpecFields {
  return {
    card: {
      imageField: spec.image?.field ?? '',
      imageShape: spec.image?.shape ?? 'rounded',
      titleField: spec.title?.field ?? '',
      subtitleField: spec.subtitle?.field ?? '',
      subtitleMaxLines: spec.subtitle?.maxLines ?? 2,
    },
    rows: (spec.rows ?? []).map((r) => ({
      label: r.label,
      field: r.field,
      format: r.format ?? 'text',
    })),
  };
}

/** Read the form back into a pruned, serializable card spec (omits empty fields). */
export function formToSpec(values: CardSpecFields): HoverElementPreviewCardSpec {
  const { card, rows } = values;
  const spec: HoverElementPreviewCardSpec = {};
  if (card.titleField.trim()) spec.title = { field: card.titleField.trim() };
  if (card.subtitleField.trim()) {
    spec.subtitle = { field: card.subtitleField.trim(), maxLines: card.subtitleMaxLines };
  }
  if (card.imageField.trim()) spec.image = { field: card.imageField.trim(), shape: card.imageShape };

  const outRows: PreviewRowSpec[] = rows
    .filter((r) => r.label.trim() && r.field.trim())
    .map((r) =>
      r.format === 'text'
        ? { label: r.label.trim(), field: r.field.trim() }
        : { label: r.label.trim(), field: r.field.trim(), format: r.format },
    );
  if (outRows.length > 0) spec.rows = outRows;
  return spec;
}
