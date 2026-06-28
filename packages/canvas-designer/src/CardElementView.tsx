import type { CSSProperties, PointerEvent } from 'react';
import type { CardElement } from '@invana/graph';

import { previewColor } from './mapping';

export interface CardElementViewProps {
  el: CardElement;
  palette: Record<string, number>;
  /** Display text for a `text` element — the caller resolves bind / sample / placeholder. */
  text?: string;
  /** Draw a selection ring. */
  selected?: boolean;
  /** When provided, the element is interactive (draggable) and shows a move cursor. */
  onPointerDown?: (e: PointerEvent) => void;
}

/**
 * Renders one {@link CardElement} as an absolutely-positioned DOM node — the
 * shared visual used by both the designer's interactive canvas (pass
 * `onPointerDown` + `selected`) and the read-only {@link CardPreview}. Colours
 * resolve from the active theme palette so previews match the rendered graph.
 */
export function CardElementView({ el, palette, text = '', selected, onPointerDown }: CardElementViewProps) {
  const common: CSSProperties = {
    position: 'absolute',
    cursor: onPointerDown ? 'move' : 'default',
    boxShadow: selected ? '0 0 0 2px #3b82f6' : undefined,
  };

  if (el.type === 'text') {
    return (
      <div
        onPointerDown={onPointerDown}
        style={{
          ...common,
          left: el.x,
          top: el.y,
          fontSize: el.fontSize ?? 13,
          fontWeight: (el.fontWeight as number) ?? 400,
          color: previewColor(el.colorRole, el.color, palette, 0x111111),
          textTransform: el.uppercase ? 'uppercase' : 'none',
          whiteSpace: el.maxLines && el.maxLines > 1 ? 'normal' : 'nowrap',
          maxWidth: el.maxWidth || undefined,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: el.maxLines ?? 1,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {text || 'Text'}
      </div>
    );
  }
  if (el.type === 'rect') {
    return (
      <div
        onPointerDown={onPointerDown}
        style={{
          ...common,
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          borderRadius: el.cornerRadius ?? 0,
          background: previewColor(el.fillRole, el.fill, palette, 0x9ca3af),
        }}
      />
    );
  }
  if (el.type === 'circle') {
    return (
      <div
        onPointerDown={onPointerDown}
        style={{
          ...common,
          left: el.x,
          top: el.y,
          width: el.radius * 2,
          height: el.radius * 2,
          borderRadius: '50%',
          background: previewColor(el.fillRole, el.fill, palette, 0x9ca3af),
        }}
      />
    );
  }
  if (el.type === 'image') {
    // No image is fetched yet (avatar rendering is a separate feature), so show
    // the *binding* — the last segment of the path as `{avatar}` — when bound,
    // and a neutral `IMG` placeholder only when the slot is unbound.
    const slot = el.bind ? `{${el.bind.split('.').pop()}}` : 'IMG';
    return (
      <div
        onPointerDown={onPointerDown}
        style={{
          ...common,
          left: el.x,
          top: el.y,
          width: el.size,
          height: el.size,
          borderRadius: el.shape === 'rounded' ? 8 : '50%',
          background: previewColor('divider', undefined, palette, 0xcccccc),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: '#fff',
          overflow: 'hidden',
          padding: 2,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {slot}
        </span>
      </div>
    );
  }
  // line
  const dx = el.x2 - el.x;
  const dy = el.y2 - el.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        ...common,
        left: el.x,
        top: el.y,
        width: len,
        height: Math.max(el.strokeWidth ?? 1, 2),
        background: previewColor(el.colorRole, el.color, palette, 0xe2e8f0),
        transformOrigin: '0 0',
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}
