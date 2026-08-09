/**
 * **Range — nodes and edges on different fields and scales**
 *
 * Nodes and edges are addressed **independently**, and this is the story that
 * shows why the domain is per-kind rather than shared.
 *
 * Nodes carry `data.scenes` on `[1, 158]` — a character's total shared scenes.
 * Edges carry `data.value` on `[1, 12]` — how many scenes *one pair* shares. Both
 * count scenes, and they still share no scale: a single `domain` option would
 * push every edge into the bottom fifth of the ramp. The generalised rule the
 * option surface follows is **unit-bearing options are per-kind, unit-free
 * options are shared** — so `nodeDomain` / `edgeDomain` and `nodeThresholds` /
 * `edgeThresholds` are split, while `mode`, `scale`, `colorStops` and
 * `fallbackColor` are not.
 *
 * The edge domain is deliberately tighter than the data's true range (1–31):
 * pair co-occurrence is skewed low, so scaling to the maximum would leave almost
 * every edge at the ramp's pale end. Clipping the top is the ordinary fix —
 * values above the domain clamp to the last stop. Drag `edgeDomainMax` to 31 in
 * the panel to see what the honest-but-useless version looks like.
 *
 * This is also the only story here that colours edges, so it doubles as the
 * demonstration that `colorEdges` writes `strokeColor` **and** `arrowTargetColor`
 * together.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/PerKindDomains' };
export default meta;
type Story = StoryObj;

export const PerKindDomainsStory: Story = {
  name: 'PerKindDomains',
  render: () => createContainer({ id: 'colour-by-per-kind' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-per-kind')!;

    // `scenes` — weighted degree, derived here rather than shipped in the
    // dataset (1 … 158). Edges keep the dataset's own `data.value` (1 … 31).
    const scenes = new Map<string, number>();
    for (const e of lesMiserables.edges) {
      for (const id of [e.source, e.target]) {
        scenes.set(id, (scenes.get(id) ?? 0) + e.data.value);
      }
    }
    const nodes = lesMiserables.nodes.map((n) => ({
      id: n.id,
      type: `group-${n.data.group}`,
      data: { group: n.data.group, scenes: scenes.get(n.id) ?? 0 }
    }));

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(
      new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: lesMiserables.edges } } }),
    );
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }),
    );
    canvas.layouts.add(new D3ForceLayout({ id: 'force', targetLayerId: 'graph' }));

    const colorBy = new ColorByBehaviour({
      id: 'color',
      targetLayerId: 'graph',
      enabled: true,
      mode: 'range',
      nodeValueKey: 'data.scenes',
      nodeDomain: [1, 158],
      edgeValueKey: 'data.value',
      edgeDomain: [1, 12]
    });
    canvas.behaviours.register(colorBy);

    await canvas.init({
      container,
      autoResize: true,
      config: {
        layers: {
          graph: {
            node: {
              style: {
                shape: { kind: 'circle', radius: 7 },
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1.5,
                showLabel: false
              }
            },
            // Thicker and fully opaque here — the edges carry data in this story
            // rather than just joining dots, so they have to be readable.
            edge: { style: { strokeWidth: 1.6, strokeAlpha: 1, arrowTargetShape: 'none' } }
          }
        },
        layouts: {
          force: { charge: { strength: -220 }, link: { distance: 40 }, collide: { radius: 11 } }
        },
        activeLayout: 'force',
        fitOnLoad: true
      }
    });

    const o = colorBy.getResolvedOptions();
    const settings = {
      nodeValueKey: o.nodeValueKey,
      nodeDomainMax: o.nodeDomain?.[1] ?? 158,
      edgeValueKey: o.edgeValueKey,
      edgeDomainMax: o.edgeDomain?.[1] ?? 12,
      colorEdges: o.colorEdges
    };
    const derived = { node: '', edge: '' };
    const refresh = (): void => {
      const d = colorBy.getDomains();
      derived.node = `${d.nodes.domain[0]} … ${d.nodes.domain[1]}`;
      derived.edge = `${d.edges.domain[0]} … ${d.edges.domain[1]}`;
    };
    const apply = (): void => {
      colorBy.setOptions({
        nodeValueKey: settings.nodeValueKey,
        nodeDomain: [1, settings.nodeDomainMax],
        edgeValueKey: settings.edgeValueKey,
        edgeDomain: [1, settings.edgeDomainMax],
        colorEdges: settings.colorEdges
      });
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    const nodeFolder = gui.addFolder('nodes');
    nodeFolder.add(settings, 'nodeValueKey').name('nodeValueKey').onFinishChange(apply);
    nodeFolder.add(settings, 'nodeDomainMax', 10, 200, 1).name('nodeDomain max').onChange(apply);
    const edgeFolder = gui.addFolder('edges');
    edgeFolder.add(settings, 'colorEdges').onChange(apply);
    edgeFolder.add(settings, 'edgeValueKey').name('edgeValueKey').onFinishChange(apply);
    edgeFolder.add(settings, 'edgeDomainMax', 2, 31, 1).name('edgeDomain max').onChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'node').name('node domain in use').listen().disable();
    out.add(derived, 'edge').name('edge domain in use').listen().disable();
  }
};
