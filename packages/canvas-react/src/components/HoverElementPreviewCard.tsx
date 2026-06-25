import type { CSSProperties } from 'react';
import { cn } from '@invana/ui';
import type { ResolvedPreviewCard } from '@invana/graph';

export interface HoverElementPreviewCardProps {
  /** The resolved, render-ready card (from `preview:show` / {@link useHoverElementPreviewBehaviour}). */
  card: ResolvedPreviewCard;
  /** Extra classes merged onto the card surface. */
  className?: string;
  /** Extra inline style merged onto the card surface. */
  style?: CSSProperties;
}

/**
 * Dumb, data-driven preview card — the **default content** for
 * `HoverElementPreviewBehaviour`. Identity-card layout: image (left) / title +
 * subtitle (right) → property rows (`id` / `type` first, auto) below a divider.
 * The image column collapses when absent; the subtitle clamps to
 * `card.subtitleMaxLines`.
 *
 * **Purely presentational** — it does no positioning and no hover/hold wiring.
 * The turnkey {@link HoverElementPreviewBehaviour} owns the anchoring (measure → flip → clamp)
 * and the interactive hold-open behaviour, rendering this card inside its
 * positioned shell. So the card is "simply UI": props-in, engine-agnostic (only
 * the resolved-card *type* is imported).
 */
export function HoverElementPreviewCard({ card, className, style }: HoverElementPreviewCardProps) {
  // The identity block (image / title / subtitle) is optional — `id` / `type`
  // live in the rows, so an element with none of these renders rows only.
  const hasIdentity = !!(card.imageUrl || card.title || card.subtitle);

  return (
    // Use design-kit tokens that ship in the prebuilt utilities sheet
    // (`bg-card` / `text-card-foreground` / `border` / `shadow-xl` / `w-72` —
    // the same chrome the canvas-ui cards use). The previous `bg-popover/95` +
    // `backdrop-blur-sm` weren't in the sheet, so the surface rendered
    // transparent. Padding / radius are inlined (purge-proof, structural).
    <div
      className={cn('w-72 border bg-card text-card-foreground shadow-xl', className)}
      style={{ padding: 12, borderRadius: 10, ...style }}
    >
      {/* Identity row — image left, title + subtitle right. Optional. */}
      {hasIdentity ? (
        <div className="flex items-start gap-2.5">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt=""
              className={cn(
                'h-12 w-12 shrink-0 bg-muted object-cover',
                card.imageShape === 'circle' ? 'rounded-full' : 'rounded-md',
              )}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            {card.title ? (
              <div className="text-sm font-semibold text-foreground">{card.title}</div>
            ) : null}
            {card.subtitle ? (
              <div
                className="mt-0.5 overflow-hidden text-xs text-muted-foreground"
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: card.subtitleMaxLines,
                }}
              >
                {card.subtitle}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Property rows — `id` / `type` first (auto), then the spec rows. The
          divider only shows when there's an identity block above. */}
      {card.rows.length > 0 ? (
        <>
          {hasIdentity ? (
            <div style={{ height: 1, margin: '10px 0', background: 'hsl(var(--border))' }} />
          ) : null}
          <div className="flex flex-col gap-0.5">
            {card.rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-3 text-xs">
                <span className="shrink-0 text-muted-foreground">{row.label}</span>
                <span className="truncate text-right text-foreground" title={row.value}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
