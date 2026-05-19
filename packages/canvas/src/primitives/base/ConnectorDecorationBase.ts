import { PrimitiveBase } from './PrimitiveBase';
import type { ConnectorDecorationHostInfo, IConnectorDecoration } from '../types';

/**
 * Base for decorations that target connector primitives. Mirrors
 * `ShapeDecorationBase` — subclass implements `repaint`, the base handles
 * `mount` / `update` lifecycle.
 *
 * Connector decorations receive the routed `Path` (not a polyline). When a
 * decoration needs uniform-arc-length sampling (rare — most decorations
 * call `connector.paintInto` for native dashed/styled strokes), it pulls
 * `samplePath(path, n)` from `primitives/connectors/pathSampling.ts`.
 */
export abstract class ConnectorDecorationBase<TStyle>
  extends PrimitiveBase
  implements IConnectorDecoration<TStyle>
{
  readonly style: TStyle;
  protected host: ConnectorDecorationHostInfo | null = null;

  constructor(style: TStyle) {
    super();
    this.style = style;
    this.gfx.label = `deco:${this.constructor.name}`;
  }

  mount(host: ConnectorDecorationHostInfo): void {
    this.host = host;
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.repaint();
  }

  update(host: ConnectorDecorationHostInfo): void {
    this.host = host;
    this.repaint();
  }

  protected abstract repaint(): void;
}
