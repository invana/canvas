/**
 * `<GraphCanvasAppHeader>` — the header rail of {@link GraphCanvasApp}: a
 * `@invana/ui` `NavHorizontal` with three slots — `left` · `center` · `right`.
 *
 * There's **no special "toolbar" or "theme toggle"** concept — you compose
 * whatever you want into the slots (a toolbar in `center`, a theme toggle in
 * `right`, …). A slot may be a node or a render-fn handed the live
 * {@link GraphCanvasAppControlContext} (engine + theme), so a control built in a
 * slot can drive the app. `title` is just a convenience for the default `left`.
 *
 * Shared types are imported **type-only** from `./GraphCanvasApp` — erased at
 * runtime, so the regions stay split with no cycle.
 */

import { type ReactNode } from 'react';
import { NavHorizontal } from '@invana/ui';

import type { GraphCanvasAppControlContext, OverlayStyle, RegionSlot } from './GraphCanvasApp';

/** Bar background for the (optional) overlay style, or the docked-rail default. */
export function overlayBarClass(overlay: OverlayStyle | undefined, edge: 'b' | 't'): string {
  // Glass keeps the border to read as a distinct bar; transparent drops it.
  if (overlay === 'blur') return `bg-background/70 backdrop-blur-md border-${edge} border-border`;
  if (overlay === 'transparent') return ''; // fully see-through; only the controls paint
  return `border-${edge} border-border bg-background`;
}

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

/** Public header option bag (the orchestrator's `header` prop). */
export interface GraphCanvasAppHeaderOptions {
  /** Brand content — the default `left`. Default `'Graph'`. */
  title?: ReactNode;
  /** Header-left. Default: the {@link title}. */
  left?: RegionSlot;
  /** Header-center — compose a toolbar here. */
  center?: RegionSlot;
  /** Header-right — compose a theme toggle, actions, … here. */
  right?: RegionSlot;
  /** Class on the `NavHorizontal` bar. */
  className?: string;
}

export function GraphCanvasAppHeader({
  ctx,
  overlay,
  title = 'Graph',
  left,
  center,
  right,
  className,
}: GraphCanvasAppHeaderOptions & {
  /** Live control context — injected by the orchestrator. */
  ctx: GraphCanvasAppControlContext;
  /** Overlay bar style when floating over the canvas (undefined = docked rail). */
  overlay?: OverlayStyle;
}) {
  // `center` / `right` typically hold engine-bound controls, so render them only
  // once the engine is live; `left` (the brand) shows immediately.
  const live = ctx.canvas != null;

  const leftNode =
    left !== undefined ? (
      renderSlot(left, ctx)
    ) : (
      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</span>
    );
  const centerNode = center !== undefined && live ? renderSlot(center, ctx) : null;
  const rightNode = right !== undefined && live ? renderSlot(right, ctx) : null;

  return (
    <NavHorizontal
      className={cx('h-[40px]', overlayBarClass(overlay, 'b'), className)}
      left={leftNode}
      center={centerNode}
      right={rightNode}
    />
  );
}
