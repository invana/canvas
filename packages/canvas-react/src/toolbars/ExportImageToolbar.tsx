import { useState } from 'react';
import type { Canvas } from '@invana/canvas';
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from '@invana/ui';
import { Download, ImageDown } from 'lucide-react';

import { EXPORT_IMAGE_FORMAT_OPTIONS, ExportImagePanel, Panel } from '../components';
import type {
  ExportImageFormatKey,
  ExportImagePanelValue,
  PanelPosition,
  ToolbarIcon,
} from '../components';
import { useCanvasImageExport } from '../hooks/useCanvasImageExport';
import type { DownloadImageExportOptions } from '../hooks/useCanvasImageExport';

// The image-format union lives with the dumb `ExportImagePanel` building block;
// re-exported here so the toolbar's props type is self-contained.
export type { ExportImageFormatKey } from '../components';

/** Fallback settings the menu opens with (overridable via `defaultValue`). */
const DEFAULT_VALUE: ExportImagePanelValue = {
  format: 'png',
  area: 'content',
  background: 'canvas',
  scale: 2,
  aspectRatio: 0,
};

export interface ExportImageToolbarProps {
  /** Restrict / reorder the offered formats. Default: all four (PNG/JPG/WebP/SVG). */
  formats?: ExportImageFormatKey[];
  /** Seed the menu's initial settings. Merged over the built-in defaults. */
  defaultValue?: Partial<ExportImagePanelValue>;
  /** Download filename stem. The area + format extension are appended. Default `'canvas'`. */
  filename?: string;
  /** Trigger tooltip / aria-label + the menu heading. Default `'Export'`. */
  label?: string;
  /** Optional visible text beside the trigger icon (renders a labelled button). */
  triggerText?: string;
  /** Override the trigger icon (lucide by default). */
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
   * dropped into external chrome — e.g. as a `custom` {@link ToolbarItem} inside
   * a `NavHorizontal` / `ToolbarItems`. Default `false`.
   */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the `<Canvas>` context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Export menu — a single toolbar **nav item** that reveals the full export
 * options on hover. The trigger is a ghost icon button; hovering it opens a
 * hover-card holding an {@link ExportImagePanel} (format as a horizontal segmented
 * row, plus area / background / scale / aspect ratio) and a **Save as Image**
 * button that exports the current view via {@link useCanvasImageExport}.
 *
 * Self-wiring: pulls the engine from the `<Canvas>` context (or an explicit
 * `canvas` prop). Raster formats capture through the renderer; `'svg'` emits a
 * true vector document. Pass `bare` to embed the trigger in your own toolbar
 * chrome instead of the built-in `<Panel>`.
 */
export function ExportImageToolbar({
  formats,
  defaultValue,
  filename = 'canvas',
  label = 'Export',
  triggerText,
  triggerIcon: TriggerIcon = Download,
  position = 'top-right',
  align = 'end',
  openDelay = 120,
  closeDelay = 200,
  bare = false,
  canvas,
  className,
}: ExportImageToolbarProps) {
  const { download } = useCanvasImageExport(canvas);
  const [value, setValue] = useState<ExportImagePanelValue>({ ...DEFAULT_VALUE, ...defaultValue });

  const onChange = (patch: Partial<ExportImagePanelValue>) => setValue((v) => ({ ...v, ...patch }));

  const onSave = () => {
    const opts: DownloadImageExportOptions = {
      format: value.format,
      area: value.area,
      background: value.background,
      scale: value.scale,
      filename: `${filename}-${value.area}`,
      ...(value.aspectRatio > 0 ? { aspectRatio: value.aspectRatio } : {}),
    };
    void download(opts);
  };

  const formatOptions = formats
    ? EXPORT_IMAGE_FORMAT_OPTIONS.filter((f) => formats.includes(f.value))
    : undefined;

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
      <HoverCardContent align={align} className="w-72 max-w-[calc(100vw-1rem)] p-3">
        <ExportImagePanel
          value={value}
          onChange={onChange}
          onSave={onSave}
          title={label}
          saveIcon={ImageDown}
          {...(formatOptions ? { formats: formatOptions } : {})}
        />
      </HoverCardContent>
    </HoverCard>
  );

  if (bare) return menu;
  return <Panel position={position}>{menu}</Panel>;
}
