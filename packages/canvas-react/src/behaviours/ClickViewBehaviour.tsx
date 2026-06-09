import type { ReactNode } from 'react';
import {
  ClickViewBehaviour as EngineClickViewBehaviour,
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
   * data types), the raw entity, resolved display fields, engine handles, and
   * `close()` — so you can render anything: read-only details in a visualiser, a
   * form editor in a modeller. The returned node owns its own placement / chrome
   * (e.g. `<PropertyViewerPanel>`, which wraps itself in a `<Panel>`).
   *
   * Omit it for a **pure target-tracking behaviour** with no UI (just subscribe
   * to the engine `view:change` event yourself).
   *
   * @example
   * ```tsx
   * <ClickViewBehaviour targetLayerId="graph" enabled
   *   panel={(ctx) => <PropertyViewerPanel ctx={ctx} position="top-right" />} />
   * ```
   */
  panel?: (ctx: ViewContext) => ReactNode;
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
 * and every data `kind`. Without `panel` it's a pure behaviour and renders
 * nothing.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
export function ClickViewBehaviour({
  id = 'click-view',
  targetLayerId = 'graph',
  enabled = true,
  panel,
  ...rest
}: ClickViewBehaviourProps) {
  useBehaviourRegistration(
    () => new EngineClickViewBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );
  return panel ? <ClickViewSurface viewId={id} layerId={targetLayerId} panel={panel} /> : null;
}

/**
 * Resolves the live {@link ViewContext} for the behaviour and renders the
 * consumer's `panel`. Split out so the context subscription is its own component
 * (its effect runs before the parent's registration effect — `useViewTarget`
 * tolerates the behaviour appearing slightly later).
 */
function ClickViewSurface({
  viewId,
  layerId,
  panel,
}: {
  viewId: string;
  layerId: string;
  panel: (ctx: ViewContext) => ReactNode;
}) {
  const ctx = useViewContext({ layerId, viewId });
  return ctx ? <>{panel(ctx)}</> : null;
}
