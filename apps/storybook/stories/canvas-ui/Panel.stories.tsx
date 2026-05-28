/**
 * `<Panel>` — the positioning primitive (canvas equivalent of React Flow's
 * `<Panel>`). Engine-agnostic: it pins to its nearest positioned ancestor, so
 * this story needs no `<Canvas>` — just a `position: relative` box. All six
 * positions are shown at once, plus a horizontal toolbar-style panel.
 */

import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel, ControlButton } from '@invana/canvas-ui';
import type { PanelPosition } from '@invana/canvas-ui';
import { Crosshair, Lock, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

const meta: Meta = { title: 'canvas-ui/Panel' };
export default meta;
type Story = StoryObj;

const POSITIONS: PanelPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const stageStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '70vh',
  margin: 16,
  borderRadius: 12,
  border: '1px solid var(--color-border)',
  background:
    'repeating-linear-gradient(45deg, var(--color-muted) 0 1px, transparent 1px 16px)',
  overflow: 'hidden',
};

const chipStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  borderRadius: 8,
  fontSize: 12,
  background: 'var(--color-popover)',
  border: '1px solid var(--color-border)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
};

export const AllPositions: Story = {
  render: () => (
    <div style={stageStyle}>
      {POSITIONS.map((position) => (
        <Panel key={position} position={position}>
          <div style={chipStyle}>
            <span>{position}</span>
            <ControlButton icon={Crosshair} title={position} onClick={() => {}} />
          </div>
        </Panel>
      ))}

      {/* A horizontal toolbar-style panel pinned centre-ish via offset. */}
      <Panel position="bottom-center" orientation="horizontal" offset={56}>
        <div style={chipStyle}>
          <ControlButton icon={ZoomIn} title="Zoom in" onClick={() => {}} />
          <ControlButton icon={ZoomOut} title="Zoom out" onClick={() => {}} />
          <ControlButton icon={Maximize} title="Fit" onClick={() => {}} />
          <ControlButton icon={Lock} title="Lock" active onClick={() => {}} />
        </div>
      </Panel>
    </div>
  ),
};
