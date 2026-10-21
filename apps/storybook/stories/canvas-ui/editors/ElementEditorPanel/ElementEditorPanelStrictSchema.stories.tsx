/**
 * **`ElementEditorPanel` on an existing node, strict to the model.** With
 * `strictSchema` the type is picked from the model's types and a key from that
 * type's keys only — nothing new can be typed. *Reset* puts the form back to
 * `defaults`; *Delete* and *Cancel* are the host's acts, logged on the right.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ElementEditorPanel, type ElementEditorValues } from '@invana/canvas-ui';
import { Column, MODEL } from './shared';

const meta: Meta = { title: 'canvas-ui/editors/ElementEditorPanel/ElementEditorPanelStrictSchema' };
export default meta;
type Story = StoryObj;

export const ElementEditorPanelStrictSchemaStory: Story = {
  name: 'ElementEditorPanelStrictSchema',
  render: function Render() {
    const [applied, setApplied] = useState<ElementEditorValues | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const say = (line: string) => setLog((l) => [line, ...l]);
    return (
      <Column applied={applied} log={log}>
        <ElementEditorPanel
          title="Node"
          showType
          schema={MODEL}
          strictSchema
          defaults={{ label: 'Valjean', type: 'character', data: { name: 'Jean Valjean', group: '2' } }}
          onSubmit={setApplied}
          onReset={() => say('reset')}
          onCancel={() => say('cancelled')}
          onDelete={() => say('delete Valjean')}
        />
      </Column>
    );
  }
};
