import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PanelRendererProps } from '@invana/boards';
import type { CanvasConfig } from '@invana/canvas';
import {
  CanvasThemeSync,
  ClickSelectBehaviour,
  EdgeScaleLODBehaviour,
  FocusBehaviour,
  GraphCanvas as GraphCanvasRoot,
  GraphLayer,
  HoverActivateBehaviour,
  MapLayer,
  NodeScaleLODBehaviour,
  ThemeBehaviour,
  useGraphCanvas,
} from '@invana/canvas-react';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { projectLngLat } from '@invana/graph-layer-maplibre';

import { BOARD_IDS } from '../../board/presets';
import { useApplyTypeStyling } from '../../view-panels/styling/useApplyTypeStyling';
import { useCanvasBoardContext } from '../provider';
import { DEFAULT_CANVAS_ID, type MapGeo, type MapPanelOptions } from '../types';

/** A placed node's degrees, kept beside its projected position. */
interface Placed {
  lng: number;
  lat: number;
}

const degrees = (value: unknown): number | undefined => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

/** `data` with each node of a type in `geo` pinned at its mercator position; the rest, and their edges, left off. */
export function placeOnMap(data: GraphData, geo: Record<string, MapGeo>): { graph: GraphData; at: Placed[] } {
  const at: Placed[] = [];
  const nodes = data.nodes.flatMap((n) => {
    const g = geo[n.type ?? ''];
    const values = (n.data ?? {}) as Record<string, unknown>;
    const lat = g && degrees(values[g.lat]);
    const lng = g && degrees(values[g.lon]);
    if (lat === undefined || lng === undefined || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
    at.push({ lng, lat });
    const { x, y } = projectLngLat([lng, lat]);
    return [{ ...n, position: { x, y } }];
  });
  const kept = new Set(nodes.map((n) => n.id));
  const edges = data.edges.filter((e) => kept.has(e.source) && kept.has(e.target));
  return { graph: { nodes, edges } as GraphData, at };
}

/** Where the map opens: the middle of the placed points, zoomed to hold them. */
export function mapView(at: Placed[]): { center: [number, number]; zoom: number } {
  if (!at.length) return { center: [0, 20], zoom: 1 };
  const lngs = at.map((p) => p.lng);
  const lats = at.map((p) => p.lat);
  const [west, east, south, north] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const span = Math.max(east - west, (north - south) * 1.6, 0.5);
  return { center: [(west + east) / 2, (south + north) / 2], zoom: Math.min(10, Math.max(1, Math.log2(300 / span))) };
}

function MapReady({ onReady }: { onReady: (canvas: GraphCanvas | null) => void }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}

/**
 * `kind: "map"` — a graph on a map: each node placed by its type's latitude and
 * longitude (`geo`), its edges drawn between placed nodes, over a MapLibre basemap
 * that follows the board's theme (light or dark, tinted with its palette), or a
 * plain background with `basemap: 'none'`.
 *
 * Registers its engine under `canvasId`, as a `canvas` panel does, so a host's
 * selection, focus and camera reach it the same way. MapLibre owns pan and zoom,
 * so the canvas's own pan and wheel behaviours are not mounted.
 */
export function MapPanel({ options }: PanelRendererProps<MapPanelOptions>) {
  const board = useCanvasBoardContext('map');
  const canvasId = options.canvasId ?? DEFAULT_CANVAS_ID;
  const { resolveData, register } = board;
  const data = useMemo(() => resolveData(options.dataRef), [resolveData, options.dataRef]);
  const geoKey = JSON.stringify(options.geo);
  // Placed again when the graph or its geo changes, compared by value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const placed = useMemo(() => (data ? placeOnMap(data, options.geo) : undefined), [data, geoKey]);
  const viewKey = JSON.stringify(mapView(placed?.at ?? []));
  // By value: a re-read over the same points keeps the view.
  const view = useMemo(() => JSON.parse(viewKey) as ReturnType<typeof mapView>, [viewKey]);
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const onReady = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      register(canvasId, c);
    },
    [register, canvasId],
  );
  // Each type's colour and label, as a `canvas` panel applies them.
  const stylingKey = JSON.stringify(options.styling ?? {});
  // The same styling by value keeps its identity, so it is not applied again every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const styling = useMemo(() => options.styling ?? {}, [stylingKey]);
  useApplyTypeStyling(canvas, BOARD_IDS.graph, styling, true);

  const config = useMemo<CanvasConfig>(() => {
    return {
      activeLayout: 'none', // positions are geographic
      fitOnLoad: false, // the map owns the camera
      layers: {
        map:
          options.basemap === 'none'
            ? { styleUrl: null }
            : { basemap: 'themed', styleUrl: options.styleUrl || null },
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 4 },
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 0.8,
              labelFontSize: 10,
              labelPlacement: 'bottom',
              labelOffsetY: 4,
              labelMinZoom: 64, // camera scale is 2 ** map zoom: labels from map zoom 6
            },
          },
          edge: {
            style: {
              shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.35 } },
              strokeWidth: 0.8,
              strokeAlpha: 0.5,
              arrowTargetShape: 'none',
            },
          },
        },
      },
    } as CanvasConfig;
  }, [options.basemap, options.styleUrl]);

  if (!data || !placed) {
    return (
      <p className="text-muted-foreground p-3 text-base">
        No graph for <span className="font-mono">{options.dataRef}</span>.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <GraphCanvasRoot autoResize config={config} className="h-full w-full">
          {/* Publishes the board's theme, which the basemap and the nodes follow. */}
          <ThemeBehaviour id="theme" />
          <CanvasThemeSync source="library" />
          <MapLayer id="map" center={view.center} zoom={view.zoom} />
          <GraphLayer id={BOARD_IDS.graph} data={placed.graph} />
          <NodeScaleLODBehaviour id="node-scale-lod" layers={[{ targetLayerId: BOARD_IDS.graph, sizePx: 3 }]} />
          <EdgeScaleLODBehaviour id="edge-scale-lod" layers={[{ targetLayerId: BOARD_IDS.graph, strokeWidthPx: 0.8 }]} />
          <HoverActivateBehaviour id="hover" targetLayerId={BOARD_IDS.graph} state="highlighted" />
          <ClickSelectBehaviour id={BOARD_IDS.clickSelect} targetLayerId={BOARD_IDS.graph} />
          <FocusBehaviour id="focus" targetLayerId={BOARD_IDS.graph} />
          <MapReady onReady={onReady} />
        </GraphCanvasRoot>
      </div>
      {options.note && <p className="text-muted-foreground border-t px-3 py-1 text-xs">{options.note}</p>}
    </div>
  );
}
