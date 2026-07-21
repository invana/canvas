import { cn } from '@invana/ui';

import {
  resolvePropertyRenderer,
  renderPropertyValue,
  type PropertyRenderer,
} from './propertyRenderers';

export interface PropertyDetailViewProps {
  /**
   * The element's properties — the raw `data` map (values keep their original
   * type: number, string, array, object, …). Each entry is rendered by kind
   * through the renderer registry.
   */
  data?: Record<string, unknown>;
  /**
   * Extra renderers, tried **before** the built-ins, so a consumer can add a new
   * data type — or override one — with a single {@link PropertyRenderer} object.
   */
  renderers?: PropertyRenderer[];
  /**
   * Per-key kind hint. `hints[key] === renderer.kind` force-selects that
   * renderer for the key, beating the heuristics (e.g. force a numeric-looking
   * id to `'text'`, or an extension-less URL to `'image'`).
   */
  hints?: Record<string, string>;
  /** Section caption. Default `'Properties'`. Pass `''` to hide it. */
  title?: string;
  /** Shown when there are no entries. Default `'No properties.'`. */
  emptyText?: string;
  /** Class on the section wrapper. */
  className?: string;
}

/**
 * Dumb, engine-agnostic **properties block**: renders an element's `data` as a
 * list of rows where **each value is rendered by its kind** (number, image,
 * link, long text, tags, list, json, …) via the {@link PropertyRenderer}
 * registry. Scalar kinds render as inline label/value rows; block kinds (image,
 * json, …) stack a muted caption above a full-width value.
 *
 * Extensible by construction — pass `renderers` to add or override a data type;
 * see {@link resolvePropertyRenderer}. Holds no engine logic; the engine-aware
 * `NodeDetailView` / `EdgeDetailView` feed it `ctx.data`.
 */
export function PropertyDetailView({
  data,
  renderers,
  hints,
  title = 'Properties',
  emptyText = 'No properties.',
  className,
}: PropertyDetailViewProps) {
  const entries = Object.entries(data ?? {});
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {title && (
        // Full-bleed section bar: negative inline margins cancel the card's p-3
        // (the named `-mx-3` isn't in the prebuilt utility sheet), `px-3` keeps
        // the text aligned with the rows.
        <div
          className="bg-muted px-3 py-1 font-medium uppercase text-muted-foreground"
          style={{ marginLeft: '-10px', marginRight: '-10px' }}
        >
          {title}
        </div>
      )}
      {entries.length === 0 && <span className="text-xs text-muted-foreground">{emptyText}</span>}
      {entries.map(([key, value]) => {
        const hint = hints?.[key];
        const renderer = resolvePropertyRenderer(value, { name: key, ...(hint ? { hint } : {}) }, renderers);
        const content = renderPropertyValue(value, {
          name: key,
          ...(hint ? { hint } : {}),
          ...(renderers ? { renderers } : {}),
        });

        if ((renderer.layout ?? 'inline') === 'block') {
          return (
            <div key={key} className="flex flex-col gap-0.5 text-[13px]">
              <span className="break-words text-muted-foreground">{key}</span>
              <div className="min-w-0">{content}</div>
            </div>
          );
        }
        return (
          <div key={key} className="flex items-baseline gap-2 text-[13px]">
            <span className="shrink-0 grow-0 basis-[38%] break-words text-muted-foreground">
              {key}
            </span>
            <span className="min-w-0 flex-1 break-words">{content}</span>
          </div>
        );
      })}
    </div>
  );
}
