/**
 * `SpecProjector` — drives a renderer from a {@link SpecStore}.
 *
 * The store holds the visual description; this turns it into mounted elements.
 * Every drawing layer uses the same projector, which is what makes "the renderer
 * is a projection of state" true for the whole engine rather than for one layer.
 *
 * Two entry points, and the difference matters:
 *
 * - {@link project} — synchronous, for a layer publishing its own spec. Anything
 *   the layer does *after* publishing (attaching a label, a decoration, a badge)
 *   needs the element mounted already, so this path cannot wait for a flush.
 * - the **flush subscription** — for every other writer: a behaviour, a tool, a
 *   restored session. Ids already projected synchronously in the same frame are
 *   skipped so nothing is drawn twice.
 *
 * Shapes and connectors are told apart by **which registry owns the spec's
 * `kind`**, so no discriminator has to be baked into the spec vocabulary.
 *
 * See `docs/renderer-split-design.md` §2 and §4.2b.
 */

import type { SpecFlush, SpecStore } from '@invana/canvas-store';
import type { BaseConnectorSpec, BaseShapeSpec } from '../specs';

/** The slice of a renderer this projector drives. */
export interface SpecProjectionTarget {
  readonly shapeKinds: ReadonlySet<string>;
  getShapeKind(id: string): string | undefined;
  hasConnector(id: string): boolean;
  addShape<TSpec extends BaseShapeSpec>(id: string, spec: TSpec): void;
  updateShape<TSpec extends BaseShapeSpec>(id: string, patch: Partial<TSpec>): void;
  removeShape(id: string): void;
  addConnector<TSpec extends BaseConnectorSpec>(id: string, spec: TSpec): void;
  updateConnector<TSpec extends BaseConnectorSpec>(id: string, patch: Partial<TSpec>): void;
  removeConnector(id: string): void;
}

export interface SpecProjectorOptions {
  /**
   * Called before an element is removed and re-added because its `kind` changed.
   * A host may be tracking decoration / badge slots that the removal disposes.
   */
  onKindChange?: (id: string) => void;
}

export class SpecProjector<TSpec extends BaseShapeSpec | BaseConnectorSpec> {
  private readonly projectedThisFlush = new Set<string>();
  private readonly off: () => void;

  constructor(
    private readonly specs: SpecStore<TSpec>,
    private readonly target: SpecProjectionTarget,
    private readonly options: SpecProjectorOptions = {},
  ) {
    this.off = specs.onFlush((delta) => this.applyFlush(delta));
  }

  /**
   * Mount / update `id` from the store **now**, and mark it handled so the next
   * flush skips it.
   */
  project(id: string): void {
    this.projectedThisFlush.add(id);
    this.apply(id);
  }

  /** Remove whatever the renderer holds for `id`, whichever kind it is. */
  unproject(id: string): void {
    const t = this.target;
    if (t.getShapeKind(id) !== undefined) t.removeShape(id);
    else if (t.hasConnector(id)) t.removeConnector(id);
  }

  /** Drop the flush subscription. */
  destroy(): void {
    this.off();
    this.projectedThisFlush.clear();
  }

  private applyFlush(delta: SpecFlush): void {
    for (const id of delta.added) if (!this.projectedThisFlush.has(id)) this.apply(id);
    for (const id of delta.changed) if (!this.projectedThisFlush.has(id)) this.apply(id);
    for (const id of delta.removed) this.unproject(id);
    this.projectedThisFlush.clear();
  }

  private apply(id: string): void {
    const spec = this.specs.get(id);
    if (!spec) return;
    const t = this.target;

    if (t.shapeKinds.has(spec.kind)) {
      const shapeSpec = spec as BaseShapeSpec;
      const currentKind = t.getShapeKind(id);
      if (currentKind === undefined) {
        t.addShape(id, shapeSpec);
      } else if (currentKind === shapeSpec.kind) {
        // Instance-preserving: keeps gfx scale, decorations, badges, effects.
        t.updateShape<BaseShapeSpec>(id, shapeSpec);
      } else {
        // `IShape` is fixed at construction, so a kind change means remount.
        t.removeShape(id);
        this.options.onKindChange?.(id);
        t.addShape(id, shapeSpec);
      }
      return;
    }

    const connectorSpec = spec as BaseConnectorSpec;
    if (t.hasConnector(id)) t.updateConnector(id, connectorSpec);
    else t.addConnector(id, connectorSpec);
  }
}
