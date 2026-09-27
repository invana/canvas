import type { Canvas, BackgroundLayerOptions } from '@invana/canvas';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon } from '../components';
import { useControlItems } from '../control-panels/ControlItems';
import { gridSpec } from './controlSpecs';

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
 * Grid toggle bar — shows/hides a `BackgroundLayer`'s pattern through the
 * `background.grid` command, like a saved panel's grid toggle.
 */
export function GridToolbar({
  icons,
  orientation = 'horizontal',
  backgroundLayerId,
  patternType,
  canvas,
  className,
}: GridToolbarProps) {
  const specs = [gridSpec({ ...(backgroundLayerId ? { layerId: backgroundLayerId } : {}), ...(patternType ? { patternType } : {}) })];
  const items = useControlItems(specs, { canvas });
  return (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
}
