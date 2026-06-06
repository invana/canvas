import type { Canvas as EngineCanvas } from '@invana/canvas';
import type { ThemeKind, ThemeMode } from '@invana/graph';

import type { ToolbarIcon, TooltipSide } from './types';
import { ControlButton } from './ControlButton';
import { useTheme } from '../hooks/useTheme';

export interface ThemeToggleProps {
  /** Icon shown while the resolved theme is light. */
  lightIcon: ToolbarIcon;
  /** Icon shown while the resolved theme is dark. */
  darkIcon: ToolbarIcon;
  /** Tooltip / accessible label. Defaults describe the switch target. */
  title?: string;
  /** Side the tooltip is placed on. Default `'top'`. */
  tooltipSide?: TooltipSide;
  /** Id of the `ResponsiveThemeBehaviour` to drive. Default `'responsive-theme'`. */
  behaviourId?: string;
  /**
   * Optional id of a `BackgroundLayer` to flip in lockstep, so the background
   * switches with the graph content instead of following the OS independently.
   */
  backgroundLayerId?: string;
  /**
   * Called after the theme switches. Use it to flip app chrome that lives
   * outside the canvas (e.g. a design-system `data-theme` attribute) so the
   * floating controls stay legible against the canvas.
   */
  onChange?: (kind: ThemeKind, mode: ThemeMode) => void;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring theme toggle. Flips a registered `ResponsiveThemeBehaviour` between
 * pinned light and dark, showing the current theme's icon and active styling
 * while dark. Wraps {@link useTheme}.
 */
export function ThemeToggle({
  lightIcon,
  darkIcon,
  title,
  tooltipSide,
  behaviourId,
  backgroundLayerId,
  onChange,
  canvas,
  className,
}: ThemeToggleProps) {
  const { kind, toggle } = useTheme(
    {
      ...(behaviourId ? { behaviourId } : {}),
      ...(backgroundLayerId ? { backgroundLayerId } : {}),
      ...(onChange ? { onChange } : {}),
    },
    canvas,
  );
  const dark = kind === 'dark';
  return (
    <ControlButton
      icon={dark ? darkIcon : lightIcon}
      title={title ?? (dark ? 'Switch to light theme' : 'Switch to dark theme')}
      tooltipSide={tooltipSide}
      onClick={toggle}
      active={dark}
      className={className}
    />
  );
}
