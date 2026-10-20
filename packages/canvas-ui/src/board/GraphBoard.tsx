/**
 * `<GraphBoard>` — the board as one component: a graph, its modes, its rows
 * and dock, its right-click menus and its panel rail.
 *
 * ```tsx
 * <GraphBoard data={graph} />                                      // a full board
 * <GraphBoard data={graph} styling={s} onStylingChange={setS} />   // styling kept by the host
 * <GraphBoard data={graph} onExpand={fetchNeighbours}
 *   menus={{ node: ({ id }) => [{ id: 'more', label: 'Expand…', onClick: () => openDialog(id) }] }}
 *   panels={(rail) => [...rail.slice(0, 3), versions, ...rail.slice(3)]}
 *   panelOptions={{ changes: { onSave: save, saveDisabledReason } }} />
 * ```
 *
 * | Where | What | From |
 * |---|---|---|
 * | top-left | the mode picker, then the mode's tools | {@link BOARD_ROW_ITEMS} · {@link BOARD_VIEW_ROW_ITEMS} |
 * | top-right | the rail — Legend · Styling · History · Element · Changes · Export | {@link defaultBoardPanels} |
 * | bottom-left | the minimap over zoom · fit · lock | {@link BOARD_DOCK_ITEMS} |
 * | bottom | in Present, the step's question and answer | `PlaybookPresenterBar` |
 * | right-click | board · node · relationship · selection | {@link defaultBoardMenus} |
 *
 * **What the board does on its own** (each switchable through `policies`):
 * leaving Edit puts its tools down; the minimap shows only in work modes;
 * Present opens on step 1; a click opens the Element panel; leaving the page
 * with unsaved changes asks first.
 *
 * **What it asks of its host** — anything that needs the host's backend is a
 * callback: `onExpand` (fetch neighbours), `panelOptions.changes.onSave`
 * (persist edits), `onLayoutStart` / `onLayoutEnd` (telemetry), `onSlowLayout`
 * (a toast). The board imports no toaster, telemetry, auth or HTTP.
 *
 * Renders its children inside the canvas, after its own pieces — a host's
 * extra layer or behaviour.
 */

import type { Canvas, CanvasConfig, PlaybookSpec } from '@invana/canvas';
import { deepMerge } from '@invana/canvas';
import {
  BackgroundLayer,
  type BoardModeSpec,
  BoardModes,
  BoardToolKeys,
  BrushSelectBehaviour,
  CanvasThemeSync,
  ClickInspectBehaviour,
  ClickSelectBehaviour,
  ClickViewBehaviour,
  ControlPanel,
  CreateNodeBehaviour,
  D3ForceLayout,
  DragNodeBehaviour,
  DragPanBehaviour,
  DrawEdgeBehaviour,
  EdgeLODBehaviour,
  ElkLayout,
  GraphCanvas as GraphCanvasRoot,
  GraphLayer,
  HoverActivateBehaviour,
  LassoSelectBehaviour,
  MiniMapLayer,
  NodeCentralityBehaviour,
  PinchZoomBehaviour,
  type RenderPreference,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  UnsavedChangesBehaviour,
  UnsavedGhostLayer,
  useBoardMode,
  useCanvasEvent,
  useGraphCanvas,
  useUnsavedGuard,
  useViewContext,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import {
  type ClickInspectBehaviour as ClickInspect,
  DEFAULT_EDGE_STATES,
  EDGE_DENSITY,
  edgeAlphaForCount,
  type GraphCanvas,
  type GraphData,
  type GraphEdge,
  type GraphLayer as GraphLayerEngine,
  type GraphNode,
  selectedElementIds,
  thinsEdges,
  UNKNOWN_TYPE,
} from '@invana/graph';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type ControlWidget, ControlPanels } from '../control-panels';
import { BoardContextMenus } from '../menus/BoardContextMenus';
import { PlaybookPresenterBar } from '../view-panels/playbook';
import { typeColor } from '../view-panels/schema';
import type { TypeStylingPatch } from '../view-panels/styling/types';
import { useApplyTypeStyling } from '../view-panels/styling/useApplyTypeStyling';
import { BoardLayoutPopover } from './BoardLayoutPopover';
import { type BoardPanelSpec, BoardPanels } from './BoardPanels';
import { type BoardMenuExtras, defaultBoardMenus, GRAPH_EXPAND_COMMAND, newBoardElementId, openBoardPanel, openElementEditor } from './boardMenus';
import { type DefaultBoardPanelsOptions, defaultBoardPanels } from './defaultBoardPanels';
import {
  ANNOTATE_TOOL_COMMAND,
  BOARD_CENTRALITY,
  BOARD_DOCK,
  BOARD_DOCK_ITEMS,
  BOARD_EDGE,
  BOARD_IDS,
  BOARD_LAYOUT_PRESETS,
  BOARD_MODES,
  BOARD_ROW_ITEMS,
  BOARD_VIEW_ROW_ITEMS,
  boardConfig,
  VIEW_MODES,
  WORK_MODES,
} from './presets';

/** What the board does on its own; every one on by default. */
export interface GraphBoardPolicies {
  /** A click on an element opens the Element panel. */
  openElementOnInspect?: boolean;
  /** Leaving the page while anything is unsaved asks first. */
  unsavedGuard?: boolean;
  /** Leaving Edit puts its tools down; the minimap shows only in work modes; Present opens on step 1. */
  modeTidy?: boolean;
}

/** A layout run of the board's active layout. */
export interface GraphBoardLayoutRun {
  readonly nodeCount: number;
}

export interface GraphBoardProps {
  /** What the graph layer holds. A new reference replaces it and lays it out. */
  data: GraphData;
  /** Deep-merged over the board's config ({@link boardConfig}), keyed by {@link BOARD_IDS}. */
  config?: CanvasConfig;
  /** Render backend. Changing it remounts the board. */
  preference?: RenderPreference;
  className?: string;
  /** A type's colour — nodes, relationships, the legend. Default: a stable hash onto the board palette. */
  colorForType?: (type: string, kind: 'node' | 'edge') => number | undefined;
  /** Per-type styling. Controlled with {@link onStylingChange}; uncontrolled without. */
  styling?: TypeStylingPatch;
  onStylingChange?: (next: TypeStylingPatch) => void;
  /**
   * Follow the host page's theme — background, labels, borders, the minimap —
   * through `ThemeBehaviour` + `CanvasThemeSync` (a `@invana/themes`
   * `ThemeProvider` ancestor is required). `true` (default) takes the canvas
   * library's palette for the host's theme family; `'tokens'` reads the host
   * page's own CSS tokens; `false` leaves the canvas to the host.
   */
  theme?: boolean | 'tokens';
  /** Size each node by its connection count, from the start. Default `false`; the Styling panel toggles it. */
  sizeByConnections?: boolean;
  /** Hover lights a node's neighbours (`1`) or the node alone (`0`). Default `1`. */
  hoverDegree?: 0 | 1;
  /** The board's modes. Default {@link BOARD_MODES}. */
  modes?: readonly BoardModeSpec[];
  /** The host's own right-click entries, per target. */
  menus?: BoardMenuExtras;
  /** Props for the default rail panels. */
  panelOptions?: Omit<DefaultBoardPanelsOptions, 'styling' | 'onStylingChange'>;
  /** Reshape the rail — insert, drop or reorder. Receives the default panels. */
  panels?: (defaults: BoardPanelSpec[]) => BoardPanelSpec[];
  /** The rail panel open when the board opens. Default `'legend'`. */
  defaultPanel?: string | null;
  /** Rail panel width, px. Default `320`. */
  panelWidth?: number;
  /** Expand the given nodes' neighbours — registers {@link GRAPH_EXPAND_COMMAND}. */
  onExpand?: (nodeIds: string[], canvas: GraphCanvas) => void;
  /** The steps Present walks through. */
  playbook?: PlaybookSpec<CanvasConfig>;
  /** Beside the presenter's narration. */
  narrationIcon?: ReactNode;
  policies?: GraphBoardPolicies;
  /** The live engine once every piece registered; `null` on teardown. */
  onReady?: (canvas: GraphCanvas | null) => void;
  /** The clicked element's id, or `null`. */
  onViewTargetChange?: (id: string | null) => void;
  /** The active layout started a run. */
  onLayoutStart?: (run: GraphBoardLayoutRun) => void;
  /** The active layout's run ended — `settled`, or `stopped` (cancelled or superseded). */
  onLayoutEnd?: (run: GraphBoardLayoutRun & { reason: string }) => void;
  /**
   * The run is still going after `slowLayoutMs`: say so, with `cancel`. Return
   * a function to take the notice down; the board calls it when the run ends.
   */
  onSlowLayout?: (run: GraphBoardLayoutRun & { cancel: () => void }) => (() => void) | void;
  /** Default `400`. */
  slowLayoutMs?: number;
  /** Inside the canvas, after the board's own pieces. */
  children?: ReactNode;
}

/** Edges stay opaque while looked at, however faded the rest. */
const EDGE_STATES = {
  hovered: { ...DEFAULT_EDGE_STATES.hovered, strokeAlpha: 1 },
  selected: { ...DEFAULT_EDGE_STATES.selected, strokeAlpha: 1 },
  highlighted: { ...DEFAULT_EDGE_STATES.highlighted, strokeAlpha: 1 },
};

const defaultColor = (type: string) => typeColor(type);

/** The theme publisher reads the host page's theme; the accent follows `--color-primary`. */
const THEME_CONFIG: CanvasConfig = {
  behaviours: { theme: { enabled: true, mode: 'document', active: 'default', accent: 'css-var' } },
} as CanvasConfig;

export function GraphBoard({
  data,
  config,
  preference,
  className,
  colorForType,
  styling: stylingProp,
  onStylingChange,
  theme = true,
  sizeByConnections = false,
  hoverDegree = 1,
  modes = BOARD_MODES,
  menus,
  panelOptions,
  panels,
  defaultPanel = 'legend',
  panelWidth = 320,
  onExpand,
  playbook,
  narrationIcon,
  policies,
  onReady,
  onViewTargetChange,
  onLayoutStart,
  onLayoutEnd,
  onSlowLayout,
  slowLayoutMs = 400,
  children,
}: GraphBoardProps) {
  // The live engine, set a commit after the root applied `config`, so styling
  // reads the configured template as the one it falls back to.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const ready = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      c?.setLayoutPresets(BOARD_LAYOUT_PRESETS);
      onReady?.(c);
    },
    [onReady],
  );

  // The colour resolvers read the latest `colorForType` without re-configuring.
  const colorRef = useRef(colorForType ?? defaultColor);
  colorRef.current = colorForType ?? defaultColor;
  const merged = useMemo(
    () =>
      deepMerge(
        deepMerge(boardConfig((type, kind) => colorRef.current(type, kind)), theme ? THEME_CONFIG : {}),
        config ?? {},
      ) as CanvasConfig,
    [config, theme],
  );

  const [ownStyling, setOwnStyling] = useState<TypeStylingPatch>({});
  const styling = stylingProp ?? ownStyling;
  const setStyling = onStylingChange ?? setOwnStyling;
  useApplyTypeStyling(canvas, BOARD_IDS.graph, styling, true);

  // Edges fade as the graph grows.
  const edgeCount = data.edges.length;
  useEffect(() => {
    canvas?.layers
      .get<GraphLayerEngine>(BOARD_IDS.graph)
      ?.setEdgeDefaults({ strokeAlpha: edgeAlphaForCount(edgeCount) });
  }, [canvas, edgeCount]);

  const menuProps = useMemo(() => defaultBoardMenus(menus ? { extra: menus } : {}), [menus]);
  const rail = useMemo(() => {
    const defaults = defaultBoardPanels({ ...panelOptions, styling, onStylingChange: setStyling });
    return panels ? panels(defaults) : defaults;
  }, [panelOptions, styling, setStyling, panels]);
  const widgets = useMemo<Record<string, ControlWidget>>(
    () => ({
      presenter: ({ canvas: c }) => (
        <PlaybookPresenterBar
          canvas={c}
          variant="compact"
          className="w-[540px] shadow-lg"
          {...(narrationIcon ? { narrationIcon } : {})}
        />
      ),
    }),
    [narrationIcon],
  );

  return (
    <GraphCanvasRoot
      key={preference}
      autoResize
      {...(preference ? { preference } : {})}
      config={merged}
      className={className ?? 'h-full w-full'}
    >
      {theme && (
        <>
          <ThemeBehaviour id="theme" />
          <CanvasThemeSync source={theme === 'tokens' ? 'tokens' : 'library'} />
        </>
      )}
      <BackgroundLayer id={BOARD_IDS.background} />
      <GraphLayer id={BOARD_IDS.graph} data={data} edge={{ state: EDGE_STATES }} />
      <D3ForceLayout id={BOARD_IDS.layout} targetLayerId={BOARD_IDS.graph} />
      <ElkLayout id={BOARD_IDS.elk} targetLayerId={BOARD_IDS.graph} />
      <NodeCentralityBehaviour
        id={BOARD_IDS.sizeByConnections}
        targetLayerId={BOARD_IDS.graph}
        enabled={sizeByConnections}
        minSize={BOARD_CENTRALITY.minSize}
        maxSize={BOARD_CENTRALITY.maxSize}
      />
      <EdgeLODBehaviour
        id={BOARD_IDS.edgeThin}
        targetLayerId={BOARD_IDS.graph}
        enabled={thinsEdges(edgeCount)}
        minZoom={EDGE_DENSITY.thinBelowZoom}
        keepFraction={EDGE_DENSITY.thinKeep}
        keepBy="sample"
      />

      <DragPanBehaviour id="pan" />
      <DragNodeBehaviour id="drag-node" targetLayerId={BOARD_IDS.graph} />
      <WheelZoomBehaviour id="wheel" />
      <PinchZoomBehaviour id="pinch" />
      <HoverActivateBehaviour id="hover" targetLayerId={BOARD_IDS.graph} degree={hoverDegree} state="highlighted" />
      <ClickSelectBehaviour id={BOARD_IDS.clickSelect} targetLayerId={BOARD_IDS.graph} multiple />
      <BrushSelectBehaviour id="brush-select" targetLayerId={BOARD_IDS.graph} />
      <LassoSelectBehaviour id="lasso-select" targetLayerId={BOARD_IDS.graph} />
      <ClickViewBehaviour id="click-view" targetLayerId={BOARD_IDS.graph} />
      <TextResolutionLODBehaviour id="label-lod" targetLayerId={BOARD_IDS.graph} />

      <BoardModes modes={modes as BoardModeSpec[]} escapeTo="explore" />
      <BoardToolKeys />
      <ClickInspectBehaviour id={BOARD_IDS.clickInspect} targetLayerId={BOARD_IDS.graph} />
      <EditTools />
      <UnsavedChangesBehaviour />
      <UnsavedGhostLayer />
      <MiniMapLayer
        id={BOARD_IDS.minimap}
        backgroundLayerId={BOARD_IDS.background}
        position="bottom-left"
        width={BOARD_DOCK.width}
        height={BOARD_DOCK.minimapHeight}
        margin={{ x: BOARD_EDGE, y: BOARD_EDGE + BOARD_DOCK.barHeight }}
      />

      <ControlPanel
        id="row"
        position="top-left"
        offset={BOARD_EDGE}
        surface="hairline"
        modes={[...WORK_MODES]}
        items={[...BOARD_ROW_ITEMS]}
      />
      <ControlPanel
        id="row-view"
        position="top-left"
        offset={BOARD_EDGE}
        surface="hairline"
        modes={[...VIEW_MODES]}
        fade="idle"
        items={[...BOARD_VIEW_ROW_ITEMS]}
      />
      <ControlPanel
        id="dock"
        position="bottom-left"
        offset={BOARD_EDGE}
        width={BOARD_DOCK.width}
        surface="hairline"
        modes={[...WORK_MODES]}
        items={[...BOARD_DOCK_ITEMS]}
      />
      <ControlPanel
        id="presenter"
        position="bottom"
        offset={BOARD_EDGE}
        surface={false}
        modes={['present']}
        items={[{ type: 'widget', widget: 'presenter' }]}
      />

      <BoardContextMenus {...menuProps} />
      <BoardLayoutPopover />
      <BoardPanels
        panels={rail}
        defaultOpen={defaultPanel}
        offset={BOARD_EDGE}
        width={panelWidth}
        modes={[...WORK_MODES]}
      />

      <BoardPolicies {...(policies ?? {})} onExpand={onExpand} playbook={playbook} />
      <LayoutProgress
        onLayoutStart={onLayoutStart}
        onLayoutEnd={onLayoutEnd}
        onSlowLayout={onSlowLayout}
        slowLayoutMs={slowLayoutMs}
      />
      {onViewTargetChange && <ViewTarget onChange={onViewTargetChange} />}

      {children}
      <ControlPanels widgets={widgets} />
      {/* Last child: publishes the engine once everything registered. */}
      <BoardReady onReady={ready} />
    </GraphCanvasRoot>
  );
}

/** Publishes the live engine — the last child. */
function BoardReady({ onReady }: { onReady: (canvas: GraphCanvas | null) => void }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}

/** Edit's drawing: a dropped node, a drawn relationship — each opens as new in the Element panel. */
function EditTools() {
  const canvas = useGraphCanvas();
  return (
    <>
      <CreateNodeBehaviour
        id="create-node"
        targetLayerId={BOARD_IDS.graph}
        modes={['add']}
        createNode={(at: { x: number; y: number }): GraphNode => ({
          id: newBoardElementId(),
          type: UNKNOWN_TYPE,
          position: { x: at.x, y: at.y },
          pinned: true,
        })}
        onNodeCreate={(n: GraphNode) => openElementEditor(canvas, 'node', n.id, true)}
      />
      <DrawEdgeBehaviour
        id="draw-edge"
        targetLayerId={BOARD_IDS.graph}
        modes={['connect']}
        createEdge={(source: string, target: string): GraphEdge => ({
          id: newBoardElementId(),
          type: UNKNOWN_TYPE,
          source,
          target,
        })}
        onEdgeCreate={(e: GraphEdge) => openElementEditor(canvas, 'edge', e.id, true)}
      />
    </>
  );
}

/** The board's own conduct — see {@link GraphBoardPolicies}. */
function BoardPolicies({
  openElementOnInspect = true,
  unsavedGuard = true,
  modeTidy = true,
  onExpand,
  playbook,
}: GraphBoardPolicies & Pick<GraphBoardProps, 'onExpand' | 'playbook'>) {
  const canvas = useGraphCanvas();
  const mode = useBoardMode(canvas);
  useUnsavedGuard({ enabled: unsavedGuard }, canvas);

  const expandRef = useRef(onExpand);
  expandRef.current = onExpand;
  const canExpand = onExpand !== undefined;
  useEffect(() => {
    const offs = [
      canvas.commands.register(ANNOTATE_TOOL_COMMAND, { label: 'Not built yet', isEnabled: () => false, run: () => {} }),
      ...(canExpand
        ? [
            canvas.commands.register(GRAPH_EXPAND_COMMAND, {
              label: 'Expand neighbours',
              isEnabled: (c) => selectedElementIds(c, BOARD_IDS.clickSelect).nodeIds.length > 0,
              run: (c) => expandRef.current?.(selectedElementIds(c, BOARD_IDS.clickSelect).nodeIds, c as GraphCanvas),
            }),
          ]
        : []),
    ];
    // A node press either moves the node or draws from it — never both.
    canvas.behaviours.get('drag-node')?.setModes?.(['select', 'add', 'delete']);
    return () => {
      for (const off of offs) off?.();
    };
  }, [canvas, canExpand]);

  useEffect(() => {
    if (!openElementOnInspect) return;
    return canvas.behaviours
      .get<ClickInspect>(BOARD_IDS.clickInspect)
      ?.events.on('inspect:change', (t) => {
        if (t !== null) openBoardPanel(canvas, 'element');
      });
  }, [canvas, openElementOnInspect]);

  useEffect(() => {
    if (playbook) void canvas.playbook.load(playbook);
  }, [canvas, playbook]);

  useEffect(() => {
    if (!modeTidy || !mode) return;
    tidyForMode(canvas, mode);
  }, [canvas, mode, modeTidy]);
  return null;
}

/** Leaving a mode puts its tools down: back to Select, the minimap only where there are tools, Present on step 1. */
function tidyForMode(canvas: Canvas, mode: string): void {
  if (mode !== 'edit') void canvas.commands.run('tool.active', { value: 'select' });
  canvas.layers.get(BOARD_IDS.minimap)?.setVisible(WORK_MODES.includes(mode));
  if (mode === 'present' && canvas.playbook.index < 0 && canvas.playbook.steps.length > 0) void canvas.playbook.next();
}

/**
 * Says why the board is empty while its active layout solves off-screen: the
 * message line counts the solve (`Laying out 912 nodes · 140 / 150`), then
 * *Graph ready*. A run still going after `slowLayoutMs` calls `onSlowLayout`
 * with a `cancel` that stops it and draws the nodes where they are.
 */
function LayoutProgress({
  onLayoutStart,
  onLayoutEnd,
  onSlowLayout,
  slowLayoutMs,
}: Pick<GraphBoardProps, 'onLayoutStart' | 'onLayoutEnd' | 'onSlowLayout'> & { slowLayoutMs: number }) {
  const canvas = useGraphCanvas();
  const nodeCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useRef<(() => void) | null>(null);
  const userStopped = useRef(false);

  const clearSlow = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    dismiss.current?.();
    dismiss.current = null;
  }, []);
  useEffect(() => clearSlow, [clearSlow]);

  useCanvasEvent('layout:run:start', (e) => {
    if (e.id !== BOARD_IDS.layout) return;
    const n = e.nodeCount ?? 0;
    nodeCount.current = n;
    userStopped.current = false;
    canvas.showMessage(`Laying out ${n} nodes…`);
    onLayoutStart?.({ nodeCount: n });
    clearSlow();
    if (!onSlowLayout) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      dismiss.current =
        onSlowLayout({
          nodeCount: n,
          cancel: () => {
            userStopped.current = true;
            canvas.stopLayout();
          },
        }) ?? null;
    }, slowLayoutMs);
  });
  useCanvasEvent('layout:run:progress', (e) => {
    if (e.id !== BOARD_IDS.layout) return;
    canvas.showMessage(`Laying out ${nodeCount.current} nodes · ${e.done} / ${e.total}`);
  });
  useCanvasEvent('layout:run:end', (e) => {
    if (e.id !== BOARD_IDS.layout) return;
    clearSlow();
    onLayoutEnd?.({ nodeCount: nodeCount.current, reason: e.reason ?? 'stopped' });
    // A run superseded by the next ends "stopped" too; that one's start has
    // already taken the message line, so only a settle or a cancel speaks.
    if (e.reason === 'settled') canvas.showMessage('Graph ready', 3000);
    else if (userStopped.current) canvas.showMessage('Layout cancelled — nodes drawn where they were', 4000);
  });
  return null;
}

/** Tells the host which element was clicked. */
function ViewTarget({ onChange }: { onChange: (id: string | null) => void }) {
  const ctx = useViewContext();
  const id = ctx?.id ?? null;
  useEffect(() => onChange(id), [id, onChange]);
  return null;
}
