/**
 * ElementPlugin — Mixed Graph
 *
 * A complete mini-graph combining solids and connectors to demonstrate
 * how ElementPlugin can serve as the rendering backbone for a graph view.
 *
 * Topology:
 *
 *              ┌─────────┐
 *              │ Gateway │
 *              └────┬────┘
 *        ┌──────────┴──────────┐
 *   ┌────▼────┐           ┌────▼────┐
 *   │ Service │           │ Service │
 *   │    A    │           │    B    │
 *   └────┬────┘           └────┬────┘
 *        │                     │
 *   ┌────▼────┐           ┌────▼────┐
 *   │   DB A  │           │   DB B  │
 *   └─────────┘           └─────────┘
 *
 * Features demonstrated:
 *   - `setData()` bulk load
 *   - Bezier connectors with arrowheads
 *   - Labels on both solids and connectors
 *   - `fit()` after render
 *   - lil-gui to toggle node highlight
 */
import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, ElementPlugin } from '@invana/canvas-core-new';
import type { BaseSolidSpec, BaseConnectorSpec, CircleElementSpec } from '@invana/canvas-core-new';
// BaseSolidSpec and BaseConnectorSpec are re-exported from the element-plugin
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ElementPlugin' };
export default meta;
type Story = StoryObj;

// ─── Positions ────────────────────────────────────────────────────────────────
const GX = 240, GY = 160;

const POS = {
  gateway: { x:  0,       y: -GY * 1.5 },
  svcA:    { x: -GX,      y: -GY * 0.4 },
  svcB:    { x:  GX,      y: -GY * 0.4 },
  dbA:     { x: -GX,      y:  GY * 0.8 },
  dbB:     { x:  GX,      y:  GY * 0.8 },
};

const R = 44;  // node radius

// ─── Story ────────────────────────────────────────────────────────────────────

export const MixedGraph: Story = {
  name: 'Mixed Graph',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 100 });
    await canvas.plugins.register(elements);

    // ── Nodes ─────────────────────────────────────────────────────────────
    const solidStyles = {
      gateway: { fill: '#1e40af', stroke: '#93c5fd', strokeWidth: 2.5 },
      service: { fill: '#065f46', stroke: '#6ee7b7', strokeWidth: 2 },
      db:      { fill: '#3b1e64', stroke: '#c084fc', strokeWidth: 2 },
    };

    const stateStyles = {
      hovered:  { strokeWidth: 3.5, fillAlpha: 0.9 },
      selected: { strokeWidth: 4, stroke: '#ffffff' },
      active:   { stroke: '#fbbf24', strokeWidth: 3, fill: '#1c1917' },
    };

    const solids: Array<{ type: string; spec: BaseSolidSpec }> = [
      {
        type: 'circle',
        spec: {
          id: 'gateway', ...POS.gateway, radius: R + 8,
          label: 'Gateway',
          style: solidStyles.gateway,
          states: stateStyles,
          interactive: true,
        } as CircleElementSpec,
      },
      {
        type: 'rect',
        spec: {
          id: 'svcA', x: POS.svcA.x - R, y: POS.svcA.y - R * 0.7, width: R * 2, height: R * 1.4, cornerRadius: 10,
          label: 'Service A',
          style: solidStyles.service,
          states: stateStyles,
          interactive: true,
        } as BaseSolidSpec & { width: number; height: number; cornerRadius: number },
      },
      {
        type: 'rect',
        spec: {
          id: 'svcB', x: POS.svcB.x - R, y: POS.svcB.y - R * 0.7, width: R * 2, height: R * 1.4, cornerRadius: 10,
          label: 'Service B',
          style: solidStyles.service,
          states: stateStyles,
          interactive: true,
        } as BaseSolidSpec & { width: number; height: number; cornerRadius: number },
      },
      {
        type: 'ellipse',
        spec: {
          id: 'dbA', ...POS.dbA, radiusX: R * 1.3, radiusY: R * 0.65,
          label: 'DB A',
          style: solidStyles.db,
          states: stateStyles,
          interactive: true,
        } as BaseSolidSpec & { radiusX: number; radiusY: number },
      },
      {
        type: 'ellipse',
        spec: {
          id: 'dbB', ...POS.dbB, radiusX: R * 1.3, radiusY: R * 0.65,
          label: 'DB B',
          style: solidStyles.db,
          states: stateStyles,
          interactive: true,
        } as BaseSolidSpec & { radiusX: number; radiusY: number },
      },
    ];

    // ── Edges ─────────────────────────────────────────────────────────────
    const edgeStyle = { stroke: '#475569', strokeWidth: 2 };
    const arrow     = { type: 'triangle' as const, size: 12 };

    const connectors: Array<{ type: string; spec: BaseConnectorSpec }> = [
      {
        type: 'bezier',
        spec: {
          id: 'gw-svcA',
          from: { x: POS.gateway.x - 12, y: POS.gateway.y + R + 8 },
          to:   { x: POS.svcA.x,          y: POS.svcA.y - R * 0.7 },
          endArrow: arrow,
          style: edgeStyle,
        },
      },
      {
        type: 'bezier',
        spec: {
          id: 'gw-svcB',
          from: { x: POS.gateway.x + 12, y: POS.gateway.y + R + 8 },
          to:   { x: POS.svcB.x,          y: POS.svcB.y - R * 0.7 },
          endArrow: arrow,
          style: edgeStyle,
        },
      },
      {
        type: 'straight',
        spec: {
          id: 'svcA-dbA',
          from: { x: POS.svcA.x,  y: POS.svcA.y + R * 0.7 },
          to:   { x: POS.dbA.x,   y: POS.dbA.y - R * 0.65 },
          label: 'SQL',
          endArrow: arrow,
          style: { stroke: '#7c3aed', strokeWidth: 2 },
        },
      },
      {
        type: 'straight',
        spec: {
          id: 'svcB-dbB',
          from: { x: POS.svcB.x,  y: POS.svcB.y + R * 0.7 },
          to:   { x: POS.dbB.x,   y: POS.dbB.y - R * 0.65 },
          label: 'SQL',
          endArrow: arrow,
          style: { stroke: '#7c3aed', strokeWidth: 2 },
        },
      },
      {
        type: 'orthogonal',
        spec: {
          id: 'dbA-dbB',
          from: { x: POS.dbA.x + R * 1.3, y: POS.dbA.y },
          to:   { x: POS.dbB.x - R * 1.3, y: POS.dbB.y },
          label: 'replication',
          endArrow:   { type: 'triangle', size: 10 },
          startArrow: { type: 'circle',   size: 8 },
          style: { stroke: '#ea580c', strokeWidth: 1.5, strokeAlpha: 0.7 },
        },
      },
    ];

    elements.setData(solids, connectors);

    // ── GUI ───────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Mixed Graph', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params: Record<string, boolean> = {
      'gateway active':  false,
      'service A active': false,
      'service B active': false,
      'DB A active':      false,
      'DB B active':      false,
    };
    const ids: Record<string, string> = {
      'gateway active':   'gateway',
      'service A active': 'svcA',
      'service B active': 'svcB',
      'DB A active':      'dbA',
      'DB B active':      'dbB',
    };

    for (const label of Object.keys(params)) {
      gui.add(params, label).name(label).onChange((v: boolean) => {
        elements.setState(ids[label]!, 'active', v);
      });
    }

    gui.add({ fit: () => elements.fit(80) }, 'fit').name('Fit to canvas');
  },
};
