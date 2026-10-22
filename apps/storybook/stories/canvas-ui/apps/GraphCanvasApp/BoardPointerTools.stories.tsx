/**
 * **Select ▾ · Hand — the pointer tools.** The row after the mode picker holds
 * two tools, one always in hand unless a mode's own tool is. The board opens in
 * Annotate with *Group* in hand — the case where a drag only ever made a group.
 *
 * | Do | What happens |
 * |---|---|
 * | scroll / pinch, with *Group* in hand | the board zooms — a tool takes drags, never the wheel |
 * | hold Space and drag | Hand is borrowed: the board pans; let go and *Group* is back |
 * | click Hand | a drag pans everywhere, on a node too; nothing is selected or grouped |
 * | Select ▾ | the trigger is only the kind's icon — pointer, lasso, box; the menu names them |
 * | pick any kind, even the one set | Select is back in hand, with that kind |
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useMemo, useState } from 'react';
import { useGraphCanvas } from '@invana/canvas-react';
import { GraphBoard, type BoardAnnotation } from '@invana/canvas-ui';
import { ANNOTATIONS, aroundValjean } from './annotationFixtures';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardPointerTools' };
export default meta;
type Story = StoryObj;

/** Opens in Annotate with Group in hand — what two clicks would do. */
function OpenWithGroup() {
  const canvas = useGraphCanvas();
  useEffect(() => {
    // Entering a mode puts its tools down, so Group is picked a beat after.
    const mode = setTimeout(() => void canvas.commands.run('board.mode', { value: 'annotate' }), 50);
    const tool = setTimeout(() => void canvas.commands.run('tool.active', { value: 'group' }), 300);
    return () => {
      clearTimeout(mode);
      clearTimeout(tool);
    };
  }, [canvas]);
  return null;
}

export const BoardPointerToolsStory: Story = {
  name: 'BoardPointerTools',
  render: () => {
    const data = useMemo(aroundValjean, []);
    const [annotations, setAnnotations] = useState<BoardAnnotation[]>(ANNOTATIONS);
    return (
      <div style={{ height: '100vh' }}>
        <GraphBoard
          data={data}
          annotations={annotations}
          annotationActor={{ id: 'me', canWrite: true, canSaveView: true }}
          onAnnotationCreate={(d) => setAnnotations((l) => [...l, { ...d, id: `a${l.length + 1}`, author: { id: 'me', name: 'You', kind: 'person', initials: 'Y' }, meta: 'just now', canEdit: true, canDelete: true }])}
          onAnnotationUpdate={(id, patch) => setAnnotations((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)))}
          onAnnotationDelete={(id) => setAnnotations((l) => l.filter((a) => a.id !== id))}
        >
          <OpenWithGroup />
        </GraphBoard>
      </div>
    );
  },
};
