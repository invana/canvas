/**
 * **Board modes — the work-mode switcher.** `<BoardModes>` (canvas-react) holds
 * the board's mode, a viewer's choice that is never saved, as the `board.mode`
 * command; the `board-mode` widget is its picker. Control panels and their items
 * say which modes they show in (`modes`), so one declaration covers every mode:
 *
 * | Mode | Group | The row shows |
 * |---|---|---|
 * | Explore | work | the picker · Select ▾ |
 * | Edit | work | the picker · Select ▾ · Add node · Connect (`tool.active`) |
 * | Annotate | work | the picker · Select ▾ · its tools, disabled — not built yet |
 * | Focus (⌘\) | view | the picker alone, faded until the pointer moves (`fade: 'idle'`) |
 * | Present | view | the picker and ◀ n/N ▶, faded until the pointer moves |
 *
 * Esc returns to Explore from any mode. The footer reads the current mode.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas } from '@invana/graph';
import { BoardModes, ControlPanel, CreateNodeBehaviour, DrawEdgeBehaviour, useBoardMode, type BoardModeSpec } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import { twitterActivity } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardModes' };
export default meta;
type Story = StoryObj;

const MODES: BoardModeSpec[] = [
  { id: 'explore', label: 'Explore', icon: 'compass', description: 'Look, ask and expand' },
  { id: 'edit', label: 'Edit', icon: 'pencil', description: 'Add, change and delete data' },
  { id: 'annotate', label: 'Annotate', icon: 'sticky-note', description: 'Notes and shapes over the graph' },
  { id: 'focus', label: 'Focus', icon: 'scan-eye', description: 'Just the graph — no tools', group: 'view', shortcut: { key: '\\', mod: true } },
  { id: 'present', label: 'Present', icon: 'presentation', description: 'Walk through the answers', group: 'view' }
];

const PLAYBOOK = {
  version: 1 as const,
  title: 'Who drives the conversation?',
  source: 'graph',
  steps: [
    { id: 'all', title: 'Everyone in the thread', narration: '99 accounts, tweets and tags.', view: { camera: 'all' as const } },
    { id: 'users', title: 'Who posts?', narration: 'The users, and what they posted.', view: { camera: 'all' as const } }
  ]
};

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

export const BoardModesStory: Story = {
  name: 'BoardModes',
  render: () => {
    const data = useMemo(() => twitterActivity, []);
    const onReady = useCallback((c: GraphCanvas | null) => {
      if (!c) return;
      void c.playbook.load(PLAYBOOK);
      c.commands.register('annotate.tool', { label: 'Not built yet', isEnabled: () => false, run: () => {} });
    }, []);

    return (
      <GraphCanvasApp data={data} config={CONFIG} onReady={onReady} header={{ title: 'BoardModes' }}>
        <BoardModes
          modes={MODES}
          escapeTo="explore"
          onModeChange={() => {
            // A real host puts the tools down here — see CanvasExplorer.
          }}
        />
        <CreateNodeBehaviour id="create-node" targetLayerId="graph" modes={['add']} />
        <DrawEdgeBehaviour id="draw-edge" targetLayerId="graph" modes={['connect']} />

        <ControlPanel
          id="row"
          position="top-left"
          offset={12}
          surface="hairline"
          modes={['explore', 'edit', 'annotate']}
          items={[
            { type: 'widget', widget: 'board-mode' },
            { type: 'divider' },
            {
              type: 'choice',
              key: 'select-mode',
              command: 'select.mode',
              label: 'Select',
              display: 'dropdown',
              options: [
                { value: 'click', label: 'Select', icon: 'pointer' },
                { value: 'lasso', label: 'Lasso select', icon: 'lasso' },
                { value: 'brush', label: 'Box select', icon: 'select-box' }
              ]
            },
            { type: 'divider', modes: ['edit', 'annotate'] },
            { type: 'toggle', key: 'add', command: 'tool.active', args: { value: 'add' }, icon: 'node-add', label: 'Add node (N)', modes: ['edit'] },
            { type: 'toggle', key: 'connect', command: 'tool.active', args: { value: 'connect' }, icon: 'connect', label: 'Connect (C)', modes: ['edit'] },
            { type: 'command', key: 'note', command: 'annotate.tool', icon: 'sticky-note', label: 'Note — not built yet', modes: ['annotate'] },
            { type: 'command', key: 'shape', command: 'annotate.tool', icon: 'shape', label: 'Shape — not built yet', modes: ['annotate'] },
            { type: 'command', key: 'arrow', command: 'annotate.tool', icon: 'arrow', label: 'Arrow — not built yet', modes: ['annotate'] },
            { type: 'command', key: 'text', command: 'annotate.tool', icon: 'text', label: 'Text — not built yet', modes: ['annotate'] },
            { type: 'command', key: 'highlight', command: 'annotate.tool', icon: 'highlight', label: 'Highlight — not built yet', modes: ['annotate'] }
          ]}
        />
        <ControlPanel
          id="row-view"
          position="top-left"
          offset={12}
          surface="hairline"
          modes={['focus', 'present']}
          fade="idle"
          items={[
            { type: 'widget', widget: 'board-mode' },
            { type: 'divider', modes: ['present'] },
            { type: 'widget', widget: 'playbook-stepper', modes: ['present'] }
          ]}
        />
        <ModeReadout />
      </GraphCanvasApp>
    );
  }
};

/** The footer line: which mode the board is in — `useBoardMode`, read live. */
function ModeReadout() {
  const mode = useBoardMode();
  return (
    <ControlPanel
      id="mode-readout"
      placement="footer-right"
      items={[{ type: 'text', text: `board.mode = ${mode ?? '—'} · Esc returns to Explore · ⌘\\ toggles Focus` }]}
    />
  );
}
