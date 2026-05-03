/**
 * `Layout` — function from data to positions.
 *
 * Architecture: see `architecture-proposal.md` §2.3.
 *
 * Per the proposal:
 *  - A Layout does NOT register with the canvas.
 *  - It does NOT render.
 *  - It does NOT subscribe to input.
 *  - You instantiate it and call it against a layer.
 *
 *      const layout = new D3ForceLayout({ charge: -300 });
 *      await layout.apply(graphLayer);
 *
 * Continuous-running cases (e.g. always-relax force simulation) are handled
 * by a thin wrapper Behaviour that calls `apply()` on a tick — keeps the
 * Layout API clean while supporting the rare continuous case.
 *
 * Whether two layouts conflict is a domain concern (don't apply two layouts
 * to the same data) — not enforced here.
 */

import type { Layer } from './Layer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Layout<TLayer extends Layer<any, any, any, any> = Layer<any, any, any, any>> {
  apply(layer: TLayer): Promise<void>;
}
