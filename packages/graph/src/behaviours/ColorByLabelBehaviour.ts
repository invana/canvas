/**
 * `ColorByLabelBehaviour` — assigns a **unique colour per distinct label** to
 * nodes and edges, so a graph reads as coloured-by-category (the common "colour
 * by node/edge type" view in graph explorers).
 *
 * "Label" is whatever a per-item accessor returns — by default each item's
 * `type` (the graph-DB label / predicate), but any categorical field works
 * (e.g. a community id). Each distinct value is handed the next colour from a
 * palette, in order of first appearance, and remembered — so the same label
 * always maps to the same colour (build a legend from {@link getColorMap}).
 *
 * It applies the colours as **field resolvers on the layer template** —
 * `bgFill` for nodes (via `setNodeDefaults`), `strokeColor` + `arrowTargetColor`
 * for edges (via `setEdgeDefaults`). Because the colour lives on the template as
 * a function of the item, **new nodes/edges are coloured automatically** as they
 * arrive — no per-item loop, no re-apply wiring. The template only sets these
 * specific fields, so other styling (shape, size, label, node border) is
 * untouched; run a `ThemeBehaviour` for those alongside.
 *
 * Default `enabled: false` — register, then explicitly enable. On disable it
 * restores whatever those template fields held before (best effort).
 *
 * **Precedence — applied once, overridable.** It writes its resolvers to the
 * template a single time on enable and never re-applies (the resolvers colour
 * new items automatically). Any behaviour that writes the same template fields
 * *after* it therefore wins. In particular `ThemeBehaviour` — whose published
 * palette drives the layer to re-apply its `node` / `edge` defaults on every
 * theme change — overrides this behaviour for whatever fields it sets. Its base
 * recolour touches `labelColor` / `bgStrokeColor` (node) and `strokeColor`
 * (edge), **not** `bgFill`, so the label colour-by-category fills sit alongside
 * the theme's border/label colours rather than fighting them. Register
 * `ColorByLabelBehaviour` and let the theme own the non-fill fields.
 *
 * @example
 * ```ts
 * // colour by type (default)
 * canvas.behaviours.register(
 *   new ColorByLabelBehaviour({ id: 'color', targetLayerId: 'graph', enabled: true }),
 * );
 * // colour nodes by a custom categorical field, edges left alone
 * new ColorByLabelBehaviour({
 *   id: 'color', targetLayerId: 'graph', enabled: true,
 *   colorEdges: false,
 *   nodeLabel: (n) => `community-${(n.data as { group: number }).group}`,
 * });
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { EdgeStyle, NodeStyle } from '../layer/types';
import type { GraphEdge, GraphNode } from '../store/types';

/** Maps an item to its categorical label (the colour key). `null`/empty → fallback colour. */
export type ColorLabelAccessor<T> = (item: T) => string | null | undefined;

/**
 * Default 12-colour categorical palette (0xRRGGBB) — distinct hues that read on
 * both light and dark backgrounds. Cycled when a graph has more labels than
 * colours. Override via {@link ColorByLabelBehaviourOptions.palette}.
 */
export const DEFAULT_LABEL_PALETTE: readonly number[] = [
  0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x06b6d4, 0xeab308, 0x14b8a6,
  0xa3e635, 0xf97316, 0x6366f1,
];

/** Constructor options for `ColorByLabelBehaviour`. */
export interface ColorByLabelBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour colours. */
  targetLayerId: string;
  /** Colours (0xRRGGBB) cycled per distinct label. Default {@link DEFAULT_LABEL_PALETTE}. */
  palette?: readonly number[];
  /** Per-node label accessor. Default: `node.type`. */
  nodeLabel?: ColorLabelAccessor<GraphNode>;
  /** Per-edge label accessor. Default: `edge.type`. */
  edgeLabel?: ColorLabelAccessor<GraphEdge>;
  /** Colour nodes (their `bgFill`). Default `true`. */
  colorNodes?: boolean;
  /** Colour edges (their `strokeColor` + `arrowTargetColor`). Default `true`. */
  colorEdges?: boolean;
  /** Colour for items whose label is missing/empty. Default `0x9ca3af` (grey). */
  fallbackColor?: number;
}

/** Snapshot of a template field so disable can restore it. */
type Resolvable<T> = T | ((item: never) => T) | undefined;

export class ColorByLabelBehaviour extends Behaviour<ColorByLabelBehaviourOptions> {
  private layer: GraphLayer | null = null;

  // Live-read from `_options` so `setOptions` applies. The installed resolvers
  // close over these getters, and `onOptionsChanged` re-applies so a palette /
  // accessor / flag change recolours immediately.
  private get palette(): readonly number[] {
    return this._options.palette && this._options.palette.length > 0
      ? this._options.palette
      : DEFAULT_LABEL_PALETTE;
  }
  private get nodeLabel(): ColorLabelAccessor<GraphNode> {
    return this._options.nodeLabel ?? ((n) => n.type);
  }
  private get edgeLabel(): ColorLabelAccessor<GraphEdge> {
    return this._options.edgeLabel ?? ((e) => e.type);
  }
  private get colorNodes(): boolean { return this._options.colorNodes ?? true; }
  private get colorEdges(): boolean { return this._options.colorEdges ?? true; }
  private get fallbackColor(): number { return this._options.fallbackColor ?? 0x9ca3af; }

  /** label → assigned colour. Grows as new labels are first seen. */
  private readonly colors = new Map<string, number>();
  private nextIndex = 0;

  /** True while the resolvers are installed on the template. */
  private applied = false;
  /** Prior template fields, captured on `apply` and put back on `restore`. */
  private priorNodeBgFill: Resolvable<NodeStyle['bgFill']> = undefined;
  private priorEdgeStroke: Resolvable<EdgeStyle['strokeColor']> = undefined;
  private priorEdgeArrow: Resolvable<EdgeStyle['arrowTargetColor']> = undefined;

  constructor(opts: ColorByLabelBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `ColorByLabelBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
  }

  protected override onEnable(): void {
    this.apply();
  }

  protected override onDisable(): void {
    this.restore();
  }

  protected override onDestroy(): void {
    this.restore();
    this.layer = null;
  }

  /**
   * Re-apply the colour resolvers when a live option patch lands, so a new
   * `palette` / accessor / fallback change recolours immediately. Restores the
   * previously-installed template fields, resets the label→colour assignment
   * map (so a new palette re-assigns from scratch), then re-installs. A no-op
   * while disabled — the resolvers aren't installed, and the next enable picks
   * up the merged `_options`.
   *
   * Known limitation: toggling `colorNodes` / `colorEdges` *off* while enabled
   * relies on the flag-guarded {@link restore}, which won't uninstall a
   * channel's resolver until the behaviour is disabled.
   */
  protected override onOptionsChanged(): void {
    if (!this.isEnabled || !this.layer) return;
    this.restore();
    this.colors.clear();
    this.nextIndex = 0;
    this.apply();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Live label → colour mapping — read it to build a legend. */
  getColorMap(): ReadonlyMap<string, number> {
    return this.colors;
  }

  /** The colour for a label, assigning the next palette colour on first sight. */
  colorForLabel(label: string | null | undefined): number {
    if (label == null || label === '') return this.fallbackColor;
    let colour = this.colors.get(label);
    if (colour === undefined) {
      colour = this.palette[this.nextIndex % this.palette.length]!;
      this.nextIndex += 1;
      this.colors.set(label, colour);
    }
    return colour;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  /** Install the colour resolvers on the layer template (snapshotting priors). */
  private apply(): void {
    const layer = this.layer;
    if (!layer || this.applied) return;

    if (this.colorNodes) {
      this.priorNodeBgFill = layer.nodeDefaults?.bgFill;
      const bgFill = (n: GraphNode): number => this.colorForLabel(this.nodeLabel(n));
      // The template stores resolver functions (`ResolvableNodeStyle`), but the
      // `setNodeDefaults` param is the concrete `NodeStyle`, so cast the patch.
      layer.setNodeDefaults({ bgFill } as unknown as Partial<NodeStyle>);
    }

    if (this.colorEdges) {
      this.priorEdgeStroke = layer.edgeDefaults?.strokeColor;
      this.priorEdgeArrow = layer.edgeDefaults?.arrowTargetColor;
      const colour = (e: GraphEdge): number => this.colorForLabel(this.edgeLabel(e));
      layer.setEdgeDefaults({
        strokeColor: colour,
        arrowTargetColor: colour,
      } as unknown as Partial<EdgeStyle>);
    }

    this.applied = true;
  }

  /** Put the snapshotted template fields back. */
  private restore(): void {
    const layer = this.layer;
    if (!layer || !this.applied) return;

    if (this.colorNodes) {
      layer.setNodeDefaults({ bgFill: this.priorNodeBgFill } as unknown as Partial<NodeStyle>);
    }
    if (this.colorEdges) {
      layer.setEdgeDefaults({
        strokeColor: this.priorEdgeStroke,
        arrowTargetColor: this.priorEdgeArrow,
      } as unknown as Partial<EdgeStyle>);
    }
    this.applied = false;
  }
}
