import type { CSSProperties } from 'react';
import type { Canvas } from '@invana/canvas';

import { useCanvasMessage } from '@invana/canvas-react';
import type { ToolbarIcon } from './types';

export interface CanvasMessageBarProps {
  /** Optional leading glyph (consumer-supplied, e.g. a `lucide-react` `Info`). */
  icon?: ToolbarIcon;
  /** Explicit canvas instance; defaults to the context canvas (works from footer chrome). */
  canvas?: Canvas | null;
  className?: string;
  style?: CSSProperties;
}

/**
 * The shared message line — drop it into a footer / status strip. Reads the
 * canvas message channel ({@link useCanvasMessage}) and renders the current
 * message, or nothing when idle. Anything emits via `Canvas.showMessage` (a
 * layout's start/end, a behaviour, app code); this just displays the latest.
 * Self-wiring: resolves the engine from the (lifted) `CanvasContext` or an
 * explicit `canvas` prop.
 */
export function CanvasMessageBar({ icon: Icon, canvas, className, style }: CanvasMessageBarProps) {
  const { message } = useCanvasMessage(canvas);
  if (message === null) return null;

  return (
    <div style={{ ...rowStyle, ...style }} className={className}>
      {Icon ? <Icon size={13} /> : null}
      <span>{message}</span>
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  opacity: 0.8,
  whiteSpace: 'nowrap',
};
