/**
 * **`<GraphBoard>` extended by its host, never forked.** What a product adds,
 * each through a prop, logged on the right:
 *
 * | Prop | Here |
 * |---|---|
 * | `menus.node` | *Find related…* on a node's right-click menu |
 * | `menus.board` | *Clear the log* on the board's menu |
 * | `panels` | a *Versions* panel before Export, in Explore only |
 * | `panelOptions.changes.onSave` | a stand-in backend: a moment's wait, then saved |
 * | `onLayoutStart` · `onLayoutEnd` | each layout run, for the host's telemetry |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { GraphBoard, type BoardPanelSpec } from '@invana/canvas-ui';
import { EmptyState, Eyebrow, PanelBox } from '@invana/ui';
import { History } from 'lucide-react';
import { valjeanScenes } from './data';

const meta: Meta = { title: 'canvas-ui/apps/GraphBoard/GraphBoardHostExtensions' };
export default meta;
type Story = StoryObj;

const VERSIONS: BoardPanelSpec = {
  id: 'versions',
  title: 'Versions',
  icon: 'versions',
  modes: ['explore'],
  render: () => <EmptyState icon={<History />} title="No saved versions" description="A host's own panel, in the board's rail." />
};

export const GraphBoardHostExtensionsStory: Story = {
  name: 'GraphBoardHostExtensions',
  render: function Render() {
    const data = useMemo(valjeanScenes, []);
    const [log, setLog] = useState<string[]>([]);
    const say = (line: string) => setLog((l) => [line, ...l].slice(0, 14));
    return (
      <div className="flex h-screen">
        <div className="min-w-0 flex-1">
          <GraphBoard
            data={data}
            menus={{
              node: ({ id }) => [{ id: 'related', label: 'Find related…', onClick: () => say(`find related to ${id}`) }],
              board: () => [{ id: 'clear', label: 'Clear the log', onClick: () => setLog([]) }]
            }}
            panels={(rail) => {
              const at = rail.findIndex((p) => p.id === 'export');
              return [...rail.slice(0, at), VERSIONS, ...rail.slice(at)];
            }}
            panelOptions={{
              changes: {
                saveTarget: 'Saves to the stand-in backend',
                onSave: () => {
                  say('save sent');
                  return new Promise<void>((resolve) => setTimeout(resolve, 600));
                }
              }
            }}
            onLayoutStart={(run) => say(`layout started · ${run.nodeCount} nodes`)}
            onLayoutEnd={(run) => say(`layout ${run.reason}`)}
          />
        </div>
        <PanelBox title="Host log" className="w-72 shrink-0">
          {log.length ? log.map((line, i) => <Eyebrow key={`${i}-${line}`}>{line}</Eyebrow>) : <Eyebrow>nothing yet</Eyebrow>}
        </PanelBox>
      </div>
    );
  }
};
