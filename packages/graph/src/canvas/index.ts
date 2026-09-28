/**
 * `@invana/graph/canvas` — the `GraphCanvas` entry point. It inherits the
 * serialisable `update()` / `get()` config engine from `@invana/canvas`
 * (`CanvasConfig`).
 */

export { GraphCanvas } from './GraphCanvas';
export type { GraphCanvasOptions } from './GraphCanvas';
export { DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS, eraseCommand, registerGraphEditCommands } from './graphCommands';
export type {
  GraphEditAccess,
  GraphCommandMap,
  GraphCanvasCommandMap,
  EditCommandName,
  RegisterGraphEditCommandsOptions,
} from './graphCommands';
export { resolveSelectMode, selectModePatch } from './selectMode';
export {
  clearGraphLayer,
  selectedElementIds,
  copySelection,
  cutSelection,
  deleteSelection,
  pasteAndSelect,
  edgePathType,
  setEdgePathType,
} from './graphActions';
