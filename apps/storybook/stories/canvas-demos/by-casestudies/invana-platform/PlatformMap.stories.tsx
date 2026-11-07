/**
 * **Invana platform map** — every product, feature and user story in Invana's
 * product specs as one tree, with the **Invana platform at the centre**: the
 * platform ships products, each product offers features, each feature is
 * delivered by stories. Every node is a **composite card** that carries *who it
 * is for* on its face.
 *
 * The data is `invanaPlatform` from `@invana/graph-datasets` — **generated**
 * from the invana repo's `specs/` by its `platform-map` skill, so the picture is
 * the specs, never a copy kept by hand. The story owns only the look.
 *
 * ### Four cards, one per node `type`
 *
 * | Type | Card |
 * |---|---|
 * | `platform` | The root: name, tagline, counts — and the **persona legend** |
 * | `product` | Code, name, summary, its feature and story counts, persona chips |
 * | `feature` | Code, name, **Access** (the grants its Access table names), persona chips |
 * | `story` | Code, name, persona chips — compact, because there are 160 of them |
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
 * - the platform at the origin, the products on a fixed ring at equal angles;
 * - an open node's children on an arc centred on the node's own angle, one
 *   ring further out, spaced by card size — the ring widens when a node has
 *   too many children to fit its span (90° for features, 60° for stories).
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
 * - **Persona** — fade every card not tagged for one persona, so its reach
 *   across the platform stands out.
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
import { ChevronsDownUp, ChevronsUpDown, Focus, Map, Moon, Settings, Sun } from 'lucide-react';

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
    /** What a node's children are called, by the node's type. */
    const CHILD_NOUN: Record<string, [string, string]> = {
      platform: ['product', 'products'],
      product: ['feature', 'features'],
      feature: ['story', 'stories']
    };

    const [layout, setLayout] = useState<LayoutId>('radial');
    // The nodes whose children are showing. The platform is always open.
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
    const [persona, setPersona] = useState<string>('all');
    const [minimapOn, setMinimapOn] = useState(true);
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (c) => <CanvasSettingsEditorPanel canvas={c} className="border-0 bg-transparent shadow-none" />
        }
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } }
    );

    // The tree as parent → children and child → parent, read once from the edges.
    const tree = useMemo(() => {
      const children: Record<string, string[]> = {};
      const parent: Record<string, string> = {};
      for (const e of invanaPlatform.edges) {
        (children[e.source] ??= []).push(e.target);
        parent[e.target] = e.source;
      }
      return { children, parent };
    }, []);

    // The tree cut to what `expanded` reveals: the platform, its products, and
    // the children of every open node whose own parent is open. A card not
    // tagged for the picked persona is `faded` (the platform never fades); an
    // open card is `open`.
    const data: GraphData = useMemo(() => {
      const ids = new Set<string>(['invana']);
      const reveal = (id: string) => {
        for (const child of tree.children[id] ?? []) {
          ids.add(child);
          if (expanded.has(child)) reveal(child);
        }
      };
      reveal('invana');

      // Radial placement: products on a fixed ring; an open node's children on
      // an arc around its angle, one ring out (see the header comment).
      const angle: Record<string, number> = {};
      const ring: Record<string, number> = { invana: 0 };
      const products = tree.children.invana ?? [];
      products.forEach((id, i) => {
        angle[id] = -Math.PI / 2 + (i * 2 * Math.PI) / products.length;
        ring[id] = 700;
      });
      // Per child ring: the gap out from the parent, the arc length per card,
      // and the widest span the children may take.
      const FAN = { product: { gap: 650, step: 340, span: Math.PI / 2 }, feature: { gap: 560, step: 260, span: Math.PI / 3 } };
      const fan = (id: string, kind: keyof typeof FAN) => {
        if (!expanded.has(id)) return;
        const kids = tree.children[id] ?? [];
        const { gap, step, span } = FAN[kind];
        const r = Math.max((ring[id] ?? 0) + gap, (kids.length * step) / span);
        const first = (angle[id] ?? 0) - ((kids.length - 1) * step) / r / 2;
        kids.forEach((k, i) => {
          angle[k] = first + (i * step) / r;
          ring[k] = r;
          if (kind === 'product') fan(k, 'feature');
        });
      };
      for (const id of products) fan(id, 'product');
      const placed = (id: string) =>
        layout === 'radial'
          ? { position: { x: Math.round((ring[id] ?? 0) * Math.cos(angle[id] ?? 0)), y: Math.round((ring[id] ?? 0) * Math.sin(angle[id] ?? 0)) } }
          : {};

      const nodes = invanaPlatform.nodes
        .filter((n) => ids.has(n.id))
        .map((n) => {
          const tagged = (n.data as { p?: Record<string, number> }).p;
          const states = [
            ...(persona !== 'all' && n.type !== 'platform' && !tagged?.[persona] ? ['faded'] : []),
            ...(n.type !== 'platform' && expanded.has(n.id) ? ['open'] : [])
          ];
          return { ...n, ...placed(n.id), ...(states.length ? { states } : {}) };
        });
      // Each edge names its tree level as an authored state, so the template's
      // `edge.state` overlays below can weight the trunk over the twigs.
      const level: Record<string, string> = { ships: 'trunk', offers: 'branch', 'delivered by': 'twig' };
      const edges = invanaPlatform.edges
        .filter((e) => ids.has(e.source) && ids.has(e.target))
        .map((e) => ({ ...e, states: [level[e.type] ?? 'twig'] }));
      return { nodes, edges };
    }, [tree, expanded, persona, layout]);

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
            { id: 'code', type: 'text', x: PRODUCT.pad, y: 2, text: 'Product · {data.code}', fontSize: 10, fontWeight: 700, uppercase: true, colorLookup: hue },
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
        }
      };

      // Freeform structures carry their own colours and bindings.
      const stylings: NodeStylingRegistry = {
        platformCard: { name: 'platformCard' },
        productCard: { name: 'productCard' },
        featureCard: { name: 'featureCard' },
        storyCard: { name: 'storyCard' }
      };
      const nodeTypes: NodeTypeRegistry = {
        platform: { structure: 'platformCard', styling: 'platformCard', bindings: {} },
        product: { structure: 'productCard', styling: 'productCard', bindings: {} },
        feature: { structure: 'featureCard', styling: 'featureCard', bindings: {} },
        story: { structure: 'storyCard', styling: 'storyCard', bindings: {} }
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
                open: { bgStrokeWidth: 4 }
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
      const root = invanaPlatform.nodes.find((n) => n.type === 'platform')?.data as { counts?: string } | undefined;
      c.showMessage(`Invana · ${root?.counts ?? ''}`);
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
                  key: 'persona',
                  label: 'Persona',
                  value: persona,
                  options: { all: 'Everyone', ...Object.fromEntries(PERSONAS.map((p) => [p.key, p.name])) },
                  onChange: (v) => setPersona(v as string)
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
        {/* Right-click a card → expand or collapse what is below it. Leaf
            items close the menu themselves. */}
        <GraphNodeContextMenu
          items={({ id }) => {
            const kids = tree.children[id] ?? [];
            if (id === 'invana') {
              return [
                {
                  id: 'collapse-all',
                  label: 'Collapse all',
                  icon: ChevronsDownUp,
                  disabled: expanded.size === 0,
                  onClick: () => setExpanded(new Set())
                }
              ];
            }
            if (kids.length === 0) {
              return [{ id: 'leaf', label: 'A story has nothing below it', disabled: true }];
            }
            const [one, many] = CHILD_NOUN[invanaPlatform.nodes.find((n) => n.id === id)?.type ?? ''] ?? ['child', 'children'];
            const noun = `${kids.length} ${kids.length === 1 ? one : many}`;
            // Fold a node and everything open below it.
            const fold = (set: Set<string>, root: string) => {
              set.delete(root);
              for (const k of tree.children[root] ?? []) fold(set, k);
            };
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
                }
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
              }
            ];
          }}
        />
      </GraphCanvasApp>
    );
  }
};
