/**
 * **Geo Air Routes** — `<MapLayer>` + `<GraphLayer>` composition over the
 * world-airports dataset, dressed in the `<GraphCanvasApp>` shell. The MapLibre
 * basemap supplies geographic context; the graph layer projects every
 * "international" airport (a curated filter over the full 2,980-point set) to
 * mercator pixels with the package's standalone `projectLngLat(...)` and lays a
 * Delaunay-derived route web on top. Airport circles are sized by route degree
 * so hubs read at a glance; hovering an airport pulls flow particles along its
 * outbound routes.
 *
 * This is the app's **`bundle={false}`** case: MapLibre owns pan / zoom (the
 * canvas camera mirrors its transform), so the bundle's `DragPan` /
 * `WheelZoom` would fight it — the story composes its own layer / behaviour set
 * as children instead. The header's **basemap** picker swaps the MapLibre style
 * live through `config.layers.map.styleUrl`, and **Settings** docks
 * `<CanvasSettingsEditorPanel>` over that same config.
 *
 * Exercises: `MapLayer` integration, world-coord-pinned `GraphLayer`,
 * data-driven node radius, hover-driven edge decoration, swappable basemap
 * style, optional `MiniMapLayer`, pixel-constant node / edge sizing via the
 * scale-LOD behaviours.
 */

import 'maplibre-gl/dist/maplibre-gl.css?inline';

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EdgeScaleLODBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  MapLayer,
  MiniMapLayer,
  NodeScaleLODBehaviour,
} from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels,
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData, GraphNode } from '@invana/graph';
import { projectLngLat } from '@invana/graph-layer-maplibre';
import { airports } from '@invana/graph-datasets';
import { Delaunay } from 'd3-delaunay';
import { ThemeProvider } from '@invana/themes';
import { Map as MapIcon, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/by-casestudies/geo-air-routes/AirRoutes' };
export default meta;
type Story = StoryObj;

export const AirRoutesStory: Story = {
  name: 'AirRoutes',
  render: function Render() {
    // OpenFreeMap (no key required) — three styles cover the most-asked-for
    // basemap modes for a graph overlay.
    const STYLES = {
      liberty: 'https://tiles.openfreemap.org/styles/liberty',
      bright: 'https://tiles.openfreemap.org/styles/bright',
      positron: 'https://tiles.openfreemap.org/styles/positron',
    };

    const [basemap, setBasemap] = useState<keyof typeof STYLES>('positron');
    const [minimapOn, setMinimapOn] = useState(false);

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          ),
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    const data: GraphData = useMemo(() => {
      // The full set has 2,980 entries — too noisy for a hover-led story.
      // Filtering to names that read as a major hub gives ~250 airports: the
      // headline city-hub set every traveller recognises.
      const HUB_RE =
        /\b(International|Intl|Heathrow|Gatwick|Frankfurt|Charles De Gaulle|Schiphol|Haneda)\b/i;
      const hubs = airports.filter((a) => HUB_RE.test(a.name));

      // Project to world coords up front. `projectLngLat` is the same pure
      // mercator math `MapLayer.project` uses, exported as a free function so
      // the data can be pinned before any layer exists — positions stay stable
      // across map gestures because the canvas camera mirrors MapLibre's
      // transform.
      const points = hubs.map((a, i) => ({
        id: `ap-${i}`,
        name: a.name,
        ...projectLngLat([a.lng, a.lat]),
      }));

      // Delaunay edges over the projected coords — a plausible route web
      // without shipping a routes table.
      const delaunay = Delaunay.from(
        points,
        (p) => p.x,
        (p) => p.y,
      );
      const seen = new Set<string>();
      const rawEdges: { id: string; source: string; target: string }[] = [];
      const pushEdge = (i: number, j: number): void => {
        const lo = i < j ? i : j;
        const hi = i < j ? j : i;
        const key = `${lo}-${hi}`;
        if (seen.has(key)) return;
        seen.add(key);
        rawEdges.push({ id: `e-${rawEdges.length}`, source: `ap-${lo}`, target: `ap-${hi}` });
      };
      const tris = delaunay.triangles;
      for (let i = 0; i < tris.length; i += 3) {
        const a = tris[i]!;
        const b = tris[i + 1]!;
        const c = tris[i + 2]!;
        pushEdge(a, b);
        pushEdge(b, c);
        pushEdge(c, a);
      }

      // Route degree per airport — drives the circle radius.
      const degree = new Map<string, number>();
      for (const p of points) degree.set(p.id, 0);
      for (const e of rawEdges) {
        degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
        degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
      }

      return {
        nodes: points.map((p) => ({
          id: p.id,
          type: 'Airport',
          position: { x: p.x, y: p.y },
          data: { name: p.name, degree: degree.get(p.id) ?? 0 },
        })),
        edges: rawEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: 'ROUTE' })),
      };
    }, []);

    const config: CanvasConfig = useMemo(
      () => ({
        // Positions are geographic — nothing to lay out.
        activeLayout: 'none',
        // The map owns the camera; the app's one-shot fit would fight its
        // initial view.
        fitOnLoad: false,
        layers: {
          map: { styleUrl: STYLES[basemap], center: [0, 25], zoom: 1.6 },
          graph: {
            node: {
              style: {
                shape: (n: GraphNode) => ({
                  kind: 'circle' as const,
                  // sqrt scales 1 → 12 routes into ~3 → 7 px radius; the long
                  // tail stays readable.
                  radius: 2 + Math.sqrt((n.data as { degree: number }).degree) * 1.4,
                }),
                labelText: (n: GraphNode) => (n.data as { name: string }).name,
                bgFill: 0xff6b35,
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 0.6,
                bgAlpha: 0.92,
                labelColor: 0x111827,
                labelFontSize: 10,
                labelPlacement: 'bottom',
                labelOffsetY: 4,
                labelBackgroundFill: 0xffffff,
                labelBackgroundAlpha: 0.85,
                labelBackgroundPadding: 2,
                labelBackgroundCornerRadius: 2,
                // Everything stays unlabelled until past world view; the label
                // set is small enough that overlap is rare beyond zoom 3.
                labelMinZoom: 3,
              },
              state: {
                hovered: {
                  bgFill: 0xfacc15,
                  bgStrokeColor: 0xfacc15,
                  bgStrokeWidth: 1.8,
                  labelForceShow: true,
                },
                dimmed: { bgAlpha: 0.15 },
              },
            },
            edge: {
              style: {
                shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.35 } },
                strokeColor: 0x475569,
                strokeWidth: 0.6,
                strokeAlpha: 0.45,
                arrowTargetShape: 'none',
              },
              state: {
                hovered: {
                  strokeColor: 0xfacc15,
                  strokeAlpha: 0.95,
                  strokeWidth: 1.4,
                  decorations: [
                    {
                      id: 'route-glow',
                      kind: 'flow-particles-connector',
                      color: 0xfacc15,
                      count: 3,
                      size: 3,
                      speedPxPerSec: 120,
                    },
                  ],
                },
                dimmed: { strokeAlpha: 0.05 },
              },
            },
          },
          minimap: { position: 'top-right', width: 200, height: 140 },
        },
        behaviours: {
          hover: { enabled: true, state: 'hovered', inactiveState: 'dimmed', degree: 1, direction: 'both' },
          'node-scale-lod': { enabled: true },
          'edge-scale-lod': { enabled: true },
        },
      }),
      // STYLES is a render-local literal; only the picked basemap matters.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [basemap],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Drag / zoom the basemap · hover an airport to trace its routes');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          // MapLibre drives the camera, so the bundle's pan / wheel behaviours
          // (and its background layer — the basemap *is* the background) would
          // fight it. Compose the scene from children instead.
          bundle={false}
          onReady={onReady}
          header={{
            title: 'Geo Air Routes',
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'basemap',
                    label: 'Basemap',
                    value: basemap,
                    options: { liberty: 'Liberty', bright: 'Bright', positron: 'Positron' },
                    onChange: (v) => setBasemap(v as keyof typeof STYLES),
                  },
                  {
                    type: 'toggle',
                    key: 'minimap',
                    icon: MapIcon,
                    label: 'Minimap: off',
                    activeLabel: 'Minimap: on',
                    active: minimapOn,
                    onToggle: () => setMinimapOn((v) => !v),
                  },
                  ...dock.items,
                  {
                    type: 'toggle',
                    key: 'theme',
                    icon: Sun,
                    activeIcon: Moon,
                    label: 'Switch to dark theme',
                    activeLabel: 'Switch to light theme',
                    active: ctx.themeKind === 'dark',
                    onToggle: ctx.toggleTheme,
                  },
                ]}
              />
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={dock.region}
        >
          {/* The basemap, under everything. It mounts its own MapLibre canvas
              beneath the Pixi one and mirrors its transform into the camera. */}
          <MapLayer id="map" />

          {/* Airports pinned at their mercator positions. The map layer sits at
              `zIndex: -100`, so the graph's default order puts it on top. */}
          <GraphLayer id="graph" data={data} />

          {/* Pixel-constant sizing keeps the circles and routes legible from
              world view down to street level. */}
          <NodeScaleLODBehaviour
            id="node-scale-lod"
            layers={[{ targetLayerId: 'graph', sizePx: 5, strokeWidthPx: 0.6 }]}
          />
          <EdgeScaleLODBehaviour
            id="edge-scale-lod"
            layers={[{ targetLayerId: 'graph', strokeWidthPx: 0.6 }]}
          />
          <HoverActivateBehaviour id="hover" targetLayerId="graph" />

          {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
