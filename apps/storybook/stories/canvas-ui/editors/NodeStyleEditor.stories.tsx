/**
 * `<NodeStyleEditor>` from `@invana/canvas-ui` — a
 * self-contained style form whose fields are generated from `@invana/forms`
 * `FieldConfig` schemas (the design-kit form-generator).
 *
 * It takes `defaults` + `fields`, owns the form, and on **Apply** calls
 * `onSubmit(values)`. It knows nothing about `Canvas`, engine, or layers — it
 * just edits a value in the shape you give it. This story is fully standalone:
 * seed the editor from a plain style (`styleToForm`), and on submit map the
 * values back (`formToStyle`) into the preview. No engine anywhere.
 *
 * The Geometry section shows the discriminated-union pattern: changing the
 * shape select swaps in that kind's geometry fields (radius vs width/height vs
 * sides…).
 *
 * Two stories:
 *
 * - **Standalone** — a plain style in, edits mapped back into a live preview.
 *   No engine anywhere.
 * - **Live Node Style Editor** — the editor docked into a real `<GraphCanvasApp>`'s
 *   `right` region, editing the **selected** node's style live via the graph
 *   store. `kind` is chosen from the node's `shape.kind` (composite → the
 *   `CompositeNodeStyleEditor`, else the simple one).
 */

import { useContext, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CompositeShapeOption, GraphData, GraphLayer, NodeStyle } from '@invana/graph';
import {
  NodeStyleEditor,
  compositeToForm,
  formToComposite,
  formToStyle,
  numberToHex,
  styleToForm,
  type CompositeFormState,
  type NodeStyleFields,
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
  useSelection,
  type GraphNodeMenuContext,
  type LayoutFactory,
} from '@invana/canvas-react';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import { Palette } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/editors/NodeStyleEditor' };
export default meta;
type Story = StoryObj;

/** A plain starting style — the editor edits this. No engine, no layers. */
const SAMPLE_STYLE: Partial<NodeStyle> = {
  shape: { kind: 'circle', radius: 28 },
  bgFill: 0x3b82f6,
  bgAlpha: 1,
  bgStrokeColor: 0x1e3a8a,
  bgStrokeWidth: 3,
  labelText: 'Node',
  labelColor: 0xffffff,
  labelFontSize: 14,
  labelPlacement: 'center',
};

function StandaloneDemo() {
  // The consumer decides what "submit" does — here, just store it for preview.
  // In a real app this is where you'd update a node, many nodes, an undo stack…
  const [applied, setApplied] = useState<Partial<NodeStyle>>(SAMPLE_STYLE);

  return (
    <div style={pageStyle}>
      <div style={editorColStyle}>
        <NodeStyleEditor
          kind="simple"
          defaults={styleToForm(SAMPLE_STYLE)}
          onSubmit={(values: NodeStyleFields) => setApplied(formToStyle(values))}
        />
      </div>
      <Preview style={applied} />
    </div>
  );
}

/** Renders the last-submitted style — proof the editor yields a usable style
 * with no engine attached. */
function Preview({ style }: { style: Partial<NodeStyle> }) {
  const bg = typeof style.bgFill === 'number' ? numberToHex(style.bgFill) : 'transparent';
  const stroke =
    typeof style.bgStrokeColor === 'number' ? numberToHex(style.bgStrokeColor) : 'transparent';
  const labelColor =
    typeof style.labelColor === 'number' ? numberToHex(style.labelColor) : '#111';
  const isCircle = style.shape?.kind === 'circle';

  return (
    <div style={previewColStyle}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Applied style (updates on Apply)</div>

      <div style={swatchHostStyle}>
        <div
          style={{
            width: 88,
            height: 88,
            background: bg,
            opacity: style.bgAlpha ?? 1,
            borderRadius: isCircle ? '50%' : 10,
            border: `${style.bgStrokeWidth ?? 0}px solid ${stroke}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: labelColor,
            fontSize: style.labelFontSize ?? 14,
          }}
        >
          {style.labelText}
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 8 }}>
        onSubmit value → Partial&lt;NodeStyle&gt;
      </div>
      <pre style={preStyle}>{JSON.stringify(style, null, 2)}</pre>
    </div>
  );
}

export const Standalone: Story = {
  render: () => <StandaloneDemo />,
};

// ─── Live Node Style Editor ─────────────────────────────────────────────────

// Multi-layout picker for the header toolbar (mirrors LiveSettingsEditors).
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({ charge: { strength: -240 }, link: { distance: 70 }, animate: true }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
};
const LAYOUT_LABEL: Record<string, string> = { 'd3-force': 'Force', 'elk-layered': 'Layered' };

/** A composite / card node — exercises the composite editor variant. */
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
 * A small, legible graph — one node per simple shape kind (each with a distinct
 * fill so edits are obvious) plus one composite **card** node, so selecting any
 * node opens the matching editor variant and edits are immediately visible.
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

const nodeMenu = (ctx: GraphNodeMenuContext): MenuItem[] => [
  { id: 'inspect', label: `Inspect ${ctx.id}`, onClick: () => window.alert(`Node ${ctx.id}`) },
];
const backgroundMenu = (): MenuItem[] => [
  { id: 'about', label: 'Les Misérables co-appearances', onClick: () => window.alert('Demo graph') },
];

/**
 * Edits the **selected** node's style through the live graph store. Reads the
 * selection reactively (`useSelection`), resolves the node's current style off
 * the `GraphLayer`, and seeds the matching editor variant — composite when the
 * node's `shape.kind === 'composite'`, else the simple flat-`NodeStyle` editor.
 * Keyed by node id so switching selection re-seeds the form. Every Apply writes
 * back via `store.updateNode` (spreading the resolved style first, since
 * `updateNode` replaces `style` wholesale). Must be a `<GraphCanvasApp>`
 * descendant. This introspection ↔ editor bridge lives in the story because the
 * editor is engine-agnostic (`@invana/canvas-ui` can't import the engine).
 */
function LiveNodeStylePanelInner() {
  const canvas = useCanvas();
  const { selectedNodeIds } = useSelection();
  const selectedId = selectedNodeIds[0];

  const layer = canvas.layers.get('graph') as GraphLayer | undefined;
  const node = selectedId && layer ? layer.store.getNode(selectedId) : undefined;

  if (!layer || !selectedId || !node) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: 'var(--muted-foreground, #71717a)' }}>
        Select a node on the canvas to edit its style.
      </div>
    );
  }

  // Resolved style (layer template + node) — the same style the renderer sees.
  const style = layer.resolveNodeStyle(node);

  if (style.shape?.kind === 'composite') {
    return (
      <NodeStyleEditor
        key={selectedId}
        kind="composite"
        defaults={compositeToForm(style.shape as CompositeShapeOption)}
        onSubmit={(values: CompositeFormState) =>
          layer.store.updateNode(selectedId, {
            style: { ...style, shape: formToComposite(values) },
          })
        }
      />
    );
  }
  return (
    <NodeStyleEditor
      key={selectedId}
      kind="simple"
      defaults={styleToForm(style)}
      onSubmit={(values: NodeStyleFields) =>
        layer.store.updateNode(selectedId, { style: { ...style, ...formToStyle(values) } })
      }
    />
  );
}

/**
 * Gate for the panel: the `right` region renders under `GraphCanvasApp`'s
 * **lifted** `CanvasContext`, which is `null` until Main's ready-bridge publishes
 * the engine. The inner panel's engine hooks (`useCanvas` / `useSelection`) throw
 * on a null canvas, so hold rendering until the lifted context turns non-null.
 */
function LiveNodeStylePanel() {
  const canvas = useContext(GraphCanvasContext);
  if (!canvas) return null;
  return <LiveNodeStylePanelInner />;
}

/**
 * A `<GraphCanvasApp>` whose selected node's style is edited through the app's
 * docked, resizable `right` region hosting the `<NodeStyleEditor>`. A header
 * toggle mounts / unmounts the region; select a node to populate it. Same app
 * wiring as `CanvasSettingsEditor`'s Live Settings Editors, but the panel drives
 * one node's `NodeStyle` instead of the whole canvas definition.
 */
export const LiveNodeStyleEditor: Story = {
  name: 'Live Node Style Editor',
  render: function Render() {
    const dev = useDevTool({ corner: 'top-left', margin: { x: 12, y: 48 } });
    const mini = useMiniMap({ backgroundLayerId: 'background', position: 'bottom-left' });
    // The editor panel is toggled from the header; open by default.
    const [styleOpen, setStyleOpen] = useState(true);

    return (
      // GraphCanvasApp reads light/dark from a host <ThemeProvider> (throws
      // without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={DEMO_DATA}
          onReady={(c) => c?.showMessage('Select a node, then edit its style in the right panel')}
          config={{
            // Disable colour-by-label so the editor's per-node fill edits stick
            // (otherwise it would recolour nodes by `type` and mask them).
            behaviours: { color: { enabled: false } },
            layouts: {
              'graph-force': {
                charge: { strength: -260 },
                link: { distance: 120 },
                collide: { radius: 30 },
                // Static settle so the graph holds still while you edit.
                animate: false,
              },
            },
          }}
          header={{
            title: 'Live Node Style Editor',
            center: <GraphControlsToolbar layouts={LAYOUTS} layoutLabel={LAYOUT_LABEL} />,
            right: (ctx) => (
              <>
                {dev.button}
                {/* Style-editor toggle — shows / hides the docked right panel. */}
                <ToolbarItems
                  orientation="horizontal"
                  items={[
                    {
                      type: 'toggle',
                      key: 'style',
                      icon: Palette,
                      label: 'Style editor: hidden',
                      activeLabel: 'Style editor: shown',
                      active: styleOpen,
                      onToggle: () => setStyleOpen((v) => !v),
                    },
                  ]}
                />
                <ThemeToggle ctx={ctx} />
              </>
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={
            styleOpen
              ? {
                  content: <LiveNodeStylePanel />,
                  defaultSize: '360px',
                  maxSize: '460px',
                  collapsible: true,
                }
              : undefined
          }
        >
          {/* Extra layers — minimap + on-demand dev overlay. */}
          {mini.layer}
          {dev.layer}

          {/* Right-click menus. */}
          <GraphNodeContextMenu items={nodeMenu} />
          <GraphBackgroundContextMenu items={backgroundMenu} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};

// ─── Layout ──────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
  gap: 16,
  height: '100vh',
  padding: 16,
  boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};

const editorColStyle: CSSProperties = {
  border: '1px solid var(--border, #e4e4e7)',
  borderRadius: 8,
  overflow: 'auto',
};

const previewColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  overflow: 'auto',
};

const swatchHostStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 160,
  border: '1px dashed var(--border, #e4e4e7)',
  borderRadius: 8,
};

const preStyle: CSSProperties = {
  margin: 0,
  padding: 12,
  fontSize: 12,
  lineHeight: 1.5,
  background: 'var(--muted, #f4f4f5)',
  borderRadius: 8,
  overflow: 'auto',
};
