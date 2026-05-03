/**
 * Built-in marker primitives — `arrow`, `circle`, `square`, `diamond`.
 *
 * Each marker owns a `Graphics` + a parent `Container`. The container is
 * positioned at the marker's anchor and rotated to align with the supplied
 * tangent. The `Graphics` contents are drawn once at construction in
 * marker-local coordinates centred on `(0, 0)` and pointing along `+x`;
 * the parent rotation does the work of orienting them to the connector
 * direction. This keeps `draw()` cheap (just position + rotation update)
 * which matters for connector-heavy scenes.
 *
 * Default style: black, alpha 1, size 8 px (fill side; arrow uses size as
 * total length). Connectors override via `MarkerOptions`.
 */

import { Container, Graphics } from 'pixi.js';
import type { IMarker, MarkerHostInfo, MarkerOptions, Point, Vec2 } from '../types';

const DEFAULT_COLOR = 0x000000;
const DEFAULT_SIZE = 8;
const DEFAULT_ALPHA = 1;

abstract class BaseMarker implements IMarker {
  readonly gfx: Container;
  protected readonly graphics: Graphics;
  protected readonly color: number;
  protected readonly size: number;
  protected readonly alpha: number;

  constructor(opts: MarkerOptions, host: MarkerHostInfo) {
    this.color = opts.color ?? DEFAULT_COLOR;
    this.size = opts.size ?? DEFAULT_SIZE;
    this.alpha = opts.alpha ?? DEFAULT_ALPHA;

    this.gfx = new Container();
    this.gfx.label = 'marker';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
    this.paint(this.graphics);
  }

  draw(anchor: Point, tangent: Vec2): void {
    this.gfx.position.set(anchor.x, anchor.y);
    this.gfx.rotation = Math.atan2(tangent.y, tangent.x);
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  /** One-shot paint into local-space. Subclasses draw oriented along `+x`. */
  protected abstract paint(g: Graphics): void;
}

/** Arrow head — triangle pointing along `+x`, anchored at the tip. */
export class ArrowMarker extends BaseMarker {
  protected paint(g: Graphics): void {
    const s = this.size;
    g.poly([
      { x: 0, y: 0 },
      { x: -s, y: -s / 2 },
      { x: -s, y: s / 2 },
    ]);
    g.fill({ color: this.color, alpha: this.alpha });
  }
}

/** Solid circle marker. */
export class CircleMarker extends BaseMarker {
  protected paint(g: Graphics): void {
    g.circle(0, 0, this.size / 2);
    g.fill({ color: this.color, alpha: this.alpha });
  }
}

/** Solid square marker (axis-aligned in marker-local space). */
export class SquareMarker extends BaseMarker {
  protected paint(g: Graphics): void {
    const s = this.size;
    g.rect(-s / 2, -s / 2, s, s);
    g.fill({ color: this.color, alpha: this.alpha });
  }
}

/** Solid diamond marker (square rotated 45° — drawn directly as a poly). */
export class DiamondMarker extends BaseMarker {
  protected paint(g: Graphics): void {
    const r = this.size / 2;
    g.poly([
      { x: r, y: 0 },
      { x: 0, y: r },
      { x: -r, y: 0 },
      { x: 0, y: -r },
    ]);
    g.fill({ color: this.color, alpha: this.alpha });
  }
}
