import type { CSSProperties } from 'react';
import { cn } from '@invana/ui';

import type { PropertyRenderer } from '../components';
import type { ViewContext } from '@invana/canvas-react';

/**
 * Shared props for the engine-aware detail panels (`NodeDetailView` /
 * `EdgeDetailView`). Each maps a {@link ViewContext} to a `DetailCard` +
 * `PropertyDetailView`; these are the knobs they have in common.
 */
export interface BaseDetailViewProps {
  /**
   * The clicked element's full context — passed in by the `panel` render-prop of
   * `<ClickViewBehaviour>`.
   */
  ctx: ViewContext;
  /** Show the element id as the card subtitle. Default `true`. */
  showId?: boolean;
  /**
   * Extra property renderers, tried before the built-ins — add or override a
   * data type with a single {@link PropertyRenderer} object. Forwarded to
   * `PropertyDetailView`.
   */
  renderers?: PropertyRenderer[];
  /** Per-key kind hint, forwarded to `PropertyDetailView`. */
  hints?: Record<string, string>;
  /**
   * Class on the card — the placement + sizing + appearance surface (the panels
   * are layout-agnostic). Spread {@link dockCardClassName} for a full-height dock.
   */
  className?: string;
  /** Inline style on the card — the runtime-valued companion to {@link className}. */
  style?: CSSProperties;
}

/**
 * Coerce a resolved style fill/stroke into a CSS color string for the detail
 * views — `0x60a5fa` → `'#60a5fa'`, a CSS string passes through, anything else
 * → `undefined` (so the title falls back to the default text colour).
 */
export function toCssColor(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `#${(value & 0xffffff).toString(16).padStart(6, '0')}`;
  }
  if (typeof value === 'string' && value.trim()) return value;
  return undefined;
}

/**
 * Class recipe for a full-height side **dock** — pass as `className` of a
 * `NodeDetailView` / `EdgeDetailView`. Absolutely pins to `side` and spans
 * top → bottom (`inset-y-0`), translucent + scrollable + square.
 *
 * To inset it **below floating chrome**, pass explicit `top` / `bottom` via the
 * `style` prop (inline style overrides the baked `inset-y-0`).
 *
 * ```tsx
 * <NodeDetailView ctx={ctx} className={dockCardClassName('right')} />
 * <NodeDetailView ctx={ctx} className={dockCardClassName('right')}
 *   style={{ top: 40, bottom: 25 }} />   // clear a 40px header + 25px footer
 * ```
 */
export function dockCardClassName(side: 'left' | 'right' = 'right'): string {
  return cn(
    'absolute inset-y-0 z-[5] w-80 max-w-none overflow-y-auto rounded-none bg-popover/85 backdrop-blur-md',
    side === 'left' ? 'left-0' : 'right-0',
  );
}
