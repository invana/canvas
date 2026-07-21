import { useState, type CSSProperties, type ReactNode } from 'react';
import { Badge, Button } from '@invana/ui';

/**
 * The built-in property kinds. The registry is open — a custom
 * {@link PropertyRenderer} may use any `kind` string; these are just the ones
 * {@link defaultPropertyRenderers} ships. `kind` doubles as the **hint** string
 * that force-selects a renderer (see {@link resolvePropertyRenderer}).
 */
export type PropertyKind =
  | 'number'
  | 'image'
  | 'url'
  | 'longtext'
  | 'tags'
  | 'list'
  | 'json'
  | 'text';

/**
 * Everything a {@link PropertyRenderer} needs to draw one property value.
 * `renderValue` recurses back through the registry — `list` items and `json`
 * values use it so nested links / numbers / objects render correctly.
 */
export interface PropertyRenderContext {
  /** Property key. Enables name-based matching (e.g. `name === 'avatar'` → image). */
  name: string;
  /** Raw value — never pre-stringified, so arrays/objects/numbers keep their type. */
  value: unknown;
  /** Explicit kind hint for this key, if the consumer supplied one. */
  hint?: string;
  /** Recursion depth. `0` at the top level; `list`/`json` increment it. */
  depth: number;
  /** Render a nested value back through the registry (depth is auto-incremented). */
  renderValue: (value: unknown, opts?: { name?: string; hint?: string }) => ReactNode;
}

/**
 * A self-contained ability to render one data type. Detection (`match`) and
 * rendering (`render`) live together, so **adding a new data type is a single
 * object** passed via the `renderers` prop of {@link PropertyDetailView} /
 * `NodeDetailView` / `EdgeDetailView` — no core edit.
 */
export interface PropertyRenderer {
  /** Unique kind id. Also the hint string that force-selects this renderer. */
  kind: string;
  /**
   * Claim this value? The first matching renderer wins, with consumer-supplied
   * renderers tried **before** the defaults (so a built-in kind can be
   * overridden). The built-in `text` renderer matches everything and is last.
   */
  match: (value: unknown, ctx: { name: string; hint?: string }) => boolean;
  /**
   * `'inline'` — a label-left / value-right row (scalars). `'block'` — a muted
   * label caption above a full-width value (images, json, …). Default `'inline'`.
   */
  layout?: 'inline' | 'block';
  /** Draw the value. Return a component instance when you need hooks (expand state, `onError`). */
  render: (ctx: PropertyRenderContext) => ReactNode;
}

// ─── Tunables (documented module constants) ────────────────────────────────
/** A string longer than this (or containing a newline) renders as `longtext`. */
const LONG_TEXT_THRESHOLD = 140;
/** An array of primitives renders as `tags` only when every string item is this short. */
const TAG_MAX_LEN = 24;
/** `tags` / `list` render at most this many items, then a `+N more` line. */
const LIST_ITEM_CAP = 50;
/** `json` recurses to this depth, then falls back to a `<pre>` of pretty JSON. */
const MAX_DEPTH = 2;
/** Collapsed `longtext` clamps to this many lines. */
const CLAMP_LINES = 3;

// ─── Detection helpers ──────────────────────────────────────────────────────

/** A plain `{}`-style object (not an array, not a class instance). */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

/** A string / number / boolean — the things that render as a tag chip. */
function isPrimitive(v: unknown): v is string | number | boolean {
  const t = typeof v;
  return t === 'string' || t === 'number' || t === 'boolean';
}

/**
 * Is `s` a link we're willing to make clickable? Scheme allow-list only —
 * `http(s)` / `file` / `mailto` / protocol-relative `//`. Everything else
 * (notably `javascript:`) is rejected so it falls through to plain text.
 */
export function isSafeHref(s: string): boolean {
  const t = s.trim();
  if (t.startsWith('//')) return true;
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(t);
  if (!m) return false;
  return ['http', 'https', 'file', 'mailto'].includes(m[1]!.toLowerCase());
}

/**
 * Is `s` something we can drop into an `<img src>`? A `data:image/…` URI, or a
 * safe URL ending in a known image extension. A bare `"photo.png"` (no scheme)
 * is **not** treated as an image — it would 404 — and renders as text instead.
 */
export function isImageUrl(s: string): boolean {
  const t = s.trim();
  if (/^data:image\//i.test(t)) return true;
  return isSafeHref(t) && /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(t);
}

// ─── Value components (own their hooks: expand state, image fallback) ────────

function NumberValue({ value }: { value: number }): ReactNode {
  return <span className="block w-full text-right font-mono tabular-nums">{String(value)}</span>;
}

function LinkValue({ href }: { href: string }): ReactNode {
  // Re-validate the scheme here, not just at renderer selection: the `hint`
  // path (resolvePropertyRenderer) can force-select the `url` renderer without
  // running its `match` (= isSafeHref), so an attacker-controlled
  // `javascript:` value in node data could otherwise reach `href`. React does
  // not block dangerous href schemes at runtime — fall back to plain text.
  if (!isSafeHref(href)) return <span className="break-all">{href}</span>;
  const external = /^https?:/i.test(href.trim());
  return (
    <a
      href={href}
      {...(external ? { target: '_blank' } : {})}
      rel="noopener noreferrer"
      className="break-all text-primary hover:underline"
    >
      {href}
      {external ? ' ↗' : ''}
    </a>
  );
}

function ImageValue({ url }: { url: string }): ReactNode {
  // Defensive re-check for the `image` hint path (mirrors LinkValue): only emit
  // an <img src>/<a href> for a validated image URL; otherwise render as text
  // so a non-image / unsafe-scheme value can't beacon or open a bad link.
  if (!isImageUrl(url)) return <span className="break-all">{url}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt=""
        loading="lazy"
        className="max-h-40 w-full rounded-md border border-border object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </a>
  );
}

const TOGGLE_CLASS = 'h-auto p-0 text-xs font-normal text-primary';

function LongTextValue({ text }: { text: string }): ReactNode {
  const [open, setOpen] = useState(false);
  const clampStyle: CSSProperties | undefined = open
    ? undefined
    : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: CLAMP_LINES };
  return (
    <div>
      <div className="overflow-hidden whitespace-pre-wrap break-words" style={clampStyle}>
        {text}
      </div>
      <Button variant="link" size="sm" className={TOGGLE_CLASS} onClick={() => setOpen((o) => !o)}>
        {open ? 'Show less' : 'Show more'}
      </Button>
    </div>
  );
}

function TagList({ items }: { items: readonly unknown[] }): ReactNode {
  const shown = items.slice(0, LIST_ITEM_CAP);
  const extra = items.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((t, i) => (
        <Badge key={i} variant="secondary" className="text-[11px]">
          {String(t)}
        </Badge>
      ))}
      {extra > 0 && <span className="text-xs text-muted-foreground">+{extra} more</span>}
    </div>
  );
}

function ListValue({
  items,
  renderValue,
}: {
  items: readonly unknown[];
  renderValue: PropertyRenderContext['renderValue'];
}): ReactNode {
  const shown = items.slice(0, LIST_ITEM_CAP);
  const extra = items.length - shown.length;
  return (
    <div className="flex flex-col gap-1">
      {shown.map((it, i) => (
        <div key={i} className="flex gap-1.5">
          <span className="select-none text-muted-foreground">•</span>
          <span className="min-w-0 flex-1 break-words">{renderValue(it, { name: `[${i}]` })}</span>
        </div>
      ))}
      {extra > 0 && <span className="text-xs text-muted-foreground">+{extra} more</span>}
    </div>
  );
}

function JsonValue({
  value,
  depth,
  renderValue,
}: {
  value: Record<string, unknown>;
  depth: number;
  renderValue: PropertyRenderContext['renderValue'];
}): ReactNode {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(value);

  // Too deep to keep nesting readable — dump compact pretty JSON instead.
  if (depth >= MAX_DEPTH) {
    return (
      <pre className="overflow-x-auto rounded-md bg-muted/50 p-2 text-[11px] leading-snug">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <div>
      <Button variant="link" size="sm" className={TOGGLE_CLASS} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide' : `{ ${entries.length} ${entries.length === 1 ? 'key' : 'keys'} }`}
      </Button>
      {open && (
        <div className="mt-1 flex flex-col gap-1.5 border-l border-border pl-2">
          {entries.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="break-words">{renderValue(v, { name: k })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── The default renderer set (tried in order; `text` is the catch-all) ──────

/**
 * The built-in renderers, in resolution order. Consumer-supplied renderers are
 * tried before these (so any kind can be overridden). The final `text` renderer
 * matches everything, so resolution never fails.
 */
export const defaultPropertyRenderers: readonly PropertyRenderer[] = [
  {
    kind: 'number',
    layout: 'inline',
    match: (v) => typeof v === 'number' && Number.isFinite(v),
    render: ({ value }) => <NumberValue value={value as number} />,
  },
  {
    kind: 'image',
    layout: 'block',
    match: (v) => typeof v === 'string' && isImageUrl(v),
    render: ({ value }) => <ImageValue url={value as string} />,
  },
  {
    kind: 'url',
    layout: 'inline',
    match: (v) => typeof v === 'string' && isSafeHref(v),
    render: ({ value }) => <LinkValue href={value as string} />,
  },
  {
    kind: 'longtext',
    layout: 'block',
    match: (v) => typeof v === 'string' && (v.length > LONG_TEXT_THRESHOLD || v.includes('\n')),
    render: ({ value }) => <LongTextValue text={value as string} />,
  },
  {
    kind: 'tags',
    layout: 'block',
    match: (v) =>
      Array.isArray(v) &&
      v.length > 0 &&
      v.every((it) => isPrimitive(it) && (typeof it !== 'string' || it.length <= TAG_MAX_LEN)),
    render: ({ value }) => <TagList items={value as unknown[]} />,
  },
  {
    kind: 'list',
    layout: 'block',
    match: (v) => Array.isArray(v),
    render: ({ value, renderValue }) => (
      <ListValue items={value as unknown[]} renderValue={renderValue} />
    ),
  },
  {
    kind: 'json',
    layout: 'block',
    match: (v) => isPlainObject(v),
    render: ({ value, depth, renderValue }) => (
      <JsonValue value={value as Record<string, unknown>} depth={depth} renderValue={renderValue} />
    ),
  },
  {
    kind: 'text',
    layout: 'inline',
    match: () => true,
    render: ({ value }) => (
      <span className="break-words">
        {typeof value === 'boolean' ? String(value) : (value as string)}
      </span>
    ),
  },
];

const TEXT_RENDERER = defaultPropertyRenderers[defaultPropertyRenderers.length - 1]!;

/**
 * Pick the renderer for a value: consumer `custom` renderers first, then the
 * {@link defaultPropertyRenderers}. A `hint` matching some renderer's `kind`
 * force-selects it (beating heuristics); otherwise the first `match` wins.
 * Always resolves — falls back to the `text` renderer.
 */
export function resolvePropertyRenderer(
  value: unknown,
  ctx: { name: string; hint?: string },
  custom?: readonly PropertyRenderer[],
): PropertyRenderer {
  const all =
    custom && custom.length ? [...custom, ...defaultPropertyRenderers] : defaultPropertyRenderers;
  if (ctx.hint) {
    const forced = all.find((r) => r.kind === ctx.hint);
    if (forced) return forced;
  }
  return all.find((r) => r.match(value, ctx)) ?? TEXT_RENDERER;
}

/**
 * Resolve and render one value through the registry, wiring up the recursive
 * `renderValue` closure (used internally by {@link PropertyDetailView} and by
 * `list` / `json` renderers). Returns the rendered node only — layout wrapping
 * is the caller's (it reads {@link resolvePropertyRenderer}'s `layout`).
 */
export function renderPropertyValue(
  value: unknown,
  opts: { name: string; hint?: string; depth?: number; renderers?: readonly PropertyRenderer[] },
): ReactNode {
  const { name, hint, depth = 0, renderers } = opts;
  const renderer = resolvePropertyRenderer(value, { name, hint }, renderers);
  return renderer.render({
    name,
    value,
    ...(hint !== undefined ? { hint } : {}),
    depth,
    renderValue: (v, o) =>
      renderPropertyValue(v, {
        name: o?.name ?? name,
        ...(o?.hint !== undefined ? { hint: o.hint } : {}),
        depth: depth + 1,
        ...(renderers ? { renderers } : {}),
      }),
  });
}
