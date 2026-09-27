import {
  Crosshair,
  Download,
  Expand,
  Hand,
  Info,
  Layers,
  Lock,
  LockOpen,
  Maximize,
  Minus,
  Moon,
  MousePointer2,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Search,
  Settings,
  Shrink,
  Square,
  Sun,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import type { ToolbarIcon } from '../components';

/**
 * The default **icon registry** for control panels: the names a serialised
 * `ControlItemSpec.icon` may use, mapped to lucide glyphs. Kebab-case, named for
 * the glyph (not the command), so one icon can serve several commands. Extend or
 * override per app via `<ControlPanels icons={…}>`.
 */
export const DEFAULT_CONTROL_ICONS: Readonly<Record<string, ToolbarIcon>> = {
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  maximize: Maximize,
  expand: Expand,
  shrink: Shrink,
  crosshair: Crosshair,
  lock: Lock,
  'lock-open': LockOpen,
  play: Play,
  stop: Square,
  refresh: RefreshCw,
  undo: Undo2,
  redo: Redo2,
  sun: Sun,
  moon: Moon,
  plus: Plus,
  minus: Minus,
  x: X,
  search: Search,
  settings: Settings,
  layers: Layers,
  info: Info,
  download: Download,
  pointer: MousePointer2,
  hand: Hand,
};
