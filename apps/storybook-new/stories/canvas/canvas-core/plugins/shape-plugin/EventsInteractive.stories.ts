/**
 * ShapePlugin — Events: Interactive
 *
 * Demonstrates the ShapePlugin event system:
 *   - click / dblclick → update fill color, log event
 *   - pointerenter / pointerleave → hover highlight
 *   - dragstart / drag / dragend → move shape, log event
 *   - wildcard listener → borderGlow animation on any click
 *
 * Events are logged to the Storybook Actions tab.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import GUI from 'lil-gui';
import { action } from 'storybook/actions';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ShapePlugin' };
export default meta;
type Story = StoryObj;

export const EventsInteractive: Story = {
  name: 'Events — Interactive',
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

    // ── Per-shape listeners ─────────────────────────────────────────────────
    const clickColors = ['#1d4ed8', '#7c3aed', '#db2777', '#b45309', '#065f46'];
    let clickIdx = 0;

    shapes.on('clicker', 'click', (e) => {
      clickIdx = (clickIdx + 1) % clickColors.length;
      shapes.update('clicker', { fill: { type: 'solid', color: clickColors[clickIdx] } });
      action('clicker:click')(e);
    });

    shapes.on('clicker', 'dblclick', (e) => {
      shapes.update('clicker', { fill: { type: 'solid', color: '#1d4ed8' } });
      clickIdx = 0;
      action('clicker:dblclick')(e);
    });

    shapes.on('hoverer', 'pointerover', (e) => {
      shapes.update('hoverer', {
        fill: { type: 'solid', color: '#059669' },
        border: { color: '#34d399', width: 3 },
      });
      action('hoverer:pointerover')(e);
    });
    shapes.on('hoverer', 'pointerout', (e) => {
      shapes.update('hoverer', {
        fill: { type: 'solid', color: '#065f46' },
        border: { color: '#6ee7b7', width: 2 },
      });
      action('hoverer:pointerout')(e);
    });

    let isDragging = false;
    shapes.on('dragger', 'dragstart', (e) => {
      isDragging = true;
      shapes.update('dragger', { border: { color: '#fca5a5', width: 3.5 } });
      action('dragger:dragstart')(e);
    });
    shapes.on('dragger', 'dragmove', (e) => {
      if (!isDragging) return;
      const spec = shapes.get('dragger') as { x: number; y: number } | undefined;
      if (!spec) return;
      shapes.update('dragger', { x: spec.x + e.dx, y: spec.y + e.dy });
      action('dragger:dragmove')(e);
    });
    shapes.on('dragger', 'dragend', (e) => {
      isDragging = false;
      shapes.update('dragger', { border: { color: '#fca5a5', width: 2 } });
      action('dragger:dragend')(e);
    });

    // ── Wildcard: borderGlow on any click ──────────────────────────────────
    shapes.on('*', 'click', (e) => {
      const id = e.shape.id;
      shapes.animate(id, {
        borderGlowPulse: { minAlpha: 0.2, maxAlpha: 1.0, speed: 3 },
      });
      setTimeout(() => shapes.stopAnimation(id), 1800);
      action('*:click')(e);
    });

    // GUI
    const gui = new GUI({ title: 'Events', container: canvasDiv });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    const params = { devInfo: true };
    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
