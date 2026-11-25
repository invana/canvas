/**
 * **Graph engineering — from loop to graph (the progression).** The paper's
 * staged build path, played as a **playbook**: start from one direct call, then
 * promote one rung at a time — a loop, a chain, a swarm, a DAG, a graph — each
 * rung externalizing a different bottleneck and multiplying the token bill
 * (Fig. 4: loop 2–4×, multi-agent 5–10×, graph system 10–50×). *Promote only
 * when the gain is measured.*
 *
 * **The canvas starts empty; the playbook builds it.** Each step is plain JSON:
 *
 *   - `data.added` lands that rung's diagram plus the dashed arrow from the rung
 *     before it — the progression is literally a graph growing;
 *   - `view.focus` + `camera: 'focus'` (via `FocusBehaviour`) frame the new rung
 *     and dim the rest; the last step pulls back to the whole staircase;
 *   - `narration` is what the right-hand `PlaybookViewPanel` reads out.
 *
 * *Play* beside the panel's ◀ ▶ steps through on a timer (any key or click stops
 * it); ◀ ▶ step by hand,
 * and stepping back **reverts** a rung (its delta is undone).
 *
 * **Every new mark arrives animated, from config alone:** the layer's node
 * template carries a one-shot `fade-in` and the edge template a one-shot
 * `reveal-connector`, so each added node fades up and each added edge draws
 * itself in. The rung motions are the same state overlays as `FiveArchitectures`
 * (`orbit`, `step1`–`step3`, `hub`) — the records carry `states` because a
 * styling template has no decoration seat; edges have no type registry, so the
 * animated ones carry their decorations inline.
 *
 * ⚠️ A `rect` mark is positioned by its top-left, a `circle` by its centre.
 */

import { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig, PlaybookSpec } from '@invana/canvas';
import {
  FocusBehaviour,
  type GraphCanvas,
  type GraphData,
  type NodeStructureRegistry,
  type NodeStylingRegistry,
  type NodeTypeRegistry,
} from '@invana/graph';
import { GraphCanvasApp, PlaybookViewPanel } from '@invana/canvas-ui';
import { ThemeProvider } from '@invana/themes';

// `selfThemed`: pinned paper-white, like the figures.
const meta: Meta = {
  title: 'canvas-demos/by-casestudies/graph-engineering/ArchitectureProgression',
  parameters: { selfThemed: true },
};
export default meta;
type Story = StoryObj;

export const ArchitectureProgressionStory: Story = {
  name: 'ArchitectureProgression',
  render: function Render() {

    // ── Marks (rung centres at x = 0 · 330 · 660 · 990 · 1320 · 1650) ───────
    const structures: NodeStructureRegistry = useMemo(() => ({
      ring: { name: 'ring', kind: 'simple', shape: { kind: 'circle', radius: 54 } },
      llm: { name: 'llm', kind: 'simple', shape: { kind: 'rect', width: 58, height: 32, cornerRadius: 6 } },
      square: { name: 'square', kind: 'simple', shape: { kind: 'rect', width: 36, height: 36, cornerRadius: 4 } },
      dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 9 } },
      dotLg: { name: 'dotLg', kind: 'simple', shape: { kind: 'circle', radius: 15 } },
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
      track: { name: 'track', fill: 0xffffff, stroke: 0xdbe4f3, strokeWidth: 3 },
      heading: { name: 'heading', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
                 label: { color: 0x1f3a6e, fontSize: 18, fontWeight: 700, placement: 'center',
                          fontFamily: 'Georgia, "Times New Roman", serif' } },
      gloss: { name: 'gloss', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
               label: { color: 0x475569, fontSize: 14, fontStyle: 'italic', placement: 'center',
                        fontFamily: 'Georgia, "Times New Roman", serif' } },
      cost: { name: 'cost', fill: 0xffffff, stroke: 0xffffff, strokeWidth: 0.5,
              label: { color: 0x3b6fd8, fontSize: 15, fontWeight: 700, placement: 'center' } },
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
      cost: { structure: 'note', styling: 'cost', bindings: { label: 'data.label' } },
      anchor: { structure: 'note', styling: 'gloss', bindings: {} },
    }), []);

    /** The board starts empty — every mark arrives through a playbook step. */
    const data: GraphData = useMemo(() => ({ nodes: [], edges: [] }), []);

    // ── The script ──────────────────────────────────────────────────────────
    const playbook: PlaybookSpec<CanvasConfig> = useMemo(() => ({
      version: 1,
      title: 'From loop to graph',
      source: 'graph',
      steps: [
        {
          id: 'direct',
          title: 'Direct call · 1×',
          narration: 'One prompt, one answer. The baseline every rung above is measured against.',
          data: {
            added: {
              nodes: [
                { id: 'a-prompt', type: 'worker', position: { x: -60, y: 0 } },
                { id: 'a-llm', type: 'llm', position: { x: 1, y: -16 }, data: { label: 'LLM' } },
                { id: 'a-h', type: 'heading', position: { x: 0, y: 120 }, data: { label: 'DIRECT CALL' } },
                { id: 'a-g', type: 'gloss', position: { x: 0, y: 146 }, data: { label: 'one shot' } },
                { id: 'a-c', type: 'cost', position: { x: 0, y: 174 }, data: { label: '1×' } },
                { id: 'a-out', type: 'anchor', position: { x: 90, y: 120 } },
              ],
              edges: [
                { id: 'a-e', source: 'a-prompt', target: 'a-llm', type: 'prompt' },
              ],
            },
          },
          view: { focus: { ids: ['a-prompt', 'a-llm', 'a-h', 'a-g', 'a-c'], dim: true }, camera: 'focus' },
        },
        {
          id: 'loop',
          title: 'Loop · 2–4×',
          narration: 'autoresearch: one agent, one loop — 700 experiments in two days, 20 kept. A loop externalizes iteration.',
          data: {
            added: {
              nodes: [
                { id: 'b-ring', type: 'ring', position: { x: 330, y: 0 }, states: ['orbit'] },
                { id: 'b-llm', type: 'llm', position: { x: 301, y: -16 }, data: { label: 'LLM' } },
                { id: 'b-h', type: 'heading', position: { x: 330, y: 120 }, data: { label: 'LOOP' } },
                { id: 'b-g', type: 'gloss', position: { x: 330, y: 146 }, data: { label: 'iteration' } },
                { id: 'b-c', type: 'cost', position: { x: 330, y: 174 }, data: { label: '2–4×' } },
                { id: 'b-in', type: 'anchor', position: { x: 240, y: 120 } },
                { id: 'b-out', type: 'anchor', position: { x: 420, y: 120 } },
              ],
              edges: [
                { id: 'ab', source: 'a-out', target: 'b-in', type: 'promote',
                  style: { strokeDashArray: [5, 4], strokeColor: 0x94a3b8, arrowTargetColor: 0x94a3b8 } },
              ],
            },
          },
          view: { focus: { ids: ['b-ring', 'b-llm', 'b-h', 'b-g', 'b-c'], dim: true }, camera: 'focus' },
        },
        {
          id: 'chain',
          title: 'Chain · tools + planning',
          narration: 'Add tools and a planner. A chain externalizes task order: 1 → 2 → 3, always in sequence.',
          data: {
            added: {
              nodes: [
                { id: 'c-1', type: 'step', position: { x: 572, y: -18 }, states: ['step1'], data: { label: '1' } },
                { id: 'c-2', type: 'step', position: { x: 642, y: -18 }, states: ['step2'], data: { label: '2' } },
                { id: 'c-3', type: 'stepDone', position: { x: 712, y: -18 }, states: ['step3'], data: { label: '3' } },
                { id: 'c-h', type: 'heading', position: { x: 660, y: 120 }, data: { label: 'CHAIN' } },
                { id: 'c-g', type: 'gloss', position: { x: 660, y: 146 }, data: { label: 'task order' } },
                { id: 'c-c', type: 'cost', position: { x: 660, y: 174 }, data: { label: '≈ 8-step planner, ~19k tokens' } },
                { id: 'c-in', type: 'anchor', position: { x: 570, y: 120 } },
                { id: 'c-out', type: 'anchor', position: { x: 750, y: 120 } },
              ],
              edges: [
                { id: 'bc', source: 'b-out', target: 'c-in', type: 'promote',
                  style: { strokeDashArray: [5, 4], strokeColor: 0x94a3b8, arrowTargetColor: 0x94a3b8 } },
                { id: 'c-12', source: 'c-1', target: 'c-2', type: 'next',
                  style: { decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x3b6fd8,
                                           count: 1, size: 6, speedPxPerSec: 34 }] } },
                { id: 'c-23', source: 'c-2', target: 'c-3', type: 'next',
                  style: { decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x3b6fd8,
                                           count: 1, size: 6, speedPxPerSec: 34, phase: 0.5 }] } },
              ],
            },
          },
          view: { focus: { ids: ['c-1', 'c-2', 'c-3', 'c-h', 'c-g', 'c-c'], dim: true }, camera: 'focus' },
        },
        {
          id: 'swarm',
          title: 'Swarm · 5–10×',
          narration: 'Specialize only when it pays. A swarm externalizes parallel search — Dynamic Workflows fan one prompt out to as many as 1,000 subagents.',
          data: {
            added: {
              nodes: [
                { id: 'd-o', type: 'origin', position: { x: 920, y: 0 } },
                { id: 'd-1', type: 'worker', position: { x: 1050, y: -80 } },
                { id: 'd-2', type: 'worker', position: { x: 1062, y: -48 } },
                { id: 'd-3', type: 'worker', position: { x: 1068, y: -16 } },
                { id: 'd-4', type: 'worker', position: { x: 1068, y: 16 } },
                { id: 'd-5', type: 'worker', position: { x: 1062, y: 48 } },
                { id: 'd-6', type: 'worker', position: { x: 1050, y: 80 } },
                { id: 'd-h', type: 'heading', position: { x: 990, y: 120 }, data: { label: 'SWARM' } },
                { id: 'd-g', type: 'gloss', position: { x: 990, y: 146 }, data: { label: 'parallel search' } },
                { id: 'd-c', type: 'cost', position: { x: 990, y: 174 }, data: { label: '5–10×' } },
                { id: 'd-in', type: 'anchor', position: { x: 900, y: 120 } },
                { id: 'd-out', type: 'anchor', position: { x: 1080, y: 120 } },
              ],
              edges: [
                { id: 'cd', source: 'c-out', target: 'd-in', type: 'promote',
                  style: { strokeDashArray: [5, 4], strokeColor: 0x94a3b8, arrowTargetColor: 0x94a3b8 } },
                { id: 'd-e1', source: 'd-o', target: 'd-1', type: 'spawn',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80 }] } },
                { id: 'd-e2', source: 'd-o', target: 'd-2', type: 'spawn',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.15 }] } },
                { id: 'd-e3', source: 'd-o', target: 'd-3', type: 'spawn',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.3 }] } },
                { id: 'd-e4', source: 'd-o', target: 'd-4', type: 'spawn',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.45 }] } },
                { id: 'd-e5', source: 'd-o', target: 'd-5', type: 'spawn',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.6 }] } },
                { id: 'd-e6', source: 'd-o', target: 'd-6', type: 'spawn',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 2, size: 5, speedPxPerSec: 80, phase: 0.75 }] } },
              ],
            },
          },
          view: { focus: { ids: ['d-o', 'd-1', 'd-2', 'd-3', 'd-4', 'd-5', 'd-6', 'd-h', 'd-g', 'd-c'], dim: true },
                  camera: 'focus' },
        },
        {
          id: 'dag',
          title: 'DAG · persist artifacts',
          narration: 'AgentHub: a bare Git repo plus a message board. Its commit DAG externalizes lineage — any agent can branch from any prior result.',
          data: {
            added: {
              nodes: [
                { id: 'e-s', type: 'origin', position: { x: 1220, y: 0 } },
                { id: 'e-u1', type: 'worker', position: { x: 1270, y: -50 } },
                { id: 'e-d1', type: 'worker', position: { x: 1270, y: 50 } },
                { id: 'e-m', type: 'worker', position: { x: 1320, y: 0 } },
                { id: 'e-u2', type: 'worker', position: { x: 1370, y: -50 } },
                { id: 'e-d2', type: 'worker', position: { x: 1370, y: 50 } },
                { id: 'e-t', type: 'result', position: { x: 1420, y: 0 } },
                { id: 'e-h', type: 'heading', position: { x: 1320, y: 120 }, data: { label: 'DAG' } },
                { id: 'e-g', type: 'gloss', position: { x: 1320, y: 146 }, data: { label: 'lineage' } },
                { id: 'e-c', type: 'cost', position: { x: 1320, y: 174 }, data: { label: 'commits, not transcripts' } },
                { id: 'e-in', type: 'anchor', position: { x: 1230, y: 120 } },
                { id: 'e-out', type: 'anchor', position: { x: 1410, y: 120 } },
              ],
              edges: [
                { id: 'de', source: 'd-out', target: 'e-in', type: 'promote',
                  style: { strokeDashArray: [5, 4], strokeColor: 0x94a3b8, arrowTargetColor: 0x94a3b8 } },
                { id: 'e-s-u1', source: 'e-s', target: 'e-u1', type: 'derives',
                  style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                           decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                           count: 1, size: 5, speedPxPerSec: 60 }] } },
                { id: 'e-u1-m', source: 'e-u1', target: 'e-m', type: 'derives',
                  style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                           decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                           count: 1, size: 5, speedPxPerSec: 60, phase: 0.25 }] } },
                { id: 'e-m-d2', source: 'e-m', target: 'e-d2', type: 'derives',
                  style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                           decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                           count: 1, size: 5, speedPxPerSec: 60, phase: 0.5 }] } },
                { id: 'e-d2-t', source: 'e-d2', target: 'e-t', type: 'derives',
                  style: { strokeColor: 0x3b6fd8, strokeWidth: 2.2, arrowTargetShape: 'none',
                           decorations: [{ id: 'flow', kind: 'flow-particles-connector', color: 0x1f3a6e,
                                           count: 1, size: 5, speedPxPerSec: 60, phase: 0.75 }] } },
                { id: 'e-s-d1', source: 'e-s', target: 'e-d1', type: 'derives', style: { arrowTargetShape: 'none' } },
                { id: 'e-d1-m', source: 'e-d1', target: 'e-m', type: 'derives', style: { arrowTargetShape: 'none' } },
                { id: 'e-m-u2', source: 'e-m', target: 'e-u2', type: 'derives', style: { arrowTargetShape: 'none' } },
                { id: 'e-u2-t', source: 'e-u2', target: 'e-t', type: 'derives', style: { arrowTargetShape: 'none' } },
              ],
            },
          },
          view: { focus: { ids: ['e-s', 'e-u1', 'e-d1', 'e-m', 'e-u2', 'e-d2', 'e-t', 'e-h', 'e-g', 'e-c'], dim: true },
                  camera: 'focus' },
        },
        {
          id: 'graph',
          title: 'Graph · 10–50×',
          narration: 'Compile a typed graph: claims, sources, artifacts and evaluations become durable objects. The graph externalizes shared state and cross-session memory.',
          data: {
            added: {
              nodes: [
                { id: 'f-hub', type: 'origin', position: { x: 1650, y: 5 }, states: ['hub'] },
                { id: 'f-p1', type: 'worker', position: { x: 1650, y: -75 } },
                { id: 'f-p2', type: 'worker', position: { x: 1726, y: -20 } },
                { id: 'f-p3', type: 'worker', position: { x: 1697, y: 70 } },
                { id: 'f-p4', type: 'worker', position: { x: 1603, y: 70 } },
                { id: 'f-p5', type: 'worker', position: { x: 1574, y: -20 } },
                { id: 'f-h', type: 'heading', position: { x: 1650, y: 120 }, data: { label: 'GRAPH' } },
                { id: 'f-g', type: 'gloss', position: { x: 1650, y: 146 }, data: { label: 'shared state' } },
                { id: 'f-c', type: 'cost', position: { x: 1650, y: 174 }, data: { label: '10–50×' } },
                { id: 'f-in', type: 'anchor', position: { x: 1560, y: 120 } },
              ],
              edges: [
                { id: 'ef', source: 'e-out', target: 'f-in', type: 'promote',
                  style: { strokeDashArray: [5, 4], strokeColor: 0x94a3b8, arrowTargetColor: 0x94a3b8 } },
                { id: 'f-r12', source: 'f-p1', target: 'f-p2', type: 'peer', style: { arrowTargetShape: 'none' } },
                { id: 'f-r23', source: 'f-p2', target: 'f-p3', type: 'peer', style: { arrowTargetShape: 'none' } },
                { id: 'f-r34', source: 'f-p3', target: 'f-p4', type: 'peer', style: { arrowTargetShape: 'none' } },
                { id: 'f-r45', source: 'f-p4', target: 'f-p5', type: 'peer', style: { arrowTargetShape: 'none' } },
                { id: 'f-r51', source: 'f-p5', target: 'f-p1', type: 'peer', style: { arrowTargetShape: 'none' } },
                { id: 'f-s1', source: 'f-p1', target: 'f-hub', type: 'shares',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45 }] } },
                { id: 'f-s2', source: 'f-p2', target: 'f-hub', type: 'shares',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.2 }] } },
                { id: 'f-s3', source: 'f-p3', target: 'f-hub', type: 'shares',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.4 }] } },
                { id: 'f-s4', source: 'f-p4', target: 'f-hub', type: 'shares',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.6 }] } },
                { id: 'f-s5', source: 'f-p5', target: 'f-hub', type: 'shares',
                  style: { arrowTargetShape: 'none', decorations: [{ id: 'flow', kind: 'flow-particles-connector',
                           color: 0x3b6fd8, count: 1, size: 5, speedPxPerSec: 45, phase: 0.8 }] } },
              ],
            },
          },
          view: { focus: { ids: ['f-hub', 'f-p1', 'f-p2', 'f-p3', 'f-p4', 'f-p5', 'f-h', 'f-g', 'f-c'], dim: true },
                  camera: 'focus' },
        },
        {
          id: 'overview',
          title: 'Each rung externalizes one bottleneck',
          narration: 'Loop → iteration · chain → task order · swarm → parallel search · DAG → lineage · graph → shared state. Each step up multiplies cost; promote only when the gain is measured.',
          view: { focus: null, camera: 'all' },
        },
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
            // Every mark fades up as its step lands.
            style: { effects: { 'fade-in': { durationMs: 700, easing: 'easeOutCubic' } } },
            state: {
              orbit: {
                decorations: [
                  { id: 'orbit', kind: 'marching-ants', color: 0x3b6fd8, strokeWidth: 3,
                    dashLength: 22, gapLength: 16, speedPxPerSec: 70 },
                ],
              },
              step1: { effects: { breathing: { amplitude: 0.12, periodMs: 1500, phaseOffsetMs: 0 } } },
              step2: { effects: { breathing: { amplitude: 0.12, periodMs: 1500, phaseOffsetMs: 500 } } },
              step3: { effects: { breathing: { amplitude: 0.12, periodMs: 1500, phaseOffsetMs: 1000 } } },
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
              // Every connector draws itself in as its step lands.
              decorations: [{ id: 'draw', kind: 'reveal-connector', durationMs: 800, delayMs: 250,
                              easing: 'easeOutCubic' }],
            },
          },
        },
      },
      behaviours: {
        color: { enabled: false },
        hover: { enabled: false },
        // Each step's focus frames its rung and dims the rest.
        // `current` has no overlay: the focused rung keeps its own look, only the rest dims.
        focus: { enabled: true, focusState: 'current', frameDurationMs: 900, framePadding: 140, frameMaxZoom: 1.15 },
      },
    }), [structures, stylings, types]);

    const onReady = useCallback((next: GraphCanvas | null) => {
      if (!next) return;
      // The bundle has no focus behaviour — register it by id, then re-apply its slice.
      next.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
      next.update({
        behaviours: { focus: config.behaviours.focus },
        layers: {
          background: { backgroundColor: '#ffffff' },
          graph: { edge: { style: { strokeColor: 0x1f3a6e, arrowTargetColor: 0x1f3a6e } } },
        },
      });
      void next.playbook.load(playbook);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <ThemeProvider defaultMode="light" storageKey={null}>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{ title: 'From loop to graph — the staged build path' }}
          right={{
            content: (ctx) => <PlaybookViewPanel canvas={ctx.canvas} playEvery={3200} className="h-full" />,
            defaultSize: 28,
          }}
        />
      </ThemeProvider>
    );
  },
};
