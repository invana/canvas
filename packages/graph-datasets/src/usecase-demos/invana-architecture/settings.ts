/**
 * Recommended look for the **Invana end-to-end architecture** diagram.
 *
 * The arrangement *is* the diagram — every node ships its authored position — so
 * there is **no layout** (`activeLayout: ''`). Colour-by-type is off for the same
 * reason: the stage tints are the diagram's own palette, carried by the `stage`
 * state overlay a consumer defines (each stage node names it in `states`).
 *
 * Boxes are plain rects sized from `data.width` / `data.height` via a consumer
 * `shape` resolver; what's here is everything about the look that serialises —
 * hairline grey arrows, small centred captions, and the label pill behind a flow
 * annotation.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: '',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          bgFill: 0xffffff,
          bgStrokeColor: 0x9ca3af,
          bgStrokeWidth: 1,
          labelAlign: 'center',
          labelColor: 0x111827,
          labelFontSize: 11,
          labelLineHeight: 14,
        },
      },
      edge: {
        style: {
          strokeColor: 0x9ca3af,
          strokeWidth: 1,
          arrowTargetShape: 'triangle',
          arrowTargetSize: 7,
          shape: { pathType: 'smooth', sourceAnchor: 'boundary', targetAnchor: 'boundary' },
          labelColor: 0x3f3f46,
          labelFontSize: 10,
          labelAutoRotate: false,
          labelBackgroundFill: 0xffffff,
          labelBackgroundPadding: 2,
        },
      },
    },
  },
  behaviours: {
    color: { enabled: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
    // `collapse` and `click-select` both claim `pointer+click`; selection stands
    // down so the stage +/- toggles win.
    'click-select': { enabled: false },
  },
};
