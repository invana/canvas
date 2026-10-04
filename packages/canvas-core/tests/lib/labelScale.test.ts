/**
 * `resolveLabelScale` — the on-screen label-size maths behind
 * `IElementRenderer.setLabelSizePolicy`. The expected values are the worked
 * examples in `docs/rfcs/feat/2026-10-04-labels-balloon-on-zoom-and-edge-labels-have-no-lod.md`
 * (§2.2 E1, E2), so the RFC tables and the engine cannot drift apart.
 */

import { describe, expect, it } from 'vitest';

import { resolveLabelScale } from '../../src/lib/geometry/labels';
import type { LabelSizePolicy } from '../../src/contracts/IElementRenderer';

/** On-screen font px the label ends up at: natural size × the resolved scale. */
function onScreenPx(fontSize: number, zoom: number, policy: LabelSizePolicy | null, hostScale = 1): number {
  return fontSize * zoom * hostScale * resolveLabelScale(fontSize, zoom, hostScale, policy);
}

describe('resolveLabelScale', () => {
  it('is 1 with no policy and with an empty one', () => {
    expect(resolveLabelScale(12, 4, 1, null)).toBe(1);
    expect(resolveLabelScale(12, 4, 1, {})).toBe(1);
  });

  it('E1 — clamps only: floor 10px, cap 20px, otherwise grows with the world', () => {
    const policy = { minFontPx: 10, maxFontPx: 20 };
    expect(onScreenPx(12, 0.5, policy)).toBeCloseTo(10);
    expect(onScreenPx(12, 1, policy)).toBeCloseTo(12);
    expect(onScreenPx(12, 1.5, policy)).toBeCloseTo(18);
    expect(onScreenPx(12, 2, policy)).toBeCloseTo(20);
    expect(onScreenPx(12, 4, policy)).toBeCloseTo(20);
  });

  it('E2 — zoomGrowth 0.5 grows with √zoom, then caps', () => {
    const policy = { zoomGrowth: 0.5, maxFontPx: 24 };
    expect(onScreenPx(12, 0.25, policy)).toBeCloseTo(6);
    expect(onScreenPx(12, 1, policy)).toBeCloseTo(12);
    expect(onScreenPx(12, 4, policy)).toBeCloseTo(24);
    expect(onScreenPx(12, 9, policy)).toBeCloseTo(24);
  });

  it('zoomGrowth 0 keeps each label at its own font size on screen', () => {
    expect(onScreenPx(12, 0.3, { zoomGrowth: 0 })).toBeCloseTo(12);
    expect(onScreenPx(12, 7, { zoomGrowth: 0 })).toBeCloseTo(12);
    expect(onScreenPx(18, 7, { zoomGrowth: 0 })).toBeCloseTo(18);
  });

  it('cancels a host LOD scale once zoomGrowth is set, and keeps it otherwise', () => {
    // A node-size LOD draws the host at 1/zoom: the label is pixel-constant.
    const zoom = 5;
    const hostScale = 1 / zoom;
    expect(onScreenPx(12, zoom, { zoomGrowth: 1 }, hostScale)).toBeCloseTo(60);
    // Without zoomGrowth the host's size is the natural size; clamps still bound it.
    expect(onScreenPx(12, zoom, { maxFontPx: 10 }, hostScale)).toBeCloseTo(10);
    expect(onScreenPx(12, zoom, { maxFontPx: 30 }, hostScale)).toBeCloseTo(12);
  });

  it('never grows a contained (inside-*) label past its natural size', () => {
    const grow = { minFontPx: 20 };
    expect(resolveLabelScale(12, 0.5, 1, grow, true)).toBe(1);
    const shrink = { maxFontPx: 12 };
    expect(
      resolveLabelScale(12, 4, 1, shrink, true),
    ).toBeCloseTo(0.25);
  });

  it('clamps zoomGrowth to [0, 1] and returns 1 for degenerate input', () => {
    expect(onScreenPx(12, 4, { zoomGrowth: 3 })).toBeCloseTo(48);
    expect(onScreenPx(12, 4, { zoomGrowth: -1 })).toBeCloseTo(12);
    expect(resolveLabelScale(0, 2, 1, { zoomGrowth: 0 })).toBe(1);
    expect(resolveLabelScale(12, 0, 1, { zoomGrowth: 0 })).toBe(1);
  });
});
