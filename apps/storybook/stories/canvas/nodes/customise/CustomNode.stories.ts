/**
 * GraphDataPlugin — Custom Node Types
 *
 * Shows how to define two new custom node shapes (CloudNode and ServerNode)
 * alongside DatabaseNode, register all three with GraphDataPlugin via
 * registerNode(), and load the graph from a plain JSON data object.
 *
 * Key patterns:
 *   - Extend BaseNode<Spec> with custom geometry fields
 *   - graph.registerNode(type, Class) before graph.setData()
 *   - Custom geometry fields (radius, width, height) go directly in the
 *     node data JSON — INodeData forwards unknown fields to the shape spec
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, rayPointAt, rayVsCircle, rayVsRect } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import {
  BaseNode,
  LOD,
  type DrawContext,
  type BBox,
  type Point,
  type BaseShapeSpec,
} from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Custom Nodes' };
export default meta;
type Story = StoryObj;

// ─── CloudNode ────────────────────────────────────────────────────────────────
// Cloud silhouette built from overlapping circles.
// x, y is the visual centre. Custom field: radius.

interface CloudNodeSpec extends BaseShapeSpec {
  radius: number;
}

class CloudNode extends BaseNode<CloudNodeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, radius: r, label } = this.spec;
    const s = this.resolveStyle();
    // Setting stroke = fill erases the seam lines where overlapping shapes meet,
    // merging them into one unified cloud silhouette without internal borders.
    const fill = typeof s.fill === 'string' ? s.fill : '#4a90d9';
    const merged = { fill, stroke: fill, strokeWidth: 2 };

    ctx.fillEllipse(x, y + r * 0.2,   r,        r * 0.62, merged); // base body
    ctx.fillCircle(x - r * 0.47, y - r * 0.04,  r * 0.38, merged); // left bump
    ctx.fillCircle(x,            y - r * 0.3,   r * 0.46, merged); // centre bump
    ctx.fillCircle(x + r * 0.47, y - r * 0.04,  r * 0.38, merged); // right bump

    if (detail === LOD.DETAIL && label) {
      ctx.drawLabel(label, x, y + r * 0.52, { fill: '#e2e8f0', fontSize: 13, fontWeight: 'bold' });
    }
  }

  getBBox(): BBox {
    const { x, y, radius: r } = this.spec;
    return { minX: x - r, minY: y - r * 0.88, maxX: x + r, maxY: y + r * 0.96 };
  }

  getCenter(): Point {
    return { x: this.spec.x, y: this.spec.y };
  }

  rayBoundaryHit(origin: Point, dir: Point): Point | null {
    const { x, y, radius: r } = this.spec;
    const t = rayVsCircle(origin.x, origin.y, dir.x, dir.y, x, y, r);
    if (t === null) return null;
    return rayPointAt(origin.x, origin.y, dir.x, dir.y, t);
  }
}

// ─── ServerNode ───────────────────────────────────────────────────────────────
// 1U server chassis with drive-bay bands and a status LED.
// x, y is the top-left corner. Custom fields: width, height.

interface ServerNodeSpec extends BaseShapeSpec {
  width: number;
  height: number;
}

class ServerNode extends BaseNode<ServerNodeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, width: w, height: h, label } = this.spec;
    const s = this.resolveStyle();

    ctx.fillRect(x, y, w, h, { ...s, cornerRadius: 4 });

    const bandH = 7, bandGap = 5;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + 10, y + 14 + i * (bandH + bandGap), w - 24, bandH, {
        fill: 'rgba(0,0,0,0.4)',
        stroke: 'rgba(0,0,0,0)',
        strokeWidth: 0,
      });
    }

    ctx.fillCircle(x + w - 13, y + 11, 4, {
      fill: '#4ade80',
      stroke: 'rgba(0,0,0,0)',
      strokeWidth: 0,
    });

    if (detail === LOD.DETAIL && label) {
      ctx.drawLabel(label, x + w / 2, y + h + 16, { fill: '#94a3b8', fontSize: 12 });
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

  rayBoundaryHit(origin: Point, dir: Point): Point | null {
    const { x, y, width: w, height: h } = this.spec;
    const t = rayVsRect(origin.x, origin.y, dir.x, dir.y, x, y, x + w, y + h);
    if (t === null) return null;
    return rayPointAt(origin.x, origin.y, dir.x, dir.y, t);
  }
}

// ─── DatabaseNode ─────────────────────────────────────────────────────────────
// Cylinder drawn with top/bottom ellipse caps and a body rect.
// x, y is the top-left corner. Custom fields: width, height.

interface DatabaseNodeSpec extends BaseShapeSpec {
  width: number;
  height: number;
}

class DatabaseNode extends BaseNode<DatabaseNodeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, width: w, height: h, label } = this.spec;
    const s     = this.resolveStyle();
    const rx    = w / 2;
    const capRy = w * 0.18;

    ctx.fillEllipse(x + rx, y + h - capRy, rx, capRy, s);
    ctx.fillRect(x, y + capRy, w, h - capRy * 2, s);
    ctx.fillEllipse(x + rx, y + capRy, rx, capRy, s);

    if (detail === LOD.DETAIL && label) {
      ctx.drawLabel(label, x + rx, y + h / 2, { fill: '#e2e8f0', fontSize: 13, fontWeight: 'bold' });
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

  rayBoundaryHit(origin: Point, dir: Point): Point | null {
    const { x, y, width: w, height: h } = this.spec;
    const t = rayVsRect(origin.x, origin.y, dir.x, dir.y, x, y, x + w, y + h);
    if (t === null) return null;
    return rayPointAt(origin.x, origin.y, dir.x, dir.y, t);
  }
}

// ─── Graph data ───────────────────────────────────────────────────────────────
// Plain JSON — custom geometry fields (radius, width, height) are forwarded
// directly to the shape spec by GraphDataPlugin._buildNodeSpec.

const graphData = {
  nodes: [
    {
      id: 'cloud',
      shape: 'cloud',
      x: 0, y: -230,
      radius: 80,
      label: 'Cloud / CDN',
      style: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 },
    },
    {
      id: 'web',
      shape: 'server',
      x: -220, y: -55,
      width: 140, height: 95,
      label: 'Web Server',
      style: { fill: '#1e293b', stroke: '#94a3b8', strokeWidth: 2 },
    },
    {
      id: 'api',
      shape: 'server',
      x: 80, y: -55,
      width: 140, height: 95,
      label: 'API Server',
      style: { fill: '#1e293b', stroke: '#a78bfa', strokeWidth: 2 },
    },
    {
      id: 'db',
      shape: 'database',
      x: -70, y: 130,
      width: 140, height: 160,
      label: 'Primary DB',
      style: { fill: '#1e3a5f', stroke: '#38bdf8', strokeWidth: 2 },
    },
  ],
  edges: [
    { id: 'cloud-web', source: 'cloud', target: 'web',  label: 'HTTP :80',   style: { stroke: '#60a5fa', strokeWidth: 2 } },
    { id: 'cloud-api', source: 'cloud', target: 'api',  label: 'HTTPS :443', style: { stroke: '#a78bfa', strokeWidth: 2 } },
    { id: 'web-db',    source: 'web',   target: 'db',   label: 'SQL',         style: { stroke: '#38bdf8', strokeWidth: 2 } },
    { id: 'api-db',    source: 'api',   target: 'db',   label: 'SQL',         style: { stroke: '#38bdf8', strokeWidth: 2 } },
  ],
};

// ─── Story ────────────────────────────────────────────────────────────────────

export const CustomNodeTypes: Story = {
  name: 'Server Example',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#0f172a',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#1e293b',
            backgroundColor: '#0f172a',
            size: 1.5,
            spacing: 30,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: { fitOnRender: true, fitPadding: 60 },
        },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;

    // Register custom shape types before calling setData so the shape
    // registry knows how to instantiate 'cloud', 'server', and 'database'.
    graph.registerNode('cloud',    CloudNode    as never);
    graph.registerNode('server',   ServerNode   as never);
    graph.registerNode('database', DatabaseNode as never);

    graph.setData(graphData);
  },
};
