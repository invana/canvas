import type { ReactNode } from 'react';
import { Button, ToggleGroup, ToggleGroupItem, cn } from '@invana/ui';

import type { ToolbarIcon } from './types';

/** Image export formats the panel can offer. */
export type ExportImageFormatKey = 'png' | 'jpeg' | 'webp' | 'svg';

/** Capture-area choices. */
export type ExportImageAreaKey = 'viewport' | 'content';

/** A single labelled choice in one of the panel's segmented rows. */
export interface ExportImagePanelOption<T> {
  /** The value handed back through {@link ExportImagePanelProps.onChange}. */
  value: T;
  /** Human label shown on the segment. */
  label: string;
}

/**
 * The full set of export settings the panel edits. A plain, serialisable value
 * object — the toolbar (or any consumer) maps it onto the engine's
 * `ExportImageOptions` when it actually exports. Kept engine-free so the panel
 * stays a dumb building block.
 */
export interface ExportImagePanelValue {
  /** Output format. `'svg'` is a true vector export; the rest are raster. */
  format: ExportImageFormatKey;
  /** `'viewport'` (WYSIWYG) or `'content'` (the whole graph, off-screen included). */
  area: ExportImageAreaKey;
  /**
   * Background fill. Matches the engine's `ExportBackground`: `'canvas'`,
   * `'transparent'`, or a CSS colour string (e.g. `'#0b1220'`).
   */
  background: string;
  /** Resolution multiplier for raster formats (ignored for `'svg'`). */
  scale: number;
  /** Forced output aspect ratio (width ÷ height). `0` = free / natural. */
  aspectRatio: number;
}

/** Default format choices, in display order. */
export const EXPORT_IMAGE_FORMAT_OPTIONS: ExportImagePanelOption<ExportImageFormatKey>[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'webp', label: 'WebP' },
  { value: 'svg', label: 'SVG' },
];

/** Default capture-area choices. */
export const EXPORT_IMAGE_AREA_OPTIONS: ExportImagePanelOption<ExportImageAreaKey>[] = [
  { value: 'viewport', label: 'Viewport' },
  { value: 'content', label: 'Content' },
];

/** Default background choices (values are valid engine `ExportBackground`s). */
export const EXPORT_IMAGE_BACKGROUND_OPTIONS: ExportImagePanelOption<string>[] = [
  { value: 'canvas', label: 'Canvas' },
  { value: 'transparent', label: 'None' },
  { value: '#ffffff', label: 'White' },
  { value: '#0b1220', label: 'Dark' },
];

/** Default raster resolution multipliers. */
export const EXPORT_IMAGE_SCALE_OPTIONS: number[] = [1, 2, 3, 4, 5];

/** Default aspect-ratio choices (`0` = free / natural). */
export const EXPORT_IMAGE_RATIO_OPTIONS: ExportImagePanelOption<number>[] = [
  { value: 0, label: 'Free' },
  { value: 1, label: '1:1' },
  { value: 16 / 9, label: '16:9' },
  { value: 4 / 3, label: '4:3' },
  { value: 3 / 2, label: '3:2' },
  { value: 9 / 16, label: '9:16' },
];

export interface ExportImagePanelProps {
  /** The current settings shown in the panel (controlled). */
  value: ExportImagePanelValue;
  /** Fired with a partial patch whenever a setting changes. Merge into `value`. */
  onChange: (patch: Partial<ExportImagePanelValue>) => void;
  /** Fired when the primary "save" button is pressed. */
  onSave: () => void;
  /** Heading above the rows. Pass `null` to hide it. Default `'Export'`. */
  title?: string | null;
  /** Label on the primary button. Default `'Save as Image'`. */
  saveLabel?: string;
  /** Optional icon (icon-agnostic — a `ToolbarIcon`) rendered inside the button. */
  saveIcon?: ToolbarIcon;
  /** Override the offered formats (subset / reorder). Default all four. */
  formats?: ExportImagePanelOption<ExportImageFormatKey>[];
  /** Override the offered capture areas. */
  areas?: ExportImagePanelOption<ExportImageAreaKey>[];
  /** Override the offered backgrounds. */
  backgrounds?: ExportImagePanelOption<string>[];
  /** Override the offered raster scales. */
  scales?: number[];
  /** Override the offered aspect ratios. */
  ratios?: ExportImagePanelOption<number>[];
  className?: string;
}

/** A labelled block wrapping one segmented row. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/**
 * A single-select segmented control over string values — a fixed-column grid of
 * outline toggles that fills the available width and wraps to new rows (so it
 * stays responsive inside a width-capped menu). Deselection is suppressed (one
 * option is always active).
 */
function Segmented({
  value,
  options,
  onValueChange,
  disabled,
  columns,
}: {
  value: string;
  options: ExportImagePanelOption<string>[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** Number of grid columns; items past the row count wrap onto the next row. */
  columns: number;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        if (v) onValueChange(v);
      }}
      variant="outline"
      size="sm"
      className="grid w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          aria-label={o.label}
          className="w-full min-w-0 px-1 text-xs"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Reusable, engine-agnostic **image-export options panel**. Presents the format
 * as a horizontal segmented row, followed by area / background / scale / aspect
 * ratio, and a primary "Save as Image" button. Fully controlled: it edits a
 * plain {@link ExportImagePanelValue} and reports every change through `onChange` /
 * the save press through `onSave` — it never touches the engine itself.
 *
 * Surface-less by design (no border / shadow): drop it inside a
 * `HoverCardContent`, `PopoverContent`, `PanelContent`, or any container that
 * provides the chrome. The self-wiring {@link ExportImageToolbar} pairs it with a
 * hover-card trigger and {@link useCanvasImageExport}; use this component directly
 * when you need the options elsewhere (a settings sheet, a share dialog, …).
 *
 * The **Scale** row is disabled for `'svg'` (vector output ignores raster scale).
 */
export function ExportImagePanel({
  value,
  onChange,
  onSave,
  title = 'Export',
  saveLabel = 'Save as Image',
  saveIcon: SaveIcon,
  formats = EXPORT_IMAGE_FORMAT_OPTIONS,
  areas = EXPORT_IMAGE_AREA_OPTIONS,
  backgrounds = EXPORT_IMAGE_BACKGROUND_OPTIONS,
  scales = EXPORT_IMAGE_SCALE_OPTIONS,
  ratios = EXPORT_IMAGE_RATIO_OPTIONS,
  className,
}: ExportImagePanelProps) {
  const isSvg = value.format === 'svg';
  const scaleOptions: ExportImagePanelOption<string>[] = scales.map((s) => ({ value: String(s), label: `${s}×` }));
  const ratioOptions: ExportImagePanelOption<string>[] = ratios.map((r) => ({ value: String(r.value), label: r.label }));

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {title != null && title !== '' && (
        <div className="text-sm font-semibold text-foreground">{title}</div>
      )}

      <Field label="Format">
        <Segmented
          value={value.format}
          options={formats}
          columns={formats.length}
          onValueChange={(v) => onChange({ format: v as ExportImageFormatKey })}
        />
      </Field>

      <Field label="Area">
        <Segmented
          value={value.area}
          options={areas}
          columns={areas.length}
          onValueChange={(v) => onChange({ area: v as ExportImageAreaKey })}
        />
      </Field>

      <Field label="Background">
        <Segmented
          value={value.background}
          options={backgrounds}
          columns={backgrounds.length}
          onValueChange={(v) => onChange({ background: v })}
        />
      </Field>

      <Field label="Scale">
        <Segmented
          value={String(value.scale)}
          options={scaleOptions}
          columns={scaleOptions.length}
          onValueChange={(v) => onChange({ scale: Number(v) })}
          disabled={isSvg}
        />
      </Field>

      <Field label="Aspect ratio">
        <Segmented
          value={String(value.aspectRatio)}
          options={ratioOptions}
          columns={Math.min(ratioOptions.length, 3)}
          onValueChange={(v) => onChange({ aspectRatio: Number(v) })}
        />
      </Field>

      <Button variant="default" size="sm" className="mt-1 w-full gap-2" onClick={onSave}>
        {SaveIcon ? <SaveIcon size={16} /> : null}
        {saveLabel}
      </Button>
    </div>
  );
}
