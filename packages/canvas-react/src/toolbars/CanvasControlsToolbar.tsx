import type { ReactNode } from 'react';
import { Panel, ZoomControls, FitContentButton, LockToggle } from '../components';
import type { PanelPosition, ToolbarIcon } from '../components';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useZoom } from '../hooks/useZoom';
import { useFitContent } from '../hooks/useFitContent';

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
   * Show a live `NN%` zoom readout between the +/- buttons (the React-Flow
   * zoom-slider look). Driven by {@link useZoom}, so it tracks wheel / pinch /
   * button zoom. Default `false`.
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
   * Render **without** the self-positioning `<Panel>` and the floating-card
   * chrome (background / border / shadow) — just the bare control row — so it
   * composes into consumer chrome. This is what lets a *single* external
   * controller drive whichever canvas is active (draw.io-style): render it
   * outside the `<Canvas>` trees with `bare` + an explicit `canvas`. Default
   * `false`. When `false`, `position` pins it inside the canvas host as usual.
   */
  bare?: boolean;
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
 * Append a minimap toggle (or any extra) as `children` — they render after the
 * presets.
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
  const { zoom, zoomIn, zoomOut } = useZoom(canvas);
  const { fitContent } = useFitContent(fitLayerId, canvas);

  const showLock =
    locked !== undefined && onToggleLock && icons.locked && icons.unlocked;

  const row = (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        gap: 4,
        // The floating-card chrome only applies to the self-positioned overlay;
        // `bare` drops it so the row inherits the consumer's chrome.
        ...(bare
          ? null
          : {
              padding: 4,
              borderRadius: 8,
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }),
      }}
    >
      {showZoom && (
        <ZoomControls
          orientation={orientation}
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          zoomInIcon={icons.zoomIn}
          zoomOutIcon={icons.zoomOut}
          zoomLevel={showZoomLevel ? `${Math.round(zoom * 100)}%` : undefined}
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
  );

  // Bare: hand back just the row so it sits in consumer chrome (Pattern B).
  if (bare) return row;

  return (
    <Panel position={position} orientation={orientation}>
      {row}
    </Panel>
  );
}
