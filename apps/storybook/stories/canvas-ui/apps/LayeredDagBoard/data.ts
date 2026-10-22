import type { DagLegendSpec } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';

const node = (id: string, column: number, text: string, tone: string, disabled = false) => ({
  id,
  type: 'step',
  data: { text, tone, column, ...(disabled ? { disabled } : {}) },
});
const edge = (source: string, target: string, extra: { label?: string; dashed?: boolean; highlight?: boolean } = {}) => ({
  id: `${source}->${target}`,
  type: extra.dashed ? 'binding' : 'order',
  source,
  target,
  data: extra,
});

/** A project plan: four waves of tasks, the critical path highlighted. */
export function projectPlan(): GraphData {
  return {
    nodes: [
      node('scope', 0, 'Scope the rollout\nPriya', 'success'),
      node('suppliers', 1, 'List single-sourced parts\nSam', 'info'),
      node('routes', 1, 'Map the affected routes\nPriya', 'success'),
      node('risk', 2, 'Score supplier risk\nAssistant', 'warning'),
      node('review', 3, 'Review with operations\nYou', 'muted'),
    ],
    edges: [
      edge('scope', 'suppliers', { highlight: true }),
      edge('scope', 'routes'),
      edge('suppliers', 'risk', { highlight: true }),
      edge('routes', 'risk'),
      edge('risk', 'review', { highlight: true }),
    ],
  } as unknown as GraphData;
}

export const PLAN_LEGEND: DagLegendSpec = {
  keys: [
    { swatch: 'node', tone: 'success', label: 'done' },
    { swatch: 'node', tone: 'info', label: 'in progress · critical path' },
    { swatch: 'node', tone: 'warning', label: 'review · needs input' },
    { swatch: 'node', tone: 'muted', label: 'blocked · waiting on dependencies' },
    { swatch: 'edge', label: 'finish → start' },
  ],
  note: 'Columns are waves — what can run in parallel.',
};

/** An agent's envelope: the steps it may run in one column, the ones it may not in the next. */
export function envelope(): GraphData {
  return {
    nodes: [
      node('plan', 0, 'plan', 'success'),
      node('translate', 0, 'translate', 'success'),
      node('read', 0, 'execute_graph_query', 'success'),
      node('write', 1, 'write_graph', 'muted', true),
      node('schema', 1, 'change_schema', 'muted', true),
    ],
    edges: [edge('plan', 'translate', { label: 'require' }), edge('translate', 'read', { label: 'require' })],
  } as unknown as GraphData;
}

export const ENVELOPE_LEGEND: DagLegendSpec = {
  keys: [
    { swatch: 'node', tone: 'success', label: 'this agent may run it' },
    { swatch: 'node', tone: 'muted', dashed: true, label: 'it may not' },
    { swatch: 'edge', label: 'require' },
  ],
  note: 'What the agent may not do is as much of the answer as what it may.',
};
