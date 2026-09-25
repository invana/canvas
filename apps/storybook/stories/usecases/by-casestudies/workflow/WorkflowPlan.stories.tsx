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
 * One canvas, one config. Two switchers in the header change it **live**:
 *
 * | Switcher | Options | What it patches |
 * |---|---|---|
 * | **Detail** | Circles · Cards | the node-type bindings — each level is a **template** in `detail-templates.json`: Circles binds every task to `taskDot` (its bound's icon, ringed in its bound's colour), Cards to `taskCard` (icon tile, title, bound, the step's summary, step key and ordinal). The patch also carries the layout spacing its node size needs, then the active layout re-runs |
 * | **Layout** | ELK · Force | `activeLayout` — ELK `layered` left to right, or d3-force |
 *
 * **Everything is data.** `data.json` is the plan (`GraphData` plus a `plan`
 * header), `settings.json` the whole `CanvasConfig` starting on Circles, and
 * `detail-templates.json` the two patches. No resolver, no generator.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  CanvasThemeSync,
  ClickSelectBehaviour,
  D3ForceLayout,
  DragNodeBehaviour,
  DragPanBehaviour,
  ElkLayout,
  GraphLayer,
  HoverActivateBehaviour,
  HoverElementPreviewBehaviour,
  TextLODBehaviour,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  WheelZoomBehaviour
} from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  EdgePreviewCard,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  NodePreviewCard,
  ToolbarItems,
  useSidePanels,
  type PreviewCardRow
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData, GraphEdge, GraphNode } from '@invana/graph';
import { Moon, Settings, Sun } from 'lucide-react';
import plan from './data.json';
import settings from './settings.json';
import detailTemplates from './detail-templates.json';

const meta: Meta = { title: 'usecases/by-casestudies/workflow/WorkflowPlan' };
export default meta;
type Story = StoryObj;

type Detail = 'circles' | 'cards';
type LayoutId = 'elk' | 'force';

// JSON import widens string-literal unions to `string`; the files are a
// `CanvasConfig` and two patches of one, so the casts only narrow them back.
const CONFIG = settings as unknown as CanvasConfig;
const DETAIL_TEMPLATES = detailTemplates as unknown as Record<Detail, Partial<CanvasConfig>>;
/** What `settings.json` starts on — the first switch has nothing to undo. */
const INITIAL = { detail: 'circles' as Detail, layout: 'elk' as LayoutId };

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
  return (
    <EdgePreviewCard
      badge={d.kind}
      title={`${edge.source} → ${edge.target}`}
      subtitle={d.description}
    />
  );
}

export const WorkflowPlanStory: Story = {
  name: 'WorkflowPlan',
  render: function WorkflowPlanRender() {
    const [detail, setDetail] = useState<Detail>(INITIAL.detail);
    const [layout, setLayout] = useState<LayoutId>(INITIAL.layout);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const applied = useRef(INITIAL);

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (c) => (
            <CanvasSettingsEditorPanel canvas={c} className="border-0 bg-transparent shadow-none" />
          )
        },
      ],
      { section: { defaultSize: '380px', maxSize: '520px' } },
    );

    const data = useMemo(() => ({ nodes: plan.nodes, edges: plan.edges }) as unknown as GraphData, []);

    const onReady = useCallback((c: GraphCanvas | null) => {
      setCanvas(c);
      c?.showMessage(plan.plan.description);
    }, []);

    // Apply a switch to the live canvas: patch the template and/or the active
    // layout, then re-run it — a new node size needs new positions.
    useEffect(() => {
      if (!canvas) return;
      const prev = applied.current;
      if (prev.detail === detail && prev.layout === layout) return;
      applied.current = { detail, layout };
      canvas.stopLayout();
      canvas.update({
        ...(prev.detail !== detail ? DETAIL_TEMPLATES[detail] : {}),
        ...(prev.layout !== layout ? { activeLayout: layout } : {})
      });
      void canvas.runLayout(layout, { fitCamera: { padding: 60 } });
    }, [canvas, detail, layout]);

    return (
      <GraphCanvasApp
        data={data}
        config={CONFIG}
        onReady={onReady}
        bundle={false}
        header={{
          title: `Plan — ${plan.plan.key}@${plan.plan.version}`,
          center: <GraphControlsToolbar sections={{ layout: false }} />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'select',
                  key: 'detail',
                  label: 'Detail',
                  value: detail,
                  options: { circles: 'Circles', cards: 'Cards' },
                  onChange: (v) => setDetail(v as Detail)
                },
                {
                  type: 'select',
                  key: 'layout',
                  label: 'Layout',
                  value: layout,
                  options: { elk: 'ELK — layered', force: 'Force — d3' },
                  onChange: (v) => setLayout(v as LayoutId)
                },
                ...dock.items,
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme
                },
              ]}
            />
          )
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      >
        <BackgroundLayer id="background" />
        <GraphLayer id="graph" data={data} />
        <ThemeBehaviour id="theme" />
        <CanvasThemeSync />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        <HoverActivateBehaviour id="hover" targetLayerId="graph" />
        <ClickSelectBehaviour id="click-select" targetLayerId="graph" />
        {/* Both layouts are registered; `config.activeLayout` picks the one that runs. */}
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={60} />
        <D3ForceLayout id="force" targetLayerId="graph" />
        <TextResolutionLODBehaviour id="label-resolution" targetLayerId="graph" />
        <TextLODBehaviour id="text-lod" targetLayerId="graph" />
        <HoverElementPreviewBehaviour targetLayerId="graph" renderNode={renderNode} renderEdge={renderEdge} />
      </GraphCanvasApp>
    );
  }
};
