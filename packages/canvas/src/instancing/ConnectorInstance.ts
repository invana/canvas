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
} from '../primitives/types';

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

  constructor(
    readonly id: string,
    public spec: TSpec,
    readonly connector: IConnector<TSpec>,
  ) {}
}
