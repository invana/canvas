/**
 * **Computing pioneers** — a hand-authored ten-node graph of four computing
 * figures, the institutions they worked at, and the ideas they created.
 *
 * Deliberately tiny and deliberately *heterogeneous*: three entity kinds whose
 * property bags differ (a `Person` has a role and an avatar id, an
 * `Organization` has a founding note, a `Concept` has only a name), which is
 * exactly what a per-type node-rendering demo needs — one structure per label,
 * each binding different fields. Seven relation kinds keep the edge legend
 * interesting at this size.
 *
 * `avatar` holds an **avatar id** (`'ada'`), not an image URL — the consuming
 * template resolves it to whatever portrait source it has.
 *
 * @example
 * import { computingPioneers, computingPioneersSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={computingPioneers} config={computingPioneersSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';

export const computingPioneers = {
  nodes: [
    { id: 'ada', type: 'Person', data: { name: 'Ada Lovelace', role: 'Mathematician', avatar: 'ada' } },
    { id: 'alan', type: 'Person', data: { name: 'Alan Turing', role: 'Computer Scientist', avatar: 'alan' } },
    { id: 'grace', type: 'Person', data: { name: 'Grace Hopper', role: 'Rear Admiral', avatar: 'grace' } },
    { id: 'tim', type: 'Person', data: { name: 'Tim Berners-Lee', role: 'Engineer', avatar: 'tim' } },
    { id: 'cambridge', type: 'Organization', data: { name: 'Univ. of Cambridge', founded: 'est. 1209' } },
    { id: 'cern', type: 'Organization', data: { name: 'CERN', founded: 'est. 1954' } },
    { id: 'ae', type: 'Concept', data: { name: 'Analytical Engine' } },
    { id: 'tm', type: 'Concept', data: { name: 'Turing Machine' } },
    { id: 'cobol', type: 'Concept', data: { name: 'COBOL' } },
    { id: 'www', type: 'Concept', data: { name: 'World Wide Web' } },
  ],
  edges: [
    { id: 'e1', type: 'DESIGNED', source: 'ada', target: 'ae' },
    { id: 'e2', type: 'DESCRIBED', source: 'alan', target: 'tm' },
    { id: 'e3', type: 'CREATED', source: 'grace', target: 'cobol' },
    { id: 'e4', type: 'INVENTED', source: 'tim', target: 'www' },
    { id: 'e5', type: 'STUDIED_AT', source: 'alan', target: 'cambridge' },
    { id: 'e6', type: 'WORKED_AT', source: 'tim', target: 'cern' },
    { id: 'e7', type: 'INFLUENCED', source: 'ada', target: 'alan' },
  ],
};

/** {@link computingPioneers} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = computingPioneers;

/**
 * Recommended look for the **computing pioneers** graph.
 *
 * Ten nodes, so everything can be labelled and generously spaced. The three types
 * are meant to render as *different node structures* (an id card, an elliptical
 * badge, a plain circle), which is a template registry a consumer supplies —
 * colour-by-type is therefore **off**, since those templates own their own colour
 * and a palette would repaint them.
 *
 * The force numbers are the load-bearing part: cards are wide, so charge, link
 * distance and collision are all scaled up to keep them from overlapping.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layouts: {
    'graph-force': {
      charge: { strength: -1400 },
      link: { distance: 220 },
      collide: { radius: 130 },
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
    'click-select': { enabled: true, multiple: true },
  },
};
