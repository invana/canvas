import type { CSSProperties } from 'react';
import { cn } from '@invana/ui';

import { PropertiesViewer } from '../components';
import type { PropertiesViewerRow } from '../components';
import type { ViewContext } from '../hooks/useViewContext';

export interface ElementDetailViewerProps {
  /**
   * The clicked element's full context — passed in by the `panel` render-prop of
   * `<ClickViewBehaviour>` (`panel={(ctx) => <ElementDetailViewer ctx={ctx} />}`).
   */
  ctx: ViewContext;
  /** Heading when a node is viewed. Default `'Node'`. */
  nodeTitle?: string;
  /** Heading when an edge is viewed. Default `'Edge'`. */
  edgeTitle?: string;
  /** Show the element id as the card subtitle. Default `true`. */
  showId?: boolean;
  /**
   * Class on the card — forwarded to {@link PropertiesViewer}. **This is the
   * placement + sizing + appearance surface**: the viewer is layout-agnostic, so
   * the consumer positions it (wrap in `<Panel>` for a corner, drop it in a
   * layout column for an in-flow side panel, or spread {@link dockCardClassName}
   * for a full-height dock).
   */
  className?: string;
  /**
   * Inline style on the card — forwarded to {@link PropertiesViewer}. The
   * runtime-valued companion to {@link className}; use it for placement values,
   * e.g. insetting a dock below floating chrome with explicit `top` / `bottom`
   * (see {@link dockCardClassName}).
   */
  style?: CSSProperties;
}

/**
 * The **default** read-only viewer for `<ClickViewBehaviour>` — a turnkey `panel`
 * render-prop target. The thin, engine-aware adapter: it maps a {@link ViewContext}
 * to a {@link PropertiesViewer}'s props (Type / Label / Source / Target rows, id
 * subtitle, `data`) and renders it. It owns **no** layout — placement is the
 * consumer's, via `className`.
 *
 * Swap it for your own component to customise per use case — e.g. a form editor
 * in a modeller — since the behaviour hands the same `ctx` to whatever you pass:
 *
 * ```tsx
 * <ClickViewBehaviour panel={(ctx) => <ElementDetailViewer ctx={ctx} />} />        // visualiser
 * <ClickViewBehaviour panel={(ctx) => <ModelEditorPanel ctx={ctx} />} />           // modeller
 * ```
 */
export function ElementDetailViewer({
  ctx,
  nodeTitle = 'Node',
  edgeTitle = 'Edge',
  showId = true,
  className,
  style,
}: ElementDetailViewerProps) {
  const isEdge = ctx.kind === 'edge';
  // `type` (the graph-DB label / predicate) and `labelText` (the drawn text) are
  // distinct — show both, as labeled rows, for nodes and edges alike.
  const rows: PropertiesViewerRow[] = [];
  if (ctx.type) rows.push({ label: 'Type', value: ctx.type });
  if (ctx.label) rows.push({ label: 'Label', value: ctx.label });
  if (isEdge) {
    rows.push({ label: 'Source', value: ctx.source ?? '', mono: true });
    rows.push({ label: 'Target', value: ctx.target ?? '', mono: true });
  }

  return (
    <PropertiesViewer
      title={isEdge ? edgeTitle : nodeTitle}
      onClose={ctx.close}
      {...(showId ? { subtitle: ctx.id } : {})}
      rows={rows}
      data={ctx.data}
      {...(className !== undefined ? { className } : {})}
      {...(style !== undefined ? { style } : {})}
    />
  );
}

/**
 * Class recipe for a full-height side **dock** — pass as the `className` of an
 * {@link ElementDetailViewer}. Absolutely pins to `side` and spans top → bottom
 * (`inset-y-0`), translucent + scrollable + square.
 *
 * To inset it **below floating chrome**, pass explicit `top` / `bottom` via the
 * `style` prop (inline style overrides the baked `inset-y-0`).
 *
 * ```tsx
 * <ElementDetailViewer ctx={ctx} className={dockCardClassName('right')} />
 * <ElementDetailViewer ctx={ctx} className={dockCardClassName('right')}
 *   style={{ top: 40, bottom: 25 }} />   // clear a 40px header + 25px footer
 * ```
 */
export function dockCardClassName(side: 'left' | 'right' = 'right'): string {
  return cn(
    'absolute inset-y-0 z-[5] w-80 max-w-none overflow-y-auto rounded-none bg-popover/85 backdrop-blur-md',
    side === 'left' ? 'left-0' : 'right-0',
  );
}
