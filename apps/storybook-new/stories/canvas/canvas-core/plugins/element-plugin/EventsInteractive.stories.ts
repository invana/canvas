/**
 * ElementPlugin — Events: Interactive
 *
 * Demonstrates the element event system routed through `canvas.events`.
 * Every handler receives a typed event class instance.
 *
 * Events shown:
 *   element:click        → ElementClickEvent       (elementId, elementType, worldX/Y, nativeEvent)
 *   element:dblclick     → ElementDblClickEvent
 *   element:pointerover  → ElementPointerOverEvent
 *   element:pointerout   → ElementPointerOutEvent
 *   element:dragstart    → ElementDragStartEvent   (+ dx, dy)
 *   element:dragmove     → ElementDragMoveEvent    (+ dx, dy)
 *   element:dragend      → ElementDragEndEvent     (+ dx, dy)
 *   element:statechange  → ElementStateChangeEvent (state, active)
 *
 * Three elements:
 *   - Circle  → click / dblclick
 *   - Hexagon → hover enter / leave
 *   - Star    → drag (spec.draggable = true)
 *
 * All events are logged to the Storybook Actions tab.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { action } from 'storybook/actions';
import GUI from 'lil-gui';
import {
  Canvas,
  BackgroundPlugin,
  ElementPlugin,
  DevInfoPlugin,
  type BaseSolidSpec,
  type CircleElementSpec,
  type PolygonElementSpec,
  type StarElementSpec,
  type ElementClickEvent,
  type ElementDblClickEvent,
  type ElementPointerOverEvent,
  type ElementPointerOutEvent,
  type ElementDragStartEvent,
  type ElementDragMoveEvent,
  type ElementDragEndEvent,
  type ElementStateChangeEvent,
} from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ElementPlugin/Interactions' };
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    // ── Elements ──────────────────────────────────────────────────────────
    elements.addSolid('circle', {
      id: 'clicker', x: -200, y: 0, radius: 60,
      label: 'click / dblclick',
      style: { fill: '#1d4ed8', stroke: '#93c5fd', strokeWidth: 2 },
      states: {
        hovered:  { fill: '#2563eb', stroke: '#bfdbfe', strokeWidth: 3 },
        selected: { fill: '#1e40af', stroke: '#ffffff', strokeWidth: 3 },
      },
      interactive: true,
    } as CircleElementSpec);

    elements.addSolid('polygon', {
      id: 'hoverer', x: 60, y: 0, radius: 60, sides: 6,
      label: 'hover me',
      style: { fill: '#065f46', stroke: '#6ee7b7', strokeWidth: 2 },
      states: {
        hovered: { fill: '#047857', stroke: '#a7f3d0', strokeWidth: 3 },
      },
      interactive: true,
    } as PolygonElementSpec);

    elements.addSolid('star', {
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

    elements.fit();

    // ── Typed event listeners ─────────────────────────────────────────────
    canvas.events.on('element:click',
      (e: ElementClickEvent) => action('element:click')({ id: e.elementId, type: e.elementType, x: e.worldX, y: e.worldY }));

    canvas.events.on('element:dblclick',
      (e: ElementDblClickEvent) => action('element:dblclick')({ id: e.elementId }));

    canvas.events.on('element:pointerover',
      (e: ElementPointerOverEvent) => action('element:pointerover')({ id: e.elementId, type: e.elementType }));

    canvas.events.on('element:pointerout',
      (e: ElementPointerOutEvent) => action('element:pointerout')({ id: e.elementId }));

    canvas.events.on('element:dragstart',
      (e: ElementDragStartEvent) => action('element:dragstart')({ id: e.elementId, x: e.worldX, y: e.worldY }));

    canvas.events.on('element:dragmove',
      (e: ElementDragMoveEvent) => {
        // Move the star as it's dragged
        const cur = elements.getSolid('dragger');
        if (!cur) return;
        const spec = cur.element.spec as BaseSolidSpec;
        elements.updateSolid('dragger', { x: spec.x + e.dx, y: spec.y + e.dy } as StarElementSpec);
        action('element:dragmove')({ id: e.elementId, dx: e.dx, dy: e.dy });
      });

    canvas.events.on('element:dragend',
      (e: ElementDragEndEvent) => action('element:dragend')({ id: e.elementId }));

    canvas.events.on('element:statechange',
      (e: ElementStateChangeEvent) => action('element:statechange')({ id: e.elementId, state: e.state, active: e.active }));

    // Toggle 'selected' on click
    canvas.events.on('element:click', (e: ElementClickEvent) => {
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
