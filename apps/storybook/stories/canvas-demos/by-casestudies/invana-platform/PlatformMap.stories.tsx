/**
 * **Invana platform map** — Invana in three layers, as one tree with the
 * **Invana platform at the centre**: the **product** layer (products → features
 * → stories, and the **Foundation** group — Inbox, Settings and Shell, what
 * every product uses — whose parts read *Foundation* on their card), the **system** layer (services → APIs, Studio packages,
 * integrations) and the **code** layer (engine modules, `core` and its parts).
 * Every node is a **composite card**; product cards carry *who they are for*
 * on their face.
 *
 * The data is `invanaPlatform` from `@invana/graph-datasets` — **generated**
 * from the invana repo's `specs/` and code by its `platform-map` skill, so the
 * picture is the specs and the code, never a copy kept by hand. The story owns
 * only the look.
 *
 * ### Tree edges place, cross edges explain
 *
 * Tree edges (`ships` · `offers` · `delivered by` · `runs` · `hosts` ·
 * `contains` · `has part`) give every card one parent: they place the cards and
 * drive expand. Cross edges (`calls` · `served by` · `depends on` · `uses` ·
 * `needs` · `built in`) point dependent → dependency and draw **dashed** —
 * with **Dependencies** on, and only when both ends show.
 *
 * ### Five cards
 *
 * | Type | Card |
 * |---|---|
 * | `platform` | The root: name, tagline, counts — and the **persona legend** |
 * | `product` | Code, name, summary, its feature and story counts, persona chips |
 * | `feature` | Code, name, **Access** (the grants its Access table names), persona chips |
 * | `story` | Code, name, persona chips — compact, because there are 160 of them |
 * | `service` · `group` · `api` · `module` · `package` · `integration` | One system card: kind, name, `sub`, `stats`, accent by type; an API no Studio package calls carries a **No Studio caller** tag |
 *
 * ### Blast radius
 *
 * Right-click a system or code card → **Show what depends on this**: every
 * node that reaches it backwards over the cross edges, taking at most one
 * `depends on` step, shows with its tree path and nothing else; it is
 * outlined and joined by the edges that carry it, the path fades, and the
 * message bar counts the dependents by type. One step, because the engine's imports are cyclic — a
 * transitive walk reaches nearly every module from any root. *Clear* returns
 * to what was open before.
 *
 * ### Persona chips are fixed slots, so they read as columns
 *
 * Each card draws **seven chip slots**, one per persona, in the order of the
 * specs' `personas.md` (`AN` analyst · `DM` decision maker · `MO` modeller ·
 * `CU` curator · `BU` agent builder · `OW` graph owner · `AD` install admin).
 * A slot draws only when the record carries `data.p.<persona>` — a freeform
 * element's `requires` — so the same persona always sits in the same place on
 * every card, and scanning a ring for "who builds agents?" is scanning one
 * column. The chip colours are the personas' identity, owned here, not by the
 * dataset.
 *
 * ### Colour follows the product
 *
 * `data.hue` is the product's 1-based slot in the theme's categorical ramp
 * (`ValueLookup.categorical`), inherited by its features and stories: the
 * accent bar, the code and the border of a whole subtree share one colour, and
 * that colour follows every theme.
 *
 * ### One step at a time — right-click to expand
 *
 * The map opens on the platform and its products only. **Right-click** a
 * product to *Expand* its features, a feature to *Expand* its stories, and
 * *Collapse* to fold a node back up with everything below it; *Expand only
 * this* opens a node and folds its siblings, so moving from one product to the
 * next is one click. Right-click the platform to *Collapse all*.
 *
 * The open set is story state (`expanded`); the graph handed to the app is the
 * dataset cut to what that set reveals, and each cut re-seeds the graph. An
 * open node carries the authored state `open` (a heavier border), so the open
 * path is visible at a glance.
 *
 * ### Radial positions are placed, not solved
 *
 * A radial solver re-plans the whole circle on every expand — open one product
 * and every other product slides round to make room. Here the story places the
 * radial view itself, so **a step never moves what was already there**:
 *
 * - the platform at the origin, ring 1 (the view's products, services and
 *   integrations group) at equal angles on a ring that grows with its count;
 * - an open node's children on an arc centred on the node's own angle, one
 *   ring further out, spaced by card size — the ring widens when a node has
 *   too many children to fit its span (90°, or 180° past twelve children).
 *
 * A composite node's `position` is its centre, so a placed point is the card's
 * centre. `activeLayout` is empty in the radial view (`fitOnLoad` frames each
 * cut); *Layered* hands the same cut to ELK.
 *
 * ### Header controls
 *
 * - **Layout** — *Radial* (placed, the platform at the centre) or *Layered*
 *   (`ElkLayout`, left to right). Edges switch to the matching `bump-radial` /
 *   `bump-horizontal` path.
 * - **Legend** (the side dock, open on load) — every node and edge type with a
 *   live count, a click to hide or show it (the layer's own switch, apart from
 *   View and expand), then the edge styles and the card states. System colours
 *   come from the same `ACCENT` map the cards use.
 * - **View** — which ring-1 nodes show: *Product* (the products and the
 *   Foundation group), *System*
 *   (the services and integrations) or *All*.
 * - **Persona** — fade every product-layer card not tagged for one persona, so
 *   its reach across the platform stands out.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphNodeContextMenu,
  GraphStatusBar,
  LegendViewPanel,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import {
  MiniMapLayer,
  type CardElement,
  type GraphCanvas,
  type GraphData,
  type NodeStructureRegistry,
  type NodeStylingRegistry,
  type NodeTypeRegistry,
  type TemplateColor,
  type ValueLookup
} from '@invana/graph';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { invanaPlatform } from '@invana/graph-datasets/usecase-demos';
import { Eyebrow, Legend, LegendItem, type MenuItem } from '@invana/ui';
import { ChevronsDownUp, ChevronsUpDown, Focus, List, Map, Moon, Settings, Sun, Waypoints, X, Zap } from 'lucide-react';

const meta: Meta = { title: 'canvas-demos/by-casestudies/invana-platform/PlatformMap' };
export default meta;
type Story = StoryObj;

export const PlatformMapStory: Story = {
  name: 'PlatformMap',
  render: function Render() {
    /** The personas, in the order of the specs' `personas.md` — the chip slot order. */
    const PERSONAS = [
      { key: 'analyst', code: 'AN', name: 'Analyst', color: 0x3b82f6 },
      { key: 'decision-maker', code: 'DM', name: 'Decision maker', color: 0x8b5cf6 },
      { key: 'modeller', code: 'MO', name: 'Modeller', color: 0x10b981 },
      { key: 'curator', code: 'CU', name: 'Data curator', color: 0x0891b2 },
      { key: 'builder', code: 'BU', name: 'Agent builder', color: 0xd97706 },
      { key: 'owner', code: 'OW', name: 'Graph owner', color: 0xdc2626 },
      { key: 'admin', code: 'AD', name: 'Install admin', color: 0x475569 }
    ] as const;
    type LayoutId = 'radial' | 'layered';
    type ViewId = 'product' | 'system' | 'all';
    /** Tree edges place the cards and expand; every other edge is a cross edge. */
    const TREE = new Set(['ships', 'offers', 'delivered by', 'runs', 'hosts', 'contains', 'has part']);
    /** What a node is called, one and many, by its type. */
    const NOUN: Record<string, [string, string]> = {
      product: ['product', 'products'],
      feature: ['feature', 'features'],
      story: ['story', 'stories'],
      service: ['service', 'services'],
      group: ['group', 'groups'],
      api: ['API', 'APIs'],
      module: ['module', 'modules'],
      package: ['package', 'packages'],
      integration: ['integration', 'integrations']
    };

    const [layout, setLayout] = useState<LayoutId>('radial');
    // Which ring-1 nodes show: the products, the services and integrations, or both.
    const [view, setView] = useState<ViewId>('product');
    // The nodes whose children are showing. The platform is always open.
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
    // Blast radius: a node and everything that depends on it.
    const [impact, setImpact] = useState<{ root: string; ids: ReadonlySet<string> } | null>(null);
    const [persona, setPersona] = useState<string>('all');
    // Cross edges between the cards that show — off by default, since a few
    // open groups draw hundreds. Blast radius draws its own regardless.
    const [deps, setDeps] = useState(false);
    const [minimapOn, setMinimapOn] = useState(true);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

    /**
     * A system or code card's accent, by its type — fixed hues that read in
     * light and dark alike. The cards and the legend both read it, so they
     * cannot disagree.
     */
    const ACCENT: Record<string, number> = {
      service: 0x2563eb,
      group: 0x64748b,
      api: 0x7c3aed,
      module: 0x059669,
      package: 0xdb2777,
      integration: 0xea580c
    };
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

    const dock = useSidePanels(
      [
        {
          id: 'legend',
          icon: List,
          label: 'Legend',
          // Types: live counts, a click hides or shows a type. A product-layer
          // card takes its product's colour, so its type gets a neutral swatch.
          // Marks: the edges and the states the story draws.
          render: (c) => (
            <div className="flex flex-col gap-3 p-2">
              <Eyebrow>Types</Eyebrow>
              <LegendViewPanel
                canvas={c as GraphCanvas | null}
                colorForType={(type, kind) =>
                  kind === 'edge' ? undefined : ACCENT[type] !== undefined ? hex(ACCENT[type]) : hex(0x94a3b8)
                }
              />
              <Eyebrow>Edges</Eyebrow>
              <Legend orientation="column">
                <LegendItem kind="line" color={hex(0x94a3b8)} label="Tree — placement and expand" />
                <LegendItem kind="dashed" color={hex(0x94a3b8)} label="Dependency — with Dependencies on" />
                <LegendItem kind="dashed" color={hex(0xf97316)} label="Carries a blast radius" />
              </Legend>
              <Eyebrow>States</Eyebrow>
              <Legend orientation="column">
                <LegendItem kind="outline" color={hex(0x64748b)} label="Open — its children show" />
                <LegendItem kind="box" color={hex(0xdc2626)} label="Blast radius root" />
                <LegendItem kind="box" color={hex(0xf97316)} label="Depends on the root directly" />
                <LegendItem kind="box" color={hex(0xcbd5e1)} label="Faded — another persona, or outside the blast" />
                <LegendItem kind="box" color={hex(0xdc2626)} label="No Studio caller — an API Studio never calls" />
              </Legend>
            </div>
          )
        },
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (c) => <CanvasSettingsEditorPanel canvas={c} className="border-0 bg-transparent shadow-none" />
        }
      ],
      { defaultOpenId: 'legend', section: { defaultSize: '360px', maxSize: '460px' } }
    );

    // The tree as parent → children and child → parent, read once from the tree
    // edges; the cross edges as dependency → dependents, for blast radius.
    const tree = useMemo(() => {
      const children: Record<string, string[]> = {};
      const parent: Record<string, string> = {};
      const dependents: Record<string, { id: string; type: string }[]> = {};
      for (const e of invanaPlatform.edges) {
        if (TREE.has(e.type)) {
          (children[e.source] ??= []).push(e.target);
          parent[e.target] = e.source;
        } else {
          (dependents[e.target] ??= []).push({ id: e.source, type: e.type });
        }
      }
      const node: Record<string, { id: string; type: string; data: Record<string, unknown> }> = {};
      for (const n of invanaPlatform.nodes) node[n.id] = n as (typeof node)[string];
      return { children, parent, dependents, node };
      // TREE is a render-local constant.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const layerOf = (id: string) => tree.node[id]?.data.layer as string | undefined;
    const platformCounts = `${String(tree.node.invana?.data.counts ?? '')} · ${String(tree.node.invana?.data.system ?? '')}`;

    // The tree cut to what `expanded` and the view reveal: the platform, its
    // ring for the view, and the children of every open node whose own parent
    // is open. Personas fade the product layer only; blast radius fades all but
    // what depends on its root.
    const data: GraphData = useMemo(() => {
      const ids = new Set<string>(['invana']);
      if (impact) {
        // Blast radius shows only what it reaches and the tree path to each —
        // whatever is open and whatever the view.
        for (const id of impact.ids) {
          for (let n: string | undefined = id; n && !ids.has(n); n = tree.parent[n]) ids.add(n);
        }
      } else {
        const inView = (id: string) =>
          view === 'all' ? true : view === 'product' ? layerOf(id) === 'product' : layerOf(id) !== 'product';
        const reveal = (id: string) => {
          for (const child of tree.children[id] ?? []) {
            if (id === 'invana' && !inView(child)) continue;
            ids.add(child);
            if (expanded.has(child)) reveal(child);
          }
        };
        reveal('invana');
      }
      // Only the children that show take a place on their parent's arc.
      const shown = (id: string) => (tree.children[id] ?? []).filter((k) => ids.has(k));
      const ring1 = shown('invana');

      // Radial placement: ring 1 at equal angles on a ring that grows with its
      // count; an open node's children on an arc around its angle, one ring out
      // (see the header comment).
      const angle: Record<string, number> = {};
      const ring: Record<string, number> = { invana: 0 };
      const r1 = Math.max(700, (ring1.length * 380) / (2 * Math.PI));
      ring1.forEach((id, i) => {
        angle[id] = -Math.PI / 2 + (i * 2 * Math.PI) / ring1.length;
        ring[id] = r1;
      });
      // Per child type: the gap out from the parent and the arc length per card.
      const FAN: Record<string, { gap: number; step: number }> = { feature: { gap: 650, step: 340 }, story: { gap: 560, step: 260 } };
      const fan = (id: string) => {
        const kids = shown(id);
        if (kids.length === 0) return;
        const { gap, step } = FAN[tree.node[kids[0]!]?.type ?? ''] ?? { gap: 600, step: 320 };
        const span = kids.length > 12 ? Math.PI : Math.PI / 2;
        const r = Math.max((ring[id] ?? 0) + gap, (kids.length * step) / span);
        const first = (angle[id] ?? 0) - ((kids.length - 1) * step) / r / 2;
        kids.forEach((k, i) => {
          angle[k] = first + (i * step) / r;
          ring[k] = r;
          fan(k);
        });
      };
      for (const id of ring1) fan(id);
      const placed = (id: string) =>
        layout === 'radial'
          ? { position: { x: Math.round((ring[id] ?? 0) * Math.cos(angle[id] ?? 0)), y: Math.round((ring[id] ?? 0) * Math.sin(angle[id] ?? 0)) } }
          : {};

      const nodes = invanaPlatform.nodes
        .filter((n) => ids.has(n.id))
        .map((n) => {
          const d = n.data as { p?: Record<string, number>; layer?: string };
          const states = [
            ...(persona !== 'all' && d.layer === 'product' && !d.p?.[persona] ? ['faded'] : []),
            ...(impact && n.type !== 'platform' && !impact.ids.has(n.id) ? ['faded'] : []),
            ...(impact?.root === n.id ? ['impactRoot'] : impact?.ids.has(n.id) ? ['impact'] : []),
            ...(n.type !== 'platform' && expanded.has(n.id) ? ['open'] : [])
          ];
          return { ...n, ...placed(n.id), ...(states.length ? { states } : {}) };
        });
      // Each tree edge names its level as an authored state, so the template's
      // `edge.state` overlays below can weight the trunk over the twigs. A cross
      // edge is `cross` — or, under blast radius, only the edges that carry it.
      const level: Record<string, string> = { ships: 'trunk', runs: 'trunk', offers: 'branch', hosts: 'branch' };
      const edges = invanaPlatform.edges
        .filter((e) => ids.has(e.source) && ids.has(e.target))
        .filter((e) => TREE.has(e.type) || (impact ? impact.ids.has(e.source) && impact.ids.has(e.target) : deps))
        .map((e) => ({
          ...e,
          states: [TREE.has(e.type) ? (e.source === 'invana' ? 'trunk' : e.source === 'foundation' ? 'branch' : (level[e.type] ?? 'twig')) : impact ? 'impactEdge' : 'cross']
        }));
      return { nodes, edges };
      // `layerOf` reads the memoised `tree`.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tree, expanded, persona, layout, view, impact, deps]);

    /**
     * What depends on `root` **directly**: the cross edges walked backwards,
     * taking at most one `depends on` step. The engine's imports are cyclic, so
     * a transitive walk over them reaches nearly every module from any root.
     */
    const showImpact = (root: string) => {
      // The fewest `depends on` steps each node was reached by.
      const steps: Record<string, number> = { [root]: 0 };
      const queue = [root];
      while (queue.length) {
        const cur = queue.shift()!;
        for (const d of tree.dependents[cur] ?? []) {
          const n = steps[cur]! + (d.type === 'depends on' ? 1 : 0);
          if (n > 1 || (steps[d.id] ?? Infinity) <= n) continue;
          steps[d.id] = n;
          queue.push(d.id);
        }
      }
      const ids = new Set(Object.keys(steps));
      // The cut shows these and their tree paths; `expanded` and the view stay
      // as they were, so *Clear* returns to them.
      setImpact({ root, ids });
      const count: Record<string, number> = {};
      for (const id of ids) if (id !== root) count[tree.node[id]?.type ?? ''] = (count[tree.node[id]?.type ?? ''] ?? 0) + 1;
      const parts = Object.entries(count).map(([t, n]) => `${n} ${NOUN[t]?.[n === 1 ? 0 : 1] ?? t}`);
      canvas?.showMessage(
        `${String(tree.node[root]?.data.name ?? root)} — ${parts.length ? `${parts.join(' · ')} depend on it directly` : 'nothing depends on it'}`
      );
    };

    const config: CanvasConfig = useMemo(() => {
      // The product's colour, from the theme's categorical ramp.
      const hue: ValueLookup<TemplateColor> = { bind: 'data.hue', categorical: true };

      // A freeform `text` element's `y` sits one font size above the glyph's
      // top (the compiler adds `fontSize` to reach the baseline), so every
      // text `y` below is *wanted top − fontSize*.

      /** Seven fixed persona chip slots — each draws only where its persona is tagged. */
      const chips = (x: number, y: number, w: number, h: number, gap: number, fontSize: number): CardElement[] =>
        PERSONAS.flatMap((p, i) => {
          const cx = x + i * (w + gap);
          return [
            { id: `chip-${p.key}`, type: 'rect', x: cx, y, width: w, height: h, cornerRadius: h / 2, fill: p.color, requires: `data.p.${p.key}` },
            {
              id: `chip-${p.key}-code`,
              type: 'text',
              x: cx + w / 2,
              y: y + (h - fontSize) / 2 - fontSize,
              text: p.code,
              anchor: 'center',
              fontSize,
              fontWeight: 700,
              color: 0xffffff,
              requires: `data.p.${p.key}`
            }
          ] satisfies CardElement[];
        });

      /** The left accent bar in the product's colour. */
      const bar = (h: number, r: number): CardElement => ({ id: 'bar', type: 'rect', x: 0, y: r, width: 4, height: h - 2 * r, fillLookup: hue });

      const PLATFORM = { w: 400, h: 248, pad: 20 };
      const PRODUCT = { w: 320, h: 176, pad: 16 };
      const FEATURE = { w: 300, h: 168, pad: 14 };
      const STORY = { w: 240, h: 94, pad: 12 };
      const SYSTEM = { w: 280, h: 124, pad: 14 };
      // A system or code card's accent, by its type (`ACCENT`).
      const accent: ValueLookup<TemplateColor> = { bind: 'type', map: ACCENT };

      const structures: NodeStructureRegistry = {
        platformCard: {
          name: 'platformCard',
          kind: 'freeform',
          width: PLATFORM.w,
          height: PLATFORM.h,
          cornerRadius: 18,
          bgRole: 'cardBg',
          strokeRole: 'accent',
          strokeWidth: 3,
          elements: [
            { id: 'kind', type: 'text', x: PLATFORM.pad, y: 4, text: 'Platform', fontSize: 10, fontWeight: 600, uppercase: true, colorRole: 'muted' },
            { id: 'name', type: 'text', x: PLATFORM.pad, y: 0, bind: 'data.name', fontSize: 30, fontWeight: 800, colorRole: 'heading' },
            { id: 'summary', type: 'text', x: PLATFORM.pad, y: 58, bind: 'data.summary', fontSize: 12, lineHeight: 16, maxWidth: PLATFORM.w - 2 * PLATFORM.pad, maxLines: 2, colorRole: 'foreground' },
            { id: 'counts', type: 'text', x: PLATFORM.pad, y: 100, bind: 'data.counts', fontSize: 12, fontWeight: 700, colorRole: 'accent' },
            { id: 'divider', type: 'line', x: PLATFORM.pad, y: 132, x2: PLATFORM.w - PLATFORM.pad, y2: 132, colorRole: 'divider' },
            { id: 'legend-title', type: 'text', x: PLATFORM.pad, y: 131, text: 'Personas', fontSize: 9, fontWeight: 600, uppercase: true, colorRole: 'muted' },
            // The legend: the seven chips, each beside its persona's name.
            ...PERSONAS.flatMap((p, i) => {
              const x = PLATFORM.pad + (i % 2) * 180;
              const y = 158 + Math.floor(i / 2) * 20;
              return [
                { id: `legend-${p.key}`, type: 'rect', x, y, width: 28, height: 15, cornerRadius: 7.5, fill: p.color },
                { id: `legend-${p.key}-code`, type: 'text', x: x + 14, y: y + 3 - 9, text: p.code, anchor: 'center', fontSize: 9, fontWeight: 700, color: 0xffffff },
                { id: `legend-${p.key}-name`, type: 'text', x: x + 36, y: y + 2 - 11, text: p.name, fontSize: 11, colorRole: 'foreground' }
              ] satisfies CardElement[];
            })
          ]
        },
        productCard: {
          name: 'productCard',
          kind: 'freeform',
          width: PRODUCT.w,
          height: PRODUCT.h,
          cornerRadius: 14,
          bgRole: 'cardBg',
          strokeLookup: hue,
          strokeWidth: 2.5,
          elements: [
            bar(PRODUCT.h, 14),
            { id: 'code', type: 'text', x: PRODUCT.pad, y: 2, text: '{data.kind} · {data.code}', fontSize: 10, fontWeight: 700, uppercase: true, colorLookup: hue },
            { id: 'status', type: 'text', x: PRODUCT.w - PRODUCT.pad, y: 2, bind: 'data.status', anchor: 'right', fontSize: 10, fontVariant: 'small-caps', colorRole: 'muted' },
            { id: 'name', type: 'text', x: PRODUCT.pad, y: 10, bind: 'data.name', fontSize: 20, fontWeight: 800, colorRole: 'heading', maxWidth: PRODUCT.w - 2 * PRODUCT.pad },
            { id: 'summary', type: 'text', x: PRODUCT.pad, y: 50, bind: 'data.summary', fontSize: 11, lineHeight: 15, maxWidth: PRODUCT.w - 2 * PRODUCT.pad, maxLines: 3, colorRole: 'muted' },
            { id: 'counts', type: 'text', x: PRODUCT.pad, y: 103, bind: 'data.counts', fontSize: 11, fontWeight: 600, colorRole: 'foreground' },
            ...chips(PRODUCT.pad, 140, 36, 18, 4, 10)
          ]
        },
        featureCard: {
          name: 'featureCard',
          kind: 'freeform',
          width: FEATURE.w,
          height: FEATURE.h,
          cornerRadius: 12,
          bgRole: 'cardBg',
          strokeLookup: hue,
          strokeWidth: 1.5,
          elements: [
            bar(FEATURE.h, 12),
            { id: 'code', type: 'text', x: FEATURE.pad, y: 2, bind: 'data.code', fontSize: 10, fontWeight: 700, colorLookup: hue },
            { id: 'stories', type: 'text', x: FEATURE.w - FEATURE.pad, y: 2, bind: 'data.stories', anchor: 'right', fontSize: 10, colorRole: 'muted' },
            { id: 'name', type: 'text', x: FEATURE.pad, y: 16, bind: 'data.name', fontSize: 14, fontWeight: 700, lineHeight: 18, maxWidth: FEATURE.w - 2 * FEATURE.pad, maxLines: 2, colorRole: 'heading' },
            { id: 'divider', type: 'line', x: FEATURE.pad, y: 72, x2: FEATURE.w - FEATURE.pad, y2: 72, colorRole: 'divider' },
            { id: 'access-title', type: 'text', x: FEATURE.pad, y: 73, text: 'Access', fontSize: 9, fontWeight: 600, uppercase: true, colorRole: 'muted' },
            { id: 'access', type: 'text', x: FEATURE.pad, y: 85, bind: 'data.access', fontSize: 11, lineHeight: 14, maxWidth: FEATURE.w - 2 * FEATURE.pad, maxLines: 2, colorRole: 'foreground' },
            ...chips(FEATURE.pad, 136, 34, 18, 4, 10)
          ]
        },
        storyCard: {
          name: 'storyCard',
          kind: 'freeform',
          width: STORY.w,
          height: STORY.h,
          cornerRadius: 10,
          bgRole: 'cardBg',
          strokeRole: 'stroke',
          strokeWidth: 1,
          elements: [
            bar(STORY.h, 10),
            { id: 'code', type: 'text', x: STORY.pad, y: 0, bind: 'data.code', fontSize: 10, fontWeight: 700, colorLookup: hue },
            { id: 'status', type: 'text', x: STORY.w - STORY.pad, y: 1, bind: 'data.status', anchor: 'right', fontSize: 9, fontVariant: 'small-caps', colorRole: 'muted' },
            { id: 'name', type: 'text', x: STORY.pad, y: 16, bind: 'data.name', fontSize: 12, fontWeight: 600, lineHeight: 15, maxWidth: STORY.w - 2 * STORY.pad, maxLines: 2, colorRole: 'heading' },
            ...chips(STORY.pad, 68, 28, 16, 3, 9)
          ]
        },
        // One card for the system and code layers: service · group · api ·
        // module · package · integration, told apart by the kind label and
        // the accent.
        systemCard: {
          name: 'systemCard',
          kind: 'freeform',
          width: SYSTEM.w,
          height: SYSTEM.h,
          cornerRadius: 12,
          bgRole: 'cardBg',
          strokeLookup: accent,
          strokeWidth: 1.5,
          elements: [
            { id: 'bar', type: 'rect', x: 0, y: 12, width: 4, height: SYSTEM.h - 24, fillLookup: accent },
            { id: 'kind', type: 'text', x: SYSTEM.pad, y: 2, bind: 'data.kind', fontSize: 10, fontWeight: 700, uppercase: true, colorLookup: accent },
            // An API no Studio package calls.
            { id: 'unclaimed', type: 'rect', x: SYSTEM.w - SYSTEM.pad - 104, y: 9, width: 104, height: 18, cornerRadius: 9, fill: 0xdc2626, requires: 'data.unclaimed' },
            { id: 'unclaimed-text', type: 'text', x: SYSTEM.w - SYSTEM.pad - 52, y: 3.5, text: 'No Studio caller', anchor: 'center', fontSize: 9, fontWeight: 700, color: 0xffffff, requires: 'data.unclaimed' },
            { id: 'name', type: 'text', x: SYSTEM.pad, y: 14, bind: 'data.name', fontSize: 16, fontWeight: 800, maxWidth: SYSTEM.w - 2 * SYSTEM.pad, maxLines: 1, colorRole: 'heading' },
            { id: 'sub', type: 'text', x: SYSTEM.pad, y: 48, bind: 'data.sub', fontSize: 10, lineHeight: 13, maxWidth: SYSTEM.w - 2 * SYSTEM.pad, maxLines: 2, colorRole: 'muted' },
            { id: 'divider', type: 'line', x: SYSTEM.pad, y: 92, x2: SYSTEM.w - SYSTEM.pad, y2: 92, colorRole: 'divider' },
            { id: 'stats', type: 'text', x: SYSTEM.pad, y: 89, bind: 'data.stats', fontSize: 11, fontWeight: 600, colorRole: 'foreground' }
          ]
        }
      };

      // Freeform structures carry their own colours and bindings.
      const stylings: NodeStylingRegistry = {
        platformCard: { name: 'platformCard' },
        productCard: { name: 'productCard' },
        featureCard: { name: 'featureCard' },
        storyCard: { name: 'storyCard' },
        systemCard: { name: 'systemCard' }
      };
      const system = { structure: 'systemCard', styling: 'systemCard', bindings: {} };
      const nodeTypes: NodeTypeRegistry = {
        platform: { structure: 'platformCard', styling: 'platformCard', bindings: {} },
        product: { structure: 'productCard', styling: 'productCard', bindings: {} },
        feature: { structure: 'featureCard', styling: 'featureCard', bindings: {} },
        story: { structure: 'storyCard', styling: 'storyCard', bindings: {} },
        service: system,
        group: system,
        api: system,
        module: system,
        package: system,
        integration: system
      };

      return {
        // Radial positions ride on the nodes; only Layered runs a solver.
        activeLayout: layout === 'layered' ? 'layered' : '',
        behaviours: {
          // The cards carry their own colour — nothing else may repaint them.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] }
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.6 },
          graph: {
            nodeStructureTemplates: structures,
            nodeStylingTemplates: stylings,
            nodeTypes,
            node: {
              state: {
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0x2563eb, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.25 },
                // A card not tagged for the picked persona.
                faded: { bgAlpha: 0.15 },
                // A card whose children are showing.
                open: { bgStrokeWidth: 4 },
                // Blast radius: its root, and everything that depends on it.
                impactRoot: { bgStrokeColor: 0xdc2626, bgStrokeWidth: 6 },
                impact: { bgStrokeColor: 0xf97316, bgStrokeWidth: 3 }
              }
            },
            edge: {
              style: {
                // No stroke colour: the theme paints edges its `muted` role, so
                // they hold their contrast in light and dark alike.
                shape: { pathType: layout === 'radial' ? 'bump-radial' : 'bump-horizontal' },
                strokeAlpha: 0.85,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 10
              },
              state: {
                // Widths are world units: heavier toward the platform so the
                // trunk still reads when a wide open tree is framed far out.
                trunk: { strokeWidth: 6 },
                branch: { strokeWidth: 4 },
                twig: { strokeWidth: 2.5 },
                // A dependency between branches — drawn only when both ends show.
                cross: { strokeWidth: 2, strokeAlpha: 0.5, strokeDashArray: [12, 8] },
                // A dependency that carries the blast radius.
                impactEdge: { strokeWidth: 3, strokeAlpha: 1, strokeColor: 0xf97316, arrowTargetColor: 0xf97316, strokeDashArray: [12, 8] },
                highlighted: { strokeColor: 0xfbbf24, strokeAlpha: 1, arrowTargetColor: 0xfbbf24 },
                dimmed: { strokeAlpha: 0.08 }
              }
            }
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 }
        },
        layouts: {
          layered: {
            algorithm: 'layered',
            direction: 'RIGHT',
            nodeSpacing: 24,
            layerSpacing: 140,
            defaultNodeSize: { width: FEATURE.w, height: FEATURE.h }
          }
        }
      };
      // PERSONAS is a render-local literal the card builders close over.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout]);

    // `onReady` must stay stable (`[]` deps), so it reads the config through a ref.
    const configRef = useRef(config);
    configRef.current = config;

    const onReady = useCallback((c: GraphCanvas | null) => {
      setCanvas(c);
      if (!c) return;
      // ELK isn't in the app bundle — register it by id; its options come from
      // `config.layouts`.
      c.layouts.add(new ElkLayout({ id: 'layered', targetLayerId: 'graph' }));
      const cfg = configRef.current;
      c.update({ layouts: cfg.layouts, activeLayout: cfg.activeLayout });
      c.showMessage(`Invana · ${platformCounts}`);
      // `platformCounts` is read from the dataset once — the same on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Every expand or collapse re-seeds the graph; ask the engine to glide the
    // camera to frame what is now showing once the new cut has settled.
    useEffect(() => {
      canvas?.store.actions.cameraIntent.request('visible');
    }, [canvas, data]);

    useEffect(() => {
      if (!canvas || !minimapOn) return;
      canvas.layers.add(
        new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph', backgroundLayerId: 'background' } })
      );
      return () => canvas.layers.remove('minimap');
    }, [canvas, minimapOn]);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'Invana platform map',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'select',
                  key: 'layout',
                  label: 'Layout',
                  value: layout,
                  options: { radial: 'Radial', layered: 'Layered' },
                  onChange: (v) => setLayout(v as LayoutId)
                },
                {
                  type: 'select',
                  key: 'view',
                  label: 'View',
                  value: view,
                  options: { product: 'Product', system: 'System', all: 'All' },
                  onChange: (v) => setView(v as ViewId)
                },
                {
                  type: 'select',
                  key: 'persona',
                  label: 'Persona',
                  value: persona,
                  options: { all: 'Everyone', ...Object.fromEntries(PERSONAS.map((p) => [p.key, p.name])) },
                  onChange: (v) => setPersona(v as string)
                },
                {
                  type: 'toggle',
                  key: 'dependencies',
                  icon: Waypoints,
                  label: 'Dependencies: off',
                  activeLabel: 'Dependencies: on',
                  active: deps,
                  onToggle: () => setDeps((v) => !v)
                },
                {
                  type: 'toggle',
                  key: 'minimap',
                  icon: Map,
                  label: 'Minimap: off',
                  activeLabel: 'Minimap: on',
                  active: minimapOn,
                  onToggle: () => setMinimapOn((v) => !v)
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
                }
              ]}
            />
          )
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      >
        {/* Right-click a card → expand or collapse what is below it; on a
            system or code card, show what depends on it. Leaf items close the
            menu themselves. */}
        <GraphNodeContextMenu
          items={({ id }) => {
            const kids = tree.children[id] ?? [];
            const clear: MenuItem[] = impact
              ? [
                  {
                    id: 'clear',
                    label: 'Clear — show everything',
                    icon: X,
                    onClick: () => {
                      setImpact(null);
                      canvas?.showMessage(`Invana · ${platformCounts}`);
                    }
                  }
                ]
              : [];
            if (id === 'invana') {
              return [
                {
                  id: 'collapse-all',
                  label: 'Collapse all',
                  icon: ChevronsDownUp,
                  disabled: expanded.size === 0,
                  onClick: () => {
                    setExpanded(new Set());
                    setImpact(null);
                  }
                },
                ...clear
              ];
            }
            const type = tree.node[id]?.type ?? '';
            const blast: MenuItem[] =
              layerOf(id) === 'system' || layerOf(id) === 'code'
                ? [{ id: 'blast', label: 'Show what depends on this', icon: Zap, onClick: () => showImpact(id) }, ...clear]
                : clear;
            // Children are one type, except the platform's.
            // The foundation's parts are product cards, but not products.
            const [one, many] =
              id === 'foundation' ? ['foundation part', 'foundation parts'] : (NOUN[tree.node[kids[0] ?? '']?.type ?? ''] ?? ['item', 'items']);
            const noun = `${kids.length} ${kids.length === 1 ? one : many}`;
            // Fold a node and everything open below it.
            const fold = (set: Set<string>, root: string) => {
              set.delete(root);
              for (const k of tree.children[root] ?? []) fold(set, k);
            };
            const sep: MenuItem[] = blast.length ? [{ id: 'sep', label: '', separator: true }] : [];
            if (kids.length === 0) {
              return blast.length ? blast : [{ id: 'leaf', label: `${NOUN[type]?.[0] ?? 'This'} has nothing below it`, disabled: true }];
            }
            if (expanded.has(id)) {
              return [
                {
                  id: 'collapse',
                  label: `Collapse — hide ${noun}`,
                  icon: ChevronsDownUp,
                  onClick: () =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      fold(next, id);
                      return next;
                    })
                },
                ...sep,
                ...blast
              ];
            }
            return [
              {
                id: 'expand',
                label: `Expand — show ${noun}`,
                icon: ChevronsUpDown,
                onClick: () => setExpanded((prev) => new Set(prev).add(id))
              },
              {
                id: 'expand-only',
                label: 'Expand only this',
                icon: Focus,
                onClick: () =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    for (const sibling of tree.children[tree.parent[id] ?? ''] ?? []) fold(next, sibling);
                    return next.add(id);
                  })
              },
              ...sep,
              ...blast
            ];
          }}
        />
      </GraphCanvasApp>
    );
  }
};
