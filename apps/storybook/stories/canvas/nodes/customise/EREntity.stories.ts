/**
 * GraphDataPlugin — ER Entity (named ports)
 *
 * Demonstrates the new `getPorts()` hook on a custom `EREntity` shape.
 *
 * Each entity exposes one named port per attribute row, on both the left and
 * right side. Edges target a specific port by id (`sourcePortId` /
 * `targetPortId`); the connector enters along the port's outward normal so
 * the line snaps cleanly to that row, regardless of the connector type.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, rayPointAt, rayVsRect } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import {
  BaseShape,
  LOD,
  type DrawContext,
  type BBox,
  type Point,
  type NodePort,
  type BaseShapeSpec,
} from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Custom Nodes/ER Entity (Ports)' };
export default meta;
type Story = StoryObj;

interface EREntitySpec extends BaseShapeSpec {
  width: number;
  /** Entity title shown in the header strip. */
  title?: string;
  /** Header label height (px). */
  headerHeight?: number;
  /** Row height per attribute (px). */
  rowHeight?: number;
  /** Attribute rows. Each one becomes a `.l` / `.r` port pair. */
  attributes: { id: string; name: string; type: string }[];
}

class EREntity extends BaseShape<EREntitySpec> {
  private _bodyHeight(): number {
    const headerH = this.spec.headerHeight ?? 28;
    const rowH    = this.spec.rowHeight    ?? 24;
    return headerH + this.spec.attributes.length * rowH;
  }

  drawBody(ctx: DrawContext, detail: LOD): void {
    const { x, y, width, title, attributes } = this.spec;
    const headerH = this.spec.headerHeight ?? 28;
    const rowH    = this.spec.rowHeight    ?? 24;
    const totalH  = this._bodyHeight();
    const style   = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(x + width / 2, y + totalH / 2, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    // Body
    ctx.fillRect(x, y, width, totalH, { ...style, cornerRadius: 6 });

    // Header strip
    ctx.fillRect(x, y, width, headerH, {
      fill: '#1e293b', stroke: 'rgba(0,0,0,0)', strokeWidth: 0, cornerRadius: 6,
    });

    if (detail >= LOD.DETAIL) {
      if (title) {
        ctx.drawLabel(title, x + width / 2, y + headerH / 2, {
          fill: '#e2e8f0', fontSize: 13, fontWeight: 'bold',
        });
      }
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i]!;
        const rowY = y + headerH + rowH * i + rowH / 2;
        ctx.drawLabel(`${attr.name} : ${attr.type}`, x + width / 2, rowY, {
          fill: '#cbd5e1', fontSize: 11,
        });
      }
    }
  }

  getBBox(): BBox {
    const { x, y, width } = this.spec;
    return { minX: x, minY: y, maxX: x + width, maxY: y + this._bodyHeight() };
  }

  getCenter(): Point {
    const { x, y, width } = this.spec;
    return { x: x + width / 2, y: y + this._bodyHeight() / 2 };
  }

  rayBoundaryHit(origin: Point, dir: Point): Point | null {
    const { x, y, width } = this.spec;
    const t = rayVsRect(origin.x, origin.y, dir.x, dir.y, x, y, x + width, y + this._bodyHeight());
    if (t === null) return null;
    return rayPointAt(origin.x, origin.y, dir.x, dir.y, t);
  }

  /** One port on each side of every attribute row, ids `<attr>.l` and `<attr>.r`. */
  override getPorts(): NodePort[] {
    const { x, y, width, attributes } = this.spec;
    const headerH = this.spec.headerHeight ?? 28;
    const rowH    = this.spec.rowHeight    ?? 24;
    const ports: NodePort[] = [];
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i]!;
      const yMid = y + headerH + rowH * i + rowH / 2;
      ports.push(
        { id: `${attr.id}.l`, position: { x,         y: yMid }, normal: { x: -1, y: 0 }, side: 'left'  },
        { id: `${attr.id}.r`, position: { x: x + width, y: yMid }, normal: { x:  1, y: 0 }, side: 'right' },
      );
    }
    return ports;
  }
}

export const EREntityPorts: Story = {
  name: 'ER Entity — Named Ports',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#0b1120',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#1e293b',
            backgroundColor: '#0b1120',
            size: 1.5,
            spacing: 30,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: { fitOnRender: true, fitPadding: 80 },
        },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;
    graph.registerNode('er-entity', EREntity as never);

    graph.setData({
      nodes: [
        {
          id:    'customers',
          shape: 'er-entity',
          x:     -360,
          y:     -100,
          width: 220,
          title: 'customers',
          attributes: [
            { id: 'id',      name: 'id',         type: 'uuid' },
            { id: 'email',   name: 'email',      type: 'text' },
            { id: 'name',    name: 'name',       type: 'text' },
            { id: 'created', name: 'created_at', type: 'timestamp' },
          ],
          style: { fill: '#0f172a', stroke: '#38bdf8', strokeWidth: 2 },
        },
        {
          id:    'orders',
          shape: 'er-entity',
          x:     140,
          y:     -130,
          width: 220,
          title: 'orders',
          attributes: [
            { id: 'id',          name: 'id',           type: 'uuid' },
            { id: 'customer_id', name: 'customer_id',  type: 'uuid' },
            { id: 'total',       name: 'total',        type: 'numeric' },
            { id: 'status',      name: 'status',       type: 'text' },
            { id: 'placed',      name: 'placed_at',    type: 'timestamp' },
          ],
          style: { fill: '#0f172a', stroke: '#a78bfa', strokeWidth: 2 },
        },
      ],
      edges: [
        {
          id:           'customer-orders',
          source:       'customers',
          target:       'orders',
          sourcePortId: 'id.r',
          targetPortId: 'customer_id.l',
          pathType:     'bezier',
          label:        '1 — *',
          endMarker:    { type: 'triangle', size: 9 },
          style:        { stroke: '#a78bfa', strokeWidth: 2 },
        },
      ],
    });
  },
};
