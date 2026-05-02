// Labels — node label positioning, multi-line wrap, ellipsis, backgrounds,
// multi-label nodes, and visibility-LOD overrides.
//
// String shorthand (`label: 'foo'`) renders a centred default-styled label.
// Pass a NodeLabelSpec for full control: position keyword (`top`, `bottom`,
// corners), offset, font/fill/stroke, optional rounded background, max-width
// truncation/wrap, and per-label visibility threshold.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { INodeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/Labels' };
export default meta;
type Story = StoryObj;

const BG_PLUGIN = {
  plugin: 'background', key: 'bg',
  options: {
    type: 'pattern', patternType: 'dots',
    color: '#1e293b', backgroundColor: '#0f172a',
    size: 1.5, spacing: 30,
  },
} as const;

// ── Story 1 — All 9 node label positions ────────────────────────────────────
export const Positions: Story = {
  name: 'All 9 Positions',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const positions: INodeData['label'][] = [
      { text: 'top-left',     position: 'top-left'    },
      { text: 'top',          position: 'top'         },
      { text: 'top-right',    position: 'top-right'   },
      { text: 'left',         position: 'left'        },
      { text: 'center',       position: 'center'      },
      { text: 'right',        position: 'right'       },
      { text: 'bottom-left',  position: 'bottom-left' },
      { text: 'bottom',       position: 'bottom'      },
      { text: 'bottom-right', position: 'bottom-right'},
    ];

    const nodes: INodeData[] = positions.map((label, i) => ({
      id:    `n${i}`,
      shape: 'rect',
      x:     -300 + (i % 3) * 240,
      y:     -180 + Math.floor(i / 3) * 200,
      width: 120, height: 80,
      label,
    }));

    const canvas = new Canvas({
      container, backgroundColor: '#0f172a',
      plugins: [
        BG_PLUGIN,
        {
          plugin: 'graph-data', key: 'graph',
          options: {
            fitOnRender: true, fitPadding: 80,
            data: { nodes, edges: [] },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};

// ── Story 2 — Backgrounds, multi-line wrap, ellipsis truncation ─────────────
export const BackgroundsAndTruncation: Story = {
  name: 'Backgrounds + Truncation',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      {
        id: 'pill', shape: 'circle', x: -260, y: 0, size: 80,
        label: {
          text: 'pill background',
          position: 'bottom',
          fill: '#ffffff',
          background: { fill: '#7c3aed', radius: 12, padding: [4, 10] },
        },
      },
      {
        id: 'wrap', shape: 'rect', x: -60, y: 0, width: 120, height: 80,
        label: {
          text: 'a long label that wraps onto multiple lines',
          position: 'bottom',
          maxWidth: 140, wordWrap: true,
          fill: '#e2e8f0',
          background: { fill: 'rgba(15,23,42,0.85)', radius: 6, padding: 6 },
        },
      },
      {
        id: 'ellipsis', shape: 'rect', x: 180, y: 0, width: 120, height: 80,
        label: {
          text: 'this gets truncated with an ellipsis',
          position: 'bottom',
          maxWidth: 110,
          fill: '#fbbf24',
        },
      },
    ];

    const canvas = new Canvas({
      container, backgroundColor: '#0f172a',
      plugins: [
        BG_PLUGIN,
        {
          plugin: 'graph-data', key: 'graph',
          options: {
            fitOnRender: true, fitPadding: 80,
            data: { nodes, edges: [] },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};

// ── Story 3 — Multiple labels per node (title + subtitle) ───────────────────
export const MultiLabel: Story = {
  name: 'Multiple Labels per Node',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      {
        id: 'n1', shape: 'rect', x: -160, y: 0, width: 160, height: 90,
        label: [
          { text: 'Customer', position: 'center', fontSize: 16, fontWeight: 'bold', fill: '#ffffff' },
          { text: 'PRIMARY',  position: 'center', offsetY: 22, fontSize: 10, fill: '#60a5fa' },
          { text: '#1234',    position: 'top-right', fontSize: 11, fill: '#94a3b8' },
        ],
      },
      {
        id: 'n2', shape: 'rect', x: 160, y: 0, width: 160, height: 90,
        label: [
          { text: 'Order',  position: 'center', offsetY: -8, fontSize: 16, fontWeight: 'bold', fill: '#ffffff' },
          { text: '$249.99', position: 'center', offsetY: 14, fontSize: 12, fill: '#22c55e' },
        ],
      },
    ];

    const canvas = new Canvas({
      container, backgroundColor: '#0f172a',
      plugins: [
        BG_PLUGIN,
        {
          plugin: 'graph-data', key: 'graph',
          options: {
            fitOnRender: true, fitPadding: 80,
            data: { nodes, edges: [] },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};

// ── Story 4 — Edge labels: auto-rotate, position along path, multi-label ────
export const EdgeLabels: Story = {
  name: 'Edge Labels',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'A', shape: 'circle', x: -260, y: -120, size: 60, label: 'A' },
      { id: 'B', shape: 'circle', x:  260, y:  -80, size: 60, label: 'B' },
      { id: 'C', shape: 'circle', x: -180, y:  140, size: 60, label: 'C' },
      { id: 'D', shape: 'circle', x:  220, y:  180, size: 60, label: 'D' },
    ];

    const canvas = new Canvas({
      container, backgroundColor: '#0f172a',
      plugins: [
        BG_PLUGIN,
        {
          plugin: 'graph-data', key: 'graph',
          options: {
            fitOnRender: true, fitPadding: 80,
            data: {
              nodes,
              edges: [
                {
                  id: 'A-B', source: 'A', target: 'B', pathType: 'bezier',
                  // Auto-rotated midpoint label with default outline (legible
                  // on top of the line).
                  label: 'auto-rotated',
                },
                {
                  id: 'C-D', source: 'C', target: 'D', pathType: 'bezier',
                  // Two labels on one edge: forward marker near the start,
                  // reverse marker near the end. Both auto-rotate.
                  label: [
                    { text: '→ forward',  position: 0.2 },
                    { text: 'reverse ←', position: 0.8 },
                  ],
                },
                {
                  id: 'A-C', source: 'A', target: 'C', pathType: 'straight',
                  // Pinned-rotation label with a background pill.
                  label: {
                    text: 'static',
                    position: 'middle',
                    rotation: 0,
                    fill: '#0f172a', stroke: undefined, strokeWidth: 0,
                    background: { fill: '#fbbf24', radius: 10, padding: [2, 8] },
                  },
                },
                {
                  id: 'B-D', source: 'B', target: 'D', pathType: 'bezier',
                  label: { text: 'middle-offset', position: 'middle', offset: 18 },
                },
              ],
            },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};

// ── Story 5 — LOD-controlled visibility + bulk layer toggling ───────────────
export const LayerVisibility: Story = {
  name: 'Layer Visibility (Hide All Labels)',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `n${i}`, shape: 'circle',
      x: -300 + (i % 4) * 200,
      y: -150 + Math.floor(i / 4) * 150,
      size: 60,
      label: {
        text: `Node ${i + 1}`,
        position: 'bottom',
        // Half the labels stay visible at all zoom levels; the rest only at
        // detail zoom. The `showAtLOD` field is per-label.
        showAtLOD: i % 2 === 0 ? 'always' : 'detail',
      },
    }));

    const canvas = new Canvas({
      container, backgroundColor: '#0f172a',
      plugins: [
        BG_PLUGIN,
        {
          plugin: 'graph-data', key: 'graph',
          options: {
            fitOnRender: true, fitPadding: 80,
            data: { nodes, edges: [] },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();

    // Wire up two buttons that toggle the dedicated label layers as a group.
    // Layer ids are emitted by ShapesPlugin (`shapes-node-labels`,
    // `shapes-edge-labels`); GraphDataPlugin uses the same key so the prefix
    // is `graph-node-labels` here when accessed through the plugin's
    // ShapesPlugin instance — fall back gracefully.
    const nodeLayer =
      canvas.layers.getLayer('graph-node-labels')
      ?? canvas.layers.getLayer('shapes-node-labels');
    if (nodeLayer) {
      const btn = document.createElement('button');
      btn.textContent = 'Toggle node labels';
      Object.assign(btn.style, {
        position: 'absolute', top: '12px', left: '12px',
        padding: '6px 10px', background: '#1e293b',
        color: '#e2e8f0', border: '1px solid #334155',
        borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
      });
      btn.addEventListener('click', () => { nodeLayer.visible = !nodeLayer.visible; });
      container.appendChild(btn);
    }
  },
};
