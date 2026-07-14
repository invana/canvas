/**
 * `ImageLODBehaviour` — shows / hides node **silhouette `image` fills** by camera
 * zoom. Below the band the image is dropped; because an image is painted *into*
 * the body (not a separate child), hiding it repaints the body with the image
 * layer stripped — done only on a threshold crossing, not per frame.
 *
 * Sits in the node-content LOD family alongside `TextLODBehaviour` /
 * `IconLODBehaviour`; opt-in, off the per-frame render path (see
 * {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ImageLODBehaviour({ id: 'image-lod', targetLayerId: 'graph', enabled: true, minZoom: 2.5 }),
 * );
 * ```
 */

import {
  ContentLODBehaviour,
  type ContentLODBehaviourOptions,
  type ContentRenderer,
} from './ContentLODBehaviour';

/** Constructor options for {@link ImageLODBehaviour}. */
export type ImageLODBehaviourOptions = ContentLODBehaviourOptions;

export class ImageLODBehaviour extends ContentLODBehaviour {
  protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void {
    renderer.setShapeImageVisible(id, visible);
  }
}
