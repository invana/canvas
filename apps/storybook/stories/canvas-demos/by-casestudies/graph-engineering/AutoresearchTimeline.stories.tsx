/**
 * **Graph engineering — autoresearch, one agent, one loop (Fig. 2).** Karpathy's
 * autoresearch ran 700 ML experiments in 48 hours and kept 20. Each dot is one
 * run, plotted at *when it finished* (x, hours) against its validation loss
 * (y, lower is better); the stepped line is **the best result kept so far**, and
 * it only ever moves when a run beats it. Run 514 — the 15th keeper — is called
 * out the moment it lands.
 *
 * **It plays back in time.** Twelve seconds of playback stand for the 48 hours:
 * every run carries a one-shot `fade-in` whose `delayMs` is its finish time, and
 * every step of the best-so-far line carries a one-shot `reveal-connector` timed
 * to the keeper it drops to — so the line draws itself down as the search finds
 * better runs. *Replay* remounts the board and plays it again.
 *
 * **Why the timing rides the records.** A fade's delay here *is* the run's
 * timestamp — a genuinely per-instance value with no type to key on (the one
 * exception `apps/storybook/CLAUDE.md` allows). Everything that is per *kind* —
 * ordinary run, the 30–36 h burst of runs that converged on run 514, keeper —
 * is a node type, and the axes, gridlines and captions are static marks.
 *
 * ⚠️ **The data is illustrative, not Karpathy's log.** The figure in the paper
 * is a sketch; the 700 runs are generated from a fixed seed with the same shape
 * (fast early gains, a long tail, 20 keepers, keeper 15 at run 514), so the
 * story is identical on every load.
 */

import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  GraphData,
  GraphEdge,
  GraphNode,
  NodeStructureRegistry,
  NodeStylingRegistry,
  NodeTypeRegistry,
} from '@invana/graph';
import { GraphCanvasApp, GraphControlsToolbar } from '@invana/canvas-ui';
import { Button } from '@invana/ui';
import { ThemeProvider } from '@invana/themes';

// `selfThemed`: pinned paper-white, like the figure.
const meta: Meta = {
  title: 'canvas-demos/by-casestudies/graph-engineering/AutoresearchTimeline',
  parameters: { selfThemed: true },
};
export default meta;
type Story = StoryObj;

export const AutoresearchTimelineStory: Story = {
  name: 'AutoresearchTimeline',
  render: function Render() {
    /** Bumped by *Replay* — a new key remounts the board, which replays every one-shot fade. */
    const [take, setTake] = useState(0);

    // ── Marks ───────────────────────────────────────────────────────────────
    const structures: NodeStructureRegistry = useMemo(() => ({
      run: { name: 'run', kind: 'simple', shape: { kind: 'circle', radius: 2.6 } },
      keeper: { name: 'keeper', kind: 'simple', shape: { kind: 'circle', radius: 5.5 } },
      note: { name: 'note', kind: 'simple', shape: { kind: 'rect', width: 2, height: 2 } },
    }), []);

    const stylings: NodeStylingRegistry = useMemo(() => ({
      run: { name: 'run', fill: 0xb4bfd3, stroke: 0xb4bfd3, strokeWidth: 0.5 },
      hot: { name: 'hot', fill: 0x5b86e5, stroke: 0x5b86e5, strokeWidth: 0.5 },
      keeper: { name: 'keeper', fill: 0x1f3a6e, stroke: 0xffffff, strokeWidth: 1.5 },
      title: { name: 'title', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
               label: { color: 0x0f172a, fontSize: 16, fontWeight: 700, placement: 'right',
                        fontFamily: 'Georgia, "Times New Roman", serif' } },
      meta: { name: 'meta', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
              label: { color: 0x475569, fontSize: 13, fontStyle: 'italic', placement: 'left',
                       fontFamily: 'Georgia, "Times New Roman", serif' } },
      tick: { name: 'tick', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
              label: { color: 0x64748b, fontSize: 12, placement: 'center',
                       fontFamily: 'Georgia, "Times New Roman", serif' } },
      yAxis: { name: 'yAxis', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
               label: { color: 0x64748b, fontSize: 12, fontStyle: 'italic', placement: 'center',
                        rotation: -1.5708, fontFamily: 'Georgia, "Times New Roman", serif' } },
      callout: { name: 'callout', fill: 0x3b6fd8, stroke: 0x3b6fd8, strokeWidth: 0.5,
                 label: { color: 0xffffff, fontSize: 13, fontWeight: 700, placement: 'center',
                          background: true, backgroundColor: 0x3b6fd8 } },
      blank: { name: 'blank', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5 },
    }), []);

    const types: NodeTypeRegistry = useMemo(() => ({
      run: { structure: 'run', styling: 'run', bindings: {} },
      // The 30–36 h burst that converged on run 514.
      hot: { structure: 'run', styling: 'hot', bindings: {} },
      keeper: { structure: 'keeper', styling: 'keeper', bindings: {} },
      title: { structure: 'note', styling: 'title', bindings: { label: 'data.label' } },
      meta: { structure: 'note', styling: 'meta', bindings: { label: 'data.label' } },
      tick: { structure: 'note', styling: 'tick', bindings: { label: 'data.label' } },
      yAxis: { structure: 'note', styling: 'yAxis', bindings: { label: 'data.label' } },
      callout: { structure: 'note', styling: 'callout', bindings: { label: 'data.label' } },
      anchor: { structure: 'note', styling: 'blank', bindings: {} },
    }), []);

    // ── 700 runs, generated from a fixed seed ───────────────────────────────
    /**
     * Plot space: x = hours × 20 (0–960 px), y = loss mapped so 1.06 sits at the
     * top (0) and 0.76 at the bottom (360). Playback: a run fades up
     * `600 + hours / 48 × 12 000` ms after mount.
     */
    const data: GraphData = useMemo(() => {
      let seed = 0x5eed514;
      const rand = (): number => {
        seed = (seed + 0x6d2b79f5) | 0;
        let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
      const X = (hours: number): number => hours * 20;
      const Y = (loss: number): number => ((1.06 - loss) / 0.3) * 360;
      const delay = (hours: number): number => Math.round(600 + (hours / 48) * 12000);

      // The 20 keepers — dense early, a long tail, the 15th is run 514.
      const keeperRuns = [0, 6, 11, 16, 24, 70, 78, 88, 100, 112, 150, 190, 236, 300, 514, 560, 602, 640, 668, 690];
      const keeperSet = new Set(keeperRuns);

      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      const keepers: Array<{ id: string; x: number; y: number; hours: number }> = [];
      let best = 1.0;
      let keeperIndex = 0;

      for (let i = 0; i < 700; i++) {
        const hours = Math.min(47.9, ((i + 0.5) / 700) * 48 + (rand() - 0.5) * 0.06);
        let loss: number;
        let type = hours >= 30 && hours <= 36 ? 'hot' : 'run';
        if (keeperSet.has(i)) {
          // A keeper beats the best so far, by less each time.
          if (keeperIndex > 0) best -= 0.03 * Math.pow(0.86, keeperIndex - 1);
          loss = best;
          type = 'keeper';
          keeperIndex += 1;
        } else if (rand() < 0.06) {
          loss = 0.96 + rand() * 0.09; // a crashed / diverged run
        } else {
          loss = Math.min(1.05, best + 0.004 + -Math.log(1 - rand()) * 0.03);
        }
        const id = `run-${i}`;
        nodes.push({
          id,
          type,
          position: { x: X(hours), y: Y(loss) },
          data: { run: i, hours: Number(hours.toFixed(2)), loss: Number(loss.toFixed(4)) },
          style: { effects: { 'fade-in': { delayMs: delay(hours), durationMs: type === 'keeper' ? 500 : 280 } } },
        });
        if (type === 'keeper') keepers.push({ id, x: X(hours), y: Y(loss), hours });
      }

      // The best-so-far line: across at the old best, then down to the new keeper.
      for (let k = 1; k < keepers.length; k++) {
        const a = keepers[k - 1]!;
        const b = keepers[k]!;
        edges.push({
          id: `best-${k}`,
          source: a.id,
          target: b.id,
          type: 'best',
          style: {
            shape: { pathType: 'straight', sourceAnchor: 'center', targetAnchor: 'center',
                     waypoints: [{ x: b.x, y: a.y }] },
            decorations: [{ id: 'draw', kind: 'reveal-connector', durationMs: 260,
                            delayMs: delay(b.hours) - 260, easing: 'linear' }],
          },
        });
      }
      const last = keepers[keepers.length - 1]!;
      nodes.push({ id: 'best-end', type: 'anchor', position: { x: 960, y: last.y } });
      edges.push({
        id: 'best-tail',
        source: last.id,
        target: 'best-end',
        type: 'best',
        style: {
          shape: { pathType: 'straight', sourceAnchor: 'center', targetAnchor: 'center' },
          decorations: [{ id: 'draw', kind: 'reveal-connector', durationMs: 900, delayMs: delay(last.hours),
                          easing: 'linear' }],
        },
      });

      // Run 514 — keeper 15 — called out the moment it lands.
      const star = keepers[14]!;
      nodes.push(
        { id: 'callout-top', type: 'anchor', position: { x: star.x, y: -14 } },
        { id: 'callout-foot', type: 'anchor', position: { x: star.x, y: 360 } },
        { id: 'callout', type: 'callout', position: { x: star.x, y: -30 },
          data: { label: '  run 514 · kept 15  ' },
          style: { effects: { 'fade-in': { delayMs: delay(star.hours), durationMs: 400 } } } },
      );
      edges.push({
        id: 'callout-rule',
        source: 'callout-top',
        target: 'callout-foot',
        type: 'rule',
        style: { strokeColor: 0x3b6fd8, strokeWidth: 1.5,
                 effects: { 'fade-in-connector': { delayMs: delay(star.hours), durationMs: 400 } } },
      });

      // Axes, gridlines and captions — static.
      nodes.push(
        { id: 'title', type: 'title', position: { x: 0, y: -70 }, data: { label: 'autoresearch, one agent, one loop' } },
        { id: 'meta', type: 'meta', position: { x: 960, y: -70 }, data: { label: '700 runs    20 kept    48 h' } },
        { id: 'y-label', type: 'yAxis', position: { x: -28, y: 180 }, data: { label: 'val. loss, lower is better' } },
        { id: 'origin', type: 'anchor', position: { x: 0, y: 372 } },
        { id: 'x-end', type: 'anchor', position: { x: 968, y: 372 } },
        { id: 'y-top', type: 'anchor', position: { x: 0, y: -20 } },
        { id: 't0', type: 'tick', position: { x: 0, y: 392 }, data: { label: '0 h' } },
        { id: 't12', type: 'tick', position: { x: 240, y: 392 }, data: { label: '12 h' } },
        { id: 't24', type: 'tick', position: { x: 480, y: 392 }, data: { label: '24 h' } },
        { id: 't36', type: 'tick', position: { x: 720, y: 392 }, data: { label: '36 h' } },
        { id: 't48', type: 'tick', position: { x: 960, y: 392 }, data: { label: '48 h' } },
        { id: 'g12-top', type: 'anchor', position: { x: 240, y: -20 } },
        { id: 'g12-foot', type: 'anchor', position: { x: 240, y: 372 } },
        { id: 'g24-top', type: 'anchor', position: { x: 480, y: -20 } },
        { id: 'g24-foot', type: 'anchor', position: { x: 480, y: 372 } },
        { id: 'g36-top', type: 'anchor', position: { x: 720, y: -20 } },
        { id: 'g36-foot', type: 'anchor', position: { x: 720, y: 372 } },
      );
      edges.push(
        { id: 'x-axis', source: 'origin', target: 'x-end', type: 'axis', style: { strokeColor: 0x334155 } },
        { id: 'y-axis', source: 'origin', target: 'y-top', type: 'axis', style: { strokeColor: 0x334155 } },
        { id: 'g12', source: 'g12-top', target: 'g12-foot', type: 'grid',
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, strokeDashArray: [3, 4] } },
        { id: 'g24', source: 'g24-top', target: 'g24-foot', type: 'grid',
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, strokeDashArray: [3, 4] } },
        { id: 'g36', source: 'g36-top', target: 'g36-foot', type: 'grid',
          style: { strokeColor: 0xcbd5e1, strokeWidth: 1, strokeDashArray: [3, 4] } },
      );

      return { nodes, edges };
    }, []);

    // ── The canvas ──────────────────────────────────────────────────────────
    const config = useMemo(() => ({
      activeLayout: '',
      layers: {
        background: { type: 'solid', backgroundColor: '#ffffff' },
        graph: {
          nodeStructureTemplates: structures,
          nodeStylingTemplates: stylings,
          nodeTypes: types,
          edge: {
            // The best-so-far line; axes, grid and the callout rule override it.
            style: {
              strokeColor: 0x1f3a6e,
              strokeWidth: 2.4,
              arrowTargetShape: 'none',
              shape: { pathType: 'straight', sourceAnchor: 'center', targetAnchor: 'center' },
            },
          },
        },
      },
      behaviours: {
        color: { enabled: false },
        hover: { enabled: false },
        'drag-node': { enabled: false },
      },
    }), [structures, stylings, types]);

    return (
      <ThemeProvider defaultMode="light" storageKey={null}>
        <GraphCanvasApp
          key={take}
          data={data}
          config={config}
          header={{
            title: 'Fig. 2 — Autoresearch over two days',
            center: <GraphControlsToolbar />,
            right: (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs">Each dot is one run; the line is the best result kept so far.</span>
                <Button size="sm" variant="outline" onClick={() => setTake((t) => t + 1)}>Replay</Button>
              </div>
            ),
          }}
        />
      </ThemeProvider>
    );
  },
};
