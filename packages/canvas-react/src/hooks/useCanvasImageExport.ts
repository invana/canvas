import { useCallback } from 'react';
import type { Canvas, ExportImageOptions } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/** Extension of the engine export options with a download filename. */
export interface DownloadImageExportOptions extends ExportImageOptions {
  /** File name for the download. Defaults to `canvas.<ext>` for the format. */
  filename?: string;
}

export interface UseCanvasImageExportResult {
  /** Export the current view as an image `Blob` (PNG / JPEG / WebP / SVG). */
  toBlob(opts?: ExportImageOptions): Promise<Blob>;
  /** Export, then trigger a browser download of the resulting file. */
  download(opts?: DownloadImageExportOptions): Promise<void>;
}

/** File extension for a given export format. */
function extFor(format: ExportImageOptions['format']): string {
  return format === 'svg' ? 'svg' : format === 'jpeg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';
}

/** Create an object URL for `blob`, click a temporary `<a download>`, and revoke it. */
function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click's navigation has started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Export the current canvas view to an image and optionally download it.
 *
 * Thin binding over the engine's {@link Canvas.export}: `toBlob` returns the
 * raw `Blob` (for previews / uploads / custom handling); `download` saves it as
 * a file. Both take the engine {@link ExportImageOptions} — `format`
 * (`'png' | 'jpeg' | 'webp' | 'svg'`), `area` (`'viewport' | 'content'`),
 * `background`, `scale`, `quality`. Multi-canvas-safe via the optional
 * `canvas` argument (falls back to the `<Canvas>` context).
 *
 * @example
 * const { download } = useCanvasImageExport();
 * <button onClick={() => download({ format: 'png', area: 'content' })}>Save PNG</button>
 */
export function useCanvasImageExport(canvas?: Canvas | null): UseCanvasImageExportResult {
  const resolved = useResolvedCanvas(canvas);

  const toBlob = useCallback(
    (opts: ExportImageOptions = {}) => resolved.export(opts),
    [resolved],
  );

  const download = useCallback(
    async (opts: DownloadImageExportOptions = {}) => {
      const { filename, ...exportOpts } = opts;
      const blob = await resolved.export(exportOpts);
      triggerDownload(blob, filename ?? `canvas.${extFor(exportOpts.format)}`);
    },
    [resolved],
  );

  return { toBlob, download };
}
