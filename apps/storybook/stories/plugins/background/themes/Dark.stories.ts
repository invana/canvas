/**
 * Background — Themes — Dark
 *
 * Dark dot pattern, cyan nodes. Random tree dataset positioned by
 * `D3ForceLayoutPlugin`.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createContainer } from '../../../../src/div-utils.js';
import { THEMES, renderThemedTree } from './_themes.js';

const meta: Meta = { title: 'Plugins/Background/Themes' };
export default meta;
type Story = StoryObj;

export const Dark: Story = {
  name: 'Dark',
  render: () => createContainer(),
  play: async () => renderThemedTree(THEMES.dark),
};
