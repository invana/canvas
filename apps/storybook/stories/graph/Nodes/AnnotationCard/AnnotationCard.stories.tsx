/**
 * **An annotation drawn in the graph** — the structures `annotationTemplates(colors)`
 * gives a layer, on their own:
 *
 * | Node type | Draws |
 * |---|---|
 * | `annotation` | a note: colour strip, author mark, author, meta, three lines of text |
 * | `annotation.value` | the same with the value's line — `group  3 · was 9` |
 * | `annotation.count` | a record's annotations as one pill |
 *
 * The host passes the colours, resolved from its theme (the board reads the
 * design-kit tokens); the theme toggle in the header recolours the cards' surface and text.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { GraphLayer } from '@invana/canvas-react';
import { GraphCanvasApp, ToolbarItems } from '@invana/canvas-ui';
import { annotationTemplates, type GraphData } from '@invana/graph';
import { Moon, Sun } from 'lucide-react';

const meta: Meta = { title: 'graph/Nodes/AnnotationCard' };
export default meta;
type Story = StoryObj;

const CONFIG = {
  fitOnLoad: true,
  layers: { graph: annotationTemplates({ amber: 0xd97706, blue: 0x2563eb, green: 0x16a34a, red: 0xdc2626, grey: 0x6b7280 }) },
  behaviours: { theme: { enabled: true, mode: 'document' } }
} as unknown as CanvasConfig;

const card = (id: string, x: number, y: number, data: Record<string, unknown>, type = 'annotation') => ({
  id,
  type,
  position: { x, y },
  style: { labelText: '' },
  data
});

export const AnnotationCardStory: Story = {
  name: 'AnnotationCard',
  render: function Render() {
    const data = useMemo<GraphData>(
      () =>
        ({
          nodes: [
            card('a', 0, 0, { text: 'Every thread of the story runs through him', color: 'amber', author: 'Priya Nair', initials: 'PN', meta: '2 Oct' }),
            card('b', 260, 0, { text: 'Never in a scene without Valjean after book one, and the longest chase in the novel', color: 'blue', author: 'Assistant', initials: 'AI', meta: 'Answer 1' }),
            card('c', 0, 140, { text: 'Moved groups after the factory chapters', color: 'red', author: 'You', initials: 'Y', meta: 'today', valueLine: 'group  3 · was 9' }, 'annotation.value'),
            card('d', 260, 140, { text: 'The one thread that ends happily', color: 'green', author: 'You', initials: 'Y' }),
            card('e', 470, 0, { count: '3', color: 'amber' }, 'annotation.count'),
            card('f', 470, 60, { count: '12', color: 'grey' }, 'annotation.count')
          ],
          edges: []
        }) as unknown as GraphData,
      []
    );
    return (
      <GraphCanvasApp
        data={data}
        config={CONFIG}
        bundle={false}
        header={{
          title: 'AnnotationCard',
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
