/**
 * **A playbook presented as a deck.** `PlaybookPresenter` (the kit's `Presenter`
 * over `usePlaybookStepper`) sits over the bottom of the canvas: the step's
 * title and narration, `Step n / N`, ◀ Previous · one dot per step · Play ·
 * Next ▶, and ✕.
 *
 * - ◀ ▶ and a dot play or revert steps on the canvas; ← → do the same while
 *   focus is inside the deck.
 * - **Play** steps on every 2.5 s and stops at the last step; any key or click
 *   anywhere stops it.
 * - ✕ is the host's: here it hides the deck, and *Present* brings it back.
 *
 * The same `Presenter` draws a board's story in Studio, and the same stepper
 * drives `PlaybookStepper` and `PlaybookViewPanel` — one player everywhere.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useState } from 'react';
import type { GraphCanvas } from '@invana/graph';
import { ControlPanel } from '@invana/canvas-react';
import { GraphCanvasApp, PlaybookPresentButton, PlaybookPresenter, type ControlWidget } from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/view-panels/PlaybookPresenter/Deck' };
export default meta;
type Story = StoryObj;

export const DeckStory: Story = {
  name: 'Deck',
  render: function Render() {
    const [presenting, setPresenting] = useState(true);

    const playbook = useMemo(
      () => ({
        version: 1 as const,
        title: 'Who holds Les Misérables together?',
        source: 'graph',
        steps: [
          {
            id: 'cast',
            title: 'Who is in Les Misérables?',
            narration: '77 characters. An edge means two of them share a scene.',
            view: { camera: 'all' as const }
          },
          {
            id: 'hub',
            title: 'Who holds the story together?',
            narration: 'Valjean. He shares a scene with 36 characters, more than anyone else.',
            view: {
              select: ['Valjean'],
              focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius', 'Thenardier', 'Myriel', 'Fauchelevent'] },
              camera: 'focus' as const
            }
          },
          {
            id: 'pursuit',
            title: 'Who is chasing him?',
            narration: 'Javert, from the first act to the last.',
            view: {
              select: ['Javert'],
              focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Thenardier', 'Mme.Thenardier'] },
              camera: 'focus' as const
            }
          },
          {
            id: 'whole',
            title: 'And the whole cast again',
            narration: 'Back to everyone, the two of them among 77.',
            view: { select: [], focus: null, camera: 'all' as const }
          }
        ]
      }),
      []
    );

    const onReady = useCallback(
      (canvas: GraphCanvas | null) => {
        if (canvas) void canvas.playbook.load(playbook);
      },
      [playbook]
    );

    // Host widgets: they close over the presenting state, which canvas-ui doesn't own.
    const widgets = useMemo<Record<string, ControlWidget>>(
      () => ({
        present: ({ canvas }) => <PlaybookPresentButton canvas={canvas} onPresent={() => setPresenting(true)} />,
        deck: ({ canvas }) => (
          <PlaybookPresenter
            canvas={canvas}
            playEvery={2500}
            onClose={() => setPresenting(false)}
            className="w-[560px] shadow-lg"
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
          visible={!presenting}
          items={[{ type: 'widget', widget: 'present' }]}
        />
        <ControlPanel
          id="deck"
          position="bottom"
          offset={12}
          surface={false}
          visible={presenting}
          items={[{ type: 'widget', widget: 'deck' }]}
        />
      </GraphCanvasApp>
    );
  }
};
