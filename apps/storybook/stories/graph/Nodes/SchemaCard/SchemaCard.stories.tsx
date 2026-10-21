/**
 * **A schema card as a structure template** — `schemaCardStructure(name, data, opts)`
 * returns a freeform structure: a header washed in the type's hue (icon, name,
 * subtitle), a two-line description, then one row per property — the type chip
 * from `schemaTypeChip`, the name, `key` on an identity, the data type.
 *
 * | Type | Shows |
 * |---|---|
 * | Airport | many rows, two identities, a subtitle |
 * | Country | two rows, one identity |
 * | Note | one row of a type the chip table does not list — `{}` |
 *
 * The card is self-contained: its colours are theme roles and `data.hue`
 * (`categorical: true`), so the theme toggle in the header recolours it.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { GraphLayer } from '@invana/canvas-react';
import { GraphCanvasApp, ToolbarItems } from '@invana/canvas-ui';
import { schemaCardStructure, type GraphData, type SchemaTypeData } from '@invana/graph';
import { Moon, Sun } from 'lucide-react';

const meta: Meta = { title: 'graph/Nodes/SchemaCard' };
export default meta;
type Story = StoryObj;

const TYPES: Record<string, SchemaTypeData> = {
  Airport: {
    label: 'Airport',
    description: 'A place flights leave from and land at.',
    icon: 'lucide/plane',
    frame: 'AirRoutes',
    hue: 1,
    properties: [
      { name: 'code', type: 'string', identity: true },
      { name: 'icao', type: 'string', identity: true },
      { name: 'city', type: 'string' },
      { name: 'runways', type: 'integer' },
      { name: 'elevation', type: 'float' },
      { name: 'international', type: 'boolean' },
      { name: 'opened', type: 'date' },
      { name: 'size', type: 'enum' }
    ]
  },
  Country: {
    label: 'Country',
    description: 'A country an airport sits in.',
    icon: 'lucide/flag',
    frame: 'AirRoutes',
    hue: 3,
    properties: [
      { name: 'code', type: 'string', identity: true },
      { name: 'name', type: 'string' }
    ]
  },
  Note: {
    label: 'Note',
    description: 'Free text with no listed type.',
    icon: 'lucide/sticky-note',
    hue: 6,
    properties: [{ name: 'body', type: 'json' }]
  }
};

const CONFIG = {
  fitOnLoad: true,
  layers: {
    graph: {
      nodeStructureTemplates: Object.fromEntries(
        Object.entries(TYPES).map(([t, d]) => [`schema:${t}`, schemaCardStructure(`schema:${t}`, d, d.frame ? { subtitle: '{data.frame}' } : {})])
      ),
      nodeTypes: Object.fromEntries(Object.keys(TYPES).map((t) => [t, { structure: `schema:${t}`, styling: 'label', bindings: {} }])),
      nodeStylingTemplates: { label: { name: 'label' } }
    }
  },
  behaviours: { theme: { enabled: true, mode: 'document' } }
} as unknown as CanvasConfig;

export const SchemaCardStory: Story = {
  name: 'SchemaCard',
  render: function Render() {
    const data = useMemo<GraphData>(
      () => ({
        nodes: Object.entries(TYPES).map(([t, d], i) => ({ id: t, type: t, data: d as never, position: { x: i * 340, y: 0 } })),
        edges: []
      }),
      []
    );
    return (
      <GraphCanvasApp
        data={data}
        config={CONFIG}
        bundle={false}
        header={{
          title: 'SchemaCard',
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme
                }
              ]}
            />
          )
        }}
      >
        <GraphLayer id="graph" data={data} />
      </GraphCanvasApp>
    );
  }
};
