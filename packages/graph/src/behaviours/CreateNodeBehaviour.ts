/**
 * `CreateNodeBehaviour` — click empty canvas to add a node to a `GraphLayer`.
 *
 * Layer-scoped; mutates the store directly (like `DragNodeBehaviour`) and also
 * fires an `onNodeCreate` callback. A `createNode` factory lets the consumer
 * shape the node (id, style, data) or veto by returning `null`.
 *
 * Background-click detection mirrors `ClickSelectBehaviour`: the renderer fires
 * `shape:click` / `connector:click` synchronously during the native DOM click,
 * so a flag set there tells us the click landed on an element (don't create).
 * A pointer-move threshold between `pointerdown` and `click` distinguishes a
 * click from a camera pan.
 *
 * Default `enabled: false` — register, then explicitly enable (e.g. an "Add"
 * tool mode toggles it on).
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { GraphNode } from '../store/types';

/** Constructor options for `CreateNodeBehaviour`. */
export interface CreateNodeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour adds nodes to. */
  layerId: string;

  /**
   * Build the node to insert from the click's world position. Return `null`
   * to veto creation. Default: `{ id: <generated>, position }`.
   */
  createNode?: (world: { x: number; y: number }) => GraphNode | null;

  /** Fired after a node is added to the store. */
  onNodeCreate?: (node: GraphNode) => void;
}

let createNodeSeq = 0;

export class CreateNodeBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;
  private canvasEl: HTMLCanvasElement | null = null;

  private readonly makeNode: (world: { x: number; y: number }) => GraphNode | null;
  private readonly onNodeCreate?: (node: GraphNode) => void;

  /** Subscription disposers. */
  private subs: Array<() => void> = [];
  /** True when the in-flight click already landed on a node/edge. */
  private clickConsumedByElement = false;
  /** Pointerdown screen-position — used to distinguish a click from a drag/pan. */
  private pointerDownScreen: { x: number; y: number } | null = null;

  constructor(opts: CreateNodeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
    this.makeNode =
      opts.createNode ??
      ((world) => ({
        id: `n-${Date.now().toString(36)}-${(createNodeSeq++).toString(36)}`,
        position: { x: world.x, y: world.y },
      }));
    this.onNodeCreate = opts.onNodeCreate;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(`CreateNodeBehaviour "${this.id}": layer "${this.layerId}" not found.`);
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(`CreateNodeBehaviour "${this.id}": target layer is not mounted.`);
    }

    const consume = (): void => {
      this.clickConsumedByElement = true;
    };
    const DRAG_VS_CLICK_PX = 4;
    const onPointerDown = (e: PointerEvent): void => {
      this.pointerDownScreen = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
    };
    const onClick = (e: MouseEvent): void => {
      const down = this.pointerDownScreen;
      this.pointerDownScreen = null;
      if (this.clickConsumedByElement) {
        this.clickConsumedByElement = false;
        return;
      }
      if (!this.isEnabled || e.button !== 0 || !this.layer || !this.ctxRef) return;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_VS_CLICK_PX) return;

      const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
      const world = this.ctxRef.camera.toWorld(screenX, screenY);
      const node = this.makeNode({ x: world.x, y: world.y });
      if (!node) return;
      this.layer.store.addNode(node);
      this.onNodeCreate?.(node);
    };

    renderer.events.on('shape:click', consume);
    renderer.events.on('connector:click', consume);
    const el = ctx.canvasElement;
    if (el) {
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('click', onClick);
    }

    this.subs.push(
      () => renderer.events.off('shape:click', consume),
      () => renderer.events.off('connector:click', consume),
      () => {
        if (el) {
          el.removeEventListener('pointerdown', onPointerDown);
          el.removeEventListener('click', onClick);
        }
      },
    );
  }

  protected override onDestroy(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }

  private clientToScreen(clientX: number, clientY: number): { screenX: number; screenY: number } {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect.left, screenY: clientY - rect.top };
  }
}
