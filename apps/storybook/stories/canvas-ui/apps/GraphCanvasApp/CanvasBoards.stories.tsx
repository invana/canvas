/**
 * **Canvas Boards** — a workbook of **boards**: each tab is a design-kit board
 * (`@invana/boards`, drawn from a JSON spec), and a board can hold a live canvas,
 * dashboard panels, or both. The canvas panels come from `@invana/canvas-boards`:
 *
 * - **Team** — a `canvas` with `inspect: true`, and a `canvas-inspector` in the
 *   board's inspector column. Click a node and the column shows it.
 * - **Build pipeline** — a `canvas` over a `canvas-table`: the table lists the
 *   live graph's nodes (kit `table` block), and clicking a row selects that node.
 * - **Overview** — a dashboard and no canvas: metric tiles, a ranked list and a
 *   table, all kit panels.
 *
 * The tab strip is `@invana/ui`'s `Workbook`: `+` adds a board (cycling the three
 * templates), and the active tab's caret renames, duplicates or removes one.
 * Every board stays mounted (`keepMounted`), so a canvas keeps its camera across
 * a switch; removing a board unmounts it and tears its engine down.
 *
 * The boards are **data**: each is a `BoardSpec<CanvasPanelKinds>` (a mistyped
 * panel option is a compile error), and a canvas names its graph by `dataRef`,
 * resolved by `CanvasBoard`'s `resolveData`. That is also why every canvas here
 * uses the bundle's force layout: a board spec has no place for a layout *class*,
 * only for config. See rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { BoardSpec } from '@invana/boards';
import { CanvasBoard, type CanvasPanelKinds } from '@invana/canvas-boards';
import type { GraphData } from '@invana/graph';
import { Workbook, type WorkbookAction, type WorkbookPage, type WorkbookPageMenuItem } from '@invana/ui';
import { Copy, Info, Pencil, Settings, Trash2 } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/CanvasBoards' };
export default meta;
type Story = StoryObj;

export const CanvasBoardsStory: Story = {
  name: 'CanvasBoards',
  render: () => {
    // ── The graphs a canvas panel can name by `dataRef` ──────────────────────
    const graphs = useMemo<Record<string, GraphData>>(
      () => ({
        // A 10-person team and who collaborates with whom.
        team: {
          nodes: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'].map((id) => ({
            id,
            type: 'node',
          })),
          edges: [
            ['Alice', 'Bob'], ['Alice', 'Carol'], ['Bob', 'Carol'], ['Carol', 'Dave'], ['Dave', 'Eve'],
            ['Eve', 'Frank'], ['Frank', 'Dave'], ['Carol', 'Grace'], ['Grace', 'Heidi'], ['Heidi', 'Ivan'],
            ['Ivan', 'Grace'], ['Eve', 'Judy'], ['Judy', 'Alice'],
          ].map(([source, target], i) => ({ id: `c${i}`, source: source!, target: target!, type: 'collaborates' })),
        },
        // A CI/CD build pipeline.
        pipeline: {
          nodes: ['Source', 'Install', 'Lint', 'Typecheck', 'Test', 'Build', 'Bundle', 'Deploy', 'Notify'].map(
            (id) => ({ id, type: 'node' }),
          ),
          edges: [
            ['Source', 'Install'], ['Install', 'Lint'], ['Install', 'Typecheck'], ['Install', 'Test'],
            ['Lint', 'Build'], ['Typecheck', 'Build'], ['Test', 'Build'], ['Build', 'Bundle'],
            ['Bundle', 'Deploy'], ['Deploy', 'Notify'],
          ].map(([source, target], i) => ({ id: `p${i}`, source: source!, target: target!, type: 'then' })),
        },
      }),
      [],
    );
    const resolveData = useCallback((ref: string) => graphs[ref], [graphs]);

    // ── Board templates: plain JSON specs ────────────────────────────────────
    const templates = useMemo<{ title: string; spec: BoardSpec<CanvasPanelKinds> }[]>(() => {
      const degree = new Map<string, number>();
      for (const e of graphs.team!.edges) {
        degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
        degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
      }
      const ranked = [...degree.entries()].sort((a, b) => b[1] - a[1]);
      return [
        {
          title: 'Team',
          spec: {
            rows: [
              {
                panels: [
                  {
                    id: 'team-canvas',
                    kind: 'canvas',
                    flush: true,
                    options: {
                      dataRef: 'team',
                      inspect: true,
                      height: 640,
                      config: {
                        behaviours: { color: { enabled: false } },
                        layers: {
                          graph: {
                            // A type binding needs a structure to carry its label.
                            nodeStructureTemplates: {
                              person: { name: 'person', kind: 'simple', shape: { kind: 'circle', radius: 10 }, slots: { label: true } },
                            },
                            nodeStylingTemplates: { person: { name: 'person' } },
                            nodeTypes: { node: { structure: 'person', styling: 'person', bindings: { label: 'id' } } },
                            node: { style: { bgFill: 0x60a5fa } },
                          },
                        },
                        layouts: { 'graph-force': { charge: { strength: -400 } } },
                      },
                    },
                  },
                ],
              },
            ],
            inspector: {
              width: 320,
              spec: { rows: [{ panels: [{ id: 'team-inspector', kind: 'canvas-inspector', options: {} }] }] },
            },
          },
        },
        {
          title: 'Build pipeline',
          spec: {
            rows: [
              {
                panels: [
                  {
                    id: 'pipeline-canvas',
                    kind: 'canvas',
                    flush: true,
                    options: {
                      dataRef: 'pipeline',
                      height: 420,
                      config: {
                        behaviours: { color: { enabled: false } },
                        layers: {
                          graph: {
                            nodeStructureTemplates: {
                              step: {
                                name: 'step',
                                kind: 'simple',
                                shape: { kind: 'rect', width: 80, height: 26, cornerRadius: 5 },
                                slots: { label: true },
                              },
                            },
                            nodeStylingTemplates: { step: { name: 'step' } },
                            nodeTypes: { node: { structure: 'step', styling: 'step', bindings: { label: 'id' } } },
                            node: { style: { bgFill: 0x059669, labelColor: 0xffffff, labelPlacement: 'inside-center', labelOffsetY: 0 } },
                            edge: { style: { arrowTargetShape: 'triangle' } },
                          },
                        },
                      },
                    },
                  },
                ],
              },
              {
                panels: [
                  {
                    id: 'pipeline-table',
                    kind: 'canvas-table',
                    title: 'Steps',
                    options: {
                      noun: 'steps',
                      columns: [
                        { key: 'id', label: 'Step', mono: true },
                        { key: 'degree', label: 'Links', align: 'right' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          title: 'Overview',
          spec: {
            rows: [
              {
                panels: [
                  {
                    id: 'overview-tiles',
                    kind: 'grid',
                    options: {
                      tiles: [
                        { label: 'People', value: graphs.team!.nodes.length },
                        { label: 'Collaborations', value: graphs.team!.edges.length },
                        { label: 'Pipeline steps', value: graphs.pipeline!.nodes.length },
                        { label: 'Most connected', value: ranked[0]![0] },
                      ],
                    },
                  },
                ],
              },
              {
                panels: [
                  {
                    id: 'overview-ranked',
                    kind: 'ranked',
                    title: 'Collaborations per person',
                    options: { items: ranked.map(([label, value]) => ({ label, value })) },
                  },
                  {
                    id: 'overview-table',
                    kind: 'table',
                    title: 'Pipeline',
                    options: {
                      columns: [
                        { key: 'step', label: 'Step', mono: true },
                        { key: 'next', label: 'Next' },
                      ],
                      rows: graphs.pipeline!.edges.map((e) => ({ step: e.source, next: e.target })),
                      noun: 'links',
                    },
                  },
                ],
              },
            ],
          },
        },
      ];
    }, [graphs]);

    // ── The workbook: board instances over the templates ─────────────────────
    const nextId = useRef(3);
    const [boards, setBoards] = useState<{ id: number; template: number; title?: string }[]>([
      { id: 0, template: 0 },
      { id: 1, template: 1 },
      { id: 2, template: 2 },
    ]);
    const [activeId, setActiveId] = useState(0);
    const titleOf = (b: { template: number; title?: string }): string => b.title ?? templates[b.template]!.title;

    const pages: WorkbookPage[] = boards.map((b) => ({
      id: String(b.id),
      title: titleOf(b),
      content: (
        <CanvasBoard
          resolveData={resolveData}
          spec={templates[b.template]!.spec}
          className="h-full overflow-auto p-3"
          onAction={(action, ctx) => console.info('board action', action, ctx)}
        />
      ),
    }));

    const pageMenuItems: WorkbookPageMenuItem[] = [
      {
        id: 'rename',
        label: 'Rename',
        icon: Pencil,
        onSelect: (id) =>
          setBoards((bs) =>
            bs.map((b) => {
              if (String(b.id) !== id) return b;
              const next = window.prompt('Rename board', titleOf(b));
              return next && next.trim() ? { ...b, title: next.trim() } : b;
            }),
          ),
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: Copy,
        onSelect: (id) => {
          const src = boards.find((b) => String(b.id) === id);
          if (!src) return;
          const copy = { id: nextId.current++, template: src.template, title: `${titleOf(src)} copy` };
          setBoards((bs) => {
            const at = bs.findIndex((b) => b.id === src.id);
            return [...bs.slice(0, at + 1), copy, ...bs.slice(at + 1)];
          });
          setActiveId(copy.id);
        },
      },
      {
        id: 'remove',
        label: 'Remove',
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        disabled: boards.length <= 1,
        onSelect: (id) =>
          setBoards((bs) => {
            if (bs.length <= 1) return bs;
            const next = bs.filter((b) => String(b.id) !== id);
            if (id === String(activeId)) setActiveId(next[next.length - 1]!.id);
            return next;
          }),
      },
    ];

    const headerActions: WorkbookAction[] = [
      { id: 'settings', label: 'Settings', icon: Settings, onClick: () => window.alert('Settings') },
      { id: 'about', label: 'About', icon: Info, onClick: () => window.alert('Canvas Boards demo') },
    ];

    return (
      <div className="bg-background text-foreground h-screen w-full">
        <Workbook
          pages={pages}
          activeId={String(activeId)}
          onSelect={(id) => setActiveId(Number(id))}
          onAdd={() => {
            const id = nextId.current++;
            setBoards((bs) => [...bs, { id, template: id % templates.length }]);
            setActiveId(id);
          }}
          headerActions={headerActions}
          pageMenuItems={pageMenuItems}
          addLabel="New board"
        />
      </div>
    );
  },
};
