import { forwardRef } from 'react';
import { GraphCanvas as EngineGraphCanvas } from '@invana/graph';

import { CanvasContext } from './CanvasContext';
import { GraphCanvasContext } from './GraphCanvasContext';
import { CanvasHost, useCanvasEngine, type CanvasRootProps } from './useCanvasEngine';

/** Props for {@link GraphCanvas} — identical to {@link CanvasRootProps}. */
export type GraphCanvasProps = CanvasRootProps;

/**
 * React root for the **graph** canvas engine (`@invana/graph`'s `GraphCanvas`, a
 * strict `Canvas` superset). Same lifecycle as {@link Canvas} but it
 * instantiates `GraphCanvas` and provides **both** {@link CanvasContext} *and*
 * {@link GraphCanvasContext} — so base wrappers (`useCanvas`) **and** the graph
 * hooks/toolbars (`useGraphCanvas` / `useGraphCanvasUpdate` /
 * `useGraphCanvasOptions`) work under it, and `config.activeLayout` auto-runs.
 *
 * This is the root for graph visualisations; `GraphCanvasApp` builds on it.
 * `forwardRef`'d — `ref.current` is the underlying `GraphCanvas` (or `null`
 * until init resolves). StrictMode-safe (see {@link useCanvasEngine}).
 *
 * @example
 * ```tsx
 * const ref = useRef<GraphCanvas>(null);
 * <GraphCanvas ref={ref} autoResize config={{ activeLayout: 'force' }}>
 *   <GraphLayer id="graph" data={data} />
 *   <D3ForceLayout id="force" targetLayerId="graph" />
 * </GraphCanvas>
 * ```
 */
export const GraphCanvas = forwardRef<EngineGraphCanvas, GraphCanvasProps>(function GraphCanvas(
  { children, style, className, config, ...engineOpts },
  ref,
) {
  const { canvas, hostRef } = useCanvasEngine<EngineGraphCanvas>(
    (opts) => new EngineGraphCanvas(opts),
    engineOpts,
    config,
    ref,
  );

  return (
    <CanvasHost hostRef={hostRef} className={className} style={style}>
      {canvas && (
        <CanvasContext.Provider value={canvas}>
          <GraphCanvasContext.Provider value={canvas}>{children}</GraphCanvasContext.Provider>
        </CanvasContext.Provider>
      )}
    </CanvasHost>
  );
});
