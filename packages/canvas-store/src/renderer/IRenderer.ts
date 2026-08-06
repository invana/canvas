import type { CameraTransform } from '../geom/types';
import type { CanvasView } from '../view/CanvasView';
import type { DataSource } from '../data/DataSource';
import type { LayerFlush } from '../data/LayerData';
import type { RendererInitOptions } from './RendererInitOptions';

/**
 * The backend a renderer resolved to at mount. Open-ended (`string & {}`) so a
 * concrete adapter can report a backend the kernel doesn't enumerate, while the
 * common trio stays autocompletable.
 */
export type RendererBackend = 'webgpu' | 'webgl' | 'canvas' | (string & {});

/**
 * `IRenderer` — the **renderer seam**: the renderer-agnostic contract the
 * orchestrator (`@invana/canvas`) drives, implemented by a rendering package
 * (the first being `@invana/renderer-pixijs`). Pure types — this file imports no
 * drawing library, keeping the kernel a leaf (see `docs/renderer-split-design.md`).
 *
 * The renderer is a **pure projection of store state** — it holds no source of
 * truth. The unidirectional loop:
 *
 * ```
 * input (device) ─► renderer emits `input:*` on store.events ─► behaviours ─► store.view.update
 *                                                               layouts     ─► store.data[id] positions
 * store changes  ─► orchestrator ─► renderer.applyView   (config / theme / interaction)
 *                                   renderer.applyData   (targeted per-source delta)
 *                                   renderer.applyCamera (abstract transform → viewport)
 * ```
 *
 * **Input is not a member of this interface.** A renderer receives a reference to
 * the canvas-wide `CanvasEventBus` (`store.events`) — via its constructor or
 * {@link mount} options, an adapter concern — and `emit`s `input:*` events onto it;
 * behaviours subscribe there. There is exactly one bus, so the seam stays one-way:
 * the orchestrator pushes state *in*, the renderer publishes input *out* over the
 * shared bus.
 */
export interface IRenderer {
  /**
   * Attach to a DOM host and stand up the backend (e.g. a pixi `Application` +
   * viewport). May be async (GPU adapter acquisition); the orchestrator awaits it
   * before the first `apply*`. {@link backend} is meaningful only after this resolves.
   */
  mount(host: HTMLElement, opts?: RendererInitOptions): Promise<void> | void;

  /**
   * Project the reactive {@link CanvasView} — scene config, theme, and interaction
   * (selection / hover / focus). A **restyle**, driven when the view store emits
   * `state:change`. `changedPaths` (the dot-paths that changed this update) lets the
   * renderer skip untouched subtrees; an empty array means "reapply everything".
   */
  applyView(view: CanvasView, changedPaths: readonly string[]): void;

  /**
   * Project one data source's coalesced, per-frame bulk delta — the targeted
   * node/edge/group redraw. Driven when that source flushes (`data:flush`). The
   * `source` is passed alongside the `delta` so the renderer can read current record
   * payloads / positions for the changed ids without holding its own copy.
   */
  applyData(sourceId: string, source: DataSource, delta: LayerFlush): void;

  /**
   * Realise the abstract {@link CameraTransform} — the renderer owns the concrete
   * viewport and maps `{ x, y, zoom }` onto it. Driven when
   * `view.interaction.camera` changes.
   */
  applyCamera(camera: CameraTransform): void;

  /** Tear down — release the backend, DOM surface, and any listeners. */
  destroy(): void;

  /** The backend actually resolved at {@link mount} (may differ from the preference). */
  readonly backend: RendererBackend;
}
