import { createContext } from 'react';
import type { GraphClipboard } from '@invana/graph';

/**
 * Holds the `GraphClipboard` constructed by a `<GraphClipboardProvider>` for all
 * descendant hooks (`useClipboard`) and self-wiring buttons (Cut/Copy/Paste/
 * Delete). `null` until the provider's effect has built the instance, or when no
 * provider is present — consumers must guard.
 */
export const ClipboardContext = createContext<GraphClipboard | null>(null);
