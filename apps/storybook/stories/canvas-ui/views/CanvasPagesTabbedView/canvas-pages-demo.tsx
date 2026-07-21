// Shared demo helpers for the CanvasPagesTabbedView stories. Not a story file
// (no `.stories` suffix) so Storybook doesn't pick it up. The view is engine-
// agnostic, so these stories drive it with plain presentational content — no
// `@invana/canvas` / `GraphCanvasApp` anywhere.

import { useState, type CSSProperties, type ReactNode } from 'react';

/** A sized, bordered frame so the `h-full` strip has a box to fill. */
export function DemoFrame({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    height: 420,
    width: '100%',
    maxWidth: 920,
    overflow: 'hidden',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--card)',
  };
  return <div style={style}>{children}</div>;
}

/** A static page body — a big centred label on a per-page tinted ground. */
export function DemoPanel({ title, hue }: { title: string; hue: number }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center text-2xl font-semibold"
      style={{ background: `hsl(${hue} 55% 96%)`, color: `hsl(${hue} 45% 32%)` }}
    >
      {title}
    </div>
  );
}

/**
 * A *stateful* page body — holds a local text value. Used to demonstrate
 * `keepMounted`: type here, switch tabs, come back, and the text survives because
 * the inactive page stayed mounted (just hidden).
 */
export function EditablePanel({ title, hue }: { title: string; hue: number }) {
  const [text, setText] = useState('');
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3"
      style={{ background: `hsl(${hue} 55% 97%)`, color: `hsl(${hue} 45% 32%)` }}
    >
      <div className="text-xl font-semibold">{title}</div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type, switch tabs, come back…"
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        style={{ minWidth: 280 }}
      />
    </div>
  );
}

/** Evenly spaced hues so N demo pages read as distinct colours. */
export function hueFor(index: number): number {
  return (index * 47) % 360;
}
