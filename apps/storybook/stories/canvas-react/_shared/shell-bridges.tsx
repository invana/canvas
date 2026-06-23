// Reusable "bridges" for the canvas-react story shell — null-rendering components
// mounted inside `<Canvas>` (so their hooks resolve the live engine) plus the
// chrome-theme helpers. Extracted from `GraphVisualiserApp.stories.tsx` /
// `ExplorerCanvas.tsx` so every story shares the same wiring.

import { useEffect } from 'react';
import { useGraphCanvas, useSystemTheme } from '@invana/canvas-react';
import type { GraphCanvas, GraphData } from '@invana/graph';

import { ACTIVE_LAYOUT_ID, APP_DARK, APP_LIGHT } from './shell-config';

/**
 * Publishes the live engine to the lifted `CanvasContext` — rendered as the
 * **last** `<Canvas>` child so its mount effect runs after every layer /
 * behaviour above it has registered. Header / footer chrome (which sits outside
 * the `<Canvas>` subtree) then resolves the fully-wired instance.
 */
export function CanvasBridge({ onReady }: { onReady: (canvas: GraphCanvas | null) => void }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}

/**
 * Runs the active layout (`ACTIVE_LAYOUT_ID`) whenever the `data` reference
 * changes, and surfaces progress on the shared message channel — a sticky
 * "Laying out…" while it settles, replaced by a "ready" that auto-clears. The
 * config-first `<D3ForceLayout id>` only *registers* the layout; this is what
 * actually runs it on (re-)seed, so a story's nodes don't pile up unlaid-out at
 * the origin. Mounted *after* `<GraphLayer>` so the store already holds the new
 * topology when the layout runs.
 */
export function AutoLayoutBridge({
  data,
  layoutId = ACTIVE_LAYOUT_ID,
}: {
  data: GraphData;
  /** Layout id to run on (re-)seed. Default {@link ACTIVE_LAYOUT_ID}. */
  layoutId?: string;
}) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    if (!canvas || data.nodes.length === 0) return;
    canvas.showMessage(`Laying out ${data.nodes.length} nodes…`);
    void canvas.runLayout(layoutId).finally(() => canvas.showMessage('Graph ready', 3000));
  }, [canvas, data, layoutId]);
  return null;
}

/** Follows the OS scheme by pushing the matching colour patch through `update()`. */
export function SystemTheme() {
  useSystemTheme(APP_LIGHT, APP_DARK);
  return null;
}

/**
 * Flip the `@invana/ui` chrome (the whole `AppLayoutBase` shell — its
 * `bg-background` / `border-border` / `text-foreground` tokens, plus toolbar
 * buttons and menus) to match the canvas theme, so the app stays coherent
 * instead of the shell following the OS independently. Mirrors the storybook's
 * own `bootstrapOsTheme` (`.storybook/preview.ts`).
 */
export function applyChromeTheme(dark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'default-dark' : 'default-light');
  root.classList.remove('theme-default-light', 'theme-default-dark', 'light', 'dark');
  root.classList.add(dark ? 'theme-default-dark' : 'theme-default-light', dark ? 'dark' : 'light');
}

/** Whether the OS currently prefers a dark colour scheme. */
export function osPrefersDark(): boolean {
  return (
    typeof window !== 'undefined'
    && !!window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}
