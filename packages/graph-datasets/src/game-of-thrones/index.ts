// @invana/graph-datasets/game-of-thrones — the dataset's two halves.
//
// Its own subpath entry because the graph is large (~5k nodes / 29k edges) and
// has no business inflating the main bundle.
//
//   import { gameOfThrones, gameOfThronesSettings } from '@invana/graph-datasets/game-of-thrones';
//   <GraphCanvasApp data={gameOfThrones} config={gameOfThronesSettings} />

export * from './data';
export { settings as gameOfThronesSettings } from './settings';
