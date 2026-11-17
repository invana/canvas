import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LucideIcon } from 'lucide-react';

/**
 * Build a `GraphLayerOptions.iconSet` from Lucide components.
 *
 * Each component is rendered to SVG markup **once, here**; the result is plain
 * `{ name: '<svg …>' }` data. From then on the visualisation is JSON — a saved
 * config carries its own icons, draws them with no network, and an icon is
 * referenced by name (`icon: { kind: 'named', name: 'waves' }`) from a styling
 * template. The engine never imports Lucide; this is the one seam.
 *
 * Lucide icons are outline icons, which is what the renderer keeps (it strokes
 * the SVG's drawing primitives in the icon's `color`).
 *
 * @param icons - Icon name → Lucide component, e.g. `{ waves: Waves, temple: Flame }`.
 *   The key is the name templates use; it need not match Lucide's own.
 * @returns Icon name → SVG markup, ready for `iconSet`.
 *
 * @example
 * ```ts
 * import { Waves, Flame } from 'lucide-react';
 * const iconSet = iconSetFromLucide({ lake: Waves, temple: Flame });
 * // config.layers.graph.iconSet = iconSet
 * // nodeStylingTemplates.lake.icon = { kind: 'named', name: 'lake', color: 0xffffff }
 * ```
 */
export function iconSetFromLucide(icons: Readonly<Record<string, LucideIcon>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, Icon] of Object.entries(icons)) {
    out[name] = renderToStaticMarkup(createElement(Icon));
  }
  return out;
}
