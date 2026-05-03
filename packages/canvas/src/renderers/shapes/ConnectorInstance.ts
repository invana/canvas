/**
 * `ConnectorInstance` — internal record the renderer keeps per added connector.
 *
 * Holds the spec, the pixi-backed `IConnector`, the cached routed polyline,
 * any source/target marker instances, and the active decoration map keyed by
 * slot. Not exported.
 */

import type {
  BaseConnectorSpec,
  IConnector,
  IConnectorDecoration,
  IMarker,
  Point,
} from './types';

export class ConnectorInstance<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  readonly decorations = new Map<string, IConnectorDecoration>();
  /** Last router-resolved polyline. Reused by decoration update + hit-testing. */
  polyline: ReadonlyArray<Point> = [];
  sourceMarker?: IMarker;
  targetMarker?: IMarker;

  constructor(
    readonly id: string,
    public spec: TSpec,
    readonly connector: IConnector<TSpec>,
  ) {}
}
