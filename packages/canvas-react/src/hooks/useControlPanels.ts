import { useCallback, useSyncExternalStore, type ReactNode } from 'react';
import type { Canvas, CanvasView, ControlPanelSpec } from '@invana/canvas';

import { controlPanelSlots } from '../control-panels/slots';
import { useResolvedCanvas } from './useResolvedCanvas';
import { useStore } from './useStore';

const selectControlPanels = (s: CanvasView): Record<string, ControlPanelSpec> => s.definition.controlPanels;

/**
 * Every control panel in `definition.controlPanels`, keyed by id — re-renders
 * only when that slice changes.
 */
export function useControlPanels(canvas?: Canvas | null): Record<string, ControlPanelSpec> {
  const resolved = useResolvedCanvas(canvas);
  return useStore(resolved.store.view, selectControlPanels);
}

/** The runtime node registered for slot `name` (see `ControlPanel` children), or `undefined`. */
export function useControlPanelSlot(name: string, canvas?: Canvas | null): ReactNode {
  const resolved = useResolvedCanvas(canvas);
  const slots = controlPanelSlots(resolved);
  const get = useCallback(() => slots.get(name), [slots, name]);
  return useSyncExternalStore(slots.subscribe, get, get);
}
