// The default header toolbar for the story shell — the whole bar as one
// data-driven `<ToolbarItems>`, assembled from the canvas-react section hooks.
// Every section is individually toggleable via `sections`, so a story can show
// just the controls it cares about. Layout *application* is owned by
// `<AutoLayoutBridge>` (so it works with the toolbar hidden), hence
// `useLayout({ applyInitial: false })`.

import { useEffect, useRef, useState } from 'react';
import {
  type LayoutFactory,
  type ToolbarItem,
  ToolbarItems,
  canUseWebGPU,
  useCanvas,
  useEditorSection,
  useGraphCanvasUpdate,
  useGrid,
  useHistorySection,
  useLayout,
  useSelectMode,
  useStyleEditorSection,
  useViewSection,
  GraphClipboardProvider,
  GraphHistoryProvider,
} from '@invana/canvas-react';
import { ToggleGroup, ToggleGroupItem } from '@invana/ui';
import {
  ClipboardPaste,
  Copy,
  Eraser,
  Grid3x3,
  Lock,
  LockOpen,
  Magnet,
  Maximize,
  Moon,
  Play,
  Redo2,
  RefreshCw,
  Scissors,
  Sun,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import {
  APP_DARK,
  APP_LIGHT,
  type CanvasBackend,
  BACKEND_LABEL,
  DEFAULT_LAYOUTS,
  DEFAULT_LAYOUT_LABEL,
  EDGE_TYPE_ICONS,
  SELECT_HINT,
  SELECT_ICONS,
  SELECT_LABEL,
  SELECT_MODE_IDS,
} from './shell-config';
import { applyChromeTheme, osPrefersDark } from './shell-bridges';

/** Per-section visibility for the header toolbar (every section defaults on). */
export interface ToolbarSections {
  /** Undo / redo. */
  history?: boolean;
  /** Layout picker + run + re-render. */
  layout?: boolean;
  /** Click / brush / lasso select-mode picker. */
  selectMode?: boolean;
  /** Edge-routing style editor. */
  style?: boolean;
  /** Cut / copy / paste / erase. */
  edit?: boolean;
  /** Zoom in / out · fit · lock. */
  view?: boolean;
  /** Grid toggle. */
  grid?: boolean;
  /** WebGL / WebGPU renderer switcher. */
  backend?: boolean;
  /** Hover-highlight-neighbours (magnet) toggle. */
  magnet?: boolean;
}

export interface HeaderToolbarProps {
  magnet: boolean;
  onToggleMagnet: () => void;
  backend: CanvasBackend;
  onBackendChange: (backend: CanvasBackend) => void;
  /** Graph layer id the section hooks read. Default `'graph'`. */
  layerId?: string;
  /** Layout picker factories. Default {@link DEFAULT_LAYOUTS}. */
  layouts?: Record<string, LayoutFactory>;
  /** Layout picker labels. Default {@link DEFAULT_LAYOUT_LABEL}. */
  layoutLabel?: Record<string, string>;
  /** Which sections to render. Omitted keys default on. */
  sections?: ToolbarSections;
}

/**
 * The canvas toolbar that fills the shell header. Wrapped in the history +
 * clipboard providers (over the graph store) that the history / edit sections
 * consume — it only mounts once the engine (and thus the layer) is live, so the
 * providers find the store immediately.
 */
export function HeaderToolbar(props: HeaderToolbarProps) {
  const layerId = props.layerId ?? 'graph';
  // The builder hooks read the history / clipboard providers, so item assembly
  // lives in a child mounted *inside* them.
  return (
    <GraphHistoryProvider layerId={layerId}>
      <GraphClipboardProvider layerId={layerId}>
        <HeaderToolbarItems {...props} />
      </GraphClipboardProvider>
    </GraphHistoryProvider>
  );
}

function HeaderToolbarItems({
  magnet,
  onToggleMagnet,
  backend,
  onBackendChange,
  layerId = 'graph',
  layouts = DEFAULT_LAYOUTS,
  layoutLabel = DEFAULT_LAYOUT_LABEL,
  sections,
}: HeaderToolbarProps) {
  // Live engine — the header only renders once it's live, so this is non-null.
  const canvas = useCanvas();

  // Section visibility (default every section on). Hooks below are still called
  // unconditionally — only their *items* are gated.
  const s: Required<ToolbarSections> = {
    history: true,
    layout: true,
    selectMode: true,
    style: true,
    edit: true,
    view: true,
    grid: true,
    backend: true,
    magnet: true,
    ...sections,
  };

  // Named sections.
  const history = useHistorySection({ icons: { undo: Undo2, redo: Redo2 } });
  // `applyInitial: false` — the active layout is run by <AutoLayoutBridge>, not
  // the picker, so it works even when the toolbar is hidden. The picker applies
  // its own instance on demand.
  const { layout, layoutOptions, applyLayout, isRunning } = useLayout(layouts, {
    layerId,
    labels: layoutLabel,
    initial: Object.keys(layouts)[0],
    applyInitial: false,
  });
  // Surface layout progress on the canvas message channel.
  const wasRunning = useRef(false);
  useEffect(() => {
    const label = layoutLabel[layout] ?? layout;
    if (isRunning && !wasRunning.current) canvas.showMessage(`Running ${label} layout…`);
    else if (!isRunning && wasRunning.current) canvas.showMessage(`${label} layout ready`, 3000);
    wasRunning.current = isRunning;
  }, [isRunning, layout, layoutLabel, canvas]);
  const editor = useEditorSection({
    icons: { cut: Scissors, copy: Copy, paste: ClipboardPaste, erase: Eraser },
  });
  const view = useViewSection({
    icons: { zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize, locked: Lock, unlocked: LockOpen },
  });
  const style = useStyleEditorSection({ layerId, icons: EDGE_TYPE_ICONS });

  // Extras hand-built off the raw hooks.
  const { mode, modeOptions, setMode } = useSelectMode(SELECT_MODE_IDS, {
    labels: SELECT_LABEL,
    initial: 'click',
  });
  // Announce the gesture for the newly-armed select mode + the magnet toggle on
  // the message channel (skip the initial mount).
  const firstMode = useRef(true);
  useEffect(() => {
    if (firstMode.current) {
      firstMode.current = false;
      return;
    }
    canvas.showMessage(SELECT_HINT[mode] ?? '', 4000);
  }, [mode, canvas]);
  const firstMagnet = useRef(true);
  useEffect(() => {
    if (firstMagnet.current) {
      firstMagnet.current = false;
      return;
    }
    canvas.showMessage(
      magnet ? 'Hover highlights neighbours' : 'Hover highlights the node only',
      2500,
    );
  }, [magnet, canvas]);
  const { showGrid, toggleGrid } = useGrid();

  // Assemble visible sections, then join them with dividers (no leading /
  // trailing / doubled dividers regardless of which are hidden).
  const groups: ToolbarItem[][] = [];
  if (s.history) groups.push(history);
  if (s.layout)
    groups.push([
      {
        type: 'select',
        key: 'layout',
        label: 'Layout',
        value: layout,
        options: layoutOptions,
        onChange: applyLayout,
      },
      {
        type: 'button',
        key: 'run-layout',
        icon: Play,
        label: 'Run layout',
        onClick: () => applyLayout(layout),
        disabled: isRunning,
      },
      {
        type: 'button',
        key: 'refresh',
        icon: RefreshCw,
        label: 'Re-render (re-run layout + repaint)',
        onClick: () => void canvas.refresh(),
      },
    ]);
  if (s.selectMode)
    groups.push([
      {
        type: 'select',
        key: 'select-mode',
        label: 'Select',
        value: mode,
        options: modeOptions,
        icons: SELECT_ICONS,
        onChange: setMode,
      },
    ]);
  if (s.style) groups.push(style);
  if (s.edit) groups.push(editor);
  if (s.view) groups.push(view);
  if (s.grid)
    groups.push([
      {
        type: 'toggle',
        key: 'grid',
        icon: Grid3x3,
        label: 'Toggle grid',
        active: showGrid,
        onToggle: toggleGrid,
      },
    ]);
  if (s.backend)
    groups.push([
      {
        // Render-backend switcher. Flipping it remounts the <Canvas> (keyed on
        // `backend`) so pixi re-inits with the chosen renderer. WebGPU is offered
        // but disabled when the browser can't use it (`canUseWebGPU()`).
        type: 'custom',
        key: 'renderer',
        render: () => {
          const webgpuOk = canUseWebGPU();
          return (
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={backend}
              // Radix fires `''` when the active item is re-clicked; ignore that.
              onValueChange={(v) => v && onBackendChange(v as CanvasBackend)}
            >
              {(Object.keys(BACKEND_LABEL) as CanvasBackend[]).map((b) => {
                const disabled = b === 'webgpu' && !webgpuOk;
                return (
                  <ToggleGroupItem
                    key={b}
                    value={b}
                    disabled={disabled}
                    aria-label={BACKEND_LABEL[b]}
                    title={disabled ? "WebGPU isn't available in this browser" : BACKEND_LABEL[b]}
                  >
                    {BACKEND_LABEL[b]}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          );
        },
      },
    ]);
  if (s.magnet)
    groups.push([
      {
        type: 'toggle',
        key: 'magnet',
        icon: Magnet,
        label: 'Highlight neighbours: off',
        activeLabel: 'Highlight neighbours: on',
        active: magnet,
        onToggle: onToggleMagnet,
      },
    ]);

  const div = (key: string): ToolbarItem => ({ type: 'divider', key });
  const items: ToolbarItem[] = groups.flatMap((g, i) => (i === 0 ? g : [div(`d${i}`), ...g]));

  return <ToolbarItems items={items} orientation="horizontal" />;
}

/** Header-right theme toggle — pushes a light/dark patch via `useGraphCanvasUpdate`. */
export function HeaderThemeToggle() {
  const update = useGraphCanvasUpdate();
  const [kind, setKind] = useState<'light' | 'dark'>(() => (osPrefersDark() ? 'dark' : 'light'));
  const toggle = (): void => {
    const next = kind === 'dark' ? 'light' : 'dark';
    setKind(next);
    update(next === 'dark' ? APP_DARK : APP_LIGHT);
    applyChromeTheme(next === 'dark');
  };
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'theme',
      icon: Sun,
      activeIcon: Moon,
      label: 'Switch to dark theme',
      activeLabel: 'Switch to light theme',
      active: kind === 'dark',
      onToggle: toggle,
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}
