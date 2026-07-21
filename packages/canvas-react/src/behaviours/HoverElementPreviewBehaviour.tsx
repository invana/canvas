import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';
import * as graph from '@invana/graph';
import type {
  GraphEdge,
  GraphNode,
  HoverElementPreviewBehaviourOptions,
  PreviewPlacement,
  PreviewSnapshot,
} from '@invana/graph';

import { useCanvas } from '../CanvasContext';
import { useHoverElementPreview } from '../hooks/useHoverElementPreview';
import { useBehaviourRegistration } from './useBehaviourRegistration';

export interface HoverElementPreviewBehaviourProps
  extends Omit<HoverElementPreviewBehaviourOptions, 'id' | 'targetLayerId'> {
  /** Behaviour id; default `'element-preview'`. Changing this remounts the behaviour. */
  id?: string;
  /** GraphLayer id whose nodes/edges this behaviour watches; default `'graph'`. */
  targetLayerId?: string;
  /** Gap in px between the anchor and the card. Default `12`. */
  gap?: number;
  /** Extra x nudge in px applied after placement — e.g. to clear the node / connector. Default `0`. */
  offsetX?: number;
  /** Extra y nudge in px applied after placement. Default `0`. */
  offsetY?: number;
  /** Minimum gap in px from the container edge when clamping. Default `8`. */
  edgeMargin?: number;
  /** Stacking order of the card. Default `1000`. */
  zIndex?: number;
  /** Content for a hovered **node** — gets the live `GraphNode`. */
  renderNode?: (node: GraphNode, snapshot: PreviewSnapshot) => ReactNode;
  /** Content for a hovered **edge** — gets the live `GraphEdge` (with `source` / `target`). */
  renderEdge?: (edge: GraphEdge, snapshot: PreviewSnapshot) => ReactNode;
  /** Content for any element — takes precedence over `renderNode` / `renderEdge`. */
  renderCard?: (snapshot: PreviewSnapshot) => ReactNode;
}

/**
 * Declarative, **headless** hover preview for `@invana/canvas-react`.
 *
 * Registers `@invana/graph`'s `HoverElementPreviewBehaviour` and owns the engine
 * glue — subscription, anchoring (measure → flip → clamp), and the interactive
 * hold-open behaviour — then renders **only the content you supply** via
 * `renderNode` / `renderEdge` (or `renderCard`) inside the positioned shell. It
 * draws **no card of its own** and imports no `@invana/ui`: with no render-prop
 * matching the hovered element it renders `null`. For a batteries-included
 * default card, use `@invana/canvas-ui`'s `HoverElementPreviewBehaviour`, which
 * wraps this and supplies the default card.
 *
 * All options except `id` / `targetLayerId` are reactive (synced via
 * `setOptions`); `id` / `targetLayerId` are identity — change them (or `key`) to
 * recreate. For a fully custom overlay, read {@link useHoverElementPreview}
 * directly instead.
 *
 * ```tsx
 * <HoverElementPreviewBehaviour
 *   targetLayerId="graph"
 *   renderNode={(node) => <NodePreviewCard title={node.id} … />}
 *   renderEdge={(edge) => <EdgePreviewCard title={`${edge.source} → ${edge.target}`} … />}
 * />
 * ```
 */
export function HoverElementPreviewBehaviour({
  id = 'element-preview',
  targetLayerId = 'graph',
  enabled = true,
  gap,
  offsetX,
  offsetY,
  edgeMargin,
  zIndex,
  renderNode,
  renderEdge,
  renderCard,
  ...rest
}: HoverElementPreviewBehaviourProps) {
  const canvas = useCanvas();

  // Register the engine behaviour (identity = id + targetLayerId).
  useBehaviourRegistration(
    () => new graph.HoverElementPreviewBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId],
  );

  // Keep reactive options live — the registration effect only captures the
  // options present at mount, so re-sync on every change (cheap + idempotent).
  const {
    targets,
    openDelay,
    closeDelay,
    placement,
    interactive,
    enable,
    card,
    cards,
    onShow,
    onHide,
  } = rest;
  useEffect(() => {
    canvas.behaviours.get<graph.HoverElementPreviewBehaviour>(id)?.setOptions({
      targets,
      openDelay,
      closeDelay,
      placement,
      interactive,
      enable,
      card,
      cards,
      onShow,
      onHide,
    });
  }, [
    canvas,
    id,
    targets,
    openDelay,
    closeDelay,
    placement,
    interactive,
    enable,
    card,
    cards,
    onShow,
    onHide,
  ]);

  const snapshot = useHoverElementPreview({ previewId: id });
  if (!snapshot) return null;

  let content: ReactNode;
  if (renderCard) {
    content = renderCard(snapshot);
  } else if (snapshot.kind === 'node' && renderNode) {
    content = renderNode(snapshot.node, snapshot);
  } else if (snapshot.kind === 'edge' && renderEdge) {
    content = renderEdge(snapshot.edge, snapshot);
  } else {
    // Headless: no default card — the consumer (or the canvas-ui wrapper) owns
    // the pixels. Nothing to draw for this element.
    return null;
  }
  if (!content) return null;

  return (
    <PreviewShell
      snapshot={snapshot}
      previewId={id}
      interactive={interactive ?? true}
      gap={gap}
      offsetX={offsetX}
      offsetY={offsetY}
      edgeMargin={edgeMargin}
      zIndex={zIndex}
    >
      {content}
    </PreviewShell>
  );
}

// ─── Positioning + interactivity shell ───────────────────────────────────────

interface PreviewShellProps {
  snapshot: PreviewSnapshot;
  previewId: string;
  interactive: boolean;
  gap?: number;
  offsetX?: number;
  offsetY?: number;
  edgeMargin?: number;
  zIndex?: number;
  children: ReactNode;
}

/**
 * The positioned, optionally-interactive wrapper rendered around the card
 * content. It owns **all** the engine glue so the card stays pure UI:
 *
 * - **Anchoring** — measures the content, resolves `'auto'`, flips inward near a
 *   screen edge, applies `offset`, and clamps inside the `<Canvas>` host (the
 *   positioned ancestor), à la Floating UI.
 * - **Hold-open** — in interactive mode, the pointer can rest on the card to
 *   select text: `pointerenter` calls the behaviour's `holdOpen()`, `pointerleave`
 *   calls `releaseHold()`. The hide *state* logic lives in the behaviour; this
 *   only binds the card's DOM events to it (the behaviour can't listen on a card
 *   element it doesn't own).
 */
function PreviewShell({
  snapshot,
  previewId,
  interactive,
  gap = 12,
  offsetX = 0,
  offsetY = 0,
  edgeMargin = 8,
  zIndex = 1000,
  children,
}: PreviewShellProps) {
  const canvas = useCanvas();
  const ref = useRef<HTMLDivElement>(null);
  const { screen, placement } = snapshot;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = (el.offsetParent as HTMLElement | null) ?? null;
    const W = parent?.clientWidth ?? window.innerWidth;
    const H = parent?.clientHeight ?? window.innerHeight;
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;

    // Resolve `'auto'` → flip onto the vertical side with more room; horizontal
    // corners are then handled by the clamp below.
    let place: PreviewPlacement = placement;
    if (place === 'auto') place = screen.y < H / 2 ? 'bottom' : 'top';

    let left: number;
    let top: number;
    switch (place) {
      case 'bottom':
        left = screen.x - cw / 2;
        top = screen.y + gap;
        break;
      case 'left':
        left = screen.x - cw - gap;
        top = screen.y - ch / 2;
        break;
      case 'right':
        left = screen.x + gap;
        top = screen.y - ch / 2;
        break;
      case 'top-left':
        left = screen.x - cw - gap;
        top = screen.y - ch - gap;
        break;
      case 'top-right':
        left = screen.x + gap;
        top = screen.y - ch - gap;
        break;
      case 'bottom-left':
        left = screen.x - cw - gap;
        top = screen.y + gap;
        break;
      case 'bottom-right':
        left = screen.x + gap;
        top = screen.y + gap;
        break;
      case 'top':
      default:
        left = screen.x - cw / 2;
        top = screen.y - ch - gap;
        break;
    }

    left += offsetX;
    top += offsetY;
    left = Math.max(edgeMargin, Math.min(left, W - cw - edgeMargin));
    top = Math.max(edgeMargin, Math.min(top, H - ch - edgeMargin));

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [screen.x, screen.y, placement, gap, offsetX, offsetY, edgeMargin]);

  // Bind the card's pointer enter/leave to the behaviour's hold/release (the
  // state logic lives in the behaviour) so resting on the card keeps it open.
  const hold = interactive
    ? () => canvas.behaviours.get<graph.HoverElementPreviewBehaviour>(previewId)?.holdOpen()
    : undefined;
  const release = interactive
    ? () => canvas.behaviours.get<graph.HoverElementPreviewBehaviour>(previewId)?.releaseHold()
    : undefined;

  return (
    <div
      ref={ref}
      className={`absolute ${interactive ? 'pointer-events-auto select-text' : 'pointer-events-none select-none'}`}
      style={{ zIndex }}
      onPointerEnter={hold}
      onPointerLeave={release}
    >
      {children}
    </div>
  );
}
