/**
 * ElementPlugin — Custom Element
 *
 * Shows how to extend BaseSolid to create a fully custom element type
 * and register it with ElementPlugin via `registerElement()`.
 *
 * The `DatabaseNode` custom element:
 *   - Draws a cylinder shape (top ellipse + body rect + bottom ellipse)
 *   - Exposes `width`, `height` in its spec
 *   - Uses only `DrawContext` methods — no PixiJS imports needed
 *   - Implements `getBBox()`, `getCenter()`, `getConnectionPoint()`
 *
 * Also shows a `HexBadge` custom element — a small hexagon with a text label
 * rendered as a status badge.
 */
import type { Meta, StoryObj } from '@storybook/html';
import {
  Canvas,
  BackgroundPlugin,
  ElementPlugin,
  BaseSolid,
  LOD,
  type DrawContext,
  type ElementBBox as BBox,
  type ElementPoint as Point,
  type BaseSolidSpec,
} from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: '2. Node Styles' };
export default meta;
type Story = StoryObj;

// ─── DatabaseNode ─────────────────────────────────────────────────────────────

interface DatabaseNodeSpec extends BaseSolidSpec {
  /** Total width of the cylinder in world px. */
  width: number;
  /** Total height of the cylinder body in world px. */
  height: number;
}

/**
 * Cylindrical database node drawn with three DrawContext primitives.
 * x,y is the top-left corner of the bounding box.
 */
class DatabaseNode extends BaseSolid<DatabaseNodeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, width: w, height: h, label } = this.spec;
    const style   = this.resolveStyle();
    const rx      = w / 2;
    const capRy   = w * 0.18;  // ellipse cap height
    const bodyTop = y + capRy;

    // Bottom cap (draw first so top overlaps it)
    ctx.fillEllipse(x + rx, y + h - capRy, rx, capRy, style);

    // Body rectangle (no top/bottom, just filled rect)
    ctx.fillRect(x, bodyTop, w, h - capRy * 2, style);

    // Top cap
    ctx.fillEllipse(x + rx, bodyTop, rx, capRy, style);

    // Label
    if (detail === LOD.DETAIL && label) {
      ctx.drawLabel(label, x + rx, y + h / 2, { fill: '#ffffff', fontSize: 13 });
    }
  }

  getBBox(): BBox {
    const { x, y, width: w, height: h } = this.spec;
    return { minX: x, minY: y, maxX: x + w, maxY: y + h };
  }

  getCenter(): Point {
    const { x, y, width: w, height: h } = this.spec;
    return { x: x + w / 2, y: y + h / 2 };
  }

  getConnectionPoint(toX: number, toY: number): Point {
    const { x, y, width: w, height: h } = this.spec;
    const cx = x + w / 2, cy = y + h / 2;
    const dx = toX - cx, dy = toY - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Use the smaller of half-width and half-height as a rough radius
    const r = Math.min(w, h) / 2;
    return { x: cx + (dx / len) * r, y: cy + (dy / len) * r };
  }
}

// ─── HexBadge ─────────────────────────────────────────────────────────────────

interface HexBadgeSpec extends BaseSolidSpec {
  /** Circumscribed radius. */
  radius: number;
  /** Badge text (short — 1–3 chars). */
  badge: string;
}

/** Small hexagon with an overlaid badge text. */
class HexBadge extends BaseSolid<HexBadgeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, radius: r, badge, label } = this.spec;
    const style = this.resolveStyle();
    ctx.fillPolygon(x, y, r, 6, style);
    if (detail === LOD.DETAIL) {
      ctx.drawLabel(badge, x, y, { fill: '#ffffff', fontSize: r * 0.65, fontWeight: 'bold' });
      if (label) ctx.drawLabel(label, x, y + r + 14, { fill: '#94a3b8', fontSize: 11 });
    }
  }

  getBBox(): BBox {
    const { x, y, radius: r } = this.spec;
    return { minX: x - r, minY: y - r, maxX: x + r, maxY: y + r };
  }

  getCenter(): Point {
    return { x: this.spec.x, y: this.spec.y };
  }

  getConnectionPoint(toX: number, toY: number): Point {
    const { x, y, radius: r } = this.spec;
    const dx = toX - x, dy = toY - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: x + (dx / len) * r, y: y + (dy / len) * r };
  }
}

// ─── Story ────────────────────────────────────────────────────────────────────

export const CustomElement: Story = {
  name: 'Custom Element',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 30,
    }));

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    // Register custom types
    elements.registerElement('database', DatabaseNode as never);
    elements.registerElement('hex-badge', HexBadge as never);

    // ── Database nodes ────────────────────────────────────────────────────
    const dbStyle = { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 };

    elements.addSolid('database', {
      id: 'db-primary', x: -220, y: -70, width: 100, height: 140,
      label: 'Primary DB',
      style: dbStyle,
      interactive: true,
    } as DatabaseNodeSpec);

    elements.addSolid('database', {
      id: 'db-replica', x: 120, y: -70, width: 100, height: 140,
      label: 'Replica DB',
      style: { fill: '#1e3a2f', stroke: '#34d399', strokeWidth: 2 },
      interactive: true,
    } as DatabaseNodeSpec);

    // ── HexBadge status indicators ────────────────────────────────────────
    elements.addSolid('hex-badge', {
      id: 'badge-ok',   x: -170, y: 120, radius: 34, badge: '✓', label: 'Healthy',
      style: { fill: '#14532d', stroke: '#4ade80', strokeWidth: 2 },
      interactive: true,
    } as HexBadgeSpec);

    elements.addSolid('hex-badge', {
      id: 'badge-warn', x: 0, y: 120, radius: 34, badge: '!', label: 'Warning',
      style: { fill: '#78350f', stroke: '#fcd34d', strokeWidth: 2 },
      interactive: true,
    } as HexBadgeSpec);

    elements.addSolid('hex-badge', {
      id: 'badge-err',  x: 170, y: 120, radius: 34, badge: '✕', label: 'Error',
      style: { fill: '#7f1d1d', stroke: '#fca5a5', strokeWidth: 2 },
      interactive: true,
    } as HexBadgeSpec);

    // ── Connectors ────────────────────────────────────────────────────────
    elements.addConnector('bezier', {
      id: 'replication',
      from: { x: -120, y: 0 },
      to:   { x:  120, y: 0 },
      label: 'replication',
      endArrow:   { type: 'triangle', size: 10 },
      startArrow: { type: 'circle',   size: 8  },
      style: { stroke: '#60a5fa', strokeWidth: 2 },
    });

    elements.fit();
  },
};
