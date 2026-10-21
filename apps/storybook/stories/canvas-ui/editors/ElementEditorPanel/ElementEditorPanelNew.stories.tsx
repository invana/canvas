/**
 * **`ElementEditorPanel` for an element just drawn.** `requireType` puts the
 * Type field first with the caret in it, and Apply refuses a blank one with the
 * message under the field. `typeSuggestions` offers the types already on the
 * board; any other is accepted, and the model's keys (`schema`, not strict) are
 * offered as rows once a type is picked. Apply hands the values to the host —
 * shown on the right.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ElementEditorPanel, type ElementEditorValues } from '@invana/canvas-ui';
import { Column, MODEL } from './shared';

const meta: Meta = { title: 'canvas-ui/editors/ElementEditorPanel/ElementEditorPanelNew' };
export default meta;
type Story = StoryObj;

export const ElementEditorPanelNewStory: Story = {
  name: 'ElementEditorPanelNew',
  render: function Render() {
    const [applied, setApplied] = useState<ElementEditorValues | null>(null);
    const [log, setLog] = useState<string[]>([]);
    return (
      <Column applied={applied} log={log}>
        <ElementEditorPanel
          title="New node"
          requireType="Pick a type — a new node cannot be guessed"
          typeSuggestions={['character', 'place']}
          schema={MODEL}
          onSubmit={setApplied}
          onCancel={() => setLog((l) => ['cancelled', ...l])}
        />
      </Column>
    );
  }
};
