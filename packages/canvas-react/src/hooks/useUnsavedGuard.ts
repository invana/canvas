import type { Canvas } from '@invana/canvas';
import { useEffect } from 'react';

import { useUnsavedChanges } from './useUnsavedChanges';

/**
 * While the board has unsaved changes, leaving the page asks first — the
 * browser's own "Leave site?" prompt. Unsaved changes live in the page and do
 * not survive a reload. Follows the `UnsavedChangesBehaviour` registered as
 * `id` (default `'unsaved-changes'`); `enabled: false` turns the guard off.
 */
export function useUnsavedGuard(options: { id?: string; enabled?: boolean } = {}, canvas?: Canvas | null): void {
  const { id = 'unsaved-changes', enabled = true } = options;
  const { count } = useUnsavedChanges(id, canvas);
  useEffect(() => {
    if (!enabled || count === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [enabled, count]);
}
