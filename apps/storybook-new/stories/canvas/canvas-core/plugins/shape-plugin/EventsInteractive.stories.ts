/**
 * ShapePlugin — Events: Interactive
 *
 * Demonstrates the ShapePlugin event system:
 *   - click / dblclick → update fill color, log event
 *   - pointerenter / pointerleave → hover highlight
 *   - dragstart / drag / dragend → move shape, log event
 *   - wildcard listener → borderGlow animation on any click
 *
 * A side-panel event log is rendered alongside the canvas.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin } from '@invana/canvas-core-new';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ShapePlugin' };
export default meta;
type Story = StoryObj;

function createLayout(): { canvasDiv: HTMLDivElement; logDiv: HTMLDivElement; wrapper: HTMLDivElement } {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width:100%;height:100%;display:flex;gap:0;overflow:hidden;';

  const canvasDiv = document.createElement('div');
  canvasDiv.id = 'canvas-example';
  canvasDiv.style.cssText = 'flex:1;height:100%;position:relative;';

  const logDiv = document.createElement('div');
  logDiv.style.cssText = [
    'width:260px;height:100%;',
    'background:#0f172a;color:#94a3b8;',
    'font:12px/1.6 monospace;',
    'padding:10px 12px;box-sizing:border-box;',
    'overflow-y:auto;border-left:1px solid #1e293b;',
    'flex-shrink:0;',
  ].join('');
  logDiv.innerHTML = '<div style="color:#64748b;margin-bottom:6px;">// event log</div>';

  wrapper.appendChild(canvasDiv);
  wrapper.appendChild(logDiv);
  return { canvasDiv, logDiv, wrapper };
}

export const EventsInteractive: Story = {
  name: 'Events — Interactive',
  render: () => {
    const { wrapper } = createLayout();
    return wrapper;
  },
  play: async () => {
    const canvasDiv = document.getElementById('canvas-example') as HTMLDivElement;
    const logDiv = canvasDiv?.parentElement?.querySelector<HTMLDivElement>('div:last-child');
    if (!canvasDiv) return;

    const canvas = new Canvas({ container: canvasDiv, backgroundColor: '#0f172a' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 28,
    }));

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

    // ── Event log helper ───────────────────────────────────────────────────
    let logCount = 0;
    const log = (msg: string) => {
      if (!logDiv) return;
      logCount++;
      const line = document.createElement('div');
      line.style.cssText = 'border-bottom:1px solid #1e293b;padding:2px 0;';
      line.textContent = `${logCount}. ${msg}`;
      logDiv.insertBefore(line, logDiv.children[1] ?? null);
      if (logDiv.children.length > 60) logDiv.lastChild?.remove();
    };

    // ── Per-shape listeners ─────────────────────────────────────────────────
    const clickColors = ['#1d4ed8', '#7c3aed', '#db2777', '#b45309', '#065f46'];
    let clickIdx = 0;

    shapes.on('clicker', 'click', () => {
      clickIdx = (clickIdx + 1) % clickColors.length;
      shapes.update('clicker', { fill: { type: 'solid', color: clickColors[clickIdx] } });
      log(`clicker:click → ${clickColors[clickIdx]}`);
    });

    shapes.on('clicker', 'dblclick', () => {
      shapes.update('clicker', { fill: { type: 'solid', color: '#1d4ed8' } });
      clickIdx = 0;
      log('clicker:dblclick → reset color');
    });

    shapes.on('hoverer', 'pointerenter', () => {
      shapes.update('hoverer', {
        fill: { type: 'solid', color: '#059669' },
        border: { color: '#34d399', width: 3 },
      });
      log('hoverer:pointerenter');
    });
    shapes.on('hoverer', 'pointerleave', () => {
      shapes.update('hoverer', {
        fill: { type: 'solid', color: '#065f46' },
        border: { color: '#6ee7b7', width: 2 },
      });
      log('hoverer:pointerleave');
    });

    let isDragging = false;
    shapes.on('dragger', 'dragstart', ({ worldX, worldY }) => {
      isDragging = true;
      shapes.update('dragger', { border: { color: '#fca5a5', width: 3.5 } });
      log(`dragger:dragstart (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
    });
    shapes.on('dragger', 'drag', ({ dx, dy }) => {
      if (!isDragging) return;
      const spec = shapes.get('dragger') as { x: number; y: number } | undefined;
      if (!spec) return;
      shapes.update('dragger', { x: spec.x + dx, y: spec.y + dy });
    });
    shapes.on('dragger', 'dragend', ({ worldX, worldY }) => {
      isDragging = false;
      shapes.update('dragger', { border: { color: '#fca5a5', width: 2 } });
      log(`dragger:dragend (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
    });

    // ── Wildcard: borderGlow on any click ──────────────────────────────────
    shapes.on('*', 'click', ({ id }) => {
      shapes.animate(id as string, {
        borderGlowPulse: { minAlpha: 0.2, maxAlpha: 1.0, speed: 3 },
      });
      setTimeout(() => shapes.stopAnimation(id as string), 1800);
      log(`*:click → borderGlow on "${id}"`);
    });
  },
};
