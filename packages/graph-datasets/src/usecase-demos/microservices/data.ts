/**
 * Synthetic **microservices topology** dataset — ~20 services across a
 * SaaS stack with call edges carrying RPS and per-edge error rates.
 * Designed for a Datadog / Istio / Linkerd-style service-map demo.
 *
 * The dataset embeds one degraded service (`order-api`), one degraded
 * downstream (`payment-service`), and one downed service
 * (`fraud-detector`) so the story has something to flag visually
 * without the consumer rolling a fake "simulate degradation" loop just
 * to see the styled states.
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

const nodes: (GraphNode & {
  data: {
    tier: 'gateway' | 'api' | 'logic' | 'data' | 'external';
    health: 'healthy' | 'degraded' | 'down';
    rps: number;
  };
})[] = [
  // ── Edge / gateway ──
  { id: 'api-gateway',           type: 'gateway', data: { tier: 'gateway',  health: 'healthy',  rps: 5800 } },

  // ── API tier ──
  { id: 'auth-api',              type: 'api', data: { tier: 'api',      health: 'healthy',  rps:  920 } },
  { id: 'user-api',              type: 'api', data: { tier: 'api',      health: 'healthy',  rps: 1200 } },
  { id: 'product-api',           type: 'api', data: { tier: 'api',      health: 'healthy',  rps: 1450 } },
  { id: 'order-api',             type: 'api', data: { tier: 'api',      health: 'degraded', rps:  680 } },
  { id: 'billing-api',           type: 'api', data: { tier: 'api',      health: 'healthy',  rps:  240 } },
  { id: 'search-api',            type: 'api', data: { tier: 'api',      health: 'healthy',  rps:  980 } },

  // ── Logic tier ──
  { id: 'payment-service',       type: 'logic', data: { tier: 'logic',    health: 'degraded', rps:  320 } },
  { id: 'notification-service',  type: 'logic', data: { tier: 'logic',    health: 'healthy',  rps:  510 } },
  { id: 'recommendation-service',type: 'logic', data: { tier: 'logic',    health: 'healthy',  rps:  720 } },
  { id: 'fraud-detector',        type: 'logic', data: { tier: 'logic',    health: 'down',     rps:    0 } },
  { id: 'inventory-service',     type: 'logic', data: { tier: 'logic',    health: 'healthy',  rps:  280 } },

  // ── Data tier ──
  { id: 'user-db',               type: 'data', data: { tier: 'data',     health: 'healthy',  rps: 2400 } },
  { id: 'order-db',              type: 'data', data: { tier: 'data',     health: 'healthy',  rps: 1100 } },
  { id: 'product-db',            type: 'data', data: { tier: 'data',     health: 'healthy',  rps: 1600 } },
  { id: 'cache',                 type: 'data', data: { tier: 'data',     health: 'healthy',  rps: 4200 } },
  { id: 'queue',                 type: 'data', data: { tier: 'data',     health: 'healthy',  rps: 1800 } },
  { id: 'search-index',          type: 'data', data: { tier: 'data',     health: 'healthy',  rps:  750 } },

  // ── External / SaaS dependencies ──
  { id: 'stripe-adapter',        type: 'external', data: { tier: 'external', health: 'healthy',  rps:  180 } },
  { id: 'ses-mailer',            type: 'external', data: { tier: 'external', health: 'healthy',  rps:  340 } },
];

const edges: (GraphEdge & { data: { rps: number; errorRate: number } })[] = [
  // gateway fan-out
  { id: 'g1', source: 'api-gateway', target: 'auth-api',     data: { rps:  920, errorRate: 0.002 } },
  { id: 'g2', source: 'api-gateway', target: 'user-api',     data: { rps: 1200, errorRate: 0.004 } },
  { id: 'g3', source: 'api-gateway', target: 'product-api',  data: { rps: 1450, errorRate: 0.003 } },
  { id: 'g4', source: 'api-gateway', target: 'order-api',    data: { rps:  680, errorRate: 0.082 } },
  { id: 'g5', source: 'api-gateway', target: 'billing-api',  data: { rps:  240, errorRate: 0.011 } },
  { id: 'g6', source: 'api-gateway', target: 'search-api',   data: { rps:  980, errorRate: 0.005 } },

  // auth-api
  { id: 'a1', source: 'auth-api', target: 'user-db', data: { rps: 720, errorRate: 0.001 } },
  { id: 'a2', source: 'auth-api', target: 'cache',   data: { rps: 920, errorRate: 0.0008 } },

  // user-api
  { id: 'u1', source: 'user-api', target: 'user-db', data: { rps: 1100, errorRate: 0.002 } },
  { id: 'u2', source: 'user-api', target: 'cache',   data: { rps: 1200, errorRate: 0.0005 } },

  // product-api
  { id: 'p1', source: 'product-api', target: 'product-db', data: { rps: 1450, errorRate: 0.001 } },
  { id: 'p2', source: 'product-api', target: 'cache',      data: { rps: 1400, errorRate: 0.0004 } },

  // order-api (degraded — high err on fraud + payment)
  { id: 'o1', source: 'order-api', target: 'order-db',             data: { rps: 660, errorRate: 0.012 } },
  { id: 'o2', source: 'order-api', target: 'payment-service',      data: { rps: 480, errorRate: 0.094 } },
  { id: 'o3', source: 'order-api', target: 'notification-service', data: { rps: 220, errorRate: 0.006 } },
  { id: 'o4', source: 'order-api', target: 'fraud-detector',       data: { rps: 410, errorRate: 0.984 } },
  { id: 'o5', source: 'order-api', target: 'inventory-service',    data: { rps: 280, errorRate: 0.008 } },
  { id: 'o6', source: 'order-api', target: 'queue',                data: { rps: 320, errorRate: 0.001 } },

  // billing-api
  { id: 'b1', source: 'billing-api', target: 'payment-service', data: { rps: 200, errorRate: 0.088 } },
  { id: 'b2', source: 'billing-api', target: 'queue',           data: { rps: 220, errorRate: 0.002 } },

  // search-api
  { id: 's1', source: 'search-api', target: 'search-index',           data: { rps: 870, errorRate: 0.003 } },
  { id: 's2', source: 'search-api', target: 'recommendation-service', data: { rps: 540, errorRate: 0.007 } },

  // payment-service
  { id: 'pm1', source: 'payment-service', target: 'stripe-adapter', data: { rps: 320, errorRate: 0.071 } },
  { id: 'pm2', source: 'payment-service', target: 'queue',          data: { rps: 280, errorRate: 0.004 } },

  // notification-service
  { id: 'n1', source: 'notification-service', target: 'ses-mailer', data: { rps: 340, errorRate: 0.006 } },
  { id: 'n2', source: 'notification-service', target: 'queue',      data: { rps: 510, errorRate: 0.002 } },

  // recommendation-service
  { id: 'r1', source: 'recommendation-service', target: 'user-db',    data: { rps: 360, errorRate: 0.001 } },
  { id: 'r2', source: 'recommendation-service', target: 'product-db', data: { rps: 380, errorRate: 0.001 } },
  { id: 'r3', source: 'recommendation-service', target: 'cache',      data: { rps: 720, errorRate: 0.0004 } },

  // fraud-detector (down — its outbound calls all error)
  { id: 'f1', source: 'fraud-detector', target: 'user-db',  data: { rps: 0, errorRate: 1 } },
  { id: 'f2', source: 'fraud-detector', target: 'order-db', data: { rps: 0, errorRate: 1 } },
  { id: 'f3', source: 'fraud-detector', target: 'cache',    data: { rps: 0, errorRate: 1 } },

  // inventory-service
  { id: 'i1', source: 'inventory-service', target: 'product-db', data: { rps: 280, errorRate: 0.002 } },
  { id: 'i2', source: 'inventory-service', target: 'queue',      data: { rps: 220, errorRate: 0.001 } },
];

export const microservices = { nodes, edges };

/** {@link microservices} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = microservices;

/**
 * Recommended look for the **microservices** topology.
 *
 * A service map, so services are rounded boxes with their name inside rather than
 * dots — an operator reads names, not positions. Colour-by-type separates the tiers
 * (gateway · api · worker · datastore …). Health and RPS live on `data` and drive
 * per-node colour / edge width through a consumer-supplied resolver; these settings
 * deliberately stop at what serialises.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'rect', width: 132, height: 34, cornerRadius: 6 },
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1.5,
          labelColor: 0xffffff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'center',
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 1.2,
          strokeAlpha: 0.7,
          arrowTargetShape: 'triangle',
          arrowTargetSize: 7,
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -900 },
      link: { distance: 160 },
      collide: {},
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: {
      enabled: true,
      state: 'highlighted',
      degree: 1,
      direction: 'both',
    },
    'click-select': { enabled: true, multiple: true },
  },
};
