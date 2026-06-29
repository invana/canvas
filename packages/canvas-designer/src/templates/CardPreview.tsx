import type { CSSProperties } from 'react';
import type { FreeformStructure } from '@invana/graph';

import { CardElementView } from './CardElementView';
import { previewColor } from './mapping';

export interface CardPreviewProps {
  /** The template to render (read-only). */
  template: FreeformStructure;
  /** Active role → hex palette, so the preview matches the rendered graph. */
  palette?: Record<string, number>;
  /**
   * Sample node (e.g. `{ type, data }`) used to resolve each element's `bind`
   * path to a real value. Without it, bound text shows the dotted path.
   */
  sample?: Record<string, unknown>;
  /** Uniform scale (e.g. to fit a thumbnail). Default `1`. */
  scale?: number;
}

/** Read a dotted path off a sample object (`data.name` → `sample.data.name`). */
function readPath(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined;
  let cur: unknown = obj;
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/**
 * Read-only render of a {@link FreeformStructure} — the same element visuals as
 * the designer canvas (via {@link CardElementView}), but non-interactive and
 * optionally scaled. Bound text resolves against `sample`. Used for the layer
 * thumbnails in {@link NodeTemplateList} and any standalone template preview.
 */
export function CardPreview({ template, palette = {}, sample, scale = 1 }: CardPreviewProps) {
  const text = (bind?: string, fallback?: string): string => {
    if (bind) {
      const v = readPath(sample, bind);
      if (v != null) return String(v);
      return `{${bind}}`;
    }
    return fallback ?? '';
  };

  // The scaled card keeps its full layout size and is shrunk visually; the
  // outer frame is sized to the *scaled* footprint so it occupies the right box
  // (a CSS transform doesn't change layout size, so the frame must do it).
  const frame: CSSProperties = {
    position: 'relative',
    width: template.width * scale,
    height: template.height * scale,
    flex: 'none',
    overflow: 'hidden',
  };
  const card: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: template.width,
    height: template.height,
    borderRadius: template.cornerRadius ?? 10,
    background: previewColor(template.bgRole, template.bg, palette, 0xffffff),
    overflow: 'hidden',
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: 'top left',
  };

  return (
    <div style={frame}>
      <div style={card}>
        {template.elements.map((el) =>
          el.hidden ? null : (
            <CardElementView
              key={el.id}
              el={el}
              palette={palette}
              text={el.type === 'text' ? text(el.bind, el.text) : ''}
            />
          ),
        )}
      </div>
    </div>
  );
}
