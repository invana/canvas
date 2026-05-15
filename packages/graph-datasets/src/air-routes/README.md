# air-routes

World airports + land outline geo data, packaged for the `@invana/canvas`
maplibre stories. Mirrors the dataset referenced by Observable's
[`@d3/world-airports`](https://observablehq.com/@d3/world-airports)
notebook.

## Files

| File | Contents | Bytes |
|---|---|---|
| `airports.csv` | Source CSV — `name, longitude, latitude` per row. 2980 airports. Kept as the canonical source for reproducibility. |
| `airports.json` | Parsed array — `Array<{ name, lng, lat }>`. Generated from `airports.csv` (numeric coords rounded to 6 decimals). This is what `index.ts` imports. |
| `land-50m.json` | TopoJSON of world land outlines at 1:50,000,000 scale (Natural Earth). Used by the d3 notebook's basemap stroke; available here for any story that wants to render land paths without a tile basemap. |
| `index.ts` | Public exports: `airports`, `landTopology`, types. |

## Public API

```ts
import { airports, landTopology, type Airport, type LandTopology } from '@invana/graph-datasets';
```

- `airports: Airport[]` — `2980` entries from `airports.csv`. Position is `[lng, lat]` in degrees, WGS-84. No stable identifier in source — synthesize one from the array index when feeding `GraphLayer` (`id: 'ap-' + i`).
- `landTopology: LandTopology` — TopoJSON `Topology` with a single `objects.land` `MultiPolygon`. Bbox `[-180, -89.999, 180, 83.6]`, 1425 arcs.

## Sources & attribution

- **Notebook**: Observable [`@d3/world-airports`](https://observablehq.com/@d3/world-airports) by Mike Bostock — the visual + data design we mirror.
- **Airports CSV**: derived from the d3 notebook's `airports.csv` attachment.
- **Land TopoJSON**: 1:50m Natural Earth land polygons (https://www.naturalearthdata.com/) converted to TopoJSON.

The Natural Earth data is in the public domain. The airports CSV is bundled
in the source notebook with permissive use; downstream redistribution should
keep this attribution.

## Used by

- `apps/storybook/stories/graph-layers/maplibre/Airports.stories.ts` — every airport plotted as a dot over an OpenFreeMap basemap.
- `apps/storybook/stories/graph-layers/maplibre/Routes.stories.ts` — same airports plus a Delaunay-triangulated route graph drawn as great-circle polylines.

## Regenerating `airports.json` from `airports.csv`

The JSON is the build-time artifact `index.ts` consumes. If `airports.csv`
is replaced, rebuild with:

```bash
python3 - <<'PY'
import csv, json
out = []
with open('packages/graph-datasets/src/air-routes/airports.csv') as f:
    for row in csv.DictReader(f):
        try:
            lng = float(row['longitude'])
            lat = float(row['latitude'])
        except (ValueError, KeyError):
            continue
        if abs(lng) > 180 or abs(lat) > 90:
            continue
        out.append({'name': row['name'], 'lng': round(lng, 6), 'lat': round(lat, 6)})
with open('packages/graph-datasets/src/air-routes/airports.json', 'w') as f:
    json.dump(out, f, separators=(',', ':'))
print(f'{len(out)} airports')
PY
```
