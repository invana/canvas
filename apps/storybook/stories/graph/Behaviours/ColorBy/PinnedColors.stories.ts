/**
 * **Category — pin known values to specific colours**
 *
 * Sometimes a value's colour is not arbitrary. Without `valueColors`, each
 * community takes whatever palette slot is next **in order of first
 * appearance** — which depends on data arrival order, so it can differ between
 * loads and between two views of the same graph.
 *
 * Here the three largest Les Mis communities are pinned; the remaining eight
 * fall through to the palette as usual. Pinned values are also never counted
 * against `maxCategories`, so raising or lowering the cap can never demote an
 * explicit choice.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/PinnedColors' };
export default meta;
type Story = StoryObj;

export const PinnedColorsStory: Story = {
  name: 'PinnedColors',
  render: () => createContainer({ id: 'colour-by-pinned' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-pinned', {
      nodeValueKey: 'data.group',
      colorEdges: false,
      valueColors: { 1: 0x22c55e, 2: 0xef4444, 8: 0x8b5cf6 },
    });
  },
};
