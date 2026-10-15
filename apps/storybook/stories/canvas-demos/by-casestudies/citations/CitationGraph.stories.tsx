/**
 * **Citation / Research Graph** — Connected-Papers / Litmaps / Elicit-style
 * paper-discovery view, composed as an arrangement of `<GraphCanvasApp>`.
 * 150 synthetic papers across 5 topics, ~400 citation edges, force-laid into
 * topic clusters with a density-contour overlay that brings the clusters
 * forward without any colour key. Node radius scales with citation count so the
 * hubs read immediately; `LabelCollisionBehaviour` keeps the top-cited papers
 * labelled at any zoom while letting the periphery's labels appear only when
 * the user zooms in.
 *
 * The app supplies the batteries bundle (background · graph · d3-force ·
 * pan / zoom / drag / hover / click-select); the story adds the two pieces the
 * bundle doesn't ship — the contour overlay and label collision — registered by
 * id in `onReady`, and tunes everything (theirs included) through `config`.
 * Every knob (contour bandwidth / thresholds / opacity, force params, hover
 * degree, …) is editable live from
 * the header's **Settings** toggle, which docks `<CanvasSettingsEditorPanel>`
 * into the app's resizable right region.
 *
 * Exercises: `D3ForceLayout` + `DensityContourFillLayer` composition,
 * data-driven node radius (resolver on `shape`), priority-driven
 * `LabelCollisionBehaviour`, brush select (header select-mode picker).
 */

import { useCallback, useMemo, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import { LabelCollisionBehaviour, type GraphCanvas, type GraphData, type GraphNode } from '@invana/graph';
import {
  citations
} from '@invana/graph-datasets/usecase-demos';
import { DensityContourFillLayer } from '@invana/graph-layer-d3-contour';
import { Moon, Settings, Sun } from 'lucide-react';

/** The payload each paper node carries. */
type CitationsTopic = string;
interface CitationsNodeData {
  readonly topic: CitationsTopic;
  readonly title: string;
  readonly year: number;
  readonly citationsCount: number;
}

const meta: Meta = { title: 'canvas-demos/by-casestudies/citations/CitationGraph' };
export default meta;
type Story = StoryObj;

export const CitationGraphStory: Story = {
  name: 'CitationGraph',
  render: function Render() {
    // One colour per research topic — the story's own palette, so the bundle's
    // colour-by-type behaviour is turned off in `config` below.
    const TOPIC_FILL: Record<CitationsTopic, number> = {
      'transformers': 0x6366f1, // indigo
      'diffusion-models': 0x10b981, // emerald
      'reinforcement-learning': 0xf59e0b, // amber
      'graph-neural-networks': 0xec4899, // pink
      'vision-language': 0x8b5cf6, // violet
    };

    // The whole visualisation's state — every registered layer / behaviour /
    // layout — is editable from this one docked panel (the activity-bar
    // controller turns the descriptor into a header toggle + the right region).
    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          )
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    // The paper's `topic` becomes its node type so the inspector / status bar
    // read a meaningful category. Memoised so a panel toggle (a re-render) never
    // hands the app a new `data` identity and reloads the engine.
    const data: GraphData = useMemo(
      () => ({
        nodes: citations.nodes.map((n) => ({ id: n.id, type: n.data.topic, data: n.data })),
        edges: citations.edges.map((e) => ({ type: 'edge',
          id: e.id,
          source: e.source,
          target: e.target,
          data: e.data
        }))
      }),
      [],
    );

    // Everything else rides `config` — including the non-serialisable resolvers
    // (`shape` / `bgFill` / `labelText` / `labelPriority`) that make radius,
    // colour and label priority data-driven. Memoised for the same reason.
    const config: CanvasConfig = useMemo(
      () => ({
        behaviours: {
          // Topic colours come from the resolver below, so the bundle's
          // colour-by-type behaviour must not repaint the fills.
          color: { enabled: false },
          hover: { enabled: true, state: 'hovered', inactiveState: 'dimmed', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
          // Priority-driven label thinning: the top-cited papers keep their
          // labels, the periphery yields when labels would overlap.
          'label-collision': { enabled: true }
        },
        layers: {
          // The density overlay registered in `onReady` — it sits under the graph.
          density: { bandwidth: 30, thresholds: 12, cellSize: 4, fillOpacity: 0.4, padding: 80, palette: 'inferno' },
          graph: {
            node: {
              style: {
                shape: (n: GraphNode) => ({
                  kind: 'circle' as const,
                  // log scales 1 → 900 citations into ~3 → 11 px radius.
                  radius: 3 + Math.log10((n.data as CitationsNodeData).citationsCount + 1) * 3
                }),
                bgFill: (n: GraphNode) => TOPIC_FILL[(n.data as CitationsNodeData).topic],
                labelText: (n: GraphNode) => (n.data as CitationsNodeData).title,
                labelPriority: (n: GraphNode) => (n.data as CitationsNodeData).citationsCount,
                bgAlpha: 0.95,
                bgStrokeColor: 0x0b1220,
                bgStrokeWidth: 0.5,
                labelFontSize: 10,
                labelPlacement: 'bottom',
                labelOffsetY: 4,
                labelBackgroundAlpha: 0.8,
                labelBackgroundPadding: 2,
                labelBackgroundCornerRadius: 2,
                // Peripheral labels stay hidden until the viewer zooms in;
                // high-priority (top-cited) labels push through
                // `LabelCollisionBehaviour` and remain visible.
                labelMinZoom: 0.6
              },
              state: {
                hovered: {
                  bgStrokeColor: 0xfbbf24,
                  bgStrokeWidth: 2,
                  labelForceShow: true,
                  labelFontSize: 12
                },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 1.5, labelForceShow: true },
                dimmed: { bgAlpha: 0.15 }
              }
            },
            edge: {
              style: {
                strokeColor: 0xcbd5e1,
                strokeWidth: 0.6,
                strokeAlpha: 0.25,
                arrowTargetShape: 'none'
              },
              state: {
                highlighted: { strokeColor: 0xfbbf24, strokeWidth: 1.2, strokeAlpha: 0.9 }
              }
            }
          }
        },
        layouts: {
          'graph-force': { link: { distance: 36 }, charge: { strength: -80 }, collide: { radius: 12 } }
        }
      }),
      // TOPIC_FILL is a render-local literal; the config closes over it once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    // `onReady` must be stable — a second registration of the same id throws — so
    // it reads the config through a ref.
    const configRef = useRef(config);

    const onReady = useCallback((c: GraphCanvas | null) => {
      if (!c) return;
      // Under the graph (`zIndex: -1`); appearance comes from `config.layers.density`.
      const density = new DensityContourFillLayer({ id: 'density', zIndex: -1, options: { graphLayerId: 'graph' } });
      c.layers.add(density);
      // The bands follow node positions, which a layout run changes without the
      // data changing — so repaint whenever a run settles.
      c.events.on('layout:run:end', ({ reason }) => {
        if (reason === 'settled') density.recompute();
      });
      // `strategy` / `flickerGuardMs` are read once at construction (`setOptions`
      // doesn't re-resolve them), so they stay on the constructor.
      c.behaviours.register(
        new LabelCollisionBehaviour({ id: 'label-collision', targetLayerId: 'graph', strategy: 'hide', flickerGuardMs: 120 }),
      );
      // Config only reaches instances registered when it is applied — re-apply for these.
      const current = configRef.current;
      c.update({
        layers: { density: current.layers!.density! },
        behaviours: { 'label-collision': current.behaviours!['label-collision']! }
      });
      c.showMessage('Hover a paper to trace its citations · open Settings to tune the density overlay');
    }, []);

    return (
      // <GraphCanvasApp> reads light/dark from a host <ThemeProvider> (required).
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'Citation Graph',
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
                  onToggle: ctx.toggleTheme
                },
              ]}
            />
          )
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      />
    );
  }
};
