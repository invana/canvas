import type { Canvas } from '@invana/canvas';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon } from '../components';
import { useControlItems } from '../control-panels/ControlItems';
import { fitSpec, lockSpec, zoomSpecs } from './controlSpecs';

export interface ViewToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'zoom-in' | 'zoom-out' | 'fit' | 'lock', ToolbarIcon>>;
  /** Stack direction. Default `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show the lock toggle. Default `true`. */
  showLock?: boolean;
  /** Layer the fit-to-content button targets. Default `'graph'`. */
  layerId?: string;
  /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
  lockBehaviourIds?: string[];
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * View bar — zoom in / zoom out / fit-to-content / lock view, drawn from
 * control specs (`camera.zoomIn` / `camera.zoomOut` / `camera.fit` /
 * `view.lock`) — the same commands a saved control panel runs. Lock disables
 * pan + node drag by default while leaving zoom available.
 */
export function ViewToolbar({
  icons,
  orientation = 'vertical',
  showLock = true,
  layerId = 'graph',
  lockBehaviourIds,
  canvas,
  className,
}: ViewToolbarProps) {
  const specs = [...zoomSpecs(), fitSpec(layerId), ...(showLock ? [lockSpec(lockBehaviourIds)] : [])];
  const items = useControlItems(specs, { canvas });
  return (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
}
