// @invana/graph-datasets/topic-cartography — the dataset's two halves, both from `data.ts`.
//
// Its own subpath entry to keep the main bundle lean. Unlike the other large
// datasets it carries no JSON — it is generated from a seed at import time.
//
//   import { topicCartography, topicCartographySettings } from '@invana/graph-datasets/topic-cartography';
//   <GraphCanvasApp data={topicCartography} config={topicCartographySettings} />

export {
  topicCartography,
  data,
  generateTopicCartography,
  type TopicCartographyOptions,
} from './data';
export { settings as topicCartographySettings } from './data';
