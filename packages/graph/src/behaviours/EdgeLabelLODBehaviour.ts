/**
 * `EdgeLabelLODBehaviour` — edge labels across camera zoom: **when** they show
 * (a zoom band) and **how big** they read on screen (a size policy). The edge
 * twin of `NodeLabelLODBehaviour`, tuned separately — edge labels usually
 * appear later and stay smaller than node labels.
 *
 * - **Visibility.** Outside the band the edge's `'label'` decoration is hidden;
 *   it returns inside it. Only the text-LOD channel is touched, so
 *   `LabelCollisionBehaviour` keeps deciding overlaps independently.
 * - **Size.** {@link LabelSizeOptions} cap, floor or damp how big a label reads
 *   on screen. A label stays centred on its path point; its style offset scales
 *   with it. Unset, label size is exactly as today (it grows with the world).
 *
 * Opt-in, off the per-frame render path (see {@link ContentLODBehaviour}).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new EdgeLabelLODBehaviour({
 *     id: 'edge-labels',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     minZoom: 1.2,  // hidden at overview, shown once you zoom in
 *     zoomGrowth: 0, // then a fixed on-screen size (each label's own font size)
 *   }),
 * );
 * ```
 */

import {
  ContentLODBehaviour,
  type ContentLODBehaviourOptions,
  type ContentLODTarget,
  type ContentRenderer,
} from './ContentLODBehaviour';
import { labelSizePolicyOf, type LabelSizeOptions } from './labelSize';

/** Constructor options for {@link EdgeLabelLODBehaviour}. */
export interface EdgeLabelLODBehaviourOptions extends ContentLODBehaviourOptions, LabelSizeOptions {}

export class EdgeLabelLODBehaviour extends ContentLODBehaviour<EdgeLabelLODBehaviourOptions> {
  override readonly kind = 'edge-label-lod';
  protected override readonly contentTarget: ContentLODTarget = 'edges';

  constructor(opts: EdgeLabelLODBehaviourOptions) {
    super(opts);
  }

  protected setContentVisible(renderer: ContentRenderer, id: string, visible: boolean): void {
    renderer.setConnectorTextVisible(id, visible);
  }

  /** Push the edge-label size policy (or clear it when no size option is set). */
  protected override onFullReconcile(): void {
    this.layer?.getRenderer()?.setLabelSizePolicy('connector', labelSizePolicyOf(this._options));
  }

  protected override onDisable(): void {
    super.onDisable();
    // Disabling restores natural label sizes along with visibility.
    this.layer?.getRenderer()?.setLabelSizePolicy('connector', null);
  }

  protected override onDestroy(): void {
    this.layer?.getRenderer()?.setLabelSizePolicy('connector', null);
    super.onDestroy();
  }
}
