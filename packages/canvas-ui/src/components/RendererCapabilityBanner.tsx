import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle, Button } from '@invana/ui';
import { canUseWebGPU, hasWebGL, hasWebGPUApi } from '@invana/canvas-react';
import { MonitorX, X, Zap } from 'lucide-react';

import { Panel } from './Panel';

/** What the browser can render with — the banner's only input. */
export interface RendererCapabilities {
  /** WebGPU is usable ({@link canUseWebGPU}). */
  webgpu: boolean;
  /** A WebGL context can be created ({@link hasWebGL}). */
  webgl: boolean;
  /** The WebGPU API is present even though it is not usable (a gated browser). */
  webgpuApi: boolean;
}

export interface RendererCapabilityBannerProps {
  /** Override the probe — for stories and tests. Defaults to this browser's. */
  capabilities?: RendererCapabilities;
  className?: string;
}

/** This browser's capabilities. The probes are memoised by the renderer. */
function probe(): RendererCapabilities {
  return { webgpu: canUseWebGPU(), webgl: hasWebGL(), webgpuApi: hasWebGPUApi() };
}

/**
 * Says when the canvas cannot use its best renderer. Pinned top-centre of the
 * nearest positioned ancestor (the canvas host), click-through except for the
 * alert itself.
 *
 * - **WebGPU usable** → renders nothing.
 * - **WebGL only** → a dismissible note: the canvas falls back to WebGL and
 *   renders normally.
 * - **Neither** → a non-dismissible destructive alert: the canvas cannot draw.
 */
export function RendererCapabilityBanner({
  capabilities,
  className,
}: RendererCapabilityBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { webgpu, webgl, webgpuApi } = capabilities ?? probe();

  if (webgpu) return null;

  if (!webgl) {
    return (
      <Panel position="top-center" offset={12} zIndex={10} className={className}>
        <Alert variant="destructive" className="max-w-xl shadow-lg">
          <MonitorX className="size-4" />
          <AlertTitle>Graph canvas can't render</AlertTitle>
          <AlertDescription>
            This browser supports neither WebGPU nor WebGL, which the graph canvas needs to
            draw. Try a recent version of Chrome, Edge, or Firefox, or enable hardware
            acceleration in your browser settings.
          </AlertDescription>
        </Alert>
      </Panel>
    );
  }

  if (dismissed) return null;

  return (
    <Panel position="top-center" offset={12} zIndex={10} className={className}>
      <Alert className="max-w-xl shadow-lg">
        <Zap className="size-4" />
        <AlertTitle>Using WebGL — WebGPU unavailable</AlertTitle>
        <AlertDescription className="flex items-start gap-2">
          <span>
            {webgpuApi
              ? "This browser's WebGPU isn't supported by the renderer yet, so the canvas is using WebGL."
              : "WebGPU isn't available in this browser, so the canvas is using WebGL."}{' '}
            Rendering works as normal; very large graphs may be faster with WebGPU (available in
            recent Chrome / Edge).
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="-mr-1 -mt-1 shrink-0"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </Panel>
  );
}
