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

/** A coloured tag chip — shared by {@link TaskCardData} and {@link ProductCardData}. */
export interface CardTag {
  label: string;
  color: number;
}

/**
 * @deprecated Use {@link CardTag}. A `{ label, color }` chip is not a task
 * concept; kept as an alias so existing imports keep compiling.
 */
export type TaskTag = CardTag;

/** Data for {@link taskCard} — a Kanban-style task card. */
export interface TaskCardData {
  title: string;
  priority: 'high' | 'med' | 'low';
  tags?: CardTag[];
  assignee?: { initials: string; color: number };
  due?: string;
}

/** Data for {@link idCard} — an identity / access badge. */
export interface IDCardData {
  name: string;
  /** Job title or role, under the name. */
  title?: string;
  /** The badge number, shown in the footer. */
  idNumber: string;
  /** Issuing organisation, shown in the accent header band. */
  org?: string;
  /** Photo icon (iconify id). Falls back to {@link IDCardData.initials}. */
  photo?: string;
  /** Initials drawn in the photo chip when no `photo` is given. */
  initials?: string;
  /** Expiry note, shown beside the status pill. */
  validUntil?: string;
  status?: 'active' | 'expired' | 'suspended';
  /** Header band + photo chip colour. */
  accent: number;
}

/** Data for {@link organisationCard} — a company / institution card. */
export interface OrganisationCardData {
  name: string;
  /** Industry or entity type, shown as a tag under the name. */
  kind?: string;
  /** Logo icon (iconify id). Falls back to {@link OrganisationCardData.monogram}. */
  logo?: string;
  /** One or two letters drawn in the logo chip when no `logo` is given. */
  monogram?: string;
  location?: string;
  /** Headcount, pre-formatted (e.g. `1,200 employees`). */
  headcount?: string;
  /** Founding note, pre-formatted (e.g. `est. 1954`). */
  founded?: string;
  /** Logo chip + tag colour. */
  accent: number;
}

/** Data for {@link productCard} — a catalogue item tile. */
export interface ProductCardData {
  title: string;
  /** Pre-formatted price string (e.g. `$149.00`) — no currency maths here. */
  price: string;
  /** Media-band icon (iconify id). */
  icon?: string;
  /** Rating out of 5, rendered beside a star glyph. */
  rating?: number;
  /** Review count shown in parentheses after the rating. */
  reviews?: number;
  tags?: CardTag[];
  stock?: 'in' | 'low' | 'out';
  /** Media band tint + accent colour. */
  accent: number;
}

/** Data for {@link eventCard} — a dated event with venue + attendance. */
export interface EventCardData {
  title: string;
  /** Day-of-month for the date chip (e.g. `14`). */
  day: string;
  /** Short month for the date chip (e.g. `SEP`). */
  month: string;
  time?: string;
  venue?: string;
  /** Attendance, pre-formatted (e.g. `128 going`). */
  attendees?: string;
  /** Date chip colour. */
  accent: number;
}
