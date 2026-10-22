/**
 * **A workflow plan** — `nl-compare@1`, the largest plan Invana's dev database
 * holds: two readings of the graph (translate → validate → execute, twice, in
 * parallel lanes) joined into one projection and verified.
 *
 * It is a graph *of a plan*, not of a run: each node is a task, each edge one of
 * its `depends_on` entries. A task's `type` is `task.<bound>` — the catalogue
 * bound it spends (`llm` · `graph_read` · `none`), which is its layer — and
 * `data.icon` / the ring colour are chosen by that bound. Edges carry
 * `data.kind`: `binding` (an output bound into its args), `require` (must
 * settle first) or `sequence` (after it, nothing bound).
 *
 * Drawn by `<LayeredDagBoard>` on the plan's own config. The **Detail**
 * switcher in the header changes it live: each level is a **template** in
 * `detail-templates.json` — Circles binds every task to `taskDot` (its bound's
 * icon, ringed in its bound's colour), Cards to `taskCard` (icon tile, title,
 * bound, the step's summary, step key and ordinal). The patch also carries the
 * layout spacing its node size needs, then ELK re-runs, left to right.
 *
 * **Everything is data.** `data.json` is the plan (`GraphData` plus a `plan`
 * header), `settings.json` the whole `CanvasConfig` starting on Circles, and
 * `detail-templates.json` the two patches. No resolver, no generator.
 */

import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EdgePreviewCard,
  LayeredDagBoard,
  NodePreviewCard,
  type DetailTemplates,
  type PreviewCardRow
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, GraphEdge, GraphNode } from '@invana/graph';
import plan from './data.json';
import settings from './settings.json';
import detailTemplates from './detail-templates.json';

const meta: Meta = { title: 'canvas-demos/by-casestudies/workflow/WorkflowPlan' };
export default meta;
type Story = StoryObj;

// JSON import widens string-literal unions to `string`; the files are a
// `CanvasConfig` and two patches of one, so the casts only narrow them back.
const CONFIG = settings as unknown as CanvasConfig;
const DETAIL: DetailTemplates = {
  templates: detailTemplates as unknown as DetailTemplates['templates'],
  options: { circles: 'Circles', cards: 'Cards' },
  initial: 'circles'
};

interface TaskData {
  key: string;
  title: string;
  stepKey: string;
  bound: string;
  summary: string;
  ordinal: number;
  args: Record<string, unknown>;
  dependsOn: { key: string; kind: string }[];
}
interface EdgeData {
  kind: 'binding' | 'require' | 'sequence';
  description: string;
}

function renderNode(node: GraphNode) {
  const d = node.data as TaskData;
  const rows: PreviewCardRow[] = [
    { label: 'step', value: d.stepKey, mono: true },
    { label: 'bound', value: d.bound },
    ...Object.entries(d.args).map(([k, v]) => ({ label: k, value: String(v), mono: true }))
  ];
  return <NodePreviewCard title={d.title} subtitle={d.summary} tags={[d.key]} rows={rows} />;
}

function renderEdge(edge: GraphEdge) {
  const d = edge.data as EdgeData;
  return <EdgePreviewCard badge={d.kind} title={`${edge.source} → ${edge.target}`} subtitle={d.description} />;
}

export const WorkflowPlanStory: Story = {
  name: 'WorkflowPlan',
  render: function WorkflowPlanRender() {
    const data = useMemo(() => ({ nodes: plan.nodes, edges: plan.edges }) as unknown as GraphData, []);
    return (
      <LayeredDagBoard
        data={data}
        config={CONFIG}
        detail={DETAIL}
        title={`Plan — ${plan.plan.key}@${plan.plan.version}`}
        message={plan.plan.description}
        renderNode={renderNode}
        renderEdge={renderEdge}
        dockSection={{ defaultSize: '380px', maxSize: '520px' }}
      />
    );
  }
};
