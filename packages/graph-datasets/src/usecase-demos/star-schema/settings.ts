/**
 * Recommended look for the **retail star schema**.
 *
 * A data model is a layered DAG, so this expects an `ElkLayout` under the id
 * `layout`. The tables themselves are **composite cards** built from each node's
 * `fields` list, which no serialisable setting can express — a consumer supplies
 * the `shape` resolver, and `bgStrokeWidth: 0` here stops the base node border from
 * double-framing whatever card it builds.
 *
 * Foreign-key edges are dashed and arrowless, the ER convention for a reference
 * rather than a flow.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    background: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.85 },
    graph: {
      node: { style: { bgStrokeWidth: 0 } },
      edge: {
        style: {
          strokeColor: 0x64748b,
          strokeWidth: 1.4,
          strokeDashArray: [5, 4],
          arrowTargetShape: 'none',
          shape: { pathType: 'orth' },
        },
      },
    },
  },
  layouts: { layout: { algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 60, layerSpacing: 140, padding: 40 } },
  behaviours: {
    // The card carries its own colours — nothing else may repaint it.
    color: { enabled: false },
    hover: { enabled: true },
    'drag-node': { enabled: true },
  },
};
