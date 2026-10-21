/**
 * **`<SchemaBoard>` on its presets** — a schema drawn as frames of types, laid
 * out by ELK. The host passes data only: `SCHEMA_BOARD_CONFIG` and
 * `SCHEMA_DETAIL` are the board's defaults.
 *
 * | Do | What happens |
 * |---|---|
 * | **Detail** in the header | High — circles · Medium — cards · Low — schema cards; live, nothing remounts |
 * | hover a type | its description and one row per property |
 * | hover an edge | its type, and the rows it carries |
 * | double-click a frame | it collapses, and ELK re-flows |
 *
 * Frames and types wear `data.hue` — a slot of the theme's categorical ramp —
 * so switching the theme recolours them.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { SchemaBoard } from '@invana/canvas-ui';
import { airwaysSchema } from './data';

const meta: Meta = { title: 'canvas-ui/apps/SchemaBoard/SchemaBoard' };
export default meta;
type Story = StoryObj;

export const SchemaBoardStory: Story = {
  name: 'SchemaBoard',
  render: function Render() {
    const data = useMemo(airwaysSchema, []);
    return <SchemaBoard data={data} title="Airways — every model" message="Hover a type for its properties" />;
  }
};
