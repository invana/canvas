/**
 * Background — Themes — Minimal Light
 *
 * Light dot pattern, green nodes with dark stroke. Random tree dataset
 * positioned by `D3ForceLayoutPlugin`.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createContainer } from '../../../../src/div-utils.js';
import { THEMES, renderThemedTree } from './_themes.js';

const meta: Meta = { title: 'Plugins/Background/Themes' };
export default meta;
type Story = StoryObj;

export const MinimalLight: Story = {
  name: 'Minimal Light',
  render: () => createContainer(),
  play: async () => renderThemedTree(THEMES.light),
};
