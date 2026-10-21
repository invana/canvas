/**
 * **`<SchemaBoard>` opening on Low — schema cards.** Each type is its own
 * `schema:<type>` card, built from its properties by `schemaCardStructure`: a
 * header in the type's hue with its frame as the subtitle, a description, then
 * one row per property — type chip, name, `key` on an identity, data type. A
 * card is as tall as its rows.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { SchemaBoard } from '@invana/canvas-ui';
import { airwaysSchema } from './data';

const meta: Meta = { title: 'canvas-ui/apps/SchemaBoard/SchemaBoardLowDetail' };
export default meta;
type Story = StoryObj;

export const SchemaBoardLowDetailStory: Story = {
  name: 'SchemaBoardLowDetail',
  render: function Render() {
    const data = useMemo(airwaysSchema, []);
    return <SchemaBoard data={data} title="Airways — schema cards" initialDetail="low" />;
  }
};
