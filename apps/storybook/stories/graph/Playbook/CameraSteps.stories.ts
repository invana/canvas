import type { Meta } from '@storybook/react-vite';
import { playbookStory } from './playbookStory';

const meta: Meta = { title: 'graph/Playbook/CameraSteps' };
export default meta;

/**
 * **The camera in a step: intents, not pixels.** `view.camera` names where to
 * look — `'focus'` (framed by `FocusBehaviour`), `'visible'` or `'all'` (hidden
 * nodes included; framed by the engine) — once the canvas settles. Zoom isn't
 * state, so it rides the step's `do` verbs (`camera.zoomIn` / `zoomOut` /
 * `reset`).
 */
export const CameraStepsStory = {
  name: 'CameraSteps',
  ...playbookStory({
    config: { behaviours: { focus: { frameMaxZoom: 3 } } },
    // The script — plain JSON, as an engine or an assistant would send it.
    playbook: {
      version: 1,
      title: 'Camera steps',
      source: 'graph',
      steps: [
        {
          id: 'zoom-in',
          title: 'Zoom in ×2',
          do: [{ command: 'camera.zoomIn' }, { command: 'camera.zoomIn' }]
        },
        {
          id: 'frame-gavroche',
          title: 'Frame Gavroche and his scenes',
          view: {
            focus: {
              ids: [
                'Gavroche',
                'Mme.Burgon',
                'Thenardier',
                'Javert',
                'Valjean',
                'Marius',
                'Mabeuf',
                'Enjolras',
                'Combeferre',
                'Prouvaire',
                'Feuilly',
                'Courfeyrac',
                'Bahorel',
                'Bossuet',
                'Joly',
                'Grantaire',
                'Gueulemer',
                'Babet',
                'Montparnasse',
                'Child1',
                'Child2',
                'Brujon',
                'Mme.Hucheloup'
              ],
              dim: false
            },
            camera: 'focus'
          }
        },
        {
          id: 'zoom-out',
          title: 'Zoom out ×3',
          do: [{ command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }]
        },
        {
          id: 'reset',
          title: 'Reset the camera',
          view: { focus: null },
          do: [{ command: 'camera.reset' }]
        },
        {
          id: 'hide-fit-visible',
          title: "Hide Fantine's Paris, fit what is visible",
          data: {
            hidden: {
              nodeIds: [
                'Marguerite',
                'Tholomyes',
                'Listolier',
                'Fameuil',
                'Blacheville',
                'Favourite',
                'Dahlia',
                'Zephine',
                'Perpetue'
              ]
            }
          },
          view: { camera: 'visible' }
        },
        {
          id: 'fit-all',
          title: 'Fit all, hidden included',
          view: { camera: 'all' }
        }
      ]
    }
  })
};
