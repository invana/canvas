/**
 * **Schema / ER table nodes** — the entity node of a data-model diagram, built
 * **entirely in userland** from the generic `composite` shape. There is no
 * `schema` template kind in the engine: a node's `shape` is a *resolver*
 * (`options.node.style.shape = (node) => CompositeShapeOption`), so this story
 * maps each node's data to a composite with a coloured **header** (icon + title)
 * over a **variable-length** list of field rows — a colour-coded type-chip, the
 * field name, and the field's **data type** on the right (`integer` / `string`
 * / …). The card height is computed from the field count.
 *
 * **Interactivity, all riding on the engine's composite + sub-part support:**
 * - *Whole-card hover* — the canonical `hovered` state is a `ring` decoration
 *   that traces the card silhouette (composites delegate decorations to the
 *   root shape). No per-shape code.
 * - *Per-row hover* — each row's full-width `rect` carries a `hitId`, so the
 *   engine emits `shape:partover` / `shape:partout`; the resolver lights up the
 *   band. No pointer math.
 * - *Right-click editing* — right-click a **row** → a per-field menu (change
 *   type / delete / add) via `shape:partcontextmenu`; right-click the **header**
 *   → the table menu (`shape:contextmenu`) → the reusable `<SchemaEditor>`
 *   panel (`@invana/canvas-ui`) for bulk add / remove / reorder / retype. Edits
 *   write back to the node's `data` and `redraw()`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour, type CompositePart } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  type CompositeShapeOption,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { SchemaEditor, type NodeSchema } from '@invana/canvas-ui';
import { ElkLayout, type ElkDirection } from '@invana/graph-layout-elkjs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/Schema Table' };
export default meta;
type Story = StoryObj;

export const SchemaTable: Story = {
  render: () => createContainer({ id: 'graph-schema-table' }),

  play: async ({ canvasElement }) => {
    // ── The schema each node carries ─────────────────────────────────────
    interface Field {
      name: string;
      type: string;
    }
    interface TableData {
      label: string;
      icon: string; // iconify id, e.g. 'lucide/table'
      header: number; // header band colour
      fields: Field[];
    }

    // ── Data — a star schema: three dimensions + one fact table ──────────
    const nodes: GraphNode[] = [
      {
        id: 'dim_customer',
        data: {
          label: 'Dim_Customer',
          icon: 'lucide/users',
          header: 0x2563eb,
          fields: [
            { name: 'CustomerId', type: 'integer' },
            { name: 'CustomerName', type: 'string' },
            { name: 'Phone', type: 'string' },
            { name: 'RegistrationDate', type: 'date' },
            { name: 'TotalCustomers', type: 'integer' },
            { name: 'NorthAmerica', type: 'boolean' },
          ],
        } satisfies TableData,
      },
      {
        id: 'dim_date',
        data: {
          label: 'Dim_Date',
          icon: 'lucide/calendar',
          header: 0x2563eb,
          fields: [
            { name: 'DateId', type: 'integer' },
            { name: 'Date', type: 'date' },
            { name: 'Month', type: 'string' },
            { name: 'Year', type: 'integer' },
          ],
        } satisfies TableData,
      },
      {
        id: 'dim_supplier',
        data: {
          label: 'Dim_Supplier',
          icon: 'lucide/truck',
          header: 0x2563eb,
          fields: [
            { name: 'SupplierId', type: 'integer' },
            { name: 'CompanyName', type: 'string' },
            { name: 'Phone', type: 'string' },
          ],
        } satisfies TableData,
      },
      {
        id: 'fact_order',
        data: {
          label: 'Fact_Customer_Order',
          icon: 'lucide/sigma',
          header: 0x7c3aed,
          fields: [
            { name: 'OrderId', type: 'integer' },
            { name: 'CustomerId', type: 'integer' },
            { name: 'DateId', type: 'integer' },
            { name: 'SupplierId', type: 'integer' },
            { name: 'Quantity', type: 'integer' },
            { name: 'Profit', type: 'number' },
          ],
        } satisfies TableData,
      },
    ];
    const edges: GraphEdge[] = [
      { id: 'f-customer', source: 'fact_order', target: 'dim_customer' },
      { id: 'f-date', source: 'fact_order', target: 'dim_date' },
      { id: 'f-supplier', source: 'fact_order', target: 'dim_supplier' },
    ];

    // ── The userland resolver: node data → a composite table card ─────────
    // Colour-coded type chip per field type (semantic, like syntax highlight).
    const TYPE_CHIP: Record<string, { char: string; color: number }> = {
      string: { char: 'Abc', color: 0x3b82f6 },
      integer: { char: '123', color: 0x22c55e },
      number: { char: '#', color: 0x22c55e },
      date: { char: '◷', color: 0xf59e0b },
      boolean: { char: '01', color: 0xa855f7 },
    };
    const chipFor = (t: string) => TYPE_CHIP[t.toLowerCase()] ?? { char: '•', color: 0x64748b };

    const WIDTH = 210;
    const PAD = 12;
    const RADIUS = 8;
    const HEADER_H = 38;
    const ROW_H = 26;
    const BODY_BG = 0x0f172a;
    const NAME_COLOR = 0xe2e8f0;
    const TYPE_COLOR = 0x64748b;

    // Per-node hovered ROW index; read by the resolver to paint the band. `-1` = none.
    const hoverRow = new Map<string, number>();

    // Build the composite spec for one table node. Pure data → parts.
    const buildTable = (node: GraphNode): CompositeShapeOption => {
      const d = node.data as TableData;
      const height = HEADER_H + d.fields.length * ROW_H + 6;
      const parts: CompositePart[] = [];
      const activeRow = hoverRow.get(node.id) ?? -1;

      // Header band — a rect with only its TOP corners rounded (a full rounded
      // rect + a square rect over the bottom `RADIUS` strip).
      parts.push({ part: 'rect', x: 0, y: 0, width: WIDTH, height: HEADER_H, cornerRadius: RADIUS, fill: d.header });
      parts.push({ part: 'rect', x: 0, y: HEADER_H - RADIUS, width: WIDTH, height: RADIUS, fill: d.header });

      // Header icon — a Lucide glyph via the `icon` part's `svg-url` (iconify).
      const iconBox = 20;
      parts.push({
        part: 'icon',
        x: PAD,
        y: (HEADER_H - iconBox) / 2,
        size: iconBox,
        icon: { kind: 'svg-url', url: `https://api.iconify.design/${d.icon}.svg`, color: 0xffffff, strokeWidth: 2 },
      });

      // Header title.
      const titleX = PAD + iconBox + 8;
      parts.push({
        part: 'label',
        x: titleX,
        y: (HEADER_H - 14) / 2,
        text: d.label,
        fontSize: 14,
        fontWeight: 700,
        fill: 0xffffff,
        maxWidth: WIDTH - titleX - PAD,
        maxLines: 1,
        overflow: 'ellipsis',
      });

      // One row per field: a full-width `rect` with a `hitId` (the addressable
      // sub-part — transparent, or a band when hovered), then [chip] name … type.
      const TYPE_W = 64; // reserved width for the right-aligned data-type label
      d.fields.forEach((f, i) => {
        const rowY = HEADER_H + i * ROW_H;

        parts.push({
          part: 'rect',
          x: 2,
          y: rowY,
          width: WIDTH - 4,
          height: ROW_H,
          cornerRadius: 4,
          fill: 0xffffff,
          fillAlpha: i === activeRow ? 0.13 : 0,
          hitId: String(i),
        });

        const chipBox = 16;
        const chipY = rowY + (ROW_H - chipBox) / 2;
        const chip = chipFor(f.type);
        parts.push({ part: 'rect', x: PAD, y: chipY, width: chipBox, height: chipBox, cornerRadius: 3, fill: chip.color });
        parts.push({
          part: 'label',
          x: PAD + chipBox / 2,
          y: chipY + (chipBox - 8) / 2,
          text: chip.char,
          anchor: 'center',
          fontSize: 8,
          fontWeight: 700,
          fill: 0xffffff,
        });

        const nameX = PAD + chipBox + 8;
        parts.push({
          part: 'label',
          x: nameX,
          y: rowY + (ROW_H - 13) / 2,
          text: f.name,
          fontSize: 13,
          fill: NAME_COLOR,
          maxWidth: WIDTH - nameX - PAD - TYPE_W,
          maxLines: 1,
          overflow: 'ellipsis',
        });

        // Data type on the right (e.g. `integer`, `string`).
        parts.push({
          part: 'label',
          x: WIDTH - PAD,
          y: rowY + (ROW_H - 11) / 2,
          text: f.type,
          anchor: 'right',
          fontSize: 11,
          fill: TYPE_COLOR,
          maxWidth: TYPE_W,
          maxLines: 1,
          overflow: 'ellipsis',
        });
      });

      return { kind: 'composite', width: WIDTH, height, cornerRadius: RADIUS, fill: BODY_BG, stroke: { color: 0x334155, width: 1 }, parts };
    };

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-schema-table')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    // The `shape` resolver is non-serialisable wiring → it rides on the layer
    // constructor, not the JSON config. `bgStrokeWidth: 0` stops the base node
    // border from framing the card (the composite carries its own stroke).
    canvas.layers.add(
      new GraphLayer({
        id: 'graph',
        options: {
          initData: { nodes, edges },
          node: { style: { shape: buildTable, bgStrokeWidth: 0 } },
          edge: {
            style: {
              strokeColor: 0x64748b,
              strokeWidth: 1.4,
              strokeDashArray: [5, 4],
              arrowTargetShape: 'none',
              shape: { pathType: 'orth' },
            },
          },
        },
      }),
    );

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    // Hover ring (whole card) — canonical `hovered` decoration follows the silhouette.
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' }));
    // Keep the composite's label parts crisp when zoomed in — re-rasterises the
    // card text at higher device resolution per zoom tier (composite labels opt
    // into this via `CompositeShape.setLabelResolution`).
    canvas.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));

    const elkLayout = new ElkLayout({ id: 'layout', targetLayerId: 'graph' });
    canvas.layouts.add(elkLayout);

    const canvasOptions = {
      layers: {
        bg: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        hover: { enabled: true },
        'label-lod': { enabled: true },
        theme: {
          enabled: true,
          mode: 'system' as const,
          light: { backgroundColor: '#f1f5f9', color: '#cbd5e1' },
          dark: { backgroundColor: '#0b1220', color: '#334155' },
        },
      },
      layouts: {
        layout: { algorithm: 'layered' as const, direction: 'RIGHT' as ElkDirection, nodeSpacing: 60, layerSpacing: 140, padding: 40 },
      },
      activeLayout: 'layout',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Fit once ELK settles each run.
    const graph = canvas.layers.get('graph') as GraphLayer;
    onStoryTeardown(
      elkLayout.events.on('end', ({ reason }) => {
        if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
      }),
    );

    // ── Per-ROW (column) hover via engine sub-part events ────────────────
    // Each row's `hitId` rect makes the renderer emit `shape:partover` /
    // `shape:partout` as the cursor moves between rows — no pointer math.
    const renderer = graph.getRenderer()!;

    const setRow = (id: string, idx: number): void => {
      if ((hoverRow.get(id) ?? -1) === idx) return;
      if (idx < 0) hoverRow.delete(id);
      else hoverRow.set(id, idx);
      graph.redraw();
    };

    const onPartOver = (e: { id: string; partId: string }) => setRow(e.id, Number(e.partId));
    const onPartOut = (e: { id: string }) => setRow(e.id, -1);
    renderer.events.on('shape:partover', onPartOver);
    renderer.events.on('shape:partout', onPartOut);
    onStoryTeardown(() => renderer.events.off('shape:partover', onPartOver));
    onStoryTeardown(() => renderer.events.off('shape:partout', onPartOut));

    // ── Right-click editing — table menu + per-field menu + SchemaEditor ──
    // Suppress the browser's native menu over the canvas.
    const onNativeCtx = (e: MouseEvent) => e.preventDefault();
    container.addEventListener('contextmenu', onNativeCtx);
    onStoryTeardown(() => container.removeEventListener('contextmenu', onNativeCtx));

    // Data mutators — patch a node's schema, then redraw (the resolver re-runs).
    const dataOf = (id: string) => graph.store.getNode(id)?.data as TableData | undefined;
    const patchData = (id: string, patch: Partial<TableData>): void => {
      const cur = dataOf(id);
      if (!cur) return;
      graph.store.updateNode(id, { data: { ...cur, ...patch } });
      graph.redraw();
    };
    const fieldsOf = (id: string): Field[] => (dataOf(id)?.fields ?? []).map((f) => ({ ...f }));
    const schemaOf = (id: string): NodeSchema => {
      const d = dataOf(id)!;
      return { label: d.label, headerColor: d.header, fields: d.fields.map((f) => ({ name: f.name, type: f.type })) };
    };
    const applySchema = (id: string, s: NodeSchema): void => {
      const cur = dataOf(id);
      if (!cur) return;
      patchData(id, { label: s.label || cur.label, header: s.headerColor ?? cur.header, fields: s.fields.length ? s.fields : cur.fields });
    };

    // React overlay mounted over the canvas — menus + the SchemaEditor panel,
    // positioned from engine world coords via `camera.toScreen`.
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    container.appendChild(overlay);
    const root = createRoot(overlay);
    onStoryTeardown(() => {
      root.unmount();
      overlay.remove();
    });

    type MenuState = { x: number; y: number; nodeId: string; field?: number };

    function EditorOverlay() {
      const [menu, setMenu] = useState<MenuState | null>(null);
      const [panel, setPanel] = useState<{ nodeId: string } | null>(null);

      useEffect(() => {
        const at = (wx: number, wy: number) => canvas.camera.toScreen(wx, wy);
        const onTable = (e: { id: string; worldX: number; worldY: number }) => {
          const s = at(e.worldX, e.worldY);
          setPanel(null);
          setMenu({ x: s.x, y: s.y, nodeId: e.id });
        };
        const onField = (e: { id: string; partId: string; worldX: number; worldY: number }) => {
          const s = at(e.worldX, e.worldY);
          setPanel(null);
          setMenu({ x: s.x, y: s.y, nodeId: e.id, field: Number(e.partId) });
        };
        renderer.events.on('shape:contextmenu', onTable);
        renderer.events.on('shape:partcontextmenu', onField);
        return () => {
          renderer.events.off('shape:contextmenu', onTable);
          renderer.events.off('shape:partcontextmenu', onField);
        };
      }, []);

      const box: CSSProperties = { position: 'absolute', pointerEvents: 'auto', background: '#0b1220', border: '1px solid #334155', borderRadius: 8, padding: 4, minWidth: 190, boxShadow: '0 10px 30px rgba(0,0,0,.55)', color: '#e2e8f0', fontSize: 13 };
      const item: CSSProperties = { display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', background: 'transparent', border: 0, color: 'inherit', borderRadius: 6, cursor: 'pointer' };

      return (
        <>
          {(menu || panel) && (
            <div
              style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
              onPointerDown={() => {
                setMenu(null);
                setPanel(null);
              }}
            />
          )}

          {menu && (
            <div style={{ ...box, left: menu.x, top: menu.y }} onPointerDown={(e) => e.stopPropagation()}>
              {menu.field === undefined ? (
                <>
                  <button style={item} onClick={() => { setMenu(null); setPanel({ nodeId: menu.nodeId }); }}>Edit schema…</button>
                  <button style={item} onClick={() => { patchData(menu.nodeId, { fields: [...fieldsOf(menu.nodeId), { name: 'new_field', type: 'string' }] }); setMenu(null); }}>Add field</button>
                </>
              ) : (
                <>
                  <div style={{ padding: '4px 10px 6px', color: '#94a3b8', fontSize: 12 }}>Field: {fieldsOf(menu.nodeId)[menu.field]?.name}</div>
                  <button
                    style={item}
                    onClick={() => {
                      const fs = fieldsOf(menu.nodeId);
                      fs.splice(menu.field! + 1, 0, { name: 'new_field', type: 'string' });
                      patchData(menu.nodeId, { fields: fs });
                      setMenu(null);
                    }}
                  >
                    Add field below
                  </button>
                  <button style={{ ...item, color: '#f87171' }} onClick={() => { patchData(menu.nodeId, { fields: fieldsOf(menu.nodeId).filter((_, j) => j !== menu.field) }); setMenu(null); }}>Delete field</button>
                  <button style={item} onClick={() => { setMenu(null); setPanel({ nodeId: menu.nodeId }); }}>Edit table schema…</button>
                </>
              )}
            </div>
          )}

          {panel && (
            <div
              style={{ position: 'absolute', left: 12, top: 12, width: 300, maxHeight: 'calc(100% - 24px)', overflow: 'auto', pointerEvents: 'auto', background: '#0b1220', border: '1px solid #334155', borderRadius: 10, boxShadow: '0 14px 36px rgba(0,0,0,.6)' }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #334155', color: '#e2e8f0', fontWeight: 600 }}>
                <span>Edit schema</span>
                <button style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }} onClick={() => setPanel(null)}>✕</button>
              </div>
              <SchemaEditor
                key={panel.nodeId}
                defaults={schemaOf(panel.nodeId)}
                onSubmit={(s) => {
                  applySchema(panel.nodeId, s);
                  setPanel(null);
                }}
              />
            </div>
          )}
        </>
      );
    }

    root.render(<EditorOverlay />);

    // ── GUI — the ELK knobs with the largest visual effect ───────────────
    const gui = new GUI({ title: 'Schema Table — layout' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => elkLayout.stop());

    const applyLayout = (): void => canvas.update({ layouts: { layout: canvasOptions.layouts.layout } });
    gui.add(canvasOptions.layouts.layout, 'direction', ['UP', 'DOWN', 'LEFT', 'RIGHT']).onChange(applyLayout);
    gui.add(canvasOptions.layouts.layout, 'nodeSpacing', 20, 160, 5).onChange(applyLayout);
    gui.add(canvasOptions.layouts.layout, 'layerSpacing', 60, 260, 10).onChange(applyLayout);
  },
};
