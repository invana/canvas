/**
 * `<GraphCanvasAppFooter>` — the footer rail of {@link GraphCanvasApp}: a
 * `@invana/ui` `NavHorizontal` with three slots — `left` · `center` · `right`.
 *
 * Like the header, there's no baked content — you compose whatever you want into
 * the slots: drop `<GraphStatusBar/>` on the left, `<CanvasMessageBar/>` on the
 * right, live stats wherever. A slot may be a node or a render-fn handed the live
 * {@link GraphCanvasAppControlContext}. Shared types are imported **type-only**
 * from `./GraphCanvasApp` (erased at runtime → no cycle).
 */

import { type ReactNode } from 'react';
import { NavHorizontal } from '@invana/ui';

import { overlayBarClass } from './GraphCanvasAppHeader';
import type { GraphCanvasAppControlContext, OverlayStyle, RegionSlot } from './GraphCanvasApp';

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

export function GraphCanvasAppFooter({
  ctx,
  overlay,
  left,
  center,
  right,
  className,
}: GraphCanvasAppFooterOptions & {
  /** Live control context — injected by the orchestrator. */
  ctx: GraphCanvasAppControlContext;
  /** Overlay bar style when floating over the canvas (undefined = docked rail). */
  overlay?: OverlayStyle;
}) {
  // Footer content is engine-bound (status / message), so render only once live.
  const live = ctx.canvas != null;
  const leftNode = left !== undefined && live ? renderSlot(left, ctx) : null;
  const centerNode = center !== undefined && live ? renderSlot(center, ctx) : null;
  const rightNode = right !== undefined && live ? renderSlot(right, ctx) : null;

  return (
    <NavHorizontal
      className={cx('h-[25px]', overlayBarClass(overlay, 't'), className)}
      left={leftNode}
      center={centerNode}
      right={rightNode}
    />
  );
}
