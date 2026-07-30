/**
 * **Schema / ER table nodes** — the entity node of a data-model diagram, built
 * **entirely in userland** from the generic `composite` shape and dressed in the
 * `<GraphCanvasApp>` shell. There is no `schema` template kind in the engine: a
 * node's `shape` is a *resolver* (`config.layers.graph.node.style.shape =
 * (node) => CompositeShapeOption`), so this story maps each node's data to a
 * composite with a coloured **header** (icon + title) over a **variable-length**
 * list of field rows — a colour-coded type-chip, the field name, and the field's
 * **data type** on the right (`integer` / `string` / …). The card height is
 * computed from the field count.
 *
 * **Interactivity, all riding on the engine's composite + sub-part support:**
 * - *Whole-card hover* — the canonical `hovered` state is a `ring` decoration
 *   that traces the card silhouette (composites delegate decorations to the root
 *   shape). No per-shape code.
 * - *Per-row hover* — each row's full-width `rect` carries a `hitId`, so the
 *   renderer emits `shape:partover` / `shape:partout`; the resolver lights up
 *   the band. No pointer math.
 * - *Right-click editing* — right-click a **table** → `<GraphNodeContextMenu>`
 *   (canvas-ui, positioned + dismissed for us) with *Edit schema…* / *Add
 *   field*; right-click a **row** → a per-field menu (add below / delete) from
 *   the renderer's `shape:partcontextmenu`, positioned inside the canvas host
 *   with `camera.toScreen`. *Edit schema…* docks the reusable
 *   `<SchemaEditorPanel>` in the app's resizable **right** region for bulk add /
 *   remove / reorder / retype. Every edit writes back to the node's `data` and
 *   redraws — the resolver re-runs, so the card reshapes itself.
 *
 * ELK `layered` arranges the star schema; the header's **direction** picker
 * re-runs it, and the **Settings** toggle docks `<CanvasSettingsEditorPanel>`
 * over the same config when no table is being edited.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout, TextResolutionLODBehaviour } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  GraphStatusBar,
  PanelContent,
  SchemaEditorPanel,
  ToolbarItems,
  useSidePanels,
  type NodeSchema,
} from '@invana/canvas-ui';
import type { CanvasConfig, CompositePart } from '@invana/canvas';
import type {
  CompositeShapeOption,
  GraphCanvas,
  GraphData,
  GraphLayer,
  GraphNode,
} from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import { Button, Card } from '@invana/ui';
import { ThemeProvider } from '@invana/themes';
import { Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'Usecases/Schema Table' };
export default meta;
type Story = StoryObj;

export const SchemaTable: Story = {
  render: function Render() {
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

    const [direction, setDirection] = useState<ElkDirection>('RIGHT');
    // The live engine, lifted out of the app so the sub-part listeners and the
    // schema mutators can reach the graph store.
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    // Which table the docked schema editor is editing (`null` = none).
    const [editing, setEditing] = useState<string | null>(null);
    // The open per-field menu: canvas-host coords + which row.
    const [fieldMenu, setFieldMenu] = useState<{ x: number; y: number; nodeId: string; field: number } | null>(null);

    // Per-node hovered ROW index, read by the shape resolver to paint the band.
    // A ref, not state: it's touched on every pointer move between rows and only
    // ever drives an engine redraw — re-rendering React for it would be waste.
    const hoverRow = useRef(new Map<string, number>());

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (c) => (
            <CanvasSettingsEditorPanel canvas={c} className="border-0 bg-transparent shadow-none" />
          ),
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    // ── Data — a star schema: three dimensions + one fact table ──────────
    const data: GraphData = useMemo(
      () => ({
        nodes: [
          {
            id: 'dim_customer',
            type: 'Dimension',
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
            type: 'Dimension',
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
            type: 'Dimension',
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
            type: 'Fact',
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
        ],
        edges: [
          { id: 'f-customer', source: 'fact_order', target: 'dim_customer', type: 'REFERENCES' },
          { id: 'f-date', source: 'fact_order', target: 'dim_date', type: 'REFERENCES' },
          { id: 'f-supplier', source: 'fact_order', target: 'dim_supplier', type: 'REFERENCES' },
        ],
      }),
      [],
    );

    // ── Schema mutators — patch the node's `data`, then redraw ────────────
    // Edits go straight to the graph store (not React state): a new `data`
    // identity would re-seed the whole graph and re-run ELK on every field add.
    // The resolver re-runs on redraw, so the card reshapes in place.
    const layerOf = useCallback(
      (): GraphLayer | undefined => canvas?.layers.get<GraphLayer>('graph'),
      [canvas],
    );
    const dataOf = useCallback(
      (id: string): TableData | undefined => layerOf()?.store.getNode(id)?.data as TableData | undefined,
      [layerOf],
    );
    const patchData = useCallback(
      (id: string, patch: Partial<TableData>): void => {
        const layer = layerOf();
        const cur = dataOf(id);
        if (!layer || !cur) return;
        layer.store.updateNode(id, { data: { ...cur, ...patch } });
        layer.redraw();
      },
      [layerOf, dataOf],
    );
    const fieldsOf = useCallback(
      (id: string): Field[] => (dataOf(id)?.fields ?? []).map((f) => ({ ...f })),
      [dataOf],
    );

    // ── Sub-part events: per-row hover + per-row right-click ──────────────
    // Row hit-testing has no canvas-bus equivalent, so these come off the
    // layer's renderer — the engine seam for composite sub-parts.
    useEffect(() => {
      const layer = canvas?.layers.get<GraphLayer>('graph');
      const renderer = layer?.getRenderer();
      if (!canvas || !layer || !renderer) return;

      const setRow = (id: string, idx: number): void => {
        if ((hoverRow.current.get(id) ?? -1) === idx) return;
        if (idx < 0) hoverRow.current.delete(id);
        else hoverRow.current.set(id, idx);
        layer.redraw();
      };

      const onPartOver = (e: { id: string; partId: string }) => setRow(e.id, Number(e.partId));
      const onPartOut = (e: { id: string }) => setRow(e.id, -1);
      const onPartContextMenu = (e: { id: string; partId: string; worldX: number; worldY: number }) => {
        // The menu renders inside the canvas host (`position: relative`), so
        // screen coords from the camera need no further offset.
        const p = canvas.camera.toScreen(e.worldX, e.worldY);
        setFieldMenu({ x: p.x, y: p.y, nodeId: e.id, field: Number(e.partId) });
      };

      renderer.events.on('shape:partover', onPartOver);
      renderer.events.on('shape:partout', onPartOut);
      renderer.events.on('shape:partcontextmenu', onPartContextMenu);
      return () => {
        renderer.events.off('shape:partover', onPartOver);
        renderer.events.off('shape:partout', onPartOut);
        renderer.events.off('shape:partcontextmenu', onPartContextMenu);
      };
    }, [canvas]);

    const config: CanvasConfig = useMemo(() => {
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

      /** Build the composite spec for one table node. Pure data → parts. */
      const buildTable = (node: GraphNode): CompositeShapeOption => {
        const d = node.data as TableData;
        const height = HEADER_H + d.fields.length * ROW_H + 6;
        const parts: CompositePart[] = [];
        const activeRow = hoverRow.current.get(node.id) ?? -1;

        // Header band — a rect with only its TOP corners rounded (a full
        // rounded rect + a square rect over the bottom `RADIUS` strip).
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

        return {
          kind: 'composite',
          width: WIDTH,
          height,
          cornerRadius: RADIUS,
          fill: BODY_BG,
          stroke: { color: 0x334155, width: 1 },
          parts,
        };
      };

      return {
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'layout',
        behaviours: {
          // The card carries its own colours — nothing else may repaint it.
          color: { enabled: false },
          hover: { enabled: true },
          'drag-node': { enabled: true },
          'label-lod': { enabled: true },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.85 },
          graph: {
            node: {
              // `bgStrokeWidth: 0` stops the base node border from framing the
              // card — the composite carries its own stroke.
              style: { shape: buildTable, bgStrokeWidth: 0 },
            },
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
        },
        layouts: {
          layout: { algorithm: 'layered', direction, nodeSpacing: 60, layerSpacing: 140, padding: 40 },
        },
      };
      // `hoverRow` is a stable ref the resolver reads at draw time.
    }, [direction]);

    const onReady = useCallback((c: GraphCanvas | null) => {
      setCanvas(c);
      c?.showMessage('Right-click a table header or a field row to edit the schema');
    }, []);

    // The right region shows the schema editor while a table is being edited,
    // and otherwise whatever the activity bar has open.
    const rightRegion = editing
      ? {
          content: (
            <PanelContent header="Edit schema" onClose={() => setEditing(null)} fill>
              <SchemaEditorPanel
                key={editing}
                defaults={((): NodeSchema => {
                  const d = dataOf(editing)!;
                  return {
                    label: d.label,
                    headerColor: d.header,
                    fields: d.fields.map((f) => ({ name: f.name, type: f.type })),
                  };
                })()}
                onSubmit={(s) => {
                  const cur = dataOf(editing);
                  if (!cur) return;
                  patchData(editing, {
                    label: s.label || cur.label,
                    header: s.headerColor ?? cur.header,
                    fields: s.fields.length ? s.fields : cur.fields,
                  });
                  setEditing(null);
                }}
              />
            </PanelContent>
          ),
          defaultSize: '340px',
          maxSize: '460px',
        }
      : dock.region;

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Schema Table',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'direction',
                    label: 'Direction',
                    value: direction,
                    options: { RIGHT: 'Right', DOWN: 'Down', LEFT: 'Left', UP: 'Up' },
                    onChange: (v) => setDirection(v as ElkDirection),
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
                    onToggle: ctx.toggleTheme,
                  },
                ]}
              />
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={rightRegion}
        >
          {/* Layered ELK over the star schema. */}
          <ElkLayout id="layout" targetLayerId="graph" fitPadding={80} />

          {/* Keeps the composite's label parts crisp when zoomed in — composite
              labels opt into this via `CompositeShape.setLabelResolution`. */}
          <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" />

          {/* Whole-table menu — canvas-ui owns the positioning and dismissal. */}
          <GraphNodeContextMenu
            items={({ id, close }) => [
              {
                id: 'edit-schema',
                label: 'Edit schema…',
                onClick: () => {
                  setFieldMenu(null);
                  setEditing(id);
                  close();
                },
              },
              {
                id: 'add-field',
                label: 'Add field',
                onClick: () => {
                  patchData(id, { fields: [...fieldsOf(id), { name: 'new_field', type: 'string' }] });
                  close();
                },
              },
            ]}
          />

          {/* Per-FIELD menu. The row-level `shape:partcontextmenu` has no
              canvas-ui equivalent (menus are node / edge / background scoped),
              so this one is positioned by hand — inside the canvas host, whose
              `position: relative` makes camera screen coords land as-is. */}
          {fieldMenu && (
            <div className="absolute inset-0" onPointerDown={() => setFieldMenu(null)}>
              <Card
                className="absolute min-w-48 p-1"
                style={{ left: fieldMenu.x, top: fieldMenu.y }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="text-muted-foreground px-2 py-1 text-xs">
                  Field: {fieldsOf(fieldMenu.nodeId)[fieldMenu.field]?.name}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const fs = fieldsOf(fieldMenu.nodeId);
                    fs.splice(fieldMenu.field + 1, 0, { name: 'new_field', type: 'string' });
                    patchData(fieldMenu.nodeId, { fields: fs });
                    setFieldMenu(null);
                  }}
                >
                  Add field below
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive w-full justify-start"
                  onClick={() => {
                    patchData(fieldMenu.nodeId, {
                      fields: fieldsOf(fieldMenu.nodeId).filter((_, j) => j !== fieldMenu.field),
                    });
                    setFieldMenu(null);
                  }}
                >
                  Delete field
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setEditing(fieldMenu.nodeId);
                    setFieldMenu(null);
                  }}
                >
                  Edit table schema…
                </Button>
              </Card>
            </div>
          )}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
