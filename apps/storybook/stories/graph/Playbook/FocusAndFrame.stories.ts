import type { Meta } from '@storybook/react-vite';
import { playbookStory } from './playbookStory';

const meta: Meta = { title: 'graph/Playbook/FocusAndFrame' };
export default meta;

/**
 * **Highlight and frame.** Each step writes `view.focus` (the ids to emphasise;
 * `dim: false` leaves the rest alone) and `view.camera: 'focus'`.
 * `FocusBehaviour` draws it and frames the focused nodes once the canvas has
 * settled.
 */
export const FocusAndFrameStory = {
  name: 'FocusAndFrame',
  ...playbookStory({
    // The script — plain JSON, as an engine or an assistant would send it.
    playbook: {
      version: 1,
      title: 'Focus and frame',
      source: 'graph',
      steps: [
        {
          id: 'thenardiers',
          title: 'The Thénardiers and their gang',
          view: {
            focus: {
              ids: [
                'Thenardier',
                'Mme.Thenardier',
                'Eponine',
                'Anzelma',
                'Gueulemer',
                'Babet',
                'Claquesous',
                'Montparnasse',
                'Brujon'
              ]
            },
            camera: 'focus'
          }
        },
        {
          id: 'students',
          title: 'The students at the barricade',
          view: {
            focus: {
              ids: [
                'Marius',
                'Enjolras',
                'Combeferre',
                'Prouvaire',
                'Feuilly',
                'Courfeyrac',
                'Bahorel',
                'Bossuet',
                'Joly',
                'Grantaire',
                'Gavroche'
              ]
            },
            camera: 'focus'
          }
        },
        {
          id: 'no-dim',
          title: 'Cosette, without dimming the rest',
          view: {
            focus: { ids: ['Cosette', 'Valjean', 'Marius'], dim: false },
            camera: 'focus'
          }
        },
        {
          id: 'one',
          title: 'One node: the zoom stops at frameMaxZoom',
          view: { focus: { ids: ['Myriel'] }, camera: 'focus' }
        },
        {
          id: 'clear',
          title: 'Clear the focus, fit everything',
          view: { focus: null, camera: 'all' }
        }
      ]
    }
  })
};
