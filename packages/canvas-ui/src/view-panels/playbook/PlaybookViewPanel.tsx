// PlaybookViewPanel — the canvas's **playbook** (the script of JSON steps and the
// position in it) as a dockable panel: the step list, the current step's
// narration, ◀ Previous / Next ▶, a row click to jump, **Save as step** (the work
// done since the last step becomes a step) and **Copy JSON**. RFC
// `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F35.
//
// Built on canvas-react's headless hooks: `usePlaybook` for the script and the
// moves, `useHistoryEntries` only as a change signal for "is there unsaved work".
// Every write is the playbook's own (`next` / `previous` / `goTo` / `addStep`),
// so the panel holds no canvas state — only the in-flight flag, the last error
// and the draft title of the step being saved.

import type { Canvas, CanvasConfig, StepSpec } from '@invana/canvas';
import { CanvasContext, useHistoryEntries, usePlaybook } from '@invana/canvas-react';
import { Input } from '@invana/forms';
import { Badge, Button, Card, Separator, cn } from '@invana/ui';
import { ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react';
import { useCallback, useContext, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { ACTIVE_CLASS } from '../../components/styles';

export interface PlaybookViewPanelProps {
  /**
   * The live canvas engine. Optional: inside a `<Canvas>` / `<GraphCanvas>` tree
   * the nearest one is used. `null` (not ready yet) renders a placeholder.
   */
  canvas?: Canvas | null;
  /** Show **Save as step** (turn the work since the last step into a step). Default `true`. */
  showSaveStep?: boolean;
  /** Show **Copy JSON** (the script, as `playbook.toJSON()`). Default `true`. */
  showCopyJson?: boolean;
  /** Extra classes for the panel root. */
  className?: string;
}

/**
 * The playbook of a canvas — steps, position, narration and the moves between
 * steps — as a panel. Drop it inside a canvas tree with no props, or pass
 * `canvas` to target a specific instance.
 *
 * - **◀ Previous / Next ▶** revert / play one step; a row click moves to that
 *   step, playing or reverting every step in between.
 * - A step that fails validation writes nothing; its message shows under the
 *   controls.
 * - **Save as step** takes `history.sinceLastStep(title)` and adds it: the work
 *   is already on the canvas, so the playbook adopts its entries instead of
 *   playing them again. Only offered at the last step, where adoption applies.
 */
export function PlaybookViewPanel({ canvas, className, ...rest }: PlaybookViewPanelProps) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === undefined ? fromContext : canvas;
  if (!resolved) {
    return (
      <Card className={cn('flex h-full w-full items-center justify-center', className)}>
        <p className="text-muted-foreground p-4 text-base">No canvas yet.</p>
      </Card>
    );
  }
  return <PlaybookViewPanelContent canvas={resolved} className={className} {...rest} />;
}

/** Whether a `sinceLastStep` result carries anything besides its id and title. */
function hasWork(step: StepSpec<CanvasConfig>): boolean {
  return step.data !== undefined || step.settings !== undefined || step.view !== undefined;
}

/** The panel body — runs only with a live `canvas`, so the hooks can't throw. */
function PlaybookViewPanelContent({
  canvas,
  showSaveStep = true,
  showCopyJson = true,
  className,
}: PlaybookViewPanelProps & { canvas: Canvas }) {
  const { playbook, title, steps, current, index, canNext, canPrevious, next, previous, goTo } = usePlaybook(canvas);
  // Re-render on every log change: "unsaved work" is whether the newest applied
  // entry belongs to no step.
  const entries = useHistoryEntries(undefined, canvas);
  const unsaved = entries.length > 0 && entries[entries.length - 1]!.stepId === undefined;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  /** Run one playbook move; one at a time, errors shown instead of thrown. */
  const run = useCallback(async (move: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await move();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const saveStep = useCallback((): void => {
    const stepTitle = draft.trim() || `Step ${steps.length + 1}`;
    const step = canvas.history.sinceLastStep<CanvasConfig>(stepTitle);
    setError(null);
    if (!hasWork(step)) {
      setError('Nothing to save: the work since the last step changes nothing.');
      return;
    }
    try {
      playbook.addStep(step);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [canvas, playbook, draft, steps.length]);

  const copyJson = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(playbook.toJSON(), null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError(`Copy failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [playbook]);

  return (
    <div className={cn('flex h-full flex-col gap-2 overflow-hidden p-2 text-base', className)}>
      {/* Title + position. */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{title}</span>
        <span className="text-muted-foreground shrink-0 text-sm">
          {steps.length === 0 ? 'no steps' : `${index + 1} / ${steps.length}`}
        </span>
      </div>

      {/* The current step and its narration. */}
      <div className="bg-muted/40 flex flex-col gap-1 rounded-md p-2">
        <span className="font-medium">{current ? current.title : 'Start'}</span>
        {current?.narration ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{current.narration}</p>
        ) : (
          !current && <p className="text-muted-foreground text-sm">Before the first step.</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={busy || !canPrevious} onClick={() => void run(previous)}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button size="sm" disabled={busy || !canNext} onClick={() => void run(next)}>
          Next <ChevronRight className="size-4" />
        </Button>
        {showCopyJson && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void copyJson()} title="Copy the playbook as JSON">
            <Copy className="size-4" /> {copied ? 'Copied' : 'JSON'}
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Separator />

      {/* The script. A row click moves there (playing or reverting in between). */}
      <ol className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {steps.map((step, i) => (
          <li key={step.id}>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => {
                if (i !== index) void run(() => goTo(step.id));
              }}
              className={cn(
                'h-auto w-full justify-start gap-2 px-2 py-1 text-left font-normal',
                i === index && ACTIVE_CLASS,
                i > index && 'text-muted-foreground',
              )}
            >
              <span className="w-5 shrink-0 text-right text-sm tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{step.title}</span>
              {step.actor && (
                <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                  {step.actor}
                </Badge>
              )}
            </Button>
          </li>
        ))}
        {steps.length === 0 && <li className="text-muted-foreground px-2 text-sm">No steps yet.</li>}
      </ol>

      {showSaveStep && (
        <>
          <Separator />
          <div className="flex items-center gap-1">
            <Input
              value={draft}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && unsaved && !canNext && !busy) saveStep();
              }}
              placeholder={`Step ${steps.length + 1}`}
              className="h-8 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={busy || !unsaved || canNext}
              onClick={saveStep}
              title={canNext ? 'Go to the last step to save your work as a step' : 'Save the work since the last step as a step'}
            >
              <Plus className="size-4" /> Save as step
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
