import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
/** The least gap kept between the card and the board's edge, px. */
const EDGE = 12;

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

  // Where the menu was opened, held inside the board on every side — measured
  // once the card is drawn, so its height is known.
  const [place, setPlace] = useState<{ left: number; top: number; maxHeight?: number } | null>(null);
  useLayoutEffect(() => {
    if (!at) return setPlace(null);
    const el = ref.current;
    const host = el?.offsetParent as HTMLElement | null | undefined;
    if (!el || !host) return setPlace({ left: at.x, top: at.y });
    const left = Math.max(EDGE, Math.min(at.x, host.clientWidth - W - EDGE));
    const top = Math.max(EDGE, Math.min(at.y, host.clientHeight - el.offsetHeight - EDGE));
    // A board shorter than the card scrolls the card.
    setPlace({ left, top, maxHeight: host.clientHeight - 2 * EDGE });
  }, [at, card.label]);

  if (!at) return null;
  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute z-[8]"
      style={{
        left: place?.left ?? at.x,
        top: place?.top ?? at.y,
        width: W,
        ...(place?.maxHeight ? { maxHeight: place.maxHeight, overflowY: 'auto' as const } : {}),
        // Hidden for the one layout pass before it is placed.
        visibility: place ? 'visible' : 'hidden',
      }}
    >
      <FloatingPanel
        title="Layout"
        {...(card.label && card.label !== 'Layout' ? { aside: card.label } : {})}
        onClose={() => setAt(null)}
      >
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
