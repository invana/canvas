import type { ReactNode } from 'react';
import { Panel, ZoomControls, FitContentButton, LockToggle } from '@invana/canvas-ui';
import type { PanelPosition, ToolbarIcon } from '@invana/canvas-ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useZoom } from '../hooks/useZoom';
import { useFitContent } from '../hooks/useFitContent';

export interface CanvasControlsIconSet {
  zoomIn: ToolbarIcon;
  zoomOut: ToolbarIcon;
  fit: ToolbarIcon;
  /** Required only when using the controlled `locked` toggle. */
  locked?: ToolbarIcon;
  unlocked?: ToolbarIcon;
}

export interface CanvasControlsProps {
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
  icons: CanvasControlsIconSet;
  /**
   * Controlled lock state. Lock is **not** auto-wired (what "locked" disables —
   * pan, node-drag, … — is app policy). Provide both `locked` and
   * `onToggleLock` (plus `icons.locked`/`icons.unlocked`) to render the toggle.
   */
  locked?: boolean;
  onToggleLock?: () => void;
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  /** Extra controls appended after the presets — e.g. `<ControlButton>`s. */
  children?: ReactNode;
  className?: string;
}

/**
 * Self-wiring controls overlay — the canvas equivalent of React Flow's
 * `<Controls>`. Zoom and fit-to-content are pulled from context via
 * {@link useZoom} / {@link useFitContent}, so dropped inside a `<Canvas>` it
 * works with only an `icons` prop (no callback wiring) and is multi-canvas-safe.
 *
 * Lock stays **controlled** — pass `locked` + `onToggleLock` to surface it.
 *
 * @example
 * <Canvas>
 *   <GraphLayer id="graph" data={data} />
 *   <CanvasControls icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize }} />
 * </Canvas>
 */
export function CanvasControls({
  position = 'bottom-left',
  orientation = 'vertical',
  fitLayerId = 'graph',
  showZoom = true,
  showFit = true,
  icons,
  locked,
  onToggleLock,
  canvas,
  children,
  className,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut } = useZoom(canvas);
  const { fitContent } = useFitContent(fitLayerId, canvas);

  const showLock =
    locked !== undefined && onToggleLock && icons.locked && icons.unlocked;

  return (
    <Panel position={position} orientation={orientation}>
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          gap: 4,
          padding: 4,
          borderRadius: 8,
          background: 'var(--color-popover)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        {showZoom && (
          <ZoomControls
            orientation={orientation}
            onZoomIn={() => zoomIn()}
            onZoomOut={() => zoomOut()}
            zoomInIcon={icons.zoomIn}
            zoomOutIcon={icons.zoomOut}
          />
        )}
        {showFit && <FitContentButton onFitContent={() => fitContent()} icon={icons.fit} />}
        {showLock && (
          <LockToggle
            locked={locked}
            onToggle={onToggleLock}
            lockedIcon={icons.locked!}
            unlockedIcon={icons.unlocked!}
          />
        )}
        {children}
      </div>
    </Panel>
  );
}
