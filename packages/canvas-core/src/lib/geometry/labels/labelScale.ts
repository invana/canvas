import type { LabelSizePolicy } from '../../../contracts/IElementRenderer';

/**
 * The scale to draw a label at so its on-screen font size follows `policy`.
 *
 * Positional arguments, not an options object: the renderer calls this once per
 * label per zoom-changed frame, so it must not allocate.
 *
 * @param fontSize  The label's authored font size — its on-screen size at zoom `1`.
 * @param zoom      Current camera zoom (`camera.scale`).
 * @param hostScale Visual scale the label inherits from its host before any label
 *   scaling — e.g. a node-size LOD drawing the node at `1 / zoom`; `1` for
 *   connectors. Excludes display-only magnification (a fisheye lens), which
 *   should still enlarge the label.
 * @param policy    The policy in force, or `null` for none.
 * @param contained `true` when the label must stay inside its host (an `inside-*`
 *   placement): the result never exceeds `1`, so the host's fit-to-box budget holds.
 *
 * - `natural = fontSize × zoom × hostScale` — what the label measures on
 *   screen with no policy.
 * - `target = zoomGrowth === undefined ? natural : fontSize × zoom ^ zoomGrowth`,
 *   then clamped to `[minFontPx, maxFontPx]`.
 * - Result: `target / natural`, capped at `1` for a contained label.
 *
 * Returns `1` for a `null` policy and for degenerate input (non-positive font
 * size, zoom or host scale), so a caller can apply the result unconditionally.
 *
 * @example
 * ```ts
 * resolveLabelScale(12, 4, 1, { maxFontPx: 20 });
 * // → 20 / 48 ≈ 0.417 — the label reads 20px on screen instead of 48px
 * ```
 */
export function resolveLabelScale(
  fontSize: number,
  zoom: number,
  hostScale: number,
  policy: LabelSizePolicy | null,
  contained = false,
): number {
  if (policy === null) return 1;
  if (!(fontSize > 0) || !(zoom > 0) || !(hostScale > 0)) return 1;

  const natural = fontSize * zoom * hostScale;
  let target =
    policy.zoomGrowth === undefined
      ? natural
      : fontSize * Math.pow(zoom, clampUnit(policy.zoomGrowth));
  if (policy.minFontPx !== undefined && target < policy.minFontPx) target = policy.minFontPx;
  if (policy.maxFontPx !== undefined && target > policy.maxFontPx) target = policy.maxFontPx;

  const scale = target / natural;
  return contained && scale > 1 ? 1 : scale;
}

/** Clamp to `[0, 1]`; a non-finite value falls back to `1` (grow with the world). */
function clampUnit(v: number): number {
  if (!Number.isFinite(v)) return 1;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
