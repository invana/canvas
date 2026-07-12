# Game of Thrones dataset

A multi-entity **property graph** of HBO's *Game of Thrones*, derived from
[Jeffrey Lancaster's open GoT data](https://github.com/jeffreylancaster/game-of-thrones)
— the source behind the well-known [force-directed character viz](https://jeffreylancaster.com/game-of-thrones/force-directed/).

Ships on its own subpath (the graph is ~5 MB, kept out of the main bundle):

```ts
import { gameOfThrones } from '@invana/graph-datasets/game-of-thrones';
```

## Shape

Authored directly in this package's property-graph shape — `{ id, label, properties }`
vertices and `{ id, label, source, target, properties }` edges. `game-of-thrones.json`
is the serialisation; `index.ts` is a thin typed view (no runtime reshaping).

| Vertex `label` | Count | Notes |
|---|--:|---|
| `character` | 577 | `name`, `house`, `screenTimeSeconds`, `sceneCount`, `episodeCount` |
| `scene` | 4,165 | `start`/`end` timecodes, `durationSeconds`, `location`, `characterCount` |
| `subLocation` | 96 | e.g. Castle Black, Red Keep |
| `episode` | 73 | `title`, `airDate`, IMDb `link`, `description` |
| `location` | 26 | e.g. King's Landing, Winterfell |
| `house` | 14 | Stark, Targaryen, Night's Watch, … |
| `season` | 8 | |

| Edge `label` | Count | From → To | Properties |
|---|--:|---|---|
| `appears_in` | 12,114 | character → scene | — |
| `located_at` | 7,835 | scene → location / sub-location | — |
| `part_of` | 4,238 | episode → season, scene → episode | — |
| `co_appears_with` | 4,236 | character ↔ character (undirected) | `sharedScenes`, `sharedSeconds` |
| `member_of` | 153 | character → house | — |
| `within` | 103 | sub-location → location | — |

The `co_appears_with` edges reproduce the original force-directed network:
two characters are linked when they share a scene, weighted by the combined
screen time of their shared scenes.

## Consuming in a story

`@invana/graph`'s `GraphNode` / `GraphEdge` use `type` / `data`, so map at
`setData` time:

```ts
graph.setData({
  nodes: gameOfThrones.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
  edges: gameOfThrones.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label, data: e.properties })),
});
```

For just the classic character network, keep only `character` nodes and
`co_appears_with` edges.

## Regenerating

The raw upstream source (~1.8 MB of scene transcripts) is **not** stored in
the repo. Refresh the derived JSON by re-fetching and rebuilding:

```bash
node scripts/prepare-got.mjs   # from packages/graph-datasets
```

The script is idempotent (no timestamps → stable diffs).
