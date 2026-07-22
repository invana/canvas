// Shared demo helpers for the CanvasPagesTabbedView stories. Not a story file
// (no `.stories` suffix) so Storybook doesn't pick it up. The view is engine-
// agnostic, but its real-world content is one `<GraphCanvasApp>` per page (the
// CanvasBoards pattern), so these stories drive it with an actual board — a small
// self-contained graph app — rather than a placeholder panel. Each story wraps the
// strip in a single `<ThemeProvider>` (GraphCanvasApp requires one ancestor).

import { useMemo, type ReactNode } from 'react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import type { GraphData, GraphNode } from '@invana/graph';

/** A sized, bordered frame so the `h-full` strip has a box to fill. */
export function DemoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-[420px] w-full max-w-[920px] overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
  );
}

/** Evenly spaced hues so N demo boards read as distinct colours. */
export function hueFor(index: number): number {
  return (index * 47) % 360;
}

/** HSL → packed `0xRRGGBB`, so a board's hue drives its node fill. */
function hslToRgbNumber(h: number, s: number, l: number): number {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const k = (n: number): number => (n + h / 30) % 12;
  const f = (n: number): number => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number): number => Math.round(255 * x);
  return (to(f(0)) << 16) | (to(f(8)) << 8) | to(f(4));
}

/** A tiny hub-and-spoke graph — the hub carries the board title as its label. */
function boardGraph(title: string): GraphData {
  return {
    nodes: [
      { id: 'hub', data: { name: title } },
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
      { id: 'e' },
    ],
    edges: [
      { id: 'ha', source: 'hub', target: 'a' },
      { id: 'hb', source: 'hub', target: 'b' },
      { id: 'hc', source: 'hub', target: 'c' },
      { id: 'hd', source: 'hub', target: 'd' },
      { id: 'he', source: 'hub', target: 'e' },
    ],
  };
}

/**
 * One page body = one independent `<GraphCanvasApp>` board (its own engine + state
 * — camera / layout / selection). Header off so the board reads as pure canvas;
 * the hub node shows the board `title`, and every node is tinted by the board
 * `hue`. This is exactly the CanvasBoards content, scaled down for the tab-strip
 * feature stories.
 */
export function DemoBoard({ title, hue }: { title: string; hue: number }) {
  const data = useMemo(() => boardGraph(title), [title]);
  const color = hslToRgbNumber(hue, 60, 55);
  return (
    <GraphCanvasApp
      data={data}
      showHeader={false}
      config={{
        // Distinct fill per board; colour-by-label off so it isn't re-tinted.
        behaviours: { color: { enabled: false } },
        layers: {
          graph: {
            node: {
              style: {
                bgFill: color,
                labelText: (n: GraphNode) => (n.data as { name?: string } | undefined)?.name ?? n.id,
              },
            },
          },
        },
      }}
    />
  );
}
