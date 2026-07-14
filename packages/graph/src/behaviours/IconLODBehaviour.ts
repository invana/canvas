/**
 * `IconLODBehaviour` — shows / hides node **inset icons** (`glyph` / `svg` /
 * `svg-url`) by camera zoom. Below the band the icons are dropped (a pure
 * `.visible` flip — no repaint), keeping a crowded overview fast; they return as
 * you zoom in.
 *
 * Sits in the node-content LOD family alongside `TextLODBehaviour` /
 * `ImageLODBehaviour`; opt-in, off the per-frame render path (see
 * {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new IconLODBehaviour({ id: 'icon-lod', targetLayerId: 'graph', enabled: true, minZoom: 1 }),
 * );
 * ```
 */

import {
  ContentLODBehaviour,
  type ContentLODBehaviourOptions,
  type ContentRenderer,
} from './ContentLODBehaviour';

/** Constructor options for {@link IconLODBehaviour}. */
export type IconLODBehaviourOptions = ContentLODBehaviourOptions;

export class IconLODBehaviour extends ContentLODBehaviour {
  protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void {
    renderer.setShapeIconVisible(id, visible);
  }
}
