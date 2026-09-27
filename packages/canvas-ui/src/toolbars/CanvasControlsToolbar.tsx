import type { ReactNode } from 'react';
import type { Canvas } from '@invana/canvas';
import { Lock, LockOpen } from 'lucide-react';

import { ToolbarItems, applyIconOverrides } from '../components';
import type { ToolbarIcon, ToolbarItem } from '../components';
import { useViewSection } from '@invana/canvas-react';

export interface CanvasControlsToolbarProps {
  /** Override the baked icons, by item key. */
  icons?: Partial<Record<'zoom-in' | 'zoom-out' | 'fit' | 'lock', ToolbarIcon>>;
  /** Stack direction. Default `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Layer id the fit-to-content button targets. Default `'graph'`. */
  fitLayerId?: string;
  /** Show zoom +/- buttons. Default `true`. */
  showZoom?: boolean;
  /** Show the fit-to-content button. Default `true`. */
  showFit?: boolean;
  /**
   * Controlled lock state. Lock is **not** auto-wired (what "locked" disables —
   * pan, node-drag, … — is app policy). Provide both `locked` and `onToggleLock`
   * to render the toggle.
   */
  locked?: boolean;
  onToggleLock?: () => void;
  /** Explicit canvas instance; forwarded to each smart control. Defaults to context canvas. */
  canvas?: Canvas | null;
  /** Extra controls appended after the presets — any React node. */
  children?: ReactNode;
  className?: string;
}

/**
 * Turnkey view controls — the canvas equivalent of React Flow's `<Controls>`.
 * Zoom +/- and fit ride the {@link useViewSection} section (its auto-lock is
 * off); lock stays **controlled** (pass `locked` + `onToggleLock`). Append extra
 * controls as `children`. Icons are baked in (lucide).
 *
 * @example
 * // in a header slot
 * header={{ right: <CanvasControlsToolbar orientation="horizontal" /> }}
 * // floating over the canvas
 * <ControlPanel id="controls" position="bottom-left"><CanvasControlsToolbar /></ControlPanel>
 */
export function CanvasControlsToolbar({
  icons,
  orientation = 'vertical',
  fitLayerId = 'graph',
  showZoom = true,
  showFit = true,
  locked,
  onToggleLock,
  canvas,
  children,
  className,
}: CanvasControlsToolbarProps) {
  // Zoom + fit only (no auto-lock — this overlay's lock is controlled).
  const base = useViewSection({ showLock: false, layerId: fitLayerId, canvas });
  const items: ToolbarItem[] = base.filter(
    (i) => (showZoom || (i.key !== 'zoom-in' && i.key !== 'zoom-out')) && (showFit || i.key !== 'fit'),
  );

  if (locked !== undefined && onToggleLock) {
    items.push({
      type: 'toggle',
      key: 'lock',
      icon: LockOpen,
      activeIcon: Lock,
      label: 'Lock view',
      activeLabel: 'Unlock view',
      active: locked,
      onToggle: onToggleLock,
    });
  }
  if (children) {
    items.push({ type: 'custom', key: 'children', render: () => children });
  }

  return (
    <ToolbarItems items={applyIconOverrides(items, icons)} orientation={orientation} className={className} />
  );
}
