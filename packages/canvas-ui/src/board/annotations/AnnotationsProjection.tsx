/**
 * `AnnotationsProjection` — the board's annotations drawn **in the graph**.
 *
 * Renders nothing. It keeps the graph layer's annotation elements in step with
 * the provider's annotations, so layouts place the cards, the theme colours
 * them and an export carries them:
 *
 * | Annotation | In the graph |
 * |---|---|
 * | note · value | a card node beside its first record, a dashed `annotates` link to it |
 * | note · value, shown as badges | one count pill per record, linked to it |
 * | highlight | an `annotation-<colour>` ring on each record, and on the relationships among them |
 * | group | a member frame round its records — never their parent |
 *
 * Every write is unrecorded (`store.internal`): undo never reaches a card, and
 * the unsaved tracker never counts one. A new card on a settled board is placed
 * beside its record pinned, so the active layout does not re-run under it; it
 * is unpinned on the next frame, so the next layout run lays it out with the
 * data. A card that arrives while a layout runs joins that run. A card already
 * drawn keeps its place. A hidden annotation is removed — it takes no space.
 */

import { readCssColor } from '@invana/graph';
import { useBoardMode, useGraphCanvas } from '@invana/canvas-react';
import {
  ANNOTATION_CARD_HEIGHT,
  ANNOTATION_CARD_WIDTH,
  ANNOTATION_COUNT_TYPE,
  ANNOTATION_EDGE_TYPE,
  ANNOTATION_GROUP_TYPE,
  ANNOTATION_NODE_TYPE,
  ANNOTATION_VALUE_CARD_HEIGHT,
  ANNOTATION_VALUE_TYPE,
  annotationTemplates,
  isAnnotationElement,
  placeBeside,
  type EdgeStyle,
  type GraphEdge,
  type GraphLayer,
  type GraphNode,
  type NodeStyle,
} from '@invana/graph';
import type { AnnotationColor } from '@invana/ui';
import { useEffect, useRef, useState } from 'react';

import { BOARD_IDS } from '../presets';
import { DRAFT_ID, useAnnotations } from './AnnotationsProvider';
import { ANNOTATION_TOKEN, type BoardAnnotation } from './types';

const COLORS: AnnotationColor[] = ['amber', 'blue', 'green', 'red', 'grey'];
const FALLBACK: Record<AnnotationColor, number> = {
  amber: 0xd97706,
  blue: 0x2563eb,
  green: 0x16a34a,
  red: 0xdc2626,
  grey: 0x6b7280,
};
const COUNT_SIZE = { width: 28, height: 20 };
const NO_LABEL = { labelText: '' } as NodeStyle;

/** The card node drawn for an annotation. */
export const annotationNodeId = (id: string) => `${ANNOTATION_NODE_TYPE}:${id}`;
/** The frame node drawn for a group annotation. */
export const annotationGroupId = (id: string) => `${ANNOTATION_GROUP_TYPE}:${id}`;
/** The annotation a drawn element stands for — `null` for a count pill or a record. */
export function annotationIdOf(node: { id: string; type?: string | undefined; data?: unknown } | undefined): string | null {
  if (!node || !isAnnotationElement(node) || node.type === ANNOTATION_COUNT_TYPE) return null;
  return ((node.data ?? {}) as { annotationId?: string }).annotationId ?? null;
}

const stateOf = (c: AnnotationColor) => `annotation-${c}`;
const colorOf = (c: AnnotationColor) => readCssColor(ANNOTATION_TOKEN[c]) ?? FALLBACK[c];

interface WantNode {
  node: GraphNode;
  /** The record it sits beside, for a new one's place. */
  anchor?: string;
  size: { width: number; height: number };
}

/** A record's value as the card prints it. */
function fmt(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** The card templates and the highlight rings, once per layer instance. */
function install(layer: GraphLayer, done: WeakSet<GraphLayer>): void {
  if (done.has(layer)) return;
  layer.setOptions(annotationTemplates());
  layer.setStateConfigs(ringStyles());
  done.add(layer);
}

/** A highlight ring per colour, and the marked relationship's stroke — in the theme's colours. */
function ringStyles(): { node: Record<string, NodeStyle>; edge: Record<string, EdgeStyle> } {
  const node: Record<string, NodeStyle> = {};
  const edge: Record<string, EdgeStyle> = {};
  for (const c of COLORS) {
    const color = colorOf(c);
    node[stateOf(c)] = { decorations: [{ kind: 'ring', id: `annotation-ring-${c}`, color, width: 3, gap: 5, alpha: 1 }] };
    edge[stateOf(c)] = { strokeColor: color, strokeWidth: 4, strokeAlpha: 0.7 };
  }
  return { node, edge };
}

export function AnnotationsProjection() {
  const canvas = useGraphCanvas();
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas) ?? 'explore';
  const [themeStamp, setThemeStamp] = useState(0);
  // Per layer instance: a StrictMode remount, or a board re-created, gets a new layer.
  const installed = useRef(new WeakSet<GraphLayer>());
  // Cards placed and pinned, freed on the next frame — kept across re-runs, so
  // a re-run before that frame never leaves one pinned for good.
  const toFree = useRef(new Set<string>());
  const freeFrame = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (freeFrame.current !== null) cancelAnimationFrame(freeFrame.current);
    },
    [],
  );

  // The templates the cards draw with, and a ring per colour — on each layer
  // instance once, and the rings again on every theme change (their colour is the theme's).
  useEffect(() => {
    const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
    if (!layer) return;
    install(layer, installed.current);
    layer.setStateConfigs(ringStyles());
  }, [canvas, themeStamp]);
  useEffect(() => canvas.events.on('theme:change', () => setThemeStamp((s) => s + 1)), [canvas]);

  useEffect(() => {
    const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
    if (!layer) return;
    install(layer, installed.current);
    const store = layer.store;
    const drawing = mode !== 'focus';
    const density = mode === 'annotate' ? 'full' : ctx.view.density;
    const all: BoardAnnotation[] = ctx.draft ? [...ctx.annotations, ctx.draft] : [...ctx.annotations];
    const shown = drawing ? all.filter((a) => a.id === DRAFT_ID || (ctx.onBoard(a) && !ctx.hidden(a))) : [];

    // ── what the graph should hold ───────────────────────────────────────────
    const nodes = new Map<string, WantNode>();
    const edges = new Map<string, GraphEdge>();
    const nodeStates = new Map<string, Set<string>>();
    const edgeStates = new Map<string, Set<string>>();
    const counts = new Map<string, { n: number; color: AnnotationColor }>();
    const dashed = (color: AnnotationColor): Partial<EdgeStyle> => ({
      strokeColor: colorOf(color),
      strokeWidth: 1.2,
      strokeDashArray: [4, 3],
      arrowTargetShape: 'none',
    });
    const anchorOf = (r: { id: string; kind: 'node' | 'edge' }) => (r.kind === 'edge' ? store.getEdge(r.id)?.source : r.id);
    const loadedNode = (id: string | undefined): id is string => !!id && store.hasNode(id) && !isAnnotationElement(store.getNode(id));

    for (const a of shown) {
      if (a.kind === 'highlight') {
        const ids = new Set(a.records.filter((r) => r.kind === 'node' && loadedNode(r.id)).map((r) => r.id));
        for (const id of ids) (nodeStates.get(id) ?? nodeStates.set(id, new Set()).get(id)!).add(stateOf(a.color));
        for (const e of store.edges()) {
          if (ids.has(e.source) && ids.has(e.target)) (edgeStates.get(e.id) ?? edgeStates.set(e.id, new Set()).get(e.id)!).add(stateOf(a.color));
        }
        continue;
      }
      if (a.kind === 'group') {
        const members = a.records.filter((r) => r.kind === 'node' && loadedNode(r.id)).map((r) => r.id);
        if (members.length === 0) continue;
        const id = annotationGroupId(a.id);
        nodes.set(id, {
          size: { width: 40, height: 40 },
          node: {
            id,
            type: ANNOTATION_GROUP_TYPE,
            data: {
              annotationId: a.id,
              color: a.color,
              label: `${a.label || 'Group'} · ${members.length < a.records.length ? `${members.length} of ${a.records.length}` : `${members.length} records`}`,
            },
            style: {
              group: { autoFit: true, padding: 26, headerHeight: 24, members, showToggle: false },
              ...(members.length < a.records.length ? { bgStrokeDashArray: [5, 4] } : {}),
            } as NodeStyle,
          },
        });
        continue;
      }
      const rec = a.records[0];
      const anchor = rec ? anchorOf(rec) : undefined;
      if (!loadedNode(anchor)) continue;
      if (density === 'badges' && a.id !== DRAFT_ID) {
        const c = counts.get(anchor) ?? { n: 0, color: a.color };
        c.n += 1;
        counts.set(anchor, c);
        continue;
      }
      const id = annotationNodeId(a.id);
      let valueLine: string | undefined;
      if (a.kind === 'value' && a.prop && rec) {
        const target = rec.kind === 'node' ? store.getNode(rec.id) : store.getEdge(rec.id);
        const now = fmt((target?.data as Record<string, unknown> | undefined)?.[a.prop]);
        const then = a.valueThen === undefined ? undefined : fmt(a.valueThen);
        valueLine = then !== undefined && then !== now ? `${a.prop}  ${now} · was ${then}` : `${a.prop}  ${now}`;
      }
      nodes.set(id, {
        anchor,
        size: { width: ANNOTATION_CARD_WIDTH, height: valueLine ? ANNOTATION_VALUE_CARD_HEIGHT : ANNOTATION_CARD_HEIGHT },
        node: {
          id,
          type: valueLine ? ANNOTATION_VALUE_TYPE : ANNOTATION_NODE_TYPE,
          // The card prints its own text; no board label under it.
          style: NO_LABEL,
          data: {
            annotationId: a.id,
            text: a.text || (a.id === DRAFT_ID ? ' ' : ''),
            color: a.color,
            author: a.author.name,
            initials: a.author.initials ?? a.author.name.slice(0, 1).toUpperCase(),
            ...(a.meta ? { meta: a.meta } : {}),
            ...(valueLine ? { valueLine } : {}),
          },
        },
      });
      edges.set(`${ANNOTATION_EDGE_TYPE}:${a.id}`, {
        id: `${ANNOTATION_EDGE_TYPE}:${a.id}`,
        type: ANNOTATION_EDGE_TYPE,
        source: id,
        target: anchor,
        style: dashed(a.color),
      } as GraphEdge);
    }
    for (const [record, c] of counts) {
      const id = `${ANNOTATION_COUNT_TYPE}:${record}`;
      nodes.set(id, {
        anchor: record,
        size: COUNT_SIZE,
        node: { id, type: ANNOTATION_COUNT_TYPE, style: NO_LABEL, data: { count: String(c.n), color: c.color, recordId: record } },
      });
      edges.set(`${ANNOTATION_EDGE_TYPE}:count:${record}`, {
        id: `${ANNOTATION_EDGE_TYPE}:count:${record}`,
        type: ANNOTATION_EDGE_TYPE,
        source: id,
        target: record,
        style: dashed(c.color),
      } as GraphEdge);
    }

    // ── the difference, written once, unrecorded ─────────────────────────────
    const sig = (x: unknown) => JSON.stringify(x);
    const removedNodes: string[] = [];
    const removedEdges: string[] = [];
    const addedNodes: GraphNode[] = [];
    const addedEdges: GraphEdge[] = [];
    const updatedNodes: { id: string; patch: Partial<GraphNode> }[] = [];
    const updatedEdges: { id: string; patch: Partial<GraphEdge> }[] = [];
    for (const n of store.nodes()) if (isAnnotationElement(n) && !nodes.has(n.id)) removedNodes.push(n.id);
    for (const e of store.edges()) if (isAnnotationElement(e) && !edges.has(e.id)) removedEdges.push(e.id);
    const placed: string[] = [];
    const occupied: { x: number; y: number; width: number; height: number }[] = [];
    // While a layout runs, the records have no settled place to sit beside: a new
    // card joins that run instead — added unpinned, it is laid out with the data.
    const settled = !canvas.store.view.getState().runtime.layout.running;
    for (const [id, want] of nodes) {
      const have = store.getNode(id);
      if (!have) {
        const at = settled && want.anchor ? placeBeside(layer, want.anchor, want.size, { ignore: id, occupied }) : null;
        addedNodes.push({ ...want.node, ...(at ? { position: at, pinned: true } : {}) });
        if (at) {
          placed.push(id);
          occupied.push({ ...at, ...want.size });
        }
      } else if (have.type !== want.node.type || sig(have.data) !== sig(want.node.data) || sig(have.style ?? null) !== sig(want.node.style ?? null)) {
        updatedNodes.push({ id, patch: { type: want.node.type, data: want.node.data, ...(want.node.style ? { style: want.node.style } : {}) } });
      }
    }
    for (const [id, want] of edges) {
      const have = store.getEdge(id);
      if (!have) addedEdges.push(want);
      else if (have.target !== want.target || sig(have.style ?? null) !== sig(want.style ?? null)) {
        updatedEdges.push({ id, patch: { target: want.target, ...(want.style ? { style: want.style } : {}) } });
      }
    }
    if (removedNodes.length + removedEdges.length + addedNodes.length + addedEdges.length + updatedNodes.length + updatedEdges.length > 0) {
      store.internal.applyDelta({
        removed: { nodeIds: removedNodes, edgeIds: removedEdges },
        added: { nodes: addedNodes, edges: addedEdges },
        updated: { nodes: updatedNodes, edges: updatedEdges },
      });
    }

    // Highlights: each record's annotation rings, exactly.
    store.internal.run(() => {
      for (const n of store.nodes()) {
        for (const s of store.nodeStatesOf(n.id)) {
          if (s.startsWith('annotation-') && !nodeStates.get(n.id)?.has(s)) store.removeNodeState(n.id, s);
        }
      }
      for (const [id, want] of nodeStates) for (const s of want) if (!store.nodeStatesOf(id).includes(s)) store.addNodeState(id, s);
      for (const e of store.edges()) {
        for (const s of store.edgeStatesOf(e.id)) {
          if (s.startsWith('annotation-') && !edgeStates.get(e.id)?.has(s)) store.removeEdgeState(e.id, s);
        }
      }
      for (const [id, want] of edgeStates) for (const s of want) if (!store.edgeStatesOf(id).includes(s)) store.addEdgeState(id, s);
    });

    // Placed beside its record, pinned so the layout did not re-run; free from
    // the next frame, so the next run lays it out with the data.
    for (const id of placed) toFree.current.add(id);
    if (toFree.current.size > 0 && freeFrame.current === null) {
      freeFrame.current = requestAnimationFrame(() => {
        freeFrame.current = null;
        const ids = [...toFree.current].filter((id) => store.hasNode(id));
        toFree.current.clear();
        if (ids.length > 0) store.internal.applyDelta({ pinned: ids.map((id) => ({ id, pinned: false })) });
      });
    }
  }, [canvas, ctx, mode, themeStamp]);

  // Leaving the board: take every annotation element with it.
  useEffect(
    () => () => {
      const store = canvas.layers.get<GraphLayer>(BOARD_IDS.graph)?.store;
      if (!store) return;
      store.internal.applyDelta({
        removed: {
          nodeIds: [...store.nodes()].filter((n) => isAnnotationElement(n)).map((n) => n.id),
          edgeIds: [...store.edges()].filter((e) => isAnnotationElement(e)).map((e) => e.id),
        },
      });
    },
    [canvas],
  );

  return null;
}
