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

import type { CanvasSettings } from '../../types';

export const settings: CanvasSettings = {
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
