/**
 * **Detail levels as config patches** — one mechanism for every board that
 * redraws its types at a chosen level of detail (the schema board's circles ·
 * cards · schema cards, a DAG's circles · cards).
 *
 * A level is a `Partial<CanvasConfig>` merged over the board's config. Two
 * things in it are filled in against the data, so a template names no type:
 *
 * | In the template | Becomes |
 * |---|---|
 * | node type `*` | one binding per node type that has no binding of its own |
 * | a structure named `prefix:*` | `prefix:<type>`, built once per type by `structures[prefix](name, node)` |
 *
 * ```ts
 * const patch = detailConfig(config, templates.low, data, {
 *   structures: { schema: (name, node) => schemaCardStructure(name, node.data) },
 * });
 * ```
 *
 * `useDetailTemplates` applies a level live: patch, then re-run the active
 * layout with the camera following — a new node size needs new positions.
 */

import { useEffect, useRef, useState } from 'react';
import { type CanvasConfig, deepMerge } from '@invana/canvas';
import type { GraphCanvas, GraphData, GraphNode, NodeStructureTemplate, NodeTypeBinding } from '@invana/graph';

/** A board's Detail levels: one patch and one label per level, and where it opens. */
export interface DetailTemplates<L extends string = string> {
  templates: Record<L, Partial<CanvasConfig>>;
  /** The switcher's label per level, in the order it lists them. */
  options: Record<L, string>;
  initial: L;
}

/** Builds the per-type structure a `prefix:*` template names. */
export type DetailStructureBuilder = (name: string, node: GraphNode) => NodeStructureTemplate;

export interface DetailConfigOptions {
  /** The graph layer the bindings live on. Default `'graph'`. */
  layerId?: string;
  /** The node type that stands for "every other type". Default `'*'`. */
  wildcard?: string;
  /** Per-type structure builders, by the prefix before `:*`. */
  structures?: Record<string, DetailStructureBuilder>;
}

interface LayerJson {
  nodeStructureTemplates?: Record<string, unknown>;
  nodeTypes?: Record<string, NodeTypeBinding>;
}

const layerOf = (c: Partial<CanvasConfig> | undefined, id: string): LayerJson =>
  ((c?.layers as Record<string, unknown> | undefined)?.[id] ?? {}) as LayerJson;

/**
 * The patch one level applies to `data`: the level's template, with the
 * wildcard binding expanded per type and every `prefix:*` structure built.
 */
export function detailConfig(
  base: CanvasConfig,
  template: Partial<CanvasConfig>,
  data: GraphData,
  { layerId = 'graph', wildcard = '*', structures: builders = {} }: DetailConfigOptions = {},
): Partial<CanvasConfig> {
  const own = { ...layerOf(base, layerId).nodeTypes, ...layerOf(template, layerId).nodeTypes };
  const binding = own[wildcard];
  if (!binding) return template;
  const prefix = binding.structure.endsWith(':*') ? binding.structure.slice(0, -2) : null;
  const build = prefix !== null ? builders[prefix] : undefined;

  const nodeTypes: Record<string, NodeTypeBinding> = {};
  const structures: Record<string, NodeStructureTemplate> = {};
  for (const node of data.nodes) {
    const type = node.type;
    if (!type || type === wildcard || nodeTypes[type] || own[type]) continue;
    if (prefix === null) {
      nodeTypes[type] = binding;
      continue;
    }
    const name = `${prefix}:${type}`;
    if (build) structures[name] = build(name, node);
    nodeTypes[type] = { ...binding, structure: name };
  }
  return deepMerge(template, {
    layers: { [layerId]: { nodeStructureTemplates: structures, nodeTypes } },
  }) as Partial<CanvasConfig>;
}

export interface UseDetailTemplatesOptions<L extends string> extends DetailConfigOptions {
  canvas: GraphCanvas | null;
  config: CanvasConfig;
  detail: DetailTemplates<L>;
  data: GraphData;
  /** The layout a level change re-runs. */
  layout: string;
  /** Screen-px margin of the re-run's fit. Default `60`. */
  fitPadding?: number;
  /** The re-run's fit never zooms in past this. */
  fitMaxZoom?: number;
  /** Opens on this level instead of `detail.initial`. */
  initial?: L;
}

export interface DetailTemplatesState<L extends string> {
  level: L;
  setLevel: (level: L) => void;
  /** The config to mount on: `config` with the opening level merged in. */
  initialConfig: CanvasConfig;
}

/**
 * The current Detail level, applied live: on a level change or new data the
 * level's patch is written with `canvas.update` and the layout re-runs with
 * the camera following. Nothing remounts — selection and camera survive.
 */
export function useDetailTemplates<L extends string>({
  canvas,
  config,
  detail,
  data,
  layout,
  fitPadding = 60,
  fitMaxZoom,
  initial,
  ...opts
}: UseDetailTemplatesOptions<L>): DetailTemplatesState<L> {
  const [level, setLevel] = useState<L>(initial ?? detail.initial);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [initialConfig] = useState(
    () => deepMerge(config, detailConfig(config, detail.templates[level], data, opts)) as CanvasConfig,
  );

  useEffect(() => {
    if (!canvas || data.nodes.length === 0) return;
    canvas.stopLayout();
    canvas.update({ ...detailConfig(config, detail.templates[level], data, optsRef.current), activeLayout: layout });
    void canvas.runLayout(layout, {
      fitCamera: { padding: fitPadding, ...(fitMaxZoom !== undefined ? { maxZoom: fitMaxZoom } : {}) },
    });
  }, [canvas, config, detail, level, data, layout, fitPadding, fitMaxZoom]);

  return { level, setLevel, initialConfig };
}
