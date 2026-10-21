/**
 * **Annotate — the board's annotations, written on the data.** In Annotate the
 * row's tools are *Annotate* (A) — click a node or a relationship and type —
 * *Highlight* (H) — a click, or a drag over several nodes — and *Group* (G) — a
 * drag around two or more nodes, then name it. A click on empty board says
 * *Annotations go on data*: nothing floats free.
 *
 * Cards are nodes in the graph: each is placed beside its record, linked to it
 * by a dashed edge, and laid out with the data on the next layout run. Select
 * one for its format bar: colour, delete (yours only).
 *
 * The story is the host: it keeps the annotations in state and writes what the
 * board hands it.
 */


import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { GraphBoard, useAnnotations, type AnnotationView, type BoardAnnotation, type AnnotationsPanelView } from '@invana/canvas-ui';
import { useGraphCanvas } from '@invana/canvas-react';
import { useEffect } from 'react';
import { lesMiserables } from '@invana/graph-datasets';
import type { GraphData } from '@invana/graph';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/BoardAnnotate' };
export default meta;
type Story = StoryObj;

const ANNOTATIONS: BoardAnnotation[] = [
  { id: 'n1', kind: 'note', records: [{ id: 'Valjean', kind: 'node', label: 'Valjean' }], text: 'Every thread of the story runs through him', color: 'amber', author: { id: 'priya', name: 'Priya Nair', kind: 'person', tone: 'success' }, meta: '2 Oct', canEdit: false, canDelete: false },
  { id: 'v1', kind: 'value', records: [{ id: 'Javert__Valjean', kind: 'edge', label: 'Javert–Valjean' }], prop: 'value', valueThen: 17, text: 'The most scenes any pair shares', color: 'blue', author: { id: 'me', name: 'You', kind: 'person', initials: 'Y' }, meta: 'today', canEdit: true, canDelete: true },
  { id: 'v2', kind: 'value', records: [{ id: 'Fantine', kind: 'node', label: 'Fantine' }], prop: 'group', valueThen: 9, text: 'Moved groups after the factory chapters', color: 'red', author: { id: 'sam', name: 'Sam Okafor', kind: 'person', tone: 'warning' }, meta: '28 Sep', canEdit: false, canDelete: false },
  { id: 'h1', kind: 'highlight', records: [{ id: 'Valjean', kind: 'node', label: 'Valjean' }, { id: 'Javert', kind: 'node', label: 'Javert' }, { id: 'Fantine', kind: 'node', label: 'Fantine' }], text: 'The pursuit', color: 'amber', author: { id: 'me', name: 'You', kind: 'person', initials: 'Y' }, meta: 'today', canEdit: true, canDelete: true },
  { id: 'g1', kind: 'group', records: [{ id: 'Cosette', kind: 'node', label: 'Cosette' }, { id: 'Marius', kind: 'node', label: 'Marius' }, { id: 'Thenardier', kind: 'node', label: 'Thenardier' }], label: 'Rue Plumet', text: '', color: 'blue', author: { id: 'priya', name: 'Priya Nair', kind: 'person', tone: 'success' }, meta: '4 Oct', canEdit: false, canDelete: false },
  { id: 'e1', kind: 'note', records: [{ id: 'Napoleon', kind: 'node', label: 'Napoleon' }], text: 'Only ever mentioned, never on stage', color: 'grey', author: { id: 'sam', name: 'Sam Okafor', kind: 'person', tone: 'warning' }, meta: '11 Sep', canEdit: false, canDelete: false },
];

/** Valjean and everyone who shares a scene with him. */
function aroundValjean(): GraphData {
  const ids = new Set(['Valjean']);
  for (const e of lesMiserables.edges) {
    if (e.source === 'Valjean') ids.add(e.target);
    if (e.target === 'Valjean') ids.add(e.source);
  }
  return { nodes: lesMiserables.nodes.filter((n) => ids.has(n.id)), edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) };
}

/** Opens the board in a mode, on one view of the Annotations panel — what a click would do. */
function OpenOn({ mode, view }: { mode: string; view: AnnotationsPanelView }) {
  const canvas = useGraphCanvas();
  const ctx = useAnnotations();
  useEffect(() => {
    const t = setTimeout(() => {
      void canvas.commands.run('board.mode', { value: mode });
      ctx.openPanel(view);
    }, 50);
    return () => clearTimeout(t);
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export const BoardAnnotateStory: Story = {
  name: 'BoardAnnotate',
  render: () => {
    const data = useMemo(aroundValjean, []);
    const [annotations, setAnnotations] = useState<BoardAnnotation[]>(ANNOTATIONS);
    const [view, setView] = useState<AnnotationView>({ density: 'full', hidden: {} });
    return (
      <div style={{ height: '100vh' }}>
        <GraphBoard
          data={data}
          defaultPanel="annotations"
          annotations={annotations}
          annotationActor={{ id: 'me', canWrite: true, canSaveView: true }}
          annotationView={view}
          onAnnotationViewChange={setView}
          onAnnotationCreate={(d) => setAnnotations((l) => [...l, { ...d, id: `a${l.length + 1}`, author: { id: 'me', name: 'You', kind: 'person', initials: 'Y' }, meta: 'just now', canEdit: true, canDelete: true }])}
          onAnnotationUpdate={(id, patch) => setAnnotations((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)))}
          onAnnotationDelete={(id) => setAnnotations((l) => l.filter((a) => a.id !== id))}
        >
          <OpenOn mode="annotate" view={{ kind: 'list' }} />
        </GraphBoard>
      </div>
    );
  },
};
