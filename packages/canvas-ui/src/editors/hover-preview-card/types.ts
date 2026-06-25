import type { PreviewRowFormat } from '@invana/graph';

/** Avatar shape options for the preview card. */
export type CardImageShape = 'rounded' | 'circle';

/** Scalar (non-array) fields of the card editor — image / title / subtitle. */
export interface CardScalarFields {
  /** Dotted field path for the avatar image (blank → no image). */
  imageField: string;
  imageShape: CardImageShape;
  /** Dotted field path for the title. */
  titleField: string;
  /** Dotted field path for the subtitle. */
  subtitleField: string;
  subtitleMaxLines: number;
}

/** One property-row entry. */
export interface CardRowField {
  label: string;
  field: string;
  format: PreviewRowFormat;
}

/**
 * The editor's react-hook-form state — scalars under `card` (rendered by an
 * `ObjectField`) and `rows` as a `useFieldArray`. `specToForm` / `formToSpec`
 * bridge this and the serializable `HoverElementPreviewCardSpec`.
 */
export interface CardSpecFields {
  card: CardScalarFields;
  rows: CardRowField[];
}
