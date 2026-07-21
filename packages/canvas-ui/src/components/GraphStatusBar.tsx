import { useEffect, useState, type CSSProperties } from 'react';
import type { Canvas } from '@invana/canvas';
import type { GraphLayer } from '@invana/graph';

import { useResolvedCanvas } from '@invana/canvas-react';
import { useZoom } from '@invana/canvas-react';
import { useSelection } from '@invana/canvas-react';
import { useCanvasEvent } from '@invana/canvas-react';

/** Hovered element descriptor surfaced in the status bar. */
type HoverInfo = { kind: 'node' | 'edge'; id: string; label: string };

export interface GraphStatusBarProps {
  /** Graph layer id read for counts + hover. Default `'graph'`. */
  layerId?: string;
  /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
  clickSelectId?: string;
  /** Explicit canvas instance; defaults to the context canvas (works from footer chrome). */
  canvas?: Canvas | null;
  className?: string;
  style?: CSSProperties;
}

/**
 * A live, read-only **status bar** — drop it into a footer / status strip to
 * surface engine telemetry: rendered node/edge totals, camera zoom + pan, the
 * pointer's world position, the hovered node/edge, and the current selection
 * counts. Self-wiring: it reads the engine from the (lifted) `CanvasContext` or
 * an explicit `canvas` prop, so it works **outside** `<Canvas>` (e.g. in an
 * app-shell footer). Sections appear only when they have data (pointer / hover /
 * selection hide when empty).
 */
export function GraphStatusBar({
  layerId = 'graph',
  clickSelectId,
  canvas,
  className,
  style,
}: GraphStatusBarProps) {
  const resolved = useResolvedCanvas(canvas);
  const { zoom } = useZoom(canvas);
  const { selectedNodeIds, selectedEdgeIds, count: selectionCount } = useSelection(
    clickSelectId ? { clickSelectId } : {},
    canvas,
  );
  const [pan, setPan] = useState({ x: resolved.camera.x, y: resolved.camera.y });
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [counts, setCounts] = useState({ nodes: 0, edges: 0 });

  // Camera translation — re-synced live as the user pans.
  useCanvasEvent('input:camera:pan', ({ x, y }) => setPan({ x, y }), canvas);

  // Rendered node / edge totals — read off the graph store and re-synced on its
  // `flush` event (one per batched mutation), so the counts track adds/removes.
  useEffect(() => {
    const store = resolved.layers.get<GraphLayer>(layerId)?.store;
    if (!store) return;
    const sync = (): void => setCounts({ nodes: store.nodeCount(), edges: store.edgeCount() });
    sync();
    return store.events.on('flush', sync);
  }, [resolved, layerId]);

  // Pointer world position — the canvas-wide bus drops high-frequency
  // pointermove, so listen on the pixi canvas element and project to world.
  useEffect(() => {
    const el = resolved.application?.canvas;
    if (!el) return;
    const onMove = (e: PointerEvent): void => setPointer(resolved.camera.toWorld(e.offsetX, e.offsetY));
    const onLeave = (): void => setPointer(null);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [resolved]);

  // Hovered node / edge — raw pointer-hit events off the graph layer's renderer.
  // The pointer events carry only the id; resolve the *drawn* display label
  // through the layer's own style resolver — the same `labelText` that paints
  // the node/edge on the canvas — so the status bar always matches what's on
  // screen instead of second-guessing which data field holds the label. Falls
  // back to the id (node) / type (edge) when no label resolves.
  useEffect(() => {
    const layer = resolved.layers.get<GraphLayer>(layerId);
    const renderer = layer?.getRenderer();
    const store = layer?.store;
    if (!renderer || !store) return;
    const nodeLabel = (id: string): string => {
      const node = store.getNode(id);
      if (!node) return id;
      return layer.resolveNodeStyle(node).labelText || id;
    };
    const edgeLabel = (id: string): string => {
      const edge = store.getEdge(id);
      if (!edge) return id;
      return layer.resolveEdgeStyle(edge).labelText || edge.type || id;
    };
    const onShapeOver = (e: { id: string }): void =>
      setHover({ kind: 'node', id: e.id, label: nodeLabel(e.id) });
    const onConnOver = (e: { id: string }): void =>
      setHover({ kind: 'edge', id: e.id, label: edgeLabel(e.id) });
    const onOut = (): void => setHover(null);
    renderer.events.on('shape:pointerover', onShapeOver);
    renderer.events.on('shape:pointerout', onOut);
    renderer.events.on('connector:pointerover', onConnOver);
    renderer.events.on('connector:pointerout', onOut);
    return () => {
      renderer.events.off('shape:pointerover', onShapeOver);
      renderer.events.off('shape:pointerout', onOut);
      renderer.events.off('connector:pointerover', onConnOver);
      renderer.events.off('connector:pointerout', onOut);
    };
  }, [resolved, layerId]);

  const coord = (p: { x: number; y: number } | null): string =>
    p ? `${p.x.toFixed(0)}, ${p.y.toFixed(0)}` : '—';

  return (
    <div style={{ ...statusRowStyle, ...style }} className={className}>
      <span>
        {counts.nodes} nodes and {counts.edges} edges rendered
      </span>

      <span style={statusSepStyle}>·</span>
      <span>Zoom: {Math.round(zoom * 100)}%</span>
      <span style={statusSepStyle}>·</span>
      <span>Pan: {coord(pan)}</span>
      {pointer && (
        <>
          <span style={statusSepStyle}>·</span>
          <span>Pointer: {coord(pointer)}</span>
        </>
      )}

      {hover && (
        <>
          <span style={statusSepStyle}>·</span>
          <span>
            Hovered {`${hover.kind.charAt(0).toUpperCase() + hover.kind.slice(1)} - ${hover.label} [ID: ${hover.id}]`}
          </span>
        </>
      )}
      {selectionCount > 0 && (
        <>
          <span style={statusSepStyle}>·</span>
          <span>
            Selected:{' '}
            {[
              selectedNodeIds.length > 0 ? `${selectedNodeIds.length} nodes` : null,
              selectedEdgeIds.length > 0 ? `${selectedEdgeIds.length} edges` : null,
            ]
              .filter(Boolean)
              .join(', ')}
          </span>
        </>
      )}
    </div>
  );
}

const statusRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
  whiteSpace: 'nowrap',
};
const statusSepStyle: CSSProperties = { opacity: 0.4 };
