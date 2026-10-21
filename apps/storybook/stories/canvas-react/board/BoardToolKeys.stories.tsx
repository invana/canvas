/**
 * **`<BoardToolKeys>` — a mode's tools on single keys.** In Edit:
 *
 * | Key | What happens |
 * |---|---|
 * | **N** | Add node on, and back to Select on a second press — click the board to drop one |
 * | **C** | Connect on, and back — drag from a node to a node |
 * | hold **Shift** | Connect while held; the tool in hand comes back on release |
 *
 * Only in its mode (Explore ignores them), never while typing in a field, never
 * with ⌘ / Ctrl / Alt. It drives `tool.active`, so the row's toggles light up
 * with the keys — the two always agree.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import {
  BoardModes,
  BoardToolKeys,
  ControlPanel,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  useBoardMode,
  type BoardModeSpec
} from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-react/board/BoardToolKeys' };
export default meta;
type Story = StoryObj;

const MODES: BoardModeSpec[] = [
  { id: 'explore', label: 'Explore', icon: 'compass', description: 'Look — the keys do nothing here' },
  { id: 'edit', label: 'Edit', icon: 'pencil', description: 'N · C · hold Shift' }
];

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

export const BoardToolKeysStory: Story = {
  name: 'BoardToolKeys',
  render: function Render() {
    const data = useMemo(() => twitterActivity, []);
    return (
      <GraphCanvasApp data={data} config={CONFIG} header={{ title: 'BoardToolKeys' }}>
        <BoardModes modes={MODES} escapeTo="explore" />
        <BoardToolKeys />
        <CreateNodeBehaviour id="create-node" targetLayerId="graph" modes={['add']} />
        <DrawEdgeBehaviour id="draw-edge" targetLayerId="graph" modes={['connect']} />
        <ControlPanel
          id="row"
          position="top-left"
          offset={12}
          surface="hairline"
          items={[
            { type: 'widget', widget: 'board-mode' },
            { type: 'divider', modes: ['edit'] },
            { type: 'toggle', key: 'add', command: 'tool.active', args: { value: 'add' }, icon: 'node-add', label: 'Add node (N)', modes: ['edit'] },
            { type: 'toggle', key: 'connect', command: 'tool.active', args: { value: 'connect' }, icon: 'connect', label: 'Connect (C, or hold Shift)', modes: ['edit'] }
          ]}
        />
        <ModeReadout />
      </GraphCanvasApp>
    );
  }
};

function ModeReadout() {
  const mode = useBoardMode();
  return (
    <ControlPanel
      id="mode-readout"
      placement="footer-right"
      items={[{ type: 'text', text: mode === 'edit' ? 'Edit — press N or C, or hold Shift' : 'Explore — pick Edit for the keys' }]}
    />
  );
}
