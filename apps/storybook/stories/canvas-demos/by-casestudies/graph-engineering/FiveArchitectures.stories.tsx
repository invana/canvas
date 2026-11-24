/**
 * **Graph engineering — five architectures (Fig. 3).** "What each architecture
 * externalizes": a **loop** externalizes iteration, a **chain** task order, a
 * **swarm** parallel search, a **DAG** the lineage of results, and a **graph**
 * shared state. Five small diagrams on one canvas, each animated so its motion
 * *is* the bottleneck it externalizes:
 *
 * | Panel | Motion | Engine piece |
 * |---|---|---|
 * | LOOP  | dashes crawl round the ring the LLM sits in | `marching-ants` on a ring node |
 * | CHAIN | 1 → 2 → 3 swell in turn, a bead rides each hand-off | `breathing` with a per-step `phaseOffsetMs` + `flow-particles-connector` |
 * | SWARM | beads fan out from one node to six at once | `flow-particles-connector` on every spoke |
 * | DAG   | one lineage path glows and carries beads; the rest stays quiet | `glow-connector` + `flow-particles-connector` on the traced edges |
 * | GRAPH | the hub pings while every spoke feeds it | `pulse-ring` on the hub + inbound `flow-particles-connector` |
 *
 * **Looks are per type.** Each mark is a `simple` structure (`ring`, `llm`,
 * `square`, `dot`, `dotLg`) worn with a styling (`ink`, `accent`, `paper`), and
 * the captions are 2×2 label holders whose serif text binds `data.label`. The
 * motion lives on state overlays (`orbit`, `step1`–`step3`, `hub`) because a
 * styling template has no `decorations` / `effects` seat — so those records
 * carry `states`, the one data path a per-type animation has today. Edges have
 * no type registry, so the few animated edges carry their decorations inline.
 *
 * ⚠️ A `rect` mark is positioned by its **top-left**, a `circle` by its centre —
 * so the LLM box and the chain squares sit half their size up-left of centre.
 *
 * Positions are authored (`activeLayout: ''`); `EntranceBehaviour` sweeps the
 * five panels in left to right, and *Replay* in the header plays it again.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  EntranceBehaviour,
  GraphCanvas,
  GraphData,
  NodeStructureRegistry,
  NodeStylingRegistry,
  NodeTypeRegistry,
} from '@invana/graph';
import { GraphCanvasApp, GraphControlsToolbar } from '@invana/canvas-ui';
import { Button } from '@invana/ui';
import { ThemeProvider } from '@invana/themes';

// `selfThemed`: pinned paper-white, like the figure.
const meta: Meta = {
  title: 'canvas-demos/by-casestudies/graph-engineering/FiveArchitectures',
  parameters: { selfThemed: true },
};
export default meta;
type Story = StoryObj;

export const FiveArchitecturesStory: Story = {
  name: 'FiveArchitectures',
  render: function Render() {
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

    // ── Marks ───────────────────────────────────────────────────────────────
    const structures: NodeStructureRegistry = useMemo(() => ({
      ring: { name: 'ring', kind: 'simple', shape: { kind: 'circle', radius: 58 } },
      llm: { name: 'llm', kind: 'simple', shape: { kind: 'rect', width: 58, height: 32, cornerRadius: 6 } },
      square: { name: 'square', kind: 'simple', shape: { kind: 'rect', width: 36, height: 36, cornerRadius: 4 } },
      dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 9 } },
      dotLg: { name: 'dotLg', kind: 'simple', shape: { kind: 'circle', radius: 15 } },
      // A label holder: a 2×2 body that paints the page colour.
      note: { name: 'note', kind: 'simple', shape: { kind: 'rect', width: 2, height: 2 } },
    }), []);

    const stylings: NodeStylingRegistry = useMemo(() => ({
      ink: { name: 'ink', fill: 0x0f172a, stroke: 0x0f172a, strokeWidth: 1.5,
             label: { color: 0xffffff, fontSize: 12, fontWeight: 700, placement: 'center' } },
      accent: { name: 'accent', fill: 0x3b6fd8, stroke: 0x1f3a6e, strokeWidth: 1.5,
                label: { color: 0xffffff, fontSize: 14, fontWeight: 700, placement: 'center' } },
      paper: { name: 'paper', fill: 0xffffff, stroke: 0x1f3a6e, strokeWidth: 1.5,
               label: { color: 0x0f172a, fontSize: 14, fontWeight: 700, placement: 'center' } },
      hollow: { name: 'hollow', fill: 0xffffff, stroke: 0x1f3a6e, strokeWidth: 2 },
      // The loop's track: a pale rim so the crawling dashes read.
      track: { name: 'track', fill: 0xffffff, stroke: 0xdbe4f3, strokeWidth: 3 },
      heading: { name: 'heading', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
                 label: { color: 0x1f3a6e, fontSize: 18, fontWeight: 700, placement: 'center',
                          fontFamily: 'Georgia, "Times New Roman", serif' } },
      gloss: { name: 'gloss', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
               label: { color: 0x475569, fontSize: 14, fontStyle: 'italic', placement: 'center',
                        fontFamily: 'Georgia, "Times New Roman", serif' } },
      banner: { name: 'banner', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
                label: { color: 0x0f172a, fontSize: 15, fontWeight: 700, placement: 'center',
                         fontFamily: 'Georgia, "Times New Roman", serif' } },
    }), []);

    const types: NodeTypeRegistry = useMemo(() => ({
      ring: { structure: 'ring', styling: 'track', bindings: {} },
      llm: { structure: 'llm', styling: 'ink', bindings: { label: 'data.label' } },
      step: { structure: 'square', styling: 'paper', bindings: { label: 'data.label' } },
      stepDone: { structure: 'square', styling: 'accent', bindings: { label: 'data.label' } },
      origin: { structure: 'dotLg', styling: 'ink', bindings: {} },
      worker: { structure: 'dot', styling: 'hollow', bindings: {} },
      result: { structure: 'dotLg', styling: 'accent', bindings: {} },
      heading: { structure: 'note', styling: 'heading', bindings: { label: 'data.label' } },
      gloss: { structure: 'note', styling: 'gloss', bindings: { label: 'data.label' } },
      banner: { structure: 'note', styling: 'banner', bindings: { label: 'data.label' } },
      anchor: { structure: 'note', styling: 'gloss', bindings: {} },
    }), []);

    // ── The five panels (centres at x = 150 · 450 · 750 · 1050 · 1350) ─────
    const data: GraphData = useMemo(() => ({
      nodes: [
        { id: 'banner', type: 'banner', position: { x: 750, y: 40 },
          data: { label: 'W H A T   E A C H   A R C H I T E C T U R E   E X T E R N A L I Z E S' } },

        // Panel dividers — invisible endpoints joined by a hairline.
        { id: 'div1-a', type: 'anchor', position: { x: 300, y: 80 } },
        { id: 'div1-b', type: 'anchor', position: { x: 300, y: 400 } },
        { id: 'div2-a', type: 'anchor', position: { x: 600, y: 80 } },
        { id: 'div2-b', type: 'anchor', position: { x: 600, y: 400 } },
        { id: 'div3-a', type: 'anchor', position: { x: 900, y: 80 } },
        { id: 'div3-b', type: 'anchor', position: { x: 900, y: 400 } },
        { id: 'div4-a', type: 'anchor', position: { x: 1200, y: 80 } },
        { id: 'div4-b', type: 'anchor', position: { x: 1200, y: 400 } },

        // LOOP — the LLM inside a ring that never stops turning.
        { id: 'loop-ring', type: 'ring', position: { x: 150, y: 200 }, states: ['orbit'] },
        { id: 'loop-llm', type: 'llm', position: { x: 121, y: 184 }, data: { label: 'LLM' } },
        { id: 'loop-h', type: 'heading', position: { x: 150, y: 335 }, data: { label: 'LOOP' } },
        { id: 'loop-g', type: 'gloss', position: { x: 150, y: 362 }, data: { label: 'iteration' } },

        // CHAIN — three steps in a fixed order.
        { id: 'chain-1', type: 'step', position: { x: 362, y: 182 }, states: ['step1'], data: { label: '1' } },
        { id: 'chain-2', type: 'step', position: { x: 432, y: 182 }, states: ['step2'], data: { label: '2' } },
        { id: 'chain-3', type: 'stepDone', position: { x: 502, y: 182 }, states: ['step3'], data: { label: '3' } },
        { id: 'chain-h', type: 'heading', position: { x: 450, y: 335 }, data: { label: 'CHAIN' } },
        { id: 'chain-g', type: 'gloss', position: { x: 450, y: 362 }, data: { label: 'task order' } },

        // SWARM — one origin, six parallel searchers.
        { id: 'swarm-o', type: 'origin', position: { x: 670, y: 200 } },
        { id: 'swarm-1', type: 'worker', position: { x: 830, y: 110 } },
        { id: 'swarm-2', type: 'worker', position: { x: 845, y: 146 } },
        { id: 'swarm-3', type: 'worker', position: { x: 852, y: 182 } },
        { id: 'swarm-4', type: 'worker', position: { x: 852, y: 218 } },
        { id: 'swarm-5', type: 'worker', position: { x: 845, y: 254 } },
        { id: 'swarm-6', type: 'worker', position: { x: 830, y: 290 } },
        { id: 'swarm-h', type: 'heading', position: { x: 750, y: 335 }, data: { label: 'SWARM' } },
        { id: 'swarm-g', type: 'gloss', position: { x: 750, y: 362 }, data: { label: 'parallel search' } },

        // DAG — a diamond lattice; one path through it is the result's lineage.
        { id: 'dag-s', type: 'origin', position: { x: 950, y: 200 } },
        { id: 'dag-u1', type: 'worker', position: { x: 1000, y: 150 } },
        { id: 'dag-d1', type: 'worker', position: { x: 1000, y: 250 } },
        { id: 'dag-m', type: 'worker', position: { x: 1050, y: 200 } },
        { id: 'dag-u2', type: 'worker', position: { x: 1100, y: 150 } },
        { id: 'dag-d2', type: 'worker', position: { x: 1100, y: 250 } },
        { id: 'dag-t', type: 'result', position: { x: 1150, y: 200 } },
        { id: 'dag-h', type: 'heading', position: { x: 1050, y: 335 }, data: { label: 'DAG' } },
        { id: 'dag-g', type: 'gloss', position: { x: 1050, y: 362 }, data: { label: 'lineage' } },

        // GRAPH — a pentagon of peers around one shared hub.
        { id: 'graph-hub', type: 'origin', position: { x: 1350, y: 205 }, states: ['hub'] },
        { id: 'graph-p1', type: 'worker', position: { x: 1350, y: 125 } },
        { id: 'graph-p2', type: 'worker', position: { x: 1426, y: 180 } },
        { id: 'graph-p3', type: 'worker', position: { x: 1397, y: 270 } },
        { id: 'graph-p4', type: 'worker', position: { x: 1303, y: 270 } },
        { id: 'graph-p5', type: 'worker', position: { x: 1274, y: 180 } },
        { id: 'graph-h', type: 'heading', position: { x: 1350, y: 335 }, data: { label: 'GRAPH' } },
        { id: 'graph-g', type: 'gloss', position: { x: 1350, y: 362 }, data: { label: 'shared state' } },
      ],

      edges: [
        // Dividers: plain hairlines, no arrowhead.
        { id: 'div1', source: 'div1-a', target: 'div1-b', type: 'divider',
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
        { id: 'div2', source: 'div2-a', target: 'div2-b', type: 'divider',
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
        { id: 'div3', source: 'div3-a', target: 'div3-b', type: 'divider',
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
        { id: 'div4', source: 'div4-a', target: 'div4-b', type: 'divider',
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },

        // CHAIN hand-offs — one bead per step.
        { id: 'chain-12', source: 'chain-1', target: 'chain-2', type: 'next',
          style: { decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x3b6fd8,
                                   count: 1, size: 6, speedPxPerSec: 34 }] } },
        { id: 'chain-23', source: 'chain-2', target: 'chain-3', type: 'next',
          style: { decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x3b6fd8,
                                   count: 1, size: 6, speedPxPerSec: 34, phase: 0.5 }] } },

        // SWARM fan-out — every spoke streams at once.
        { id: 'swarm-e1', source: 'swarm-o', target: 'swarm-1', type: 'spawn',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80 }] } },
        { id: 'swarm-e2', source: 'swarm-o', target: 'swarm-2', type: 'spawn',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.15 }] } },
        { id: 'swarm-e3', source: 'swarm-o', target: 'swarm-3', type: 'spawn',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.3 }] } },
        { id: 'swarm-e4', source: 'swarm-o', target: 'swarm-4', type: 'spawn',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.45 }] } },
        { id: 'swarm-e5', source: 'swarm-o', target: 'swarm-5', type: 'spawn',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.6 }] } },
        { id: 'swarm-e6', source: 'swarm-o', target: 'swarm-6', type: 'spawn',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.75 }] } },

        // DAG — the traced lineage (s → u1 → m → d2 → t) glows and flows…
        { id: 'dag-s-u1', source: 'dag-s', target: 'dag-u1', type: 'derives',
          style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                   decorations: [{ id: 'glow', kind: 'glow-connector', color: 0x6b93ff, radius: 7, innerAlpha: 0.35,
                                   pulse: { periodMs: 1600, amplitude: 0.6 } },
                                 { id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                   count: 1, size: 5, speedPxPerSec: 60 }] } },
        { id: 'dag-u1-m', source: 'dag-u1', target: 'dag-m', type: 'derives',
          style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                   decorations: [{ id: 'glow', kind: 'glow-connector', color: 0x6b93ff, radius: 7, innerAlpha: 0.35,
                                   pulse: { periodMs: 1600, amplitude: 0.6 } },
                                 { id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                   count: 1, size: 5, speedPxPerSec: 60, phase: 0.25 }] } },
        { id: 'dag-m-d2', source: 'dag-m', target: 'dag-d2', type: 'derives',
          style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                   decorations: [{ id: 'glow', kind: 'glow-connector', color: 0x6b93ff, radius: 7, innerAlpha: 0.35,
                                   pulse: { periodMs: 1600, amplitude: 0.6 } },
                                 { id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                   count: 1, size: 5, speedPxPerSec: 60, phase: 0.5 }] } },
        { id: 'dag-d2-t', source: 'dag-d2', target: 'dag-t', type: 'derives',
          style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                   decorations: [{ id: 'glow', kind: 'glow-connector', color: 0x6b93ff, radius: 7, innerAlpha: 0.35,
                                   pulse: { periodMs: 1600, amplitude: 0.6 } },
                                 { id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                   count: 1, size: 5, speedPxPerSec: 60, phase: 0.75 }] } },
        // …while the branches it did not take stay quiet.
        { id: 'dag-s-d1', source: 'dag-s', target: 'dag-d1', type: 'derives', style: { arrowTargetShape: 'none' } },
        { id: 'dag-d1-m', source: 'dag-d1', target: 'dag-m', type: 'derives', style: { arrowTargetShape: 'none' } },
        { id: 'dag-m-u2', source: 'dag-m', target: 'dag-u2', type: 'derives', style: { arrowTargetShape: 'none' } },
        { id: 'dag-u2-t', source: 'dag-u2', target: 'dag-t', type: 'derives', style: { arrowTargetShape: 'none' } },

        // GRAPH — the peer ring…
        { id: 'graph-r12', source: 'graph-p1', target: 'graph-p2', type: 'peer', style: { arrowTargetShape: 'none' } },
        { id: 'graph-r23', source: 'graph-p2', target: 'graph-p3', type: 'peer', style: { arrowTargetShape: 'none' } },
        { id: 'graph-r34', source: 'graph-p3', target: 'graph-p4', type: 'peer', style: { arrowTargetShape: 'none' } },
        { id: 'graph-r45', source: 'graph-p4', target: 'graph-p5', type: 'peer', style: { arrowTargetShape: 'none' } },
        { id: 'graph-r51', source: 'graph-p5', target: 'graph-p1', type: 'peer', style: { arrowTargetShape: 'none' } },
        // …and every peer writing into the shared hub.
        { id: 'graph-s1', source: 'graph-p1', target: 'graph-hub', type: 'shares',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45 }] } },
        { id: 'graph-s2', source: 'graph-p2', target: 'graph-hub', type: 'shares',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.2 }] } },
        { id: 'graph-s3', source: 'graph-p3', target: 'graph-hub', type: 'shares',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.4 }] } },
        { id: 'graph-s4', source: 'graph-p4', target: 'graph-hub', type: 'shares',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.6 }] } },
        { id: 'graph-s5', source: 'graph-p5', target: 'graph-hub', type: 'shares',
          style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                   color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.8 }] } },
      ],
    }), []);

    // ── The canvas ──────────────────────────────────────────────────────────
    const config = useMemo(() => ({
      activeLayout: '',
      layers: {
        background: { type: 'pattern', patternType: 'dots', backgroundColor: '#ffffff',
                      color: '#eef2f7', spacing: 28, size: 1 },
        graph: {
          nodeStructureTemplates: structures,
          nodeStylingTemplates: stylings,
          nodeTypes: types,
          node: {
            state: {
              // LOOP: dashes crawl round the ring — iteration that never ends.
              orbit: {
                decorations: [
                  { id: 'orbit', kind: 'marching-ants', color: 0x3b6fd8, strokeWidth: 3,
                    dashLength: 22, gapLength: 16, speedPxPerSec: 70, inset: 0 },
                ],
              },
              // CHAIN: the same swell, one step behind the last — the order is the point.
              step1: { effects: { breathing: { amplitude: 0.12, periodMs: 1500, phaseOffsetMs: 0 } } },
              step2: { effects: { breathing: { amplitude: 0.12, periodMs: 1500, phaseOffsetMs: 500 } } },
              step3: { effects: { breathing: { amplitude: 0.12, periodMs: 1500, phaseOffsetMs: 1000 } } },
              // GRAPH: the shared hub pings.
              hub: {
                decorations: [
                  { id: 'hub-pulse', kind: 'pulse-ring', color: 0x3b6fd8, maxRadius: 26,
                    periodMs: 1800, rings: 2, strokeWidth: 2, innerAlpha: 0.6 },
                ],
              },
            },
          },
          edge: {
            style: {
              strokeColor: 0x1f3a6e,
              strokeWidth: 1.5,
              arrowTargetShape: 'triangle',
              arrowTargetSize: 7,
              arrowTargetColor: 0x1f3a6e,
              shape: { pathType: 'straight', sourceAnchor: 'boundary', targetAnchor: 'boundary' },
            },
          },
        },
      },
      behaviours: {
        color: { enabled: false },
        hover: { enabled: false },
        entrance: { enabled: true, order: 'x', durationMs: 450, staggerMs: 30, maxStaggerMs: 2200,
                    includeEdges: true, easing: 'easeOutCubic' },
      },
    }), [structures, stylings, types]);

    const onReady = useCallback((next: GraphCanvas | null) => {
      setCanvas(next);
      if (!next) return;
      // The light palette rewrites the edge template's stroke — reassert the ink.
      next.update({
        layers: {
          background: { backgroundColor: '#ffffff' },
          graph: { edge: { style: { strokeColor: 0x1f3a6e, arrowTargetColor: 0x1f3a6e } } },
        },
      });
    }, []);

    const replay = useCallback(() => {
      (canvas?.behaviours.get('entrance') as EntranceBehaviour | undefined)?.replay();
    }, [canvas]);

    return (
      <ThemeProvider defaultMode="light" storageKey={null}>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Fig. 3 — Five architectures, five externalized bottlenecks',
            center: <GraphControlsToolbar />,
            right: <Button size="sm" variant="outline" onClick={replay}>Replay</Button>,
          }}
        />
      </ThemeProvider>
    );
  },
};
