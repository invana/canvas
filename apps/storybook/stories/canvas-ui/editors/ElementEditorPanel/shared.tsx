/** What the editor stories share: a narrow column, and the last values applied. */

import type { ElementEditorValues } from '@invana/canvas-ui';
import { Eyebrow, PanelBox } from '@invana/ui';
import type { ReactNode } from 'react';

export const MODEL = [
  { type: 'character', keys: [{ key: 'name', kind: 'text' }, { key: 'group', kind: 'number' }, { key: 'born', kind: 'date' }] },
  { type: 'place', keys: [{ key: 'name', kind: 'text' }, { key: 'city', kind: 'text' }] }
];

export function Column({ children, applied, log }: { children: ReactNode; applied: ElementEditorValues | null; log: string[] }) {
  return (
    <div className="flex items-start gap-4 p-4">
      <div className="w-80">{children}</div>
      <PanelBox title="What the host received" className="w-80">
        <pre className="text-xs whitespace-pre-wrap">{applied ? JSON.stringify(applied, null, 2) : 'nothing applied yet'}</pre>
        {log.map((line, i) => (
          <Eyebrow key={`${i}-${line}`}>{line}</Eyebrow>
        ))}
      </PanelBox>
    </div>
  );
}
