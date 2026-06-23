/**
 * `<StoryCanvasShell>` — the **generic, use-case-agnostic host** every
 * `@invana/canvas-react` story is built on. It owns *only* the concerns shared by
 * every canvas-react app, and leaves everything domain-specific to its slots and
 * escape hatches, so the *same* shell drives a read-only visualiser, a drawing
 * modeller, a live-streaming feed, or a dataset switcher:
 *
 *   - **Lifted engine context.** `AppLayoutBase` lays out `header` / `main` /
 *     `footer` as siblings, but the `<Canvas>` (and its own `CanvasContext`) lives
 *     *inside* `main`. So the header / footer chrome sits **outside** the canvas
 *     subtree. This shell lifts a `CanvasContext.Provider` (fed by the internal
 *     {@link CanvasBridge}, rendered as the **last** `<Canvas>` child) **above**
 *     `AppLayoutBase`, so every header / footer control resolves the same live
 *     engine once it's fully wired.
 *   - **Slots, not hardcoded chrome.** `header.{left,center,right}` and
 *     `footer.{left,right}` take any node — or a `(canvas) => node` render fn so a
 *     slot can gate on engine liveness. The `<Canvas>` body is `children`.
 *   - **`wrap` escape hatch.** A `(shell) => node` wrapper around the whole shell
 *     (incl. the lifted `CanvasContext`) for arbitrary lifted providers — a
 *     `GraphToolProvider`, a lifted `HistoryContext` fed by a bridge child, etc.
 *     This is what lets a modeller's header toolbar and its in-canvas drawing
 *     behaviours share the same tool + history state.
 *   - **Remount keying.** `backend` (render-backend switch) and `instanceKey` (an
 *     explicit reset token, e.g. a streaming demo's run id) both key the
 *     `<Canvas>`, so flipping either tears the engine down and re-inits it clean.
 *
 * The batteries-included visualiser lives in {@link StoryGraphApp}, which is just
 * this core plus a graph layer, the built-in behaviour set, the header toolbar,
 * and the footer status bars. Modeller / streaming / dynamic-data stories compose
 * this core directly with their own children + slots.
 */

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Canvas,
  type CanvasConfig,
  CanvasContext,
  DevInfoLayer,
  type DevInfoLayerProps,
  type ToolbarItem,
  ToolbarItems,
} from '@invana/canvas-react';
import { AppLayoutBase } from '@invana/themes';
import { Gauge } from 'lucide-react';
import type { GraphCanvas } from '@invana/graph';

import { type CanvasBackend } from './shell-config';
import { CanvasBridge, applyChromeTheme, osPrefersDark } from './shell-bridges';

/**
 * A chrome slot: either a static node, or a render fn handed the live engine
 * (`null` until the graph is fully wired) so the slot can gate on liveness.
 */
export type ShellSlot = ReactNode | ((canvas: GraphCanvas | null) => ReactNode);

export interface StoryCanvasShellProps {
  // ── Canvas ────────────────────────────────────────────────────────────────
  /** Serialisable config handed to `<Canvas>`. */
  config?: CanvasConfig;
  /**
   * Everything *inside* `<Canvas>`: layers, behaviours, layouts, in-canvas
   * providers, and any bridge children. The internal {@link CanvasBridge} is
   * appended automatically as the last child, so the lifted context only
   * publishes once these have all registered.
   */
  children: ReactNode;
  /**
   * Render backend (PixiJS). Keys the `<Canvas>` — switching it remounts the
   * engine so pixi re-inits with the chosen renderer. Omit for the engine
   * default (no backend switcher).
   */
  backend?: CanvasBackend;
  /**
   * Explicit reset token folded into the `<Canvas>` key alongside {@link backend}.
   * Bump it to force a clean remount (fresh engine + store) — e.g. a streaming
   * demo's "reset" button.
   */
  instanceKey?: string | number;

  // ── Chrome slots ────────────────────────────────────────────────────────────
  /**
   * Header slots. Each is a node or a `(canvas) => node` render fn. Omit it (and
   * set `devInfo={false}`) to drop the header bar entirely — an absent rail
   * collapses, it isn't rendered empty.
   */
  header?: { left?: ShellSlot; center?: ShellSlot; right?: ShellSlot };
  /**
   * Footer slots (node or render fn). Omit it or pass `false` to drop the footer
   * bar entirely — an absent rail collapses, it isn't rendered empty.
   */
  footer?: { left?: ShellSlot; right?: ShellSlot } | false;
  /** `className` on `AppLayoutBase`'s main. Default `'relative'` (so in-canvas `<Panel>`s anchor to it). */
  mainClassName?: string;

  // ── Built-in dev overlay ────────────────────────────────────────────────────
  /**
   * Built-in dev-overlay (FPS / pointer / zoom) toggle, shown in **every** story's
   * header (rightmost, before any story `header.right`) and mounting a
   * `<DevInfoLayer>` while on. The overlay anchors **top-left** by default (the
   * minimap sits bottom-left). `false` omits it; an options object overrides the
   * layer defaults (e.g. `{ corner: 'top-right' }`). Default `true` — present, off
   * initially.
   */
  devInfo?: boolean | Partial<DevInfoLayerProps>;
  /** Initial state of the dev-overlay toggle. Default `false` (off). */
  devInfoInitiallyOn?: boolean;

  // ── Extension points ────────────────────────────────────────────────────────
  /**
   * Wrap the whole shell (the lifted `CanvasContext` + `AppLayoutBase`) in
   * arbitrary providers. Use for lifted state the header / footer chrome must
   * share with in-canvas children — a `GraphToolProvider`, a lifted
   * `HistoryContext`, etc.
   */
  wrap?: (shell: ReactNode) => ReactNode;
  /** Receives the live engine once every layer / behaviour has registered (or `null`). */
  onReady?: (canvas: GraphCanvas | null) => void;
  /**
   * Restore the OS chrome theme on unmount (so a story that pinned light/dark
   * doesn't leak its choice into the next story). Default `true`.
   */
  restoreThemeOnUnmount?: boolean;
}

/** Resolve a {@link ShellSlot} against the live engine. */
function renderSlot(slot: ShellSlot | undefined, canvas: GraphCanvas | null): ReactNode {
  return typeof slot === 'function' ? (slot as (c: GraphCanvas | null) => ReactNode)(canvas) : slot ?? null;
}

export function StoryCanvasShell({
  config,
  children,
  backend,
  instanceKey,
  header,
  footer,
  mainClassName = 'relative',
  devInfo = true,
  devInfoInitiallyOn = false,
  wrap,
  onReady,
  restoreThemeOnUnmount = true,
}: StoryCanvasShellProps) {
  // The live canvas, lifted out of <Canvas> by <CanvasBridge>. Null until the
  // graph is fully wired; the chrome slots gate on it.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const handleReady = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      onReady?.(c);
    },
    [onReady],
  );

  // A pinned chrome theme (set by a story's theme toggle) is restored to the OS
  // preference on unmount so it doesn't bleed into the next story.
  useEffect(() => {
    if (!restoreThemeOnUnmount) return;
    return () => applyChromeTheme(osPrefersDark());
  }, [restoreThemeOnUnmount]);

  // Built-in dev overlay — the toggle lives in the header (so every story gets
  // it), the layer mounts as a <Canvas> child while on. Mount/unmount (not the
  // engine's `enabled` flag) is what shows / hides the overlay.
  const [devInfoOn, setDevInfoOn] = useState(devInfoInitiallyOn);
  const toggleDevInfo = useCallback(() => setDevInfoOn((v) => !v), []);
  const devInfoEnabled = devInfo !== false;
  const devInfoOpts = typeof devInfo === 'object' ? devInfo : undefined;

  // Remount key — backend switch and/or explicit reset token. Stable when both
  // are omitted (no spurious remounts for stories that use neither).
  const canvasKey = `${backend ?? 'default'}:${instanceKey ?? ''}`;

  // The <Canvas> subtree — the same body whichever layout (chromed or bare) hosts
  // it. The internal CanvasBridge stays last so the lifted context publishes only
  // once every layer / behaviour above it has registered.
  const canvasBody = (
    <Canvas key={canvasKey} autoResize preference={backend} config={config}>
      {children}
      {/* Screen-fixed dev overlay, mounted only while the header toggle is on
          (mount/unmount is what shows / hides it). Before the CanvasBridge so the
          bridge stays the last child. Anchored top-left by default — the minimap
          sits bottom-left, so the two don't overlap; a story can override via
          `devInfo={{ corner: … }}`. */}
      {devInfoEnabled && devInfoOn ? (
        <DevInfoLayer id="dev-info" corner="top-left" {...devInfoOpts} />
      ) : null}
      {/* Last child: publishes the live engine once everything registered. */}
      <CanvasBridge onReady={handleReady} />
    </Canvas>
  );

  // Resolved chrome content. The built-in dev-overlay toggle sits to the left of
  // any story-provided header.right (theme toggle, etc.), so every story carries it.
  const headerRight = (
    <>
      {devInfoEnabled ? <DevInfoToggleButton on={devInfoOn} onToggle={toggleDevInfo} /> : null}
      {renderSlot(header?.right, canvas)}
    </>
  );
  const footerSlots = footer !== false && footer != null ? footer : null;

  // Whether each rail has any chrome — computed from *prop presence* (not the
  // live-canvas-resolved nodes), so the layout shape is stable and never flips
  // once the engine wires up. A rail with no chrome is omitted entirely (no empty
  // bar): pass no `header` / `footer` (and `devInfo={false}`) for a chrome-less shell.
  const hasHeader =
    devInfoEnabled
    || !!(header && (header.left !== undefined || header.center !== undefined || header.right !== undefined));
  const hasFooter = !!footerSlots && (footerSlots.left !== undefined || footerSlots.right !== undefined);

  // Full-chrome stories keep AppLayoutBase verbatim (its NavHorizontal rails,
  // spacing, tooltips). When a rail is missing we drop to a bare flex column that
  // renders only the rails that have content — collapsing the empty bar.
  const body =
    hasHeader && hasFooter ? (
      <AppLayoutBase
        header={{
          left: renderSlot(header?.left, canvas),
          center: renderSlot(header?.center, canvas),
          right: headerRight,
        }}
        mainClassName={mainClassName}
        main={canvasBody}
        footer={{ left: renderSlot(footerSlots?.left, canvas), right: renderSlot(footerSlots?.right, canvas) }}
      />
    ) : (
      <div className="flex h-screen flex-col bg-background text-foreground">
        {hasHeader ? (
          <div className="flex h-[40px] shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3">
            <div className="flex items-center gap-2">{renderSlot(header?.left, canvas)}</div>
            <div className="flex items-center gap-2">{renderSlot(header?.center, canvas)}</div>
            <div className="flex items-center gap-2">{headerRight}</div>
          </div>
        ) : null}
        <div className={`w-full flex-1 bg-background ${mainClassName}`}>{canvasBody}</div>
        {hasFooter ? (
          <div className="flex h-[25px] shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3">
            <div className="flex items-center gap-2">{renderSlot(footerSlots?.left, canvas)}</div>
            <div className="flex items-center gap-2">{renderSlot(footerSlots?.right, canvas)}</div>
          </div>
        ) : null}
      </div>
    );

  // Lifted context: header + footer chrome (siblings of <Canvas>, outside the
  // canvas's own provider) resolve the live engine.
  const shell = <CanvasContext.Provider value={canvas}>{body}</CanvasContext.Provider>;

  return <>{wrap ? wrap(shell) : shell}</>;
}

/**
 * The built-in dev-overlay toggle button — a single data-driven `<ToolbarItems>`
 * so it matches the design-kit toolbar buttons the stories already use. Pure
 * (state + callback owned by the shell); toggling it mounts / unmounts the
 * `<DevInfoLayer>`.
 */
function DevInfoToggleButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'dev-info',
      icon: Gauge,
      label: 'Dev overlay: off',
      activeLabel: 'Dev overlay: on',
      active: on,
      onToggle,
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}
