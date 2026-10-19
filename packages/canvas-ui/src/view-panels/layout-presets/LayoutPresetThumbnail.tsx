// LayoutPresetThumbnail — the small picture on a preset card: the *shape* of the
// layout, never the data. Drawn in `currentColor` (lines) and the primary token
// (nodes), so it follows the theme and the card's active state.

import { cn } from '@invana/ui';

import type { LayoutPresetPicture } from './types';

export interface LayoutPresetThumbnailProps {
  picture: LayoutPresetPicture;
  className?: string;
}

const RING_ANGLES = [0, 1, 2, 3, 4].map((i) => (i * 2 * Math.PI) / 5 - Math.PI / 2);

/** The layout's shape in a 120 × 64 box: a network, a tree, a flow or rings. */
export function LayoutPresetThumbnail({ picture, className }: LayoutPresetThumbnailProps) {
  return (
    <svg viewBox="0 0 120 64" aria-hidden="true" className={cn('h-16 w-full text-muted-foreground', className)}>
      <g fill="none" stroke="currentColor" strokeWidth={1}>
        {picture === 'network' && <NetworkLines />}
        {picture === 'tree' && <path d="M60 14V24M24 24H96M24 24V36M60 24V36M96 24V36M24 42V50M14 50H34M96 42V50M86 50H106" />}
        {picture === 'flow' &&
          [12, 32, 52].map((y) => (
            <g key={y}>
              <path d={`M22 32C46 32 46 ${y} 70 ${y}`} />
              <path d={`M74 ${y}C88 ${y} 88 ${y - 6} 102 ${y - 6}M74 ${y}C88 ${y} 88 ${y + 6} 102 ${y + 6}`} />
            </g>
          ))}
        {picture === 'radial' && (
          <>
            <circle cx={60} cy={32} r={14} strokeDasharray="2 3" />
            <circle cx={60} cy={32} r={27} strokeDasharray="2 3" />
            {RING_ANGLES.map((a) => (
              <path key={a} d={`M60 32L${60 + 14 * Math.cos(a)} ${32 + 14 * Math.sin(a)}`} />
            ))}
          </>
        )}
      </g>
      <g className="fill-primary">
        {picture === 'network' && <NetworkNodes />}
        {picture === 'tree' && (
          <>
            <circle cx={60} cy={12} r={5} />
            {[24, 60, 96].map((x) => (
              <circle key={x} cx={x} cy={40} r={3.5} />
            ))}
            {[14, 34, 86, 106].map((x) => (
              <circle key={x} cx={x} cy={54} r={2.5} />
            ))}
          </>
        )}
        {picture === 'flow' && (
          <>
            <circle cx={18} cy={32} r={5} />
            {[12, 32, 52].map((y) => (
              <g key={y}>
                <circle cx={72} cy={y} r={3.5} />
                <circle cx={104} cy={y - 6} r={2.2} />
                <circle cx={104} cy={y + 6} r={2.2} />
              </g>
            ))}
          </>
        )}
        {picture === 'radial' && (
          <>
            <circle cx={60} cy={32} r={5} />
            {RING_ANGLES.map((a) => (
              <g key={a}>
                <circle cx={60 + 14 * Math.cos(a)} cy={32 + 14 * Math.sin(a)} r={3} />
                <circle cx={60 + 27 * Math.cos(a + 0.3)} cy={32 + 27 * Math.sin(a + 0.3)} r={2.2} />
                <circle cx={60 + 27 * Math.cos(a - 0.3)} cy={32 + 27 * Math.sin(a - 0.3)} r={2.2} />
              </g>
            ))}
          </>
        )}
      </g>
    </svg>
  );
}

const NETWORK_POINTS: ReadonlyArray<readonly [number, number]> = [
  [30, 16],
  [92, 14],
  [34, 50],
  [90, 50],
  [14, 32],
  [110, 34],
];

function NetworkLines() {
  return (
    <>
      {NETWORK_POINTS.map(([x, y]) => (
        <line key={`${x}-${y}`} x1={60} y1={32} x2={x} y2={y} />
      ))}
    </>
  );
}

function NetworkNodes() {
  return (
    <>
      <circle cx={60} cy={32} r={5} />
      {NETWORK_POINTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3} />
      ))}
    </>
  );
}
