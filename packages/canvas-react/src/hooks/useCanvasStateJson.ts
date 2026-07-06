import { useCallback } from 'react';
import type {
  Canvas,
  CanvasStateSnapshot,
  CanvasStateSource,
  ImportCanvasStateOptions,
} from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

export type { CanvasStateSource } from '@invana/canvas';

export interface UseCanvasStateJsonResult {
  /** The current full canvas state as a plain, JSON-serialisable object. */
  export(): CanvasStateSnapshot;
  /** The current full canvas state stringified (pretty-printed by default). */
  toJSON(space?: string | number): string;
  /** Serialise the current state and trigger a browser download of the `.json` file. */
  download(filename?: string): void;
  /**
   * Restore the canvas from a snapshot, a JSON string, or a picked `File` / `Blob`
   * (e.g. from an `<input type="file">`). The canvas's layers/behaviours/layouts
   * must already be registered under the snapshot's ids.
   */
  import(source: CanvasStateSource, opts?: ImportCanvasStateOptions): Promise<void>;
}

/**
 * Export / import the **full canvas state** (view definition + interaction +
 * per-layer data) as JSON — the state counterpart to
 * {@link useCanvasImageExport} (which handles *images*).
 *
 * A thin React binding over the engine's framework-agnostic helpers
 * ({@link Canvas.exportState} / {@link Canvas.stateToJSON} /
 * {@link Canvas.downloadState} / {@link Canvas.importStateFrom}): `export` /
 * `toJSON` read the current state, `download` saves it as a `.json` file, and
 * `import` restores from a snapshot, a JSON string, or a picked `File`.
 * Multi-canvas-safe via the optional `canvas` argument (falls back to the
 * `<Canvas>` context).
 *
 * @example
 * const { download, import: importState } = useCanvasStateJson();
 * <button onClick={() => download('scene.json')}>Save</button>
 * <input type="file" accept="application/json"
 *        onChange={(e) => e.target.files?.[0] && importState(e.target.files[0])} />
 */
export function useCanvasStateJson(canvas?: Canvas | null): UseCanvasStateJsonResult {
  const resolved = useResolvedCanvas(canvas);

  const exportState = useCallback(() => resolved.exportState(), [resolved]);

  const toJSON = useCallback(
    (space: string | number = 2) => resolved.stateToJSON(space),
    [resolved],
  );

  const download = useCallback(
    (filename = 'canvas-state.json') => resolved.downloadState(filename),
    [resolved],
  );

  const importState = useCallback(
    (source: CanvasStateSource, opts?: ImportCanvasStateOptions) =>
      resolved.importStateFrom(source, opts),
    [resolved],
  );

  return { export: exportState, toJSON, download, import: importState };
}
