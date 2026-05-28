/**
 * `<ControlButton>` — a single icon control button (canvas equivalent of React
 * Flow's `<ControlButton>`). Icon-agnostic (icon passed as a prop); active state
 * uses the `@invana/ui` Button variants, not Tailwind. Shows the inactive,
 * active, and disabled states.
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ControlButton } from '@invana/canvas-ui';
import { Lock, LockOpen, Magnet, ZoomIn } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/ControlButton' };
export default meta;
type Story = StoryObj;

const rowStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', padding: 24 };

export const States: Story = {
  render: () => {
    const [locked, setLocked] = useState(false);
    return (
      <div style={rowStyle}>
        <ControlButton icon={ZoomIn} title="Inactive" onClick={() => {}} />
        <ControlButton icon={Magnet} title="Active" active onClick={() => {}} />
        <ControlButton icon={ZoomIn} title="Disabled" disabled onClick={() => {}} />
        {/* Controlled toggle — flips icon + active styling on click. */}
        <ControlButton
          icon={locked ? Lock : LockOpen}
          title={locked ? 'Locked (click to unlock)' : 'Unlocked (click to lock)'}
          active={locked}
          onClick={() => setLocked((v) => !v)}
        />
      </div>
    );
  },
};
