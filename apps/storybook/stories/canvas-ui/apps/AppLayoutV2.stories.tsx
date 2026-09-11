/**
 * **The Explorer shell around a stack of canvases** — `AppLayoutV2` (the
 * design-kit's app shell: header · rail · left panel · main · right inspector ·
 * status bar) with a `<CanvasPagesViewPanel>` filling its **main** region. The
 * boards read like sheets in a spreadsheet: one tab strip across the top of the
 * main area, the page bodies underneath it.
 *
 * **One view, one instance.** `CanvasPagesViewPanel` renders its strip and its
 * body as a single column, so the main section mounts it once and gets both —
 * the tabs (with `onAdd`, the per-page caret menu and a `headerActions` gear that
 * opens the inspector on its Settings tab) and, below them, one
 * `<GraphCanvasApp>` per board with
 * `showHeader={false}`, because the chrome around it is the shell, not the app's
 * own rail. The footer stays a plain status bar.
 *
 * **State survives a tab switch.** The panel keeps `keepMounted` (its default):
 * every board stays mounted and the inactive ones are hidden, not destroyed —
 * pan/zoom one board, switch away and back, and its camera, layout and selection
 * are exactly where you left them. Each board is its own engine, sharing nothing
 * but the host `<ThemeProvider>`. **Remove** tears one down.
 *
 * **The right inspector is the active board's, nine panels deep** — closed until
 * the strip's **gear** opens it on Settings — what the board
 * is · its live **settings** (`CanvasSettingsEditorPanel`) · per-type **styling**
 * (`StylingViewPanel`) · its **layers** (`LayersViewPanel`) · its saved
 * **snapshots** (`CanvasSnapshotsViewPanel`) · **find** (`FindInCanvasViewPanel`,
 * a locate) · its live **selection** (`SelectionViewPanel`, read off the kernel
 * store) · the selected **element** in detail (`ElementInspectorViewPanel`,
 * read-only, revealed automatically when you click a node or an edge) · its
 * parked **filters** (`CanvasFiltersViewPanel`, a hide). The shell is *outside* every board's canvas
 * context, so each board publishes its engine up through `onReady` and the panels
 * take it as an explicit `canvas` prop — switch tabs in the main strip and all
 * eight engine-bound panels follow the new board. Styling and snapshots are values the **host** owns
 * (Invana persists them), so the shell keeps one per board — and for snapshots that
 * makes this the **controlled** side of `CanvasSnapshotsViewPanel`: the shell passes
 * `snapshots` and applies the panel's create / update / delete events, while the
 * panel does the engine work (capture, restore, messages). Boards start with no
 * history; take a snapshot and it lands under that board alone.
 *
 * **Every board carries a minimap** — a `MiniMapLayer` mounted *inside* each
 * `<GraphCanvasApp>` (bottom-right, mirroring that board's `graph` layer, its
 * backdrop borrowed from the board's `background` layer so it survives a theme
 * flip). The header's map button mounts / unmounts it on every board at once,
 * and because it is a real layer it appears in the inspector's **Layers** tab
 * with an eye of its own.
 *
 * **Right-click anything for its menu** — a `<GraphContextMenu>` (nodes *and*
 * edges) plus a `<GraphBackgroundContextMenu>` for the empty canvas, both
 * mounted inside each board, so the menu belongs to the board you clicked, not
 * the shell. Nodes and edges get the standard items — **Focus** · **Select** ·
 * **Hide** — and this story appends an **Inspect** item through `nodeItems` /
 * `edgeItems`, which receive `(ctx, defaults)` and return the final list. The
 * background menu carries the board-wide controls: a **Selection** submenu
 * (click · brush · lasso, the armed one accented), **Lock view** (pan + node
 * drag off, zoom left alone), **Fit to view**, and **Show all hidden** — the
 * same restore the inspector's Filters tab performs. The first two read the
 * live behaviours and write through `canvas.update`, so they and the header
 * toolbar's own pickers are two views of one state, not two copies.
 *
 * **The explorer bar lives in the shell header, not the pages** — one
 * `<GraphControlsToolbarLite>` (layout · zoom / fit / lock · select-mode · grid)
 * pinned to the header's true centre — the nav centres its middle section in
 * what the left and right sections leave over, so the bar is absolutely
 * positioned against a `relative` header instead — driving whichever board is
 * active. It resolves its
 * engine from context, and the shell sits outside every board, so the story
 * re-provides `activeCanvas` on `CanvasContext` + `GraphCanvasContext` around
 * it — the mirror image of the inspector panels, which take `canvas` as a prop.
 * Its **Run** applies the toolbar's own d3-force; each board's tuned
 * `graph-force` stays where it was, in the inspector's Settings tab.
 *
 * **The footer is the active board's readout** — node / edge counts and the force
 * settings it runs, read from this story's own board list. Nothing there is
 * mocked; per-frame numbers (fps, zoom) would have to come from the engine, which
 * lives *inside* a board and can't be reached from the shell footer.
 */

import { useEffect, useMemo, useRef, useState, type ElementType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { CanvasConfig } from '@invana/canvas';
import { CanvasContext, ClickInspectBehaviour, GraphCanvasContext, MiniMapLayer } from '@invana/canvas-react';
import type {
  ClickInspectBehaviour as ClickInspectBehaviourClass,
  GraphCanvas,
  GraphData,
  GraphLayer,
  GraphNode,
} from '@invana/graph';
import {
  CanvasFiltersViewPanel,
  CanvasPagesViewPanel,
  CanvasSettingsEditorPanel,
  CanvasSnapshotsViewPanel,
  FindInCanvasViewPanel,
  ElementInspectorViewPanel,
  GraphBackgroundContextMenu,
  GraphCanvasApp,
  GraphContextMenu,
  GraphControlsToolbarLite,
  LayersViewPanel,
  SelectionViewPanel,
  StylingViewPanel,
  type CanvasPage,
  type CanvasPageMenuItem,
  type CanvasSnapshot,
  type TypeStylingPatch,
} from '@invana/canvas-ui';
import {
  AppLayoutV2,
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
  Eye,
  Filter,
  GitBranch,
  History,
  Info,
  Lasso,
  Layers,
  Lock,
  LockOpen,
  Map as MapIcon,
  Maximize2,
  MousePointer2,
  MousePointerClick,
  Network,
  Paintbrush,
  Palette,
  PanelLeftClose,
  PanelRightClose,
  Pencil,
  Plus,
  ScanSearch,
  Search,
  Settings,
  SlidersHorizontal,
  SquareDashedMousePointer,
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
    // The inspector starts **closed** — the canvas gets the full width until the
    // strip's gear (or the rail's Inspector item) asks for it.
    const [rightOpen, setRightOpen] = useState(false);
    const [rightTab, setRightTab] = useState('canvas');
    // Shell-wide, like the side panels: every board gets a minimap or none does.
    const [minimapOn, setMinimapOn] = useState(true);
    const nextBoardId = useRef(2);

    // The live engine per board. The inspector panels sit *outside* every
    // `<GraphCanvasApp>`'s context (they're in the shell's right section), so
    // each one is handed its canvas explicitly rather than resolving a provider.
    const [canvases, setCanvases] = useState<Record<string, GraphCanvas | null>>({});

    // One **stable** `onReady` per board: the app's ready bridge re-runs its
    // effect whenever the callback identity changes, so a fresh arrow per render
    // would republish the engine on every render.
    const readyHandlers = useRef(new Map<string, (canvas: GraphCanvas | null) => void>());
    const onReadyFor = (id: string): ((canvas: GraphCanvas | null) => void) => {
      let handler = readyHandlers.current.get(id);
      if (!handler) {
        handler = (canvas) => setCanvases((all) => ({ ...all, [id]: canvas }));
        readyHandlers.current.set(id, handler);
      }
      return handler;
    };

    // Per-type styling is a *persisted* value the host owns — one patch per
    // board, which `StylingViewPanel` both edits and paints onto that board.
    const [styling, setStyling] = useState<Record<string, TypeStylingPatch>>({});

    // …and so are the saved snapshots — one list per board, which is why this
    // shell drives the panel in **controlled** mode: it passes `snapshots` and
    // applies the panel's create / update / delete events itself. (The standalone
    // panel story shows the other mode, where the panel owns its own list.) The
    // engine work — capture, restore, messages — is the panel's either way.
    //
    // Every board starts with no history: a snapshot is something you take, and
    // seeded rows carry no document, so they could only ever refuse to restore.
    const [activeSnapshot, setActiveSnapshot] = useState<Record<string, string | null>>({});
    const [snapshots, setSnapshots] = useState<Record<string, CanvasSnapshot[]>>({});

    // Stable empties — a fresh `{}` / `[]` per render would churn the panels' memos.
    const noStyling = useMemo<TypeStylingPatch>(() => ({}), []);
    const noSnapshots = useMemo<CanvasSnapshot[]>(() => [], []);

    const activeBoard = boards.find((b) => b.id === activeId) ?? boards[0]!;
    const activeTemplate = templates[activeBoard.templateIndex]!;
    const activeCanvas = canvases[activeBoard.id] ?? null;

    // **Controlled mode.** Unlike the standalone panel story (which lets the panel
    // own its list), this shell keeps one list *per board* — the shape a server
    // has — so it passes `snapshots` and applies the panel's events itself. The
    // panel still does all the engine work: capture, restore, messages.
    //
    // Everything lands under `activeBoard.id`, so one board's history can never
    // reach another's.
    const onCreateSnapshot = (snapshot: CanvasSnapshot): void => {
      setSnapshots((all) => ({
        ...all,
        [activeBoard.id]: [{ ...snapshot, by: 'you' }, ...(all[activeBoard.id] ?? [])],
      }));
      setActiveSnapshot((all) => ({ ...all, [activeBoard.id]: snapshot.id }));
    };

    const onUpdateSnapshot = (snapshot: CanvasSnapshot): void => {
      setSnapshots((all) => ({
        ...all,
        [activeBoard.id]: (all[activeBoard.id] ?? []).map((v) => (v.id === snapshot.id ? snapshot : v)),
      }));
    };

    const onDeleteSnapshot = (id: string): void => {
      setSnapshots((all) => ({
        ...all,
        [activeBoard.id]: (all[activeBoard.id] ?? []).filter((v) => v.id !== id),
      }));
      // Deleting the highlighted row leaves nothing loaded to point at.
      setActiveSnapshot((all) => (all[activeBoard.id] === id ? { ...all, [activeBoard.id]: null } : all));
    };

    /** Which snapshot is loaded, per board — the one row the panel highlights. */
    const onRestoreSnapshot = (snapshot: CanvasSnapshot): void => {
      setActiveSnapshot((all) => ({ ...all, [activeBoard.id]: snapshot.id }));
    };

    // The canvas strip's one action: open the inspector on the active board's
    // settings. Activity-bar behaviour — clicking it again while that tab is
    // showing puts the panel away, so the button is never a no-op. Both side
    // panels stay reachable from the rail (Canvases / Inspector), and each keeps
    // its own collapse action.
    const openSettings = (): void => {
      if (rightOpen && rightTab === 'settings') {
        setRightOpen(false);
        return;
      }
      setRightTab('settings');
      setRightOpen(true);
    };

    // Clicking a node or an edge **reveals** the inspector on its Element tab.
    // The trigger is `ClickInspectBehaviour` — the same source the panel reads —
    // so the rail opens for exactly the elements the panel can show, and a
    // background click (which clears the target) never opens it.
    //
    // Only a null → element transition opens the rail. Firing on every change
    // would re-open a rail the user just closed while an element stayed clicked.
    //
    // Re-attaches on `scene:behaviour:register`: the behaviour is a child of the
    // board's `<GraphCanvasApp>` while this shell learns of the engine through
    // `onReady`, so on a first mount the behaviour may not exist yet. A one-shot
    // lookup would silently never arm.
    useEffect(() => {
      if (!activeCanvas) return;
      let off: (() => void) | undefined;
      const attach = (): void => {
        const behaviour = activeCanvas.behaviours.get<ClickInspectBehaviourClass>('click-inspect');
        if (!behaviour) return;
        off?.();
        let had = behaviour.getTarget() != null;
        off = behaviour.events.on('inspect:change', (target) => {
          const has = target != null;
          if (has && !had) {
            setRightTab('element');
            setRightOpen(true);
          }
          had = has;
        });
      };
      attach();
      const offRegister = activeCanvas.events.on('scene:behaviour:register', (e: { id: string }) => {
        if (e.id === 'click-inspect') attach();
      });
      return () => {
        off?.();
        offRegister();
      };
    }, [activeCanvas]);

    // Nine panels share one header, so a tab spells its name only while it is
    // the active one; the rest stay icon-only. `label` is dropped rather than
    // hidden, because an `sr-only` node would travel into the `…` overflow menu
    // and render clipped there — `name` is the plain-text form the menu and the
    // tooltip both fall back to. See
    // rfc:fix-2026-09-11-folded-tabs-have-no-label-in-the-overflow-menu.
    const tab = (value: string, text: string) => ({
      value,
      name: text,
      label: rightTab === value ? text : undefined,
    });

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
          onReady={onReadyFor(b.id)}
        >
          {/* Right-click a node or an edge → the standard menu (Focus · Select ·
              Hide), plus this story's own "Inspect" item. It is an in-canvas
              child like the minimap, so each board gets its own menu bound to
              its own engine; it mounts its own `ContextMenuBehaviour` and
              resolves the bundle's `graph` layer + `click-select` behaviour by
              their default ids. `nodeItems` / `edgeItems` receive
              `(ctx, defaults)` — spread `defaults` to keep the standard set. */}
          {/* The inspector shows the element you CLICKED, not the selection —
              so it needs this behaviour, which tracks exactly one element and
              clears on a background click. Not in any default bundle (rule 7:
              behaviours never auto-enable), so each board mounts its own. */}
          <ClickInspectBehaviour targetLayerId="graph" />

          <GraphContextMenu
            nodeItems={(ctx, defaults) => [
              ...defaults,
              {
                id: 'inspect',
                label: `Inspect ${ctx.id}`,
                icon: Info,
                onClick: () => console.log('node', ctx.id, ctx.data),
              },
            ]}
            edgeItems={(ctx, defaults) => [
              ...defaults,
              {
                id: 'inspect',
                label: `Inspect ${ctx.id}`,
                icon: Info,
                onClick: () => console.log('edge', ctx.id, ctx.data),
              },
            ]}
          />

          {/* The empty-canvas menu is a separate behaviour scoped to the
              background target, so it composes with the node/edge one above.
              Board-wide actions live here: frame the graph, and bring back
              anything the node/edge menu's Hide parked (the same restore the
              inspector's Filters tab performs). */}
          <GraphBackgroundContextMenu
            items={({ canvas: board }) => {
              // The builder runs on every right-click, so reading the live
              // behaviour instances is the current state — no subscription, and
              // no hook (a menu item is a callback, not a component). Read the
              // instance rather than the store definition, because a direct
              // `behaviour.disable()` (what `useLock` behind the toolbar's lock
              // button does) flips the instance without writing the definition;
              // the instance is true under both paths. Writes still go through
              // `canvas.update`, so the definition — and every editor reading
              // it — stays in step.
              const on = (id: string): boolean => board.behaviours.get(id)?.enabled ?? false;

              // Select mode is mutually exclusive and derived, not stored: the
              // armed drag-select behaviour *is* the mode, and plain click is
              // "neither armed" (`click-select` stays on underneath all three).
              const mode = on('brush-select') ? 'brush' : on('lasso-select') ? 'lasso' : 'click';
              const setMode = (next: string): void =>
                board.update({
                  behaviours: {
                    'brush-select': { enabled: next === 'brush' },
                    'lasso-select': { enabled: next === 'lasso' },
                  },
                });
              const modes: { key: string; label: string; icon: ElementType }[] = [
                { key: 'click', label: 'Click select', icon: MousePointer2 },
                { key: 'brush', label: 'Brush select', icon: SquareDashedMousePointer },
                { key: 'lasso', label: 'Lasso select', icon: Lasso },
              ];

              // Lock is app policy, not an engine concept: pan + node drag off,
              // zoom left alone — the same pair `useLock` (and so the header
              // toolbar's lock button) manages.
              const locked = !on('pan');
              const setLocked = (next: boolean): void =>
                board.update({
                  behaviours: { pan: { enabled: !next }, 'drag-node': { enabled: !next } },
                });

              return [
                {
                  id: 'select-mode',
                  label: 'Selection',
                  icon: MousePointer2,
                  children: modes.map((m) => ({
                    id: `select-${m.key}`,
                    label: m.label,
                    icon: m.icon,
                    // MenuItem has no checked state, so the armed mode is marked
                    // with the accent token rather than a tick.
                    className: m.key === mode ? 'text-primary' : undefined,
                    onClick: () => setMode(m.key),
                  })),
                },
                {
                  id: 'lock',
                  label: locked ? 'Unlock view' : 'Lock view',
                  icon: locked ? Lock : LockOpen,
                  onClick: () => setLocked(!locked),
                },
                {
                  id: 'fit',
                  label: 'Fit to view',
                  icon: Maximize2,
                  onClick: () => board.fitView(),
                },
                {
                  id: 'show-all',
                  label: 'Show all hidden',
                  icon: Eye,
                  onClick: () => board.layers.get<GraphLayer>('graph')?.showAllHidden(),
                },
              ];
            }}
          />

          {/* The minimap is an in-canvas **layer**, not shell chrome — so it
              mounts inside each board, mirrors that board's `graph` layer, and
              shows up in the inspector's Layers tab with its own eye. Mount /
              unmount is the show/hide (the wrapper has no `visible` prop), and
              `backgroundLayerId` keeps its backdrop on the canvas background
              through a theme flip instead of pinning a second colour here. */}
          {minimapOn && (
            <MiniMapLayer
              id="minimap"
              graphLayerId="graph"
              backgroundLayerId="background"
              position="bottom-right"
              width={180}
              height={120}
              margin={12}
              borderColor={0x94a3b8}
              padding={30}
            />
          )}
        </GraphCanvasApp>
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
        // `relative` so the explorer bar below can pin itself to the header's
        // true centre. `NavHorizontal` lays its three sections out in flow —
        // the centre one is `flex-1 justify-center`, i.e. centred in whatever
        // the left and right sections leave over — so with a wordmark + a
        // three-level breadcrumb on the left the bar would sit right of centre.
        className: 'relative',
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
        // The explorer bar belongs to the **shell**, not to a page — one bar in
        // the app header driving whichever board is active, the way the theme
        // control and the canvas count already do. The shell renders outside
        // every `<GraphCanvasApp>`, so the story re-provides the active board's
        // engine on the two contexts the toolbar resolves through:
        // `GraphCanvasContext` (the toolbar itself) and `CanvasContext` (the
        // section hooks, via `useResolvedCanvas`). Both throw on a null engine,
        // hence the gate until the first board is ready. `key` remounts the bar
        // per board so one board's select-mode / grid toggle never bleeds into
        // the next. Lite = the read-only explorer set (layout · zoom/fit/lock ·
        // select-mode · grid); the full variant adds undo/erase, which belongs
        // to an editor, not an explorer.
        center: activeCanvas ? (
          <div className="absolute left-1/2 -translate-x-1/2">
            <CanvasContext.Provider value={activeCanvas}>
              <GraphCanvasContext.Provider value={activeCanvas}>
                <GraphControlsToolbarLite key={activeBoard.id} />
              </GraphCanvasContext.Provider>
            </CanvasContext.Provider>
          </div>
        ) : null,
        right: (
          <div className="flex items-center gap-1 px-2">
            <span className="text-meta text-muted-foreground tabular-nums">
              {boards.length} {boards.length === 1 ? 'canvas' : 'canvases'}
            </span>
            <Button variant="ghost" size="xs" onClick={addBoard}>
              <Plus /> New canvas
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title={minimapOn ? 'Hide the minimap' : 'Show the minimap'}
              aria-pressed={minimapOn}
              className={minimapOn ? 'text-primary' : undefined}
              onClick={() => setMinimapOn((v) => !v)}
            >
              <MapIcon />
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
                id: 'settings',
                label: 'Canvas settings',
                icon: Settings,
                onClick: openSettings,
              },
            ]}
            className="h-full"
          />
        ),
      },

      // ── Right: the inspector over the **active board's live engine** ───────
      // Nine panels behind one header: what the board is (static, from the
      // board list), its live settings, per-type styling, the scene's layers,
      // its saved snapshots, a structured search, the live selection, the selected
      // element in detail, and its parked elements. The shell sits *outside* every
      // `<GraphCanvasApp>`'s context, so each engine-bound panel is handed
      // `activeCanvas` explicitly rather than resolving a provider — the shape
      // the panels are built for (`canvas` in, `null` until ready handled inside).
      rightSection: rightOpen
        ? {
            defaultSize: '400px',
            minSize: '340px',
            maxSize: '560px',
            collapsible: true,
            content: (
              <TabbedPanel
                className="border-0"
                bodyClassName="p-0"
                // The strip folds what doesn't fit into a `…` menu instead of
                // setting the panel's minimum width — nine icon-only tabs are
                // ~430px against a 340px `minSize`, which used to scroll the
                // whole section sideways. `keepMounted` keeps each panel's
                // scroll position (and the engine-bound ones' work) across tab
                // switches. See rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel.
                overflow
                keepMounted
                activeTab={rightTab}
                onTabChange={setRightTab}
                tabs={[
                  {
                    ...tab('canvas', 'Canvas'),
                    icon: Info,
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
                  {
                    // The whole definition of the active board — every live
                    // layer / behaviour / layout and its settings, applied
                    // through `canvas.update(...)` as you edit.
                    ...tab('settings', 'Settings'),
                    icon: Settings,
                    content: (
                      <CanvasSettingsEditorPanel
                        canvas={activeCanvas}
                        title={null}
                        className="rounded-none border-0"
                      />
                    ),
                  },
                  {
                    // Colour / label key / size per **type the board is
                    // painting**. Controlled: the shell holds the patch per
                    // board (Invana persists it), the panel paints it.
                    ...tab('styling', 'Styling'),
                    icon: Paintbrush,
                    content: (
                      <StylingViewPanel
                        canvas={activeCanvas}
                        value={styling[activeBoard.id] ?? noStyling}
                        onChange={(next) =>
                          setStyling((all) => ({ ...all, [activeBoard.id]: next }))
                        }
                      />
                    ),
                  },
                  {
                    // The board's scene as a file-tree — layer eyes, and the
                    // graph layer's nodes/edges grouped by type.
                    ...tab('layers', 'Layers'),
                    icon: Layers,
                    content: <LayersViewPanel canvas={activeCanvas} />,
                  },
                  {
                    // The board's history. Capture takes a real thumbnail off
                    // the live renderer; restore is the shell's to answer.
                    ...tab('snapshots', 'Snapshots'),
                    icon: History,
                    content: (
                      <CanvasSnapshotsViewPanel
                        canvas={activeCanvas}
                        snapshots={snapshots[activeBoard.id] ?? noSnapshots}
                        onCreateSnapshot={onCreateSnapshot}
                        onUpdateSnapshot={onUpdateSnapshot}
                        onDeleteSnapshot={onDeleteSnapshot}
                        onRestoreSnapshot={onRestoreSnapshot}
                        activeSnapshotId={activeSnapshot[activeBoard.id] ?? null}
                      />
                    ),
                  },
                  {
                    // Structured search over the board — AND-combined field
                    // filters; a result click frames *and* selects the element
                    // (a locate, never a hide — that's the Filters tab).
                    ...tab('find', 'Find'),
                    icon: Search,
                    content: <FindInCanvasViewPanel canvas={activeCanvas} />,
                  },
                  {
                    // What is selected on the board *right now* — read off the
                    // kernel store (`view.interaction.selection`), so a click, a
                    // brush and a lasso all land here. Row click frames an
                    // element, ✕ drops just it, Hide parks the lot (→ Filters).
                    ...tab('selection', 'Selection'),
                    icon: MousePointerClick,
                    content: <SelectionViewPanel canvas={activeCanvas} />,
                  },
                  {
                    // The **detail** half of the pair the Selection tab opens:
                    // one element at a time, read-only, with a "2 of 7" pager
                    // over the same selection. Clicking an element on the canvas
                    // reveals this tab (see the effect above).
                    ...tab('element', 'Element'),
                    icon: ScanSearch,
                    content: <ElementInspectorViewPanel canvas={activeCanvas} />,
                  },
                  {
                    // The elements parked out of the board — right-click → Hide
                    // on the canvas (or in Layers) lands them here.
                    ...tab('filters', 'Filters'),
                    icon: Filter,
                    content: <CanvasFiltersViewPanel canvas={activeCanvas} />,
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

    return <AppLayoutV2 {...layout} />;
  },
};
