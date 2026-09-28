import type { Meta } from '@storybook/react-vite';
import { playbookStory } from './playbookStory';

const meta: Meta = { title: 'graph/Playbook/HideAndReflow' };
export default meta;

/**
 * **Narrow by hiding; the layout re-flows.** Each step is only a `data` delta
 * of `hidden` / `shown` ids. The active layout re-runs on an explicit hide or
 * show, so the rest closes the gap. Step back to show a cluster again.
 */
export const HideAndReflowStory = {
  name: 'HideAndReflow',
  ...playbookStory({
    // The script — plain JSON, as an engine or an assistant would send it.
    playbook: {
      version: 1,
      title: 'Narrow by hiding',
      source: 'graph',
      steps: [
        {
          id: 'bishop',
          title: "Hide the bishop's household",
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
                'OldMan'
              ]
            }
          }
        },
        {
          id: 'fantine',
          title: "Hide Fantine's Paris",
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
          }
        },
        {
          id: 'trial',
          title: 'Hide the Champmathieu trial',
          data: {
            hidden: {
              nodeIds: [
                'Labarre',
                'Mme.deR',
                'Isabeau',
                'Gervais',
                'Bamatabois',
                'Simplice',
                'Scaufflaire',
                'Woman1',
                'Judge',
                'Champmathieu',
                'Brevet',
                'Chenildieu',
                'Cochepaille'
              ]
            }
          },
          view: { camera: 'visible' }
        },
        {
          id: 'bishop-back',
          title: "Show the bishop's household again",
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
                'OldMan'
              ]
            }
          },
          view: { camera: 'visible' }
        }
      ]
    }
  })
};
