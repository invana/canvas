/**
 * `<SchemaBoard>` — a schema (ER) drawn as frames of types: each frame a
 * group holding its types through `parentId`, edges between them, laid out by
 * ELK, redrawn live at three levels of Detail.
 *
 * ```tsx
 * <SchemaBoard data={schema} />                                     // the presets
 * <SchemaBoard data={schema} selected={sel} onSelect={setSel}
 *   connect={{ onConnect: (a, b) => veto(a, b), label: 'Link two types', panel, panelLabel: 'Declare', onClosePanel }} />
 * ```
 *
 * | Where | What | From |
 * |---|---|---|
 * | header, centre | zoom · fit · lock, and the connect tool when `connect` is set | `GraphControlsToolbar` |
 * | header, right | the Detail switcher, then the dock toggles | `detail` · `SCHEMA_DETAIL` |
 * | right | the settings dock; the host's `connect.panel` while one is open | `useSidePanels` |
 * | footer | the graph status, the message line | `GraphStatusBar` · `CanvasMessageBar` |
 * | hover | a type's properties; an edge's type and title | `renderSchemaNode` · `renderSchemaEdge` |
 *
 * **Data.** A type's `data` is a `SchemaTypeData` (label, description, icon,
 * frame, hue, properties); a frame is a `SCHEMA_FRAME_TYPE` node with
 * `data.name` and `data.hue`. Hues are slots of the theme's categorical ramp,
 * so nothing is re-coloured by the host on a theme change.
 *
 * **Connect.** With `connect`, a drag from one type onto another names both
 * ends to `onConnect`; the board never adds the edge itself — a host that
 * accepts it adds it to `data`. A refusal is said in the message line. The
 * connect tool in the header makes the drag sticky; holding **Shift** connects
 * for as long as it is held. An accepted drag opens `connect.panel` in the
 * dock, and closing the dock calls `onClosePanel`.
 */

import type { CanvasConfig } from '@invana/canvas';
import {
  BackgroundLayer,
  CanvasThemeSync,
  ClickSelectBehaviour,
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  DragPanBehaviour,
  DrawEdgeBehaviour,
  ElkLayout,
  GraphLayer,
  HoverActivateBehaviour,
  HoverElementPreviewBehaviour,
  NodeLabelLODBehaviour,
  type RenderPreference,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import {
  type ClickSelectBehaviour as ClickSelect,
  type GraphCanvas,
  type GraphData,
  type GraphEdge,
  type GraphNode,
  type SchemaCardOptions,
  type SchemaTypeData,
  schemaCardStructure,
} from '@invana/graph';
import { Link2, Settings } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraphCanvasApp } from '../../apps';
import { CanvasSettingsEditorPanel } from '../../editor-panels/canvas-settings';
import { type UseSidePanelsOptions, useSidePanels } from '../../hooks';
import { CanvasMessageBar, GraphStatusBar, ToolbarItems } from '../../components';
import { GraphControlsToolbar } from '../../toolbars';
import { type DetailStructureBuilder, type DetailTemplates, useDetailTemplates } from './detailTemplates';
import { SCHEMA_BOARD_CONFIG, SCHEMA_DETAIL, SCHEMA_LAYER, SCHEMA_WILDCARD } from './presets';
import { renderSchemaEdge, renderSchemaNode } from './schemaPreview';

const LAYOUT = 'elk';
const CONNECT_PANEL = 'connect';

/** What a click selected — one node or one edge, by id. */
export type SchemaBoardSelection = { kind: 'node' | 'edge'; id: string } | null;

/** The connect gesture: a drag from one type onto another, with the host's veto. */
export interface SchemaBoardConnect {
  /** A drag landed on `targetId` from `sourceId`. Return the refusal to show, or `null` to accept. */
  onConnect: (sourceId: string, targetId: string) => string | null;
  /** The connect tool's tooltip. */
  label: string;
  /** What the dock shows while a connection is being declared; `null` when none is. */
  panel: ReactNode | null;
  /** The dock entry's name. */
  panelLabel: string;
  /** The dock was closed from its toggle. */
  onClosePanel: () => void;
}

export interface SchemaBoardProps {
  data: GraphData;
  /** The config the board mounts on. Default {@link SCHEMA_BOARD_CONFIG}. */
  config?: CanvasConfig;
  /** The Detail levels. Default {@link SCHEMA_DETAIL}. */
  detail?: DetailTemplates;
  /** Opens on this level instead of `detail.initial`. */
  initialDetail?: string;
  /** The `schema:*` structure's options — the subtitle under a type's name. Default `{data.frame}` when a type has one. */
  schemaCard?: (data: SchemaTypeData) => SchemaCardOptions;
  /** Left out, the header carries no title. */
  title?: string;
  /** Said once in the message line when the board is ready. */
  message?: string;
  selected?: SchemaBoardSelection;
  onSelect?: (selection: SchemaBoardSelection) => void;
  /** Left out, the board has no connect tool. */
  connect?: SchemaBoardConnect;
  renderNode?: (node: GraphNode) => ReactNode;
  renderEdge?: (edge: GraphEdge) => ReactNode;
  /** `true` themes from the library, `'tokens'` from the host page's CSS tokens, `false` leaves it to the host. Default `true`. */
  theme?: boolean | 'tokens';
  /** The render backend; a change remounts. */
  preference?: RenderPreference;
  /** The dock's size. */
  dockSection?: UseSidePanelsOptions['section'];
  headerClassName?: string;
  /** For a host that gives no height of its own; default fills the parent. */
  height?: number;
  onReady?: (canvas: GraphCanvas | null) => void;
  /** Rendered inside the canvas, after the board's own pieces. */
  children?: ReactNode;
}

const defaultSchemaCard = (d: SchemaTypeData): SchemaCardOptions => (d.frame ? { subtitle: '{data.frame}' } : {});

const sameSelection = (a: SchemaBoardSelection, b: SchemaBoardSelection) => a?.kind === b?.kind && a?.id === b?.id;

/** One identity per equal value — a host that rebuilds equal data each render re-seeds nothing. */
function useStableValue<T>(value: T): T {
  const signature = JSON.stringify(value);
  const ref = useRef({ signature, value });
  if (ref.current.signature !== signature) ref.current = { signature, value };
  return ref.current.value;
}

/** Holds Shift-to-connect while the key is down. */
function useShiftHeld(on: boolean): boolean {
  const [shift, setShift] = useState(false);
  useEffect(() => {
    if (!on) return;
    const down = (e: KeyboardEvent) => e.key === 'Shift' && setShift(true);
    const up = (e: KeyboardEvent) => e.key === 'Shift' && setShift(false);
    const blur = () => setShift(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [on]);
  return shift;
}

export function SchemaBoard({
  data: dataProp,
  config = SCHEMA_BOARD_CONFIG,
  detail = SCHEMA_DETAIL as unknown as DetailTemplates,
  initialDetail,
  schemaCard = defaultSchemaCard,
  title,
  message,
  selected = null,
  onSelect,
  connect,
  renderNode = renderSchemaNode,
  renderEdge = renderSchemaEdge,
  theme = true,
  preference,
  dockSection,
  headerClassName,
  height,
  onReady: onReadyProp,
  children,
}: SchemaBoardProps) {
  const data = useStableValue(dataProp);
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

  // A drag moves a type; with the connect tool on (or Shift held) it connects.
  const [connectTool, setConnectTool] = useState(false);
  const shift = useShiftHeld(!!connect);
  const connecting = !!connect && (connectTool || shift);
  const connectRef = useRef(connect);
  connectRef.current = connect;

  const schemaCardRef = useRef(schemaCard);
  schemaCardRef.current = schemaCard;
  const structures = useMemo<Record<string, DetailStructureBuilder>>(
    () => ({
      schema: (name, node) =>
        schemaCardStructure(name, node.data as unknown as SchemaTypeData, schemaCardRef.current(node.data as unknown as SchemaTypeData)),
    }),
    [],
  );
  const { level, setLevel, initialConfig } = useDetailTemplates({
    canvas,
    config,
    detail,
    data,
    layout: LAYOUT,
    layerId: SCHEMA_LAYER,
    wildcard: SCHEMA_WILDCARD,
    structures,
    ...(initialDetail !== undefined ? { initial: initialDetail } : {}),
  });

  const dock = useSidePanels(
    [
      {
        id: 'settings',
        icon: Settings,
        label: 'Settings',
        render: (c) => <CanvasSettingsEditorPanel canvas={c} className="border-0 bg-transparent shadow-none" />,
      },
      ...(connect
        ? [
            {
              id: CONNECT_PANEL,
              icon: Link2,
              label: connect.panelLabel,
              // Opened by an accepted drag only — its toggle stays out of the header.
              render: () => connectRef.current?.panel ?? null,
            },
          ]
        : []),
    ],
    dockSection ? { section: dockSection } : undefined,
  );

  // The host's panel opening opens the dock on it, and closing itself closes
  // the dock; closing the dock from its toggle tells the host.
  const hasPanel = !!connect?.panel;
  const { open: openDock, openId } = dock;
  const hadPanel = useRef(false);
  const openIdRef = useRef(openId);
  openIdRef.current = openId;
  useEffect(() => {
    if (hasPanel) openDock(CONNECT_PANEL);
    else if (hadPanel.current && openIdRef.current === CONNECT_PANEL) openDock(null);
    hadPanel.current = hasPanel;
  }, [hasPanel, openDock]);
  const wasOpen = useRef(false);
  useEffect(() => {
    const isOpen = openId === CONNECT_PANEL;
    if (wasOpen.current && !isOpen) connectRef.current?.onClosePanel();
    wasOpen.current = isOpen;
  }, [openId]);

  const canvasRef = useRef(canvas);
  canvasRef.current = canvas;
  // Always `null`: the board never draws the edge — the host's data does.
  const createEdge = useCallback((source: string, target: string) => {
    const refusal = connectRef.current?.onConnect(source, target) ?? null;
    if (refusal) canvasRef.current?.showMessage(refusal);
    return null;
  }, []);

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
      const next: SchemaBoardSelection =
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

  const levels = Object.keys(detail.options);
  return (
    <GraphCanvasApp
      data={data}
      config={initialConfig}
      onReady={onReady}
      bundle={false}
      {...(preference !== undefined ? { preference, instanceKey: preference } : {})}
      {...(height !== undefined ? { height } : {})}
      header={{
        ...(headerClassName ? { className: headerClassName } : {}),
        ...(title ? { title } : { left: null }),
        center: (
          <GraphControlsToolbar
            sections={{ layout: false }}
            {...(connect
              ? {
                  extraItems: [
                    {
                      key: 'connect',
                      type: 'toggle' as const,
                      icon: Link2,
                      label: connect.label,
                      active: connecting,
                      onToggle: () => setConnectTool((on) => !on),
                    },
                  ],
                }
              : {})}
          />
        ),
        right: () => (
          <ToolbarItems
            orientation="horizontal"
            items={[
              ...(levels.length > 1
                ? [
                    {
                      type: 'select' as const,
                      key: 'detail',
                      label: 'Detail',
                      value: level,
                      options: detail.options,
                      onChange: (v: string) => setLevel(v),
                    },
                  ]
                : []),
              ...dock.items.filter((item) => item.key !== CONNECT_PANEL),
            ]}
          />
        ),
      }}
      footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
      right={dock.region}
    >
      <BackgroundLayer id="background" />
      <GraphLayer id={SCHEMA_LAYER} data={data} />
      {theme !== false ? <ThemeBehaviour id="theme" /> : null}
      {theme === 'tokens' ? <CanvasThemeSync source="tokens" /> : theme ? <CanvasThemeSync /> : null}
      <DragPanBehaviour id="pan" />
      <WheelZoomBehaviour id="wheel" />
      <DragNodeBehaviour id="drag-node" targetLayerId={SCHEMA_LAYER} enabled={!connecting} />
      {connect ? (
        <DrawEdgeBehaviour id="draw-edge" targetLayerId={SCHEMA_LAYER} enabled={connecting} createEdge={createEdge} />
      ) : null}
      <HoverActivateBehaviour id="hover" targetLayerId={SCHEMA_LAYER} />
      <ClickSelectBehaviour id="click-select" targetLayerId={SCHEMA_LAYER} />
      <ElkLayout id={LAYOUT} targetLayerId={SCHEMA_LAYER} fitPadding={60} />
      <CollapseExpandBehaviour id="collapse-expand" targetLayerId={SCHEMA_LAYER} enabled />
      <TextResolutionLODBehaviour id="label-resolution" targetLayerId={SCHEMA_LAYER} />
      <NodeLabelLODBehaviour id="text-lod" targetLayerId={SCHEMA_LAYER} />
      <HoverElementPreviewBehaviour targetLayerId={SCHEMA_LAYER} renderNode={renderNode} renderEdge={renderEdge} />
      {children}
    </GraphCanvasApp>
  );
}
