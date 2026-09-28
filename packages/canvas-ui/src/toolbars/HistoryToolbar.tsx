import type { Canvas, ControlItemSpec } from '@invana/canvas';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon } from '../components';
import { useControlItems } from '../control-panels/ControlItems';
import { historySpecs } from './controlSpecs';

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
 * History bar — undo / redo (`history.*`) plus an optional redraw button
 * (`graph.redraw`), drawn from control specs like a saved panel. Undo / redo
 * cover graph edits on any `GraphCanvas` (on a plain `Canvas`, under a
 * `<GraphHistoryProvider>`); redraw works regardless.
 */
export function HistoryToolbar({
  icons,
  orientation = 'horizontal',
  showRedraw = true,
  layerId,
  canvas,
  className,
}: HistoryToolbarProps) {
  const specs: ControlItemSpec[] = [
    ...historySpecs(),
    ...(showRedraw
      ? [{ type: 'command', key: 'redraw', command: 'graph.redraw', ...(layerId ? { args: { layerId } } : {}), icon: 'refresh', label: 'Redraw' } as ControlItemSpec]
      : []),
  ];
  const items = useControlItems(specs, { canvas });
  return <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />;
}
