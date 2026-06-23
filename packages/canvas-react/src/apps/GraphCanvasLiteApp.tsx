/**
 * `<GraphCanvasLiteApp>` — a **single, batteries-included graph application**.
 *
 * One component: an `@invana/themes` `AppLayoutBase` shell with a `<Canvas>` in
 * the main area, a preset control toolbar baked into the header, and a live
 * status / message bar in the footer. Hand it `data` and it renders an
 * interactive, force-laid-out, theme-aware graph explorer — no shell/preset
 * split, no slot wiring.
 *
 * ```tsx
 * <GraphCanvasLiteApp data={graph} title="My graph" />
 * ```
 *
 * **Why the lifted context.** `AppLayoutBase` lays out `header` / `main` /
 * `footer` as siblings, so the header toolbar and footer bars sit *outside* the
 * `<Canvas>` subtree (and its `CanvasContext`). We publish the live engine up to
 * a lifted `CanvasContext.Provider` (via the internal {@link CanvasReady} bridge,
 * rendered last inside `<Canvas>`) so every header / footer control resolves the
 * same initialised `GraphCanvas`.
 *
 * This is the "Lite" cut — a deliberately lean, opinionated default (graph +
 * background, camera + select interaction, d3-force, theme-follow). Richer
 * batteries (minimap, inspector, context menus, dev overlay, overlay chrome) are
 * left for the full `GraphCanvasApp` once this shape is settled.
 */

import { type ReactNode, useEffect, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { AppLayoutBase } from '@invana/themes';
import { Moon, Sun } from 'lucide-react';

import { Canvas } from '../Canvas';
import { CanvasContext } from '../CanvasContext';
import { GraphCanvasContext, useGraphCanvas } from '../GraphCanvasContext';
import { BackgroundLayer } from '../layers/BackgroundLayer';
import { GraphLayer } from '../layers/GraphLayer';
import { D3ForceLayout } from '../layouts/D3ForceLayout';
import { DragPanBehaviour } from '../behaviours/DragPanBehaviour';
import { WheelZoomBehaviour } from '../behaviours/WheelZoomBehaviour';
import { DragNodeBehaviour } from '../behaviours/DragNodeBehaviour';
import { HoverActivateBehaviour } from '../behaviours/HoverActivateBehaviour';
import { ClickSelectBehaviour } from '../behaviours/ClickSelectBehaviour';
import { BrushSelectBehaviour } from '../behaviours/BrushSelectBehaviour';
import { LassoSelectBehaviour } from '../behaviours/LassoSelectBehaviour';
import { ColorByLabelBehaviour } from '../behaviours/ColorByLabelBehaviour';
import { type LayoutFactory, useGraphCanvasUpdate, useSystemTheme } from '../hooks';
import { CanvasMessageBar, GraphStatusBar, ToolbarItems, type ToolbarItem } from '../components';
import { GraphControlsToolbarLite } from '../toolbars/GraphControlsToolbar';

// ─── Baked defaults ──────────────────────────────────────────────────────────
// The opinionated explorer defaults this Lite app ships with. A consumer's
// `config` is deep-merged over these, so any single field can be overridden
// without restating the rest.

/** Id of the registered active layout — run on (re-)seed, pointed at by `activeLayout`. */
const ACTIVE_LAYOUT_ID = 'graph-force';

/** Force tuning for the active d3-force layout (settles off-thread, no visible drift). */
const FORCE_OPTS = {
  charge: { strength: -160 },
  link: { distance: 56 },
  collide: { radius: 14 },
  animate: false,
};

/** Distinct colour per node category (its `type`), assigned by `ColorByLabelBehaviour`. */
const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;

/** Theme-independent settings, keyed by instance id. Colours live in the theme patches below. */
const BASE_CONFIG: CanvasConfig = {
  activeLayout: ACTIVE_LAYOUT_ID,
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.5 },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 8 },
          bgStrokeWidth: 1.5,
          labelFontSize: 11,
          labelPlacement: 'bottom',
          labelOffsetY: 4,
        },
      },
      edge: { style: { strokeWidth: 1, arrowTargetShape: 'none' } },
    },
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    'drag-node': { enabled: true },
    hover: { enabled: true },
    'click-select': { enabled: true },
    // Registered but disarmed — the header's select-mode picker arms one at a time.
    'brush-select': { enabled: false },
    'lasso-select': { enabled: false },
  },
};

/** Light/dark colour patches pushed on theme change (OS follow + manual toggle). */
const THEME_LIGHT: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#e2e8f0' },
    graph: {
      node: { style: { labelColor: 0x334155, bgStrokeColor: 0xffffff } },
      edge: { style: { strokeColor: 0x475569, arrowTargetColor: 0x475569 } },
    },
  },
};
const THEME_DARK: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#1e293b' },
    graph: {
      node: { style: { labelColor: 0xe2e8f0, bgStrokeColor: 0x0f172a } },
      edge: { style: { strokeColor: 0x64748b, arrowTargetColor: 0x64748b } },
    },
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

/**
 * A chrome slot: either a static node, or a render fn handed the live engine
 * (`null` until the graph is fully wired) so the slot can gate on liveness —
 * e.g. only render a control once `canvas` exists. Slot content is **appended**
 * to the preset content in its region (the title, toolbar, theme toggle, status
 * / message bars stay); it augments, it doesn't replace.
 */
export type ChromeSlot = ReactNode | ((canvas: GraphCanvas | null) => ReactNode);

export interface GraphCanvasLiteAppProps {
  /** The graph to render. Reactive — assigning a new reference re-seeds + re-lays-out. */
  data: GraphData;
  /** Header brand text (header-left). Default `'Graph'`. */
  title?: ReactNode;
  /**
   * Serialisable canvas config, **deep-merged over the baked defaults**. Override
   * any single field (node radius, edge style, force params via `layouts`, …)
   * without restating the rest. Keep the reference stable.
   */
  config?: CanvasConfig;
  /** Node category resolver for the colour-by-label palette. Default `node.type`. */
  nodeCategory?: (node: GraphData['nodes'][number]) => string;
  /** Colour palette (one colour per distinct category). Default a built-in 11-hue set. */
  palette?: readonly number[];
  /** Layout-picker factories. Default a single `d3-force`. */
  layouts?: Record<string, LayoutFactory>;
  /** Labels for the layout picker. */
  layoutLabel?: Record<string, string>;
  /** Show the footer status + message bars. Default `true`. */
  showFooter?: boolean;
  /** Class on the layout root. */
  className?: string;
  /** Receives the live engine once every layer / behaviour has registered (or `null`). */
  onReady?: (canvas: GraphCanvas | null) => void;

  // ── Extension slots ─────────────────────────────────────────────────────────
  /**
   * Extra in-canvas children — appended inside `<Canvas>` (before the internal
   * ready bridge). Use to add layers / behaviours the preset omits, e.g. a
   * `<DevInfoLayer>` whose visibility you drive from a {@link headerRight} button
   * (lift the toggle state in your own parent so it flows into both props).
   */
  children?: ReactNode;
  /** Extra content appended **after** the title in the header-left region. */
  headerLeft?: ChromeSlot;
  /** Extra content appended **after** the preset toolbar in the header-center region. */
  headerCenter?: ChromeSlot;
  /** Extra content appended **after** the theme toggle in the header-right region. */
  headerRight?: ChromeSlot;
  /** Extra content appended **after** the status bar in the footer-left region. */
  footerLeft?: ChromeSlot;
  /** Extra content appended **after** the message bar in the footer-right region. */
  footerRight?: ChromeSlot;
}

/** Resolve a {@link ChromeSlot} against the live engine. */
function renderSlot(slot: ChromeSlot | undefined, canvas: GraphCanvas | null): ReactNode {
  return typeof slot === 'function'
    ? (slot as (c: GraphCanvas | null) => ReactNode)(canvas)
    : (slot ?? null);
}

// ─── Internal bridges (null-rendering <Canvas> children) ──────────────────────

/** Publishes the initialised engine up to the lifted `CanvasContext` (rendered last). */
function CanvasReady({ onReady }: { onReady: (canvas: GraphCanvas | null) => void }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}

/**
 * Runs the active layout whenever `data` changes and narrates progress on the
 * message channel. The `<D3ForceLayout id>` child only *registers* the layout;
 * this is what runs it on (re-)seed so nodes don't pile up at the origin.
 */
function RunLayoutOnData({ data }: { data: GraphData }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    if (!canvas || data.nodes.length === 0) return;
    canvas.showMessage(`Laying out ${data.nodes.length} nodes…`);
    void canvas.runLayout(ACTIVE_LAYOUT_ID).finally(() => canvas.showMessage('Graph ready', 3000));
  }, [canvas, data]);
  return null;
}

/** Follows the OS colour scheme by pushing the matching colour patch through `update()`. */
function SystemThemeFollower() {
  useSystemTheme(THEME_LIGHT, THEME_DARK);
  return null;
}

// ─── Header chrome ────────────────────────────────────────────────────────────

/** Header-right light/dark toggle — pushes a colour patch + flips the surrounding chrome. */
function LiteThemeToggle() {
  const update = useGraphCanvasUpdate();
  const [dark, setDark] = useState(osPrefersDark);
  const toggle = (): void => {
    const next = !dark;
    setDark(next);
    update(next ? THEME_DARK : THEME_LIGHT);
    applyChromeTheme(next);
  };
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'theme',
      icon: Sun,
      activeIcon: Moon,
      label: 'Switch to dark theme',
      activeLabel: 'Switch to light theme',
      active: dark,
      onToggle: toggle,
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function GraphCanvasLiteApp({
  data,
  title = 'Graph',
  config,
  nodeCategory,
  palette = PALETTE,
  layouts,
  layoutLabel,
  showFooter = true,
  className,
  onReady,
  children,
  headerLeft,
  headerCenter,
  headerRight,
  footerLeft,
  footerRight,
}: GraphCanvasLiteAppProps) {
  // Live engine, lifted out of <Canvas> by <CanvasReady>. Null until wired; the
  // header / footer chrome gates on it.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const mergedConfig = deepMerge(BASE_CONFIG, config);

  const canvasBody = (
    <Canvas autoResize config={mergedConfig}>
      <BackgroundLayer id="background" />
      <GraphLayer id="graph" data={data} />
      <ColorByLabelBehaviour
        targetLayerId="graph"
        palette={palette}
        colorEdges={false}
        {...(nodeCategory ? { nodeLabel: nodeCategory } : {})}
      />

      {/* Active layout: registered here, run on (re-)seed by <RunLayoutOnData>. */}
      <D3ForceLayout id={ACTIVE_LAYOUT_ID} targetLayerId="graph" options={FORCE_OPTS} />
      <RunLayoutOnData data={data} />
      <SystemThemeFollower />

      {/* Camera + interaction. */}
      <DragPanBehaviour id="pan" />
      <WheelZoomBehaviour id="wheel" />
      <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
      <HoverActivateBehaviour id="hover" targetLayerId="graph" state="highlighted" degree={1} />

      {/* Selection — click armed, brush / lasso registered for the header picker. */}
      <ClickSelectBehaviour id="click-select" targetLayerId="graph" multiple />
      <BrushSelectBehaviour id="brush-select" targetLayerId="graph" />
      <LassoSelectBehaviour id="lasso-select" targetLayerId="graph" />

      {/* Consumer-supplied in-canvas extras (extra layers / behaviours). */}
      {children}

      {/* Last child: publishes the live engine to the lifted context. */}
      <CanvasReady onReady={handleReady} />
    </Canvas>
  );

  function handleReady(c: GraphCanvas | null) {
    setCanvas(c);
    onReady?.(c);
  }

  // Compose a region as `preset` + an optional consumer slot, side by side. Null
  // when both are empty so an unused rail stays clean.
  const region = (preset: ReactNode, slot: ChromeSlot | undefined): ReactNode => {
    const extra = renderSlot(slot, canvas);
    if (preset == null && extra == null) return null;
    return (
      <span className="flex items-center gap-2">
        {preset}
        {extra}
      </span>
    );
  };

  const title$ = <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</span>;
  const footerActive = showFooter || footerLeft !== undefined || footerRight !== undefined;

  return (
    // Lifted context so the header toolbar + footer bars (siblings of <Canvas>)
    // resolve the same live engine.
    <CanvasContext.Provider value={canvas}>
      <GraphCanvasContext.Provider value={canvas}>
        <AppLayoutBase
          className={className}
          header={{
            left: region(title$, headerLeft),
            center: region(
              canvas ? <GraphControlsToolbarLite layouts={layouts} layoutLabel={layoutLabel} /> : null,
              headerCenter,
            ),
            right: region(canvas ? <LiteThemeToggle /> : null, headerRight),
          }}
          mainClassName="relative"
          main={canvasBody}
          footer={
            footerActive
              ? {
                  left: region(showFooter && canvas ? <GraphStatusBar /> : null, footerLeft),
                  right: region(showFooter && canvas ? <CanvasMessageBar /> : null, footerRight),
                }
              : {}
          }
        />
      </GraphCanvasContext.Provider>
    </CanvasContext.Provider>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Flip the surrounding `@invana/ui` / `AppLayoutBase` chrome tokens to match the canvas theme. */
function applyChromeTheme(dark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'default-dark' : 'default-light');
  root.classList.remove('theme-default-light', 'theme-default-dark', 'light', 'dark');
  root.classList.add(dark ? 'theme-default-dark' : 'theme-default-light', dark ? 'dark' : 'light');
}

/** Whether the OS currently prefers a dark colour scheme. */
function osPrefersDark(): boolean {
  return (
    typeof window !== 'undefined'
    && !!window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** Recursive merge of `override` onto `base` (objects merge, everything else replaces). */
function deepMerge<T>(base: T, override: Partial<T> | undefined): T {
  if (!override) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(override)) {
    const prev = (base as Record<string, unknown>)[k];
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) && prev && typeof prev === 'object'
        ? deepMerge(prev as object, v as object)
        : v;
  }
  return out as T;
}
