// ── ShapeLabels ───────────────────────────────────────────────────────────────
// Per-element label pool. One ShapeLabels instance per ShapeObject; reuses
// `Label` display objects across redraws and adds them to a shared label layer
// (node-labels for shapes, edge-labels for connectors).
//
// Labels render in the dedicated layer — *not* as children of the owning
// shape's container — so they sit above all shape bodies and are never
// occluded by neighbouring elements.

import type { Container } from 'pixi.js';
import { Label } from '@invana/canvas';
import { LOD } from './LODController.js';
import type { BaseConnector } from './BaseConnector.js';
import type { BaseShape } from './BaseShape.js';
import { resolveEdgeAnchor, resolveNodeAnchor } from './LabelAnchor.js';
import type {
  EdgeLabelSpec,
  LabelVisibilityLOD,
  NodeLabelSpec,
} from './spec/index.js';

/** Default styling applied when a label is given as a bare `string`. */
const NODE_DEFAULT: Partial<NodeLabelSpec> = {
  position: 'center',
  fill: '#ffffff',
  fontSize: 12,
};

const EDGE_DEFAULT: Partial<EdgeLabelSpec> = {
  position: 'middle',
  // -12 preserves the previous hard-coded "above the line" offset for a
  // left-to-right edge.  Combined with auto-rotate, edge labels track the path.
  offset: -12,
  rotation: 'auto',
  fill: '#ffffff',
  // Outline by default — edge labels frequently sit on top of the edge stroke
  // and need contrast for legibility.
  stroke: '#000000',
  strokeWidth: 2,
  fontSize: 12,
};

/**
 * Per-element label pool. Owns its `Label` instances and adds/removes them
 * from the shared `_layer` container.
 */
export class ShapeLabels {
  private _labels: Label[] = [];

  constructor(private readonly _layer: Container) {}

  /**
   * Synchronise the pool with the element's current label spec.
   *
   * Called by `ShapeObject.draw()` after the body has been drawn (so the
   * connector's cached route is fresh).
   */
  syncShape(element: BaseShape, detail: LOD): void {
    const specs = normaliseNodeLabels(element.spec.label);
    if (specs.length === 0) {
      this._hideAll();
      return;
    }
    const bbox = element.getBBox();

    let idx = 0;
    for (const spec of specs) {
      if (!isVisibleAtLOD(spec.showAtLOD ?? 'detail', detail)) continue;
      const merged = { ...NODE_DEFAULT, ...spec };
      const anchor = resolveNodeAnchor(
        bbox,
        merged.position ?? 'center',
        merged.offsetX ?? 0,
        merged.offsetY ?? 0,
      );
      this._ensure(idx).update(merged.text, merged, anchor);
      idx++;
    }
    this._hideFrom(idx);
  }

  /**
   * Synchronise the pool with the connector's current label spec.
   * `_cachedRoute` must be populated — call after `connector.draw()`.
   */
  syncConnector(connector: BaseConnector, detail: LOD): void {
    const specs = normaliseEdgeLabels(connector.spec.label);
    if (specs.length === 0) {
      this._hideAll();
      return;
    }
    const route = connector._cachedRoute;
    if (!route || route.length < 2) {
      this._hideAll();
      return;
    }

    let idx = 0;
    for (const spec of specs) {
      if (!isVisibleAtLOD(spec.showAtLOD ?? 'detail', detail)) continue;
      const merged = { ...EDGE_DEFAULT, ...spec };
      const anchor = resolveEdgeAnchor(route, merged.position ?? 'middle', merged.offset ?? 0);
      const placement =
        merged.rotation === 'auto' || merged.rotation === undefined
          ? { autoRotate: true }
          : { rotation: merged.rotation };
      this._ensure(idx).update(merged.text, merged, anchor, placement);
      idx++;
    }
    this._hideFrom(idx);
  }

  /**
   * Iterate every `Label` in this pool (visible or hidden). Used by external
   * drivers like `LabelResolutionPlugin` to push resolution updates without
   * reaching through the Pixi display list.
   */
  forEach(cb: (label: Label) => void): void {
    for (const label of this._labels) cb(label);
  }

  /** Permanently destroy all labels in the pool. */
  destroy(): void {
    for (const label of this._labels) {
      this._layer.removeChild(label.view);
      label.destroy();
    }
    this._labels.length = 0;
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private _ensure(idx: number): Label {
    let label = this._labels[idx];
    if (!label) {
      label = new Label();
      this._labels[idx] = label;
      this._layer.addChild(label.view);
    }
    return label;
  }

  private _hideFrom(startIdx: number): void {
    for (let i = startIdx; i < this._labels.length; i++) {
      this._labels[i]!.hide();
    }
  }

  private _hideAll(): void {
    for (const label of this._labels) label.hide();
  }
}

// ── Spec normalisation ──────────────────────────────────────────────────────

function normaliseNodeLabels(
  raw: string | NodeLabelSpec | NodeLabelSpec[] | undefined,
): NodeLabelSpec[] {
  if (raw === undefined || raw === null || raw === '') return [];
  if (typeof raw === 'string') return [{ text: raw }];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

function normaliseEdgeLabels(
  raw: string | EdgeLabelSpec | EdgeLabelSpec[] | undefined,
): EdgeLabelSpec[] {
  if (raw === undefined || raw === null || raw === '') return [];
  if (typeof raw === 'string') return [{ text: raw }];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

function isVisibleAtLOD(threshold: LabelVisibilityLOD, detail: LOD): boolean {
  if (detail === LOD.DOT) return false;
  switch (threshold) {
    case 'always': return true;
    case 'full':   return detail >= LOD.FULL;
    case 'detail': return detail >= LOD.DETAIL;
  }
}
