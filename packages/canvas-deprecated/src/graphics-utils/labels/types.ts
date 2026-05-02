// ── Label types ───────────────────────────────────────────────────────────────
// Visual styling only. Positioning (where the label sits relative to a node or
// edge) lives in the higher-level NodeLabelSpec / EdgeLabelSpec types in
// plugins-shapes — those extend LabelStyle to add a `position` field.

/**
 * Underlying text-rendering backend.
 *
 * - `'text'` — `PIXI.Text` with `resolution = min(devicePixelRatio, 2)`. Sharp,
 *   supports rich text styling (stroke, drop shadow, gradient fill). Default.
 * - `'bitmap'` — `PIXI.BitmapText` rendered from a font atlas. Fastest for
 *   large graphs; requires the bitmap font to be preloaded via
 *   `Assets.load(fontUrl)`.
 * - `'html'` — `PIXI.HTMLText`. Reserved for future use; currently throws if
 *   selected.
 */
export type LabelRenderer = 'text' | 'bitmap' | 'html';

/** Padding around the text inside the label background. */
export type LabelPadding =
  | number
  | [paddingX: number, paddingY: number]
  | [top: number, right: number, bottom: number, left: number];

/**
 * Background styling for a label (a rounded rect drawn behind the text).
 * Omitted entirely → no background drawn.
 */
export interface LabelBackgroundStyle {
  /** Fill colour. Default `'#1f2937'`. */
  fill?: string;
  /** Stroke colour. Default: no stroke. */
  stroke?: string;
  /** Stroke width in world-space pixels. Default `0`. */
  strokeWidth?: number;
  /** Padding between text bounds and background edge. Default `4`. */
  padding?: LabelPadding;
  /** Corner radius. Default `4`. */
  radius?: number;
  /** Background alpha. Default `1`. */
  opacity?: number;
}

/**
 * Visual styling for a label (text + optional background).
 *
 * @remarks
 * Positioning is handled by the consumer — for nodes via {@link NodeLabelSpec}
 * (re-exported from `@invana/plugins-shapes-deprecated`), for edges via
 * {@link EdgeLabelSpec}. This type only describes how the label *looks*, not
 * where it sits.
 */
export interface LabelStyle {
  /** Font family. Default `'sans-serif'`. */
  fontFamily?: string;
  /** Font size in world-space pixels. Default `12`. */
  fontSize?: number;
  /** Font weight. Default `'normal'`. */
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  /** Font style. Default `'normal'`. */
  fontStyle?: 'normal' | 'italic' | 'oblique';
  /** Text fill colour. Default `'#ffffff'`. */
  fill?: string;
  /**
   * Text outline colour. Useful for legibility on busy backgrounds (notably
   * edge labels sitting on top of edge lines). Default: no stroke.
   */
  stroke?: string;
  /** Text outline width. Default `0`. */
  strokeWidth?: number;
  /** Text opacity (applies to text + background). Default `1`. */
  opacity?: number;
  /** Horizontal alignment for multi-line text. Default `'center'`. */
  align?: 'left' | 'center' | 'right';

  /**
   * Maximum width in world-space pixels. When set:
   * - `wordWrap: true` wraps onto multiple lines.
   * - `wordWrap: false` (default) truncates with an ellipsis.
   */
  maxWidth?: number;
  /** Wrap onto multiple lines instead of truncating. Default `false`. */
  wordWrap?: boolean;
  /** Maximum number of lines. Lines beyond this are truncated with `…`. */
  maxLines?: number;

  /** Optional rounded-rect background. Omit for no background. */
  background?: LabelBackgroundStyle;
  /** Text-rendering backend. Default `'text'`. */
  renderer?: LabelRenderer;
  /**
   * Per-label rasterization resolution override (PIXI.Text only). When set,
   * pins this label's `resolution` and prevents a `LabelResolutionPlugin`
   * from overwriting it. Useful for hero/title labels that must stay sharp
   * regardless of global policy. Bitmap renderers ignore this field.
   */
  resolution?: number;
}
