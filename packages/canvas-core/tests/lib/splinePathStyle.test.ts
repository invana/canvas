/**
 * `splinePathStyle` — a layout engine's curve drawn from its control points.
 * The fixture is the shape elkjs 0.9.3 returns for a `SPLINES` section:
 * start, `3k − 1` bend points, end.
 */
import { describe, expect, it } from 'vitest';
import { splinePathStyle } from '../../src/lib/geometry/connectors/pathStyles/spline';

const anchorS = { x: 72, y: 37 };
const anchorT = { x: 182, y: 42 };

describe('splinePathStyle', () => {
  it('reads the waypoints as a cubic Bézier chain', () => {
    const chain = [
      anchorS,
      { x: 87, y: 23 },
      { x: 95, y: 23 },
      { x: 103, y: 23 },
      { x: 160, y: 23 },
      { x: 167, y: 23 },
      anchorT,
    ];
    const path = splinePathStyle([anchorS, ...chain, anchorT], undefined, undefined);
    expect(path.map((c) => c.kind)).toEqual(['M', 'C', 'C']);
    expect(path[1]).toMatchObject({ c1x: 87, c1y: 23, c2x: 95, c2y: 23, x: 103, y: 23 });
    expect(path[2]).toMatchObject({ x: 182, y: 42 });
  });

  it('draws a polyline when the waypoints are not a chain', () => {
    const path = splinePathStyle(
      [anchorS, { x: 100, y: 10 }, { x: 140, y: 10 }, anchorT],
      undefined,
      undefined,
    );
    expect(path.map((c) => c.kind)).toEqual(['M', 'L', 'L', 'L']);
  });
});
