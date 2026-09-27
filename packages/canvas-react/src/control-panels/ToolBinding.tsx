import { useContext, useEffect } from 'react';

import { useCanvas } from '../CanvasContext';
import { ToolBindingContext } from '../ToolContext';

/**
 * Hands this canvas to a `<GraphToolProvider>` above it, so the provider seeds
 * the canvas store's interaction mode with its tool and mirrors the store from
 * then on. The `tool.active` / `tool.nodeKind` commands themselves are the
 * graph's (registered by every `GraphCanvas`) and read the store directly.
 *
 * Mounted by the `<GraphCanvas>` root; a no-op without a provider. Renders `null`.
 *
 * @internal
 */
export function ToolBinding() {
  const canvas = useCanvas();
  const bind = useContext(ToolBindingContext);
  useEffect(() => bind?.(canvas), [bind, canvas]);
  return null;
}
