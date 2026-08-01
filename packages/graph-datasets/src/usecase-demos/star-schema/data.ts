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

import type { GraphData } from '@invana/graph';

/** Node type — a table's role in the star. */
export type StarSchemaNodeType = 'Dimension' | 'Fact';

/** Edge type — the only relation here is a foreign key into a dimension. */
export type StarSchemaEdgeType = 'REFERENCES';

/** Column data type. Deliberately storage-agnostic (not SQL types). */
export type StarSchemaFieldType = 'integer' | 'number' | 'string' | 'date' | 'boolean';

/** One column of a table. */
export interface StarSchemaField {
  /** Column name, as it appears in the model (`'CustomerId'`). */
  readonly name: string;
  /** Column data type — drives the row's type chip downstream. */
  readonly type: StarSchemaFieldType;
}

/** Node payload — the table's identity, its look, and its columns. */
export interface StarSchemaNodeData {
  /** Table name (`'Dim_Customer'`). `id` stays the lowercase stable key. */
  readonly name: string;
  /** Iconify id for the header glyph (`'lucide/users'`). Presentation hint. */
  readonly icon: string;
  /** Header band colour, `0xRRGGBB`. Presentation hint. */
  readonly headerColor: number;
  /** The table's columns, in model order. */
  readonly fields: readonly StarSchemaField[];
}

/** Edge payload — which column of the fact table makes the reference. */
export interface StarSchemaEdgeData {
  /** The fact table's foreign-key column (`'CustomerId'`). */
  readonly foreignKey: string;
}

/** A table. */
export interface StarSchemaNode {
  readonly id: string;
  readonly type: StarSchemaNodeType;
  readonly data: StarSchemaNodeData;
}

/** A foreign key, fact → dimension. */
export interface StarSchemaEdge {
  readonly id: string;
  readonly type: StarSchemaEdgeType;
  readonly source: string;
  readonly target: string;
  readonly data: StarSchemaEdgeData;
}

/** The full dataset. */
export interface StarSchemaData {
  nodes: StarSchemaNode[];
  edges: StarSchemaEdge[];
}

export const starSchema: StarSchemaData = {
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
export const data: GraphData = starSchema as unknown as GraphData;
