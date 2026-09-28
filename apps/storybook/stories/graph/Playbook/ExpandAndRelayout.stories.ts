import type { Meta } from '@storybook/react-vite';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { playbookStory } from './playbookStory';

const meta: Meta = { title: 'graph/Playbook/ExpandAndRelayout' };
export default meta;

/**
 * **Expand, re-layout, switch layout.** The graph starts from four characters;
 * each "expand" step is a `data.added` delta. `layout.run` in `do` is awaited,
 * and a `settings` step is a `canvas.update` patch — here it switches to ELK.
 */
export const ExpandAndRelayoutStory = {
  name: 'ExpandAndRelayout',
  ...playbookStory({
    data: {
      nodes: [
        { id: 'Valjean', type: 'character' },
        { id: 'Cosette', type: 'character' },
        { id: 'Javert', type: 'character' },
        { id: 'Fantine', type: 'character' }
      ],
      edges: [
        {
          id: 'Cosette__Valjean',
          type: 'co-appears-with',
          source: 'Cosette',
          target: 'Valjean'
        },
        {
          id: 'Javert__Valjean',
          type: 'co-appears-with',
          source: 'Javert',
          target: 'Valjean'
        },
        {
          id: 'Fantine__Valjean',
          type: 'co-appears-with',
          source: 'Fantine',
          target: 'Valjean'
        },
        {
          id: 'Javert__Fantine',
          type: 'co-appears-with',
          source: 'Javert',
          target: 'Fantine'
        },
        {
          id: 'Javert__Cosette',
          type: 'co-appears-with',
          source: 'Javert',
          target: 'Cosette'
        }
      ]
    },
    layouts: () => [
      new ElkLayout({
        id: 'elk',
        targetLayerId: 'graph',
        onData: { preserveCamera: true }
      })
    ],
    config: {
      layers: {
        graph: {
          nodeStructureTemplates: {
            dot: { shape: { kind: 'circle', radius: 10 } }
          }
        }
      },
      layouts: {
        force: {
          link: { distance: 70 },
          charge: { strength: -260 },
          collide: { radius: 24 }
        },
        elk: {
          algorithm: 'layered',
          direction: 'RIGHT',
          nodeSpacing: 30,
          layerSpacing: 70,
          padding: 30
        }
      }
    },
    // The script — plain JSON, as an engine or an assistant would send it.
    playbook: {
      version: 1,
      title: 'Expand and re-layout',
      source: 'graph',
      steps: [
        {
          id: 'expand-cosette',
          title: 'Expand Cosette',
          actor: 'engine',
          data: {
            added: {
              nodes: [
                { id: 'Marius', type: 'character' },
                { id: 'Gillenormand', type: 'character' },
                { id: 'Toussaint', type: 'character' },
                { id: 'Mme.Thenardier', type: 'character' },
                { id: 'Thenardier', type: 'character' }
              ],
              edges: [
                {
                  id: 'Marius__Cosette',
                  type: 'co-appears-with',
                  source: 'Marius',
                  target: 'Cosette'
                },
                {
                  id: 'Gillenormand__Cosette',
                  type: 'co-appears-with',
                  source: 'Gillenormand',
                  target: 'Cosette'
                },
                {
                  id: 'Toussaint__Cosette',
                  type: 'co-appears-with',
                  source: 'Toussaint',
                  target: 'Cosette'
                },
                {
                  id: 'Mme.Thenardier__Cosette',
                  type: 'co-appears-with',
                  source: 'Mme.Thenardier',
                  target: 'Cosette'
                },
                {
                  id: 'Thenardier__Cosette',
                  type: 'co-appears-with',
                  source: 'Thenardier',
                  target: 'Cosette'
                },
                {
                  id: 'Thenardier__Mme.Thenardier',
                  type: 'co-appears-with',
                  source: 'Thenardier',
                  target: 'Mme.Thenardier'
                },
                {
                  id: 'Marius__Gillenormand',
                  type: 'co-appears-with',
                  source: 'Marius',
                  target: 'Gillenormand'
                }
              ]
            }
          },
          view: {
            focus: {
              ids: ['Cosette', 'Marius', 'Gillenormand', 'Toussaint', 'Mme.Thenardier', 'Thenardier']
            },
            camera: 'focus'
          }
        },
        {
          id: 'expand-marius',
          title: 'Expand Marius',
          actor: 'engine',
          data: {
            added: {
              nodes: [
                { id: 'Enjolras', type: 'character' },
                { id: 'Courfeyrac', type: 'character' },
                { id: 'Gavroche', type: 'character' },
                { id: 'Eponine', type: 'character' }
              ],
              edges: [
                {
                  id: 'Enjolras__Marius',
                  type: 'co-appears-with',
                  source: 'Enjolras',
                  target: 'Marius'
                },
                {
                  id: 'Courfeyrac__Marius',
                  type: 'co-appears-with',
                  source: 'Courfeyrac',
                  target: 'Marius'
                },
                {
                  id: 'Gavroche__Marius',
                  type: 'co-appears-with',
                  source: 'Gavroche',
                  target: 'Marius'
                },
                {
                  id: 'Eponine__Marius',
                  type: 'co-appears-with',
                  source: 'Eponine',
                  target: 'Marius'
                },
                {
                  id: 'Courfeyrac__Enjolras',
                  type: 'co-appears-with',
                  source: 'Courfeyrac',
                  target: 'Enjolras'
                },
                {
                  id: 'Gavroche__Enjolras',
                  type: 'co-appears-with',
                  source: 'Gavroche',
                  target: 'Enjolras'
                },
                {
                  id: 'Eponine__Thenardier',
                  type: 'co-appears-with',
                  source: 'Eponine',
                  target: 'Thenardier'
                }
              ]
            }
          },
          view: {
            focus: {
              ids: ['Marius', 'Enjolras', 'Courfeyrac', 'Gavroche', 'Eponine']
            },
            camera: 'focus'
          }
        },
        {
          id: 'relayout',
          title: 'Re-run the layout, fit everything',
          view: { focus: null, camera: 'all' },
          do: [{ command: 'layout.run' }]
        },
        {
          id: 'elk',
          title: 'Switch to a layered layout (ELK)',
          settings: { activeLayout: 'elk' },
          view: { camera: 'all' }
        }
      ]
    }
  })
};
