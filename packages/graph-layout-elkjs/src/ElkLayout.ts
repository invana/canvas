/**
 * `ElkLayout` — [ELK](https://eclipse.dev/elk/) `Layout` for `@invana/graph`.
 *
 * ELK is a *one-shot* layout engine: a single `apply()` call snapshots the
 * graph, dispatches it to the wasm-free JS port (`elkjs`), waits for the
 * Promise to settle, then writes positions back to the store in one bulk
 * call. There is no iterative simulation — the run emits exactly one
 * `tick` event, immediately followed by `end`.
 *
 * ## Coordinate convention
 *
 * ELK returns top-left corner coordinates for every node. `@invana/graph`
 * stores **centre** coordinates. The layout converts on write-back using
 * each node's resolved width / height (same numbers it fed to ELK).
 *
 * ## Cancellation
 *
 * `elkjs` does not expose mid-layout cancellation. `stop()` (and a second
 * `apply()` call) instead bump a run token: when the in-flight Promise
 * settles for an obsolete token, its result is dropped on the floor and
 * `end` fires with `reason: 'stopped'`.
 *
 * @example
 * const layout = new ElkLayout({
 *   algorithm: 'layered',
 *   direction: 'RIGHT',
 *   nodeSpacing: 30,
 *   layerSpacing: 80,
 * });
 * layout.events.on('end', () => canvas.camera.fitContent(graphLayer.getBounds(), 80));
 * await layout.apply(graphLayer);
 */

import ELK, {
  type ELK as ElkInstance,
  type ElkExtendedEdge,
  type ElkNode,
  type LayoutOptions,
} from 'elkjs/lib/elk.bundled.js';

import { Layout } from '@invana/canvas';
import type { GraphLayer, GraphNode } from '@invana/graph';

import type {
  ElkLayoutOptions,
  ElkPadding,
  NodeSize,
} from './types';

/** Fallback bounding box when no shape and no override give us a size. */
const FALLBACK_NODE_SIZE: NodeSize = { width: 40, height: 40 };

export class ElkLayout extends Layout<GraphLayer> {
  private readonly opts: ElkLayoutOptions;
  /** Shared ELK instance — `elkjs` is happy to be reused across runs. */
  private readonly elk: ElkInstance;
  /**
   * Monotonic run id. Each `apply()` bumps it; the in-flight Promise's
   * captured value is compared against it on settle to decide whether the
   * result is still relevant.
   */
  private runToken = 0;
  /** True while a run is in flight — guards `stop()` from emitting twice. */
  private running = false;

  constructor(opts: ElkLayoutOptions = {}) {
    super();
    this.opts = opts;
    this.elk = new ELK();
  }

  /**
   * Run ELK against `layer`. Resolves when ELK settles OR the run is
   * cancelled by `stop()` / a subsequent `apply()`. Even on cancellation
   * the Promise resolves (never rejects) — the cancel path emits
   * `end: { reason: 'stopped' }` and resolves cleanly.
   */
  async apply(layer: GraphLayer): Promise<void> {
    // Cancel any in-flight run before starting a new one. `stop` bumps the
    // token and emits `end: 'stopped'` for the previous run.
    this.stop();

    const token = ++this.runToken;
    const store = layer.store;

    // 1. Snapshot nodes + edges, resolving width/height per node.
    const sizeOf = this.opts.nodeSize ?? ((n: GraphNode) => resolveSizeFromLayer(layer, n));
    const ids: string[] = [];
    const sizes: NodeSize[] = [];
    const children: ElkNode[] = [];
    for (const n of store.nodes()) {
      const size = sizeOf(n) ?? FALLBACK_NODE_SIZE;
      ids.push(n.id);
      sizes.push(size);
      children.push({ id: n.id, width: size.width, height: size.height });
    }
    if (children.length === 0) return;

    const edges: ElkExtendedEdge[] = [];
    for (const e of store.edges()) {
      edges.push({ id: e.id, sources: [e.source], targets: [e.target] });
    }

    // 2. Build the ELK graph + merge convenience options with the
    //    free-form passthrough (passthrough wins).
    const layoutOptions = buildLayoutOptions(this.opts);
    const graph: ElkNode = { id: 'root', layoutOptions, children, edges };

    this.running = true;
    this.events.emit('start', {});

    // 3. Dispatch. `elk.layout` is async — we capture `token` so a stale
    //    settle can be ignored cleanly.
    let result: ElkNode;
    try {
      result = await this.elk.layout(graph);
    } catch (err) {
      // ELK threw (typically: malformed property bag). If still relevant,
      // tear down + rethrow so the caller's awaited Promise rejects;
      // otherwise the cancel path already emitted `end: 'stopped'`.
      if (token === this.runToken) {
        this.running = false;
        this.events.emit('end', { reason: 'completed' });
        throw err;
      }
      return;
    }

    // 4. Stale settle → nothing to do. The newer run owns the future.
    if (token !== this.runToken) return;

    // 5. Convert ELK top-left coordinates to canvas centre coordinates
    //    and bulk-write. Iterate `result.children` (its child order is
    //    the order we passed in), pairing with `sizes` by index.
    const resultChildren = result.children ?? [];
    const buffer = new Float32Array(resultChildren.length * 2);
    for (let i = 0; i < resultChildren.length; i++) {
      const child = resultChildren[i]!;
      const size = sizes[i]!;
      buffer[i * 2] = (child.x ?? 0) + size.width / 2;
      buffer[i * 2 + 1] = (child.y ?? 0) + size.height / 2;
    }
    store.setPositionsBulk(ids, buffer);

    this.events.emit('tick', {});
    this.running = false;
    this.events.emit('end', { reason: 'completed' });
  }

  /**
   * Cancel an in-flight run. The current ELK Promise (if any) is left to
   * settle, but its result is dropped. Positions already in the store are
   * untouched. No-op when idle.
   */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    // Bump the token so the in-flight Promise sees itself as stale.
    this.runToken++;
    this.events.emit('end', { reason: 'stopped' });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Read the resolved shape's local AABB from {@link GraphLayer.boundsOfNode}
 * and project it to a `{ width, height }`. The layer routes through the
 * shape registry's `static boundsOf` hook, so every registered kind
 * (built-in or custom) flows through the same code path here without a
 * per-kind switch.
 *
 * Falls back to {@link FALLBACK_NODE_SIZE} when the renderer isn't
 * mounted yet, the resolved shape kind isn't registered, or the
 * registered ctor doesn't expose `boundsOf`. Consumers that need a
 * tighter override on a per-node basis can pass `nodeSize: (node) =>
 * ({ width, height })` to bypass this hook entirely.
 */
function resolveSizeFromLayer(layer: GraphLayer, node: GraphNode): NodeSize {
  const local = layer.boundsOfNode(node);
  if (!local) return FALLBACK_NODE_SIZE;
  return { width: local.width, height: local.height };
}

/**
 * Merge the convenience option fields and the free-form `layoutOptions`
 * passthrough into a single ELK property bag. The passthrough is applied
 * last so users can always override.
 */
function buildLayoutOptions(opts: ElkLayoutOptions): LayoutOptions {
  const out: LayoutOptions = {};
  out['elk.algorithm'] = opts.algorithm ?? 'layered';
  if (opts.direction !== undefined) out['elk.direction'] = opts.direction;
  if (opts.nodeSpacing !== undefined) out['elk.spacing.nodeNode'] = String(opts.nodeSpacing);
  if (opts.layerSpacing !== undefined) {
    out['elk.layered.spacing.nodeNodeBetweenLayers'] = String(opts.layerSpacing);
  }
  if (opts.edgeNodeSpacing !== undefined) out['elk.spacing.edgeNode'] = String(opts.edgeNodeSpacing);
  if (opts.edgeSpacing !== undefined) out['elk.spacing.edgeEdge'] = String(opts.edgeSpacing);
  if (opts.padding !== undefined) out['elk.padding'] = formatPadding(opts.padding);
  if (opts.layoutOptions) Object.assign(out, opts.layoutOptions);
  return out;
}

/**
 * ELK's `elk.padding` is a string in the form `'[top=N,right=N,bottom=N,left=N]'`.
 * Symmetric `number` shorthand fills all four sides.
 */
function formatPadding(p: ElkPadding): string {
  if (typeof p === 'number') {
    return `[top=${p},right=${p},bottom=${p},left=${p}]`;
  }
  const top = p.top ?? 0;
  const right = p.right ?? 0;
  const bottom = p.bottom ?? 0;
  const left = p.left ?? 0;
  return `[top=${top},right=${right},bottom=${bottom},left=${left}]`;
}
