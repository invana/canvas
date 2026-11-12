/**
 * **`CanvasLegend` — the legend drawn on the canvas.** Pinned to a corner of
 * the canvas (`position`), folded to its bar or open. Its counted sections
 * read the drawn elements live, so a count follows what is shown:
 *
 * - **Kinds** — the node types, each with the swatch nearest its drawn shape
 *   (a circle reads as a dot, a rectangle as a box);
 * - **Products** — a colour key: stories grouped by `data.product`, with fixed
 *   labels and colours;
 * - **Journeys** — an edge colour key: edges grouped by `data.journey`;
 * - **Marks** — what a style means, uncounted.
 *
 * *Hide Explore* (the header toggle) hides the Explore stories: the Products
 * and Kinds counts drop and the Explore entry reads `0`, struck.
 *
 * Pinned bottom-left and opened here; `defaultCollapsed` starts it folded to
 * its bar instead, so it never covers the graph until asked (the spec site's
 * Journeys view does that). Its counts keep following either way.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData, GraphLayer } from '@invana/graph';
import { CanvasLegend, GraphCanvasApp, ToolbarItems } from '@invana/canvas-ui';
import { EyeOff } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/view-panels/CanvasLegend' };
export default meta;
type Story = StoryObj;

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
const JOURNEY_COLOUR: Record<string, number> = { J1: 0x2563eb, J2: 0xdb2777 };
const PRODUCT_COLOUR: Record<string, number> = { MO: 0x059669, EX: 0xd97706 };
const STORIES: [string, string, number, number][] = [
  ['MO-01', 'MO', 160, 0],
  ['MO-02', 'MO', 480, 0],
  ['EX-01', 'EX', 320, -90],
  ['EX-02', 'EX', 640, -90],
  ['EX-03', 'EX', 800, 0],
];
const STEPS: [string, string, number, number][] = [
  ['J1:A', 'Start', 0, 0],
  ['J1:D', 'Accept?', 320, 0],
  ['J2:Z', 'Shared', 960, -90],
];
const NEXT: [string, string, string][] = [
  ['J1', 'J1:A', 'MO-01'],
  ['J1', 'MO-01', 'J1:D'],
  ['J1', 'J1:D', 'MO-02'],
  ['J1', 'MO-02', 'EX-03'],
  ['J2', 'EX-01', 'EX-02'],
  ['J2', 'EX-02', 'EX-03'],
  ['J2', 'EX-03', 'J2:Z'],
];

const DATA: GraphData = {
  nodes: [
    ...STORIES.map(([id, product, x, y]) => ({
      id,
      type: 'Story',
      position: { x, y },
      data: { product },
      style: { shape: { kind: 'circle' as const, radius: 10 }, bgFill: PRODUCT_COLOUR[product], labelText: id },
    })),
    ...STEPS.map(([id, title, x, y]) => ({
      id,
      type: 'Step',
      position: { x, y },
      data: {},
      style: { shape: { kind: 'rect' as const, width: 18, height: 12, cornerRadius: 6 }, bgFill: 0x94a3b8, labelText: title },
    })),
  ],
  edges: NEXT.map(([journey, source, target]) => ({
    id: `${journey}|${source}|${target}`,
    source,
    target,
    type: 'NEXT',
    data: { journey },
    style: { strokeColor: JOURNEY_COLOUR[journey], strokeWidth: 2, arrowTargetShape: 'triangle' as const },
  })),
};

const productOf = (data: unknown) => (data as { product?: string } | undefined)?.product;
const journeyOf = (data: unknown) => (data as { journey?: string } | undefined)?.journey;

export const CanvasLegendStory: Story = {
  name: 'CanvasLegend',
  render: function Render() {
    const data = useMemo(() => DATA, []);
    const config = useMemo<CanvasConfig>(() => ({ activeLayout: '', fitOnLoad: true }), []);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const [hideExplore, setHideExplore] = useState(false);
    const onReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);
    const toggleExplore = () => {
      canvas?.layers.get<GraphLayer>('graph')?.store.setNodesHidden(
        STORIES.filter((s) => s[1] === 'EX').map((s) => s[0]),
        !hideExplore,
      );
      setHideExplore(!hideExplore);
    };
    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'CanvasLegend',
          right: (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'toggle',
                  key: 'explore',
                  icon: EyeOff,
                  label: 'Hide Explore',
                  activeLabel: 'Show Explore',
                  active: hideExplore,
                  onToggle: toggleExplore,
                },
              ]}
            />
          ),
        }}
      >
        <CanvasLegend
          position="bottom-left"
          sections={[
            { element: 'node', title: 'Kinds' },
            {
              element: 'node',
              title: 'Products',
              groupBy: (n) => productOf(n.data),
              entries: [
                { value: 'MO', label: 'Model', color: hex(PRODUCT_COLOUR.MO!) },
                { value: 'EX', label: 'Explore', color: hex(PRODUCT_COLOUR.EX!) },
              ],
            },
            { element: 'edge', title: 'Journeys', groupBy: (e) => journeyOf(e.data) },
          ]}
          marks={[{ title: 'Marks', entries: [{ kind: 'dashed', color: hex(0x94a3b8), label: 'Bridged over hidden steps' }] }]}
        />
      </GraphCanvasApp>
    );
  },
};
