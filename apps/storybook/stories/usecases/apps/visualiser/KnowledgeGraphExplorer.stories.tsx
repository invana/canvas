/**
 * **Knowledge Graph Explorer** — Palantir / Neo4j Bloom / Diffbot-style entity
 * ontology view, composed from `<GraphCanvasApp>`. Five companies and their CEOs
 * start on screen; **double-clicking any node** folds that node's 1-hop
 * neighbourhood in from the underlying dataset, so the user grows the picture
 * interactively from a hand-curated seed.
 *
 * Expansion is React state: the double-click adds ids to the exposed set, which
 * rebuilds `data` — a new identity re-seeds the graph and the active layout
 * re-runs so newcomers find their place instead of piling at the origin. The
 * header carries the **layout** switch (`graph-force` ⇄ ELK `radial`, both
 * registered, `config.activeLayout` picks), an **entity-type filter**, reset /
 * expand-all buttons, and **Settings** (`<CanvasSettingsEditorPanel>`) docked
 * into the right region.
 *
 * Exercises: kind-based shape + fill, typed edge labels, hover focal emphasis
 * with 1-hop highlight + dim, two registered layouts selected through
 * `activeLayout`, click-tracked neighbour expansion.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels,
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData, NodeShapeOptions } from '@invana/graph';
import {
  ontology,
  type OntologyEntityKind,
} from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Maximize2, Moon, RotateCcw, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/apps/visualiser/KnowledgeGraphExplorer' };
export default meta;
type Story = StoryObj;

export const KnowledgeGraphExplorer: Story = {
  render: function Render() {
    const ALL_KINDS: OntologyEntityKind[] = ['company', 'person', 'product', 'location', 'industry'];

    // Which nodes are currently exposed to the graph (before the type filter).
    // Starts at the dataset's curated core; double-click grows it.
    const [exposedIds, setExposedIds] = useState<ReadonlySet<string>>(
      () => new Set(ontology.coreIds),
    );
    // Entity-type filter — every kind on by default.
    const [kinds, setKinds] = useState<ReadonlySet<OntologyEntityKind>>(() => new Set(ALL_KINDS));
    const [layoutId, setLayoutId] = useState('graph-force');

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          ),
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    // Track click timestamps per id so a second click on the same node within
    // 350 ms counts as a double-click — the engine exposes no public
    // double-click event, and this keeps the story off the private renderer bus.
    const lastClick = useRef<{ id: string; t: number } | null>(null);
    const onSelect = useCallback((el: { id: string }) => {
      const now = Date.now();
      if (lastClick.current?.id === el.id && now - lastClick.current.t < 350) {
        lastClick.current = null;
        // Pull every 1-hop neighbour of the seed out of the FULL dataset.
        setExposedIds((prev) => {
          const next = new Set(prev);
          for (const e of ontology.edges) {
            if (e.source === el.id) next.add(e.target);
            if (e.target === el.id) next.add(e.source);
          }
          // Same size ⇒ nothing new; keep the identity so `data` doesn't churn.
          return next.size === prev.size ? prev : next;
        });
      } else {
        lastClick.current = { id: el.id, t: now };
      }
    }, []);

    // (exposed ∩ filter) → the visible subgraph, with per-kind shape + fill and
    // the relation name on every edge.
    const data: GraphData = useMemo(() => {
      const KIND_FILL: Record<OntologyEntityKind, number> = {
        company: 0x6366f1, // indigo
        person: 0x10b981, // emerald
        product: 0x8b5cf6, // violet
        location: 0xf59e0b, // amber
        industry: 0x64748b, // slate
      };
      const KIND_SHAPE: Record<OntologyEntityKind, NodeShapeOptions> = {
        company: { kind: 'rect', width: 130, height: 42, cornerRadius: 8 },
        person: { kind: 'circle', radius: 26 },
        product: { kind: 'rect', width: 120, height: 36, cornerRadius: 18 },
        location: { kind: 'regular-polygon', sides: 6, radius: 28, rotation: 0 },
        industry: { kind: 'rect', width: 110, height: 36, cornerRadius: 4 },
      };

      const inGraph = ontology.nodes.filter((n) => exposedIds.has(n.id) && kinds.has(n.data.kind));
      const idSet = new Set(inGraph.map((n) => n.id));

      return {
        nodes: inGraph.map((n) => ({
          id: n.id,
          type: n.data.kind,
          data: n.data,
          style: {
            shape: KIND_SHAPE[n.data.kind],
            bgFill: KIND_FILL[n.data.kind],
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 1.5,
            labelText: n.data.name,
            labelColor: 0xffffff,
            labelFontSize: n.data.kind === 'person' ? 10 : 11,
            labelFontWeight: 600,
            labelPlacement: 'center',
          },
        })),
        edges: ontology.edges
          .filter((e) => idSet.has(e.source) && idSet.has(e.target))
          .map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.data.kind,
            data: e.data,
            style: {
              shape: { pathType: 'bezier' as const, pathStyleOpts: { axis: 'h', tension: 0.45 } },
              strokeColor: 0x94a3b8,
              strokeWidth: 1.3,
              strokeAlpha: 0.7,
              arrowTargetShape: 'triangle' as const,
              arrowTargetSize: 7,
              arrowTargetColor: 0x94a3b8,
              labelText: e.data.kind.replace(/_/g, ' '),
              labelColor: 0x64748b,
              labelFontSize: 9,
              labelBackgroundAlpha: 0.85,
              labelBackgroundPadding: 2,
              labelBackgroundCornerRadius: 3,
            },
          })),
      };
    }, [exposedIds, kinds]);

    const config: CanvasConfig = useMemo(
      () => ({
        // Both layouts are registered (`graph-force` by the bundle, `radial`
        // as a child below); this picks which one runs.
        activeLayout: layoutId,
        behaviours: {
          // Kind colours are stamped per node above.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
          // The double-click detector rides the bundle's own select behaviour.
          'click-select': { enabled: true, multiple: true, trigger: ['shift'], onSelect },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              state: {
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
              },
            },
            edge: {
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 2.2,
                  strokeAlpha: 1,
                  arrowTargetColor: 0xfbbf24,
                },
              },
            },
          },
        },
        layouts: {
          'graph-force': {
            link: { distance: 110 },
            charge: { strength: -260 },
            collide: { radius: 32 },
            center: { x: 0, y: 0 },
          },
          radial: { algorithm: 'radial', nodeSpacing: 40 },
        },
      }),
      [layoutId, onSelect],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Double-click a node to pull in its neighbours');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Knowledge Graph Explorer',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'layout',
                    label: 'Layout',
                    value: layoutId,
                    options: { 'graph-force': 'Force', radial: 'Radial' },
                    onChange: setLayoutId,
                  },
                  {
                    type: 'select',
                    key: 'kinds',
                    label: 'Types',
                    // A single-select trigger toggling one kind at a time keeps
                    // the header compact; the picked kind flips in / out.
                    value: '',
                    options: Object.fromEntries(
                      ALL_KINDS.map((k) => [k, `${kinds.has(k) ? '✓ ' : ''}${k}`]),
                    ),
                    triggerLabelOnly: true,
                    onChange: (k) =>
                      setKinds((prev) => {
                        const next = new Set(prev);
                        if (next.has(k as OntologyEntityKind)) next.delete(k as OntologyEntityKind);
                        else next.add(k as OntologyEntityKind);
                        return next;
                      }),
                  },
                  {
                    type: 'button',
                    key: 'reset',
                    icon: RotateCcw,
                    label: 'Reset to core',
                    onClick: () => setExposedIds(new Set(ontology.coreIds)),
                  },
                  {
                    type: 'button',
                    key: 'expand-all',
                    icon: Maximize2,
                    label: 'Expand all',
                    onClick: () => setExposedIds(new Set(ontology.nodes.map((n) => n.id))),
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
          right={dock.region}
        >
          {/* The second layout — registered as `radial`, run only while
              `config.activeLayout` names it. */}
          <ElkLayout id="radial" targetLayerId="graph" fitPadding={80} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
