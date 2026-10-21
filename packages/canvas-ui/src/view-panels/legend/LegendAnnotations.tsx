// LegendAnnotations — the Legend's *Annotations* section: the board's annotations
// switched on and off the way types are. A master row, then by author (you ·
// others · the assistant) and by kind (highlights · groups), each with its count
// and an eye; a hidden row stays, struck, to bring it back. The master row's
// menu picks how they draw — *In full* or *Badges*.
//
// What it hides is the board's view, saved with the board by its host; a
// viewer's switches are theirs alone, and the section says so.

import { useBoardMode } from '@invana/canvas-react';
import { Eyebrow, Legend, LegendItem, SegmentedControl } from '@invana/ui';

import { authorGroup, useAnnotationsOptional } from '../../board/annotations/AnnotationsProvider';
import type { AnnotationHideKey } from '../../board/annotations/types';
import type { Canvas } from '@invana/canvas';

const ROWS: { key: Exclude<AnnotationHideKey, 'all'>; label: string; color: string }[] = [
  { key: 'mine', label: 'By you', color: 'var(--color-primary)' },
  { key: 'others', label: 'By others', color: 'var(--color-success)' },
  { key: 'assistant', label: 'By the assistant', color: 'var(--color-info)' },
  { key: 'highlight', label: 'Highlights', color: 'var(--color-warning)' },
  { key: 'group', label: 'Groups', color: 'var(--color-primary)' },
];

/** Nothing without a board that has annotations on what it loaded. */
export function LegendAnnotations({ canvas }: { canvas: Canvas | null }) {
  const ctx = useAnnotationsOptional();
  const mode = useBoardMode(canvas ?? undefined);
  if (!ctx) return null;
  const here = ctx.annotations.filter((a) => ctx.onBoard(a));
  if (here.length === 0) return null;
  const count = (key: Exclude<AnnotationHideKey, 'all'>) =>
    here.filter((a) => (key === 'highlight' || key === 'group' ? a.kind === key : authorGroup(a, ctx.isMine) === key)).length;
  const all = !!ctx.view.hidden.all;
  return (
    <>
      <div className="flex items-center gap-2 pt-1">
        <Eyebrow className="flex-1">Annotations</Eyebrow>
        {mode !== 'annotate' && (
          <SegmentedControl
            size="xs"
            aria-label="How annotations draw"
            options={[
              { value: 'full', label: 'In full' },
              { value: 'badges', label: 'Badges' },
            ]}
            value={ctx.view.density}
            onValueChange={(v) => ctx.setView({ ...ctx.view, density: v as 'full' | 'badges' })}
          />
        )}
      </div>
      {ctx.actor.canSaveView === false && <p className="text-muted-foreground px-1 text-xs">Not saved: you can view this board only.</p>}
      <Legend orientation="column">
        <LegendItem
          kind="dot"
          color="var(--color-warning)"
          label="All annotations"
          count={here.length.toLocaleString()}
          pressed={!all}
          onToggle={() => ctx.toggleHide('all')}
          title={`${all ? 'Show' : 'Hide'} every annotation on this board`}
        />
        {ROWS.filter((r) => count(r.key) > 0).map((r) => {
          const off = all || !!ctx.view.hidden[r.key];
          return (
            <LegendItem
              key={r.key}
              kind={r.key === 'group' ? 'box' : r.key === 'highlight' ? 'ring' : 'dot'}
              color={r.color}
              label={r.label}
              count={count(r.key).toLocaleString()}
              pressed={!off}
              onToggle={() => ctx.toggleHide(r.key)}
              title={`${off ? 'Show' : 'Hide'} ${r.label.toLowerCase()}`}
            />
          );
        })}
      </Legend>
      <p className="text-muted-foreground px-1 text-xs">Hidden here is hidden for everyone who opens this board.</p>
    </>
  );
}
