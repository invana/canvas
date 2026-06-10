import type { ReactNode } from 'react';
import type { Canvas } from '@invana/canvas';

import { Panel, ToolbarItems } from '../components';
import type { PanelPosition, ToolbarIcon, ToolbarItem } from '../components';
import { useViewSection } from '../hooks/useViewSection';

export interface CanvasControlsToolbarIconSet {
  zoomIn: ToolbarIcon;
  zoomOut: ToolbarIcon;
  fit: ToolbarIcon;
  /** Required only when using the controlled `locked` toggle. */
  locked?: ToolbarIcon;
  unlocked?: ToolbarIcon;
}

export interface CanvasControlsToolbarProps {
  /** Where the controls pin within the canvas host. Default `'bottom-left'`. */
  position?: PanelPosition;
  /** Stack direction. Default `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Layer id the fit-to-content button targets. Default `'graph'`. */
  fitLayerId?: string;
  /** Show zoom +/- buttons. Default `true`. */
  showZoom?: boolean;
  /** Show the fit-to-content button. Default `true`. */
  showFit?: boolean;
  /** Icon components (consumer-supplied — the package stays icon-agnostic). */
  icons: CanvasControlsToolbarIconSet;
  /**
   * Controlled lock state. Lock is **not** auto-wired (what "locked" disables —
   * pan, node-drag, … — is app policy). Provide both `locked` and
   * `onToggleLock` (plus `icons.locked`/`icons.unlocked`) to render the toggle.
   */
  locked?: boolean;
  onToggleLock?: () => void;
  /**
   * Render **without** the self-positioning `<Panel>` — just the bare nav
   * component — so it composes into consumer chrome. Default `false`.
   */
  bare?: boolean;
  /** Explicit canvas instance; forwarded to each smart control. Defaults to context canvas. */
  canvas?: Canvas | null;
  /** Extra controls appended after the presets — any React node. */
  children?: ReactNode;
  className?: string;
}

/**
 * Turnkey controls overlay — the canvas equivalent of React Flow's `<Controls>`.
 * Zoom +/- and fit ride the {@link useViewSection} section (its auto-lock is
 * off); lock stays **controlled** (pass `locked` + `onToggleLock`). Append extra
 * controls as `children`.
 *
 * @example
 * <Canvas>
 *   <GraphLayer id="graph" data={data} />
 *   <CanvasControlsToolbar icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize }} />
 * </Canvas>
 */
export function CanvasControlsToolbar({
  position = 'bottom-left',
  orientation = 'vertical',
  fitLayerId = 'graph',
  showZoom = true,
  showFit = true,
  icons,
  locked,
  onToggleLock,
  bare = false,
  canvas,
  children,
  className,
}: CanvasControlsToolbarProps) {
  // Zoom + fit only (no auto-lock — this overlay's lock is controlled).
  const base = useViewSection({
    icons: { zoomIn: icons.zoomIn, zoomOut: icons.zoomOut, fit: icons.fit },
    layerId: fitLayerId,
    canvas,
  });
  const items: ToolbarItem[] = base.filter(
    (i) => (showZoom || (i.key !== 'zoom-in' && i.key !== 'zoom-out')) && (showFit || i.key !== 'fit'),
  );

  if (locked !== undefined && onToggleLock && icons.locked && icons.unlocked) {
    items.push({
      type: 'toggle',
      key: 'lock',
      icon: icons.unlocked,
      activeIcon: icons.locked,
      label: 'Lock view',
      activeLabel: 'Unlock view',
      active: locked,
      onToggle: onToggleLock,
    });
  }
  if (children) {
    items.push({ type: 'custom', key: 'children', render: () => children });
  }

  const nav = <ToolbarItems items={items} orientation={orientation} className={className} />;
  if (bare) return nav;
  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}
