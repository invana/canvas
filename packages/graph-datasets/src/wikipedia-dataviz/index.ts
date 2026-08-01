// @invana/graph-datasets/wikipedia-dataviz — the dataset's two halves, both from `data.ts`.
//
// Its own subpath entry because the graph is large (~1.1 MB) and has no
// business inflating the main bundle.
//
//   import { wikipediaDataViz, wikipediaDataVizSettings } from '@invana/graph-datasets/wikipedia-dataviz';
//   <GraphCanvasApp data={wikipediaDataViz} config={wikipediaDataVizSettings} />

export { wikipediaDataViz, data } from './data';
export { settings as wikipediaDataVizSettings } from './data';
