// PlaybookStepper — the playbook as a toolbar group: ◀ · `n/N` · ▶ · ✕. It is
// what a toolbar collapses to while presenting, so it is toolbar-sized and
// carries no narration; the words live in `PlaybookPresenterBar`.
//
// ◀ / ▶ revert / play one step through `usePlaybook`, one move at a time (a held
// key or a double click never queues a second move). ✕ is the host's: it leaves
// presenting, which the stepper knows nothing about.

import type { Canvas } from '@invana/canvas';
import { CanvasContext, usePlaybook } from '@invana/canvas-react';
import { cn } from '@invana/ui';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useContext, useRef, useState } from 'react';

import { ToolbarItems } from '../../components';

export interface PlaybookStepperProps {
  /** The live canvas. Optional inside a `<Canvas>` tree. */
  canvas?: Canvas | null;
  /** Leave presenting. Omit it and there is no ✕. */
  onClose?: () => void;
  className?: string;
}

/** ◀ n/N ▶ ✕ — the playbook's position and moves, at toolbar size. */
export function PlaybookStepper({ canvas, ...rest }: PlaybookStepperProps) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === undefined ? fromContext : canvas;
  if (!resolved) return null;
  return <PlaybookStepperContent canvas={resolved} {...rest} />;
}

function PlaybookStepperContent({ canvas, onClose, className }: PlaybookStepperProps & { canvas: Canvas }) {
  const { steps, index, canNext, canPrevious, next, previous } = usePlaybook(canvas);
  const [busy, setBusy] = useState(false);
  // Mirrors `busy` synchronously, so a second click inside one render is ignored.
  const busyRef = useRef(false);

  const run = useCallback(async (move: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await move();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const position = steps.length === 0 ? '0/0' : `${Math.max(index + 1, 0)}/${steps.length}`;

  return (
    <ToolbarItems
      className={cn(className)}
      items={[
        { type: 'button', key: 'previous', icon: ChevronLeft, label: 'Previous step', disabled: busy || !canPrevious, onClick: () => void run(previous) },
        {
          type: 'custom',
          key: 'position',
          render: () => (
            <span aria-live="polite" className="min-w-8 px-1 text-center text-sm tabular-nums">
              {position}
            </span>
          ),
        },
        { type: 'button', key: 'next', icon: ChevronRight, label: 'Next step', disabled: busy || !canNext, onClick: () => void run(next) },
        ...(onClose ? [{ type: 'button' as const, key: 'close', icon: X, label: 'Close presenting', onClick: onClose }] : []),
      ]}
    />
  );
}
