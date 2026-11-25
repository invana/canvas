// PlaybookStepper — the playbook as a toolbar group: the kit's `StepperControls`
// (◀ · `n/N` · ▶ · ✕) over `usePlaybookStepper`. It is what a toolbar collapses
// to while presenting, so it is toolbar-sized and carries no narration; the
// words live in `PlaybookPresenter`. ✕ is the host's: it leaves presenting,
// which the stepper knows nothing about.

import type { Canvas } from '@invana/canvas';
import { CanvasContext } from '@invana/canvas-react';
import { StepperControls } from '@invana/ui';
import { useContext } from 'react';

import { usePlaybookStepper } from './usePlaybookStepper';

export interface PlaybookStepperProps {
  /** The live canvas. Optional inside a `<Canvas>` tree. */
  canvas?: Canvas | null;
  /** Leave presenting. Omit it and there is no ✕. */
  onClose?: () => void;
  /** Play steps on every `playEvery` ms. Omit it and there is no Play. */
  playEvery?: number;
  className?: string;
}

/** ◀ n/N ▶ ✕ — the playbook's position and moves, at toolbar size. */
export function PlaybookStepper({ canvas, ...rest }: PlaybookStepperProps) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === undefined ? fromContext : canvas;
  if (!resolved) return null;
  return <PlaybookStepperContent canvas={resolved} {...rest} />;
}

function PlaybookStepperContent({ canvas, onClose, playEvery, className }: PlaybookStepperProps & { canvas: Canvas }) {
  const { stepper } = usePlaybookStepper(canvas, { playEvery });
  return <StepperControls stepper={stepper} onClose={onClose} closeLabel="Close presenting" className={className} />;
}
