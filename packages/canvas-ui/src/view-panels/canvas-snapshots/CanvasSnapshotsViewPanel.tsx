// CanvasSnapshotsViewPanel — the timeline of a canvas's saved snapshots, and
// the thing that takes them.
//
// It used to be the one `view-panels/` surface that read nothing live: the host
// supplied rows and handled every verb. That meant each host re-implemented the
// same `exportState` + thumbnail + summary capture, the same `importState`
// restore with the same two refusal branches, a `setState` map for a rename the
// panel had already computed, and its own wording for every message — around 90
// lines, duplicated, and easy to get subtly different.
//
// So the panel takes the live `canvas` and does the work, like its neighbours
// (`FindInCanvasViewPanel`, `CanvasFiltersViewPanel`, `SelectionViewPanel` all
// take a canvas and drive it). What a host keeps is the part only a host can do:
// `onCreateSnapshot` / `onUpdateSnapshot` / `onDeleteSnapshot` report what
// happened so it can persist server-side, and a rejected promise rolls the
// change back. Pass none of them and the panel still works.
//
// **The snapshot lives on the row** (`CanvasSnapshot.state`). An earlier design
// kept the document in a parallel map because a presentational panel would never
// read it; the panel restores now, so two collections to keep in step is exactly
// the bookkeeping this removes.
//
// Rows are grouped by the day they were captured, newest first, so "the one from
// this morning" is found by scanning day headings rather than timestamps.
//
// **The thumbnail is the restore control.** Clicking the picture loads that
// snapshot onto the canvas, and a tooltip says so before the click. There is no
// separate restore button and no `Current` badge: both were chrome for a
// fork-a-version model that `importState` — which loads **in place** — does not
// implement. The frame is therefore rendered for *every* row, including one whose
// banner has not arrived and one that never had a picture; a row with no way back
// is a dead end, and the picture is the only way back.
//
// Thumbnails are captured by the panel. `renderThumbnail` stays as an **override**
// for a host that loads banners itself (Invana runs one query per visible row).
//
// A row's title is renameable in place: the panel holds the in-flight draft,
// commits on Enter or blur, and rolls back if the host's save rejects.
//
// Bare content like its neighbours — chrome is the host's `<Panel>` +
// `<PanelContent>`. Cross-package imports stay limited to `@invana/ui` and
// **types** from `@invana/canvas` (the engine arrives as a prop, never as a value
// import — `pnpm check-boundaries` enforces it); `Tooltipped` is an in-package
// sibling, the documented way every interactive control in canvas-ui surfaces
// its label.

import { Button, ScrollArea, Skeleton, cn } from '@invana/ui';
import { Camera, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { Tooltipped } from '../../components/Tooltipped';
import { type KeyboardEvent, type ReactNode, useCallback, useMemo, useState } from 'react';
// Types only — the engine arrives as the `canvas` prop, never as an import.
// `pnpm check-boundaries` enforces that canvas-ui pulls no engine *value*.
import type { Canvas, CanvasStateSnapshot } from '@invana/canvas';

/**
 * One saved snapshot of a canvas — the row **and** the document it restores.
 *
 * The panel mints these itself on capture and hands them to
 * {@link CanvasSnapshotEvents.onCreateSnapshot} for a host that persists. A host
 * loading its own history back passes the same shape in, `state` included.
 */
export interface CanvasSnapshot {
  /** Stable id. The panel mints `snap-<epoch>`; a host that persists may replace it. */
  id: string;
  /** When it was captured. A `Date`, an epoch in ms, or anything `new Date(…)` parses. */
  capturedAt: Date | string | number;
  /** Row title. Falls back to {@link CanvasSnapshotsViewPanelProps.untitledLabel}. */
  label?: string;
  /** What changed in this snapshot — one line under the title. */
  summary?: string;
  /** Who captured it, when the host tracks that. */
  by?: string;
  /** Thumbnail src, when the host already holds one. Ignored if `renderThumbnail` returns a node. */
  thumbnail?: string;
  /**
   * True when a thumbnail exists but is not loaded yet — the panel reserves the
   * frame and shows a skeleton, so rows do not jump as banners arrive.
   */
  hasThumbnail?: boolean;
  /**
   * **The snapshot itself** — what `canvas.exportState()` returned: definition,
   * interaction (selection · hover · focus · camera · view mode) and every data
   * layer's records with their positions.
   *
   * The panel captures it and restores from it. A row without one is a label for
   * a document that isn't here (a seeded demo row, or a server row whose body
   * hasn't loaded) and says so rather than half-restoring.
   */
  state?: CanvasStateSnapshot;
}

/**
 * What the panel did, for a host that wants to persist it. Every one is a
 * **notification, not the mechanism** — the panel has already applied the change
 * on screen. Return a promise and a rejection rolls the change back, so a failed
 * save never leaves a row that exists only in the browser.
 */
export interface CanvasSnapshotEvents {
  /** A snapshot was captured. The row carries its `state` — persist it whole. */
  onCreateSnapshot?: (snapshot: CanvasSnapshot) => void | Promise<void>;
  /** A snapshot changed. `change` is the delta; `snapshot` is the row after it. */
  onUpdateSnapshot?: (snapshot: CanvasSnapshot, change: { label?: string }) => void | Promise<void>;
  /** A snapshot was deleted. */
  onDeleteSnapshot?: (id: string) => void | Promise<void>;
  /** A snapshot was loaded onto the canvas. Nothing changed server-side — for logging. */
  onRestoreSnapshot?: (snapshot: CanvasSnapshot) => void;
}

/** Every user-facing string the panel says, so wording stays consistent and localisable. */
export interface CanvasSnapshotMessages {
  captured: string;
  captureFailed: string;
  restored: (label: string) => string;
  restoreMissingState: (label: string) => string;
  restoreIncompatible: (label: string) => string;
  saveFailed: string;
  deleteFailed: string;
}

const DEFAULT_MESSAGES: CanvasSnapshotMessages = {
  captured: 'Captured — the new snapshot is at the top of the timeline',
  captureFailed: 'Could not capture this canvas',
  restored: (label) => `Loaded "${label}" onto the canvas`,
  restoreMissingState: (label) => `"${label}" has no saved state to load`,
  restoreIncompatible: (label) => `"${label}" was saved by a newer version and cannot be loaded`,
  saveFailed: 'Could not save that change — it has been undone',
  deleteFailed: 'Could not delete that snapshot — it has been restored',
};

export interface CanvasSnapshotsViewPanelProps extends CanvasSnapshotEvents {
  /**
   * The live canvas. The panel captures from it and restores onto it, so with a
   * `null` canvas (before `<Canvas>` publishes one) capture and restore are
   * inert and the timeline is read-only.
   */
  canvas: Canvas | null;
  /**
   * History the panel starts with, in **uncontrolled** mode — seed rows, or a
   * server history loaded once. The panel owns the list from then on.
   *
   * Ignored when {@link snapshots} is passed.
   */
  initialSnapshots?: CanvasSnapshot[];
  /**
   * Switches the panel to **controlled** mode: it renders exactly these rows and
   * never mutates its own list. It still captures, restores and fires the events
   * — the host applies them and passes the new array back.
   *
   * Use this when the server is the source of truth. Omit it and the panel keeps
   * the list itself, which is what makes the zero-config case work.
   */
  snapshots?: CanvasSnapshot[];
  /** Tooltip + accessible name on the thumbnail. Default `'Click to load this snapshot onto the canvas'`. */
  restoreHint?: string;
  /**
   * The snapshot currently loaded onto the canvas — **the only row that gets a
   * highlight**. The panel tracks this itself (the last row captured or
   * restored), so the zero-config case marks the right row; pass it to drive the
   * highlight yourself, which is what a host with one list per board does.
   */
  activeSnapshotId?: string | null;
  /** Draw the capture button. Default `true`. */
  showCapture?: boolean;
  /** Text on the capture button. Default `'Take snapshot'`. */
  captureLabel?: string;
  /**
   * One line under the capture button saying what a snapshot contains. Default
   * names the three things people are surprised by — selection/highlight, element
   * positions, viewport. Pass `''` to draw no hint.
   */
  captureHint?: string;
  /** Label a captured snapshot lands with. Default `'Manual capture'`. */
  captureDefaultLabel?: string;
  /**
   * Thumbnail flavour. `'png'` (default) rasters the viewport; `'svg'` serialises
   * the live specs and stays crisp at any size, at a document size that tracks
   * the **graph** rather than the thumbnail — so it suits small and medium scenes.
   */
  thumbnailFormat?: 'png' | 'svg';
  /** Longest edge of a PNG thumbnail. Default `800` — the frame is ~800 device px at DPR 2. */
  thumbnailMaxSize?: number;
  /** What a thumbnail shows. Default `'viewport'` — what you were looking at, pan and zoom included. */
  captureArea?: 'viewport' | 'content';
  /** Allow deleting a snapshot (hover action + inline confirm). Default `true`. */
  allowDelete?: boolean;
  /** Allow renaming a snapshot's title in place. Default `true`. */
  allowRename?: boolean;
  /** True while the host is loading the list. */
  isLoading?: boolean;
  /** Shown when there are no snapshots. */
  emptyText?: string;
  /** Title for a snapshot with no label. Default `'Canvas snapshot'`. */
  untitledLabel?: string;
  /** Override any of the panel's user-facing strings. */
  messages?: Partial<CanvasSnapshotMessages>;
  /**
   * Thumbnail slot — the host's own (usually lazily-loading) image for a row.
   * Return `null`/`undefined` to fall back to {@link CanvasSnapshot.thumbnail}.
   *
   * **Presentational only.** The panel wraps the frame in the restore control, so
   * anything interactive returned here nests inside a button.
   */
  renderThumbnail?: (snapshot: CanvasSnapshot) => ReactNode;
  /** Locale for day headings and timestamps. Default: the browser's. */
  locale?: string;
  /** Class on the panel's root. */
  className?: string;
}

/** One day's worth of snapshots, newest day first. */
interface DayGroup {
  key: string;
  heading: string;
  snapshots: Array<CanvasSnapshot & { date: Date }>;
}

const DAY_MS = 86_400_000;

/**
 * The rename field. A styled native `<input>`: the `@invana/ui` build this package
 * resolves exports no plain `Input` (only `SearchInput` / `CommandInput` /
 * `SidebarInput`, all carrying semantics this field doesn't want), so the same
 * answer `PropertiesEditor` reached applies here — design-token classes on a bare
 * input, no hand-rolled CSS.
 */
const RENAME_INPUT_CLASS =
  'h-6 min-w-0 flex-1 rounded border border-border bg-background px-1.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60';

/**
 * A thumbnail of what is on screen, in the requested flavour. Never throws: an
 * export fails when the renderer is not ready or the region is empty, and a row
 * with no picture is better than a capture that didn't happen.
 */
function captureThumbnail(
  canvas: Canvas,
  format: 'png' | 'svg',
  area: 'viewport' | 'content',
  maxSize: number,
): string | undefined {
  try {
    if (format === 'svg') {
      // 16:9 to match the frame the row reserves — letterboxed, never cropped.
      const svg = canvas.exportSVGString({ area, background: 'canvas', aspectRatio: 16 / 9 });
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
    return canvas.exportDataURL({ format: 'png', area, background: 'canvas', maxSize });
  } catch {
    return undefined;
  }
}

/**
 * "N nodes · M edges", summed across every data-owning layer in the captured
 * document. Domain-free on purpose: it looks for `{ nodes, edges }` arrays
 * rather than a `'graph'` key, so a canvas with two data layers — or none —
 * summarises correctly instead of reading a layer id this package shouldn't know.
 */
function summarise(state: CanvasStateSnapshot): string | undefined {
  let nodes = 0;
  let edges = 0;
  for (const value of Object.values(state.data ?? {})) {
    const d = value as { nodes?: unknown[]; edges?: unknown[] } | null;
    if (Array.isArray(d?.nodes)) nodes += d.nodes.length;
    if (Array.isArray(d?.edges)) edges += d.edges.length;
  }
  if (nodes === 0 && edges === 0) return undefined;
  return `${nodes} nodes · ${edges} edges`;
}

/** Midnight of a date, in local time — the day two timestamps are compared on. */
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * *Today* · *Yesterday* · the weekday within the last week · the date beyond
 * that. Relative headings are what make a timeline scannable; an absolute date
 * is what makes an old one unambiguous.
 */
function dayHeading(date: Date, now: Date, locale?: string): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return date.toLocaleDateString(locale, { weekday: 'long' });
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

/** Group the snapshots by capture day, newest first within and across days. */
function groupByDay(snapshots: CanvasSnapshot[], now: Date, locale?: string): DayGroup[] {
  const dated = snapshots
    .map((v) => ({ ...v, date: new Date(v.capturedAt) }))
    .filter((v) => !Number.isNaN(v.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const groups: DayGroup[] = [];
  for (const v of dated) {
    const key = String(startOfDay(v.date));
    const last = groups[groups.length - 1];
    if (last?.key === key) last.snapshots.push(v);
    else groups.push({ key, heading: dayHeading(v.date, now, locale), snapshots: [v] });
  }
  return groups;
}

/** One snapshot. */
function SnapshotRow({
  snapshot,
  date,
  thumbnail,
  isActive,
  restoreHint,
  isRestoring,
  untitledLabel,
  locale,
  onRestore,
  onRename,
  isRenaming,
  onDelete,
  deleteArmed,
  onArmDelete,
  onDisarmDelete,
}: {
  snapshot: CanvasSnapshot;
  date: Date;
  thumbnail: ReactNode;
  /** This is the snapshot loaded on the canvas — the one row that is highlighted. */
  isActive: boolean;
  restoreHint: string;
  isRestoring: boolean;
  untitledLabel: string;
  locale?: string;
  onRestore: () => void;
  onRename?: (label: string) => void;
  isRenaming: boolean;
  onDelete?: () => void;
  deleteArmed: boolean;
  onArmDelete?: () => void;
  onDisarmDelete: () => void;
}) {
  const title = snapshot.label || untitledLabel;
  const time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

  // The in-flight name, and the *only* state this row owns: `null` is reading,
  // a string is editing. The committed value is never kept here — it arrives back
  // as a new `snapshot.label` from the host (see the props' `onRename` doc).
  const [draft, setDraft] = useState<string | null>(null);

  /**
   * Open the field seeded from the row's own label — deliberately `''` rather
   * than `untitledLabel` when there is none, so the placeholder can't be saved
   * as if the user had typed it.
   */
  const beginEdit = (): void => setDraft(snapshot.label ?? '');

  /** Commit the draft, but only when it differs from what the host already holds. */
  const commit = (): void => {
    if (draft === null) return;
    const next = draft.trim();
    setDraft(null);
    if (next !== (snapshot.label ?? '')) onRename?.(next);
  };

  const onFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft(null);
    }
  };

  return (
    <div
      className={cn(
        'group flex flex-col gap-1.5 rounded-md border border-border p-2',
        isActive && 'border-primary/60 bg-primary/5',
      )}
    >
      <Tooltipped label={restoreHint} side="left">
        <Button
          variant="ghost"
          className={cn(
            'h-auto w-full overflow-hidden rounded border border-border p-0',
            // Ring colour is scoped to the hover/focus states, never set at rest:
            // a bare `ring-primary/40` paints every row the moment anything gives
            // the button a ring width, which reads as "every snapshot is active".
            'ring-0 transition-shadow hover:ring-2 hover:ring-primary/40',
            'focus-visible:ring-2 focus-visible:ring-primary/40',
          )}
          disabled={isRestoring}
          aria-label={`${restoreHint}: ${title}`}
          onClick={onRestore}
        >
          {thumbnail}
        </Button>
      </Tooltipped>
      <div className="flex items-center gap-2">
        {draft !== null ? (
          <input
            className={RENAME_INPUT_CLASS}
            value={draft}
            autoFocus
            disabled={isRenaming}
            aria-label="Rename snapshot"
            placeholder={untitledLabel}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onFieldKeyDown}
            onBlur={commit}
          />
        ) : onRename ? (
          <Button
            variant="ghost"
            className="h-auto min-w-0 flex-1 justify-start gap-1.5 px-1 py-0 text-sm font-normal"
            title={`${title} — click to rename`}
            onClick={beginEdit}
          >
            <span className="min-w-0 truncate">{title}</span>
            <Pencil className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
          </Button>
        ) : (
          <span className="min-w-0 flex-1 truncate" title={title}>
            {title}
          </span>
        )}
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground" title={date.toLocaleString(locale)}>
          {time}
        </span>
        {onDelete &&
          (deleteArmed ? (
            // Armed: the second click deletes. An inline confirm rather than a
            // dialog — a docked panel should not open a modal, and one stray
            // click must not destroy a capture.
            <span className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={onDisarmDelete}>
                Cancel
              </Button>
            </span>
          ) : (
            <Tooltipped label="Delete snapshot" side="left">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-70 focus-visible:opacity-100"
                aria-label={`Delete ${title}`}
                onClick={onArmDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltipped>
          ))}
      </div>
      {(snapshot.summary || snapshot.by) && (
        <p className="text-xs text-muted-foreground">
          {snapshot.summary}
          {snapshot.summary && snapshot.by ? ' · ' : ''}
          {snapshot.by}
        </p>
      )}
    </div>
  );
}

/**
 * The saved snapshots of a canvas as a timeline — grouped by day, newest first.
 * Each row is its thumbnail, its (renameable) title and what changed, and the
 * **thumbnail is the restore control**: click the picture to load that snapshot
 * onto the canvas.
 *
 * **It does the work.** Given the live `canvas`, the panel captures
 * (`exportState` + a thumbnail + a summary), restores (`importState`), renames,
 * deletes, and says what it did through `canvas.showMessage`. A host that wants
 * none of that passes only `canvas` and has a working snapshot timeline; a host
 * that persists listens to {@link CanvasSnapshotEvents} and writes to its server.
 * Nobody re-implements the mechanics.
 *
 * **Controlled or not.** By default the panel owns the list (seed it with
 * `initialSnapshots`). Pass `snapshots` and it renders exactly that instead,
 * never mutating its own copy — for hosts where the server is the truth.
 *
 * **`renderThumbnail` is an optional override.** Captured rows carry their own
 * picture and the panel draws it, including a skeleton for one still loading and
 * a placeholder for one that never had a picture. Pass the slot only when the
 * host loads banners itself (one query per visible row), and return
 * presentational content — the panel wraps the frame in the restore control, so
 * anything interactive would nest inside a button.
 *
 * Bare content, like every `view-panels/` surface — wrap it in a `<Panel>` +
 * `<PanelContent>` for the floating-card chrome.
 */
export function CanvasSnapshotsViewPanel({
  canvas,
  initialSnapshots,
  snapshots: controlledSnapshots,
  onCreateSnapshot,
  onUpdateSnapshot,
  onDeleteSnapshot,
  onRestoreSnapshot,
  restoreHint = 'Click to load this snapshot onto the canvas',
  activeSnapshotId,
  showCapture = true,
  captureLabel = 'Take snapshot',
  captureHint = "Captures the whole canvas — what's selected and highlighted, where every element sits, and your current viewport.",
  captureDefaultLabel = 'Manual capture',
  thumbnailFormat = 'png',
  thumbnailMaxSize = 800,
  captureArea = 'viewport',
  allowDelete = true,
  allowRename = true,
  isLoading = false,
  emptyText = 'No saved snapshots yet. Each capture lands here, so you can go back to it.',
  untitledLabel = 'Canvas snapshot',
  messages,
  renderThumbnail,
  locale,
  className,
}: CanvasSnapshotsViewPanelProps) {
  const say = useMemo(() => ({ ...DEFAULT_MESSAGES, ...messages }), [messages]);

  // Uncontrolled state. `controlledSnapshots` wins when present and the panel
  // never writes here — the two modes must not both hold a list, or they drift.
  const [ownSnapshots, setOwnSnapshots] = useState<CanvasSnapshot[]>(initialSnapshots ?? []);
  const isControlled = controlledSnapshots !== undefined;
  const snapshots = isControlled ? controlledSnapshots : ownSnapshots;

  const [ownActiveId, setOwnActiveId] = useState<string | null>(null);
  const activeId = activeSnapshotId !== undefined ? activeSnapshotId : ownActiveId;

  const [isCapturing, setCapturing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** The row whose delete is armed — a second click confirms. Never a `window.confirm`. */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /** Apply a list change locally. A no-op in controlled mode, where the host owns the array. */
  const applyLocally = useCallback(
    (fn: (prev: CanvasSnapshot[]) => CanvasSnapshot[]): void => {
      if (!isControlled) setOwnSnapshots(fn);
    },
    [isControlled],
  );

  /**
   * Capture the canvas. The row is added (and the event fired) optimistically;
   * if the host's persist rejects, the row is taken back off and the failure is
   * said out loud — a row that exists only on screen is a lie discovered later,
   * when it is expensive.
   */
  const capture = useCallback(async (): Promise<void> => {
    if (!canvas || isCapturing) return;
    setCapturing(true);
    const id = `snap-${Date.now()}`;
    try {
      const state = canvas.exportState();
      const row: CanvasSnapshot = {
        id,
        capturedAt: new Date(),
        label: captureDefaultLabel,
        summary: summarise(state),
        thumbnail: captureThumbnail(canvas, thumbnailFormat, captureArea, thumbnailMaxSize),
        state,
      };
      applyLocally((prev) => [row, ...prev]);
      setOwnActiveId(id);
      canvas.showMessage(say.captured);
      await onCreateSnapshot?.(row);
    } catch {
      applyLocally((prev) => prev.filter((v) => v.id !== id));
      canvas.showMessage(say.captureFailed);
    } finally {
      setCapturing(false);
    }
  }, [
    canvas,
    isCapturing,
    captureDefaultLabel,
    thumbnailFormat,
    captureArea,
    thumbnailMaxSize,
    applyLocally,
    say,
    onCreateSnapshot,
  ]);

  /**
   * Load a snapshot onto the canvas, in place. Two rows cannot be restored and
   * both say so instead of half-loading: one with no `state` (seeded, or a server
   * row whose body never arrived), and one `importState` rejects — it throws on a
   * document written by a newer envelope version, which is the version check
   * without this package importing the version constant.
   */
  const restore = useCallback(
    (row: CanvasSnapshot): void => {
      if (!canvas) return;
      const label = row.label || untitledLabel;
      if (!row.state) {
        canvas.showMessage(say.restoreMissingState(label));
        return;
      }
      try {
        canvas.importState(row.state);
      } catch {
        canvas.showMessage(say.restoreIncompatible(label));
        return;
      }
      setOwnActiveId(row.id);
      canvas.showMessage(say.restored(label));
      onRestoreSnapshot?.(row);
    },
    [canvas, untitledLabel, say, onRestoreSnapshot],
  );

  /** Commit a rename. Optimistic, rolled back if the host's save rejects. */
  const rename = useCallback(
    async (row: CanvasSnapshot, label: string): Promise<void> => {
      const next: CanvasSnapshot = { ...row, label: label || undefined };
      applyLocally((prev) => prev.map((v) => (v.id === row.id ? next : v)));
      setBusyId(row.id);
      try {
        await onUpdateSnapshot?.(next, { label });
      } catch {
        applyLocally((prev) => prev.map((v) => (v.id === row.id ? row : v)));
        canvas?.showMessage(say.saveFailed);
      } finally {
        setBusyId(null);
      }
    },
    [applyLocally, onUpdateSnapshot, canvas, say],
  );

  /** Delete a snapshot. Same optimistic-then-roll-back contract as the rest. */
  const remove = useCallback(
    async (row: CanvasSnapshot): Promise<void> => {
      setPendingDeleteId(null);
      applyLocally((prev) => prev.filter((v) => v.id !== row.id));
      setBusyId(row.id);
      try {
        await onDeleteSnapshot?.(row.id);
      } catch {
        applyLocally((prev) => [row, ...prev.filter((v) => v.id !== row.id)]);
        canvas?.showMessage(say.deleteFailed);
      } finally {
        setBusyId(null);
      }
    },
    [applyLocally, onDeleteSnapshot, canvas, say],
  );

  // Day headings are relative to the moment of render — recompute with the rows.
  const groups = useMemo(() => groupByDay(snapshots, new Date(), locale), [snapshots, locale]);

  const empty = !isLoading && groups.length === 0;

  return (
    <div className={cn('flex h-full min-h-0 flex-col text-sm', className)}>
      {showCapture && (
        <div className="border-b border-border p-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full gap-1.5 text-xs"
            disabled={isCapturing || !canvas}
            onClick={() => void capture()}
          >
            <Camera className="h-3.5 w-3.5" />
            {captureLabel}
          </Button>
          {captureHint && <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{captureHint}</p>}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-2">
          {isLoading && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {empty && <p className="px-1 text-xs text-muted-foreground">{emptyText}</p>}

          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.heading}
              </p>
              {group.snapshots.map((v) => {
                // The frame is rendered for every row — picture, pending banner
                // or nothing at all — because it is the restore control. A row
                // that drew no frame would offer no way back (the restore button
                // is gone), so "no thumbnail" gets a placeholder, not `null`.
                const slot = renderThumbnail?.(v);
                const thumbnail = slot ? (
                  <div className="aspect-video w-full overflow-hidden">{slot}</div>
                ) : v.thumbnail ? (
                  <img src={v.thumbnail} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                ) : v.hasThumbnail ? (
                  <Skeleton className="aspect-video w-full" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-muted/40">
                    <ImageOff className="h-4 w-4 text-muted-foreground" />
                  </div>
                );

                return (
                  <SnapshotRow
                    key={v.id}
                    snapshot={v}
                    date={v.date}
                    thumbnail={thumbnail}
                    isActive={v.id === activeId}
                    restoreHint={restoreHint}
                    isRestoring={!canvas || busyId === v.id}
                    untitledLabel={untitledLabel}
                    locale={locale}
                    onRestore={() => restore(v)}
                    onRename={allowRename ? (label: string) => void rename(v, label) : undefined}
                    isRenaming={busyId === v.id}
                    onDelete={allowDelete ? () => void remove(v) : undefined}
                    deleteArmed={pendingDeleteId === v.id}
                    onArmDelete={allowDelete ? () => setPendingDeleteId(v.id) : undefined}
                    onDisarmDelete={() => setPendingDeleteId(null)}
                  />
                );
              })}
            </section>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
