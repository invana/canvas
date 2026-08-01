// @invana/graph-datasets/epic-saga — the dataset's two halves, both from `data.ts`.
//
// Its own subpath entry because the graph is large (~5k nodes / ~29k edges) and
// has no business inflating the main bundle. Unlike the other large datasets it
// carries no JSON — it is generated from a seed at import time.
//
//   import { epicSaga, epicSagaSettings } from '@invana/graph-datasets/epic-saga';
//   <GraphCanvasApp data={epicSaga} config={epicSagaSettings} />

export { epicSaga, data, generateEpicSaga, type EpicSagaOptions } from './data';
export { settings as epicSagaSettings } from './data';
