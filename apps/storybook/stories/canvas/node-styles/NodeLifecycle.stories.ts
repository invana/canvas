/**
 * GraphPlugin — Element Lifecycle
 *
 * Demonstrates the full CRUD API for elements:
 *
 *   addNode(type, spec)          — create a new solid element
 *   updateNode(id, partial)      — merge a partial spec update
 *   removeNode(id)               — remove and destroy
 *   addEdge(type, spec)      — create a new connector
 *   updateEdge(id, partial)  — merge update
 *   removeEdge(id)           — remove connector
 *   clear()                       — remove everything
 *   getNode(id)                  — retrieve the GraphObject wrapper
 *   getEdge(id)              — retrieve the GraphObject wrapper
 *
 * The lil-gui panel lets you:
 *   - Spawn random circles at random world positions
 *   - Connect the last two spawned nodes with a bezier
 *   - Update the colour of the most-recently added node
 *   - Remove the most-recently added node
 *   - Clear the whole canvas
 *
 * Events:
 *   element:added   — logged to the action tab
 *   element:removed — logged to the action tab
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, DevInfoPlugin } from '@invana/canvas';
import {
  ShapesPlugin,
  type CircleShapeSpec,
  type GraphAddedEvent,
  type GraphRemovedEvent,
} from '@invana/plugins-shapes';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Node Styles/Node Lifecycle' };
export default meta;
type Story = StoryObj;

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#ec4899', '#a855f7',
];

let nodeCounter  = 0;
let edgeCounter  = 0;
const nodeHistory: string[] = [];

function randBetween(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export const ElementLifecycle: Story = {
  name: 'Node Lifecycle',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    nodeCounter  = 0;
    edgeCounter  = 0;
    nodeHistory.length = 0;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'grid',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1, spacing: 40,
    }));

    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);

    const elements = new ShapesPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    // ── Event logging ─────────────────────────────────────────────────────
    canvas.events.on('shape:added',
      (e: GraphAddedEvent) => action('shape:added')({ id: e.elementId, type: e.elementType }));
    canvas.events.on('shape:removed',
      (e: GraphRemovedEvent) => action('shape:removed')({ id: e.elementId, type: e.elementType }));

    // ── GUI ───────────────────────────────────────────────────────────────
    const params = {
      nodeCount: 0,
      edgeCount: 0,
      newFill:   COLORS[0]!,
    };

    const gui = new GUI({ title: 'Element Lifecycle', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;width:220px;';

    const infoFolder = gui.addFolder('Stats').open();
    const nodeCtrl = infoFolder.add(params, 'nodeCount').name('Nodes').disable();
    const edgeCtrl = infoFolder.add(params, 'edgeCount').name('Edges').disable();

    const addFolder = gui.addFolder('Add').open();

    addFolder.add({
      addNode: () => {
        const id    = `node-${++nodeCounter}`;
        const color = COLORS[nodeCounter % COLORS.length]!;
        const x     = randBetween(-300, 300);
        const y     = randBetween(-200, 200);
        elements.addShape('circle', {
          id, x, y, radius: 30,
          label: id,
          style: { fill: color, stroke: '#ffffff', strokeWidth: 2 },
          interactive: true,
          states: {
            hovered:  { stroke: '#fbbf24', strokeWidth: 3 },
            selected: { stroke: '#ffffff', strokeWidth: 4, fill: color },
          },
        } as CircleShapeSpec);
        nodeHistory.push(id);
        params.nodeCount = nodeHistory.length;
        nodeCtrl.updateDisplay();
      },
    }, 'addNode').name('Add random node');

    addFolder.add({
      connectLast: () => {
        if (nodeHistory.length < 2) { alert('Need at least 2 nodes'); return; }
        const srcId = nodeHistory[nodeHistory.length - 2]!;
        const tgtId = nodeHistory[nodeHistory.length - 1]!;
        const src   = elements.getCenter(srcId);
        const tgt   = elements.getCenter(tgtId);
        if (!src || !tgt) return;

        const connId = `edge-${++edgeCounter}`;
        elements.addConnector('bezier', {
          id: connId,
          from:      elements.getConnectionPoint(srcId, tgt.x, tgt.y) ?? src,
          to:        elements.getConnectionPoint(tgtId, src.x, src.y) ?? tgt,
          endMarker: { type: 'triangle', size: 10 },
          style:     { stroke: '#64748b', strokeWidth: 2 },
        });
        params.edgeCount = edgeCounter;
        edgeCtrl.updateDisplay();
      },
    }, 'connectLast').name('Connect last 2 nodes');

    const updateFolder = gui.addFolder('Update').open();
    updateFolder.addColor(params, 'newFill').name('New fill color');
    updateFolder.add({
      updateLast: () => {
        const id = nodeHistory[nodeHistory.length - 1];
        if (!id) return;
        elements.updateShape(id, {
          style: { fill: params.newFill, stroke: '#ffffff', strokeWidth: 2 },
        } as Partial<CircleShapeSpec>);
      },
    }, 'updateLast').name('Update last node color');

    updateFolder.add({
      growLast: () => {
        const id = nodeHistory[nodeHistory.length - 1];
        if (!id) return;
        const obj = elements.getShape(id);
        if (!obj) return;
        const spec = obj.element.spec as CircleShapeSpec;
        elements.updateShape(id, { radius: (spec.radius ?? 30) + 10 } as Partial<CircleShapeSpec>);
      },
    }, 'growLast').name('Grow last node radius');

    const removeFolder = gui.addFolder('Remove').open();
    removeFolder.add({
      removeLast: () => {
        const id = nodeHistory.pop();
        if (!id) return;
        elements.removeShape(id);
        params.nodeCount = nodeHistory.length;
        nodeCtrl.updateDisplay();
      },
    }, 'removeLast').name('Remove last node');

    removeFolder.add({
      clearAll: () => {
        elements.clear();
        nodeHistory.length = 0;
        nodeCounter  = 0;
        edgeCounter  = 0;
        params.nodeCount = 0;
        params.edgeCount = 0;
        nodeCtrl.updateDisplay();
        edgeCtrl.updateDisplay();
      },
    }, 'clearAll').name('Clear all elements');

    gui.add({ fit: () => elements.fitContent(60) }, 'fit').name('Fit camera');
  },
};
