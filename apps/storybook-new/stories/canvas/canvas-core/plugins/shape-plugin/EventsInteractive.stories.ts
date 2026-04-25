/**
 * ShapePlugin — Events: Interactive
 *
 * Demonstrates shape events routed through the unified canvas.events bus.
 * Each handler receives a typed event class instance:
 *
 *   shape:click       → ShapeClickEvent       (shapeId, worldX/Y, nativeEvent, type, timestamp)
 *   shape:dblclick    → ShapeDblClickEvent
 *   shape:pointerover → ShapePointerOverEvent
 *   shape:pointerout  → ShapePointerOutEvent
 *   shape:dragstart   → ShapeDragStartEvent   (+ dx, dy)
 *   shape:dragmove    → ShapeDragMoveEvent    (+ dx, dy)
 *   shape:dragend     → ShapeDragEndEvent     (+ dx, dy)
 *
 * All events are logged to the Storybook Actions tab.
 */
import type { Meta, StoryObj } from '@storybook/html';
import {
  Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin,
  type ShapeClickEvent,
  type ShapeDblClickEvent,
  type ShapePointerOverEvent,
  type ShapePointerOutEvent,
  type ShapeDragStartEvent,
  type ShapeDragMoveEvent,
  type ShapeDragEndEvent,
} from '@invana/canvas-core-new';
import GUI from 'lil-gui';
import { action } from 'storybook/actions';

const meta: Meta = { title: '6. Interaction' };
export default meta;
type Story = StoryObj;

export const ShapeEventsInteractive: Story = {
  name: 'Shape Events — Interactive',
  render: () => {
    const container = document.createElement('div');
    container.id = 'canvas-example';
    container.style.cssText = 'width:100%;height:100%;position:relative;';
    return container;
  },
  play: async () => {
    const canvasDiv = document.getElementById('canvas-example') as HTMLDivElement;
    if (!canvasDiv) return;

    const canvas = new Canvas({ container: canvasDiv, backgroundColor: '#0f172a' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 28,
    }));

    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    // ── Shapes ─────────────────────────────────────────────────────────────
    shapes.setData([
      {
        id: 'clicker', type: 'circle', x: -180, y: 0, radius: 60,
        fill: { type: 'solid', color: '#1d4ed8' },
        border: { color: '#93c5fd', width: 2 },
        label: { text: 'click / dblclick' },
        interactive: true,
      },
      {
        id: 'hoverer', type: 'polygon', x: 80, y: 0, radius: 60, sides: 6,
        fill: { type: 'solid', color: '#065f46' },
        border: { color: '#6ee7b7', width: 2 },
        label: { text: 'hover me' },
        interactive: true,
      },
      {
        id: 'dragger', type: 'star', x: 320, y: 0, radius: 55,
        fill: { type: 'solid', color: '#7c2d12' },
        border: { color: '#fca5a5', width: 2 },
        label: { text: 'drag me' },
        interactive: true,
        draggable: true,
      },
    ] as never[]);

    // ── Typed event listeners via canvas.events ────────────────────────────
    // Each handler receives a concrete event class instance, not a plain object.
    // e.type, e.timestamp, e.nativeEvent, e.stopPropagation() are all available.

    canvas.events.on('shape:click',       (e: ShapeClickEvent)       => action('shape:click')(e));
    canvas.events.on('shape:dblclick',    (e: ShapeDblClickEvent)    => action('shape:dblclick')(e));
    canvas.events.on('shape:pointerover', (e: ShapePointerOverEvent) => action('shape:pointerover')(e));
    canvas.events.on('shape:pointerout',  (e: ShapePointerOutEvent)  => action('shape:pointerout')(e));
    canvas.events.on('shape:dragstart',   (e: ShapeDragStartEvent)   => action('shape:dragstart')(e));
    canvas.events.on('shape:dragmove',    (e: ShapeDragMoveEvent)    => action('shape:dragmove')(e));
    canvas.events.on('shape:dragend',     (e: ShapeDragEndEvent)     => action('shape:dragend')(e));

    // GUI
    const gui = new GUI({ title: 'Events', container: canvasDiv });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = { devInfo: true };
    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
