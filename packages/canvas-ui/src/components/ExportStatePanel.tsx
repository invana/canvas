import { useRef } from 'react';
import { Button, Separator, Toggle, cn } from '@invana/ui';

import type { ToolbarIcon } from './types';

export interface ExportStatePanelProps {
  /** Fired when the "export" button is pressed — serialise + download the state JSON. */
  onExport: () => void;
  /** Fired with the file the user picked in the "import" file dialog. */
  onImport: (file: File) => void;
  /**
   * Controlled state of the "restore view" toggle (camera / selection / hover).
   * When the toggle is present ({@link onRestoreViewChange} provided), this drives
   * it. `true` = the live view is restored on import; `false` = only definition +
   * data load (maps to the engine's `skipInteraction`).
   */
  restoreView?: boolean;
  /** Fired when the "restore view" toggle flips. Omit to hide the toggle entirely. */
  onRestoreViewChange?: (restore: boolean) => void;
  /** Heading above the actions. Pass `null` to hide it. Default `'Canvas State'`. */
  title?: string | null;
  /** Label on the export button. Default `'Download JSON'`. */
  exportLabel?: string;
  /** Label on the import button. Default `'Load JSON…'`. */
  importLabel?: string;
  /** Optional icon (icon-agnostic) rendered inside the export button. */
  exportIcon?: ToolbarIcon;
  /** Optional icon (icon-agnostic) rendered inside the import button. */
  importIcon?: ToolbarIcon;
  className?: string;
}

/**
 * Reusable, engine-agnostic **canvas-state save/load panel** — the JSON
 * counterpart to {@link ExportStatePanel}'s image sibling. Presents a primary
 * "Download JSON" action, a "Load JSON…" action that opens a native file
 * picker, and an optional "Restore view" toggle. Fully controlled and dumb: it
 * reports the export press through `onExport`, the picked file through
 * `onImport`, and the toggle through `onRestoreViewChange` — it never touches
 * the engine itself.
 *
 * Surface-less by design (no border / shadow): drop it inside a
 * `HoverCardContent`, `PopoverContent`, `PanelContent`, or any container that
 * provides the chrome. The self-wiring {@link ExportStateToolbar} pairs it with a
 * hover-card trigger and `useCanvasStateJson`; use this component directly when
 * you need the actions elsewhere (a settings sheet, a share dialog, …).
 */
export function ExportStatePanel({
  onExport,
  onImport,
  restoreView,
  onRestoreViewChange,
  title = 'Canvas State',
  exportLabel = 'Download JSON',
  importLabel = 'Load JSON…',
  exportIcon: ExportIcon,
  importIcon: ImportIcon,
  className,
}: ExportStatePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset first so picking the *same* file again still fires `change`.
    e.target.value = '';
    if (file) onImport(file);
  };

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {title != null && title !== '' && (
        <div className="text-sm font-semibold text-foreground">{title}</div>
      )}

      <Button variant="default" size="sm" className="w-full gap-2" onClick={onExport}>
        {ExportIcon ? <ExportIcon size={16} /> : null}
        {exportLabel}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => inputRef.current?.click()}
      >
        {ImportIcon ? <ImportIcon size={16} /> : null}
        {importLabel}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onPick}
      />

      {onRestoreViewChange && (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Restore view (camera &amp; selection)
            </span>
            <Toggle
              size="sm"
              pressed={restoreView ?? true}
              onPressedChange={onRestoreViewChange}
              aria-label="Restore view on import"
              className="text-xs"
            >
              {restoreView ?? true ? 'On' : 'Off'}
            </Toggle>
          </div>
        </>
      )}
    </div>
  );
}
