/**
 * **The global model** — every published model of Invana's airways demo on one
 * canvas, each a `tabbed-rect` group frame holding its node types, with the
 * stitches between models as the only edges that cross a frame.
 *
 * One canvas, one config. Two switchers in the header change it **live** —
 * nothing remounts, the graph keeps its selection and camera:
 *
 * | Switcher | Options | What it patches |
 * |---|---|---|
 * | **Detail** | High · Medium · Low | the node-type bindings — each level is a **template** in `detail-templates.json`: High binds every type to `labelDot` (an icon circle ringed in its model's colour), Medium to `labelCard` (icon, name, model, two-line description, key, *anchored* chip), Low to that type's `schema:<type>` card (one row per property: type chip, name, `key` / stitch ids, type). The patch also carries the frame padding and layout spacing its node size needs, then the active layout re-runs |
 * | **Layout** | ELK · Force | `activeLayout` — ELK `layered` nests the frames, d3-force clusters each model's types round its centroid |
 *
 * **Everything is data.** The graph is `airwaysGlobalModel` (JSON); `settings.json`
 * is the whole `CanvasConfig` with every level's structures registered side by
 * side, starting on Medium; `detail-templates.json` holds the three patches.
 * No resolver and no generator: the schema cards' rows are written out per
 * node type, because each type has its own property list.
 *
 * Edges carry `data.kind` — `edge` (a model's own edge type), `anchor`
 * (`SAME_AS`) or `relationship` — but are not coloured by it: an edge's colour
 * cannot be bound to a field as data, and `ColorByBehaviour`'s edge stroke is
 * overwritten by the theme's `muted` recolour. Hover an edge for its stitch
 * rule; hover a node type for its description and properties (the preview is
 * how the *High* level reads them).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  CanvasThemeSync,
  ClickSelectBehaviour,
  CollapseExpandBehaviour,
  D3ForceLayout,
  DragNodeBehaviour,
  DragPanBehaviour,
  ElkLayout,
  GraphLayer,
  HoverActivateBehaviour,
  HoverElementPreviewBehaviour,
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
import { airwaysGlobalModel } from '@invana/graph-datasets/usecase-demos';
import { Moon, Settings, Sun } from 'lucide-react';
import settings from './settings.json';
import detailTemplates from './detail-templates.json';

const meta: Meta = { title: 'usecases/by-casestudies/global-model/GlobalModel' };
export default meta;
type Story = StoryObj;

type Detail = 'high' | 'medium' | 'low';
type LayoutId = 'elk' | 'force';

// JSON import widens string-literal unions to `string`; the files are a
// `CanvasConfig` and three patches of one, so the casts only narrow them back.
const CONFIG = settings as unknown as CanvasConfig;
const DETAIL_TEMPLATES = detailTemplates as unknown as Record<Detail, Partial<CanvasConfig>>;
/** What `settings.json` starts on — the first switch has nothing to undo. */
const INITIAL = { detail: 'medium' as Detail, layout: 'elk' as LayoutId };

interface Property {
  name: string;
  type: string;
  identity?: boolean;
  stitches?: string[];
}
interface NodeTypeData {
  label: string;
  model: string;
  description: string;
  properties: Property[];
}
interface EdgeData {
  kind: 'edge' | 'anchor' | 'relationship';
  model?: string;
  description?: string;
  rule?: string;
  match?: string;
  partial?: boolean;
}

function renderNode(node: GraphNode) {
  if (node.type === 'model') return null;
  const d = node.data as NodeTypeData;
  const rows: PreviewCardRow[] = d.properties.map((p) => ({
    label: [p.identity ? 'key' : '', ...(p.stitches ?? [])].filter(Boolean).join(' ') || p.type,
    value: `${p.name} : ${p.type}`,
    mono: true
  }));
  return <NodePreviewCard title={d.label} subtitle={d.description} tags={[d.model]} rows={rows} />;
}

function renderEdge(edge: GraphEdge) {
  const d = edge.data as EdgeData;
  const rows: PreviewCardRow[] = [
    { label: 'kind', value: d.kind === 'edge' ? `${d.model} edge type` : d.kind },
    ...(d.rule ? [{ label: 'rule', value: d.rule, mono: true }] : []),
    ...(d.match ? [{ label: 'match', value: d.partial ? `${d.match}, partial` : d.match }] : [])
  ];
  return (
    <EdgePreviewCard
      badge={edge.type}
      title={`${edge.source} → ${edge.target}`}
      subtitle={d.description}
      rows={rows}
    />
  );
}

export const GlobalModelStory: Story = {
  name: 'GlobalModel',
  render: function GlobalModelRender() {
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

    const data = useMemo(() => airwaysGlobalModel as unknown as GraphData, []);

    const onReady = useCallback((c: GraphCanvas | null) => {
      setCanvas(c);
      c?.showMessage('Hover an edge for its stitch rule — only stitches cross a model frame');
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
      void canvas.runLayout(layout).then(() => canvas.fitView(60));
    }, [canvas, detail, layout]);

    return (
      <GraphCanvasApp
        data={data}
        config={CONFIG}
        onReady={onReady}
        bundle={false}
        header={{
          title: 'Global model — airways',
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
                  options: { high: 'High — circles', medium: 'Medium — cards', low: 'Low — schema cards' },
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
        <CollapseExpandBehaviour id="collapse-expand" targetLayerId="graph" enabled />
        <TextResolutionLODBehaviour id="label-resolution" targetLayerId="graph" />
        <HoverElementPreviewBehaviour targetLayerId="graph" renderNode={renderNode} renderEdge={renderEdge} />
      </GraphCanvasApp>
    );
  }
};
