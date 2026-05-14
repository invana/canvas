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

import ukEnergyFlowJson from './uk-energy-flow.json';

/** Original (numeric-index) node shape. */
export interface UkEnergyFlowNode {
  name: string;
}

/** Original (numeric-index) link shape — `source` / `target` are indices
 *  into the `nodes` array. */
export interface UkEnergyFlowLink {
  source: number;
  target: number;
  value: number;
}

/** Original `{nodes, links}` shape (matches d3-sankey's expected input). */
export interface UkEnergyFlow {
  nodes: UkEnergyFlowNode[];
  links: UkEnergyFlowLink[];
}

/** Node in the flat `{nodes, edges}` projection. */
export interface UkEnergyFlowGraphNode {
  id: string;
  data: {
    /** Original `name` field — used by Sankey labels. */
    name: string;
    /**
     * Categorical bucket derived from the node name's first whitespace-
     * separated word (`'Solar PV'` becomes `'Solar'`, `'Coal reserves'`
     * becomes `'Coal'`). Mirrors the d3 example's first-word replace key
     * so a 10-colour ordinal scale produces the same grouping as the
     * canonical Observable port.
     */
    category: string;
  };
}

/** Edge in the flat projection. `value` is the flow magnitude (TWh). */
export interface UkEnergyFlowGraphEdge {
  id: string;
  source: string;
  target: string;
  data: { value: number };
}

/** Output of {@link ukEnergyFlowAsGraph}. */
export interface UkEnergyFlowGraphData {
  nodes: UkEnergyFlowGraphNode[];
  edges: UkEnergyFlowGraphEdge[];
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
export function ukEnergyFlowAsGraph(): UkEnergyFlowGraphData {
  const { nodes, links } = ukEnergyFlow;
  const graphNodes: UkEnergyFlowGraphNode[] = nodes.map((n) => ({
    id: n.name,
    data: {
      name: n.name,
      category: n.name.replace(/ .*/, ''),
    },
  }));
  const graphEdges: UkEnergyFlowGraphEdge[] = links.map((l) => {
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
