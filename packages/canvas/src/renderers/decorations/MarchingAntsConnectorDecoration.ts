/**
 * `MarchingAntsConnectorDecoration` — animated dashed overlay for connectors
 * with a scrolling phase offset (the classic crawling-ants animation).
 *
 * Registered as kind `'marching-ants-connector'`, target `'connector'`.
 *
 * Thin wrapper: owns the slot Container/Graphics + IConnectorDecoration
 * lifecycle and delegates all animation/geometry to the
 * `draw.MarchingAntsConnectorDecoration` primitive. The primitive walks
 * dashes along the polyline as straight chords; on smoothed connectors
 * (curve, bezier) the dashes follow the polyline samples rather than the
 * smoothed path. For curve-aware dashed painting, use a connector-kind-
 * specific decoration that calls `connector.paintInto` instead.
 *
 * Markers paint in their own spec colour (no `tintMarkers`) so the dashed
 * line appears to "feed into" a solid marker — the conventional CAD-tool
 * look. For unified-silhouette coverage (e.g. halo, glow), use a different
 * decoration that sets `tintMarkers`.
 */

import { Container, Graphics } from 'pixi.js';
import {
  MarchingAntsConnectorDecoration as DrawMarchingAntsConnector,
  type MarchingAntsConnectorOpts,
} from '../../draw/decorations/connector/marching-ants';
import type {
  ConnectorDecorationHostInfo,
  IConnectorDecoration,
} from '../types';

export type MarchingAntsConnectorStyle = MarchingAntsConnectorOpts;

export class MarchingAntsConnectorDecoration
  implements IConnectorDecoration<MarchingAntsConnectorStyle>
{
  readonly style: MarchingAntsConnectorStyle;
  private readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly impl: DrawMarchingAntsConnector;

  constructor(style: MarchingAntsConnectorStyle) {
    this.style = style;
    this.gfx = new Container();
    this.gfx.label = 'deco:marching-ants-connector';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    this.impl = new DrawMarchingAntsConnector(this.gfx, this.graphics, style);
  }

  mount(host: ConnectorDecorationHostInfo): void {
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.impl.update(host.polyline);
  }

  update(host: ConnectorDecorationHostInfo): void {
    this.impl.update(host.polyline);
  }

  tick(deltaMs: number): boolean {
    return this.impl.tick(deltaMs);
  }

  destroy(): void {
    this.impl.destroy();
    this.gfx.destroy({ children: true });
  }
}
