import { useState } from 'react';
import type { Canvas } from '@invana/canvas';
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from '@invana/ui';
import { Download, FileJson, Upload } from 'lucide-react';

import { ExportStatePanel, Panel } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';
import { useCanvasStateJson } from '@invana/canvas-react';

export interface ExportStateToolbarProps {
  /** Download filename stem. `.json` is appended. Default `'canvas-state'`. */
  filename?: string;
  /** Trigger tooltip / aria-label + the menu heading. Default `'Canvas State'`. */
  label?: string;
  /**
   * Initial state of the "restore view" toggle — whether importing also
   * restores the live view (camera / selection / hover). Default `true`. Set
   * `false` to load only definition + data by default. Pass `showRestoreToggle
   * = false` to hide the toggle and lock this behaviour.
   */
  restoreView?: boolean;
  /** Show the "restore view" toggle in the menu. Default `true`. */
  showRestoreToggle?: boolean;
  /** Optional visible text beside the trigger icon (renders a labelled button). */
  triggerText?: string;
  /** Override the trigger icon (lucide `FileJson` by default). */
  triggerIcon?: ToolbarIcon;
  /** Where the toolbar pins (when not `bare`). Default `'top-right'`. */
  position?: PanelPosition;
  /** Hover-card alignment relative to the trigger. Default `'end'`. */
  align?: 'start' | 'center' | 'end';
  /** ms before the card opens on hover. Default `120`. */
  openDelay?: number;
  /** ms before it closes after the pointer leaves. Default `200`. */
  closeDelay?: number;
  /**
   * Render just the hover-card trigger (no `<Panel>` wrapper) so it can be
   * dropped into external chrome — e.g. as a `custom` `ToolbarItem` inside a
   * `NavHorizontal` / header rail. Default `false`.
   */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the `<Canvas>` context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Save / load menu for the **full canvas state as JSON** — a single toolbar
 * **nav item** that reveals the state actions on hover. The trigger is a ghost
 * icon button; hovering it opens a hover-card holding an {@link ExportStatePanel}
 * with **Download JSON** (serialise the whole scene — view definition +
 * interaction + per-layer node/edge data — and save it) and **Load JSON…**
 * (pick a file and restore it), plus a **Restore view** toggle.
 *
 * The JSON counterpart to the `ExportImageToolbar` (which produces an *image*).
 * Self-wiring: pulls the engine from the `<Canvas>` context (or an explicit
 * `canvas` prop) via {@link useCanvasStateJson}. Restore applies onto the
 * canvas's already-registered layers/behaviours/layouts (import addresses
 * instances by id — it doesn't create them). Pass `bare` to embed the trigger in
 * your own toolbar chrome instead of the built-in `<Panel>`.
 */
export function ExportStateToolbar({
  filename = 'canvas-state',
  label = 'Canvas State',
  restoreView = true,
  showRestoreToggle = true,
  triggerText,
  triggerIcon: TriggerIcon = FileJson,
  position = 'top-right',
  align = 'end',
  openDelay = 120,
  closeDelay = 200,
  bare = false,
  canvas,
  className,
}: ExportStateToolbarProps) {
  const { download, import: importState } = useCanvasStateJson(canvas);
  const [restore, setRestore] = useState(restoreView);

  const onExport = () => download(`${filename}.json`);
  const onImport = (file: File) => void importState(file, { skipInteraction: !restore });

  const menu = (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size={triggerText ? 'sm' : 'icon'}
          aria-label={label}
          className={className}
        >
          <TriggerIcon size={16} />
          {triggerText}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align={align} className="w-64 max-w-[calc(100vw-1rem)] p-3">
        <ExportStatePanel
          title={label}
          onExport={onExport}
          onImport={onImport}
          exportIcon={Download}
          importIcon={Upload}
          {...(showRestoreToggle
            ? { restoreView: restore, onRestoreViewChange: setRestore }
            : {})}
        />
      </HoverCardContent>
    </HoverCard>
  );

  if (bare) return menu;
  return <Panel position={position}>{menu}</Panel>;
}
