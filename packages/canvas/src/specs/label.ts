/**
 * Label content and styling. Describes text; renders none of it.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

export interface HtmlTagStyle {
  readonly fontFamily?: string;
  readonly fontSize?: number | string;
  readonly fontWeight?: number | string;
  readonly fontStyle?: 'normal' | 'italic' | 'oblique';
  readonly fill?: number | string;
  readonly letterSpacing?: number;
  readonly textDecoration?: string;
}

/**
 * The visible content of a `LabelDecoration`. Two variants:
 *
 * - `'text'` — plain Pixi `Text`. Single style, fast, comfortable up to a few
 *   thousand visible labels. Supports wrap / maxLines / ellipsis via Pixi's
 *   built-in word-wrap plus a truncation pass.
 * - `'html-text'` — Pixi `HTMLText`. Inline tags (`<b>`, `<i>`, custom tags
 *   via `tagStyles`) and CSS overrides. Each instance rasterises HTML to a
 *   canvas, so this kind is suitable for tens to a couple hundred visible
 *   labels — not for graph-wide use.
 *
 * `bitmap-text` (Pixi `BitmapText`) is planned as a third kind for very-high-
 * density graphs; not in v0.
 */

export type LabelContent =
  | {
      readonly kind: 'text';
      readonly text: string;
      readonly fontFamily?: string;            // default 'sans-serif'
      readonly fontSize?: number;              // default 12 (px)
      readonly fontWeight?: number | string;   // default 400
      readonly fontStyle?: 'normal' | 'italic';
      readonly fontVariant?: 'normal' | 'small-caps';
      readonly letterSpacing?: number;
      readonly lineHeight?: number;
      /** Fill colour as hex. Default `0x111827` (near-black). */
      readonly fill?: number;
      readonly stroke?: { color: number; width: number };
      /** Drop shadow on text glyphs (distinct from background pill shadow). */
      readonly shadow?: {
        color: number;
        blur?: number;
        offsetX?: number;
        offsetY?: number;
        alpha?: number;
      };
      readonly alpha?: number;
      /** Horizontal alignment when wrap produces multiple lines. */
      readonly align?: 'left' | 'center' | 'right';
    }
  | {
      readonly kind: 'html-text';
      readonly html: string;
      /** Base style applied when no tag override matches. */
      readonly defaultFontFamily?: string;
      readonly defaultFontSize?: number;
      readonly defaultFill?: number | string;
      readonly defaultFontWeight?: number | string;
      /**
       * Fixed render width for `HTMLText`. Required for word-wrap; Pixi
       * `HTMLText` needs an explicit width to know when to break lines.
       */
      readonly width?: number;
      /**
       * Per-tag style overrides (e.g. `{ b: { fontWeight: 700 }, hl: { fill: '#facc15' } }`).
       * Custom tags are supported — Pixi forwards them to its tag stylesheet.
       */
      readonly tagStyles?: Readonly<Record<string, HtmlTagStyle>>;
      /**
       * Raw CSS rules injected as a `<style>` block before the HTML body —
       * useful for loading icon fonts or `@font-face` declarations referenced
       * by the inline HTML.
       */
      readonly cssOverrides?: ReadonlyArray<string>;
      readonly alpha?: number;
    };

/** Background pill drawn behind a label's text. Optional. */

export interface LabelBackground {
  readonly fill?: number;
  readonly fillAlpha?: number;             // default 1
  readonly stroke?: number;
  readonly strokeAlpha?: number;
  readonly strokeWidth?: number;           // default 1
  /** Uniform radius or per-corner [tl, tr, br, bl]. */
  readonly radius?: number | readonly [number, number, number, number];
  /** Uniform padding, [v,h], or [t,r,b,l]. */
  readonly padding?: number | readonly [number, number] | readonly [number, number, number, number];
  readonly shadow?: {
    color: number;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
    alpha?: number;
  };
}

/** Wrap / overflow controls. Applies to both plain text and HTML text. */

export interface LabelWrap {
  /** Pixel cap on render width. Triggers word-wrap when set. */
  readonly maxWidth?: number;
  /**
   * Pixel cap on render height. Combined with the text's `lineHeight` (read
   * from `LabelContent.lineHeight` or derived from `fontSize`) to derive an
   * effective `maxLines = floor(maxHeight / lineHeight)`. If both `maxHeight`
   * and `maxLines` are set, the smaller (more restrictive) wins.
   */
  readonly maxHeight?: number;
  /** Cap on rendered lines; lines past this are dropped (after `overflow`). */
  readonly maxLines?: number;
  /** Enable wrap explicitly; auto-true when `maxWidth` is set. */
  readonly wordWrap?: boolean;
  /** Truncation policy for content past `maxLines`. Default `'ellipsis'`. */
  readonly overflow?: 'clip' | 'ellipsis';
}

/** Per-label LOD — hides the label outside the zoom range. */

export interface LabelVisibility {
  readonly minZoom?: number;
  readonly maxZoom?: number;
}

/**
 * Common style block shared by shape- and connector-anchored labels.
 * Placement / offset / rotation specifics live on the host-specific spec.
 */

export interface LabelStyleCommon {
  readonly content: LabelContent;
  readonly background?: LabelBackground;
  readonly wrap?: LabelWrap;
  /** Screen-space offset in pixels applied *after* any auto-rotation. */
  readonly offset?: { readonly x?: number; readonly y?: number };
  readonly alpha?: number;
  /** Per-label zoom-band LOD; the decoration mounts/unmounts on threshold. */
  readonly visibility?: LabelVisibility;
  /** Cursor on hover when the label container has hit-testing enabled. */
  readonly cursor?: string;
  /** Pointer events enabled on the label container. Default `false`. */
  readonly interactive?: boolean;
  /**
   * Read by `LabelCollisionBehaviour` only — the primitive ignores these.
   * `priority` higher wins ties when collision hides overlap. `collisionGroup`
   * partitions the collision graph (labels in different groups never compete).
   * `forceShow: true` bypasses collision entirely.
   */
  readonly priority?: number;
  readonly collisionGroup?: string;
  readonly forceShow?: boolean;
  /**
   * Floor used by the shrink → truncate → hide fit cascade when an
   * `inside-*` placement requires the label to stay inside the host shape.
   * Below this size, the cascade moves on to truncation (ellipsis) and
   * finally hide. Default `9` (px). Ignored for non-`inside-*` placements.
   */
  readonly minFontSize?: number;
}

/**
 * Placement options for a shape-anchored label.
 *
 * Two semantic groups distinguished by the `inside-` prefix:
 *
 * - **Anchor-only placements** — `'center'` plus the 8 outside sides /
 *   corners (`'top'`, `'top-right'`, ..., `'top-left'`). The label is
 *   positioned at the anchor and sized freely per `LabelWrap`; it may
 *   extend past the host shape's bounds.
 * - **Inside placements** (`'inside-*'`) — carry a *containment contract*:
 *   the label must stay inside the host shape's inner box. The decoration
 *   runs a shrink → truncate → hide fit cascade against the per-placement
 *   inner box to enforce this. Use these for sunburst wedges, treemap
 *   cells, pack circles — anywhere the label must not overflow.
 *
 * `'center'` and `'inside-center'` share the geometric anchor (shape
 * centre) but differ in containment: `'center'` may overflow, `'inside-center'`
 * may not. They are distinct values, not aliases.
 */

export type ShapeLabelPlacement =
  | 'center'
  | 'top' | 'top-right' | 'right' | 'bottom-right'
  | 'bottom' | 'bottom-left' | 'left' | 'top-left'
  | 'inside-top' | 'inside-top-right' | 'inside-right' | 'inside-bottom-right'
  | 'inside-bottom' | 'inside-bottom-left' | 'inside-left' | 'inside-top-left'
  | 'inside-center';

/** Style payload passed to `setDecoration(id, 'label', { kind: 'label', style })`. */

export interface ShapeLabelStyle extends LabelStyleCommon {
  /** Default `'bottom'`. */
  readonly placement?: ShapeLabelPlacement;
  /** Manual rotation in radians (rare — outside-side labels read upright). */
  readonly rotation?: number;
}

/**
 * Placement along a connector path. `'start' | 'center' | 'end'` map to t=0,
 * t=0.5, t=1; numeric `t` is treated literally and clamped to [0, 1].
 */

export type ConnectorLabelPlacement = 'start' | 'center' | 'end' | number;

/** Style payload for connector labels. */

export interface ConnectorLabelStyle extends LabelStyleCommon {
  /** Default `'center'`. */
  readonly placement?: ConnectorLabelPlacement;
  /**
   * Distance to shift along the path tangent, in pixels. Positive = toward
   * target; negative = toward source. Use this for "pad 24px from source".
   */
  readonly pathOffset?: number;
  /** Rotate the label so its baseline follows the path tangent. Default `true`. */
  readonly autoRotate?: boolean;
  /**
   * When `autoRotate` is on, flip the label by π if the tangent angle lies in
   * (π/2, 3π/2) — keeps reading direction upright. Default `true`.
   */
  readonly keepUpright?: boolean;
}

// ─── Render stats ──────────────────────────────────────────────────────────
