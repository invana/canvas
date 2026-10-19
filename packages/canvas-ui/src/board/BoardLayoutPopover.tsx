import { useEffect, useRef, useState } from 'react';
import { useCanvas } from '@invana/canvas-react';
import { FloatingPanel } from '@invana/ui';

import { useLayoutPresetCards } from '../control-panels/chromeWidgets';
import { LayoutPresetsViewPanel } from '../view-panels/layout-presets';

/**
 * Opens the Layout card at a point on the board: `run({ x, y })` in board px —
 * a menu's `ctx.screen`. Running it again, Esc, or a press outside closes it.
 */
export const BOARD_LAYOUT_COMMAND = 'board.layoutPresets';

/** The card's width, px — what a point near the right edge is held back by. */
const W = 340;

/**
 * The Layout card where it was asked for — the preset cards and their options,
 * the same `layout.preset` binding as the toolbar's popover, on the kit's
 * `FloatingPanel` at the pointer. Mount it once inside the canvas tree; the
 * board menu's *Layout…* runs {@link BOARD_LAYOUT_COMMAND} with the pointer.
 */
export function BoardLayoutPopover() {
  const canvas = useCanvas();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const card = useLayoutPresetCards(canvas);
  const ref = useRef<HTMLDivElement>(null);
  const open = useRef(at);
  open.current = at;

  useEffect(
    () =>
      canvas.commands.register(BOARD_LAYOUT_COMMAND, {
        label: 'Layout…',
        category: 'Layout',
        isActive: () => open.current !== null,
        run: (_c, args) => {
          const p = args as { x?: number; y?: number } | undefined;
          setAt(open.current ? null : { x: p?.x ?? 48, y: p?.y ?? 48 });
        },
      }),
    [canvas],
  );
  useEffect(() => canvas.commands.invalidate(), [canvas, at]);

  useEffect(() => {
    if (!at) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAt(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAt(null);
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [at]);

  if (!at) return null;
  const host = ref.current?.offsetParent as HTMLElement | null | undefined;
  const maxX = (host?.clientWidth ?? Number.POSITIVE_INFINITY) - W - 12;
  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute z-[8]"
      // Where the menu was opened, held inside the board.
      style={{ left: Math.max(12, Math.min(at.x, maxX)), top: Math.max(12, at.y), width: W }}
    >
      <FloatingPanel title="Layout" aside={card.label} onClose={() => setAt(null)}>
        <LayoutPresetsViewPanel
          value={card.value}
          presets={card.presets}
          onChange={card.onChange}
          {...(card.onRunAgain ? { onRunAgain: card.onRunAgain } : {})}
        />
      </FloatingPanel>
    </div>
  );
}
