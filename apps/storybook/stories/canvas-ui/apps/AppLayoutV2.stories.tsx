/**
 * **The Explorer shell around a stack of canvases** — `AppLayoutV2` (the
 * design-kit's app shell: header · rail · left panel · main · right inspector ·
 * status bar) with a `<CanvasPagesViewPanel>` filling its **main** region. The
 * boards read like sheets in a spreadsheet: one tab strip across the top of the
 * main area, the page bodies underneath it.
 *
 * **One view, one instance.** `CanvasPagesViewPanel` renders its strip and its
 * body as a single column, so the main section mounts it once and gets both —
 * the tabs (with `onAdd`, the per-page caret menu and the panel-toggle
 * `headerActions`) and, below them, one `<GraphCanvasApp>` per board with
 * `showHeader={false}`, because the chrome around it is the shell, not the app's
 * own rail. The footer stays a plain status bar.
 *
 * **State survives a tab switch.** The panel keeps `keepMounted` (its default):
 * every board stays mounted and the inactive ones are hidden, not destroyed —
 * pan/zoom one board, switch away and back, and its camera, layout and selection
 * are exactly where you left them. Each board is its own engine, sharing nothing
 * but the host `<ThemeProvider>`. **Remove** tears one down.
 *
 * **The footer is the active board's readout** — node / edge counts and the force
 * settings it runs, read from this story's own board list. Nothing there is
 * mocked; per-frame numbers (fps, zoom) would have to come from the engine, which
 * lives *inside* a board and can't be reached from the shell footer.
 */

import { useMemo, useRef, useState, type ElementType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, GraphNode } from '@invana/graph';
import {
  CanvasPagesViewPanel,
  GraphCanvasApp,
  type CanvasPage,
  type CanvasPageMenuItem,
} from '@invana/canvas-ui';
import {
  AppLayoutV2,
  ThemeProvider,
  ThemeSelector,
  type AppLayoutV2Props,
} from '@invana/themes';
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PropertyList,
  PropertyRow,
  ScrollArea,
  Separator,
  StatusDot,
  TabbedPanel,
  cn,
} from '@invana/ui';
import {
  Copy,
  GitBranch,
  Layers,
  Network,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  Users,
} from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/apps/AppLayoutV2' };
export default meta;
type Story = StoryObj;

export const AppLayoutV2Story: Story = {
  name: 'AppLayoutV2',
  render: () => {
    // ── The board templates a canvas can be opened from ──────────────────────
    // Memoised so a re-render (a tab click, a panel toggle) never hands a live
    // `<GraphCanvasApp>` a new `data` / `config` identity and reloads its engine.
    // Every board runs the app bundle's `graph-force` layout, tuned per template
    // through `config` alone — no extra layout package, no in-canvas children.
    const templates = useMemo<
      {
        title: string;
        icon: ElementType;
        /** What the board is, for the inspector. */
        about: string;
        /** The force settings this board runs, echoed in the footer readout. */
        force: string;
        data: GraphData;
        config: CanvasConfig;
      }[]
    >(
      () => [
        {
          title: 'Team',
          icon: Users,
          about: 'Who collaborates with whom — an undirected people graph.',
          force: 'charge −340 · link 90',
          data: {
            nodes: [
              'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
            ].map((id) => ({ type: 'person', id })),
            edges: [
              ['Alice', 'Bob'], ['Alice', 'Carol'], ['Bob', 'Carol'], ['Carol', 'Dave'],
              ['Dave', 'Eve'], ['Eve', 'Frank'], ['Frank', 'Dave'], ['Carol', 'Grace'],
              ['Grace', 'Heidi'], ['Heidi', 'Ivan'], ['Ivan', 'Grace'], ['Eve', 'Judy'],
              ['Judy', 'Alice'],
            ].map(([source, target], i) => ({
              id: `c${i}`,
              source: source!,
              target: target!,
              type: 'collaborates',
            })),
          },
          config: {
            behaviours: { color: { enabled: false } },
            layouts: { 'graph-force': { charge: { strength: -340 }, link: { distance: 90 } } },
            layers: {
              graph: {
                node: {
                  style: {
                    shape: { kind: 'circle', radius: 10 },
                    bgFill: 0x60a5fa,
                    labelText: (n: GraphNode) => n.id,
                  },
                },
                edge: { style: { strokeWidth: 1.25, strokeColor: 0x94a3b8 } },
              },
            },
          },
        },
        {
          title: 'Build pipeline',
          icon: GitBranch,
          about: 'A CI/CD DAG — every edge is a "then", drawn with arrowheads.',
          force: 'charge −520 · link 110',
          data: {
            nodes: [
              'Source', 'Install', 'Lint', 'Typecheck', 'Test', 'Build', 'Bundle', 'Deploy', 'Notify',
            ].map((id) => ({ type: 'stage', id })),
            edges: [
              ['Source', 'Install'], ['Install', 'Lint'], ['Install', 'Typecheck'],
              ['Install', 'Test'], ['Lint', 'Build'], ['Typecheck', 'Build'], ['Test', 'Build'],
              ['Build', 'Bundle'], ['Bundle', 'Deploy'], ['Deploy', 'Notify'],
            ].map(([source, target], i) => ({
              id: `p${i}`,
              source: source!,
              target: target!,
              type: 'then',
            })),
          },
          config: {
            behaviours: { color: { enabled: false } },
            layouts: { 'graph-force': { charge: { strength: -520 }, link: { distance: 110 } } },
            layers: {
              graph: {
                node: {
                  style: {
                    shape: { kind: 'rect', width: 78, height: 26, cornerRadius: 5 },
                    bgFill: 0x059669,
                    bgStrokeColor: 0x065f46,
                    bgStrokeWidth: 1.5,
                    labelPlacement: 'inside-center',
                    labelAlign: 'center',
                    labelOffsetX: 0,
                    labelOffsetY: 0,
                    labelFontSize: 10,
                    labelText: (n: GraphNode) => n.id,
                  },
                },
                edge: {
                  style: { strokeWidth: 1.5, strokeColor: 0x64748b, arrowTargetShape: 'triangle' },
                },
              },
            },
          },
        },
        {
          title: 'Org chart',
          icon: Network,
          about: 'A single-root reporting tree — parent → child is "manages".',
          force: 'charge −420 · link 80',
          data: {
            nodes: [
              'CEO', 'CTO', 'CFO', 'CMO', 'Backend', 'Frontend', 'DevOps', 'QA', 'Accounting',
              'Payroll', 'Content', 'Ads',
            ].map((id) => ({ type: 'role', id })),
            edges: [
              ['CEO', 'CTO'], ['CEO', 'CFO'], ['CEO', 'CMO'], ['CTO', 'Backend'],
              ['CTO', 'Frontend'], ['CTO', 'DevOps'], ['CTO', 'QA'], ['CFO', 'Accounting'],
              ['CFO', 'Payroll'], ['CMO', 'Content'], ['CMO', 'Ads'],
            ].map(([source, target], i) => ({
              id: `o${i}`,
              source: source!,
              target: target!,
              type: 'manages',
            })),
          },
          config: {
            behaviours: { color: { enabled: false } },
            layouts: { 'graph-force': { charge: { strength: -420 }, link: { distance: 80 } } },
            layers: {
              graph: {
                node: {
                  style: {
                    shape: { kind: 'regular-polygon', sides: 6, radius: 12 },
                    bgFill: 0xfbbf24,
                    bgStrokeColor: 0xb45309,
                    bgStrokeWidth: 1.5,
                    labelText: (n: GraphNode) => n.id,
                  },
                },
                edge: { style: { strokeWidth: 1.25, strokeColor: 0xd97706 } },
              },
            },
          },
        },
      ],
      [],
    );

    // ── Shell state: the open boards, the active one, the side panels ────────
    const [boards, setBoards] = useState<{ id: string; templateIndex: number; title: string }[]>(
      () => [
        { id: 'b0', templateIndex: 0, title: 'Team' },
        { id: 'b1', templateIndex: 1, title: 'Build pipeline' },
      ],
    );
    const [activeId, setActiveId] = useState('b0');
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const nextBoardId = useRef(2);

    const activeBoard = boards.find((b) => b.id === activeId) ?? boards[0]!;
    const activeTemplate = templates[activeBoard.templateIndex]!;

    // Open a new board, cycling the templates, and make it the active one.
    const addBoard = (): void => {
      const id = `b${nextBoardId.current++}`;
      const templateIndex = boards.length % templates.length;
      setBoards((bs) => [...bs, { id, templateIndex, title: templates[templateIndex]!.title }]);
      setActiveId(id);
    };

    // Remove tears the board's engine down (its `<GraphCanvasApp>` unmounts);
    // the strip always keeps one board, so the centre is never empty.
    const removeBoard = (id: string): void => {
      setBoards((bs) => {
        if (bs.length <= 1) return bs;
        const next = bs.filter((b) => b.id !== id);
        if (id === activeId) setActiveId(next[next.length - 1]!.id);
        return next;
      });
    };

    const renameBoard = (id: string): void => {
      setBoards((bs) =>
        bs.map((b) => {
          if (b.id !== id) return b;
          const title = window.prompt('Rename canvas', b.title);
          return title && title.trim() ? { ...b, title: title.trim() } : b;
        }),
      );
    };

    // Clone a board (same template, "copy" title) right after it, and activate it.
    const duplicateBoard = (id: string): void => {
      const src = boards.find((b) => b.id === id);
      if (!src) return;
      const newId = `b${nextBoardId.current++}`;
      setBoards((bs) => {
        const at = bs.findIndex((b) => b.id === id);
        const copy = { id: newId, templateIndex: src.templateIndex, title: `${src.title} copy` };
        return [...bs.slice(0, at + 1), copy, ...bs.slice(at + 1)];
      });
      setActiveId(newId);
    };

    // ── The pages the view renders ───────────────────────────────────────────
    // One independent `<GraphCanvasApp>` per board, header off — the chrome
    // around it is the AppV2 shell, not the app's own rail.
    const pages: CanvasPage[] = boards.map((b) => ({
      id: b.id,
      title: b.title,
      icon: templates[b.templateIndex]!.icon,
      content: (
        <GraphCanvasApp
          data={templates[b.templateIndex]!.data}
          config={templates[b.templateIndex]!.config}
          showHeader={false}
        />
      ),
    }));

    // The active tab's caret dropdown, in the main region's strip.
    const pageMenuItems: CanvasPageMenuItem[] = [
      { id: 'rename', label: 'Rename', icon: Pencil, onSelect: renameBoard },
      { id: 'duplicate', label: 'Duplicate', icon: Copy, onSelect: duplicateBoard },
      {
        id: 'remove',
        label: 'Remove',
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        disabled: boards.length <= 1,
        onSelect: removeBoard,
      },
    ];

    const layout: AppLayoutV2Props = {
      header: {
        left: (
          <div className="flex items-center gap-1">
            <span className="select-none px-2 text-xl font-bold">Invana Studio</span>
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb className="px-1.5">
              <BreadcrumbList className="gap-1.5 font-bold text-foreground sm:gap-1.5">
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="hover:text-primary">
                    ravi-merugu
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="hover:text-primary">
                    stock-market-graph
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold">{activeBoard.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        ),
        right: (
          <div className="flex items-center gap-1 px-2">
            <span className="text-meta text-muted-foreground tabular-nums">
              {boards.length} {boards.length === 1 ? 'canvas' : 'canvases'}
            </span>
            <Button variant="ghost" size="xs" onClick={addBoard}>
              <Plus /> New canvas
            </Button>
            {/* Real theme control — it drives the surrounding `ThemeProvider`. */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-xs" title="Theme & appearance">
                  <Palette />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <ThemeSelector layout="form" showAccent={false} />
              </PopoverContent>
            </Popover>
          </div>
        ),
      },

      // The rail reopens whichever side panel it names.
      leftNav: {
        topNavItems: [
          {
            name: 'Canvases',
            icon: Layers,
            iconClassName: 'w-5 h-5',
            tooltipSide: 'right',
            className: cn(
              'my-1.5',
              leftOpen
                ? '!bg-primary/15 !text-primary !ring-primary/25'
                : '!bg-transparent !text-foreground !ring-transparent hover:!bg-primary/10 hover:!text-primary',
            ),
            onClick: () => setLeftOpen((v) => !v),
          },
        ],
        bottomNavItems: [
          {
            name: 'Inspector',
            icon: SlidersHorizontal,
            iconClassName: 'w-5 h-5',
            tooltipSide: 'right',
            className: cn(
              'my-1.5',
              rightOpen
                ? '!bg-primary/15 !text-primary !ring-primary/25'
                : '!bg-transparent !text-foreground !ring-transparent hover:!bg-primary/10 hover:!text-primary',
            ),
            onClick: () => setRightOpen((v) => !v),
          },
        ],
      },

      // ── Left: the open canvases, as a list. Same selection as the footer tabs.
      leftSection: leftOpen
        ? {
            defaultSize: '260px',
            minSize: '200px',
            maxSize: '420px',
            collapsible: true,
            content: (
              <TabbedPanel
                className="border-0"
                bodyClassName="p-0"
                tabs={[
                  {
                    value: 'canvases',
                    label: 'Canvases',
                    icon: Layers,
                    content: (
                      <ScrollArea className="h-full">
                        {boards.map((b) => {
                          const t = templates[b.templateIndex]!;
                          const Icon = t.icon;
                          const active = b.id === activeBoard.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setActiveId(b.id)}
                              className={cn(
                                'flex h-[30px] w-full items-center gap-2 px-3 text-left hover:bg-primary/5',
                                active ? 'bg-primary/10 text-primary' : 'text-foreground',
                              )}
                            >
                              <Icon className="size-3.5 shrink-0" />
                              <span className="truncate text-sm">{b.title}</span>
                              <span className="ml-auto shrink-0 text-meta text-muted-foreground tabular-nums">
                                {t.data.nodes.length} / {t.data.edges.length}
                              </span>
                            </button>
                          );
                        })}
                      </ScrollArea>
                    ),
                  },
                ]}
                headerActions={[
                  { key: 'new', name: 'New canvas', icon: Plus, onClick: addBoard },
                  {
                    key: 'close',
                    name: 'Collapse panel',
                    icon: PanelLeftClose,
                    onClick: () => setLeftOpen(false),
                  },
                ]}
              />
            ),
          }
        : undefined,

      // ── Main: the canvases — tab strip on top, the active board below. ─────
      mainSection: {
        defaultSize: '600px',
        minSize: '300px',
        content: (
          <CanvasPagesViewPanel
            pages={pages}
            activeId={activeBoard.id}
            onSelect={setActiveId}
            onAdd={addBoard}
            addLabel="New canvas"
            menuLabel="Canvas options"
            pageMenuItems={pageMenuItems}
            headerActions={[
              {
                id: 'left',
                label: leftOpen ? 'Hide the canvases panel' : 'Show the canvases panel',
                icon: leftOpen ? PanelLeftClose : PanelLeftOpen,
                onClick: () => setLeftOpen((v) => !v),
              },
              {
                id: 'right',
                label: rightOpen ? 'Hide the inspector' : 'Show the inspector',
                icon: rightOpen ? PanelRightClose : PanelRightOpen,
                onClick: () => setRightOpen((v) => !v),
              },
            ]}
            className="h-full"
          />
        ),
      },

      // ── Right: what the active canvas is. Read from the board list above. ───
      rightSection: rightOpen
        ? {
            defaultSize: '280px',
            minSize: '240px',
            maxSize: '380px',
            collapsible: true,
            content: (
              <TabbedPanel
                className="border-0"
                tabs={[
                  {
                    value: 'canvas',
                    label: 'Canvas',
                    icon: SlidersHorizontal,
                    content: (
                      <ScrollArea className="h-full">
                        <div className="flex flex-col gap-4 p-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" size="xs">
                                board
                              </Badge>
                              <span className="truncate font-semibold">{activeBoard.title}</span>
                            </div>
                            <p className="text-meta text-muted-foreground">
                              {activeTemplate.about}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-meta text-muted-foreground">Graph</p>
                            <PropertyList>
                              <PropertyRow label="nodes">
                                {activeTemplate.data.nodes.length}
                              </PropertyRow>
                              <PropertyRow label="edges">
                                {activeTemplate.data.edges.length}
                              </PropertyRow>
                              <PropertyRow label="template">{activeTemplate.title}</PropertyRow>
                            </PropertyList>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-meta text-muted-foreground">Engine</p>
                            <PropertyList>
                              <PropertyRow label="layout" mono>
                                graph-force
                              </PropertyRow>
                              <PropertyRow label="force">{activeTemplate.force}</PropertyRow>
                              <PropertyRow label="mounted">
                                {boards.length} engines
                              </PropertyRow>
                            </PropertyList>
                          </div>
                          <p className="text-meta text-muted-foreground">
                            Every board stays mounted (`keepMounted`), so switching a tab is
                            pure visibility — the camera you left is the camera you return to.
                          </p>
                        </div>
                      </ScrollArea>
                    ),
                  },
                ]}
                headerActions={[
                  {
                    key: 'close',
                    name: 'Collapse panel',
                    icon: PanelRightClose,
                    onClick: () => setRightOpen(false),
                  },
                ]}
              />
            ),
          }
        : undefined,

      // ── Footer: a plain status bar for the active board. ───────────────────
      footer: {
        className: '!h-[30px]',
        left: (
          <div className="flex items-center gap-3 px-2 text-meta text-muted-foreground">
            <span className="flex items-center gap-2">
              <StatusDot tone="success" />
              <span className="text-success">LIVE</span>
            </span>
            <span>•</span>
            <span className="truncate">{activeBoard.title}</span>
          </div>
        ),
        right: (
          <div className="flex items-center gap-3 px-2 text-meta text-muted-foreground">
            <span className="tabular-nums">
              {activeTemplate.data.nodes.length} nodes · {activeTemplate.data.edges.length} edges
            </span>
            <span className="hidden tabular-nums sm:inline">{activeTemplate.force}</span>
          </div>
        ),
      },

      // Header 40px + footer 30px.
      mainClassName: 'h-[calc(100vh-70px)]',
    };

    return (
      <ThemeProvider defaultTheme="default" defaultMode="dark" storageKey={null}>
        <AppLayoutV2 {...layout} />
      </ThemeProvider>
    );
  },
};
