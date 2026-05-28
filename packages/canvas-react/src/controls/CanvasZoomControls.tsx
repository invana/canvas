import { Panel, ZoomControls } from '@invana/canvas-ui';
import type { PanelPosition, ToolbarIcon } from '@invana/canvas-ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useZoom } from '../hooks/useZoom';

export interface CanvasZoomControlsProps {
  /** Where the control pins within the canvas host. Default `'bottom-right'`. */
  position?: PanelPosition;
  /** Stack direction of the +/- buttons. Default `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Show a live `NN%` zoom readout next to the buttons. Default `false`. */
  showZoomLevel?: boolean;
  /** Icon components (consumer-supplied — the package stays icon-agnostic). */
  icons: { zoomIn: ToolbarIcon; zoomOut: ToolbarIcon };
  /** Explicit canvas instance; defaults to the context canvas. */
  canvas?: EngineCanvas | null;
  className?: string;
}

/**
 * Self-wiring zoom control overlay. Pulls the camera from context via
 * {@link useZoom}, so dropped inside a `<Canvas>` it works with no callback
 * wiring — and is multi-canvas-safe (each instance reads its own context).
 *
 * @example
 * <Canvas>
 *   <GraphLayer id="graph" data={data} />
 *   <CanvasZoomControls icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut }} showZoomLevel />
 * </Canvas>
 */
export function CanvasZoomControls({
  position = 'bottom-right',
  orientation = 'vertical',
  showZoomLevel = false,
  icons,
  canvas,
  className,
}: CanvasZoomControlsProps) {
  const { zoom, zoomIn, zoomOut } = useZoom(canvas);

  return (
    <Panel position={position} orientation={orientation}>
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ZoomControls
          orientation={orientation}
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          zoomInIcon={icons.zoomIn}
          zoomOutIcon={icons.zoomOut}
        />
        {showZoomLevel && (
          <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>
            {Math.round(zoom * 100)}%
          </span>
        )}
      </div>
    </Panel>
  );
}
