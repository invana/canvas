/**
 * The **device-shaped** half of the renderer seam — the part the kernel can
 * legitimately own.
 *
 * ## Why the interface itself moved out
 *
 * This file used to declare `IRenderer` with `applyView` / `applyData`: a push
 * model where the orchestrator handed the renderer view and data deltas. Two
 * things happened to it.
 *
 * 1. **P2 replaced the flow.** Durable visuals became state (`store.specs`) and
 *    the renderer now *subscribes* — `specs:flush` → `SpecProjector` → mounted
 *    elements. Nothing pushes a view or a data delta at a renderer any more, so
 *    those two methods described a design that no longer exists. They had zero
 *    implementers and zero callers, which is exactly how a stale interface
 *    survives unnoticed.
 * 2. **The real contract is made of spec vocabulary.** Surfaces project
 *    `BaseShapeSpec` / `BaseConnectorSpec`; overlays draw in engine geometry.
 *    That vocabulary lives in `@invana/canvas`, and the kernel imports no
 *    `@invana` package — so the interface cannot live here without inverting the
 *    dependency layering.
 *
 * `IRenderer` therefore lives at `@invana/canvas` → `src/renderer/IRenderer.ts`.
 * What stays here is what is genuinely kernel-shaped: the backend name a
 * renderer resolved to, and {@link RendererInitOptions} — the non-syncable
 * device counterpart to the syncable `CanvasSceneOptions`.
 */

/**
 * The backend a renderer resolved to at mount. Open-ended (`string & {}`) so a
 * concrete adapter can report a backend the kernel doesn't enumerate, while the
 * common trio stays autocompletable.
 */
export type RendererBackend = 'webgpu' | 'webgl' | 'canvas' | (string & {});
