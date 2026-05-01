/**
 * Background — Themes — Blueprint
 *
 * Grid pattern over deep blue, blue/white nodes. Random tree dataset positioned
 * by `D3ForceLayoutPlugin`.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createContainer } from '../../../../src/div-utils.js';
import { THEMES, renderThemedTree } from './_themes.js';

const meta: Meta = { title: 'Plugins/Background/Themes' };
export default meta;
type Story = StoryObj;

export const Blueprint: Story = {
  name: 'Blueprint',
  render: () => createContainer(),
  play: async () => renderThemedTree(THEMES.blueprint),
};
