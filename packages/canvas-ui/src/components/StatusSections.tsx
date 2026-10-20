/**
 * A board's status sections — the pieces a host lays into its footer:
 *
 *   LHR · airport │ 3 selected  87%  WebGPU · 60 fps
 *
 * | Section | Shows |
 * |---|---|
 * | {@link MessageStatus} | what the pointer is over (`type · label`), else the canvas's latest message — a mode's hint, a layout's progress |
 * | {@link ViewStatus} | while a dense graph is zoomed out far enough to thin its edges, that only some are drawn; the selection; the zoom |
 * | {@link RendererStatus} | the render backend and its median frame rate over the last second |
 *
 * Each reads the engine it is given (`canvas`), so it works outside the canvas
 * tree; `null` draws nothing (`RendererStatus` still names its backend). The
 * frame rate is polled once a second, so the bar never repaints with the canvas.
 */

import type { Canvas } from '@invana/canvas';
import { useCanvasMessage, useSelection, useZoom } from '@invana/canvas-react';
import { EDGE_DENSITY, edgesThinned, type GraphLayer } from '@invana/graph';
import { useEffect, useState } from 'react';

/** The pointer's element, else the canvas's latest message. */
export function MessageStatus({ canvas, layerId = 'graph' }: { canvas: Canvas | null; layerId?: string }) {
  return canvas ? <MessageStatusLive canvas={canvas} layerId={layerId} /> : null;
}

function MessageStatusLive({ canvas, layerId }: { canvas: Canvas; layerId: string }) {
  const { message } = useCanvasMessage(canvas);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    const layer = canvas.layers.get<GraphLayer>(layerId);
    const renderer = layer?.getRenderer();
    const store = layer?.store;
    if (!layer || !renderer || !store) return;
    const onNode = ({ id }: { id: string }) => {
      const node = store.getNode(id);
      const label = node ? layer.resolveNodeStyle(node).labelText : '';
      setHover([node?.type, label || id].filter(Boolean).join(' · '));
    };
    const onEdge = ({ id }: { id: string }) => setHover(store.getEdge(id)?.type ?? id);
    const onOut = () => setHover(null);
    renderer.events.on('shape:pointerover', onNode);
    renderer.events.on('shape:pointerout', onOut);
    renderer.events.on('connector:pointerover', onEdge);
    renderer.events.on('connector:pointerout', onOut);
    return () => {
      renderer.events.off('shape:pointerover', onNode);
      renderer.events.off('shape:pointerout', onOut);
      renderer.events.off('connector:pointerover', onEdge);
      renderer.events.off('connector:pointerout', onOut);
    };
  }, [canvas, layerId]);
  const text = hover ?? message;
  if (!text) return null;
  return (
    <span title={text} className="border-border text-muted-foreground min-w-0 truncate border-l pl-3">
      {text}
    </span>
  );
}

/** Thinned edges, the selection and the zoom. */
export function ViewStatus({ canvas, layerId = 'graph' }: { canvas: Canvas | null; layerId?: string }) {
  return canvas ? <ViewStatusLive canvas={canvas} layerId={layerId} /> : null;
}

function ViewStatusLive({ canvas, layerId }: { canvas: Canvas; layerId: string }) {
  const { zoom } = useZoom(canvas);
  const { count } = useSelection({}, canvas);
  const [edges, setEdges] = useState(0);
  useEffect(() => {
    const store = canvas.layers.get<GraphLayer>(layerId)?.store;
    if (!store) return;
    const sync = () => setEdges(store.edgeCount());
    sync();
    return store.events.on('flush', sync);
  }, [canvas, layerId]);
  return (
    <span className="flex items-center gap-3 px-2">
      {edgesThinned(edges, zoom) ? (
        <span className="text-muted-foreground">
          About 1 in {Math.round(1 / EDGE_DENSITY.thinKeep)} relationships drawn · zoom in for all
        </span>
      ) : null}
      {count > 0 ? <span>{count} selected</span> : null}
      <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
    </span>
  );
}

/** The render backend, and the frame rate while a canvas is live. */
export function RendererStatus({ canvas, backend }: { canvas: Canvas | null; backend: 'webgl' | 'webgpu' }) {
  const [fps, setFps] = useState<number | null>(null);
  useEffect(() => {
    if (!canvas) {
      setFps(null);
      return;
    }
    const read = () => {
      const stats = canvas.frames.stats();
      setFps(stats.count ? Math.round(stats.fps) : null);
    };
    read();
    const timer = window.setInterval(read, 1000);
    return () => window.clearInterval(timer);
  }, [canvas]);
  return (
    <span className="px-2">
      {backend === 'webgpu' ? 'WebGPU' : 'WebGL'}
      {fps != null && ` · ${fps} fps`}
    </span>
  );
}
