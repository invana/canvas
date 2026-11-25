// PlaybookPresenter — the canvas's **playbook** presented: the kit's `Presenter`
// over `usePlaybookStepper`. RFC
// `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F20 + F39.
//
// The presenting counterpart of `PlaybookViewPanel` (the authoring surface): it
// shows **steps only**, never history entries (D-13), and offers no authoring —
// no Save as step, no JSON. It is a plain block; the host positions it over or
// beside the canvas (D-26). ← / → step only while focus is inside it, so it
// never takes the canvas's own keys (D-27). It draws nothing of its own: the
// deck and compact bars, the dots, Play and the keys are the kit's `Presenter`.

import type { Canvas, CanvasConfig, StepSpec } from '@invana/canvas';
import { CanvasContext } from '@invana/canvas-react';
import { Card, cn, Presenter } from '@invana/ui';
import { useContext, type ReactNode } from 'react';

import { usePlaybookStepper } from './usePlaybookStepper';

export interface PlaybookPresenterProps {
  /**
   * The live canvas engine. Optional: inside a `<Canvas>` / `<GraphCanvas>` tree
   * the nearest one is used. `null` (not ready yet) renders a placeholder.
   */
  canvas?: Canvas | null;
  /** Show one dot per step (a click moves there). Default `true`. */
  showDots?: boolean;
  /** Extra classes for the root — typically the host's positioning. */
  className?: string;
  /**
   * `deck` (default): title, narration, ◀ Previous / Next ▶, dots, `Step n / N`.
   * `compact`: the title as a prompt bubble, the narration, the dots — the moves
   * live in a `PlaybookStepper`.
   */
  variant?: 'deck' | 'compact';
  /** Deck: Play steps on every `playEvery` ms. Omit it and there is no Play. */
  playEvery?: number;
  /** Deck: leave presenting. Omit it and there is no ✕. */
  onClose?: () => void;
  /** Compact only: what leads the title — e.g. an expand or edit glyph for a step no one asked. */
  renderTitleIcon?: (step: StepSpec<CanvasConfig>) => ReactNode;
  /** Compact only: the avatar beside the narration. */
  narrationIcon?: ReactNode;
}

/**
 * The playbook of a canvas, presented — the current step's title and narration,
 * the position and the moves. Drop it inside a canvas tree with no props, or
 * pass `canvas`. Position it yourself (e.g. `className="absolute inset-x-4
 * bottom-4"` over the canvas host). A step that fails validation writes nothing;
 * its message shows in it.
 */
export function PlaybookPresenter({ canvas, className, ...rest }: PlaybookPresenterProps) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === undefined ? fromContext : canvas;
  if (!resolved) {
    return (
      <Card className={cn('flex items-center justify-center p-3', className)}>
        <p className="text-muted-foreground">No canvas yet.</p>
      </Card>
    );
  }
  return <PlaybookPresenterContent canvas={resolved} className={className} {...rest} />;
}

/** The body — runs only with a live `canvas`, so the hooks can't throw. */
function PlaybookPresenterContent({
  canvas,
  showDots = true,
  className,
  variant = 'deck',
  playEvery,
  onClose,
  renderTitleIcon,
  narrationIcon,
}: PlaybookPresenterProps & { canvas: Canvas }) {
  const { stepper, playbook } = usePlaybookStepper(canvas, { playEvery });
  const { steps } = playbook;
  return (
    <Presenter
      stepper={stepper}
      steps={steps.map((s) => ({ id: s.id, title: s.title, narration: s.narration }))}
      variant={variant}
      showDots={showDots}
      onClose={onClose}
      label="Playbook presenter"
      renderTitleIcon={
        renderTitleIcon ? (s) => renderTitleIcon(steps.find((step) => step.id === s.id)!) : undefined
      }
      narrationIcon={narrationIcon}
      className={className}
    />
  );
}
