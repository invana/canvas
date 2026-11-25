import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Presenter, useStepper, type PresenterStep } from '@invana/ui';
import type { GraphCanvas } from '@invana/graph';

import { useCanvasBoardContext } from './provider';

/** Where a canvas looks on a step: all of it, or the records lit. */
export type StoryCamera = 'fit' | 'focus';

/** What a step lights on one board canvas: node ids, and where the camera goes. */
export interface CanvasLit {
  /** The `canvasId` of the `canvas` panel. */
  canvasId: string;
  /** The nodes lit; the rest of that canvas dims. Empty lights nothing. */
  ids: readonly string[];
  /** Where the canvas looks. Omit it and the camera stays. */
  camera?: StoryCamera;
}

/** One step of a {@link BoardStory}: what is said, over which panel, and what is lit on a canvas. */
export interface BoardStoryStep {
  id: string;
  /** The step's heading. */
  title: ReactNode;
  /** What is said over the step. */
  narration?: ReactNode;
  /**
   * The panel in focus. The host draws it — it passes `focus` on that panel's spec, and calls out
   * any record inside it through the kind's own `highlight` — as only the host knows its kinds.
   */
  panel: string;
  /** The canvas this step lights, if any. Other canvases are cleared. */
  canvas?: CanvasLit;
}

const INTENT = { fit: 'all', focus: 'focus' } as const;

/**
 * Drive the camera and focus of a board's canvases from a script, and give them back.
 *
 * `show` focuses the given nodes on a canvas (the rest dim) and asks for the camera; every other
 * canvas the script touched is cleared. `release` clears the focus on all of them and returns each
 * camera to where it was before the script first touched it. Focus is a runtime state, so nothing
 * the viewer did (expanded or hidden nodes) is changed.
 *
 * Needs a {@link CanvasBoardProvider} above it and a `FocusBehaviour` on the canvas
 * (`GraphBoard` has one).
 */
export function useCanvasScript() {
  const { engines } = useCanvasBoardContext('canvas script');
  const live = useRef(engines);
  live.current = engines;
  const seen = useRef(new Map<string, { x: number; y: number; zoom: number }>());

  const clear = useCallback((canvasId: string) => {
    live.current[canvasId]?.store.actions.focus.clear();
  }, []);

  const show = useCallback(
    (lit: CanvasLit | undefined) => {
      for (const id of Object.keys(live.current)) if (id !== lit?.canvasId) clear(id);
      if (!lit) return;
      const canvas: GraphCanvas | null | undefined = live.current[lit.canvasId];
      if (!canvas) return;
      if (!seen.current.has(lit.canvasId))
        seen.current.set(lit.canvasId, { x: canvas.camera.x, y: canvas.camera.y, zoom: canvas.camera.scale });
      if (lit.ids.length) canvas.store.actions.focus.set(lit.ids, true);
      else canvas.store.actions.focus.clear();
      if (lit.camera) canvas.store.actions.cameraIntent.request(INTENT[lit.camera]);
    },
    [clear],
  );

  const release = useCallback(() => {
    for (const id of Object.keys(live.current)) clear(id);
    for (const [id, was] of seen.current) live.current[id]?.camera.animateTo(was, { durationMs: 450 });
    seen.current.clear();
  }, [clear]);

  return useMemo(() => ({ show, release }), [show, release]);
}

/** Props of {@link BoardStory}. */
export interface BoardStoryProps {
  steps: readonly BoardStoryStep[];
  /** The step on show, or `null` once the story is closed. Draw the panel focus from it. */
  onStep: (step: BoardStoryStep | null) => void;
  /** The ✕. Unmount the story in it. */
  onClose: () => void;
  /** The presenter's accessible name. */
  label?: string;
  /** Play's pace in ms. Default 5000. */
  playEvery?: number;
}

/**
 * A board walked step by step: the kit's `Presenter` over the board's bottom edge, with each step's
 * canvas lit and framed as it says. Closing it clears the canvases and puts their cameras back.
 *
 * It knows nothing of where a step comes from. A step is applied again whenever `steps` changes
 * while it shows — a re-read hands it new steps — so keep `steps` memoised: a new array every
 * render re-lights the canvas every render. Mount it inside the board's
 * {@link CanvasBoardProvider}, in a `relative` container.
 */
export function BoardStory({ steps, onStep, onClose, label, playEvery = 5000 }: BoardStoryProps) {
  const stepper = useStepper({ count: steps.length, initial: 0, playEvery });
  const script = useCanvasScript();
  const step = steps[Math.max(stepper.index, 0)];
  // The latest `onStep`, so a host that rebuilds it never ends the story.
  const told = useRef(onStep);
  told.current = onStep;

  useEffect(() => {
    if (!step) return;
    told.current(step);
    script.show(step.canvas);
  }, [step, script]);

  useEffect(
    () => () => {
      script.release();
      told.current(null);
    },
    [script],
  );

  const shown: PresenterStep[] = steps.map((s) => ({ id: s.id, title: s.title, narration: s.narration }));
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-3">
      <Presenter
        stepper={stepper}
        steps={shown}
        {...(label ? { label } : {})}
        onClose={onClose}
        className="pointer-events-auto w-full max-w-2xl shadow-lg"
      />
    </div>
  );
}
