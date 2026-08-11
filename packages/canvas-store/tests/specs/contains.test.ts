/**
 * Headless picking — `containsSpec` answers from the spec alone, with no
 * renderer, no canvas and no GPU. That is the gate for P4 in
 * `docs/renderer-split-design.md`: if these pass, hit-testing survives the
 * renderer extraction and both backends agree by construction.
 *
 * Each kind is checked four ways: a point clearly inside, one clearly outside,
 * one on the stroke band (where the tolerance is the whole answer), and — for
 * the polygon family — a point in a concave notch, which is what separates a
 * real containment test from a bounding-box check.
 */

import { describe, expect, it } from 'vitest';
import {
  containsSpec,
  strokeBandOf,
} from '../../src/specs/shapeGeometry/contains';
import type {
  ArcSpec,
  CircleSpec,
  CompositeSpec,
  EllipseSpec,
  PathSpec,
  PolygonSpec,
  RectSpec,
  RegularPolygonSpec,
  StarSpec,
  TabbedRectSpec,
} from '../../src/specs';

/** Solid black — enough to make a silhouette filled, which is what matters. */
const FILL = 0x000000;

describe('strokeBandOf', () => {
  it('splits the width by alignment, pixi-style', () => {
    expect(strokeBandOf(undefined)).toEqual({ outer: 0, inner: 0 });
    expect(strokeBandOf({ color: 0, width: 4 })).toEqual({ outer: 2, inner: 2 });
    expect(strokeBandOf({ color: 0, width: 4, alignment: 'outside' })).toEqual({
      outer: 4,
      inner: 0,
    });
    expect(strokeBandOf({ color: 0, width: 4, alignment: 'inside' })).toEqual({
      outer: 0,
      inner: 4,
    });
  });

  it('treats a zero-width stroke as no stroke — nothing is painted', () => {
    expect(strokeBandOf({ color: 0, width: 0 })).toEqual({ outer: 0, inner: 0 });
  });
});

describe('containsSpec — circle', () => {
  const spec: CircleSpec = { kind: 'circle', x: 0, y: 0, radius: 10, fill: FILL };

  it('contains its interior and excludes its exterior', () => {
    expect(containsSpec(spec, 0, 0)).toBe(true);
    expect(containsSpec(spec, 9.9, 0)).toBe(true);
    expect(containsSpec(spec, 10.1, 0)).toBe(false);
    expect(containsSpec(spec, 8, 8)).toBe(false); // r = 11.3
  });

  it('widens by half the stroke width', () => {
    const stroked: CircleSpec = { ...spec, stroke: { color: 0xff0000, width: 4 } };
    expect(containsSpec(stroked, 11.9, 0)).toBe(true);
    expect(containsSpec(stroked, 12.1, 0)).toBe(false);
  });

  it('is hollow with no fill — only the stroke band answers', () => {
    const outline: CircleSpec = {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 10,
      stroke: { color: 0xff0000, width: 4 },
    };
    expect(containsSpec(outline, 0, 0)).toBe(false); // the middle is empty
    expect(containsSpec(outline, 7.9, 0)).toBe(false); // inside the hole
    expect(containsSpec(outline, 10, 0)).toBe(true); // on the outline
    expect(containsSpec(outline, 11.9, 0)).toBe(true); // outer half of the band
  });

  it('honours an explicit tolerance over the spec stroke', () => {
    expect(containsSpec(spec, 14, 0, 5)).toBe(true);
    expect(containsSpec(spec, 16, 0, 5)).toBe(false);
  });
});

describe('containsSpec — ellipse', () => {
  const spec: EllipseSpec = {
    kind: 'ellipse',
    x: 0,
    y: 0,
    radiusX: 20,
    radiusY: 10,
    fill: FILL,
  };

  it('respects both radii independently', () => {
    expect(containsSpec(spec, 19, 0)).toBe(true);
    expect(containsSpec(spec, 21, 0)).toBe(false);
    expect(containsSpec(spec, 0, 9)).toBe(true);
    expect(containsSpec(spec, 0, 11)).toBe(false);
  });

  it('widens by half the stroke width', () => {
    const stroked: EllipseSpec = { ...spec, stroke: { color: 0, width: 2 } };
    expect(containsSpec(stroked, 20.5, 0)).toBe(true);
    expect(containsSpec(stroked, 21.5, 0)).toBe(false);
  });
});

describe('containsSpec — rect', () => {
  const spec: RectSpec = { kind: 'rect', x: 0, y: 0, width: 100, height: 50, fill: FILL };

  it('is anchored top-left', () => {
    expect(containsSpec(spec, 50, 25)).toBe(true);
    expect(containsSpec(spec, 0, 0)).toBe(true);
    expect(containsSpec(spec, -1, 25)).toBe(false);
    expect(containsSpec(spec, 101, 25)).toBe(false);
    expect(containsSpec(spec, 50, 51)).toBe(false);
  });

  it('cuts the fillet out of a rounded corner', () => {
    const rounded: RectSpec = { ...spec, cornerRadius: 10 };
    expect(containsSpec(rounded, 10, 10)).toBe(true); // the fillet centre
    expect(containsSpec(rounded, 0.5, 0.5)).toBe(false); // past the curve
    expect(containsSpec(spec, 0.5, 0.5)).toBe(true); // sharp corner: still inside
  });

  it('widens by half the stroke width', () => {
    const stroked: RectSpec = { ...spec, stroke: { color: 0, width: 4 } };
    expect(containsSpec(stroked, -1.5, 25)).toBe(true);
    expect(containsSpec(stroked, -2.5, 25)).toBe(false);
  });
});

describe('containsSpec — polygon', () => {
  // A square with a V notch cut up from the bottom edge to the centre.
  const spec: PolygonSpec = {
    kind: 'polygon',
    x: 0,
    y: 0,
    fill: FILL,
    vertices: [
      { x: -20, y: -20 },
      { x: 20, y: -20 },
      { x: 20, y: 20 },
      { x: 0, y: 0 },
      { x: -20, y: 20 },
    ],
  };

  it('contains the body and excludes the exterior', () => {
    expect(containsSpec(spec, 0, -10)).toBe(true);
    expect(containsSpec(spec, 12, 8)).toBe(true);
    expect(containsSpec(spec, 25, 0)).toBe(false);
  });

  it('excludes the concave notch — the point is inside the AABB but outside the shape', () => {
    expect(containsSpec(spec, 0, 10)).toBe(false);
    expect(containsSpec(spec, 0, 19)).toBe(false);
  });

  it('does not let a stroke bridge the notch', () => {
    const stroked: PolygonSpec = { ...spec, stroke: { color: 0, width: 4 } };
    // Deep in the notch, more than 2px from either edge of the V.
    expect(containsSpec(stroked, 0, 10)).toBe(false);
    // Just past the notch's apex, within the band of the edge running to it.
    expect(containsSpec(stroked, 0, 2)).toBe(true);
  });
});

describe('containsSpec — regular-polygon', () => {
  // Pointy-top hexagon: vertex straight up at r = 20, apothem 20·cos(30°) ≈ 17.32.
  const spec: RegularPolygonSpec = {
    kind: 'regular-polygon',
    x: 0,
    y: 0,
    sides: 6,
    radius: 20,
    fill: FILL,
  };

  it('is tighter than its bounding box along the flat sides', () => {
    expect(containsSpec(spec, 0, 0)).toBe(true);
    expect(containsSpec(spec, 0, -19)).toBe(true); // up the pointy axis
    expect(containsSpec(spec, 0, -21)).toBe(false);
    expect(containsSpec(spec, 17, 0)).toBe(true); // inside the apothem
    expect(containsSpec(spec, 18, 0)).toBe(false); // past the flat side
  });

  it('widens by half the stroke width', () => {
    const stroked: RegularPolygonSpec = { ...spec, stroke: { color: 0, width: 4 } };
    expect(containsSpec(stroked, 19, 0)).toBe(true);
    expect(containsSpec(stroked, 20, 0)).toBe(false);
  });
});

describe('containsSpec — star', () => {
  const spec: StarSpec = {
    kind: 'star',
    x: 0,
    y: 0,
    points: 5,
    innerRadius: 8,
    outerRadius: 20,
    fill: FILL,
  };

  it('contains a spike but not the gap between two spikes', () => {
    expect(containsSpec(spec, 0, 0)).toBe(true);
    expect(containsSpec(spec, 0, -19)).toBe(true); // along the up spike
    expect(containsSpec(spec, 0, -21)).toBe(false);
    // Half-way between two spikes at r = 15, well past the inner radius.
    const a = -Math.PI / 2 + Math.PI / 5;
    expect(containsSpec(spec, Math.cos(a) * 15, Math.sin(a) * 15)).toBe(false);
  });
});

describe('containsSpec — tabbed-rect', () => {
  // 100 × 50 body under a 40 × 20 tab, flush left. Full AABB is 100 × 70.
  const spec: TabbedRectSpec = {
    kind: 'tabbed-rect',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    tabWidth: 40,
    tabHeight: 20,
    fill: FILL,
  };

  it('contains the body and the tab', () => {
    expect(containsSpec(spec, 50, 40)).toBe(true);
    expect(containsSpec(spec, 10, 10)).toBe(true);
  });

  it('excludes the AABB corner the tab does not reach', () => {
    // Inside the 100 × 70 box, but to the right of a 40-wide tab.
    expect(containsSpec(spec, 80, 5)).toBe(false);
  });

  it('widens by half the stroke width', () => {
    const stroked: TabbedRectSpec = { ...spec, stroke: { color: 0, width: 2 } };
    expect(containsSpec(stroked, 100.5, 40)).toBe(true);
    expect(containsSpec(stroked, 101.5, 40)).toBe(false);
  });

  it('collapses onto the tab alone when the body is gone', () => {
    const closed: TabbedRectSpec = { ...spec, height: 0 };
    expect(containsSpec(closed, 10, 10)).toBe(true);
    expect(containsSpec(closed, 50, 10)).toBe(false); // past the 40-wide tab
    expect(containsSpec(closed, 10, 40)).toBe(false); // below the tab: no body
  });
});

describe('containsSpec — arc', () => {
  // Quarter annulus, 3 o'clock to 6 o'clock (y grows down).
  const spec: ArcSpec = {
    kind: 'arc',
    x: 0,
    y: 0,
    innerR: 10,
    outerR: 20,
    startAngle: 0,
    endAngle: Math.PI / 2,
    fill: FILL,
  };
  const at = (r: number, a: number): [number, number] => [Math.cos(a) * r, Math.sin(a) * r];

  it('is bounded radially and angularly', () => {
    expect(containsSpec(spec, ...at(15, Math.PI / 4))).toBe(true);
    expect(containsSpec(spec, ...at(5, Math.PI / 4))).toBe(false); // inside the hole
    expect(containsSpec(spec, ...at(25, Math.PI / 4))).toBe(false); // past the rim
    expect(containsSpec(spec, ...at(15, Math.PI))).toBe(false); // outside the sweep
  });

  it('widens by half the stroke width, radially and along the radial edges', () => {
    const stroked: ArcSpec = { ...spec, stroke: { color: 0, width: 2 } };
    expect(containsSpec(stroked, ...at(20.5, Math.PI / 4))).toBe(true);
    expect(containsSpec(stroked, ...at(21.5, Math.PI / 4))).toBe(false);
    // Just past the 0-radian edge, within the band around it.
    expect(containsSpec(stroked, 15, -0.5)).toBe(true);
    expect(containsSpec(stroked, 15, -1.5)).toBe(false);
  });

  it('accepts a full sweep as a disc / annulus', () => {
    const ring: ArcSpec = { ...spec, endAngle: Math.PI * 2 };
    expect(containsSpec(ring, ...at(15, Math.PI))).toBe(true);
    expect(containsSpec(ring, ...at(5, Math.PI))).toBe(false);
  });
});

describe('containsSpec — path', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it('fills a closed run', () => {
    const spec: PathSpec = { kind: 'path', x: 0, y: 0, points: square, closed: true, fill: FILL };
    expect(containsSpec(spec, 5, 5)).toBe(true);
    expect(containsSpec(spec, 11, 5)).toBe(false);
  });

  it('an open, unfilled run answers along its stroke only', () => {
    const spec: PathSpec = {
      kind: 'path',
      x: 0,
      y: 0,
      points: square,
      stroke: { color: 0, width: 4 },
    };
    expect(containsSpec(spec, 5, 5)).toBe(false); // no interior: nothing was filled
    expect(containsSpec(spec, 5, 1)).toBe(true); // on the top edge's band
    expect(containsSpec(spec, 5, 3)).toBe(false); // past the band
    expect(containsSpec(spec, 10, 5)).toBe(true); // the right edge is drawn…
    // …but the closing edge (last point back to first) is not, so it has no band.
    expect(containsSpec(spec, 0, 5)).toBe(false);
  });

  it('a two-point run is a line with a stroke band', () => {
    const spec: PathSpec = {
      kind: 'path',
      x: 0,
      y: 0,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      stroke: { color: 0, width: 4 },
    };
    expect(containsSpec(spec, 5, 0)).toBe(true);
    expect(containsSpec(spec, 5, 1.9)).toBe(true);
    expect(containsSpec(spec, 5, 2.1)).toBe(false);
    expect(containsSpec(spec, 13, 0)).toBe(false);
  });
});

describe('containsSpec — composite', () => {
  const base = { kind: 'composite', x: 0, y: 0, width: 100, height: 60 } as const;

  it('uses the default rounded-rect root, filled from the composite spec', () => {
    const spec: CompositeSpec = { ...base, fill: FILL, parts: [] };
    expect(containsSpec(spec, 50, 30)).toBe(true);
    expect(containsSpec(spec, -1, 30)).toBe(false);
    expect(containsSpec(spec, 50, 61)).toBe(false);
  });

  it('centres a borrowed root in the card box', () => {
    const spec: CompositeSpec = {
      ...base,
      parts: [],
      root: { kind: 'circle', x: 0, y: 0, radius: 20, fill: FILL },
    };
    expect(containsSpec(spec, 50, 30)).toBe(true); // box centre = circle centre
    expect(containsSpec(spec, 5, 30)).toBe(false); // inside the box, outside the disc
    expect(containsSpec(spec, 69, 30)).toBe(true);
    expect(containsSpec(spec, 71, 30)).toBe(false);
  });

  it('widens by the root stroke, not the composite spec stroke, when a root is given', () => {
    const spec: CompositeSpec = {
      ...base,
      parts: [],
      root: {
        kind: 'circle',
        x: 0,
        y: 0,
        radius: 20,
        fill: FILL,
        stroke: { color: 0, width: 4 },
      },
    };
    expect(containsSpec(spec, 71.9, 30)).toBe(true);
    expect(containsSpec(spec, 72.1, 30)).toBe(false);
  });

  it('picks up a filled part even when the card body is hollow', () => {
    const spec: CompositeSpec = {
      ...base,
      parts: [{ part: 'rect', x: 10, y: 10, width: 20, height: 10, fill: 0x3b82f6 }],
    };
    expect(containsSpec(spec, 50, 30)).toBe(false); // no fill anywhere on the root
    expect(containsSpec(spec, 15, 15)).toBe(true); // …but the accent bar is solid
    expect(containsSpec(spec, 35, 15)).toBe(false); // just past it
  });

  it('ignores label parts — they are children, not painted geometry', () => {
    const spec: CompositeSpec = {
      ...base,
      parts: [{ part: 'label', x: 10, y: 10, text: 'hello' }],
    };
    expect(containsSpec(spec, 12, 12)).toBe(false);
  });
});

describe('containsSpec — unknown kinds', () => {
  it('answers undefined so the caller can fall back to the instance', () => {
    expect(containsSpec({ kind: 'hexagon-of-doom', x: 0, y: 0 }, 0, 0)).toBeUndefined();
  });
});
