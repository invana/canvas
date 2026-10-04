import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { GraphCanvas, GraphData } from '@invana/graph';

import { DEFAULT_CANVAS_ID } from './types';

/**
 * Turns a `canvas` panel's `dataRef` into a graph. Return `undefined` for an
 * unknown reference — the panel then says so instead of drawing an empty canvas.
 */
export type ResolveCanvasData = (dataRef: string) => GraphData | undefined;

interface CanvasBoardValue {
  resolveData: ResolveCanvasData;
  /** Live engine per `canvasId` — `null` while one is mounting or after it unmounts. */
  engines: Readonly<Record<string, GraphCanvas | null>>;
  register: (canvasId: string, canvas: GraphCanvas | null) => void;
}

const CanvasBoardContext = createContext<CanvasBoardValue | null>(null);

/** Props of {@link CanvasBoardProvider}. */
export interface CanvasBoardProviderProps {
  /** Resolves each `canvas` panel's `dataRef`. Keep the reference stable. */
  resolveData: ResolveCanvasData;
  /** One `Board`, a `BoardPages`, or anything that renders this package's panels. */
  children?: ReactNode;
}

/**
 * The shared state a board's canvas panels need: how to resolve a `dataRef`,
 * and which live engine answers to which `canvasId`. A `canvas` panel registers
 * its engine here once ready; `canvas-inspector` / `canvas-layers` /
 * `canvas-table` look it up.
 *
 * Board panels only receive their own JSON options, and the canvas is a
 * *sibling* of the panels that read it, so the engine has to travel through
 * something both share. This is that, scoped to the subtree — no module state,
 * so any number of boards can sit on one page. `canvasId`s must be unique within
 * one provider (wrap `BoardPages` in one, and give each page's canvas its own id).
 */
export function CanvasBoardProvider({ resolveData, children }: CanvasBoardProviderProps) {
  const [engines, setEngines] = useState<Record<string, GraphCanvas | null>>({});
  const register = useCallback((canvasId: string, canvas: GraphCanvas | null) => {
    setEngines((prev) => (prev[canvasId] === canvas ? prev : { ...prev, [canvasId]: canvas }));
  }, []);
  const value = useMemo(() => ({ resolveData, engines, register }), [resolveData, engines, register]);
  return <CanvasBoardContext.Provider value={value}>{children}</CanvasBoardContext.Provider>;
}

/** The nearest provider, or a named error when a panel is rendered without one. */
export function useCanvasBoardContext(kind: string): CanvasBoardValue {
  const value = useContext(CanvasBoardContext);
  if (!value) {
    throw new Error(
      `A "${kind}" panel must be rendered inside a <CanvasBoardProvider> (or use <CanvasBoard>, which includes one).`,
    );
  }
  return value;
}

/**
 * The live engine of the board canvas named `canvasId` (default `"canvas"`), or
 * `null` until that canvas has mounted and registered.
 */
export function useBoardCanvas(canvasId: string = DEFAULT_CANVAS_ID): GraphCanvas | null {
  return useCanvasBoardContext('canvas-*').engines[canvasId] ?? null;
}
