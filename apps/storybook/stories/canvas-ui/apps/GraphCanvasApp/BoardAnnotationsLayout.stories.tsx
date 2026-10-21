/**
 * **Annotations laid out with the data.** Each card is a node in the graph,
 * linked to its record by a dashed edge, so a layout places it like any node,
 * and a PNG export carries them. The board opens on *Flow →* (ELK), which
 * places rectangles: no card overlaps a node or another card.
 *
 * | Moment | What happens |
 * |---|---|
 * | the board opens | each card is placed beside its record, nothing else moves |
 * | *Run the layout* (or right-click › *Layout…*) | the layout runs with the cards in it — each lands near its record, clear of the rest |
 * | Export › Image | the cards are in the picture |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { useGraphCanvas } from '@invana/canvas-react';
import { GraphBoard, type BoardAnnotation } from '@invana/canvas-ui';
import { Button } from '@invana/ui';
import { ANNOTATIONS, aroundValjean } from './annotationFixtures';

const CONFIG: CanvasConfig = { layoutPreset: { id: 'flow' } };

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardAnnotationsLayout' };
export default meta;
type Story = StoryObj;

/** One button over the board: run its active layout again, cards and all. */
function RunLayout() {
  const canvas = useGraphCanvas();
  return (
    <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
      <Button
        onClick={() => {
          const id = canvas.get().activeLayout;
          if (id) void canvas.runLayout(id, { fitCamera: { padding: 60 } });
        }}
      >
        Run the layout
      </Button>
    </div>
  );
}

export const BoardAnnotationsLayoutStory: Story = {
  name: 'BoardAnnotationsLayout',
  render: function Render() {
    const data = useMemo(aroundValjean, []);
    const [annotations] = useState<BoardAnnotation[]>(ANNOTATIONS);
    return (
      <div className="h-screen">
        <GraphBoard data={data} config={CONFIG} annotations={annotations} annotationActor={{ id: 'me', canWrite: true }}>
          <RunLayout />
        </GraphBoard>
      </div>
    );
  }
};
