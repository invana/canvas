/**
 * **Microservices Topology** — Datadog / Istio / Linkerd-style service
 * map. ~20 services across a SaaS stack laid out with ELK `layered`; the
 * health state of each service (healthy / degraded / down) drives node
 * styling via state-configs; each edge's RPS scales the stroke width
 * and each edge's error rate picks the stroke colour; degraded edges
 * carry an animated `marching-ants-connector` so the failing path
 * pops out without the user reading any numbers.
 *
 * Exercises: per-tier shape + glyph icon, state-config styling by data
 * field (`health`), data-driven edge styling (log-scaled width, banded
 * colour), animated decorations, RPS badge with resolvable label text,
 * GUI-driven "simulate degradation" loop. Built the new way: register
 * layers/behaviours/layout by id, then a single serialisable
 * `canvasOptions` object, then `init()` last.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  MiniMapLayer,
  type EdgeData,
  type EdgeDecorationSpec,
  type EdgeStyle,
  type NodeData,
} from '@invana/graph';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import {
  microservices,
  type MicroservicesEdgeData,
  type MicroservicesHealth,
  type MicroservicesNodeData,
  type MicroservicesTier,
} from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';
import { SystemThemeBehaviour } from '../system-theme';

const meta: Meta = { title: 'Usecases/Microservices Topology' };
export default meta;
type Story = StoryObj;

export const MicroservicesTopology: Story = {
  render: () => createContainer({ id: 'usecase-microservices' }),

  play: async ({ canvasElement }) => {
    const TIER_GLYPH: Record<MicroservicesTier, string> = {
      gateway: 'G', api: 'A', logic: 'L', data: 'D', external: 'E',
    };
    const TIER_FILL: Record<MicroservicesTier, number> = {
      gateway:  0x0ea5e9, // sky
      api:      0x6366f1, // indigo
      logic:    0x8b5cf6, // violet
      data:     0x64748b, // slate
      external: 0x14b8a6, // teal
    };

    const settings = {
      showRpsLabels: true,
      animateDegraded: true,
      simulateDegradation: false,
    };

    // ── Project dataset → node/edge data (content for `initData`) ────────
    const nodes: NodeData<MicroservicesNodeData>[] = microservices.nodes.map((n) => ({
      id: n.id,
      data: n.data,
      style: {
        shape: { kind: 'rect', width: 168, height: 46, cornerRadius: 8 },
        bgFill: TIER_FILL[n.data.tier],
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1.5,
        icon: {
          kind: 'glyph',
          char: TIER_GLYPH[n.data.tier],
          fontFamily: 'sans-serif',
          fontWeight: 700,
          color: 0xffffff,
          alpha: 0.45,
          sizeRatio: 0.6,
          anchor: 'top-left',
          offsetX: 8,
          offsetY: 8,
        },
        labelText: n.id,
        labelColor: 0xffffff,
        labelFontSize: 11,
        labelFontWeight: 600,
        labelPlacement: 'center',
        badges: n.data.rps > 0
          ? [{
              id: 'rps',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'rect', width: 44, height: 16, cornerRadius: 8 },
              fill: 0x111827,
              strokeColor: 0xffffff,
              strokeWidth: 1.2,
              labelText: formatRps(n.data.rps),
              labelColor: 0xffffff,
              labelFontSize: 10,
            }]
          : [],
      },
      states: healthStates(n.data.health),
    }));

    const edges: EdgeData<MicroservicesEdgeData>[] = microservices.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data,
      style: buildEdgeStyle(e.data),
    }));

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-microservices')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // ── Layers ──────────────────────────────────────────────────────────
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        node: {
          state: {
            // Health states. `healthy` is the implicit default (no
            // overlay needed). `degraded` and `down` are story-local
            // state names — registered here so the layer's state
            // catalogue recognises them when `states` lists them.
            degraded: {
              bgStrokeColor: 0xf59e0b,
              bgStrokeWidth: 3,
              effects: { breathing: { amplitude: 0.18, frequencyHz: 1.4 } },
            },
            down: {
              bgStrokeColor: 0xdc2626,
              bgStrokeWidth: 3,
              bgAlpha: 0.55,
              decorations: [
                { id: 'down-pulse', kind: 'pulse-ring', color: 0xdc2626, periodMs: 1200, maxRadius: 20 },
              ],
            },
            highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
            selected:    { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
          },
        },
        edge: {
          state: {
            highlighted: { strokeColor: 0xfbbf24, strokeWidth: 2.4, strokeAlpha: 1, arrowTargetColor: 0xfbbf24 },
          },
        },
      },
    });
    canvas.layers.add(graph);

    canvas.layers.add(
      new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph' } }),
    );

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'hover', layerId: 'graph',
        state: 'highlighted', inactiveState: 'dimmed',
        degree: 1, direction: 'both',
      }),
    );
    canvas.behaviours.register(
      new ClickSelectBehaviour({
        id: 'select', layerId: 'graph',
        multiple: true, trigger: ['shift'],
      }),
    );
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', layerId: 'bg' }));

    // ── Layout ──────────────────────────────────────────────────────────
    // `ElkLayout`'s constructor types its options as `ElkLayoutOptions`
    // (the ELK param bag) and doesn't surface the shared `LayoutOptions`
    // wiring fields. Set `id` / `targetLayerId` on the instance so the
    // registry keys it as `elk` and the active layout resolves its target.
    const layout = Object.assign(new ElkLayout(), { id: 'elk', targetLayerId: 'graph' });
    layout.events.on('end', ({ reason }) => {
      if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
    });
    canvas.layouts.add(layout);
    onStoryTeardown(() => layout.stop());

    // ── Config ──────────────────────────────────────────────────────────
    const canvasOptions = {
      layers: {
        bg: {
          type: 'pattern',
          patternType: 'dots',
          backgroundColor: '#0b1220',
          color: '#1e293b',
          size: 1.2,
          spacing: 26,
          alpha: 0.7,
        },
        minimap: { position: 'bottom-right', width: 220, height: 160 },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        hover: { enabled: true },
        select: { enabled: true },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#cbd5e1' },
          dark: { backgroundColor: '#0b1220', color: '#1e293b' },
        },
      },
      layouts: {
        elk: {
          algorithm: 'layered',
          direction: 'RIGHT',
          nodeSpacing: 32,
          layerSpacing: 110,
          edgeSpacing: 16,
        },
      },
      activeLayout: 'elk',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Microservices Topology' });
    onStoryTeardown(() => gui.destroy());

    gui
      .add(settings, 'showRpsLabels')
      .name('show RPS on edges')
      .onChange(reapplyEdges);

    gui
      .add(settings, 'animateDegraded')
      .name('animate degraded edges')
      .onChange(reapplyEdges);

    let degradationTimer: ReturnType<typeof setInterval> | null = null;
    onStoryTeardown(() => {
      if (degradationTimer) clearInterval(degradationTimer);
    });

    gui
      .add(settings, 'simulateDegradation')
      .name('simulate degradation')
      .onChange((on: boolean) => {
        if (on) {
          // Every 3s flip one random non-gateway service's health to
          // 'degraded' for a few seconds — visualises the live wiring
          // between data updates and state-config styling.
          degradationTimer = setInterval(() => {
            const candidates = microservices.nodes.filter(
              (n) => n.data.tier !== 'gateway' && n.data.tier !== 'external',
            );
            const victim = candidates[Math.floor(Math.random() * candidates.length)]!;
            graph.store.updateNode(victim.id, { states: ['degraded'] });
            setTimeout(() => {
              // Restore to dataset-authored health on rollback.
              graph.store.updateNode(victim.id, {
                states: healthStates(victim.data.health),
              });
            }, 2200);
          }, 3000);
        } else if (degradationTimer) {
          clearInterval(degradationTimer);
          degradationTimer = null;
        }
      });

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');

    // ── Helpers (kept inside play so they show in the code tab) ─────────
    function reapplyEdges(): void {
      for (const e of microservices.edges) {
        graph.store.updateEdge(e.id, { style: buildEdgeStyle(e.data) });
      }
    }

    function buildEdgeStyle(d: MicroservicesEdgeData): EdgeStyle {
      // Stroke width scales with log(rps) so a 6000 RPS edge is ~3× a
      // 100 RPS edge instead of 60×.
      const width = 1 + Math.log10(Math.max(1, d.rps)) * 0.55;
      const colour =
        d.errorRate >= 0.2 ? 0xdc2626 :
        d.errorRate >= 0.05 ? 0xea580c :
        d.errorRate >= 0.01 ? 0xf59e0b :
        0x94a3b8;
      const decorations: EdgeDecorationSpec[] = [];
      if (settings.animateDegraded && d.errorRate >= 0.05) {
        decorations.push({
          id: 'degraded-ants',
          kind: 'marching-ants-connector',
          color: colour,
          strokeWidth: width + 0.5,
          dashLength: 6,
        });
      }
      const labelText = settings.showRpsLabels && d.rps > 0 ? formatRps(d.rps) : undefined;
      return {
        shape: { pathType: 'rounded', pathStyleOpts: { radius: 8 } },
        strokeColor: colour,
        strokeWidth: width,
        strokeAlpha: d.errorRate >= 0.2 ? 0.95 : 0.7,
        arrowTargetShape: 'triangle',
        arrowTargetSize: 7,
        arrowTargetColor: colour,
        ...(decorations.length > 0 ? { decorations } : {}),
        ...(labelText !== undefined
          ? {
              labelText,
              labelColor: 0x64748b,
              labelFontSize: 9,
              labelBackgroundFill: 0xffffff,
              labelBackgroundAlpha: 0.85,
              labelBackgroundPadding: 2,
              labelBackgroundCornerRadius: 3,
            }
          : {}),
      };
    }

    function healthStates(h: MicroservicesHealth): readonly string[] | undefined {
      if (h === 'degraded') return ['degraded'];
      if (h === 'down') return ['down'];
      return undefined;
    }

    function formatRps(rps: number): string {
      if (rps >= 1000) return `${(rps / 1000).toFixed(1)}k`;
      return String(rps);
    }
  },
};
