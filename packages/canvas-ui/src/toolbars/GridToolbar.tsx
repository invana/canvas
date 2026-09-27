import type { Canvas, BackgroundLayerOptions } from '@invana/canvas';
import { Grid3x3 } from 'lucide-react';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';
import { useGrid } from '@invana/canvas-react';

type PatternType = NonNullable<BackgroundLayerOptions['patternType']>;

export interface GridToolbarProps {
  /** Override the baked icon, by item key. */
  icons?: Partial<Record<'grid', ToolbarIcon>>;
  /** Stack direction. Default `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Id of the `BackgroundLayer` to toggle. Default `'background'`. */
  backgroundLayerId?: string;
  /** Pattern to switch to when shown (e.g. `'grid'`); preserves existing if omitted. */
  patternType?: PatternType;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * Grid toggle bar — shows/hides a `BackgroundLayer`'s pattern. Built inline off
 * {@link useGrid} (grid isn't one of the five named toolbar sections). Icon is
 * baked in (lucide).
 */
export function GridToolbar({
  icons,
  orientation = 'horizontal',
  backgroundLayerId,
  patternType,
  canvas,
  className,
}: GridToolbarProps) {
  const { showGrid, toggleGrid } = useGrid(
    {
      ...(backgroundLayerId ? { backgroundLayerId } : {}),
      ...(patternType ? { patternType } : {}),
    },
    canvas,
  );
  const items: ToolbarItem[] = [
    { type: 'toggle', key: 'grid', icon: Grid3x3, label: 'Toggle grid', active: showGrid, onToggle: toggleGrid },
  ];

  return (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
}
