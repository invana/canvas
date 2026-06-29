import type { ReactNode } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, Separator, cn } from '@invana/ui';

/**
 * Engine-agnostic, **presentational** preview cards — the visual content for a
 * hover preview. They take plain props (no engine types, no positioning, no
 * interactivity): a turnkey like `@invana/canvas-react`'s `<HoverElementPreviewBehaviour>`
 * owns the anchoring + hold-open wiring and renders one of these inside its
 * positioned shell, so the card itself is "simply UI".
 */

/** A labelled property row. */
export interface PreviewCardRow {
  label: string;
  value: string;
  /** Render the value monospaced (ids, hashes). */
  mono?: boolean;
}

function PreviewRow({ label, value, mono }: PreviewCardRow) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={cn('truncate text-right text-foreground', mono && 'font-mono')} title={value}>
        {value}
      </span>
    </div>
  );
}

// ─── Node card ────────────────────────────────────────────────────────────

export interface NodePreviewCardProps {
  /** Avatar / thumbnail URL. The image column is omitted when absent. */
  image?: string;
  /** Avatar size in px (inline, purge-proof). Default `40`. */
  imageSize?: number;
  /** Primary line (e.g. a display name). */
  title: string;
  /** Secondary line under the title — clamped to two lines. */
  subtitle?: string;
  /** Chips shown below the image + title block (e.g. labels / role). */
  tags?: readonly string[];
  /** Property rows below a divider. */
  rows?: readonly PreviewCardRow[];
  className?: string;
}

/**
 * Identity-style node card: image left, title + subtitle stacked on the right,
 * tags below, then property rows under a divider.
 */
export function NodePreviewCard({
  image,
  imageSize = 40,
  title,
  subtitle,
  tags,
  rows,
  className,
}: NodePreviewCardProps) {
  return (
    <Card className={cn('w-72 shadow-xl', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-start gap-3">
          {image ? (
            <img
              src={image}
              alt=""
              // Inline size — robust against prebuilt-CSS gaps (some `h-*/w-*`
              // utilities aren't in the shipped utilities sheet).
              style={{ width: imageSize, height: imageSize }}
              className="shrink-0 rounded-md bg-muted object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <div className="min-w-0">
            <CardTitle className="truncate text-base leading-tight">{title}</CardTitle>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardHeader>
      {rows && rows.length > 0 ? (
        <CardContent className="space-y-2">
          <Separator />
          {rows.map((r) => (
            <PreviewRow key={r.label} {...r} />
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}

// ─── Edge card ────────────────────────────────────────────────────────────

export interface EdgePreviewCardProps {
  /** Relationship label chip (e.g. the edge `type`). */
  badge?: string;
  /** Title — e.g. a `from → to` element. */
  title: ReactNode;
  /** Secondary description line. */
  subtitle?: string;
  /** Property rows below a divider. */
  rows?: readonly PreviewCardRow[];
  className?: string;
}

/** Relationship card: a type badge, a title, an optional description, then rows. */
export function EdgePreviewCard({ badge, title, subtitle, rows, className }: EdgePreviewCardProps) {
  return (
    <Card className={cn('w-72 shadow-xl', className)}>
      <CardHeader className="space-y-1.5">
        {badge ? <Badge className="w-fit font-mono text-[10px]">{badge}</Badge> : null}
        <CardTitle className="text-sm">{title}</CardTitle>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      {rows && rows.length > 0 ? (
        <CardContent className="space-y-2">
          <Separator />
          {rows.map((r) => (
            <PreviewRow key={r.label} {...r} />
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
