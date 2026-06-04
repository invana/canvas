import type { ReactNode } from 'react';
import { NavHorizontal, NavVertical } from '@invana/ui';
import { Panel, ZoomControls, FitContentButton, LockToggle } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';
import type { Canvas as EngineCanvas } from '@invana/canvas';

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
  /**
   * Show a live `NN%` zoom readout between the +/- buttons. Sourced from the
   * canvas via the self-wired {@link ZoomControls}. Default `false`.
   */
  showZoomLevel?: boolean;
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
  /** Explicit canvas instance; forwarded to each smart component. Defaults to context canvas. */
  canvas?: EngineCanvas | null;
  /** Extra controls appended after the presets — e.g. `<ControlButton>`s. */
  children?: ReactNode;
  className?: string;
}

/**
 * Turnkey controls overlay — the canvas equivalent of React Flow's `<Controls>`.
 * Assembled from self-wiring smart components ({@link ZoomControls},
 * {@link FitContentButton}) arranged in a {@link NavVertical} or
 * {@link NavHorizontal} from `@invana/ui`. No hook wiring needed — drop inside
 * a `<Canvas>` with an `icons` prop and it works.
 *
 * Lock stays **controlled** — pass `locked` + `onToggleLock` to surface it.
 * Append extra controls as `children`.
 *
 * @example
 * // Pattern A — drop inside a <Canvas>, self-wires via context:
 * <Canvas>
 *   <GraphLayer id="graph" data={data} />
 *   <CanvasControlsToolbar icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize }} />
 * </Canvas>
 *
 * @example
 * // Pattern B — one external controller driving the active canvas:
 * <div className="my-toolbar">
 *   <CanvasControlsToolbar bare canvas={activeCanvas} icons={…} />
 * </div>
 */
export function CanvasControlsToolbar({
  position = 'bottom-left',
  orientation = 'vertical',
  fitLayerId = 'graph',
  showZoom = true,
  showZoomLevel = false,
  showFit = true,
  icons,
  locked,
  onToggleLock,
  bare = false,
  canvas,
  children,
  className,
}: CanvasControlsToolbarProps) {
  const showLock =
    locked !== undefined && onToggleLock && icons.locked && icons.unlocked;

  const controls = (
    <>
      {showZoom && (
        <ZoomControls
          orientation={orientation}
          canvas={canvas}
          zoomInIcon={icons.zoomIn}
          zoomOutIcon={icons.zoomOut}
          showLevel={showZoomLevel}
        />
      )}
      {showFit && (
        <FitContentButton icon={icons.fit} canvas={canvas} layerId={fitLayerId} />
      )}
      {showLock && (
        <LockToggle
          locked={locked}
          onToggle={onToggleLock}
          lockedIcon={icons.locked!}
          unlockedIcon={icons.unlocked!}
        />
      )}
      {children}
    </>
  );

  const nav =
    orientation === 'vertical' ? (
      <NavVertical top={controls} className={className} />
    ) : (
      <NavHorizontal left={controls} className={className} />
    );

  if (bare) return nav;

  return (
    <Panel position={position} orientation={orientation}>
      {nav}
    </Panel>
  );
}

