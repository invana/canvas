/**
 * Data shapes consumed by the built-in composite **card** builders. Each is the
 * per-node payload you'd store on `GraphNode.data` and hand to the matching
 * builder (`schemaTableCard(data)` etc.).
 */

/** One field of a {@link SchemaTableData} — a name + a data-type token. */
export interface SchemaField {
  name: string;
  /** Data-type token (`string` / `integer` / `number` / `date` / `boolean` / …). */
  type: string;
}

/** Data for {@link schemaTableCard} — a titled, **variable-length** field list. */
export interface SchemaTableData {
  label: string;
  /** Optional header icon (iconify id, e.g. `lucide/users`). */
  icon?: string;
  /** Header band colour (default blue). */
  header?: number;
  fields: SchemaField[];
}

/** Data for {@link userCard} — an avatar profile card. */
export interface UserCardData {
  name: string;
  role: string;
  /** Avatar initials (e.g. `AL`). */
  initials: string;
  /** Avatar disc + top accent colour. */
  avatar: number;
  status?: 'online' | 'away' | 'offline';
  email?: string;
  phone?: string;
}

/** Data for {@link statCard} — a dashboard KPI tile. */
export interface StatCardData {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  /** Icon (iconify id) shown in the accent chip. */
  icon?: string;
  /** Accent colour (left bar + icon chip). */
  accent: number;
}

/** A coloured tag chip on a {@link TaskCardData}. */
export interface TaskTag {
  label: string;
  color: number;
}

/** Data for {@link taskCard} — a Kanban-style task card. */
export interface TaskCardData {
  title: string;
  priority: 'high' | 'med' | 'low';
  tags?: TaskTag[];
  assignee?: { initials: string; color: number };
  due?: string;
}
