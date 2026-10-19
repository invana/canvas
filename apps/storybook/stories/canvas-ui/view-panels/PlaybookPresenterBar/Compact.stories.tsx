/**
 * **Presenting a board, one answer at a time.** The playbook below is what an
 * assistant thread becomes: each step's `title` is the question asked and its
 * `narration` is the reply's message.
 *
 * - **Not presenting:** the top-left panel is the layout button and *Present*.
 *   *Present* is a host widget built from `PlaybookPresentButton`, and it shows
 *   only when there are two or more steps.
 * - **Presenting:** the same panel collapses to `PlaybookStepper`, ◀ `n/N` ▶ ✕.
 *   A bottom panel with no surface holds `PlaybookPresenterBar
 *   variant="compact"`: the question as a bubble, the message beside an avatar,
 *   and one dot per step. It has no buttons, because ◀ ▶ ✕ are the toolbar's.
 *
 * Presenting is the host's state, so *Present* and ✕ are widgets this story
 * registers through `controlPanels={{ widgets }}`. canvas-ui ships the parts,
 * not the mode.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import type { GraphCanvas } from '@invana/graph';
import { ControlPanel } from '@invana/canvas-react';
import {
  GraphCanvasApp,
  PlaybookPresentButton,
  PlaybookPresenterBar,
  PlaybookStepper,
  type ControlWidget
} from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { Sparkles } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/view-panels/PlaybookPresenterBar/Compact' };
export default meta;
type Story = StoryObj;

/** A thread of three answers, as the playbook it becomes. */
const PLAYBOOK = {
  version: 1 as const,
  title: 'Who holds Les Misérables together?',
  source: 'graph',
  steps: [
    {
      id: 'cast',
      title: 'Who is in Les Misérables?',
      narration: '77 characters. An edge means two of them share a scene; I drew all of them on the board.',
      view: { camera: 'all' as const }
    },
    {
      id: 'hub',
      title: 'Who holds the story together?',
      narration: 'Valjean. He shares a scene with 36 characters, more than anyone else. I highlighted him and his scenes.',
      view: {
        select: ['Valjean'],
        focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius', 'Thenardier', 'Myriel', 'Fauchelevent'] },
        camera: 'focus' as const
      }
    },
    {
      id: 'pursuit',
      title: 'Who is chasing him?',
      narration: 'Javert, from the first act to the last. Their scenes run through Fantine, Cosette and the Thénardiers.',
      view: {
        select: ['Javert'],
        focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Thenardier', 'Mme.Thenardier'] },
        camera: 'focus' as const
      }
    }
  ]
};

export const CompactStory: Story = {
  name: 'Compact',
  render: () => <Presenting />
};

function Presenting() {
  const [presenting, setPresenting] = useState(false);

  const onReady = useCallback((canvas: GraphCanvas | null) => {
    if (canvas) void canvas.playbook.load(PLAYBOOK);
  }, []);

  // Host widgets: they close over the presenting state, which canvas-ui doesn't own.
  const widgets = useMemo<Record<string, ControlWidget>>(
    () => ({
      present: ({ canvas }) => <PlaybookPresentButton canvas={canvas} onPresent={() => setPresenting(true)} />,
      stepper: ({ canvas }) => <PlaybookStepper canvas={canvas} onClose={() => setPresenting(false)} />,
      presenter: ({ canvas }) => (
        <PlaybookPresenterBar
          canvas={canvas}
          variant="compact"
          className="w-[540px] shadow-lg"
          narrationIcon={
            <span className="bg-primary/15 text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="size-3" />
            </span>
          }
        />
      )
    }),
    []
  );

  return (
    <GraphCanvasApp data={lesMiserables} showHeader={false} onReady={onReady} controlPanels={{ widgets }}>
      <ControlPanel
        id="tools"
        position="top-left"
        offset={12}
        items={
          presenting
            ? [{ type: 'widget', widget: 'stepper' }]
            : [{ type: 'widget', widget: 'layout-presets' }, { type: 'divider' }, { type: 'widget', widget: 'present' }]
        }
      />
      <ControlPanel
        id="presenter"
        position="bottom"
        offset={12}
        surface={false}
        visible={presenting}
        items={[{ type: 'widget', widget: 'presenter' }]}
      />
    </GraphCanvasApp>
  );
}
