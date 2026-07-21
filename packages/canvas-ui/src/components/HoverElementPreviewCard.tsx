import type { CSSProperties } from 'react';
import { Separator, cn } from '@invana/ui';
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
 * Only render an `<img src>` for an `https:` / `data:image/` URL. `card.imageUrl`
 * is resolved from node data (untrusted), so other schemes are rejected to avoid
 * tracking-pixel exfiltration and SSRF-style beaconing to attacker-controlled
 * hosts (an arbitrary `http://internal…` in an Electron packaging).
 */
function isSafeImageSrc(s: string): boolean {
  const t = s.trim();
  return /^data:image\//i.test(t) || /^https:\/\//i.test(t);
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
  const imageUrl = card.imageUrl && isSafeImageSrc(card.imageUrl) ? card.imageUrl : undefined;
  // The identity block (image / title / subtitle) is optional — `id` / `type`
  // live in the rows, so an element with none of these renders rows only.
  const hasIdentity = !!(imageUrl || card.title || card.subtitle);

  return (
    // Design-kit tokens + Tailwind utilities (`bg-card` / `text-card-foreground`
    // / `border` / `shadow-xl` / `w-72` / `p-3` / `rounded-[10px]`) — the same
    // chrome the other canvas-ui cards use.
    <div
      className={cn(
        'w-72 rounded-[10px] border bg-card p-3 text-card-foreground shadow-xl',
        className,
      )}
      style={style}
    >
      {/* Identity row — image left, title + subtitle right. Optional. */}
      {hasIdentity ? (
        <div className="flex items-start gap-2.5">
          {imageUrl ? (
            <img
              src={imageUrl}
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
          {hasIdentity ? <Separator className="my-2.5" /> : null}
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
