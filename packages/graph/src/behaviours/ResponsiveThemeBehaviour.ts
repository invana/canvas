/**
 * `ResponsiveThemeBehaviour` — keeps a `GraphLayer`'s theme-dependent styling in
 * sync with the host's colour scheme.
 *
 * It owns the *entire* theme-driven look of graph content via three `light` /
 * `dark` variant pairs:
 *   - `node` — applied to every node through `setNodeDefaults` (shallow-merge into
 *     the shared template, re-rendering every node).
 *   - `edge` — applied to every edge through `setEdgeDefaults`.
 *   - `group` — applied *only* to group nodes (those carrying `style.group`),
 *     layered on top of `node`. Since the engine has no group template /
 *     `setGroupDefaults`, group variants are written per-group-node via
 *     `store.updateNode` and re-applied as groups are added.
 *
 * Background theming is deliberately *not* this behaviour's job — that stays with
 * `BackgroundLayer` (`{ light, dark }` colour props) / `ThemedBackgroundLayer`.
 *
 * Why a behaviour and not React state: the declarative `<GraphLayer>` wrapper
 * applies its `node`/`edge` style props only at mount, so React-state colour
 * changes wouldn't reach existing — or freshly-drawn — items. Patching the layer
 * template imperatively does, and new nodes inherit the patched template.
 *
 * `mode`:
 *   - `'auto'` (default) — follows the host's `prefers-color-scheme`, flipping
 *     live when the OS appearance changes.
 *   - `'light'` / `'dark'` — pin a variant explicitly.
 *
 * Lifecycle:
 *   - `onEnable()`  — arm the media query (when `auto`) and apply the resolved
 *                     variant immediately.
 *   - `onDisable()` — detach the media query. The layer keeps the last applied
 *                     defaults (no revert — there is no "un-themed" baseline to
 *                     restore to).
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ResponsiveThemeBehaviour({
 *     id: 'theme',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     node: {
 *       light: { bgStrokeColor: 0xffffff },
 *       dark:  { bgStrokeColor: 0x0f172a },
 *     },
 *     edge: {
 *       light: { strokeColor: 0xcbd5e1 },
 *       dark:  { strokeColor: 0x475569 },
 *     },
 *     group: {
 *       light: { bgFill: 0xeef2ff, bgStrokeColor: 0x6b7fff },
 *       dark:  { bgFill: 0x1e293b, bgStrokeColor: 0x475569 },
 *     },
 *   }),
 * );
 * ```
 *
 * @remarks
 * The `group` pass tracks `node:add` / `flush`, so groups present at `setData`
 * and groups added afterwards are themed. A node that *becomes* a group later via
 * `node:update` is not re-themed (we don't watch `node:update`, to avoid a write
 * loop with our own `updateNode` calls).
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { EdgeStyle, NodeStyle } from '../layer/types';

/** The concrete variant currently being applied after mode resolution. */
export type ThemeKind = 'light' | 'dark';

/** Mode selector. `'auto'` follows `prefers-color-scheme`; the rest pin. */
export type ThemeMode = 'auto' | 'light' | 'dark';

/** A light / dark pair of style patches; each side is optional. */
export interface ThemeVariants<S> {
  /** Patch applied when the resolved kind is `'light'`. */
  light?: Partial<S>;
  /** Patch applied when the resolved kind is `'dark'`. */
  dark?: Partial<S>;
}

/** Constructor options for `ResponsiveThemeBehaviour`. */
export interface ResponsiveThemeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour themes. */
  targetLayerId: string;

  /**
   * How light vs dark is decided. `'auto'` (default) follows the host's
   * `prefers-color-scheme`; `'light'` / `'dark'` pin a variant.
   */
  mode?: ThemeMode;

  /**
   * Node style applied per resolved kind via `setNodeDefaults` (shallow-merge
   * into the layer's node template). Omit a side to leave it unthemed.
   */
  node?: ThemeVariants<NodeStyle>;

  /**
   * Edge style applied per resolved kind via `setEdgeDefaults` (shallow-merge
   * into the layer's edge template). Omit a side to leave it unthemed.
   */
  edge?: ThemeVariants<EdgeStyle>;

  /**
   * Style applied to group nodes only (those with `style.group`), layered on top
   * of `node`. Full `NodeStyle` per resolved kind. Because the engine has no
   * group template, this is written per-group-node via `store.updateNode` and
   * re-applied as groups are added. Omit a side to leave it unthemed.
   */
  group?: ThemeVariants<NodeStyle>;
}

export class ResponsiveThemeBehaviour extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  private layer: GraphLayer | null = null;

  private mode: ThemeMode;
  private node?: ThemeVariants<NodeStyle>;
  private edge?: ThemeVariants<EdgeStyle>;
  private group?: ThemeVariants<NodeStyle>;

  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: (() => void) | null = null;

  /** Store-event disposers for the group re-theme subscription. */
  private readonly subs: Array<() => void> = [];

  /** Microtask debounce flag — coalesces bursts of `node:add` / `flush`. */
  private groupApplyScheduled = false;

  /** Re-entrancy guard — set while our own `updateNode` writes are in flight. */
  private patching = false;

  constructor(opts: ResponsiveThemeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.mode = opts.mode ?? 'auto';
    this.node = opts.node;
    this.edge = opts.edge;
    this.group = opts.group;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `ResponsiveThemeBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    // Group variants are written per-group-node (no group template exists), so
    // re-apply when groups appear. `node:add` covers live inserts; `flush`
    // covers bulk `setData`. We skip `node:update` to avoid feedback from our
    // own `updateNode` writes (cf. DegreeSizeBehaviour).
    if (this.group) {
      const schedule = (): void => this.scheduleGroupApply();
      this.subs.push(
        layer.store.events.on('node:add', schedule),
        layer.store.events.on('flush', schedule),
      );
    }
  }

  protected override onEnable(): void {
    this.wireMediaQuery();
    this.applyTheme();
  }

  protected override onDisable(): void {
    this.detachMediaQuery();
  }

  protected override onDestroy(): void {
    this.detachMediaQuery();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Current mode setting. */
  getMode(): ThemeMode {
    return this.mode;
  }

  /** Concrete kind currently resolved from the mode. */
  getResolvedKind(): ThemeKind {
    return resolveKind(this.mode);
  }

  /**
   * Switch mode. `'auto'` re-arms the system listener; `'light'` / `'dark'`
   * detach it and pin. Re-applies immediately when enabled.
   */
  setMode(mode: ThemeMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    if (!this.isEnabled) return;
    this.wireMediaQuery();
    this.applyTheme();
  }

  /**
   * Replace the light/dark style variants. Re-applies immediately when enabled
   * so live tweaking (e.g. from a GUI) is visible without an extra call.
   */
  setVariants(variants: {
    node?: ThemeVariants<NodeStyle>;
    edge?: ThemeVariants<EdgeStyle>;
    group?: ThemeVariants<NodeStyle>;
  }): void {
    if ('node' in variants) this.node = variants.node;
    if ('edge' in variants) this.edge = variants.edge;
    if ('group' in variants) this.group = variants.group;
    if (this.isEnabled) this.applyTheme();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  /** Resolve the active kind and push its variants onto the layer. */
  private applyTheme(): void {
    const layer = this.layer;
    if (!layer) return;
    const kind = resolveKind(this.mode);
    const nodePatch = this.node?.[kind];
    if (nodePatch) layer.setNodeDefaults(nodePatch);
    const edgePatch = this.edge?.[kind];
    if (edgePatch) layer.setEdgeDefaults(edgePatch);
    const groupPatch = this.group?.[kind];
    if (groupPatch) this.applyGroupTheme(groupPatch);
  }

  /**
   * Write the group variant onto every group node, layered over its current
   * style. There is no group template, so this targets instances directly; the
   * per-instance style wins over the node template, giving groups
   * `node[kind]` (base) + `group[kind]` (override).
   */
  private applyGroupTheme(patch: Partial<NodeStyle>): void {
    const layer = this.layer;
    if (!layer) return;
    const store = layer.store;
    this.patching = true;
    try {
      for (const node of store.nodes()) {
        if (!layer.isGroupNode(node)) continue;
        const prevStyle = (node.style ?? {}) as NodeStyle;
        store.updateNode(node.id, { style: { ...prevStyle, ...patch } });
      }
    } finally {
      this.patching = false;
    }
  }

  /**
   * Microtask-debounced re-apply of the group pass when new group nodes appear.
   * Node/edge variants need no rescheduling — they live on the template, so new
   * nodes inherit them automatically.
   */
  private scheduleGroupApply(): void {
    if (!this.isEnabled || this.patching || this.groupApplyScheduled) return;
    this.groupApplyScheduled = true;
    queueMicrotask(() => {
      this.groupApplyScheduled = false;
      if (!this.isEnabled) return;
      const groupPatch = this.group?.[resolveKind(this.mode)];
      if (groupPatch) this.applyGroupTheme(groupPatch);
    });
  }

  /**
   * Arm the `prefers-color-scheme` listener when in `'auto'` mode; detach it
   * otherwise. A system flip re-applies the resolved variant.
   */
  private wireMediaQuery(): void {
    if (this.mode !== 'auto') {
      this.detachMediaQuery();
      return;
    }
    if (this.mediaQuery) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaListener = () => {
      if (this.mode !== 'auto' || !this.isEnabled) return;
      this.applyTheme();
    };
    this.mediaQuery.addEventListener('change', this.mediaListener);
  }

  private detachMediaQuery(): void {
    if (this.mediaQuery && this.mediaListener) {
      this.mediaQuery.removeEventListener('change', this.mediaListener);
    }
    this.mediaQuery = null;
    this.mediaListener = null;
  }
}

/** SSR-safe kind resolver. `'auto'` reads the media query; defaults to light. */
function resolveKind(mode: ThemeMode): ThemeKind {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
