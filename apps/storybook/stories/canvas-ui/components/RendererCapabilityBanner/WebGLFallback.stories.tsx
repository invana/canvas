/**
 * **`<RendererCapabilityBanner>` — WebGL fallback.** WebGPU is not usable, WebGL
 * is: the canvas renders normally and a dismissible note says why the WebGPU
 * toggle is off. The banner pins itself top-centre of the nearest positioned
 * ancestor — here a stand-in for the canvas host.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { RendererCapabilityBanner } from '@invana/canvas-ui';

const meta: Meta = { title: 'canvas-ui/components/RendererCapabilityBanner' };
export default meta;
type Story = StoryObj;

export const WebGLFallback: Story = {
  name: 'WebGL fallback',
  render: () => (
    <div className="relative h-80 w-full rounded-lg border bg-muted">
      <RendererCapabilityBanner
        capabilities={{ webgpu: false, webgl: true, webgpuApi: false }}
      />
    </div>
  ),
};
