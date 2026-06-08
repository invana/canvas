import type { Canvas as EngineCanvas } from '@invana/canvas';

import { Panel, ToolbarItems } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useHistorySection } from '../hooks/useHistorySection';
import { useHistory } from '../hooks/useHistory';

export interface HistoryToolbarIconSet {
  undo: ToolbarIcon;
  redo: ToolbarIcon;
  /** Required only when `showRedraw` is left on. */
  redraw?: ToolbarIcon;
}

export interface HistoryToolbarProps {
  icons: HistoryToolbarIconSet;
  /** Where the toolbar pins. Default `'top-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Append a redraw button after undo/redo (needs `icons.redraw`). Default `true`. */
  showRedraw?: boolean;
  /** Layer the history / redraw target. Default `'graph'`. */
  layerId?: string;
  /** Render without the `<Panel>` wrapper (embed in external chrome). Default `false`. */
  bare?: boolean;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * History bar — undo / redo (the {@link useHistorySection} section) plus an
 * optional redraw button. Requires a `<GraphHistoryProvider>` ancestor for
 * undo/redo (redraw works regardless).
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
  const section = useHistorySection({ icons, ...(layerId ? { layerId } : {}), canvas });
  const { redraw } = useHistory(layerId ? { layerId } : {}, canvas);
  const items: ToolbarItem[] =
    showRedraw && icons.redraw
      ? [...section, { type: 'button', key: 'redraw', icon: icons.redraw, label: 'Redraw', onClick: redraw }]
      : section;

  const nav = <ToolbarItems items={items} orientation={orientation} className={className} />;
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
