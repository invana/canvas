/**
 * Camera — pan, zoom, fit capabilities
 *
 * Draws ~80 randomly scattered shapes across a large world (4000×3000),
 * then plays an automated camera sequence like a movie scene:
 *
 *   1  Fit all content into view
 *   2  Zoom in on a random shape cluster
 *   3  Pan right
 *   4  Pan down
 *   5  Pan left
 *   6  Pan up
 *   7  Fit all again  (zoom-to-fit)
 *
 * A lil-gui panel lets you trigger each move manually too.
 */

import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, DrawingPlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = {
  title: '7. Animations/Camera',
};
export default meta;
type Story = StoryObj;

// ─── helpers ─────────────────────────────────────────────────────────────────
const PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4dd0e1', '#aed581', '#ff8a65',
  '#90caf9', '#ffe082', '#80cbc4', '#ef9a9a',
];
const rng = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

interface SceneItem {
  type: 'circle' | 'rect' | 'polygon' | 'star';
  x: number;
  y: number;
  color: string;
}

function buildScene(count: number, worldW: number, worldH: number): SceneItem[] {
  const items: SceneItem[] = [];
  const types: SceneItem['type'][] = ['circle', 'rect', 'polygon', 'star'];
  for (let i = 0; i < count; i++) {
    items.push({
      type: pick(types),
      x: rng(80, worldW - 80),
      y: rng(80, worldH - 80),
      color: pick(PALETTE),
    });
  }
  return items;
}

function renderScene(draw: DrawingPlugin, items: SceneItem[]): void {
  const STROKE = 'rgba(0,0,0,0.5)';
  items.forEach(({ type, x, y, color }) => {
    const r = rng(24, 50);
    switch (type) {
      case 'circle':
        draw.circle(x, y, r, { fill: color, stroke: STROKE, strokeWidth: 2 });
        break;
      case 'rect':
        draw.rect(x - r, y - r * 0.7, r * 2, r * 1.4, {
          fill: color, stroke: STROKE, strokeWidth: 2, cornerRadius: 8,
        });
        break;
      case 'polygon': {
        const sides = pick([3, 5, 6]);
        draw.polygon(x, y, r, sides, { fill: color, stroke: STROKE, strokeWidth: 2 });
        break;
      }
      case 'star':
        draw.star(x, y, r, { fill: color, stroke: STROKE, strokeWidth: 2 });
        break;
    }
  });
}

// ─── story ───────────────────────────────────────────────────────────────────
export const CameraControls: Story = {
  name: 'Camera Controls',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const WORLD_W = 4000;
    const WORLD_H = 3000;
    const ANIM_DURATION = 1200; // ms per move

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      backgroundColor: '#12121e',
    });
    await canvas.init();

    await canvas.plugins.register(
      new BackgroundPlugin({
        key: 'bg',
        type: 'pattern',
        patternType: 'grid',
        color: '#2a2a40',
        backgroundColor: '#12121e',
        size: 1,
        spacing: 40,
        alpha: 0.5,
      }),
    );

    const draw = new DrawingPlugin({ key: 'shapes', zIndex: 10 });
    await canvas.plugins.register(draw);

    // Build + draw scene
    const items = buildScene(80, WORLD_W, WORLD_H);
    renderScene(draw, items);

    // Start at fit-all view
    canvas.camera.zoom(0.18);
    canvas.camera.panTo(WORLD_W / 2, WORLD_H / 2);

    // ── Camera sequence (movie scene) ───────────────────────────────────────
    const STEP = ANIM_DURATION + 400; // animation + pause

    const sequence: Array<{ label: string; action: () => void }> = [
      {
        label: 'Zoom In (centre)',
        action: () => canvas.camera.animate({ x: WORLD_W / 2, y: WORLD_H / 2, scale: 0.6, duration: ANIM_DURATION }),
      },
      {
        label: 'Pan Right',
        action: () => canvas.camera.animate({ x: WORLD_W * 0.75, y: WORLD_H / 2, scale: 0.6, duration: ANIM_DURATION }),
      },
      {
        label: 'Pan Down',
        action: () => canvas.camera.animate({ x: WORLD_W * 0.75, y: WORLD_H * 0.75, scale: 0.6, duration: ANIM_DURATION }),
      },
      {
        label: 'Pan Left',
        action: () => canvas.camera.animate({ x: WORLD_W * 0.25, y: WORLD_H * 0.75, scale: 0.6, duration: ANIM_DURATION }),
      },
      {
        label: 'Pan Up',
        action: () => canvas.camera.animate({ x: WORLD_W * 0.25, y: WORLD_H * 0.25, scale: 0.6, duration: ANIM_DURATION }),
      },
      {
        label: 'Zoom In Close',
        action: () => canvas.camera.animate({ x: WORLD_W * 0.5, y: WORLD_H * 0.5, scale: 1.2, duration: ANIM_DURATION }),
      },
      {
        label: 'Zoom Out — Fit All',
        action: () => canvas.camera.animate({ x: WORLD_W / 2, y: WORLD_H / 2, scale: 0.18, duration: ANIM_DURATION }),
      },
    ];

    let autoTimer: ReturnType<typeof setTimeout> | null = null;

    const playStep = (i: number) => {
      if (i < 0 || i >= sequence.length) return;
      sequence[i]!.action();
    };

    const playAll = () => {
      if (autoTimer) clearTimeout(autoTimer);
      sequence.forEach((_, i) => {
        autoTimer = setTimeout(() => playStep(i), i * STEP + 600);
      });
    };

    // Auto-play once on load
    setTimeout(playAll, 800);

    // ── GUI ─────────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Camera', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const actions: Record<string, () => void> = { 'Play Sequence': playAll };
    sequence.forEach(({ label, action }) => {
      actions[label] = action;
    });

    gui.add(actions, 'Play Sequence');
    const folder = gui.addFolder('Individual Moves');
    sequence.forEach(({ label }) => folder.add(actions, label));
    folder.open();
  },
};
