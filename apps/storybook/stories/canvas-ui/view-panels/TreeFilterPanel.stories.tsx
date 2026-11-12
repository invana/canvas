/**
 * **`TreeFilterPanel` — a tickable tree that hides and shows canvas nodes.**
 * Two journeys run through five stories of two products. The panel holds the
 * stories as a tree (Product → Story) and the journeys as a flat group; each
 * leaf names the nodes it stands for.
 *
 * - Untick a story: it leaves the canvas, and a **dashed bridge** of the same
 *   edge type joins the story before it to the one after — `A → [hidden] → C`
 *   reads `A ⇢ C` (`bridgeHidden`, on by default).
 * - Untick a journey: its own steps go, and a story goes once every journey it
 *   is on is unticked.
 * - A parent's box is mixed while only some of its stories show; *Show all* /
 *   *Hide all* act on what the search leaves.
 * - Click a row's label to select it — the message bar says which.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { GraphCanvasApp, TreeFilterPanel, type TreeFilterGroup } from '@invana/canvas-ui';

const meta: Meta = { title: 'canvas-ui/view-panels/TreeFilterPanel' };
export default meta;
type Story = StoryObj;

/** Two journeys over five stories, placed left to right; steps are the journeys' own decisions and ends. */
const JOURNEY_COLOUR: Record<string, number> = { J1: 0x2563eb, J2: 0xdb2777 };
const PRODUCT_COLOUR: Record<string, number> = { MO: 0x059669, EX: 0xd97706 };
const STORIES: [string, string, string, number, number][] = [
  ['MO-01', 'MO', 'Draft the model', 160, 0],
  ['MO-02', 'MO', 'Publish it', 480, 0],
  ['EX-01', 'EX', 'Ask a question', 320, -90],
  ['EX-02', 'EX', 'Read the answer', 640, -90],
  ['EX-03', 'EX', 'Share it', 800, 0],
];
const STEPS: [string, string, string, number, number][] = [
  ['J1:A', 'J1', 'Start', 0, 0],
  ['J1:D', 'J1', 'Accept?', 320, 0],
  ['J1:Z', 'J1', 'Done', 960, 0],
  ['J2:A', 'J2', 'Start', 160, -90],
  ['J2:Z', 'J2', 'Shared', 960, -90],
];
const NEXT: [string, string, string][] = [
  ['J1', 'J1:A', 'MO-01'],
  ['J1', 'MO-01', 'J1:D'],
  ['J1', 'J1:D', 'MO-02'],
  ['J1', 'MO-02', 'EX-03'],
  ['J1', 'EX-03', 'J1:Z'],
  ['J2', 'J2:A', 'EX-01'],
  ['J2', 'EX-01', 'EX-02'],
  ['J2', 'EX-02', 'EX-03'],
  ['J2', 'EX-03', 'J2:Z'],
];

const DATA: GraphData = {
  nodes: [
    ...STORIES.map(([id, product, title, x, y]) => ({
      id,
      type: 'Story',
      position: { x, y },
      data: { title, product },
      style: { shape: { kind: 'circle' as const, radius: 10 }, bgFill: PRODUCT_COLOUR[product], labelText: id },
    })),
    ...STEPS.map(([id, journey, title, x, y]) => ({
      id,
      type: 'Step',
      position: { x, y },
      data: { title, journey },
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

const GROUPS: TreeFilterGroup[] = [
  {
    id: 'stories',
    title: 'Products',
    items: ['MO', 'EX'].map((p) => ({
      id: p,
      label: p === 'MO' ? 'Model' : 'Explore',
      children: STORIES.filter((s) => s[1] === p).map(([id, , title]) => ({ id, label: `${id} · ${title}`, nodeIds: [id] })),
    })),
  },
  {
    id: 'journeys',
    title: 'Journeys',
    items: ['J1', 'J2'].map((j) => ({
      id: j,
      label: j === 'J1' ? 'J1 · Model, then share' : 'J2 · Ask and share',
      nodeIds: [...new Set(NEXT.filter((e) => e[0] === j).flatMap((e) => [e[1], e[2]]))],
    })),
  },
];

export const TreeFilterPanelStory: Story = {
  name: 'TreeFilterPanel',
  render: function Render() {
    const data = useMemo(() => DATA, []);
    const config = useMemo<CanvasConfig>(() => ({ activeLayout: '', fitOnLoad: true }), []);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const onReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);
    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{ title: 'TreeFilterPanel' }}
        right={{
          content: (ctx) => (
            <TreeFilterPanel
              canvas={ctx.canvas as GraphCanvas | null}
              groups={GROUPS}
              defaultExpanded={['MO', 'EX']}
              selectedId={selected}
              onSelect={(item) => {
                setSelected(item?.id ?? null);
                canvas?.showMessage(item ? `Selected ${item.label}` : 'Nothing selected');
              }}
            />
          ),
          defaultSize: '320px',
        }}
      />
    );
  },
};
