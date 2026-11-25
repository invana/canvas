// usePlaybookStepper — the canvas's playbook as the kit's `Stepper`, so every
// playbook control (`PlaybookPresenter`, `PlaybookStepper`, `PlaybookViewPanel`)
// steps, waits and plays exactly as every other stepped walk in the kit.
//
// The engine holds the position (`canvas.playbook`); the stepper is hosted over
// it. A move to the next or previous step is the playbook's own `next` /
// `previous` (play / revert one step); any other move is `goTo`, and the start
// (before the first step) is a `goTo` the first step then a revert.

import type { Canvas } from '@invana/canvas';
import { usePlaybook } from '@invana/canvas-react';
import { useStepper, type Stepper } from '@invana/ui';

export interface UsePlaybookStepperOptions {
  /** Play's pace in ms. Omit it and the playbook cannot play. */
  playEvery?: number;
}

/** The playbook of `canvas` as a kit `Stepper`, and the playbook's own state. */
export function usePlaybookStepper(canvas: Canvas, { playEvery }: UsePlaybookStepperOptions = {}) {
  const playbook = usePlaybook(canvas);
  const { steps, index, next, previous, goTo } = playbook;
  const stepper: Stepper = useStepper({
    count: steps.length,
    index,
    before: true,
    playEvery,
    onMove: async (to) => {
      if (to === index + 1) return next();
      if (to === index - 1) return previous();
      if (to >= 0) return goTo(steps[to]!.id);
      await goTo(steps[0]!.id);
      return previous();
    },
  });
  return { stepper, playbook };
}
