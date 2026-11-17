/**
 * **Zone analysis** — "which of these were inside this zone?", answered by drawing
 * the zone. An analyst opens a map of eighty vessels, draws a polygon around an
 * area of interest, and the vessels inside it are selected; a circle around a port
 * and a measured distance to the coast follow the same way. Every drawing is an
 * undoable edit, and everything drawn can be exported as GeoJSON for the brief.
 *
 * **What to do** (the tools are in the header; **Esc** leaves a tool):
 *
 * - **Polygon / circle / line** — click to place points, double-click or Enter to
 *   finish (a circle is centre, then radius). The finished shape is one feature
 *   with `author`, `reportedAt` and `tool`, and **one undo step** (`HistoryToolbar`).
 * - **Select on draw** is on: the moment a polygon or circle is added, the vessels
 *   inside it are selected — through the same `ClickSelectBehaviour` a lasso uses.
 * - **Ruler / area** — measure a distance (km and bearing) or an area (km²) on the
 *   sphere. A measurement is a look, never stored, never in the history.
 * - **Download** saves the drawn features as a `.geojson` file.
 *
 * While a tool is on, the map does not pan under the pen (the wheel still zooms);
 * leaving the tool gives it back.
 *
 * **Layers**, bottom → top: `map` (`MapLayer`), `geo` (`GeoFeaturesLayer`: what is
 * drawn), `graph` (the vessels, pixel-constant markers). **Behaviours**:
 * `draw` · `measure` · `query` (`AreaQueryBehaviour`, `autoQuery`) · `select`.
 * Everything is `data` + `config`; the three tools are registered in `onReady`.
 * Basemap tiles are OpenFreeMap, so this story needs the network.
 */

import 'maplibre-gl/dist/maplibre-gl.css?inline';

import { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasMessageBar, GeoToolsToolbar, GraphCanvasApp, GraphStatusBar, HistoryToolbar } from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import { ClickSelectBehaviour, GraphLayer, NodeScaleLODBehaviour, type GraphCanvas, type GraphData, type GraphNode } from '@invana/graph';
import {
  AreaQueryBehaviour,
  DrawGeoFeatureBehaviour,
  GeoFeaturesLayer,
  MapLayer,
  MeasureBehaviour,
  projectLngLat
} from '@invana/graph-layer-maplibre';

const meta: Meta = {
  title: 'canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis'
};
export default meta;
type Story = StoryObj;

export const ZoneAnalysisStory: Story = {
  name: 'ZoneAnalysis',
  render: function ZoneAnalysisRender() {
    // ─── Data: eighty vessels (volume is the subject, so generated, not listed) ───

    const data = useMemo((): GraphData => {
      let seed = 3;
      const rand = (): number => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
      const nodes: GraphNode[] = Array.from({ length: 80 }, (_, i) => ({
        id: `v${i}`,
        type: 'Vessel',
        position: projectLngLat([78.0 + rand() * 2.4, 16.9 + rand() * 1.6]),
        data: { name: `Vessel ${i}` }
      }));
      return { nodes, edges: [] };
    }, []);

    // ─── Config: every setting, as data ────────────────────────────────────

    const config = useMemo(
      () =>
        ({
          activeLayout: 'none',
          fitOnLoad: false,
          layers: {
            map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [79.2, 17.7], zoom: 7.9, minZoom: 3, maxZoom: 15 },
            geo: {
              defaults: { polygon: { fillOpacity: 0.18, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 }, point: { fillOpacity: 0.15, strokeWidthPx: 2.5 } },
              labelFontPx: 12
            },
            graph: { node: { style: { shape: { kind: 'circle', radius: 6 }, bgFill: 0x0284c7, bgStrokeColor: 0xffffff } } }
          },
          behaviours: {
            'marker-scale': { enabled: true },
            select: { enabled: true },
            draw: { enabled: true, tool: null, author: 'analyst-1', properties: { stroke: '#7c3aed', fill: '#7c3aed' } },
            measure: { enabled: true, tool: null },
            // Drawing a zone selects what is inside it.
            query: { enabled: true, autoQuery: true, withinKm: 0 }
          }
        }) as unknown as CanvasConfig,
      []
    );

    // ─── Engine: register by id; settings come from `config` ─────────────────

    const onReady = useCallback(
      (canvas: GraphCanvas | null) => {
        if (!canvas) return;
        canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
        canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features: [] } }));
        canvas.layers.add(new GraphLayer({ id: 'graph', zIndex: 10, options: { initData: data } }));
        canvas.behaviours.register(new NodeScaleLODBehaviour({ id: 'marker-scale', layers: [{ targetLayerId: 'graph', sizePx: 10, strokeWidthPx: 1.5 }] }));
        canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }));
        canvas.behaviours.register(new DrawGeoFeatureBehaviour({ id: 'draw', mapLayerId: 'map', featuresLayerId: 'geo' }));
        canvas.behaviours.register(new MeasureBehaviour({ id: 'measure', mapLayerId: 'map', featuresLayerId: 'geo' }));
        canvas.behaviours.register(new AreaQueryBehaviour({ id: 'query', targetLayerId: 'graph', featuresLayerId: 'geo', clickSelectId: 'select' }));
        // Config only reaches instances registered when it is applied — re-apply.
        canvas.update({ behaviours: config.behaviours });
        canvas.showMessage('Pick a tool in the header, draw a zone — the vessels inside it are selected · Esc leaves a tool');
      },
      [data, config]
    );

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        bundle={false}
        onReady={onReady}
        header={{ title: 'Zone analysis', center: <GeoToolsToolbar />, right: <HistoryToolbar showRedraw={false} /> }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
      />
    );
  }
};
