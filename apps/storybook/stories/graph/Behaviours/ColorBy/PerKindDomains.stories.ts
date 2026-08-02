/**
 * **Range — nodes and edges on different fields and scales**
 *
 * Nodes and edges are addressed **independently**, and this is the story that
 * shows why the domain is per-kind rather than shared.
 *
 * Nodes carry `data.scenes` on `[1, 158]` — a character's total shared scenes.
 * Edges carry `data.value` on `[1, 31]` — how many scenes *one pair* shares. Both
 * count scenes, and they still share no scale: a single `domain` option would
 * push every edge into the bottom fifth of the ramp. The generalised rule the
 * option surface follows is **unit-bearing options are per-kind, unit-free
 * options are shared** — so `nodeDomain` / `edgeDomain` and `nodeThresholds` /
 * `edgeThresholds` are split, while `mode`, `scale`, `colorStops` and
 * `fallbackColor` are not.
 *
 * This is also the only story here that colours edges, so it doubles as the
 * demonstration that `colorEdges` writes `strokeColor` **and**
 * `arrowTargetColor` together.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createContainer } from '../../../div-util';
import { mountColorByStory } from './_shared';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/PerKindDomains' };
export default meta;
type Story = StoryObj;

export const PerKindDomainsStory: Story = {
  name: 'PerKindDomains',
  render: () => createContainer({ id: 'colour-by-per-kind' }),
  play: async ({ canvasElement }) => {
    await mountColorByStory(canvasElement, 'colour-by-per-kind', {
      mode: 'range',
      nodeValueKey: 'data.scenes',
      nodeDomain: [1, 158],
      edgeValueKey: 'data.value',
      edgeDomain: [1, 12],
    });
  },
};
