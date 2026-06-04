import { createContext } from 'react';
import type { GraphHistory } from '@invana/graph';

/**
 * Holds the `GraphHistory` constructed by a `<GraphHistoryProvider>` for all
 * descendant hooks (`useHistory`) and self-wiring buttons (Undo/Redo/Redraw).
 * `null` until the provider's effect has built the instance, or when no provider
 * is present — consumers must guard.
 */
export const HistoryContext = createContext<GraphHistory | null>(null);
