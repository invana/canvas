/**
 * Synthetic **LLM agent traces** — small DAGs that approximate the kind
 * of execution graph LangSmith / Langfuse / Helicone draw for a single
 * agent run. Each node is an `llm` call, a `tool` invocation, a
 * `decision` branch, or a terminal `output`. Each edge is a `calls`
 * (control-flow), `returns` (data-flow), or `branch` (decision branch).
 *
 * Three presets are exported so a single story can illustrate the
 * happy path, an error+retry path, and a multi-tool branching path
 * without re-deriving the data per render.
 *
 * Designed for layered DAG layouts (ELK `layered` `DOWN`); the dataset
 * carries no positions.
 */

import type { GraphData } from '@invana/graph';

/** What the node represents in the agent's execution graph. */
export type AgentTraceNodeKind = 'llm' | 'tool' | 'decision' | 'output';

/** Per-node execution status — drives state-config styling in the story. */
export type AgentTraceStatus = 'success' | 'error' | 'pending';

/** What the edge represents. */
export type AgentTraceEdgeKind = 'calls' | 'returns' | 'branch';

/** Free-form per-node data. The store keeps this opaque. */
export interface AgentTraceNodeData {
  readonly kind: AgentTraceNodeKind;
  readonly label: string;
  readonly status: AgentTraceStatus;
  readonly durationMs: number;
  readonly tokens?: number;
}

/** Free-form per-edge data. */
export interface AgentTraceEdgeData {
  readonly kind: AgentTraceEdgeKind;
}

export interface AgentTraceNode {
  readonly id: string;
  /** The step kind — also on `data.kind`, so colour-by-type works unwired. */
  readonly type: AgentTraceNodeKind;
  readonly data: AgentTraceNodeData;
}

export interface AgentTraceEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly data: AgentTraceEdgeData;
}

export interface AgentTraceData {
  readonly id: string;
  readonly name: string;
  nodes: AgentTraceNode[];
  edges: AgentTraceEdge[];
}

// ── Preset 1: Refund query (all-success happy path) ─────────────────────
const refundQuery: AgentTraceData = {
  id: 'refund-query',
  name: 'Refund query (happy path)',
  nodes: [
    { id: 'start',          type: 'output', data: { kind: 'output',   label: 'User: "I was charged twice"', status: 'success', durationMs: 0 } },
    { id: 'classify',       type: 'llm', data: { kind: 'llm',      label: 'classifyIntent',              status: 'success', durationMs: 412,  tokens: 184 } },
    { id: 'fetchOrder',     type: 'tool', data: { kind: 'tool',     label: 'GET /orders/123',             status: 'success', durationMs: 78 } },
    { id: 'fetchPayments',  type: 'tool', data: { kind: 'tool',     label: 'GET /payments?order=123',     status: 'success', durationMs: 91 } },
    { id: 'analyzeCharges', type: 'llm', data: { kind: 'llm',      label: 'analyzeCharges',              status: 'success', durationMs: 638,  tokens: 412 } },
    { id: 'decideRefund',   type: 'decision', data: { kind: 'decision', label: 'eligible? yes',               status: 'success', durationMs: 12 } },
    { id: 'issueRefund',    type: 'tool', data: { kind: 'tool',     label: 'POST /refunds',               status: 'success', durationMs: 204 } },
    { id: 'composeReply',   type: 'llm', data: { kind: 'llm',      label: 'composeReply',                status: 'success', durationMs: 521,  tokens: 286 } },
    { id: 'response',       type: 'output', data: { kind: 'output',   label: 'Refund processed ✓',          status: 'success', durationMs: 0 } },
  ],
  edges: [
    { id: 'r1', source: 'start',          target: 'classify',       data: { kind: 'calls' } },
    { id: 'r2', source: 'classify',       target: 'fetchOrder',     data: { kind: 'calls' } },
    { id: 'r3', source: 'classify',       target: 'fetchPayments',  data: { kind: 'calls' } },
    { id: 'r4', source: 'fetchOrder',     target: 'analyzeCharges', data: { kind: 'returns' } },
    { id: 'r5', source: 'fetchPayments',  target: 'analyzeCharges', data: { kind: 'returns' } },
    { id: 'r6', source: 'analyzeCharges', target: 'decideRefund',   data: { kind: 'calls' } },
    { id: 'r7', source: 'decideRefund',   target: 'issueRefund',    data: { kind: 'branch' } },
    { id: 'r8', source: 'issueRefund',    target: 'composeReply',   data: { kind: 'returns' } },
    { id: 'r9', source: 'composeReply',   target: 'response',       data: { kind: 'calls' } },
  ],
};

// ── Preset 2: Knowledge lookup (error + retry + fallback) ───────────────
const knowledgeLookup: AgentTraceData = {
  id: 'knowledge-lookup',
  name: 'Knowledge lookup (error + retry)',
  nodes: [
    { id: 'start',          type: 'output', data: { kind: 'output',   label: 'User: "What\'s our SOC2 policy?"', status: 'success', durationMs: 0 } },
    { id: 'classify',       type: 'llm', data: { kind: 'llm',      label: 'classifyIntent',                   status: 'success', durationMs: 387,  tokens: 162 } },
    { id: 'searchKb',       type: 'tool', data: { kind: 'tool',     label: 'GET /kb/search → 504',             status: 'error',   durationMs: 5012 } },
    { id: 'retrySearch',    type: 'tool', data: { kind: 'tool',     label: 'GET /kb/search (retry)',           status: 'success', durationMs: 142 } },
    { id: 'rankResults',    type: 'llm', data: { kind: 'llm',      label: 'rankResults',                      status: 'success', durationMs: 489,  tokens: 318 } },
    { id: 'fetchDoc',       type: 'tool', data: { kind: 'tool',     label: 'GET /kb/docs/SOC2 → 404',          status: 'error',   durationMs: 88 } },
    { id: 'fallbackSearch', type: 'tool', data: { kind: 'tool',     label: 'GET /kb/search?q=SOC2 compliance', status: 'success', durationMs: 156 } },
    { id: 'summarize',      type: 'llm', data: { kind: 'llm',      label: 'summarize',                        status: 'success', durationMs: 712,  tokens: 524 } },
    { id: 'citationCheck',  type: 'decision', data: { kind: 'decision', label: 'cited? yes',                       status: 'success', durationMs: 9 } },
    { id: 'response',       type: 'output', data: { kind: 'output',   label: 'Reply with citations',             status: 'success', durationMs: 0 } },
  ],
  edges: [
    { id: 'k1',  source: 'start',          target: 'classify',       data: { kind: 'calls' } },
    { id: 'k2',  source: 'classify',       target: 'searchKb',       data: { kind: 'calls' } },
    { id: 'k3',  source: 'searchKb',       target: 'retrySearch',    data: { kind: 'branch' } },
    { id: 'k4',  source: 'retrySearch',    target: 'rankResults',    data: { kind: 'returns' } },
    { id: 'k5',  source: 'rankResults',    target: 'fetchDoc',       data: { kind: 'calls' } },
    { id: 'k6',  source: 'fetchDoc',       target: 'fallbackSearch', data: { kind: 'branch' } },
    { id: 'k7',  source: 'fallbackSearch', target: 'summarize',      data: { kind: 'returns' } },
    { id: 'k8',  source: 'summarize',      target: 'citationCheck',  data: { kind: 'calls' } },
    { id: 'k9',  source: 'citationCheck',  target: 'response',       data: { kind: 'branch' } },
  ],
};

// ── Preset 3: Multi-tool decision (branching path) ──────────────────────
const multiToolDecision: AgentTraceData = {
  id: 'multi-tool-decision',
  name: 'Multi-tool decision (branching)',
  nodes: [
    { id: 'start',         type: 'output', data: { kind: 'output',   label: 'User: "Refactor auth or billing?"', status: 'success', durationMs: 0 } },
    { id: 'classify',      type: 'llm', data: { kind: 'llm',      label: 'classifyIntent',                    status: 'success', durationMs: 401,  tokens: 174 } },
    { id: 'fetchRepo',     type: 'tool', data: { kind: 'tool',     label: 'GET /repo/stats',                   status: 'success', durationMs: 132 } },
    { id: 'fetchIssues',   type: 'tool', data: { kind: 'tool',     label: 'GET /issues?label=tech-debt',       status: 'success', durationMs: 211 } },
    { id: 'fetchOwners',   type: 'tool', data: { kind: 'tool',     label: 'GET /codeowners',                   status: 'success', durationMs: 84 } },
    { id: 'analyzeRepo',   type: 'llm', data: { kind: 'llm',      label: 'analyzeRepo',                       status: 'success', durationMs: 542,  tokens: 388 } },
    { id: 'analyzeIssues', type: 'llm', data: { kind: 'llm',      label: 'analyzeIssues',                     status: 'success', durationMs: 612,  tokens: 442 } },
    { id: 'analyzeOwners', type: 'llm', data: { kind: 'llm',      label: 'analyzeOwners',                     status: 'success', durationMs: 318,  tokens: 224 } },
    { id: 'weighOptions',  type: 'decision', data: { kind: 'decision', label: 'score: auth > billing',             status: 'success', durationMs: 18 } },
    { id: 'chooseAuth',    type: 'output', data: { kind: 'output',   label: 'Recommend: refactor auth',          status: 'success', durationMs: 0 } },
    { id: 'chooseBilling', type: 'output', data: { kind: 'output',   label: 'Defer: billing',                    status: 'pending', durationMs: 0 } },
    { id: 'composeReply',  type: 'llm', data: { kind: 'llm',      label: 'composeReply',                      status: 'success', durationMs: 678,  tokens: 512 } },
    { id: 'response',      type: 'output', data: { kind: 'output',   label: 'Recommendation delivered',          status: 'success', durationMs: 0 } },
  ],
  edges: [
    { id: 'm1',  source: 'start',         target: 'classify',      data: { kind: 'calls' } },
    { id: 'm2',  source: 'classify',      target: 'fetchRepo',     data: { kind: 'calls' } },
    { id: 'm3',  source: 'classify',      target: 'fetchIssues',   data: { kind: 'calls' } },
    { id: 'm4',  source: 'classify',      target: 'fetchOwners',   data: { kind: 'calls' } },
    { id: 'm5',  source: 'fetchRepo',     target: 'analyzeRepo',   data: { kind: 'returns' } },
    { id: 'm6',  source: 'fetchIssues',   target: 'analyzeIssues', data: { kind: 'returns' } },
    { id: 'm7',  source: 'fetchOwners',   target: 'analyzeOwners', data: { kind: 'returns' } },
    { id: 'm8',  source: 'analyzeRepo',   target: 'weighOptions',  data: { kind: 'calls' } },
    { id: 'm9',  source: 'analyzeIssues', target: 'weighOptions',  data: { kind: 'calls' } },
    { id: 'm10', source: 'analyzeOwners', target: 'weighOptions',  data: { kind: 'calls' } },
    { id: 'm11', source: 'weighOptions',  target: 'chooseAuth',    data: { kind: 'branch' } },
    { id: 'm12', source: 'weighOptions',  target: 'chooseBilling', data: { kind: 'branch' } },
    { id: 'm13', source: 'chooseAuth',    target: 'composeReply',  data: { kind: 'calls' } },
    { id: 'm14', source: 'composeReply',  target: 'response',      data: { kind: 'calls' } },
  ],
};

/** All three presets, in display order. */
export const agentTrace: readonly AgentTraceData[] = [
  refundQuery,
  knowledgeLookup,
  multiToolDecision,
];

/**
 * The first trace (`refundQuery`) as the engine-ready value
 * `<GraphCanvasApp data>` takes — the default of the three in {@link agentTrace}.
 */
export const data: GraphData = agentTrace[0] as unknown as GraphData;
