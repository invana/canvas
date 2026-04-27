/**
 * ElementPlugin — Drag With Connectors
 *
 * Shows how to keep connectors attached to their source/target nodes
 * when a node is dragged.  The technique is:
 *
 *   1. Listen to `element:dragmove` on the event bus.
 *   2. Recalculate the node's new position from the drag delta.
 *   3. Call `updateSolid(id, { x, y })` to move the node.
 *   4. Re-derive `from` / `to` via `getConnectionPoint()` and call
 *      `updateConnector(id, { from, to })` to reattach the edge.
 *
 * Layout:
 *
 *      [A] ─── bezier ──► [B]
 *       ↑                  ↑
 *   drag me            drag me
 *
 *      [C] ─── orth ────► [D]
 *
 * API used:
 *   addSolid / addConnector
 *   updateSolid(id, { x, y })
 *   getCenter(id)                    — current node centre
 *   getConnectionPoint(id, tx, ty)   — perimeter attachment point
 *   updateConnector(id, { from, to })
 *   element:dragmove event           — dx, dy deltas
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec,
  type RectElementSpec,
  type ElementDragMoveEvent,
  type ElementDragStartEvent,
  type ElementDragEndEvent,
} from '@invana/canvas';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Edge Styles/Drag With Connectors' };
export default meta;
type Story = StoryObj;

// ── Node / edge topology ──────────────────────────────────────────────────────

interface NodeDef {
  id:     string;
  x:      number;
  y:      number;
  type:   string;
  color:  string;
  label:  string;
}

interface EdgeDef {
  id:        string;
  from:      string;   // source node id
  to:        string;   // target node id
  connType:  string;
  color:     string;
}

const NODES: NodeDef[] = [
  { id: 'A', x: -220, y: -80, type: 'circle', color: '#3b82f6', label: 'A  (drag me)' },
  { id: 'B', x:  220, y: -80, type: 'circle', color: '#22c55e', label: 'B  (drag me)' },
  { id: 'C', x: -220, y:  80, type: 'rect',   color: '#f59e0b', label: 'C  (drag me)' },
  { id: 'D', x:  220, y:  80, type: 'rect',   color: '#ec4899', label: 'D  (drag me)' },
];

const EDGES: EdgeDef[] = [
  { id: 'AB', from: 'A', to: 'B', connType: 'bezier',     color: '#60a5fa' },
  { id: 'CD', from: 'C', to: 'D', connType: 'orthogonal', color: '#fbbf24' },
  { id: 'AC', from: 'A', to: 'C', connType: 'smooth',     color: '#a78bfa' },
  { id: 'BD', from: 'B', to: 'D', connType: 'smooth',     color: '#f9a8d4' },
];

const R = 36;

export const DragWithConnectors: Story = {
  name: 'Drag With Connectors',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 80 });
    await canvas.plugins.register(elements);

    // ── Add nodes ─────────────────────────────────────────────────────────
    for (const node of NODES) {
      const commonStyle = {
        fill: node.color, fillAlpha: 0.15, stroke: node.color, strokeWidth: 2,
      };
      const states = {
        hovered:  { fill: node.color, fillAlpha: 0.3, strokeWidth: 3 },
        dragging: { fill: node.color, fillAlpha: 0.5, strokeWidth: 4, stroke: '#ffffff' },
      };

      if (node.type === 'circle') {
        elements.addSolid('circle', {
          id: node.id, x: node.x, y: node.y, radius: R,
          label: node.label,
          style: commonStyle, states,
          interactive: true, draggable: true, cursor: 'grab',
        } as CircleElementSpec);
      } else {
        elements.addSolid('rect', {
          id: node.id,
          x: node.x - R, y: node.y - R * 0.65,
          width: R * 2,  height: R * 1.3,
          cornerRadius: 10,
          label: node.label,
          style: commonStyle, states,
          interactive: true, draggable: true, cursor: 'grab',
        } as RectElementSpec);
      }
    }

    // ── Add edges ─────────────────────────────────────────────────────────
    function buildEdge(edge: EdgeDef): void {
      const srcC = elements.getCenter(edge.from)!;
      const tgtC = elements.getCenter(edge.to)!;
      const from = elements.getConnectionPoint(edge.from, tgtC.x, tgtC.y) ?? srcC;
      const to   = elements.getConnectionPoint(edge.to,   srcC.x, srcC.y) ?? tgtC;
      elements.addConnector(edge.connType, {
        id: edge.id,
        from, to,
        endMarker: { type: 'triangle', size: 10, color: edge.color },
        style:     { stroke: edge.color, strokeWidth: 2 },
      });
    }

    for (const edge of EDGES) buildEdge(edge);

    // ── Re-attach edges when a node moves ─────────────────────────────────
    function refreshEdges(movedId: string): void {
      for (const edge of EDGES) {
        if (edge.from !== movedId && edge.to !== movedId) continue;
        const srcC = elements.getCenter(edge.from);
        const tgtC = elements.getCenter(edge.to);
        if (!srcC || !tgtC) continue;
        const from = elements.getConnectionPoint(edge.from, tgtC.x, tgtC.y) ?? srcC;
        const to   = elements.getConnectionPoint(edge.to,   srcC.x, srcC.y) ?? tgtC;
        elements.updateConnector(edge.id, { from, to });
      }
    }

    // ── Drag handling ─────────────────────────────────────────────────────
    canvas.events.on('element:dragstart', (e: ElementDragStartEvent) => {
      elements.setState(e.elementId, 'dragging', true);
    });

    canvas.events.on('element:dragmove', (e: ElementDragMoveEvent) => {
      const nodeId = e.elementId;
      // Move the node by the drag delta
      const obj = elements.getSolid(nodeId);
      if (!obj) return;
      const nodeDef = NODES.find(n => n.id === nodeId);
      if (!nodeDef) return;
      if (nodeDef.type === 'circle') {
        const spec = obj.element.spec as CircleElementSpec;
        elements.updateSolid(nodeId, {
          x: spec.x + e.dx,
          y: spec.y + e.dy,
        } as Partial<CircleElementSpec>);
      } else {
        const spec = obj.element.spec as RectElementSpec;
        elements.updateSolid(nodeId, {
          x: spec.x + e.dx,
          y: spec.y + e.dy,
        } as Partial<RectElementSpec>);
      }
      refreshEdges(nodeId);
    });

    canvas.events.on('element:dragend', (e: ElementDragEndEvent) => {
      elements.clearState(e.elementId, 'dragging');
    });
  },
};
