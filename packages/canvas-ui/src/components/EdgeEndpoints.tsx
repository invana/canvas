import { Badge } from '@invana/ui';

/** One resolved edge endpoint — the source or target node's display fields. */
export interface EdgeEndpoint {
  /** Node id. Always present (falls back to the raw id when the node is missing). */
  id: string;
  /** The node's free-form `type` tag, when set. */
  type?: string;
  /** The node's drawn label text, when set. */
  label?: string;
  /** CSS color from the node's styling (its fill) — tints the endpoint title. */
  color?: string;
}

export interface EdgeEndpointsProps {
  /** The edge's source node. */
  source: EdgeEndpoint;
  /** The edge's target node. */
  target: EdgeEndpoint;
  /** Directed edge → show a direction arrow between endpoints. Default `true`. */
  directed?: boolean;
}

function Endpoint({ role, ep }: { role: string; ep: EdgeEndpoint }) {
  const colorStyle = ep.color ? { style: { color: ep.color } } : {};
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{role}</span>
      {(ep.label || ep.type) && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Endpoint title tinted with the node's styling colour. */}
          {ep.label && (
            <span className="text-[13px] font-medium" {...colorStyle}>
              {ep.label}
            </span>
          )}
          {ep.type && (
            <Badge variant="secondary" className="text-[11px]">
              {ep.type}
            </Badge>
          )}
        </div>
      )}
      <span
        className="break-all font-mono text-xs text-muted-foreground"
        {...(!ep.label && ep.color ? { style: { color: ep.color } } : {})}
      >
        {ep.id}
      </span>
    </div>
  );
}

/**
 * Dumb, engine-agnostic **connection block** for an edge: its source and target
 * nodes (each id · type · label) with a direction indicator between them. The
 * engine-aware `EdgeDetailView` resolves the endpoint nodes (`store.getNode` +
 * `layer.resolveNodeStyle`) and hands this component plain strings, so it stays
 * presentational.
 */
export function EdgeEndpoints({ source, target, directed = true }: EdgeEndpointsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Endpoint role="Source" ep={source} />
      <div
        className="text-base leading-none text-muted-foreground"
        aria-label={directed ? 'points to' : 'connected to'}
      >
        {directed ? '↓' : '|'}
      </div>
      <Endpoint role="Target" ep={target} />
    </div>
  );
}
