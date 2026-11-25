/**
 * **Board map** — the `map` panel kind: a graph placed on a map by its node types'
 * latitude and longitude.
 *
 * | Option | Does |
 * |---|---|
 * | `geo` | per node type, the two `data` values that place it; a type not named, or a node without both values, is left off |
 * | `basemap` | `themed` (default): the built-in style for the board's theme, light or dark, tinted with its palette; `none`: a plain background, no outside request |
 * | `styling` | per node type a colour and the value that labels it, as a `canvas` panel's |
 * | `note` | a line under the map, from the host ("3 airports have no position") |
 *
 * Edges are drawn when both ends are placed. MapLibre owns pan and zoom; the map
 * opens on the placed points. The engine registers under `canvasId`, so a host's
 * focus, selection and camera reach it as they reach a `canvas` panel.
 */

import 'maplibre-gl/dist/maplibre-gl.css?inline';

import { useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasBoard, type CanvasPanelKinds } from '@invana/canvas-ui/boards';
import type { BoardSpec } from '@invana/boards';
import { airports } from '@invana/graph-datasets';
import type { GraphData } from '@invana/graph';

const ASIA = airports.filter((a) => a.lng > 60 && a.lng < 150 && a.lat > -10 && a.lat < 55).slice(0, 120);
const GRAPH = {
  nodes: [
    ...ASIA.map((a, i) => ({ id: `a${i}`, type: 'airport', data: { code: a.name, lat: a.lat, lon: a.lng } })),
    { id: 'nowhere', type: 'airport', data: { code: 'No position' } },
  ],
  edges: ASIA.slice(1, 30).map((_, i) => ({ id: `r${i}`, source: 'a0', target: `a${i + 1}`, type: 'route' })),
} as unknown as GraphData;

interface Args {
  basemap: 'themed' | 'none';
}

const meta: Meta<Args> = {
  title: 'canvas-ui/boards/BoardMap',
  args: { basemap: 'themed' },
  argTypes: { basemap: { control: 'inline-radio', options: ['themed', 'none'], description: 'The theme\'s basemap, or none' } },
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<Args>;

function BoardMap({ basemap }: Args) {
  const resolveData = useCallback(() => GRAPH, []);
  const spec: BoardSpec<CanvasPanelKinds> = {
    title: 'Airports in Asia',
    rows: [
      {
        fill: true,
        panels: [
          {
            id: 'map',
            kind: 'map',
            title: 'Where they are',
            flush: true,
            options: {
              dataRef: 'airports',
              canvasId: 'map',
              geo: { airport: { lat: 'lat', lon: 'lon' } },
              basemap,
              styling: { nodeTypes: { airport: { color: '#e0613a', labelKey: 'data.code' } } },
              note: '1 airport has no position',
            },
          },
        ],
      },
    ],
  };
  return (
    <div className="bg-background text-foreground h-dvh w-dvw">
      <CanvasBoard spec={spec} resolveData={resolveData} />
    </div>
  );
}

export const Default: Story = { name: 'BoardMap', render: (args) => <BoardMap {...args} /> };
