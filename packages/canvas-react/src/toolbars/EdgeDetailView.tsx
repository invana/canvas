import { DetailCard, EdgeEndpoints, PropertyDetailView } from '../components';
import type { DetailRow, EdgeEndpoint } from '../components';
import type { ViewContext } from '../hooks/useViewContext';
import { toCssColor, type BaseDetailViewProps } from './detailView';

export interface EdgeDetailViewProps extends BaseDetailViewProps {
  /** Fallback heading when the edge has no label. Default `'Edge'`. */
  title?: string;
  /**
   * Treat the edge as directed → the endpoints block shows a direction arrow.
   * Default `true`.
   */
  directed?: boolean;
}

/**
 * Resolve an endpoint node id to its display fields — drawn label
 * (`layer.resolveNodeStyle(node).labelText`, the same resolution
 * `useViewData` uses) and `type`. Falls back to the bare id when the node isn't
 * in the store.
 */
function resolveEndpoint(ctx: ViewContext, id: string | undefined): EdgeEndpoint | undefined {
  if (!id) return undefined;
  const node = ctx.store.getNode(id);
  if (!node) return { id };
  const style = ctx.layer.resolveNodeStyle(node);
  const label = (style.labelText as string | undefined) ?? '';
  const type = node.type as string | undefined;
  const color = toCssColor(style.bgFill);
  return {
    id,
    ...(label ? { label } : {}),
    ...(type ? { type } : {}),
    ...(color ? { color } : {}),
  };
}

/**
 * The default read-only detail **card** for an **edge** — the edge counterpart
 * of {@link NodeDetailView}. Beyond the Type / Label identity rows it resolves
 * the edge's **source and target nodes** (id · type · label, each title tinted
 * with the node's fill colour) and renders them as a directed
 * {@link EdgeEndpoints} block, then the edge's `data` via
 * {@link PropertyDetailView}. The card title is tinted with the edge's resolved
 * stroke colour.
 *
 * Like {@link NodeDetailView} it is bare content — wrap it in a `<PanelContent>`
 * (inside a `<Panel>`) for the surface, header, and close.
 */
export function EdgeDetailView({
  ctx,
  title = 'Edge',
  showId = true,
  directed = true,
  renderers,
  hints,
  className,
  style,
}: EdgeDetailViewProps) {
  // The heading is the edge's label (falling back to the kind). `id` and `type`
  // (predicate) are identity rows. No separate "Label" row — that's the heading now.
  const rows: DetailRow[] = [];
  if (showId) rows.push({ label: 'ID', value: ctx.id });
  if (ctx.type) rows.push({ label: 'Type', value: ctx.type });

  const source = resolveEndpoint(ctx, ctx.source);
  const target = resolveEndpoint(ctx, ctx.target);

  // Tint the title with the edge's resolved stroke colour.
  const titleColor = ctx.edge
    ? toCssColor(ctx.layer.resolveEdgeStyle(ctx.edge).strokeColor)
    : undefined;

  return (
    <DetailCard
      key={ctx.id}
      title={ctx.label || title}
      {...(titleColor ? { titleColor } : {})}
      rows={rows}
      {...(className !== undefined ? { className } : {})}
      {...(style !== undefined ? { style } : {})}
    >
      {source && target && <EdgeEndpoints source={source} target={target} directed={directed} />}
      <PropertyDetailView
        data={ctx.data}
        {...(renderers ? { renderers } : {})}
        {...(hints ? { hints } : {})}
      />
    </DetailCard>
  );
}
