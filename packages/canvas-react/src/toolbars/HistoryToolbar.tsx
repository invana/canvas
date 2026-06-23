import type { Canvas } from '@invana/canvas';
import { RefreshCw } from 'lucide-react';

import { Panel, ToolbarItems, applyIconOverrides } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useHistorySection } from '../hooks/useHistorySection';
import { useHistory } from '../hooks/useHistory';

export interface HistoryToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'undo' | 'redo' | 'redraw', ToolbarIcon>>;
  /** Where the toolbar pins. Default `'top-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Append a redraw button after undo/redo. Default `true`. */
  showRedraw?: boolean;
  /** Layer the history / redraw target. Default `'graph'`. */
  layerId?: string;
  /** Render without the `<Panel>` wrapper (embed in external chrome). Default `false`. */
  bare?: boolean;
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
  position = 'top-left',
  orientation = 'horizontal',
  showRedraw = true,
  layerId,
  bare = false,
  canvas,
  className,
}: HistoryToolbarProps) {
  const section = useHistorySection({ ...(layerId ? { layerId } : {}), canvas });
  const { redraw } = useHistory(layerId ? { layerId } : {}, canvas);
  const items: ToolbarItem[] = showRedraw
    ? [...section, { type: 'button', key: 'redraw', icon: RefreshCw, label: 'Redraw', onClick: redraw }]
    : section;

  const nav = <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />;
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
