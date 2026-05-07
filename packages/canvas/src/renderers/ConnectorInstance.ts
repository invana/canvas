/**
 * `ConnectorInstance` — internal record the renderer keeps per added connector.
 *
 * Holds the spec, the pixi-backed `IConnector`, the cached routed polyline,
 * and the active decoration map keyed by slot. Markers are no longer separate
 * primitives — the connector paints them inline into its own Graphics via
 * `ShapeCtor.paintInto`. Not exported.
 */

import type {
  BaseConnectorSpec,
  IConnector,
  IConnectorDecoration,
  Point,
} from './types';

export class ConnectorInstance<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly decorations = new Map<string, IConnectorDecoration>();
  /** Last router-resolved polyline. Reused by decoration update + hit-testing. */
  polyline: ReadonlyArray<Point> = [];

  constructor(
    readonly id: string,
    public spec: TSpec,
    readonly connector: IConnector<TSpec>,
  ) {}
}
