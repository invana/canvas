import type { ReactNode } from 'react';
import type { Canvas } from '@invana/canvas';

import { Panel, ToolbarItems, applyIconOverrides } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useViewSection } from '@invana/canvas-react';

export interface CanvasToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'zoom-in' | 'zoom-out' | 'fit' | 'lock', ToolbarIcon>>;
  /** Stack direction. Default `'horizontal'` (a header bar). */
  orientation?: 'horizontal' | 'vertical';
  /** Layer id the fit-to-content + auto-lock target. Default `'graph'`. */
  layerId?: string;
  /** Show zoom +/- buttons. Default `true`. */
  showZoom?: boolean;
  /** Show the fit-to-content button. Default `true`. */
  showFit?: boolean;
  /** Show the (self-wiring) lock toggle. Default `true`. */
  showLock?: boolean;
  /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
  lockBehaviourIds?: string[];
  /**
   * Drop the self-positioning `<Panel>` wrapper and render the bare bar, so it
   * composes into consumer chrome (a view header, a segmented row, …).
   * **Default `true`** — this is the header-slot companion to
   * `CanvasControlsToolbar` (which floats as a vertical `<Panel>` overlay). Set
   * `false` to float it at {@link position}.
   */
  bare?: boolean;
  /** Where the bar pins when `bare` is `false`. Default `'bottom-left'`. */
  position?: PanelPosition;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: Canvas | null;
  /** Extra controls appended after the presets — any React node. */
  children?: ReactNode;
  className?: string;
}

/**
 * Standard canvas controls as a **header-slot bar** — zoom +/- · fit-to-content ·
 * lock, riding the {@link useViewSection} section (self-wiring; lock disables pan
 * + node-drag by default). Horizontal and **bare** by default so it drops inline
 * next to other chrome (e.g. a view switcher). Its floating, vertical sibling is
 * `CanvasControlsToolbar` (React Flow's `<Controls>`); this is the inline bar you
 * put in a toolbar row. Resolves the engine from context or an explicit `canvas`.
 *
 * @example
 * <div className="flex items-center justify-between">
 *   <ViewSwitch … />
 *   <CanvasToolbar />
 * </div>
 */
export function CanvasToolbar({
  icons,
  orientation = 'horizontal',
  layerId = 'graph',
  showZoom = true,
  showFit = true,
  showLock = true,
  lockBehaviourIds,
  bare = true,
  position = 'bottom-left',
  canvas,
  children,
  className,
}: CanvasToolbarProps) {
  const base = useViewSection({
    showZoom,
    showLock,
    layerId,
    ...(lockBehaviourIds ? { lockBehaviourIds } : {}),
    canvas,
  });
  // `useViewSection` honours `showZoom`/`showLock`; filter `fit` here.
  const items: ToolbarItem[] = base.filter((i) => showFit || i.key !== 'fit');

  if (children) {
    items.push({ type: 'custom', key: 'children', render: () => children });
  }

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
