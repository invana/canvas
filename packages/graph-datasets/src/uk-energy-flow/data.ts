/**
 * UK energy-flow dataset — the canonical d3-sankey example fixture.
 *
 * 48 nodes, 68 weighted links representing 2050 UK energy flows from
 * supply (coal reserves, oil reserves, nuclear, renewables, imports) →
 * intermediate carriers (oil, gas, electricity grid, solid / liquid /
 * gaseous fuels) → end use (industry, heating, transport, losses).
 *
 * Source: DECC 2050 Pathways (UK Department of Energy and Climate Change),
 * via Tom Counsell's d3-sankey example used since 2012. Reproduced from
 * `https://bost.ocks.org/mike/sankey/energy.json`. Distributed by the
 * original author under the same MIT terms as `d3-sankey`.
 *
 * Two shapes are exposed:
 *  - `ukEnergyFlow` — the original `{nodes:[{name}], links:[{source,target,value}]}`
 *    shape (numeric indices on the links), suitable for direct use with
 *    `d3.sankey()`.
 *  - `ukEnergyFlowAsGraph()` — a `{nodes, edges}` projection ready for
 *    `GraphLayer.setData`. Node ids are the original `name` field; edge
 *    ids are `<source>--<target>` (no duplicates in this dataset).
 *
 * @example
 * import { ukEnergyFlowAsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(ukEnergyFlowAsGraph());
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

import ukEnergyFlowJson from './uk-energy-flow.json';

/** Original (numeric-index) node shape. */
interface UkEnergyFlowNode {
  name: string;
}

/** Original (numeric-index) link shape — `source` / `target` are indices
 *  into the `nodes` array. */
interface UkEnergyFlowLink {
  source: number;
  target: number;
  value: number;
}

/** Original `{nodes, links}` shape (matches d3-sankey's expected input). */
interface UkEnergyFlow {
  nodes: UkEnergyFlowNode[];
  links: UkEnergyFlowLink[];
}

/** Original dataset, untouched. Pass straight to `d3.sankey()` if you want
 *  to drive the layout yourself; otherwise use {@link ukEnergyFlowAsGraph}. */
export const ukEnergyFlow: UkEnergyFlow = ukEnergyFlowJson as UkEnergyFlow;

/**
 * Project {@link ukEnergyFlow} to `{nodes, edges}` for `GraphLayer.setData`.
 *
 * The mapping:
 *  - Numeric link endpoints → string ids (the node `name`).
 *  - Each node carries `data.category` for colour grouping.
 *  - Edge ids are `<source>--<target>`; the source dataset has no duplicate
 *    pairs, so no extra disambiguation is needed.
 */
export function ukEnergyFlowAsGraph() {
  const { nodes, links } = ukEnergyFlow;
  const graphNodes: (GraphNode & {
    data: { name: string; category: string };
  })[] = nodes.map((n) => ({
    id: n.name,
    data: {
      name: n.name,
      category: n.name.replace(/ .*/, ''),
    },
  }));
  const graphEdges: (GraphEdge & { data: { value: number } })[] = links.map((l) => {
    const source = nodes[l.source]!.name;
    const target = nodes[l.target]!.name;
    return {
      id: `${source}--${target}`,
      source,
      target,
      data: { value: l.value },
    };
  });
  return { nodes: graphNodes, edges: graphEdges };
}

/** The UK energy flow as a graph, engine-ready. Same value as {@link ukEnergyFlowAsGraph}(). */
export const data = ukEnergyFlowAsGraph();

/**
 * Recommended look for the **UK energy flow** Sankey.
 *
 * A flow diagram, so it expects a `D3SankeyLayout` mounted under the id `layout`.
 * The ribbons are the data — edge width comes from the layout, and the endpoints
 * attach to node faces (`edge-port`) rather than being trimmed at an outline, which
 * is what keeps a ribbon flush against its bar.
 */
export const settings: CanvasConfig = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'rect', width: 14, height: 40 },
          bgFill: 0x64748b,
          bgStrokeWidth: 0,
          labelFontSize: 10,
          labelPlacement: 'right',
        },
      },
      edge: {
        style: {
          strokeAlpha: 0.4,
          arrowTargetShape: 'none',
          // `bump-horizontal` is the ribbon curve (there is no `'sankey'`
          // pathType — see `EdgePathType`); `edge-port` anchors are what keep a
          // ribbon flush against its bar's face.
          shape: {
            pathType: 'bump-horizontal',
            sourceAnchor: 'edge-port',
            targetAnchor: 'edge-port',
          },
        },
      },
    },
  },
  layouts: { layout: { nodeWidth: 14, nodePadding: 12 } },
  behaviours: { color: { enabled: false }, 'drag-node': { enabled: false } },
};
