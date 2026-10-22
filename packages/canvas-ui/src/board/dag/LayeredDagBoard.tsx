/**
 * `<LayeredDagBoard>` — a directed acyclic graph read left to right: a plan's
 * waves, a workflow's steps, a lineage's depths. Nodes are seeded in their
 * column so the first paint is already the right picture, then ELK lays them
 * out (or, with `layout="fixed"`, the columns stay).
 *
 * ```tsx
 * <LayeredDagBoard data={dag} chrome="panel" legend={{ keys, note }} />            // tones, a legend strip
 * <LayeredDagBoard data={plan} config={settings} detail={{ templates, options, initial: 'circles' }} title="Plan" />
 * <LayeredDagBoard data={dag} connect={{ onConnect: (a, b) => veto(a, b), label: 'Connect', hint: 'Drag a task onto…' }} />
 * ```
 *
 * | `chrome` | Around the canvas |
 * |---|---|
 * | `'app'` | header (title · zoom · fit · Detail · settings dock), footer (status · message) |
 * | `'panel'` | nothing: the connect switch top-left and the legend strip along the bottom, over the canvas |
 *
 * **Drawing.** With the default config a node is a dot in its `data.tone`'s
 * colour and an edge a line, from `tones` (`DAG_TONES`). A host with its own
 * `config` draws by its own templates, and `detail` switches them live.
 *
 * **Connect.** With `connect`, a drag from one node onto another names both
 * ends to `onConnect`; the board never adds the edge — the host's data does. A
 * refusal is said in the message line (`'app'`) or the legend strip (`'panel'`).
 */

import type { CanvasConfig } from '@invana/canvas';
import {
  BackgroundLayer,
  CanvasThemeSync,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  DragPanBehaviour,
  DrawEdgeBehaviour,
  ElkLayout,
  GraphLayer,
  HoverActivateBehaviour,
  HoverElementPreviewBehaviour,
  NodeLabelLODBehaviour,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { ClickSelectBehaviour as ClickSelect, GraphCanvas, GraphData, GraphEdge, GraphNode } from '@invana/graph';
import { MousePointer2, Settings, Spline } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraphCanvasApp } from '../../apps';
import { CanvasMessageBar, GraphStatusBar, ToolbarItems } from '../../components';
import { CanvasSettingsEditorPanel } from '../../editor-panels/canvas-settings';
import { type UseSidePanelsOptions, useSidePanels } from '../../hooks';
import { GraphControlsToolbar } from '../../toolbars';
import { type DetailTemplates, useDetailTemplates } from '../schema/detailTemplates';
import { DagLegend, type DagLegendSpec } from './DagLegend';
import {
  DAG_BOARD_CONFIG,
  DAG_LAYER,
  DAG_LAYOUT,
  DAG_TONES,
  type DagNodeData,
  type DagTones,
  dagEdgeStyle,
  dagNodeStyle,
} from './presets';

/** What a click selected — one node or one edge, by id. */
export type DagBoardSelection = { kind: 'node' | 'edge'; id: string } | null;

/** The connect gesture: a drag from one node onto another, with the host's veto. */
export interface DagBoardConnect {
  /** A drag landed on `targetId` from `sourceId`. Return the refusal to show, or `null` to accept. */
  onConnect: (sourceId: string, targetId: string) => string | null;
  /** The connect tool's tooltip. */
  label: string;
  /** Said in place of the legend's note while connecting. */
  hint?: string;
}

export interface LayeredDagBoardProps {
  data: GraphData;
  /** The config the board mounts on. Default {@link DAG_BOARD_CONFIG}, drawn from `tones`. */
  config?: CanvasConfig;
  /** The Detail levels; with one level, or none, there is no switcher. */
  detail?: DetailTemplates;
  /** Opens on this level instead of `detail.initial`. */
  initialDetail?: string;
  /** A tone's colour, for the default config's nodes and the legend's dots. Default {@link DAG_TONES}. */
  tones?: DagTones;
  /** The strip along the bottom: what each colour and line means, and a note. */
  legend?: DagLegendSpec;
  /** Said in place of the legend's copy, in the destructive colour. */
  error?: string | null;
  /** Shown in place of a board with no nodes. */
  emptyHint?: string;
  /** `'app'` (default): header and footer. `'panel'`: the canvas alone. */
  chrome?: 'app' | 'panel';
  /** `'layered'` (default) runs ELK; `'fixed'` keeps the seeded columns. */
  layout?: 'layered' | 'fixed';
  /** Left out, the header carries no title. */
  title?: string;
  /** Said once in the message line when the board is ready. */
  message?: string;
  selected?: DagBoardSelection;
  onSelect?: (selection: DagBoardSelection) => void;
  /** Left out, the board has no connect tool. */
  connect?: DagBoardConnect;
  renderNode?: (node: GraphNode) => ReactNode;
  renderEdge?: (edge: GraphEdge) => ReactNode;
  /** `true` themes from the library, `'tokens'` from the host page's CSS tokens, `false` leaves it to the host. Default `true`. */
  theme?: boolean | 'tokens';
  /** The dock's size. */
  dockSection?: UseSidePanelsOptions['section'];
  headerClassName?: string;
  /** For a host that gives no height of its own; default fills the parent. */
  height?: number;
  onReady?: (canvas: GraphCanvas | null) => void;
  /** Rendered inside the canvas, after the board's own pieces. */
  children?: ReactNode;
}

const COLUMN_GAP = 190;
const ROW_GAP = 90;
const FIT = { padding: 70, maxZoom: 1 };
const NO_DETAIL: DetailTemplates = {
  templates: { only: {} },
  options: { only: '' },
  initial: 'only',
};

const sameSelection = (a: DagBoardSelection, b: DagBoardSelection) => a?.kind === b?.kind && a?.id === b?.id;

/** One identity per equal value — a host that rebuilds equal data each render re-seeds nothing. */
function useStableValue<T>(value: T): T {
  const signature = JSON.stringify(value);
  const ref = useRef({ signature, value });
  if (ref.current.signature !== signature) ref.current = { signature, value };
  return ref.current.value;
}

/** Each node without a place of its own, in its `data.column`, one row per node already there. */
function seedColumns(data: GraphData): GraphData {
  const rows = new Map<number, number>();
  return {
    ...data,
    nodes: data.nodes.map((node) => {
      const column = (node.data as DagNodeData | undefined)?.column;
      if (node.position || typeof column !== 'number') return node;
      const row = rows.get(column) ?? 0;
      rows.set(column, row + 1);
      return {
        ...node,
        position: { x: column * COLUMN_GAP, y: row * ROW_GAP },
      };
    }),
  };
}

export function LayeredDagBoard({
  data: dataProp,
  config,
  detail,
  initialDetail,
  tones = DAG_TONES,
  legend,
  error,
  emptyHint = 'Nothing to draw yet.',
  chrome = 'app',
  layout = 'layered',
  title,
  message,
  selected = null,
  onSelect,
  connect,
  renderNode,
  renderEdge,
  theme = true,
  dockSection,
  headerClassName,
  height,
  onReady: onReadyProp,
  children,
}: LayeredDagBoardProps) {
  const stable = useStableValue(dataProp);
  const data = useMemo(() => seedColumns(stable), [stable]);
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const ownConfig = config === undefined;
  const boardConfig = config ?? DAG_BOARD_CONFIG;
  const levels = detail ?? NO_DETAIL;
  const tonesKey = JSON.stringify(tones);
  // Resolvers on the layer, for the default config only — a host's config draws by its templates.
  const nodeStyle = useMemo(() => (ownConfig ? dagNodeStyle(tones) : undefined), [ownConfig, tonesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const edgeStyle = useMemo(() => (ownConfig ? dagEdgeStyle(tones) : undefined), [ownConfig, tonesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [connectTool, setConnectTool] = useState(false);
  const connecting = !!connect && connectTool;
  const connectRef = useRef(connect);
  connectRef.current = connect;
  const [refusal, setRefusal] = useState<string | null>(null);

  const { level, setLevel, initialConfig } = useDetailTemplates({
    canvas: layout === 'layered' ? canvas : null,
    config: boardConfig,
    detail: levels,
    data,
    layout: DAG_LAYOUT,
    layerId: DAG_LAYER,
    fitPadding: FIT.padding,
    fitMaxZoom: FIT.maxZoom,
    ...(initialDetail !== undefined ? { initial: initialDetail } : {}),
  });

  // `fixed` keeps the seeded columns: frame them, never lay them out.
  useEffect(() => {
    if (!canvas || layout !== 'fixed' || data.nodes.length === 0) return;
    const id = requestAnimationFrame(() => canvas.fitView(FIT.padding, FIT.maxZoom));
    return () => cancelAnimationFrame(id);
  }, [canvas, layout, data]);

  // Framed until a person moves the camera: when the drawing changes size the
  // board refits it, unless a layout is running (its own fit follows) or a press
  // or a wheel inside the board has handed the camera over (until the next run).
  const frame = useRef<HTMLDivElement | null>(null);
  const handedOver = useRef(false);
  useEffect(() => {
    // The drawing surface itself: it reaches its final size after the board's
    // box does (the renderer resizes on its own frame).
    const el = canvas?.renderer?.canvasElement ?? frame.current;
    if (!canvas || !el || typeof ResizeObserver === 'undefined') return;
    let size: { w: number; h: number } | null = null;
    let raf: number | null = null;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (!box) return;
      const next = { w: Math.round(box.width), h: Math.round(box.height) };
      // The first report is where it stands, not a change.
      const changed = size !== null && (size.w !== next.w || size.h !== next.h);
      size = next;
      if (!changed || handedOver.current || raf !== null) return;
      if (canvas.store.view.getState().runtime.layout.running) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        canvas.fitView(FIT.padding, FIT.maxZoom);
      });
    });
    observer.observe(el);
    const offStart = canvas.events.on('layout:run:start', () => {
      handedOver.current = false;
    });
    // Every settled run is framed, capped: the run that places the first data is
    // the canvas's own re-layout as the data lands, which carries no fit.
    const offEnd = canvas.events.on('layout:run:end', ({ reason }) => {
      if (reason !== 'settled' || handedOver.current) return;
      requestAnimationFrame(() => canvas.fitView(FIT.padding, FIT.maxZoom));
    });
    return () => {
      observer.disconnect();
      offStart();
      offEnd();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [canvas]);
  const handOver = useCallback(() => {
    handedOver.current = true;
  }, []);

  const dock = useSidePanels(
    [
      {
        id: 'settings',
        icon: Settings,
        label: 'Settings',
        render: (c) => <CanvasSettingsEditorPanel canvas={c} className="border-0 bg-transparent shadow-none" />,
      },
    ],
    dockSection ? { section: dockSection } : undefined,
  );

  const canvasRef = useRef(canvas);
  canvasRef.current = canvas;
  // Always `null`: the board never draws the edge — the host's data does.
  const createEdge = useCallback(
    (source: string, target: string) => {
      const said = connectRef.current?.onConnect(source, target) ?? null;
      if (chrome === 'app') {
        if (said) canvasRef.current?.showMessage(said);
      } else setRefusal(said);
      return null;
    },
    [chrome],
  );

  const onReady = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      if (message) c?.showMessage(message);
      onReadyProp?.(c);
    },
    [message, onReadyProp],
  );

  // The config switches node drag on, so the tool re-asserts itself after it lands.
  useEffect(() => {
    const drag = canvas?.behaviours.get('drag-node');
    if (!drag) return;
    if (connecting) drag.disable();
    else drag.enable();
  }, [canvas, connecting]);

  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => {
    const select = canvas?.behaviours.get<ClickSelect>('click-select');
    if (!select) return;
    return select.events.on('selection:change', (snapshot) => {
      const [node] = snapshot.shapeIds;
      const [edge] = snapshot.connectorIds;
      const next: DagBoardSelection =
        snapshot.shapeIds.length + snapshot.connectorIds.length !== 1
          ? null
          : node
            ? { kind: 'node', id: node }
            : { kind: 'edge', id: edge as string };
      if (!sameSelection(next, selectedRef.current)) selectRef.current?.(next);
    });
  }, [canvas]);
  useEffect(() => {
    const select = canvas?.behaviours.get<ClickSelect>('click-select');
    if (!select) return;
    if (!selected) select.clearSelection();
    else select.select(selected.id, selected.kind === 'node' ? 'shape' : 'connector');
  }, [canvas, selected]);

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center text-muted-foreground">
        {emptyHint}
      </div>
    );
  }

  const panel = chrome === 'panel';
  // `fixed` names no active layout, so a data change never lays the columns out either.
  const mountConfig =
    layout === 'fixed'
      ? ({
          ...initialConfig,
          activeLayout: undefined,
        } as unknown as CanvasConfig)
      : initialConfig;
  const levelKeys = Object.keys(levels.options);
  const connectItem = connect
    ? [
        {
          key: 'connect',
          type: 'toggle' as const,
          icon: Spline,
          label: connect.label,
          active: connecting,
          onToggle: () => setConnectTool((on) => !on),
        },
      ]
    : [];

  return (
    <div
      ref={frame}
      className={height === undefined ? 'h-full w-full' : 'w-full'}
      onPointerDownCapture={handOver}
      onWheelCapture={handOver}
    >
      <GraphCanvasApp
        data={data}
        config={mountConfig}
        onReady={onReady}
        bundle={false}
        showHeader={!panel}
        {...(height !== undefined ? { height } : {})}
        {...(panel
          ? {}
          : {
              header: {
                ...(headerClassName ? { className: headerClassName } : {}),
                ...(title ? { title } : { left: null }),
                center: (
                  <GraphControlsToolbar
                    sections={{
                      layout: false,
                      history: false,
                      style: false,
                      edit: false,
                      grid: false,
                    }}
                    extraItems={connectItem}
                  />
                ),
                right: () => (
                  <ToolbarItems
                    orientation="horizontal"
                    items={[
                      ...(levelKeys.length > 1
                        ? [
                            {
                              type: 'select' as const,
                              key: 'detail',
                              label: 'Detail',
                              value: level,
                              options: levels.options,
                              onChange: (v: string) => setLevel(v),
                            },
                          ]
                        : []),
                      ...dock.items,
                    ]}
                  />
                ),
              },
              footer: { left: <GraphStatusBar />, right: <CanvasMessageBar /> },
              right: dock.region,
            })}
      >
        <BackgroundLayer id="background" />
        <GraphLayer
          id={DAG_LAYER}
          data={data}
          {...(nodeStyle ? { node: { style: nodeStyle } } : {})}
          {...(edgeStyle ? { edge: { style: edgeStyle } } : {})}
        />
        {theme !== false ? <ThemeBehaviour id="theme" /> : null}
        {theme === 'tokens' ? <CanvasThemeSync source="tokens" /> : theme ? <CanvasThemeSync /> : null}
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag-node" targetLayerId={DAG_LAYER} enabled={!connecting} />
        {connect ? (
          <DrawEdgeBehaviour id="draw-edge" targetLayerId={DAG_LAYER} enabled={connecting} createEdge={createEdge} />
        ) : null}
        <HoverActivateBehaviour id="hover" targetLayerId={DAG_LAYER} />
        <ClickSelectBehaviour id="click-select" targetLayerId={DAG_LAYER} />
        {/* The board's own run fits, capped at 100%; the layout's uncapped fit stays off. */}
        <ElkLayout id={DAG_LAYOUT} targetLayerId={DAG_LAYER} fitPadding={null} />
        <TextResolutionLODBehaviour id="label-resolution" targetLayerId={DAG_LAYER} />
        <NodeLabelLODBehaviour id="text-lod" targetLayerId={DAG_LAYER} />
        {renderNode || renderEdge ? (
          <HoverElementPreviewBehaviour
            targetLayerId={DAG_LAYER}
            {...(renderNode ? { renderNode } : {})}
            {...(renderEdge ? { renderEdge } : {})}
          />
        ) : null}
        {panel && connect ? (
          <div className="absolute left-2 top-2 rounded-sm border bg-card/90 p-0.5 backdrop-blur">
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  key: 'select',
                  type: 'toggle' as const,
                  icon: MousePointer2,
                  label: 'Select / move',
                  active: !connecting,
                  onToggle: () => setConnectTool(false),
                },
                ...connectItem,
              ]}
            />
          </div>
        ) : null}
        {panel && (legend || error || refusal) ? (
          <DagLegend
            className="absolute bottom-2 left-2 right-2"
            legend={legend}
            tones={tones}
            error={error ?? refusal}
            note={connecting ? connect?.hint : undefined}
          />
        ) : null}
        {children}
      </GraphCanvasApp>
    </div>
  );
}
