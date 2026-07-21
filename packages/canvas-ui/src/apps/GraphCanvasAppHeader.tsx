/**
 * Header rail builder for {@link GraphCanvasApp}. Produces the `NavHorizontalProps`
 * handed to `AppLayoutV2.header` — a `@invana/ui` `NavHorizontal` carrying three
 * regions (`left` · `center` · `right`) composed into **one balanced bar** so the
 * centre sits at the bar's true geometric centre regardless of the side widths.
 *
 * `AppLayoutV2` renders the `NavHorizontal` itself, so this is a *builder* (props
 * in → `NavHorizontalProps` out), not a component — that's why the shell can't
 * double-wrap a `NavHorizontal` inside another.
 *
 * There's **no** baked "toolbar" / "theme toggle" concept — compose whatever you
 * want into the slots (a toolbar in `center`, a theme toggle in `right`, …). A
 * slot may be a node or a render-fn handed the live
 * {@link GraphCanvasAppControlContext}, so a control built in a slot can drive the
 * app. `title` is a convenience default for `left`. Shared types are imported
 * **type-only** from `./GraphCanvasApp` (erased at runtime → no import cycle).
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

/**
 * Build the `NavHorizontalProps` for the header rail: the three region slots
 * composed into a single **balanced-columns** `center` bar (so a wide centre
 * toolbar lands at true centre), plus the rail's height / padding / border class.
 * Handed straight to `AppLayoutV2.header`.
 */
export function buildHeaderNav(
  { title = 'Graph', left, center, right, className }: GraphCanvasAppHeaderOptions,
  ctx: GraphCanvasAppControlContext,
): NavHorizontalProps {
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

  // `NavHorizontal`'s own `center` slot centers within the *leftover* space between
  // its left/right slots, so a wide toolbar drifts off-true-centre when the brand
  // and right cluster have different widths. Instead we compose the three regions
  // ourselves into a single slot: the left and right columns share equal `flex-1`
  // (so they balance), while the centre takes its natural width — landing it at
  // the bar's true geometric centre, and never overflowing into the sides (the
  // flexible columns shrink via `min-w-0` first).
  //
  // Each region's *content* sits in a `shrink-0` group. Header controls are often
  // `ToolbarItems` (a `w-full` `NavHorizontal`); a content-sized `shrink-0` parent
  // collapses that `w-full` to its natural width, so multiple controls pack tight
  // instead of each stretching to fill the flexible column. The right group uses
  // `ml-auto` (not `justify-end`) to sit flush right — only utilities that the
  // design-kit's precompiled stylesheet actually ships have any effect here.
  const bar = (
    <div className="flex w-full items-center">
      <div className="flex flex-1 min-w-0 items-center">
        <div className="flex shrink-0 items-center gap-1 text-foreground">{leftNode}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">{centerNode}</div>
      <div className="flex flex-1 min-w-0 items-center">
        <div className="ml-auto flex shrink-0 items-center gap-1">{rightNode}</div>
      </div>
    </div>
  );

  return {
    center: bar,
    className: cx('h-[40px] px-3 border-b border-border bg-background', className),
  };
}
