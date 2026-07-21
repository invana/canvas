/**
 * Footer rail builder for {@link GraphCanvasApp}. Produces the `NavHorizontalProps`
 * handed to `AppLayoutV2.footer` — a `@invana/ui` `NavHorizontal` with three slots
 * (`left` · `center` · `right`).
 *
 * `AppLayoutV2` renders the `NavHorizontal` itself, so this is a *builder* (props
 * in → `NavHorizontalProps` out), not a component.
 *
 * Like the header, there's no baked content — compose whatever you want into the
 * slots: drop `<GraphStatusBar/>` on the left, `<CanvasMessageBar/>` on the right,
 * live stats wherever. A slot may be a node or a render-fn handed the live
 * {@link GraphCanvasAppControlContext}. Shared types are imported **type-only**
 * from `./GraphCanvasApp` (erased at runtime → no cycle).
 */

import { type ReactNode } from 'react';
import type { NavHorizontalProps } from '@invana/ui';

import type { GraphCanvasAppControlContext, RegionSlot } from './GraphCanvasApp';

/** Resolve a {@link RegionSlot} against the control context. */
function renderSlot(slot: RegionSlot | undefined, ctx: GraphCanvasAppControlContext): ReactNode {
  return typeof slot === 'function'
    ? (slot as (c: GraphCanvasAppControlContext) => ReactNode)(ctx)
    : (slot ?? null);
}

/** Join truthy class names. */
function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Public footer option bag (the orchestrator's `footer` prop). */
export interface GraphCanvasAppFooterOptions {
  /** Footer-left — e.g. `<GraphStatusBar/>`. */
  left?: RegionSlot;
  /** Footer-center. */
  center?: RegionSlot;
  /** Footer-right — e.g. `<CanvasMessageBar/>`. */
  right?: RegionSlot;
  /** Class on the `NavHorizontal` bar. */
  className?: string;
}

/**
 * Build the `NavHorizontalProps` for the footer rail — the three engine-bound
 * slots (rendered only once the engine is live) plus the rail's height / padding /
 * border class. Handed straight to `AppLayoutV2.footer`.
 */
export function buildFooterNav(
  { left, center, right, className }: GraphCanvasAppFooterOptions,
  ctx: GraphCanvasAppControlContext,
): NavHorizontalProps {
  // Footer content is engine-bound (status / message), so render only once live.
  const live = ctx.canvas != null;
  const leftNode = left !== undefined && live ? renderSlot(left, ctx) : null;
  const centerNode = center !== undefined && live ? renderSlot(center, ctx) : null;
  const rightNode = right !== undefined && live ? renderSlot(right, ctx) : null;

  return {
    left: leftNode,
    center: centerNode,
    right: rightNode,
    className: cx('h-[25px] px-3 border-t border-border bg-background', className),
  };
}
