import { DetailCard, PropertyDetailView } from '../components';
import type { DetailRow } from '../components';
import { toCssColor, type BaseDetailViewProps } from './detailView';

export interface NodeDetailViewProps extends BaseDetailViewProps {
  /** Fallback heading when the node has no label. Default `'Node'`. */
  title?: string;
}

/**
 * The default read-only detail **card** for a **node** — a pure, reusable view.
 * The engine-aware adapter: it maps a {@link ViewContext} to a {@link DetailCard}
 * (Type / Label identity rows + id subtitle) wrapping a {@link PropertyDetailView}
 * that renders the node's `data` by kind. The card title is tinted with the
 * node's resolved fill colour.
 *
 * It is **bare content** — no surface, placement, or close of its own. Drop it
 * into a `<PanelContent>` (inside a `<Panel>`) which provides the surface,
 * header, and close. Add or override a data-type rendering via `renderers`.
 *
 * ```tsx
 * <ClickViewBehaviour panel={(ctx) =>
 *   ctx.kind === 'edge' ? <EdgeDetailView ctx={ctx} /> : <NodeDetailView ctx={ctx} />
 * } />
 * ```
 */
export function NodeDetailView({
  ctx,
  title = 'Node',
  showId = true,
  renderers,
  hints,
  className,
  style,
}: NodeDetailViewProps) {
  // The heading is the node's drawn label (falling back to the kind). `id` and
  // `type` are identity rows. No separate "Label" row — that's the heading now.
  const rows: DetailRow[] = [];
  if (showId) rows.push({ label: 'ID', value: ctx.id });
  if (ctx.type) rows.push({ label: 'Type', value: ctx.type });

  // Tint the title with the node's resolved fill colour.
  const titleColor = ctx.node ? toCssColor(ctx.layer.resolveNodeStyle(ctx.node).bgFill) : undefined;

  return (
    // Key by element id so per-element expand/collapse state resets on switch.
    <DetailCard
      key={ctx.id}
      title={ctx.label || title}
      {...(titleColor ? { titleColor } : {})}
      rows={rows}
      {...(className !== undefined ? { className } : {})}
      {...(style !== undefined ? { style } : {})}
    >
      <PropertyDetailView
        data={ctx.data}
        {...(renderers ? { renderers } : {})}
        {...(hints ? { hints } : {})}
      />
    </DetailCard>
  );
}
