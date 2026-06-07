import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import type { ToolbarIcon } from './types';

/**
 * Canonical gesture copy per select-mode key. These describe **library**
 * gestures (brush / lasso both arm a *Shift + drag*), so the copy lives here
 * rather than being re-invented per app. Override or extend via
 * {@link GraphHintBarProps.hints} — your map is merged over these.
 */
export const DEFAULT_GRAPH_HINTS: Record<string, string> = {
  click: 'Click a node or edge to select',
  brush: 'Hold Shift + drag to select nodes & edges',
  lasso: 'Hold Shift + drag a lasso around nodes & edges',
};

/**
 * Canonical copy for the magnet (neighbour-highlight) toggle. Shown as a
 * standalone message **only when the user toggles it**. `on` ≈ hover degree 1
 * (light up neighbours); `off` ≈ degree 0 (only the hovered node). Override via
 * {@link GraphHintBarProps.magnetHints}.
 */
export const DEFAULT_MAGNET_HINTS: { on: string; off: string } = {
  on: 'Hover a node to highlight its neighbours',
  off: 'Hover highlights only the node',
};

export interface GraphHintBarProps {
  /**
   * Active select-mode key (the picker keys, e.g. `'click'` / `'brush'` /
   * `'lasso'`). Switching it shows that mode's gesture hint; its current value
   * also seeds the idle message on mount.
   */
  mode?: string;
  /**
   * Magnet (neighbour-highlight) on/off. Toggling it shows the matching
   * {@link DEFAULT_MAGNET_HINTS} message; the initial value is **not** shown
   * (the idle message is the mode hint), so highlight copy appears only on a
   * deliberate toggle.
   */
  magnet?: boolean;
  /** Key used for the idle message when {@link GraphHintBarProps.mode} is undefined. Default `'click'`. */
  defaultMode?: string;
  /** Per-mode copy overrides, merged over {@link DEFAULT_GRAPH_HINTS}. */
  hints?: Record<string, string>;
  /** Magnet on/off copy override. Default {@link DEFAULT_MAGNET_HINTS}. */
  magnetHints?: { on: string; off: string };
  /** Optional leading glyph (consumer-supplied, e.g. a `lucide-react` `Info`). */
  icon?: ToolbarIcon;
  className?: string;
  style?: CSSProperties;
}

/**
 * A persistent, read-only **guidance line** — drop it into a footer / status bar
 * to teach the gesture for the user's most recent action. Unlike a toast it
 * stays put, and it shows **exactly one message at a time** (*last action wins*):
 * switching select mode shows that mode's gesture hint; toggling the magnet shows
 * the highlight message. On mount it shows the current mode's hint, never a
 * composite and never the magnet copy until the toggle is actually used.
 *
 * Dumb / engine-agnostic: lift the select mode (e.g. via `SelectModePicker`'s
 * `onModeChange`) and the magnet state, and feed them in as props.
 */
export function GraphHintBar({
  mode,
  magnet,
  defaultMode = 'click',
  hints,
  magnetHints = DEFAULT_MAGNET_HINTS,
  icon: Icon,
  className,
  style,
}: GraphHintBarProps) {
  const resolvedHints = hints ? { ...DEFAULT_GRAPH_HINTS, ...hints } : DEFAULT_GRAPH_HINTS;
  const modeHint = (m: string | undefined): string =>
    resolvedHints[m ?? defaultMode] ?? resolvedHints[defaultMode] ?? '';

  const [message, setMessage] = useState<string>(() => modeHint(mode));

  // Mode switch → that mode's gesture hint. Also fires on mount, so the idle
  // message is the current mode's hint.
  useEffect(() => {
    setMessage(modeHint(mode));
    // resolvedHints is recomputed per render; mode is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Magnet toggle → highlight message, but skip the first run so idle shows the
  // mode hint (not the magnet copy). Highlight text appears only on a real toggle.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (magnet === undefined) return;
    setMessage(magnet ? magnetHints.on : magnetHints.off);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magnet]);

  return (
    <div style={{ ...hintRowStyle, ...style }} className={className}>
      {Icon ? <Icon size={13} /> : null}
      <span>{message}</span>
    </div>
  );
}

const hintRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  opacity: 0.8,
  whiteSpace: 'nowrap',
};
