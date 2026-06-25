import * as graph from '@invana/graph';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  type ClickViewBehaviourOptions,
} from '@invana/graph';

import { useBehaviourRegistration } from './useBehaviourRegistration';
import { useViewContext, type ViewContext } from '../hooks/useViewContext';

export interface ClickViewBehaviourProps
  extends Omit<ClickViewBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'click-view'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id this behaviour reads clicks from; default `'graph'`. */
  targetLayerId?: string;
  /**
   * Viewer UI for the clicked element, as a render-prop. Receives the full
   * {@link ViewContext} — `kind` (`'node' | 'edge'` today, extensible to future
   * data types), the raw entity, resolved display fields, and engine handles
   * (including `close()`) — so you can render anything: read-only details in a
   * visualiser, a form editor in a modeller.
   *
   * **This behaviour renders `panel(ctx)` verbatim — it owns no placement, no
   * `<Panel>`, no close chrome.** Those are the consumer's: wrap the (pure)
   * `<NodeDetailView>` / `<EdgeDetailView>` in a `<Panel>` to float it in a
   * corner, drop it in your own layout, or render it entirely **outside** the
   * canvas. Wire a close button to `ctx.close` if you want one; a background
   * click clears the target regardless.
   *
   * Omit it for a **pure target-tracking behaviour** with no UI — read the target
   * elsewhere via `useViewContext` / `useViewData` (e.g. a detail panel owned
   * outside the canvas) or subscribe to the engine `view:change` event yourself.
   *
   * @example
   * ```tsx
   * <ClickViewBehaviour targetLayerId="graph" enabled
   *   panel={(ctx) => (
   *     <Panel position="top-right">
   *       {ctx.kind === 'edge' ? <EdgeDetailView ctx={ctx} /> : <NodeDetailView ctx={ctx} />}
   *     </Panel>
   *   )} />
   * ```
   */
  panel?: (ctx: ViewContext) => ReactNode;
  /**
   * Notified whenever the viewed element **changes** — the resolved
   * {@link ViewContext} (kind, id, label, type, `data`, edge `source`/`target`,
   * engine handles, `close()`), or `null` when the target is cleared. Use this to
   * render the detail viewer **outside this subtree** — even outside
   * `GraphCanvasApp`: stash the ctx in your own state and render a
   * `<NodeDetailView>` / `<EdgeDetailView>` wherever you like (the views are pure
   * and only need the ctx). Works with or without `panel`.
   *
   * @example
   * ```tsx
   * const [view, setView] = useState<ViewContext | null>(null);
   * // …inside the canvas:
   * <ClickViewBehaviour onView={setView} />
   * // …anywhere else in your app:
   * {view && (view.kind === 'edge'
   *   ? <EdgeDetailView ctx={view} onClose={view.close} />
   *   : <NodeDetailView ctx={view} onClose={view.close} />)}
   * ```
   */
  onView?: (ctx: ViewContext | null) => void;
}

/**
 * Declarative wrapper for `@invana/graph` `ClickViewBehaviour` — tracks the
 * single node/edge clicked for **read-only property viewing**, decoupled from
 * selection (it applies no visual effect of its own; pair it with a
 * `ClickSelectBehaviour` if you want the clicked element highlighted).
 *
 * Pass a {@link ClickViewBehaviourProps.panel} render-prop to mount viewer UI
 * for whatever was clicked — one component drives both the behaviour and its UI,
 * and the same `panel(ctx)` contract serves every use case (details vs. editor)
 * and every data `kind`. The behaviour renders `panel(ctx)` **verbatim**:
 * placement, `<Panel>`, and any close chrome are the consumer's. Without `panel`
 * it's a pure behaviour and renders nothing.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function ClickViewBehaviour({
  id = 'click-view',
  targetLayerId = 'graph',
  enabled = true,
  panel,
  onView,
  ...rest
}: ClickViewBehaviourProps) {
  useBehaviourRegistration(
    () => new graph.ClickViewBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  // Mount the subscription surface if either consumer hook is present.
  return panel || onView ? (
    <ClickViewSurface
      viewId={id}
      layerId={targetLayerId}
      {...(panel ? { panel } : {})}
      {...(onView ? { onView } : {})}
    />
  ) : null;
}

/**
 * Resolves the live {@link ViewContext} for the behaviour, renders the
 * consumer's `panel` verbatim (if any), and notifies `onView` when the viewed
 * element changes (for detail UI rendered outside this subtree). Split out so
 * the context subscription is its own component (its effect runs before the
 * parent's registration effect — `useViewTarget` tolerates the behaviour
 * appearing slightly later).
 */
function ClickViewSurface({
  viewId,
  layerId,
  panel,
  onView,
}: {
  viewId: string;
  layerId: string;
  panel?: (ctx: ViewContext) => ReactNode;
  onView?: (ctx: ViewContext | null) => void;
}) {
  const ctx = useViewContext({ layerId, viewId });

  // Fire `onView` on target *change* only (not on every data tick) — keyed on
  // the element identity, callback read through a ref to stay current.
  const key = ctx ? `${ctx.kind}:${ctx.id}` : null;
  const onViewRef = useRef(onView);
  onViewRef.current = onView;
  useEffect(() => {
    onViewRef.current?.(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return panel && ctx ? <>{panel(ctx)}</> : null;
}
