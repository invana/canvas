/**
 * **Geo annotations** — what you can mark on a map with `MapLayer` + `GraphLayer`:
 * **regions** (real polygon outlines), **clusters** (rounded outlines around a
 * group of places), and **category markers** (an icon per kind of place) whose
 * labels change with zoom. The sample data is Telangana, India — districts
 * around Hyderabad, Warangal and Siddipet, two heritage routes as clusters, and
 * cities, temples, forts, monuments, lakes and hills as markers — but nothing
 * below is specific to it: swap the three arrays for any `[lng, lat]` data.
 *
 * **Three zoom tiers on the markers**, all from existing engine pieces:
 *
 * | Map zoom       | A marker shows             | Driven by                                        |
 * |----------------|----------------------------|--------------------------------------------------|
 * | below 9        | its icon                   | `labelMinZoom` on the `graph` layer style        |
 * | 9 to 11.5      | icon + name                | the `label` binding (`data.name`)                |
 * | 11.5 and up    | icon + name + description  | `ZoomStateBehaviour` → each POI's `detail` state |
 *
 * The canvas camera mirrors MapLibre, so **camera scale = `2 ** mapZoom`**: a
 * zoom threshold of `512` in `config` is map zoom 9, `2896` is 11.5.
 *
 * **Layers**, bottom → top — all registered in `onReady`, all settings in `config`:
 *
 * - `map` — `MapLayer` (OpenFreeMap positron). MapLibre owns pan / zoom, so the
 *   app bundle is off: its solid background would cover the map and its
 *   pan / wheel behaviours would fight it (same as `geo-air-routes`).
 * - `geo` — `GeoFeaturesLayer`: one GeoJSON `Polygon` per district, drawn at a
 *   constant pixel width at every zoom and named at its visual centre until you are
 *   zoomed into one (map zoom 10.5). No projection in the story, no polygon nodes,
 *   no per-zoom border behaviours.
 * - `bubble-sets` — `BubbleSetsLayer`: a rounded outline around each **cluster**
 *   of markers, declared as `sets` in `config`. It measures members by their
 *   drawn size, so the pixel-constant markers need no anchor layer. Its radii are
 *   world units (the whole earth is 512), sized here for the opening zoom; its
 *   stroke is a world width too, so it thins as you zoom out.
 * - `graph` — the markers: a circle per POI coloured by its type, a Lucide icon
 *   inside, held at a constant screen size by `NodeScaleLODBehaviour`;
 *   `LabelCollisionBehaviour` hides a label that would overlap another. Cluster
 *   names ride here as label-only nodes so they share the markers' zoom tiers.
 *
 * **What stays on the records, and why** (the per-instance exception in
 * `apps/storybook/CLAUDE.md`): a region's **outline** and **colour** (each is one
 * of a kind, as simplestyle `properties` on its GeoJSON feature), a POI's **description** (its own text), and a cluster label's colour.
 * Everything per-type is config: the marker colour, size and label style, the
 * **icon** (`icon: { kind: 'named' }` in the styling template, drawn from the
 * layer's `iconSet`), and the zoomed-in **detail label**
 * (`nodeTypes.<type>.states.detail.label`, switched on by `ZoomStateBehaviour`).
 *
 * **Icons** are Lucide components rendered to SVG once by `iconSetFromLucide`;
 * from then on `iconSet` is plain name → markup data, drawn offline. Lucide has
 * no Hindu temple or mosque glyph: temples use `Flame` (a diya), mosques and
 * palaces `Landmark`.
 *
 * **Known gap.** `LabelCollisionBehaviour` hides a label that overlaps another
 * label, but it only compares labels with labels — a marker's body can still
 * sit on a neighbour's label where places are a few hundred metres apart.
 *
 * **Sample data.** Region outlines are Telangana district boundaries (2016+),
 * simplified (Douglas–Peucker, 0.004–0.012°) from
 * [datta07/INDIAN-SHAPEFILES](https://github.com/datta07/INDIAN-SHAPEFILES)
 * (`STATES/TELANGANA/TELANGANA_DISTRICTS.geojson`, MIT). POI coordinates are
 * approximate (± ~1 km) and the descriptions are one-line summaries.
 */

import 'maplibre-gl/dist/maplibre-gl.css?inline';

import { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasMessageBar, GraphCanvasApp, GraphStatusBar, iconSetFromLucide } from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import {
  GraphLayer,
  LabelCollisionBehaviour,
  NodeScaleLODBehaviour,
  ZoomStateBehaviour,
  type GraphCanvas,
  type GraphData,
  type GraphNode
} from '@invana/graph';
import { BubbleSetsLayer } from '@invana/graph-layer-bubble-sets';
import { GeoFeaturesLayer, MapLayer, projectLngLat, type GeoFeature } from '@invana/graph-layer-maplibre';
import { Building2, Castle, Flame, Landmark, Library, Mountain, Waves } from 'lucide-react';

const meta: Meta = {
  title: 'canvas-demos/by-casestudies/geo-annotations/GeoAnnotations'
};
export default meta;
type Story = StoryObj;

export const GeoAnnotationsStory: Story = {
  name: 'GeoAnnotations',
  render: function GeoAnnotationsRender() {
    // ─── Data: regions, POIs, clusters (all [lng, lat]) ─────────────────────

    const data = useMemo(() => {
      /**
       * Region outlines (sample: simplified district boundaries) — one closed
       * ring each, as `'lng,lat lng,lat …'` (a string keeps ~300 vertices on one
       * line apiece); `color` tints fill + border.
       */
      const REGIONS: { name: string; color: number; ring: string }[] = [
        {
          name: 'Hyderabad',
          color: 0x6366f1,
          ring: '78.4801,17.4827 78.4637,17.4727 78.4604,17.4465 78.4339,17.4512 78.4278,17.4443 78.4095,17.442 78.4097,17.4345 78.395,17.4231 78.404,17.4077 78.3928,17.4018 78.3951,17.3861 78.3676,17.3778 78.3881,17.3709 78.4286,17.3727 78.4269,17.3601 78.4423,17.349 78.4272,17.3511 78.4234,17.3407 78.4401,17.3363 78.4641,17.2986 78.4689,17.298 78.4773,17.3177 78.5072,17.3186 78.5066,17.3493 78.5175,17.3519 78.5223,17.3428 78.5288,17.3491 78.5319,17.3458 78.5298,17.3589 78.5408,17.3714 78.5292,17.3715 78.5278,17.4013 78.5222,17.4023 78.5348,17.404 78.5264,17.422 78.5369,17.4221 78.549,17.4376 78.5439,17.4432 78.5314,17.437 78.5178,17.4407 78.5223,17.4824 78.5003,17.483 78.4981,17.4746 78.5047,17.4685 78.4855,17.4563 78.4759,17.4635 78.4828,17.4759'
        },
        {
          name: 'Warangal Urban',
          color: 0xd97706,
          ring: '79.5531,18.267 79.5385,18.237 79.4738,18.23 79.462,18.1644 79.4312,18.1568 79.4192,18.1692 79.3991,18.1662 79.3969,18.1481 79.3794,18.1567 79.3656,18.1398 79.3274,18.1482 79.2939,18.1259 79.2608,18.003 79.2303,18.0017 79.2287,17.9878 79.2634,17.9836 79.2675,17.9527 79.3241,17.9438 79.3428,17.9212 79.3888,17.9009 79.4201,17.896 79.4374,17.9132 79.4478,17.9092 79.4584,17.8744 79.4832,17.8915 79.5052,17.8597 79.491,17.8211 79.5071,17.8186 79.5143,17.795 79.5529,17.7868 79.5647,17.7954 79.5592,17.8079 79.6216,17.8288 79.6189,17.876 79.6338,17.8725 79.6596,17.9299 79.6407,17.9558 79.6497,17.9695 79.6221,17.9731 79.6402,17.9849 79.6326,18.0112 79.6717,18.0271 79.651,18.0423 79.6209,18.0397 79.6233,18.0682 79.6033,18.0964 79.605,18.117 79.6271,18.1194 79.622,18.1374 79.6013,18.1415 79.6127,18.1885 79.597,18.1982 79.5821,18.2566'
        },
        {
          name: 'Warangal Rural',
          color: 0xca8a04,
          ring: '79.6336,18.2849 79.6204,18.2624 79.5859,18.2597 79.5781,18.2429 79.597,18.1982 79.6127,18.1885 79.6013,18.1415 79.6273,18.1246 79.605,18.117 79.6033,18.0964 79.6233,18.0682 79.6209,18.0397 79.651,18.0423 79.6717,18.0271 79.6326,18.0112 79.6402,17.9849 79.6221,17.9731 79.6497,17.9695 79.6407,17.9558 79.6593,17.9285 79.6338,17.8725 79.6189,17.876 79.6136,17.8211 79.5597,17.8081 79.5647,17.7954 79.5529,17.7868 79.5143,17.795 79.5054,17.7486 79.481,17.7453 79.5042,17.7242 79.481,17.7053 79.4906,17.6962 79.4813,17.6749 79.4898,17.6629 79.5222,17.6614 79.5245,17.6331 79.5405,17.6379 79.5637,17.6185 79.6139,17.6362 79.6164,17.6219 79.6355,17.6234 79.6825,17.6547 79.6914,17.6866 79.7141,17.6839 79.722,17.7009 79.7678,17.6867 79.7789,17.7032 79.798,17.7047 79.8244,17.6952 79.8215,17.7134 79.8636,17.7196 79.8692,17.7424 79.8934,17.7301 79.9037,17.7617 79.8835,17.7794 79.8756,17.8085 79.9107,17.8135 79.9154,17.7989 79.9387,17.8406 79.9472,17.8357 79.9528,17.8608 79.9754,17.8614 79.9912,17.8814 79.9943,17.917 79.9767,17.9524 79.9857,17.9537 79.994,18.0009 79.9794,18.0203 79.9919,18.1076 79.9795,18.1119 79.9363,18.0836 79.8845,18.0858 79.8872,18.0982 79.8145,18.0919 79.841,18.1347 79.7677,18.1519 79.724,18.1945 79.7358,18.205 79.6953,18.2509 79.6971,18.2778 79.6525,18.2525'
        },
        {
          name: 'Siddipet',
          color: 0x059669,
          ring: '79.0372,18.344 78.991,18.3009 78.9891,18.2597 78.8558,18.2347 78.7691,18.2628 78.7345,18.2147 78.6395,18.2567 78.5886,18.2487 78.5676,18.2226 78.581,18.1632 78.5667,18.1621 78.5453,18.1165 78.5793,18.1067 78.5698,18.0661 78.5896,18.0554 78.582,18.0324 78.5594,18.0461 78.5367,17.9875 78.5417,17.9412 78.5297,17.9249 78.5459,17.915 78.5243,17.8965 78.561,17.8703 78.5392,17.8604 78.5202,17.8068 78.5108,17.7553 78.5266,17.7507 78.5255,17.7286 78.5062,17.7193 78.4992,17.6857 78.5189,17.702 78.6069,17.685 78.6341,17.669 78.6695,17.6982 78.7296,17.6679 78.7767,17.6917 78.7819,17.7112 78.8155,17.7021 78.8216,17.7394 78.8597,17.7508 78.8676,17.8251 78.8887,17.8416 78.9222,17.8365 78.9211,17.8732 78.9456,17.8794 78.9987,17.8448 79.0202,17.8761 79.0438,17.8609 79.0922,17.8732 79.1243,17.9022 79.1023,17.9143 79.1535,17.992 79.2608,18.003 79.3012,18.13 79.2906,18.1512 79.2509,18.1542 79.2445,18.184 79.2106,18.1749 79.2123,18.1616 79.1879,18.1702 79.1625,18.1572 79.1372,18.2063 79.1082,18.2214 79.1337,18.2713 79.1147,18.2904 79.0705,18.2851 79.0598,18.3426'
        },
        {
          name: 'Mulugu',
          color: 0xdb2777,
          ring: '79.842,18.1325 79.8145,18.0919 79.9363,18.0836 79.9795,18.1119 80.0284,18.1164 80.0794,18.0705 80.1449,18.0949 80.2199,18.0462 80.2155,17.9948 80.2402,17.9921 80.2685,17.9506 80.3097,17.9753 80.3919,18.0817 80.4565,18.0603 80.4652,18.0904 80.4862,18.0738 80.542,18.1162 80.5658,18.051 80.6164,18.1184 80.6351,18.1095 80.6323,18.1424 80.6612,18.1313 80.6816,18.1656 80.755,18.0738 80.7562,18.1717 80.7368,18.1772 80.7372,18.2221 80.7941,18.2593 80.749,18.3083 80.7196,18.3911 80.7343,18.4131 80.6964,18.424 80.7054,18.4397 80.6553,18.4759 80.6376,18.5226 80.4872,18.6319 80.388,18.5957 80.3737,18.6116 80.2677,18.5899 80.2295,18.5533 80.2167,18.3895 80.1726,18.3494 80.1127,18.3925 79.8909,18.3993 79.8996,18.3711 79.9539,18.3395 79.9446,18.3184 79.8929,18.3171 79.8892,18.2853 79.8534,18.2597 79.8442,18.2144 79.8631,18.2029 79.8364,18.1864 79.8587,18.1503'
        }
      ];

      /** Points of interest. `type` picks the styling template (colour) and the icon. */
      const POIS: {
        id: string;
        type: string;
        name: string;
        description: string;
        lngLat: [number, number];
      }[] = [
        // Hyderabad
        {
          id: 'hyderabad',
          type: 'City',
          name: 'Hyderabad',
          lngLat: [78.4867, 17.385],
          description: 'State capital, founded by the Qutb Shahis in 1591'
        },
        {
          id: 'charminar',
          type: 'Monument',
          name: 'Charminar',
          lngLat: [78.4747, 17.3616],
          description: 'Four-minaret arch built in 1591, the symbol of the city'
        },
        {
          id: 'golconda',
          type: 'Fort',
          name: 'Golconda Fort',
          lngLat: [78.4011, 17.3833],
          description: 'Qutb Shahi citadel, once the diamond trade capital'
        },
        {
          id: 'qutb-shahi-tombs',
          type: 'Monument',
          name: 'Qutb Shahi Tombs',
          lngLat: [78.3949, 17.3946],
          description: 'Domed tombs of the seven Qutb Shahi sultans'
        },
        {
          id: 'chowmahalla',
          type: 'Monument',
          name: 'Chowmahalla Palace',
          lngLat: [78.4717, 17.3577],
          description: 'Seat of the Asaf Jahi Nizams, four palaces in one'
        },
        {
          id: 'mecca-masjid',
          type: 'Monument',
          name: 'Mecca Masjid',
          lngLat: [78.4733, 17.3604],
          description: 'One of India’s largest mosques, begun in 1617'
        },
        {
          id: 'birla-mandir',
          type: 'Temple',
          name: 'Birla Mandir',
          lngLat: [78.4691, 17.4062],
          description: 'White-marble Venkateswara temple on Naubat Pahad'
        },
        {
          id: 'hussain-sagar',
          type: 'Lake',
          name: 'Hussain Sagar',
          lngLat: [78.474, 17.4239],
          description: 'Heart-shaped lake with a monolithic Buddha statue'
        },
        {
          id: 'mir-alam',
          type: 'Lake',
          name: 'Mir Alam Tank',
          lngLat: [78.4335, 17.342],
          description: 'Multi-arch dam reservoir from 1806'
        },
        {
          id: 'salar-jung',
          type: 'Museum',
          name: 'Salar Jung Museum',
          lngLat: [78.4804, 17.3713],
          description: 'One of the largest one-man art collections in the world'
        },
        // Warangal Urban / Rural
        {
          id: 'warangal',
          type: 'City',
          name: 'Warangal',
          lngLat: [79.5941, 17.9689],
          description: 'Kakatiya capital from the 12th to 14th century'
        },
        {
          id: 'warangal-fort',
          type: 'Fort',
          name: 'Warangal Fort',
          lngLat: [79.6067, 17.9566],
          description: 'Kakatiya fort and its Kakatiya Kala Thoranam gateways'
        },
        {
          id: 'thousand-pillar',
          type: 'Temple',
          name: 'Thousand Pillar Temple',
          lngLat: [79.5745, 18.0037],
          description: 'Star-shaped Rudreswara temple, built in 1163'
        },
        {
          id: 'bhadrakali-temple',
          type: 'Temple',
          name: 'Bhadrakali Temple',
          lngLat: [79.5833, 17.9933],
          description: 'Hilltop goddess temple between Hanamkonda and Warangal'
        },
        {
          id: 'bhadrakali-lake',
          type: 'Lake',
          name: 'Bhadrakali Lake',
          lngLat: [79.578, 17.988],
          description: 'Lake beside the Bhadrakali temple hill'
        },
        {
          id: 'pakhal',
          type: 'Lake',
          name: 'Pakhal Lake',
          lngLat: [79.98, 17.95],
          description: 'Kakatiya-era lake built in 1213, ringed by forest'
        },
        // Mulugu
        {
          id: 'ramappa',
          type: 'Temple',
          name: 'Ramappa Temple',
          lngLat: [79.9436, 18.2593],
          description: 'UNESCO World Heritage Kakatiya temple, built in 1213'
        },
        {
          id: 'laknavaram',
          type: 'Lake',
          name: 'Laknavaram Lake',
          lngLat: [80.0526, 18.1617],
          description: 'Lake of islets joined by a suspension bridge'
        },
        // Siddipet
        {
          id: 'siddipet',
          type: 'City',
          name: 'Siddipet',
          lngLat: [78.8521, 18.1018],
          description: 'District headquarters town'
        },
        {
          id: 'komati-cheruvu',
          type: 'Lake',
          name: 'Komati Cheruvu',
          lngLat: [78.845, 18.096],
          description: 'Town lake with a lakefront park'
        },
        {
          id: 'komuravelli',
          type: 'Temple',
          name: 'Komuravelli Mallanna',
          lngLat: [78.9637, 17.9926],
          description: 'Hill shrine of Mallikarjuna, a major jatara site'
        },
        {
          id: 'nacharam',
          type: 'Temple',
          name: 'Nacharam Gutta',
          lngLat: [78.8, 17.83],
          description: 'Lakshmi Narasimha cave temple on a rocky hill'
        },
        {
          id: 'ranganayaka-sagar',
          type: 'Lake',
          name: 'Ranganayaka Sagar',
          lngLat: [78.82, 18.17],
          description: 'Kaleshwaram project reservoir'
        },
        {
          id: 'kondapochamma',
          type: 'Lake',
          name: 'Kondapochamma Sagar',
          lngLat: [78.68, 17.79],
          description: 'Kaleshwaram project reservoir near Markook'
        },
        // Outside the outlined regions
        {
          id: 'ananthagiri',
          type: 'Hill',
          name: 'Ananthagiri Hills',
          lngLat: [77.88, 17.32],
          description: 'Forested hills, source of the Musi river'
        },
        {
          id: 'yadagirigutta',
          type: 'Temple',
          name: 'Yadagirigutta',
          lngLat: [78.9451, 17.5873],
          description: 'Hilltop Lakshmi Narasimha temple, rebuilt in stone'
        }
      ];

      /**
       * Clusters — POI ids drawn as one rounded hull each; `padKm` is how
       * far the hull reaches past its outermost members.
       */
      const CLUSTERS = [
        {
          id: 'qutb-shahi',
          name: 'Qutb Shahi heritage',
          color: 0x7c3aed,
          padKm: 1.2,
          members: ['golconda', 'qutb-shahi-tombs', 'charminar', 'mecca-masjid', 'chowmahalla']
        },
        {
          id: 'kakatiya',
          name: 'Kakatiya heritage',
          color: 0xea580c,
          padKm: 4,
          members: ['warangal-fort', 'thousand-pillar', 'bhadrakali-temple', 'pakhal', 'ramappa', 'laknavaram']
        }
      ];

      // A cluster's name sits above its topmost member, centred on the members —
      // `BubbleSetsLayer` computes the outline itself, so the story never needs it.
      const clusterLabels = CLUSTERS.map((c) => {
        const at = c.members.map((id) => projectLngLat(POIS.find((poi) => poi.id === id)!.lngLat));
        return {
          ...c,
          position: {
            x: at.reduce((sum, p) => sum + p.x, 0) / at.length,
            y: Math.min(...at.map((p) => p.y))
          }
        };
      });

      // Regions are GeoJSON polygons for GeoFeaturesLayer: no projection, no recentring.
      const regionFeatures: GeoFeature[] = REGIONS.map((d) => ({
        type: 'Feature',
        id: `region:${d.name}`,
        properties: { name: d.name, stroke: d.color, fill: d.color },
        geometry: { type: 'Polygon', coordinates: [d.ring.split(' ').map((pair) => pair.split(',').map(Number) as [number, number])] }
      }));

      const pois: GraphData = {
        nodes: [
          ...POIS.map(
            (p): GraphNode => ({
              id: p.id,
              type: p.type,
              position: projectLngLat(p.lngLat),
              data: { name: p.name, description: p.description }
            })
          ),
          // Cluster names above the members — on this layer so they share the
          // markers' `labelMinZoom` and pixel-constant text.
          ...clusterLabels.map(
            (c): GraphNode => ({
              id: `cluster-label:${c.id}`,
              type: 'ClusterLabel',
              position: c.position,
              data: { name: c.name },
              style: { labelColor: c.color }
            })
          )
        ],
        edges: []
      };

      return { regionFeatures, pois };
    }, []);

    // ─── Config: every setting, as data ────────────────────────────────────

    const config = useMemo(
      () =>
        ({
          activeLayout: 'none',
          // MapLibre owns the camera; a one-shot fit would fight its initial view.
          fitOnLoad: false,
          layers: {
            map: {
              basemap: 'themed',
              center: [79.0, 17.85],
              zoom: 7.6,
              minZoom: 6,
              maxZoom: 14
            },
            // District borders: GeoJSON polygons, drawn at a constant pixel width at every
            // zoom, named at their visual centre until you are zoomed into one (map zoom 10.5).
            geo: {
              defaults: { polygon: { strokeWidthPx: 1.5, strokeOpacity: 0.85, fillOpacity: 0.12 } },
              labelFontPx: 12,
              labelColor: 0x334155,
              labelBackground: false,
              labelMaxZoom: 1448
            },
            // Cluster outlines. Radii are world units (the whole earth is 512), so
            // they are sized for the zoom the story opens at; members are measured
            // by their drawn size, so the pixel-constant markers need no anchor layer.
            'bubble-sets': {
              pixelGroup: 0.004,
              nodeR0: 0.03,
              nodeR1: 0.09,
              edgeR0: 0.02,
              edgeR1: 0.05,
              morphBuffer: 0.05,
              sets: [
                {
                  id: 'qutb-shahi',
                  members: ['golconda', 'qutb-shahi-tombs', 'charminar', 'mecca-masjid', 'chowmahalla'],
                  style: { fill: 0x7c3aed, fillOpacity: 0.16, stroke: 0x7c3aed, strokeWidth: 0.004 }
                },
                {
                  id: 'kakatiya',
                  members: ['warangal-fort', 'thousand-pillar', 'bhadrakali-temple', 'pakhal', 'ramappa', 'laknavaram'],
                  style: { fill: 0xea580c, fillOpacity: 0.16, stroke: 0xea580c, strokeWidth: 0.004 }
                }
              ]
            },
            graph: {
              // Icons by name: the templates below say `{ kind: 'named', name }`.
              // Lucide has no Hindu temple or mosque glyph: temples use `Flame`
              // (a diya), mosques and palaces `Landmark`.
              iconSet: iconSetFromLucide({
                city: Building2,
                temple: Flame,
                fort: Castle,
                monument: Landmark,
                lake: Waves,
                hill: Mountain,
                museum: Library
              }),
              nodeStructureTemplates: {
                marker: {
                  name: 'marker',
                  kind: 'simple',
                  shape: { kind: 'circle', radius: 10 },
                  slots: { label: true, icon: true }
                },
                labelOnly: {
                  name: 'labelOnly',
                  kind: 'simple',
                  shape: { kind: 'circle', radius: 1 },
                  slots: { label: true }
                }
              },
              nodeStylingTemplates: {
                city: {
                  name: 'city',
                  icon: { kind: 'named', name: 'city', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.58 },
                  fill: 0x334155,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  label: {
                    fontSize: 11,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                temple: {
                  name: 'temple',
                  icon: { kind: 'named', name: 'temple', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.58 },
                  fill: 0xea580c,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  label: {
                    fontSize: 11,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                fort: {
                  name: 'fort',
                  icon: { kind: 'named', name: 'fort', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.58 },
                  fill: 0x92400e,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  label: {
                    fontSize: 11,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                monument: {
                  name: 'monument',
                  icon: { kind: 'named', name: 'monument', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.58 },
                  fill: 0x7c3aed,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  label: {
                    fontSize: 11,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                lake: {
                  name: 'lake',
                  icon: { kind: 'named', name: 'lake', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.58 },
                  fill: 0x0284c7,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  label: {
                    fontSize: 11,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                hill: {
                  name: 'hill',
                  icon: { kind: 'named', name: 'hill', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.58 },
                  fill: 0x16a34a,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  label: {
                    fontSize: 11,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                museum: {
                  name: 'museum',
                  icon: { kind: 'named', name: 'museum', color: 0xffffff, strokeWidth: 2, sizeRatio: 0.58 },
                  fill: 0xdb2777,
                  stroke: 0xffffff,
                  strokeWidth: 1.5,
                  label: {
                    fontSize: 11,
                    placement: 'bottom',
                    offsetY: 4,
                    align: 'center',
                    color: 0x111827,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                },
                clusterLabel: {
                  name: 'clusterLabel',
                  fillAlpha: 0,
                  strokeAlpha: 0,
                  label: {
                    fontSize: 11,
                    fontWeight: 700,
                    fontStyle: 'italic',
                    placement: 'top',
                    offsetY: 14,
                    background: true,
                    backgroundColor: 0xffffff
                  }
                }
              },
              nodeTypes: {
                City: {
                  structure: 'marker',
                  styling: 'city',
                  bindings: { label: 'data.name' },
                  // Up close the label grows a second line.
                  states: { detail: { label: '{data.name}\n{data.description}' } }
                },
                Temple: {
                  structure: 'marker',
                  styling: 'temple',
                  bindings: { label: 'data.name' },
                  // Up close the label grows a second line.
                  states: { detail: { label: '{data.name}\n{data.description}' } }
                },
                Fort: {
                  structure: 'marker',
                  styling: 'fort',
                  bindings: { label: 'data.name' },
                  // Up close the label grows a second line.
                  states: { detail: { label: '{data.name}\n{data.description}' } }
                },
                Monument: {
                  structure: 'marker',
                  styling: 'monument',
                  bindings: { label: 'data.name' },
                  // Up close the label grows a second line.
                  states: { detail: { label: '{data.name}\n{data.description}' } }
                },
                Lake: {
                  structure: 'marker',
                  styling: 'lake',
                  bindings: { label: 'data.name' },
                  // Up close the label grows a second line.
                  states: { detail: { label: '{data.name}\n{data.description}' } }
                },
                Hill: {
                  structure: 'marker',
                  styling: 'hill',
                  bindings: { label: 'data.name' },
                  // Up close the label grows a second line.
                  states: { detail: { label: '{data.name}\n{data.description}' } }
                },
                Museum: {
                  structure: 'marker',
                  styling: 'museum',
                  bindings: { label: 'data.name' },
                  // Up close the label grows a second line.
                  states: { detail: { label: '{data.name}\n{data.description}' } }
                },
                ClusterLabel: {
                  structure: 'labelOnly',
                  styling: 'clusterLabel',
                  bindings: { label: 'data.name' }
                }
              },
              // Icons only below map zoom 9.
              node: {
                style: {
                  labelMinZoom: 512,
                  labelBackgroundAlpha: 0.88,
                  labelBackgroundPadding: 3,
                  labelBackgroundCornerRadius: 3
                }
              }
            }
          },
          behaviours: {
            'marker-scale': { enabled: true },
            // Places a few hundred metres apart would otherwise stack their labels.
            'label-collision': { enabled: true },
            // POI descriptions from map zoom 11.5.
            'poi-detail': { enabled: true, state: 'detail', minZoom: 2896 },
          }
        }) as unknown as CanvasConfig,
      []
    );

    // ─── Engine: register by id; settings come from `config` ─────────────────

    const onReady = useCallback(
      (canvas: GraphCanvas | null) => {
        if (!canvas) return;
        // Layers pick up `config.layers.<id>` as they land; data rides on the constructor.
        canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
        canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 1, options: { mapLayerId: 'map', features: data.regionFeatures } }));
        canvas.layers.add(
          new GraphLayer({
            id: 'graph',
            zIndex: 10,
            options: { initData: data.pois }
          })
        );
        // After `graph`: it resolves its source layer on mount.
        canvas.layers.add(
          new BubbleSetsLayer({
            id: 'bubble-sets',
            zIndex: 2,
            // `sets` and every algorithm option come from `config.layers['bubble-sets']`.
            options: { graphLayerId: 'graph', sets: [] }
          })
        );

        canvas.behaviours.register(
          new NodeScaleLODBehaviour({
            id: 'marker-scale',
            layers: [
              {
                targetLayerId: 'graph',
                preserveRelativeSize: true,
                strokeWidthPx: 1.5
              }
            ]
          })
        );
        canvas.behaviours.register(new LabelCollisionBehaviour({ id: 'label-collision', targetLayerId: 'graph' }));
        canvas.behaviours.register(new ZoomStateBehaviour({ id: 'poi-detail', targetLayerId: 'graph' }));
        // Config only reaches instances registered when it is applied — re-apply.
        canvas.update({ behaviours: config.behaviours });
        canvas.showMessage('Zoom in: icons → names → descriptions · tinted outlines are regions and clusters');
      },
      [data, config]
    );

    return (
      <GraphCanvasApp
        data={data.pois}
        config={config}
        bundle={false}
        theme
        onReady={onReady}
        header={{ title: 'Geo annotations' }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
      />
    );
  }
};
