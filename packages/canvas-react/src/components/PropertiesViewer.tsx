import type { CSSProperties } from 'react';
import { Badge, Button, cn } from '@invana/ui';

/** One fixed top-of-card row, e.g. `Label`, `Source`, `Target`. */
export interface PropertiesViewerRow {
  /** Caption shown on the left. */
  label: string;
  /** Value shown on the right. */
  value: string;
  /** Render the value in a monospace face (ids, etc.). Default `false`. */
  mono?: boolean;
}

export interface PropertiesViewerProps {
  /** Heading, e.g. `'Node'` / `'Edge'`. */
  title?: string;
  /** Muted sub-heading under the title — typically the element id. */
  subtitle?: string;
  /** Small chip beside the title — typically the element `type`. */
  badge?: string;
  /** Fixed rows shown above the properties list (e.g. label, source, target). */
  rows?: PropertiesViewerRow[];
  /** Arbitrary key/value metadata (the element's `data`). */
  data?: Record<string, string>;
  /** Shown when there are no `data` entries. Default `'No properties.'`. */
  emptyText?: string;
  /** When provided, renders a close (✕) button in the header. */
  onClose?: () => void;
  /**
   * Class on the card — the positioning / sizing / appearance surface. Merged
   * over the base card classes via `cn` (so e.g. `h-full rounded-none
   * overflow-y-auto` turns it into a full-height dock).
   */
  className?: string;
  /**
   * Inline style on the card — the runtime-valued companion to {@link className}.
   * Use it for placement values a utility class can't express statically, e.g.
   * insetting a dock below floating chrome (`{ top: 40, bottom: 25 }`).
   */
  style?: CSSProperties;
}

/**
 * Dumb, engine-agnostic, **read-only** viewer for an element's identity +
 * key/value properties — the display counterpart of {@link PropertiesEditor}
 * (no inputs, no Apply, no commit). Props in; it only renders.
 *
 * It holds **no** engine / layer logic — the consumer (see
 * {@link ElementDetailViewer}) resolves the element to `{ title, subtitle,
 * badge, rows, data }` and hands it over. Chrome (`Badge`, optional close
 * `Button`) comes from `@invana/ui`; everything else is design-kit Tailwind
 * tokens, mirroring `PropertiesEditor`.
 */
export function PropertiesViewer({
  title,
  subtitle,
  badge,
  rows,
  data,
  emptyText = 'No properties.',
  onClose,
  className,
  style,
}: PropertiesViewerProps) {
  const entries = Object.entries(data ?? {});
  return (
    <div
      className={cn(
        'flex min-w-[240px] max-w-80 flex-col gap-3 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg',
        className,
      )}
      {...(style !== undefined ? { style } : {})}
    >
      {(title || badge || onClose) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {title && <span className="text-[13px] font-semibold">{title}</span>}
            {badge && (
              <Badge variant="secondary" className="text-[11px]">
                {badge}
              </Badge>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      )}

      {subtitle && (
        <div className="-mt-1.5 break-all font-mono text-xs text-muted-foreground">{subtitle}</div>
      )}

      {rows && rows.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline gap-2 text-[13px]">
              <span className="shrink-0 grow-0 basis-[38%] break-words text-muted-foreground">
                {row.label}
              </span>
              <span className={cn('flex-1 break-words', row.mono && 'font-mono text-xs')}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Properties</span>
        {entries.length === 0 && <span className="text-xs text-muted-foreground">{emptyText}</span>}
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-2 text-[13px]">
            <span className="shrink-0 grow-0 basis-[38%] break-words text-muted-foreground">{k}</span>
            <span className="flex-1 break-words">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
