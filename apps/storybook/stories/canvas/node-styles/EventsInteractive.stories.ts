/**
 * ElementPlugin — Events: Interactive
 *
 * Demonstrates the element event system routed through `canvas.events`.
 * Every handler receives a typed event class instance.
 *
 * Events shown:
 *   element:click        → GraphClickEvent       (elementId, elementType, worldX/Y, nativeEvent)
 *   element:dblclick     → GraphDblClickEvent
 *   element:pointerover  → GraphPointerOverEvent
 *   element:pointerout   → GraphPointerOutEvent
 *   element:dragstart    → GraphDragStartEvent   (+ dx, dy)
 *   element:dragmove     → GraphDragMoveEvent    (+ dx, dy)
 *   element:dragend      → GraphDragEndEvent     (+ dx, dy)
 *   element:statechange  → GraphStateChangeEvent (state, active)
 *
 * Three elements:
 *   - Circle  → click / dblclick
 *   - Hexagon → hover enter / leave
 *   - Star    → drag (spec.draggable = true)
 *
 * All events are logged to the Storybook Actions tab.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, DevInfoPlugin } from '@invana/canvas';
import {
  ElementPlugin,
  type BaseNodeSpec,
  type CircleElementSpec,
  type PolygonElementSpec,
  type StarElementSpec,
  type GraphClickEvent,
  type GraphDblClickEvent,
  type GraphPointerOverEvent,
  type GraphPointerOutEvent,
  type GraphDragStartEvent,
  type GraphDragMoveEvent,
  type GraphDragEndEvent,
  type GraphStateChangeEvent,
} from '@invana/plugins-graph-data';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Node Styles/Events Interactive' };
export default meta;
type Story = StoryObj;

export const EventsInteractive: Story = {
  name: 'Events — Interactive',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 28,
    }));

    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);

    const elements = new ElementPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    // ── Elements ──────────────────────────────────────────────────────────
    elements.addNode('circle', {
      id: 'clicker', x: -200, y: 0, radius: 60,
      label: 'click / dblclick',
      style: { fill: '#1d4ed8', stroke: '#93c5fd', strokeWidth: 2 },
      states: {
        hovered:  { fill: '#2563eb', stroke: '#bfdbfe', strokeWidth: 3 },
        selected: { fill: '#1e40af', stroke: '#ffffff', strokeWidth: 3 },
      },
      interactive: true,
    } as CircleElementSpec);

    elements.addNode('polygon', {
      id: 'hoverer', x: 60, y: 0, radius: 60, sides: 6,
      label: 'hover me',
      style: { fill: '#065f46', stroke: '#6ee7b7', strokeWidth: 2 },
      states: {
        hovered: { fill: '#047857', stroke: '#a7f3d0', strokeWidth: 3 },
      },
      interactive: true,
    } as PolygonElementSpec);

    elements.addNode('star', {
      id: 'dragger', x: 320, y: 0, radius: 60,
      label: 'drag me',
      style: { fill: '#7c2d12', stroke: '#fca5a5', strokeWidth: 2 },
      states: {
        hovered: { fill: '#991b1b', stroke: '#fecaca', strokeWidth: 3 },
      },
      interactive: true,
      draggable: true,
      cursor: 'grab',
    } as StarElementSpec);

    elements.fitContent();

    // ── Typed event listeners ─────────────────────────────────────────────
    canvas.events.on('graph:click',
      (e: GraphClickEvent) => action('graph:click')({ id: e.elementId, type: e.elementType, x: e.worldX, y: e.worldY }));

    canvas.events.on('graph:dblclick',
      (e: GraphDblClickEvent) => action('graph:dblclick')({ id: e.elementId }));

    canvas.events.on('graph:pointerover',
      (e: GraphPointerOverEvent) => action('graph:pointerover')({ id: e.elementId, type: e.elementType }));

    canvas.events.on('graph:pointerout',
      (e: GraphPointerOutEvent) => action('graph:pointerout')({ id: e.elementId }));

    canvas.events.on('graph:dragstart',
      (e: GraphDragStartEvent) => action('graph:dragstart')({ id: e.elementId, x: e.worldX, y: e.worldY }));

    canvas.events.on('graph:dragmove',
      (e: GraphDragMoveEvent) => {
        // Move the star as it's dragged
        const cur = elements.getNode('dragger');
        if (!cur) return;
        const spec = cur.element.spec as BaseNodeSpec;
        elements.updateNode('dragger', { x: spec.x + e.dx, y: spec.y + e.dy } as StarElementSpec);
        action('graph:dragmove')({ id: e.elementId, dx: e.dx, dy: e.dy });
      });

    canvas.events.on('graph:dragend',
      (e: GraphDragEndEvent) => action('graph:dragend')({ id: e.elementId }));

    canvas.events.on('graph:statechange',
      (e: GraphStateChangeEvent) => action('graph:statechange')({ id: e.elementId, state: e.state, active: e.active }));

    // Toggle 'selected' on click
    canvas.events.on('graph:click', (e: GraphClickEvent) => {
      const states = elements.getStates(e.elementId);
      if (states.includes('selected')) {
        elements.clearState(e.elementId, 'selected');
      } else {
        elements.setState(e.elementId, 'selected', true);
      }
    });

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Events', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = { devInfo: true };
    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
