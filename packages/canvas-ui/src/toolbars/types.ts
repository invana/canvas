import type { ComponentType } from 'react';

/**
 * Icon component accepted by toolbar controls. The package is **icon-agnostic**
 * — the consumer passes the icon (e.g. a `lucide-react` glyph), so `canvas-ui`
 * takes on no icon dependency. Any component that renders from `size` /
 * `className` satisfies this (lucide icons do).
 */
export type ToolbarIcon = ComponentType<{ size?: number | string; className?: string }>;
