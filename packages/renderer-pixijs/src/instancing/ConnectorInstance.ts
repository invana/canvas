/**
 * `ConnectorInstance` — internal record the renderer keeps per added connector.
 *
 * Holds the spec, the pixi-backed `IConnector`, the cached routed `Path`, and
 * the active decoration map keyed by slot. Markers are painted inline by the
 * connector itself via `ShapeCtor.paintInto`. Not exported.
 */

import type {
  BaseConnectorSpec,
  IConnector,
  IConnectorDecoration,
  IConnectorEffect,
  Path,
  Polyline,
} from '../types';

export class ConnectorInstance<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly decorations = new Map<string, IConnectorDecoration>();
  /**
   * Active effects keyed by slot. Effects modulate the host connector's
   * style each frame; the renderer aggregates contributions from every
   * entry and writes the result onto `connector.gfx`.
   */
  readonly effects = new Map<string, IConnectorEffect>();
  /** Last router-resolved path. Reused by decoration update + hit-testing. */
  path: Path = [];

  /**
   * Memoised densified polyline of {@link path} — the form hit-testing needs
   * (`samplePath` is otherwise re-run per candidate on every `pointermove`, the
   * hover cost on a dense graph). `null` = stale; the renderer recomputes it
   * lazily and clears it whenever {@link path} is re-routed.
   */
  sampledPolyline: Polyline | null = null;

  /**
   * Render-time multiplier applied to `spec.stroke.width` at draw time.
   * Defaults to `1` (no extra scale). Written by `EdgeScaleLODBehaviour`
   * to `1 / cameraScale` so spec stroke widths render as pixel-constant
   * regardless of camera zoom — symmetric with `ShapeInstance.gfxScale`.
   *
   * The multiplier lives outside `spec` so `setConnectorStroke` /
   * `updateConnector` callers (and the state-config-driven full-spec
   * replacement in `GraphLayer.rerenderEdge`) can rewrite `spec.stroke`
   * without clobbering the LOD intent. The renderer's draw helper reads
   * this field on every draw and applies the multiplication on a
   * shallow-cloned spec, so the canonical `inst.spec` always carries the
   * caller-authored width.
   */
  strokeWidthScale: number = 1;

  constructor(
    readonly id: string,
    public spec: TSpec,
    readonly connector: IConnector<TSpec>,
  ) {}
}
