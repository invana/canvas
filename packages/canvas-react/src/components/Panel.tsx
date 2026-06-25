import type { CSSProperties, ReactNode } from 'react';

import type { PanelPosition } from './types';

export interface PanelProps {
  /** Corner / edge of the nearest positioned ancestor to pin to. Default `'top-left'`. */
  position?: PanelPosition;
  /** Stack direction for children. Default `'vertical'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Distance from the pinned edges, in px. Default `8`. */
  offset?: number;
  /** Gap between children, in px. Default `4`. */
  gap?: number;
  /** Stacking order, so the overlay sits above canvas content. Default `5`. */
  zIndex?: number;
  className?: string;
  /** Extra inline styles. See the positioning notes on {@link Panel}. */
  style?: CSSProperties;
  children?: ReactNode;
}

/** Translate a {@link PanelPosition} + offset into absolute-positioning styles. */
function pinStyle(position: PanelPosition, offset: number): CSSProperties {
  // Full-height side dock — flush to the edge, spanning top → bottom.
  if (position === 'left' || position === 'right') {
    return { position: 'absolute', top: offset, bottom: offset, [position]: offset };
  }
  const [vertical, horizontal] = position.split('-') as [
    'top' | 'bottom',
    'left' | 'center' | 'right',
  ];
  const style: CSSProperties = { position: 'absolute', [vertical]: offset };
  if (horizontal === 'center') {
    style.left = '50%';
    style.transform = 'translateX(-50%)';
  } else {
    style[horizontal] = offset;
  }
  return style;
}

/**
 * A positioned overlay container — the canvas equivalent of React Flow's
 * `<Panel>`. Pins itself to a corner / edge-centre of its **nearest positioned
 * ancestor** (e.g. the `<Canvas>` host, which is `position: relative`), and
 * stacks its children horizontally or vertically. It is a **pure positioner** —
 * it draws no surface and owns no header / close; wrap content in a
 * {@link PanelContent} for that chrome.
 *
 * Engine-agnostic and reference-free: it needs no `Canvas` instance — with
 * multiple canvases on one page you simply render one `<Panel>` inside each
 * `<Canvas>` and each pins to its own host.
 *
 * **Pointer events:** the absolutely-positioned root is `pointerEvents: 'none'`
 * so it never creates a dead zone over the canvas (a wide `top-center` panel
 * would otherwise block pan/zoom along that strip). Only the inner content
 * wrapper re-enables `pointerEvents: 'auto'`, so drags that miss the actual
 * controls still reach the canvas underneath.
 *
 * **Side docks (`position: 'left' | 'right'`):** the panel spans the full height
 * and the content wrapper fills it (a {@link PanelContent fill} child then owns
 * its own scroll). Here `style` is applied to the **positioner** (so
 * `style={{ top: 40, bottom: 25 }}` insets the dock below floating chrome); for
 * the other positions `style` lands on the content wrapper.
 */
export function Panel({
  position = 'top-left',
  orientation = 'vertical',
  offset = 8,
  gap = 4,
  zIndex = 5,
  className,
  style,
  children,
}: PanelProps) {
  const isSide = position === 'left' || position === 'right';
  return (
    <div
      style={{
        ...pinStyle(position, offset),
        zIndex,
        pointerEvents: 'none',
        ...(isSide && style ? style : {}),
      }}
    >
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          gap,
          pointerEvents: 'auto',
          // A side dock fills the available height; the child manages scroll.
          ...(isSide ? { height: '100%' } : {}),
          ...(isSide ? {} : style),
        }}
      >
        {children}
      </div>
    </div>
  );
}
