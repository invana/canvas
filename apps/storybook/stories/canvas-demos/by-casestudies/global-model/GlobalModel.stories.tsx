/**
 * **The global model** — every published model of Invana's airways demo on one
 * `<SchemaBoard>`: each model a frame holding its node types, with the stitches
 * between models as the only edges that cross a frame.
 *
 * The board ships the config and the three Detail levels (`SCHEMA_BOARD_CONFIG`,
 * `SCHEMA_DETAIL`); the story only maps the dataset onto the board's data
 * (`canvas-ui/apps/SchemaBoard/data.ts`, shared with the board's own stories).
 *
 * Switch **Detail** in the header: High binds every type to an icon circle,
 * Medium to a card, Low to that type's schema card — live, nothing remounts.
 */

import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SchemaBoard } from '@invana/canvas-ui';
import { airwaysSchema } from '../../../canvas-ui/apps/SchemaBoard/data';

const meta: Meta = { title: 'canvas-demos/by-casestudies/global-model/GlobalModel' };
export default meta;
type Story = StoryObj;

export const GlobalModelStory: Story = {
  name: 'GlobalModel',
  render: function GlobalModelRender() {
    const data = useMemo(airwaysSchema, []);
    return (
      <SchemaBoard
        data={data}
        title="Global model — airways"
        message="Hover an edge for its stitch rule — only stitches cross a model frame"
        dockSection={{ defaultSize: '380px', maxSize: '520px' }}
      />
    );
  },
};
