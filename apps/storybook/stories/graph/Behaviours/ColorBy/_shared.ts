/**
 * Shared fixture for the `ColorByBehaviour` stories.
 *
 * One dataset, eight stories — because the point of these stories is that
 * **only the options change**. Every story renders this same graph and differs
 * by which field it addresses and which mode it reads it in, so the sidebar
 * reads as a tour of the option surface rather than eight unrelated pictures.
 *
 * ### The dataset, and what it does and doesn't carry
 *
 * `lesMiserables` — 77 characters, 254 co-occurrence edges. Two real fields:
 *
 * - **`data.group`** on nodes — the co-occurrence community (`0`–`10`,
 *   11 distinct values). Categorical.
 * - **`data.value`** on edges — the number of scenes the two characters share
 *   (`1`–`31`). A magnitude.
 *
 * Two things it deliberately lacks, both of which the stories use:
 *
 * - **No `type` on any node.** That's real — characters have no entity kind,
 *   which is why the dataset's own settings ship with colour-by-type off. The
 *   `MissingField` story leans on it rather than working around it.
 * - **No node magnitude.** So {@link lesMiserablesWithDegree} derives two, below.
 */

import { lesMiserables } from '@invana/graph-datasets';

/**
 * The dataset with two **derived** node magnitudes stamped on, so the range-mode
 * stories have something real to scale.
 *
 * Both are computed here from the edges — they are *not* in the source data, and
 * that matters enough to say out loud (the package convention is that any field
 * stamped onto a real dataset declares itself derived):
 *
 * - **`data.degree`** — how many other characters this one shares a scene with.
 *   Range `1`–`36`, median `6`.
 * - **`data.scenes`** — weighted degree: the summed `value` of every incident
 *   edge, i.e. total shared-scene count. Range `1`–`158`, median `12`.
 *
 * `scenes` is the more interesting of the two because it is **heavily
 * long-tailed** — Valjean is in nearly everything while most of the cast appears
 * once or twice. That skew is exactly what makes the `linear` vs `log` scale
 * comparison worth looking at, and it's a property of the novel rather than
 * something invented for the demo.
 */
export function lesMiserablesWithDegree(): {
  nodes: { id: string; data: { group: number; degree: number; scenes: number } }[];
  edges: { id: string; source: string; target: string; data: { value: number } }[];
} {
  const degree = new Map<string, number>();
  const scenes = new Map<string, number>();

  for (const e of lesMiserables.edges) {
    const v = e.data.value;
    for (const id of [e.source, e.target]) {
      degree.set(id, (degree.get(id) ?? 0) + 1);
      scenes.set(id, (scenes.get(id) ?? 0) + v);
    }
  }

  return {
    nodes: lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: {
        group: n.data.group,
        degree: degree.get(n.id) ?? 0,
        scenes: scenes.get(n.id) ?? 0,
      },
    })),
    edges: lesMiserables.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: { value: e.data.value },
    })),
  };
}

// ─── Story scaffold ──────────────────────────────────────────────────────────

import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ColorByBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type ColorByBehaviourOptions,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';

import { onStoryTeardown } from '../../../div-util';

/**
 * Mount the shared fixture with one `ColorByBehaviour` configuration.
 *
 * Every story in this folder calls this with a different `colorBy` — that's the
 * point. The scene, the layout, the paint and the pan/zoom wiring are identical
 * throughout, so any visual difference between two stories is attributable to
 * the options alone.
 *
 * @param containerId — the `createContainer` id the story rendered.
 * @param colorBy — the options under test, minus `id` / `targetLayerId` / `enabled`.
 */
export async function mountColorByStory(
  canvasElement: HTMLElement,
  containerId: string,
  colorBy: Omit<ColorByBehaviourOptions, 'id' | 'targetLayerId' | 'enabled'>,
): Promise<void> {
  const container = canvasElement.querySelector<HTMLDivElement>(`#${containerId}`)!;
  const { nodes, edges } = lesMiserablesWithDegree();

  const canvas = new GraphCanvas();
  onStoryTeardown(() => canvas.destroy());

  const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
  canvas.layers.add(graph);

  canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
  canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
  canvas.behaviours.register(
    new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }),
  );

  canvas.layouts.add(new D3ForceLayout({ id: 'force', targetLayerId: 'graph' }));

  // Registered last so it wins the template fields it writes.
  canvas.behaviours.register(
    new ColorByBehaviour({ id: 'color', targetLayerId: 'graph', enabled: true, ...colorBy }),
  );

  // The layer template sets **no `bgFill`** — the behaviour owns that channel.
  // It does set a neutral edge stroke, which the behaviour overwrites only when
  // `colorEdges` is on, so a story that leaves edges alone still gets a sane grey.
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
              showLabel: false,
            },
          },
          edge: {
            style: { strokeColor: 0xcbd5e1, strokeWidth: 1, strokeAlpha: 0.5, arrowTargetShape: 'none' },
          },
        },
      },
      layouts: {
        // The dataset's own recommended force settings — Les Mis is a genuinely
        // dense 77-character social graph and needs this much charge to open up.
        force: { charge: { strength: -220 }, link: { distance: 40 }, collide: { radius: 11 } },
      },
      activeLayout: 'force',
      fitOnLoad: true,
    },
  });
}
