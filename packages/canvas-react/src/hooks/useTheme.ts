import { useCallback, useEffect, useState } from 'react';
import type { Canvas as EngineCanvas, BackgroundLayer } from '@invana/canvas';
import type {
  MiniMapLayer,
  ResponsiveThemeBehaviour,
  ThemeKind,
  ThemeMode,
} from '@invana/graph';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseThemeOptions {
  /** Id of the `ResponsiveThemeBehaviour` to drive. Default `'responsive-theme'`. */
  behaviourId?: string;
  /**
   * Optional id of a `BackgroundLayer` to flip in lockstep. When set, switching
   * the theme also switches the background's `mode`, so the whole canvas changes
   * appearance together instead of the background staying on its own
   * `prefers-color-scheme`. Omit to leave the background alone.
   */
  backgroundLayerId?: string;
  /**
   * Optional id of a `MiniMapLayer` to flip in lockstep. When set, switching the
   * theme also switches the minimap's `mode`, so its chrome (background / border
   * / viewport indicator) tracks the canvas instead of staying on its own
   * `prefers-color-scheme`. Omit to leave the minimap alone.
   */
  minimapLayerId?: string;
  /**
   * Called after the theme switches, with the new resolved kind + mode. Use it
   * to flip *app chrome* that lives outside the canvas (e.g. a design-system
   * `data-theme` attribute) so floating controls stay legible against the
   * canvas. The hook never touches chrome itself — that's app policy.
   */
  onChange?: (kind: ThemeKind, mode: ThemeMode) => void;
}

export interface UseThemeResult {
  /** Current mode setting (`'auto' | 'light' | 'dark'`). */
  mode: ThemeMode;
  /** Concrete kind currently resolved (`'light' | 'dark'`). */
  kind: ThemeKind;
  /** Set the mode explicitly. `'auto'` re-follows `prefers-color-scheme`. */
  setMode: (mode: ThemeMode) => void;
  /** Flip between pinned light and dark, based on the current resolved kind. */
  toggle: () => void;
}

/**
 * Drive a registered `ResponsiveThemeBehaviour` (from `@invana/graph`) — read its
 * mode / resolved kind and switch it. Useful for a theme-toggle control.
 *
 * Pass `backgroundLayerId` to also flip a `BackgroundLayer`'s mode in lockstep so
 * the background switches with the graph content (otherwise the background keeps
 * following the OS `prefers-color-scheme` and dark-theme content can land on a
 * light background). Pass `onChange` to switch app chrome to match.
 *
 * State is owned by the hook (neither the behaviour nor the layer emits a
 * mode-change event) and seeded once they are registered. Each action looks the
 * targets up fresh, so it tolerates them mounting after this hook.
 */
export function useTheme(
  options: UseThemeOptions = {},
  canvas?: EngineCanvas | null,
): UseThemeResult {
  const { behaviourId = 'responsive-theme', backgroundLayerId, minimapLayerId, onChange } = options;
  const resolved = useResolvedCanvas(canvas);
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [kind, setKindState] = useState<ThemeKind>('light');

  const getBehaviour = useCallback(
    () => resolved.behaviours.get<ResponsiveThemeBehaviour>(behaviourId),
    [resolved, behaviourId],
  );
  const getBackground = useCallback(
    () =>
      backgroundLayerId ? resolved.layers.get<BackgroundLayer>(backgroundLayerId) : undefined,
    [resolved, backgroundLayerId],
  );
  const getMinimap = useCallback(
    () => (minimapLayerId ? resolved.layers.get<MiniMapLayer>(minimapLayerId) : undefined),
    [resolved, minimapLayerId],
  );

  /** Read the live state of whichever target is present. */
  const read = useCallback((): { mode: ThemeMode; kind: ThemeKind } => {
    const source = getBehaviour() ?? getBackground();
    return {
      mode: source?.getMode() ?? 'auto',
      kind: source?.getResolvedKind() ?? 'light',
    };
  }, [getBehaviour, getBackground]);

  useEffect(() => {
    const { mode: m, kind: k } = read();
    setModeState(m);
    setKindState(k);
  }, [read]);

  const applyMode = useCallback(
    (next: ThemeMode) => {
      getBehaviour()?.setMode(next);
      getBackground()?.setMode(next);
      getMinimap()?.setMode(next);
      const { mode: m, kind: k } = read();
      setModeState(m);
      setKindState(k);
      onChange?.(k, m);
    },
    [getBehaviour, getBackground, getMinimap, read, onChange],
  );

  const setMode = useCallback((next: ThemeMode) => applyMode(next), [applyMode]);

  const toggle = useCallback(() => {
    applyMode(read().kind === 'dark' ? 'light' : 'dark');
  }, [applyMode, read]);

  return { mode, kind, setMode, toggle };
}
