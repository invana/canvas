// PlaybookPresenterBar — the canvas's **playbook** presented as a deck: the
// current step's title and narration at reading size, "Step n / N", ◀ Previous /
// Next ▶, and one dot per step to jump. RFC
// `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F20 + F39.
//
// The presenting counterpart of `PlaybookViewPanel` (the authoring surface): it
// shows **steps only**, never history entries (D-13), and offers no authoring —
// no Save as step, no JSON. It is a plain block; the host positions it over or
// beside the canvas (D-26). ← / → step only while focus is inside the bar, so it
// never takes the canvas's own keys (D-27).
//
// `variant="compact"` is the bar a host shows while a toolbar carries the moves
// (`PlaybookStepper`): the step's title as the prompt it answers, its narration
// beside an avatar, and one dot per step. No buttons — ◀ ▶ ✕ are the
// toolbar's — and no position count, which the stepper already shows.

import type { Canvas } from '@invana/canvas';
import { CanvasContext, usePlaybook } from '@invana/canvas-react';
import { Button, Card, cn } from '@invana/ui';
import type { CanvasConfig, StepSpec } from '@invana/canvas';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useContext, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface PlaybookPresenterBarProps {
  /**
   * The live canvas engine. Optional: inside a `<Canvas>` / `<GraphCanvas>` tree
   * the nearest one is used. `null` (not ready yet) renders a placeholder.
   */
  canvas?: Canvas | null;
  /** Show one dot per step (a click moves there). Default `true`. */
  showDots?: boolean;
  /** Extra classes for the bar root — typically the host's positioning. */
  className?: string;
  /**
   * `deck` (default): title, narration, ◀ Previous / Next ▶, dots, `Step n / N`.
   * `compact`: the title as a prompt bubble, the narration, the dots — the moves
   * live in a `PlaybookStepper`.
   */
  variant?: 'deck' | 'compact';
  /** Compact only: what leads the title — e.g. an expand or edit glyph for a step no one asked. */
  renderTitleIcon?: (step: StepSpec<CanvasConfig>) => ReactNode;
  /** Compact only: the avatar beside the narration. */
  narrationIcon?: ReactNode;
}

/** Keys that step forward / back while focus is inside the bar (F39). */
const NEXT_KEYS = new Set(['ArrowRight', 'PageDown']);
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'PageUp']);

/**
 * The playbook of a canvas as a presenter bar — the current step's title and
 * narration, the position, and the moves between steps. Drop it inside a canvas
 * tree with no props, or pass `canvas` to target a specific instance. Position
 * it yourself (e.g. `className="absolute inset-x-4 bottom-4"` over the canvas
 * host).
 *
 * - **◀ Previous / Next ▶** revert / play one step; a dot click moves to that
 *   step, playing or reverting every step in between.
 * - **← / →** (and PageUp / PageDown) do the same while focus is inside the
 *   bar — click it or tab into it. Keys pressed during a move are ignored.
 * - A step that fails validation writes nothing; its message shows in the bar.
 */
export function PlaybookPresenterBar({ canvas, className, ...rest }: PlaybookPresenterBarProps) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === undefined ? fromContext : canvas;
  if (!resolved) {
    return (
      <Card className={cn('flex items-center justify-center p-3', className)}>
        <p className="text-muted-foreground text-base">No canvas yet.</p>
      </Card>
    );
  }
  return <PlaybookPresenterBarContent canvas={resolved} className={className} {...rest} />;
}

/** The bar body — runs only with a live `canvas`, so the hooks can't throw. */
function PlaybookPresenterBarContent({
  canvas,
  showDots = true,
  className,
  variant = 'deck',
  renderTitleIcon,
  narrationIcon,
}: PlaybookPresenterBarProps & { canvas: Canvas }) {
  const { steps, current, index, canNext, canPrevious, next, previous, goTo } = usePlaybook(canvas);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mirrors `busy` synchronously: a held-down key repeats faster than React
  // re-renders, and each repeat must see the move already in flight.
  const busyRef = useRef(false);

  /** Run one playbook move; one at a time, errors shown instead of thrown. */
  const run = useCallback(async (move: () => Promise<void>): Promise<void> => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await move();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>): void => {
      if (NEXT_KEYS.has(e.key)) {
        e.preventDefault();
        if (canNext) void run(next);
      } else if (PREVIOUS_KEYS.has(e.key)) {
        e.preventDefault();
        if (canPrevious) void run(previous);
      }
    },
    [canNext, canPrevious, next, previous, run],
  );

  const dots = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5">
      {showDots &&
        steps.map((step, i) => (
          <Button
            key={step.id}
            variant="ghost"
            size="icon"
            disabled={busy}
            title={`${i + 1}. ${step.title}`}
            aria-label={`Go to step ${i + 1}: ${step.title}`}
            aria-current={i === index ? 'step' : undefined}
            onClick={() => {
              if (i !== index) void run(() => goTo(step.id));
            }}
            className="size-5"
          >
            <span
              className={cn(
                'size-2 rounded-full',
                i === index ? 'bg-primary' : i < index ? 'bg-primary/40' : 'bg-muted-foreground/30',
              )}
            />
          </Button>
        ))}
    </div>
  );

  if (variant === 'compact') {
    return (
      <Card
        role="group"
        aria-label="Playbook presenter"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={cn('focus-visible:ring-ring flex flex-col gap-2 p-3 outline-none focus-visible:ring-2', className)}
      >
        {current ? (
          <>
            <div className="flex items-center gap-2" aria-live="polite">
              {renderTitleIcon?.(current)}
              <span className="bg-accent rounded-sm px-2 py-1">{current.title}</span>
            </div>
            {current.narration && (
              <div className={cn('flex items-start gap-2', busy && 'opacity-50')}>
                {narrationIcon}
                <p className="line-clamp-4 leading-relaxed">{current.narration}</p>
              </div>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">{steps.length === 0 ? 'No steps' : 'Start'}</span>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {dots}
      </Card>
    );
  }

  return (
    <Card
      role="group"
      aria-label="Playbook presenter"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn('focus-visible:ring-ring flex flex-col gap-2 p-3 outline-none focus-visible:ring-2', className)}
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1" aria-live="polite">
          <span className="font-semibold">{current ? current.title : steps.length === 0 ? 'No steps' : 'Start'}</span>
          {current?.narration && <p className="text-muted-foreground text-base leading-relaxed">{current.narration}</p>}
        </div>
        <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
          {steps.length === 0 ? '' : index < 0 ? `${steps.length} steps` : `Step ${index + 1} / ${steps.length}`}
        </span>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={busy || !canPrevious} onClick={() => void run(previous)}>
          <ChevronLeft className="size-4" /> Previous
        </Button>

        {/* One dot per step: a click moves there (playing or reverting in between). */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5">
          {showDots &&
            steps.map((step, i) => (
              <Button
                key={step.id}
                variant="ghost"
                size="icon"
                disabled={busy}
                title={`${i + 1}. ${step.title}`}
                aria-label={`Go to step ${i + 1}: ${step.title}`}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => {
                  if (i !== index) void run(() => goTo(step.id));
                }}
                className="size-5"
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    i === index ? 'bg-primary' : i < index ? 'bg-primary/40' : 'bg-muted-foreground/30',
                  )}
                />
              </Button>
            ))}
        </div>

        <Button size="sm" disabled={busy || !canNext} onClick={() => void run(next)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
