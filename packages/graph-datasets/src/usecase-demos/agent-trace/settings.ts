/**
 * Recommended look for an **LLM agent trace**.
 *
 * A trace is a run, and a run reads top-to-bottom — so this expects a layered
 * `ElkLayout` mounted under the id `elk` rather than the bundle's force sim. Steps
 * are labelled boxes; colour-by-type separates the step kinds (llm · tool · output
 * · …). Each step's `status` and `durationMs` stay on `data` for a consumer's
 * badge / colour resolver.
 */

import type { CanvasConfig } from '@invana/canvas';

export const settings: CanvasConfig = {
  activeLayout: 'elk',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'rect', width: 168, height: 40, cornerRadius: 8 },
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1.5,
          labelColor: 0xffffff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'center',
        },
      },
      edge: {
        style: {
          shape: { pathType: 'rounded', pathStyleOpts: { radius: 8 } },
          strokeColor: 0x94a3b8,
          strokeWidth: 1.3,
          arrowTargetShape: 'triangle',
          arrowTargetSize: 8,
        },
      },
    },
  },
  layouts: { elk: { algorithm: 'layered', direction: 'DOWN', nodeSpacing: 28, layerSpacing: 70 } },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
  },
};
