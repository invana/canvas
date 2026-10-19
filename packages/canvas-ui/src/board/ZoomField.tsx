import { useState } from 'react';
import { ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';
import type { Canvas } from '@invana/canvas';
import { useCommandStates, useResolvedCanvas, useZoom } from '@invana/canvas-react';
import { Input } from '@invana/forms';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@invana/ui';

import { Tooltipped } from '../components';

export interface ZoomFieldProps {
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
  /** Percentages the ▾ offers, before *Fit to screen*. Default `[50, 100, 200]`. */
  presets?: readonly number[];
  /** What − and + step through, percent. */
  ladder?: readonly number[];
  /** Lowest and highest zoom a typed value is held to, percent. Default `10` and `400`. */
  min?: number;
  max?: number;
}

const LADDER = [10, 25, 33, 50, 67, 75, 100, 125, 150, 200, 300, 400];
const REFS = [{ command: 'camera.zoomTo' }, { command: 'camera.fit' }] as const;

/**
 * − · the zoom as a field · + — the view dock's bar. The field takes a typed
 * percent (Enter or leaving it applies, Esc cancels, ↑ ↓ step); its ▾ offers
 * the presets and *Fit to screen*. − and + step the ladder from wherever the
 * zoom is. Drives `camera.zoomTo` / `camera.fit`, so a saved panel can carry it.
 */
export function ZoomField({ canvas, presets = [50, 100, 200], ladder = LADDER, min = 10, max = 400 }: ZoomFieldProps) {
  const resolved = useResolvedCanvas(canvas);
  const { zoom } = useZoom(resolved);
  const { states, run } = useCommandStates(REFS, resolved);
  const [draft, setDraft] = useState<string | null>(null);
  const pct = Math.round(zoom * 100);
  const enabled = states[0]?.enabled ?? false;

  const to = (percent: number) => void run('camera.zoomTo', { value: Math.min(max, Math.max(min, percent)) / 100 });
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? ladder.find((v) => v > pct) : [...ladder].reverse().find((v) => v < pct);
    if (next !== undefined) to(next);
  };
  const commit = () => {
    if (draft === null) return;
    const n = Number.parseFloat(draft.replace('%', ''));
    if (Number.isFinite(n)) to(n);
    setDraft(null);
  };

  return (
    <div className="flex items-center gap-px">
      <Tooltipped label="Zoom out (⌘−)">
        <Button variant="ghost" size="icon-sm" aria-label="Zoom out" disabled={!enabled || pct <= min} onClick={() => step(-1)}>
          <ZoomOut />
        </Button>
      </Tooltipped>
      <div className="flex items-center rounded-control focus-within:ring-1 focus-within:ring-ring hover:bg-accent">
        <Input
          inputSize="sm"
          aria-label="Zoom, in percent"
          value={draft ?? `${pct}%`}
          disabled={!enabled}
          onFocus={(e) => {
            setDraft(String(pct));
            const el = e.currentTarget;
            requestAnimationFrame(() => el.select());
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit();
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setDraft(null);
              e.currentTarget.blur();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              setDraft(null);
              step(e.key === 'ArrowUp' ? 1 : -1);
            }
          }}
          className="w-11 border-0 bg-transparent px-1.5 text-xs tabular-nums shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Zoom presets" disabled={!enabled} className="hover:bg-transparent">
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-40">
            {presets.map((p) => (
              <DropdownMenuItem key={p} onSelect={() => to(p)}>
                {p}%{p === 100 && <DropdownMenuShortcut>⌘0</DropdownMenuShortcut>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!states[1]?.enabled} onSelect={() => void run('camera.fit')}>
              Fit to screen <DropdownMenuShortcut>⇧1</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Tooltipped label="Zoom in (⌘+)">
        <Button variant="ghost" size="icon-sm" aria-label="Zoom in" disabled={!enabled || pct >= max} onClick={() => step(1)}>
          <ZoomIn />
        </Button>
      </Tooltipped>
    </div>
  );
}
