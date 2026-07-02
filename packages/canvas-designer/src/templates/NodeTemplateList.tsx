import type { CSSProperties } from 'react';
import { Button } from '@invana/ui';
import type { FreeformStructure } from '@invana/graph';

import { CardPreview } from './CardPreview';

/** One node type + the template it renders with, for the list. */
export interface NodeTemplateItem {
  /** Node type / label (e.g. `'Tweet'`). */
  type: string;
  /** The card template for this type. */
  template: FreeformStructure;
  /** A representative node (`{ type, data }`) to make the thumbnail realistic. */
  sample?: Record<string, unknown>;
}

export interface NodeTemplateListProps {
  items: NodeTemplateItem[];
  /** Active role → hex palette for the thumbnails. */
  palette?: Record<string, number>;
  /** Fired with the node type when its **Edit** is clicked. */
  onEdit: (type: string) => void;
  /** Thumbnail box size. Default `{ w: 168, h: 100 }`. */
  thumb?: { w: number; h: number };
}

/**
 * A list of node types, each with a live **thumbnail** of its card template and
 * an **Edit** action — the entry point to the {@link NodeCardDesigner}. The host
 * owns the templates and opens the editor on `onEdit(type)`. Engine-agnostic
 * (renders via {@link CardPreview}); produces no side effects of its own.
 */
export function NodeTemplateList({
  items,
  palette = {},
  onEdit,
  thumb = { w: 168, h: 100 },
}: NodeTemplateListProps) {
  return (
    <div style={listStyle}>
      {items.map((it) => {
        const scale = Math.min(thumb.w / it.template.width, thumb.h / it.template.height, 1);
        return (
          <div key={it.type} style={rowStyle}>
            <div style={{ ...thumbStyle, width: thumb.w, height: thumb.h }}>
              <CardPreview template={it.template} palette={palette} sample={it.sample} scale={scale} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{it.type}</div>
              <div style={metaStyle}>
                {it.template.name} · {it.template.elements.length} elements
              </div>
            </div>
            <Button variant="outline" onClick={() => onEdit(it.type)}>
              Edit
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
const listStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: 12 };
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 8,
  border: '1px solid var(--border, #e4e4e7)',
  borderRadius: 8,
};
const thumbStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  flex: 'none',
  borderRadius: 6,
  background: 'var(--muted, #f4f4f5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const metaStyle: CSSProperties = {
  fontSize: 11,
  opacity: 0.6,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
