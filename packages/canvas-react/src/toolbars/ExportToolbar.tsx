import type { Canvas, ExportImageOptions } from '@invana/canvas';
import { Download } from 'lucide-react';

import { Panel, ToolbarItems, applyIconOverrides } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useCanvasExport } from '../hooks/useCanvasExport';

/** Export formats the toolbar can offer. */
export type ExportFormatKey = 'png' | 'jpeg' | 'webp' | 'svg';

const FORMAT_LABEL: Record<ExportFormatKey, string> = {
  png: 'PNG',
  jpeg: 'JPG',
  webp: 'WebP',
  svg: 'SVG',
};

export interface ExportToolbarProps {
  /** Formats to offer, one download button each. Default `['png', 'svg']`. */
  formats?: ExportFormatKey[];
  /** Capture area for every button. Default `'viewport'`. */
  area?: ExportImageOptions['area'];
  /** Background fill for every button. Default `'canvas'`. */
  background?: ExportImageOptions['background'];
  /** Resolution multiplier for raster exports. */
  scale?: number;
  /** Download filename (without extension — the format's is appended). Default `'canvas'`. */
  filename?: string;
  /** Override the baked download icon, by format. */
  icons?: Partial<Record<ExportFormatKey, ToolbarIcon>>;
  /** Where the toolbar pins. Default `'top-right'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Render without the `<Panel>` wrapper (embed in external chrome). Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Export bar — one download button per configured format (PNG / JPG / WebP /
 * SVG), each saving the current view via {@link useCanvasExport}. Raster
 * formats capture what's on screen through the renderer; `svg` emits a true
 * vector document. Self-wiring: pulls the engine from the `<Canvas>` context
 * (or an explicit `canvas` prop). Icons are baked in (lucide).
 */
export function ExportToolbar({
  formats = ['png', 'svg'],
  area = 'viewport',
  background = 'canvas',
  scale,
  filename = 'canvas',
  icons,
  position = 'top-right',
  orientation = 'horizontal',
  bare = false,
  canvas,
  className,
}: ExportToolbarProps) {
  const { download } = useCanvasExport(canvas);

  const items: ToolbarItem[] = formats.map((format) => ({
    type: 'button',
    key: format,
    icon: Download,
    label: `Export ${FORMAT_LABEL[format]}`,
    text: FORMAT_LABEL[format],
    onClick: () => {
      void download({ format, area, background, ...(scale !== undefined ? { scale } : {}), filename });
    },
  }));

  const nav = (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
