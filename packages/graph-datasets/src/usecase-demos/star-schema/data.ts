/**
 * **Retail star schema** — the classic dimensional-modelling shape: one fact
 * table (customer orders) surrounded by three dimensions (customer, date,
 * supplier), each foreign key an edge back to the fact.
 *
 * Unlike most graph datasets the interesting payload is *inside* the node: each
 * table carries an ordered, variable-length `fields` list with a name and a data
 * type per column. That's what makes it the fixture for ER / schema-table node
 * rendering — the card's height falls out of the field count, and the field
 * types drive per-row colour coding. Add a field and the node reshapes itself.
 *
 * `icon` and `headerColor` are authored *presentation hints* rather than
 * measurements — a data model has no intrinsic colour, but every ER tool ships
 * one, and keeping them on the dataset means a consumer gets a recognisable
 * diagram without inventing a palette.
 *
 * @example
 * import { starSchema, starSchemaSettings } from '@invana/graph-datasets/usecase-demos';
 * <GraphCanvasApp data={starSchema} config={starSchemaSettings} />
 */

import type { CanvasConfig } from '@invana/canvas';

export const starSchema = {
  nodes: [
    {
      id: 'dim_customer',
      type: 'Dimension',
      data: {
        name: 'Dim_Customer',
        icon: 'lucide/users',
        headerColor: 0x2563eb,
        fields: [
          { name: 'CustomerId', type: 'integer' },
          { name: 'CustomerName', type: 'string' },
          { name: 'Phone', type: 'string' },
          { name: 'RegistrationDate', type: 'date' },
          { name: 'TotalCustomers', type: 'integer' },
          { name: 'NorthAmerica', type: 'boolean' },
        ],
      },
    },
    {
      id: 'dim_date',
      type: 'Dimension',
      data: {
        name: 'Dim_Date',
        icon: 'lucide/calendar',
        headerColor: 0x2563eb,
        fields: [
          { name: 'DateId', type: 'integer' },
          { name: 'Date', type: 'date' },
          { name: 'Month', type: 'string' },
          { name: 'Year', type: 'integer' },
        ],
      },
    },
    {
      id: 'dim_supplier',
      type: 'Dimension',
      data: {
        name: 'Dim_Supplier',
        icon: 'lucide/truck',
        headerColor: 0x2563eb,
        fields: [
          { name: 'SupplierId', type: 'integer' },
          { name: 'CompanyName', type: 'string' },
          { name: 'Phone', type: 'string' },
        ],
      },
    },
    {
      id: 'fact_order',
      type: 'Fact',
      data: {
        name: 'Fact_Customer_Order',
        icon: 'lucide/sigma',
        headerColor: 0x7c3aed,
        fields: [
          { name: 'OrderId', type: 'integer' },
          { name: 'CustomerId', type: 'integer' },
          { name: 'DateId', type: 'integer' },
          { name: 'SupplierId', type: 'integer' },
          { name: 'Quantity', type: 'integer' },
          { name: 'Profit', type: 'number' },
        ],
      },
    },
  ],
  edges: [
    { id: 'f-customer', type: 'REFERENCES', source: 'fact_order', target: 'dim_customer', data: { foreignKey: 'CustomerId' } },
    { id: 'f-date', type: 'REFERENCES', source: 'fact_order', target: 'dim_date', data: { foreignKey: 'DateId' } },
    { id: 'f-supplier', type: 'REFERENCES', source: 'fact_order', target: 'dim_supplier', data: { foreignKey: 'SupplierId' } },
  ],
};

/** {@link starSchema} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = starSchema;

/**
 * Recommended look for the **retail star schema**.
 *
 * A data model is a layered DAG, so this expects an `ElkLayout` under the id
 * `layout`. The tables themselves are **composite cards** built from each node's
 * `fields` list, which no serialisable setting can express — a consumer supplies
 * the `shape` resolver, and `bgStrokeWidth: 0` here stops the base node border from
 * double-framing whatever card it builds.
 *
 * Foreign-key edges are dashed and arrowless, the ER convention for a reference
 * rather than a flow.
 */
export const settings: CanvasConfig = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    background: {
      type: 'pattern',
      patternType: 'dots',
      size: 1.5,
      spacing: 24,
      alpha: 0.85,
    },
    graph: {
      node: { style: { bgStrokeWidth: 0 } },
      edge: {
        style: {
          strokeColor: 0x64748b,
          strokeWidth: 1.4,
          strokeDashArray: [5, 4],
          arrowTargetShape: 'none',
          shape: { pathType: 'orth' },
        },
      },
    },
  },
  layouts: {
    layout: {
      algorithm: 'layered',
      direction: 'RIGHT',
      nodeSpacing: 60,
      layerSpacing: 140,
      padding: 40,
    },
  },
  behaviours: {
    // The card carries its own colours — nothing else may repaint it.
    color: { enabled: false },
    hover: { enabled: true },
    'drag-node': { enabled: true },
  },
};
