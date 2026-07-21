import type { CSSProperties, ReactNode } from 'react';
import { Badge, Button, cn } from '@invana/ui';

/** One fixed identity row in a {@link DetailCard} header, e.g. `Type`, `Label`, `Source`. */
export interface DetailRow {
  /** Caption shown on the left. */
  label: string;
  /** Value shown on the right. */
  value: string;
  /** Render the value in a monospace face (ids, etc.). Default `false`. */
  mono?: boolean;
}

export interface DetailCardProps {
  /** Heading, e.g. `'Node'` / `'Edge'`. */
  title?: string;
  /**
   * CSS color for the title text — typically the element's styling colour (a
   * node's fill / an edge's stroke), so the heading reads as "this element".
   */
  titleColor?: string;
  /** Muted sub-heading under the title — typically the element id. */
  subtitle?: string;
  /** Small chip beside the title — typically the element `type`. */
  badge?: string;
  /** Fixed identity rows shown under the header (e.g. Type, Label, Source, Target). */
  rows?: DetailRow[];
  /** When provided, renders a close (✕) button in the header. */
  onClose?: () => void;
  /**
   * Class on the card — the positioning / sizing / appearance surface. Merged
   * over the base card classes via `cn` (e.g. `dockCardClassName` turns it into
   * a full-height dock).
   */
  className?: string;
  /** Inline style on the card — the runtime-valued companion to {@link className}. */
  style?: CSSProperties;
  /** Body of the card — typically a `<PropertyDetailView>` (and, for edges, `<EdgeEndpoints>`). */
  children?: ReactNode;
}

/**
 * Dumb, engine-agnostic **content layout** for an element detail panel: title ·
 * type badge, id subtitle, fixed identity rows, then a body slot. It is **bare**
 * — no surface of its own (border / bg / shadow); wrap it in a
 * {@link PanelContent} (or any container) that provides the surface. The chrome
 * counterpart of the body component (`PropertyDetailView`). Chrome (`Badge`,
 * optional `Button`) comes from `@invana/ui`; everything else is design-kit tokens.
 */
export function DetailCard({
  title,
  titleColor,
  subtitle,
  badge,
  rows,
  onClose,
  className,
  style,
  children,
}: DetailCardProps) {
  return (
    <div
      className={cn('flex w-full flex-col gap-3 p-3', className)}
      {...(style !== undefined ? { style } : {})}
    >
      {(title || badge || onClose) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {title && (
              <span
                className="text-lg font-semibold"
                {...(titleColor ? { style: { color: titleColor } } : {})}
              >
                {title}
              </span>
            )}
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

      {children}
    </div>
  );
}
