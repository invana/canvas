/**
 * `<NodeStyleOverviewEditor>` from `@invana/canvas-ui` — the **overview** editor:
 * a single colour control that recolours a node, working for **both** simple
 * shapes and composite cards.
 *
 * The editor only edits a colour; the paired `recolorNodeStyle` mapper turns it
 * into the right `NodeStyle` patch per kind — `bgFill` for a simple shape, body
 * `fill` + every solid accent part for a composite card.
 *
 * **All Node Colors** — docked into a real `<GraphCanvasApp>`'s `right` region,
 * listing a colour picker for **every** node on the canvas (one
 * `NodeStyleOverviewEditor` per node). Pick a colour and that node recolours
 * live via the graph store. Same app wiring as the `NodeStyleEditor` Live story.
 */

import { useContext, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CompositeShapeOption, GraphData, GraphLayer } from '@invana/graph';
import {
  NodeStyleOverviewEditor,
  colorToForm,
  formToColor,
  recolorNodeStyle,
  type NodeStyleOverviewFields,
} from '@invana/canvas-ui';
import {
  CanvasMessageBar,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphCanvasContext,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  GraphStatusBar,
  ThemeToggle,
  ToolbarItems,
  useCanvas,
  useDevTool,
  useMiniMap,
  type GraphNodeMenuContext,
  type LayoutFactory,
} from '@invana/canvas-react';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import { Palette } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/editors/NodeStyleOverviewEditor' };
export default meta;
type Story = StoryObj;

// Header layout picker (mirrors the NodeStyleEditor Live story).
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -260 }, link: { distance: 120 }, animate: false }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force', 'elk-layered': 'Layered' };

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  { id: 'about', label: 'Pick a node and recolour it', onClick: () => window.alert('Demo graph') },
];

/** A composite / card node — exercises recolouring body + accent parts. */
const CARD_SHAPE: CompositeShapeOption = {
  kind: 'composite',
  width: 172,
  height: 66,
  cornerRadius: 10,
  fill: 0x1e293b,
  stroke: { color: 0x475569, width: 1 },
  parts: [
    { part: 'rect', x: 0, y: 0, width: 6, height: 66, fill: 0x38bdf8 }, // accent bar
    { part: 'label', x: 18, y: 14, text: 'Service', fontSize: 15, fontWeight: 700, fill: 0xf8fafc },
    { part: 'label', x: 18, y: 38, text: 'composite card', fontSize: 11, fill: 0x94a3b8 },
  ],
};

/**
 * A small, legible graph — one node per simple shape kind (distinct fills) plus
 * one composite **card** node, so recolouring is obvious for both kinds.
 */
const DEMO_DATA: GraphData = {
  nodes: [
    {
      id: 'alpha',
      position: { x: -170, y: -70 },
      style: { shape: { kind: 'circle', radius: 28 }, bgFill: 0x3b82f6, labelText: 'Alpha', labelColor: 0xffffff, labelPlacement: 'center' },
    },
    {
      id: 'beta',
      position: { x: 170, y: -70 },
      style: { shape: { kind: 'rect', width: 64, height: 46, cornerRadius: 8 }, bgFill: 0x10b981, labelText: 'Beta', labelColor: 0x052e16, labelPlacement: 'center' },
    },
    {
      id: 'gamma',
      position: { x: -170, y: 100 },
      style: { shape: { kind: 'star', points: 5, innerRadius: 14, outerRadius: 30 }, bgFill: 0xf59e0b, labelText: 'Gamma', labelColor: 0x451a03, labelPlacement: 'center' },
    },
    {
      id: 'delta',
      position: { x: 170, y: 100 },
      style: { shape: { kind: 'regular-polygon', sides: 6, radius: 28 }, bgFill: 0x8b5cf6, labelText: 'Delta', labelColor: 0xffffff, labelPlacement: 'center' },
    },
    { id: 'service', position: { x: 0, y: 10 }, style: { shape: CARD_SHAPE } },
  ],
  edges: [
    { id: 'e1', source: 'alpha', target: 'service' },
    { id: 'e2', source: 'beta', target: 'service' },
    { id: 'e3', source: 'gamma', target: 'service' },
    { id: 'e4', source: 'delta', target: 'service' },
  ],
};

/** One node's colour row — a labelled `NodeStyleOverviewEditor` that recolours
 * that node live. Seeds from the node's current colour (simple → `bgFill`,
 * composite → the card body `fill`); every pick writes `recolorNodeStyle(style,
 * color)` back via `store.updateNode` (spreading the resolved style first, since
 * `updateNode` replaces `style` wholesale). */
function NodeColorRow({ layer, id }: { layer: GraphLayer; id: string }) {
  const node = layer.store.getNode(id);
  if (!node) return null;

  const style = layer.resolveNodeStyle(node);
  const current =
    style.shape?.kind === 'composite'
      ? (style.shape as CompositeShapeOption).fill
      : typeof style.bgFill === 'number'
        ? style.bgFill
        : undefined;
  const label = (typeof style.labelText === 'string' && style.labelText) || id;

  const apply = (values: NodeStyleOverviewFields) => {
    const color = formToColor(values);
    if (color === undefined) return;
    layer.store.updateNode(id, { style: { ...style, ...recolorNodeStyle(style, color) } });
  };

  return (
    <div style={{ borderTop: '1px solid var(--border, #e4e4e7)' }}>
      <div style={{ padding: '10px 16px 0', fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{label}</div>
      <NodeStyleOverviewEditor defaults={colorToForm(current)} onChange={apply} />
    </div>
  );
}

/**
 * Lists **every** node on the canvas, each with its own colour picker — the
 * overview editor is just a colour control, so one per node gives a "recolour
 * any node" panel. Node ids come from the story's `DEMO_DATA`; each row reads /
 * writes the live `GraphLayer`. Must be a `<GraphCanvasApp>` descendant.
 */
function AllNodeColorsPanelInner() {
  const canvas = useCanvas();
  const layer = canvas.layers.get('graph') as GraphLayer | undefined;
  if (!layer) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px 4px', fontSize: 13, fontWeight: 600 }}>Node colors</div>
      {DEMO_DATA.nodes.map((n) => (
        <NodeColorRow key={n.id} layer={layer} id={n.id} />
      ))}
    </div>
  );
}

/**
 * Gate: the `right` region renders under `GraphCanvasApp`'s **lifted**
 * `CanvasContext`, which is `null` until the engine is published. The inner
 * panel's `useCanvas` throws on a null canvas, so hold until it turns non-null.
 */
function AllNodeColorsPanel() {
  const canvas = useContext(GraphCanvasContext);
  if (!canvas) return null;
  return <AllNodeColorsPanelInner />;
}

/**
 * A `<GraphCanvasApp>` whose docked, resizable `right` region lists a colour
 * picker for **every** node on the canvas (a `<NodeStyleOverviewEditor>` per
 * node). A header toggle mounts / unmounts the region.
 */
export const AllNodeColors: Story = {
  name: 'All Node Colors',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    const [panelOpen, setPanelOpen] = useState(true);

    return (
      // GraphCanvasApp reads light/dark from a host <ThemeProvider>.
      <ThemeProvider>
        <GraphCanvasApp
          data={DEMO_DATA}
          onReady={(c) => c?.showMessage('Pick a colour for any node in the right panel')}
          config={{
            // Disable colour-by-label so per-node recolours stick (otherwise it
            // would recolour nodes by `type` and mask the edits).
            behaviours: { color: { enabled: false } },
            layouts: {
              'graph-force': {
                charge: { strength: -260 },
                link: { distance: 120 },
                collide: { radius: 30 },
                animate: false,
              },
            },
          }}
          header={{
            title: 'All Node Colors',
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
            right: (ctx) => (
              <>
                {dev.button}
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'toggle',
                      key: 'colors',
                      icon: Palette,
                      label: 'Colors: hidden',
                      activeLabel: 'Colors: shown',
                      active: panelOpen,
                      onToggle: () => setPanelOpen((v) => !v),
                    },
                  ]}
                />
                <ThemeToggle ctx={ctx} />
              </>
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={
            panelOpen
              ? {
                  content: <AllNodeColorsPanel />,
                  defaultSize: '320px',
                  maxSize: '420px',
                  collapsible: true,
                }
              : undefined
          }
        >
          {mini.layer}
          {dev.layer}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
