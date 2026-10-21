/** Annotations on Les Misérables for the board's annotation stories — the host's rows, mapped. */

import type { BoardAnnotation } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

const me = { id: 'me', name: 'You', kind: 'person' as const, initials: 'Y' };
const priya = { id: 'priya', name: 'Priya Nair', kind: 'person' as const, initials: 'PN' };
const helper = { id: null, name: 'Assistant', kind: 'assistant' as const, initials: 'AI' };

export const ANNOTATIONS: BoardAnnotation[] = [
  { id: 'n1', kind: 'note', records: [{ id: 'Valjean', kind: 'node' }], text: 'Every thread of the story runs through him', color: 'amber', author: priya, meta: '2 Oct' },
  { id: 'n2', kind: 'note', records: [{ id: 'Javert', kind: 'node' }], text: 'Never in a scene without Valjean after book one', color: 'blue', author: helper, meta: 'Answer 1' },
  { id: 'v1', kind: 'value', records: [{ id: 'Fantine', kind: 'node' }], prop: 'group', valueThen: 9, text: 'Moved groups after the factory chapters', color: 'red', author: me, meta: 'today', canEdit: true, canDelete: true },
  { id: 'n3', kind: 'note', records: [{ id: 'Cosette', kind: 'node' }], text: 'The one thread that ends happily', color: 'green', author: me, meta: 'today', canEdit: true, canDelete: true },
  { id: 'h1', kind: 'highlight', records: [{ id: 'Valjean', kind: 'node' }, { id: 'Javert', kind: 'node' }], text: 'The pursuit', color: 'amber', author: me, meta: 'today' },
  { id: 'g1', kind: 'group', records: [{ id: 'Cosette', kind: 'node' }, { id: 'Marius', kind: 'node' }, { id: 'Thenardier', kind: 'node' }], label: 'Rue Plumet', text: '', color: 'blue', author: priya, meta: '4 Oct' },
];

/** Valjean and everyone who shares a scene with him. */
export function aroundValjean(): GraphData {
  const ids = new Set(['Valjean']);
  for (const e of lesMiserables.edges) {
    if (e.source === 'Valjean') ids.add(e.target);
    if (e.target === 'Valjean') ids.add(e.source);
  }
  return { nodes: lesMiserables.nodes.filter((n) => ids.has(n.id)), edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) };
}
