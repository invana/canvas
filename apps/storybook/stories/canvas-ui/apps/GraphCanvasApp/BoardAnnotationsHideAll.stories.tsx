/**
 * **Hide every annotation in one click.** The Legend's *Annotations* section
 * opens with the board: its first row, *All annotations*, has an eye. One click
 * takes every card, link, highlight ring and group frame off the board at once —
 * they leave the graph, so they take no layout space — and a second click
 * brings them back where they were drawn. The counts stay, so what is hidden is
 * never mistaken for nothing.
 *
 * The rows under it hide by author (*By you*, *By others*, *By the assistant*)
 * and by kind (*Highlights*, *Groups*); *In full · Badges* swaps the cards for
 * one count pill per record.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { GraphBoard, type AnnotationView, type BoardAnnotation } from '@invana/canvas-ui';
import { ANNOTATIONS, aroundValjean } from './annotationFixtures';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardAnnotationsHideAll' };
export default meta;
type Story = StoryObj;

export const BoardAnnotationsHideAllStory: Story = {
  name: 'BoardAnnotationsHideAll',
  render: function Render() {
    const data = useMemo(aroundValjean, []);
    const [annotations] = useState<BoardAnnotation[]>(ANNOTATIONS);
    const [view, setView] = useState<AnnotationView>({ density: 'full', hidden: {} });
    return (
      <div className="h-screen">
        <GraphBoard
          data={data}
          defaultPanel="legend"
          annotations={annotations}
          annotationActor={{ id: 'me', canWrite: true, canSaveView: true }}
          annotationView={view}
          onAnnotationViewChange={setView}
        />
      </div>
    );
  }
};
