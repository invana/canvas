import type { CSSProperties, ReactNode } from 'react';
import { Button, cn } from '@invana/ui';

export interface PanelContentProps {
  /**
   * Header content shown in the header bar (left), beside the close ✕. When this
   * and {@link onClose} are both omitted, no header bar is rendered.
   */
  header?: ReactNode;
  /** When provided, the header bar renders a close ✕ wired to this callback. */
  onClose?: () => void;
  /**
   * Stretch to the full height of the parent (e.g. a side-dock `<Panel>`), with
   * the body scrolling. Default `false` (height fits the content). When `true`
   * the surface is squared off (`rounded-none`) for a flush dock edge.
   */
  fill?: boolean;
  /**
   * Surface width, in px (number) or any CSS length (string). Applied as an
   * inline style so it's reliable regardless of the Tailwind utility sheet
   * (arbitrary `w-[…]` classes may be purged). Defaults to `320` when {@link fill}
   * is set (a side dock needs an explicit width — it can't size to content).
   */
  width?: number | string;
  /** Classes merged onto the surface. */
  className?: string;
  /** Inline styles on the surface. */
  style?: CSSProperties;
  /** Body content — typically a bare `<NodeDetailView>` / `<EdgeDetailView>`. */
  children?: ReactNode;
}

/**
 * The **styled surface** for panel content: a bordered, elevated card with an
 * optional header bar (title + close ✕) above a scrollable body. Drop it inside
 * a {@link Panel} (which positions it) and put bare content — e.g. a
 * `<NodeDetailView>` — in the body:
 *
 * ```tsx
 * <Panel position="right">
 *   <PanelContent header="Node" onClose={ctx.close} fill>
 *     <NodeDetailView ctx={ctx} />
 *   </PanelContent>
 * </Panel>
 * ```
 *
 * Surface + chrome live here; the view stays pure content. Engine-agnostic; uses
 * `@invana/ui` chrome (`Button`) + design-kit tokens.
 */
export function PanelContent({
  header,
  onClose,
  fill = false,
  width,
  className,
  style,
  children,
}: PanelContentProps) {
  const hasHeader = header !== undefined || onClose !== undefined;
  // A side dock can't size to content, so default it to a usable width. Inline
  // style (not a Tailwind class) so it survives utility-sheet purging.
  const resolvedWidth = width ?? (fill ? 320 : undefined);
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg',
        fill ? 'h-full rounded-none' : 'max-w-80 rounded-lg',
        className,
      )}
      style={{ ...(resolvedWidth !== undefined ? { width: resolvedWidth } : {}), ...style }}
    >
      {hasHeader && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 truncate text-[13px] font-semibold">{header}</div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={onClose}
              className="-mr-1 shrink-0"
            >
              ✕
            </Button>
          )}
        </div>
      )}
      <div className={cn('min-h-0', fill ? 'flex-1 overflow-y-auto' : 'overflow-y-auto')}>
        {children}
      </div>
    </div>
  );
}
