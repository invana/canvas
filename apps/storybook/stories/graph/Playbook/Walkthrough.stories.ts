import type { Meta } from '@storybook/react-vite';
import { playbookStory } from './playbookStory';

const meta: Meta = { title: 'graph/Playbook/Walkthrough' };
export default meta;

/**
 * **A playbook: an analysis as JSON steps.** Les Misérables' co-appearance
 * network walked through as nine steps — overview, highlight the hub, zoom in,
 * follow the pursuit, narrow by hiding, expand with new nodes, re-layout, zoom
 * out, fit everything.
 *
 * **Next** plays a step: its `data` and `view` land as one history entry tagged
 * with the step, then its `do` verbs run and the canvas settles. **Previous**
 * takes it back; **Next** again replays it.
 */
export const WalkthroughStory = {
  name: 'Walkthrough',
  ...playbookStory({
    // Valjean's aliases (added in step 6) get their own node type.
    config: {
      layers: {
        graph: {
          nodeStructureTemplates: {
            alias: {
              name: 'alias',
              kind: 'simple',
              shape: { kind: 'circle', radius: 9 },
              slots: { label: true }
            }
          },
          nodeStylingTemplates: {
            alias: {
              name: 'alias',
              fillRole: 'heading',
              strokeWidth: 2,
              label: {
                fontSize: 11,
                fontWeight: 600,
                colorRole: 'heading',
                placement: 'bottom'
              }
            }
          },
          nodeTypes: {
            alias: {
              structure: 'alias',
              styling: 'alias',
              bindings: { label: 'data.label' }
            }
          }
        }
      }
    },
    // The script — plain JSON, as an engine or an assistant would send it.
    playbook: {
      version: 1,
      title: 'Who holds Les Misérables together?',
      source: 'graph',
      steps: [
        {
          id: 'overview',
          title: 'The whole cast',
          narration: '77 characters. An edge means two of them share a scene.',
          view: { camera: 'all' }
        },
        {
          id: 'hub',
          title: 'Valjean is the hub',
          narration: 'Valjean shares a scene with 36 characters, more than anyone else.',
          actor: 'assistant',
          view: {
            select: ['Valjean'],
            inspect: 'Valjean',
            focus: {
              ids: [
                'Valjean',
                'Labarre',
                'Mme.Magloire',
                'Mlle.Baptistine',
                'Myriel',
                'Marguerite',
                'Mme.deR',
                'Isabeau',
                'Gervais',
                'Fantine',
                'Mme.Thenardier',
                'Thenardier',
                'Cosette',
                'Javert',
                'Fauchelevent',
                'Bamatabois',
                'Simplice',
                'Scaufflaire',
                'Woman1',
                'Judge',
                'Champmathieu',
                'Brevet',
                'Chenildieu',
                'Cochepaille',
                'Woman2',
                'MotherInnocent',
                'Gavroche',
                'Gillenormand',
                'Mlle.Gillenormand',
                'Marius',
                'Enjolras',
                'Bossuet',
                'Gueulemer',
                'Babet',
                'Claquesous',
                'Montparnasse',
                'Toussaint'
              ]
            },
            camera: 'focus'
          }
        },
        {
          id: 'zoom-in',
          title: 'Zoom in',
          narration: 'Zoom is not state, so it is a verb: two camera.zoomIn commands.',
          do: [{ command: 'camera.zoomIn' }, { command: 'camera.zoomIn' }]
        },
        {
          id: 'pursuit',
          title: 'The pursuit: Valjean and Javert',
          narration:
            'Javert shares scenes with 17 characters, and every one of the other 16 also shares a scene with Valjean.',
          actor: 'assistant',
          view: {
            select: ['Valjean', 'Javert'],
            inspect: 'Javert',
            focus: {
              ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Thenardier', 'Mme.Thenardier']
            },
            camera: 'focus'
          }
        },
        {
          id: 'narrow',
          title: 'Set aside the bishop and the convent',
          narration: 'Hide two clusters. The layout re-flows around the rest; the camera frames what is visible.',
          actor: 'assistant',
          data: {
            hidden: {
              nodeIds: [
                'Myriel',
                'Napoleon',
                'Mlle.Baptistine',
                'Mme.Magloire',
                'CountessdeLo',
                'Geborand',
                'Champtercier',
                'Cravatte',
                'Count',
                'OldMan',
                'Fauchelevent',
                'MotherInnocent',
                'Gribier'
              ]
            }
          },
          view: { focus: null, select: [], inspect: null, camera: 'visible' }
        },
        {
          id: 'expand',
          title: "Expand: Valjean's aliases",
          narration: 'New nodes arrive as a delta: the two names Valjean lives under.',
          actor: 'assistant',
          data: {
            added: {
              nodes: [
                {
                  id: 'alias:Madeleine',
                  type: 'alias',
                  data: { label: 'M. Madeleine' }
                },
                {
                  id: 'alias:Fauchelevent',
                  type: 'alias',
                  data: { label: 'Ultime Fauchelevent' }
                }
              ],
              edges: [
                {
                  id: 'alias:Madeleine__Valjean',
                  type: 'alias-of',
                  source: 'alias:Madeleine',
                  target: 'Valjean'
                },
                {
                  id: 'alias:Fauchelevent__Valjean',
                  type: 'alias-of',
                  source: 'alias:Fauchelevent',
                  target: 'Valjean'
                },
                {
                  id: 'alias:Madeleine__Fantine',
                  type: 'co-appears-with',
                  source: 'alias:Madeleine',
                  target: 'Fantine'
                },
                {
                  id: 'alias:Fauchelevent__Cosette',
                  type: 'co-appears-with',
                  source: 'alias:Fauchelevent',
                  target: 'Cosette'
                }
              ]
            }
          },
          view: {
            focus: {
              ids: ['Valjean', 'alias:Madeleine', 'alias:Fauchelevent', 'Fantine', 'Cosette']
            },
            camera: 'focus'
          }
        },
        {
          id: 'relayout',
          title: 'Re-run the layout',
          narration: 'A verb that waits: the step finishes when the layout has settled.',
          do: [{ command: 'layout.run' }]
        },
        {
          id: 'zoom-out',
          title: 'Zoom out',
          do: [{ command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }, { command: 'camera.zoomOut' }]
        },
        {
          id: 'restore',
          title: 'Bring everyone back',
          narration: 'Show the hidden clusters and fit the whole graph, hidden or not.',
          data: {
            shown: {
              nodeIds: [
                'Myriel',
                'Napoleon',
                'Mlle.Baptistine',
                'Mme.Magloire',
                'CountessdeLo',
                'Geborand',
                'Champtercier',
                'Cravatte',
                'Count',
                'OldMan',
                'Fauchelevent',
                'MotherInnocent',
                'Gribier'
              ]
            }
          },
          view: { focus: null, select: [], inspect: null, camera: 'all' }
        }
      ]
    }
  })
};
