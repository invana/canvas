import type { Canvas } from '@invana/canvas';
import { RefreshCw } from 'lucide-react';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';
import { useHistorySection } from '@invana/canvas-react';
import { useHistory } from '@invana/canvas-react';

export interface HistoryToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'undo' | 'redo' | 'redraw', ToolbarIcon>>;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Append a redraw button after undo/redo. Default `true`. */
  showRedraw?: boolean;
  /** Layer the history / redraw target. Default `'graph'`. */
  layerId?: string;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * History bar — undo / redo (the {@link useHistorySection} section) plus an
 * optional redraw button. Requires a `<GraphHistoryProvider>` ancestor for
 * undo/redo (redraw works regardless). Icons are baked in (lucide).
 */
export function HistoryToolbar({
  icons,
  orientation = 'horizontal',
  showRedraw = true,
  layerId,
  canvas,
  className,
}: HistoryToolbarProps) {
  const section = useHistorySection({ ...(layerId ? { layerId } : {}), canvas });
  const { redraw } = useHistory(layerId ? { layerId } : {}, canvas);
  const items: ToolbarItem[] = showRedraw
    ? [...section, { type: 'button', key: 'redraw', icon: RefreshCw, label: 'Redraw', onClick: redraw }]
    : section;

  return <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />;
}
