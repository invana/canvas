/**
 * **Subject-bundled subset** — a lightweight (~75-node) slice of the paper
 * citation network demonstrating `pathType: 'bundle'` over a flat graph, dressed
 * in the `<GraphCanvasApp>` shell. Paper-citations has no hierarchy of its own, so bundling
 * has nothing to ride on by default. Here the `subject` field plays the role of
 * "cluster": nodes are hand-positioned in three regions (one per subject) and
 * every cross-subject edge routes through both regions' centroids as bundle
 * waypoints — the classic scattered-blobs-joined-by-ribbons look.
 *
 * Positions and per-edge routes are authored in the data, so `activeLayout:
 * 'none'` no-ops the layout step and `canvas.fitView(...)` frames the result.
 * The header's **Settings** toggle docks `<CanvasSettingsEditorPanel>` for the
 * live layer / behaviour state.
 *
 * For the *dense* full-Paper-citations view (no bundling — additive bezier overlap), see
 * the sibling `CitationNetwork.stories.tsx`. For the pathType mechanics on a
 * stripped-down example, see `Graph/Edges/Types/Bundle.stories.ts`.
 *
 * Exercises: `bundle` pathStyle with explicit `waypoints` derived from an
 * external clustering signal (the `subject` field), per-edge route decisions
 * (intra-cluster = direct; inter-cluster = bundled through centroids), static
 * positions with no force simulation.
 */

import { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
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
import type { GraphCanvas, GraphData, GraphNode } from '@invana/graph';
import { paperCitations } from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Moon, Settings, Sun } from 'lucide-react';

/** The payload each Paper-citations paper node carries. */
interface PaperNodeData {
  readonly subject: string;
}

const meta: Meta = { title: 'usecases/by-casestudies/paper-citations/SubjectBundle' };
export default meta;
type Story = StoryObj;

export const SubjectBundleStory: Story = {
  name: 'SubjectBundle',
  render: function Render() {
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

    // Everything data-shaped is built once: the cluster subset, the radial
    // scatter, and each edge's bundle route. Memoised so a panel toggle (a
    // re-render) never hands the app a new `data` identity and re-seeds it.
    const { data, subjectFill } = useMemo(() => {
      // Three of the seven subjects — a triangle of clusters reads cleaner
      // than a row, and 3 inter-cluster channels (NN↔RL, NN↔GA, RL↔GA) is
      // enough to show the bundling without crowding.
      const FOCUS_SUBJECTS = [
        'Neural_Networks',
        'Reinforcement_Learning',
        'Genetic_Algorithms',
      ] as const;
      type FocusSubject = (typeof FOCUS_SUBJECTS)[number];

      // Hand-picked cluster centres — these double as the bundle waypoints. The
      // triangle keeps each pair visibly separated so ribbons fan out instead of
      // overlapping along one corridor.
      const CENTROIDS: Record<FocusSubject, { x: number; y: number }> = {
        Neural_Networks: { x: 0, y: -200 },
        Reinforcement_Learning: { x: -260, y: 140 },
        Genetic_Algorithms: { x: 260, y: 140 },
      };
      const SUBJECT_FILL: Record<FocusSubject, number> = {
        Neural_Networks: 0x2563eb, // blue
        Reinforcement_Learning: 0xf59e0b, // amber
        Genetic_Algorithms: 0xec4899, // pink
      };

      const PER_SUBJECT = 25; // 75 nodes total — light enough to read
      const CLUSTER_RADIUS = 70;
      const BETA = 0.85; // bundle tension
      const EDGE_WIDTH = 0.9;
      const EDGE_ALPHA = 0.45;

      // Take the first PER_SUBJECT papers per focus subject.
      const focusSet = new Set<string>(FOCUS_SUBJECTS);
      const buckets = new Map<FocusSubject, (typeof paperCitations.nodes)[number][]>();
      for (const s of FOCUS_SUBJECTS) buckets.set(s, []);
      for (const n of paperCitations.nodes) {
        if (!focusSet.has(n.data.subject)) continue;
        const bucket = buckets.get(n.data.subject as FocusSubject)!;
        if (bucket.length < PER_SUBJECT) bucket.push(n);
      }

      // Radial scatter around each centroid — two interleaved rings so 25 dots
      // in ~70 world units don't collide visually.
      const nodes: GraphData['nodes'] = [];
      for (const [subject, papers] of buckets) {
        const c = CENTROIDS[subject];
        papers.forEach((p, i) => {
          const theta = (i / papers.length) * Math.PI * 2;
          const r = CLUSTER_RADIUS * (i % 2 === 0 ? 1 : 0.55);
          nodes.push({
            id: p.id,
            type: subject,
            data: p.data,
            position: { x: c.x + r * Math.cos(theta), y: c.y + r * Math.sin(theta) },
          });
        });
      }

      const subjectById = new Map<string, FocusSubject>();
      for (const n of nodes) subjectById.set(n.id, (n.data as PaperNodeData).subject as FocusSubject);

      // Intra-cluster edges go direct (no waypoints); inter-cluster ones route
      // through both centroids, so every edge sharing a cluster pair bundles
      // along the same corridor.
      const waypointsFor = (sourceId: string, targetId: string): { x: number; y: number }[] => {
        const s = subjectById.get(sourceId)!;
        const t = subjectById.get(targetId)!;
        return s === t ? [] : [CENTROIDS[s], CENTROIDS[t]];
      };

      const ids = new Set(nodes.map((n) => n.id));
      const edges: GraphData['edges'] = paperCitations.edges
        .filter((e) => ids.has(e.source) && ids.has(e.target))
        .map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'CITES',
          data: {},
          // Route *and* colour are per-edge (the stroke follows the **source**
          // node's subject), so they're stamped here rather than resolved from
          // the layer template — a template resolver sees the edge, not its
          // source node's data.
          style: {
            shape: {
              pathType: 'bundle' as const,
              sourceAnchor: 'center' as const,
              targetAnchor: 'center' as const,
              pathStyleOpts: { beta: BETA },
              waypoints: waypointsFor(e.source, e.target),
            },
            strokeColor: SUBJECT_FILL[subjectById.get(e.source)!] ?? 0x64748b,
            strokeWidth: EDGE_WIDTH,
            strokeAlpha: EDGE_ALPHA,
            arrowTargetShape: 'none' as const,
          },
        }));

      return { data: { nodes, edges } as GraphData, subjectFill: SUBJECT_FILL as Record<string, number> };
    }, []);

    const config: CanvasConfig = useMemo(
      () => ({
        // Positions are authored — nothing to solve.
        activeLayout: 'none',
        behaviours: {
          // Subject colours come from the `bgFill` resolver below.
          color: { enabled: false },
          hover: { enabled: true, state: 'hovered', degree: 1, direction: 'both' },
        },
        layers: {
          graph: {
            node: {
              style: {
                bgFill: (n: GraphNode) => subjectFill[(n.data as PaperNodeData).subject] ?? 0x64748b,
                shape: { kind: 'circle', radius: 4 },
                bgAlpha: 0.95,
                bgStrokeWidth: 0,
              },
              state: {
                hovered: {
                  bgStrokeColor: 0xfbbf24,
                  bgStrokeWidth: 1.6,
                  shape: { kind: 'circle', radius: 6 },
                },
              },
            },
            edge: {
              // Per-edge styles (above) carry the routes; this is the fallback
              // shape for anything not stamped.
              style: {
                shape: { pathType: 'bundle', sourceAnchor: 'center', targetAnchor: 'center' },
                strokeWidth: 0.9,
                strokeAlpha: 0.45,
                arrowTargetShape: 'none',
              },
              state: { highlighted: { strokeAlpha: 0.95, strokeWidth: 1.7 } },
            },
          },
        },
      }),
      [subjectFill],
    );

    const onReady = useCallback(
      (c: GraphCanvas | null) => {
        if (!c) return;
        // No layout runs, so `fitOnLoad` never arms — frame it once by hand, a
        // frame after ready so the scene has flushed its bounds.
        requestAnimationFrame(() => c.fitView(80));
        c.showMessage(`${data.nodes.length} papers · ${data.edges.length} bundled citations`);
      },
      [data],
    );

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Paper-citations — Subject Bundle',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
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
        />
      </ThemeProvider>
    );
  },
};
