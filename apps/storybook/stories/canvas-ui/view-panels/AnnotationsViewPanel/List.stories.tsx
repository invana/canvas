/**
 * **The Annotations panel — the list.** What is said about the board's records,
 * read in one place: *On this board* (each with its own eye, to hide it on this
 * board only) and *Elsewhere in this graph* — annotations on records the board
 * has not loaded, dimmed, with *Load*. The filter is by author: you · others ·
 * the assistant. A strip says how many are hidden, with *Show*.
 *
 * The board is Les Misérables around Valjean; five annotations are on what it
 * drew, one on Napoleon, who is not on it. Pick a row to open it; *Load* calls
 * the host's `onLoadRecords`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { GraphBoard, type AnnotationView, type BoardAnnotation } from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import type { GraphData } from '@invana/graph';

const meta: Meta = { title: 'canvas-ui/view-panels/AnnotationsViewPanel/List' };
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

export const ListStory: Story = {
  name: 'List',
  render: () => {
    const data = useMemo(aroundValjean, []);
    const [view, setView] = useState<AnnotationView>({ density: 'full', hidden: {}, hiddenIds: ['v1'] });
    return (
      <div style={{ height: '100vh' }}>
        <GraphBoard
          data={data}
          defaultPanel="annotations"
          annotations={ANNOTATIONS}
          annotationActor={{ id: 'me', canWrite: true, canSaveView: true }}
          annotationView={view}
          onAnnotationViewChange={setView}
          onLoadRecords={(ids) => console.log('load', ids)}
        />
      </div>
    );
  },
};
