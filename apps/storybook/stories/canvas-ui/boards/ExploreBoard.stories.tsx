/**
 * **Explore board** — one Explore board, as the boards design draws
 * it: the assistant laid it out, and the engine filled it.
 *
 * | Panel | Kind | Source |
 * |---|---|---|
 * | What it shows | narrative; its numbers are references (`{panel#n.measure}`) to other panels' values | — |
 * | Airports · Routes · Countries | metric, one tile each (the kit's `grid`) | an aggregate: `count`, no group |
 * | Most routes out | ranked | an aggregate: `count` over `airport → route → airport`, grouped by the start's code |
 * | The ten and the routes between them | `canvas`, registered here over `GraphBoard` | a plan |
 * | Airports | table | a plan |
 *
 * **A panel holds a source, never values.** The board is stored as the engine's
 * `BoardSpec`: rows of panels, each with a plan or an aggregate. Opening it reads
 * every source (`readBoard`, a stand-in for `POST …/boards/{board}/read`), and
 * the answer — values, `read_at`, `took_ms`, the World — is mapped onto the
 * kit's `BoardSpec`.
 *
 * **Read times are the engine's.** Each panel says when its source was read, in
 * which World and how long it took; the board's header shows the oldest read.
 * The engine answers `stale_at`; once the clock passes it the header's read time
 * turns to a warning — move the `minutesLater` control to see it. **Refresh**
 * reads every source again; the panels keep their place.
 *
 * **No heights.** The page gives the board the whole viewport; the board takes
 * its parent's size, and the canvas row is a `fill` row that takes what the
 * other rows leave (never below the kit's `--spacing-board-fill`).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { BoardSpec, PanelSpec } from "@invana/boards";
import { CanvasBoard, type CanvasPanelKinds } from "@invana/canvas-ui/boards";
import type { GraphData } from "@invana/graph";
import { BookOpen, MoreHorizontal, RefreshCw, Share2 } from "lucide-react";

// ── The Graph's data: what the engine reads (airways, the EU · H1 2026 World) ──

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  runways: number;
  routesOut: number;
}

const AIRPORTS: Airport[] = [
  {
    code: "IST",
    name: "Istanbul",
    city: "Istanbul",
    country: "TR",
    runways: 3,
    routesOut: 279,
  },
  {
    code: "FRA",
    name: "Frankfurt",
    city: "Frankfurt",
    country: "DE",
    runways: 4,
    routesOut: 262,
  },
  {
    code: "AMS",
    name: "Schiphol",
    city: "Amsterdam",
    country: "NL",
    runways: 6,
    routesOut: 255,
  },
  {
    code: "CDG",
    name: "Charles de Gaulle",
    city: "Paris",
    country: "FR",
    runways: 4,
    routesOut: 248,
  },
  {
    code: "MUC",
    name: "Munich",
    city: "Munich",
    country: "DE",
    runways: 2,
    routesOut: 199,
  },
  {
    code: "LHR",
    name: "Heathrow",
    city: "London",
    country: "GB",
    runways: 2,
    routesOut: 191,
  },
  {
    code: "MAD",
    name: "Barajas",
    city: "Madrid",
    country: "ES",
    runways: 4,
    routesOut: 186,
  },
  {
    code: "DUB",
    name: "Dublin",
    city: "Dublin",
    country: "IE",
    runways: 2,
    routesOut: 182,
  },
  {
    code: "BCN",
    name: "El Prat",
    city: "Barcelona",
    country: "ES",
    runways: 3,
    routesOut: 178,
  },
  {
    code: "FCO",
    name: "Fiumicino",
    city: "Rome",
    country: "IT",
    runways: 4,
    routesOut: 171,
  },
];

const ROUTES: [string, string][] = [
  ["IST", "FRA"],
  ["IST", "AMS"],
  ["IST", "CDG"],
  ["IST", "MUC"],
  ["IST", "LHR"],
  ["IST", "FCO"],
  ["FRA", "AMS"],
  ["FRA", "CDG"],
  ["FRA", "MUC"],
  ["FRA", "LHR"],
  ["FRA", "MAD"],
  ["FRA", "DUB"],
  ["AMS", "CDG"],
  ["AMS", "LHR"],
  ["AMS", "DUB"],
  ["AMS", "BCN"],
  ["CDG", "LHR"],
  ["CDG", "MAD"],
  ["CDG", "BCN"],
  ["CDG", "FCO"],
  ["LHR", "DUB"],
  ["LHR", "MAD"],
  ["MAD", "BCN"],
  ["BCN", "FCO"],
  ["MUC", "FCO"],
  ["DUB", "MAD"],
  ["DUB", "BCN"],
  ["MUC", "AMS"],
];

/** The World's counts, as the engine's aggregates answer them: one `count` each, over its own plan. */
const WORLD_COUNTS: Record<string, number> = {
  airports: 412,
  routes: 9860,
  countries: 38,
};

const WORLD = { id: "eu-h1-2026", name: "EU · H1 2026" };

// ── The engine's side: a stored board holds sources, never values ────────────

interface Plan {
  start: { type: string };
  steps?: { via: string; direction: "out" | "in" | "both"; to: string }[];
  limit: number;
}

interface Measure {
  name: string;
  fn: "count" | "sum" | "avg" | "min" | "max";
  at?: number;
  property?: string;
}
type Source =
  | { kind: "plan"; plan: Plan }
  | {
      kind: "aggregate";
      plan: Plan;
      group_by?: {
        at: number;
        property: string;
        bucket?: "day" | "week" | "month" | "year";
      };
      measures: Measure[];
      order?: { by: string; desc: boolean };
      limit?: number;
    };

interface StoredPanel {
  id: string;
  kind: "narrative" | "metric" | "ranked" | "canvas" | "table";
  title: string;
  source?: Source;
  /** A narrative's text: `{panel.measure}` · `{panel#n.measure}` · `{panel#n.group}` refer to another panel's value. */
  options?: { text?: string };
}

interface StoredBoard {
  id: string;
  title: string;
  world: string;
  spec: { version: 1; rows: { panels: StoredPanel[]; fill?: boolean }[] };
}

const AIRPORT_PLAN: Plan = { start: { type: "AirRoutes.airport" }, limit: 25 };
const ROUTE_PLAN: Plan = {
  ...AIRPORT_PLAN,
  steps: [
    { via: "AirRoutes.route", direction: "out", to: "AirRoutes.airport" },
  ],
};

/** What `create_board` stored for "Which European airports have the most routes, and how do they connect?". */
const BUSIEST: StoredBoard = {
  id: "busiest",
  title: "Busiest airports in Europe",
  world: WORLD.id,
  spec: {
    version: 1,
    rows: [
      {
        panels: [
          {
            id: "narr",
            kind: "narrative",
            title: "What it shows",
            options: {
              text:
                "{rank#1.group} has the most routes out of any airport in this World, {rank#1.routes_out}, ahead of " +
                "{rank#2.group} {rank#2.routes_out} and {rank#3.group} {rank#3.routes_out}. Across the World, " +
                "{airports.count} airports in {countries.count} countries fly {routes.count} routes between them.",
            },
          },
        ],
      },
      {
        panels: [
          {
            id: "airports",
            kind: "metric",
            title: "Airports",
            source: {
              kind: "aggregate",
              plan: AIRPORT_PLAN,
              measures: [{ name: "count", fn: "count" }],
            },
          },
          {
            id: "routes",
            kind: "metric",
            title: "Routes",
            source: {
              kind: "aggregate",
              plan: ROUTE_PLAN,
              measures: [{ name: "count", fn: "count" }],
            },
          },
          {
            id: "countries",
            kind: "metric",
            title: "Countries",
            source: {
              kind: "aggregate",
              plan: { start: { type: "AirRoutes.country" }, limit: 25 },
              measures: [{ name: "count", fn: "count" }],
            },
          },
        ],
      },
      {
        fill: true,
        panels: [
          {
            id: "rank",
            kind: "ranked",
            title: "Most routes out",
            source: {
              kind: "aggregate",
              plan: ROUTE_PLAN,
              group_by: { at: 0, property: "code" },
              measures: [{ name: "routes_out", fn: "count" }],
              order: { by: "routes_out", desc: true },
              limit: 10,
            },
          },
          {
            id: "canvas",
            kind: "canvas",
            title: "The ten and the routes between them",
            source: {
              kind: "plan",
              plan: {
                ...AIRPORT_PLAN,
                steps: [
                  {
                    via: "AirRoutes.route",
                    direction: "out",
                    to: "AirRoutes.airport",
                  },
                ],
                limit: 10,
              },
            },
          },
        ],
      },
      {
        panels: [
          {
            id: "table",
            kind: "table",
            title: "Airports",
            source: { kind: "plan", plan: AIRPORT_PLAN },
          },
        ],
      },
    ],
  },
};

interface PlanNode {
  id: string;
  type: string;
  properties: Record<string, string | number>;
}
interface PlanEdge {
  id: string;
  type: string;
  from: string;
  to: string;
}
interface AggregateRow {
  group: string | null;
  measures: Record<string, number>;
}

interface PanelRead {
  panel: string;
  status: "ok" | "refused" | "failed";
  world: { id: string; name: string };
  read_at: string;
  took_ms: number;
  run_id: string;
  nodes?: PlanNode[];
  edges?: PlanEdge[];
  rows?: AggregateRow[];
  /** How many groups there were before the aggregate's `limit`. */
  groups?: number;
}

interface BoardRead {
  board: string;
  world: { id: string; name: string };
  read_at: string;
  stale_at: string;
  panels: PanelRead[];
}

const STALE_AFTER_MS = 15 * 60_000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A stand-in for `POST …/boards/{board}/read`: runs each source in the board's
 * World, one by one, and answers values with when and how long each read took.
 */
async function readBoard(board: StoredBoard): Promise<BoardRead> {
  const panels: PanelRead[] = [];
  let run = 0;
  for (const row of board.spec.rows) {
    for (const panel of row.panels) {
      if (!panel.source) continue;
      const took = 30 + ((panel.id.length * 37 + run * 53) % 90);
      await wait(took);
      const base = {
        panel: panel.id,
        status: "ok" as const,
        world: WORLD,
        read_at: new Date().toISOString(),
        took_ms: took,
        run_id: `run-${Date.now().toString(36)}-${run++}`,
      };
      const nodes = AIRPORTS.map((a) => ({
        id: a.code,
        type: "AirRoutes.airport",
        properties: {
          code: a.code,
          name: a.name,
          city: a.city,
          country: a.country,
          runways: a.runways,
          routes_out: a.routesOut,
        },
      }));
      if (panel.kind === "metric") {
        panels.push({
          ...base,
          groups: 1,
          rows: [
            { group: null, measures: { count: WORLD_COUNTS[panel.id] ?? 0 } },
          ],
        });
      } else if (panel.kind === "ranked") {
        panels.push({
          ...base,
          groups: AIRPORTS.length,
          rows: AIRPORTS.map((a) => ({
            group: a.code,
            measures: { routes_out: a.routesOut },
          })),
        });
      } else if (panel.kind === "canvas") {
        const edges = ROUTES.map(([from, to], i) => ({
          id: `r${i}`,
          type: "AirRoutes.route",
          from,
          to,
        }));
        panels.push({ ...base, nodes, edges });
      } else {
        panels.push({ ...base, nodes });
      }
    }
  }
  const oldest =
    panels.map((p) => p.read_at).sort()[0] ?? new Date().toISOString();
  return {
    board: board.id,
    world: WORLD,
    read_at: oldest,
    stale_at: new Date(Date.parse(oldest) + STALE_AFTER_MS).toISOString(),
    panels,
  };
}

// ── Studio's side: format the engine's answer, derive nothing ────────────────

const fmtInt = new Intl.NumberFormat("en");
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function ago(iso: string, now: number): string {
  const min = Math.floor((now - Date.parse(iso)) / 60_000);
  return min < 1
    ? "just now"
    : min < 60
      ? `${min} min ago`
      : `${Math.floor(min / 60)} h ago`;
}

/** A panel's read line, for its footer: when, in which World, how long. */
const readLine = (r: PanelRead) =>
  `${clock(r.read_at)} · ${r.world.name} · ${r.took_ms} ms`;

/** A narrative reference, as the engine resolves it (`PanelRead.refs`): the value, and the row it came from. */
interface Ref {
  ref: string;
  value: number | string | null;
  status: "ok" | "missing" | "refused";
}

/** `{panel.measure}` · `{panel#n.measure}` · `{panel#n.group}`: the engine's lookup, stood in for here. */
function resolveRef(ref: string, reads: Map<string, PanelRead>): Ref {
  const [head = "", key = ""] = ref.split(".");
  const [panel = "", n] = head.split("#");
  const read = reads.get(panel);
  const row = read?.rows?.[n ? Number(n) - 1 : 0];
  const value = row
    ? key === "group"
      ? row.group
      : (row.measures[key] ?? null)
    : null;
  return {
    ref,
    value,
    status:
      read?.status !== "ok" ? "refused" : value === null ? "missing" : "ok",
  };
}

type Kinds = CanvasPanelKinds;

/** The model's hue and the type's key, as the engine would answer them for `AirRoutes.airport`. */
const AIRPORT_STYLING = {
  nodeTypes: { airport: { color: "#0d9488", labelKey: "data.code" } },
};

/** The engine's board and its read, as the kit's `BoardSpec`. */
function toKitBoard(
  board: StoredBoard,
  read: BoardRead | null,
  reading: boolean,
  now: number,
): BoardSpec<Kinds> {
  const reads = new Map((read?.panels ?? []).map((p) => [p.panel, p]));
  const stale = read ? now > Date.parse(read.stale_at) : false;

  const panel = (p: StoredPanel, grow: number): PanelSpec<Kinds> => {
    const r = reads.get(p.id);
    // Read once: a first read draws skeletons; a re-read keeps the values and says so in the footer.
    const footer =
      reading && read
        ? "Reading…"
        : r
          ? readLine(r)
          : p.kind === "narrative"
            ? undefined
            : "Reading…";
    const state = { footer, reading: !read && p.kind !== "narrative" };
    switch (p.kind) {
      case "narrative": {
        // References become the kit's `{n}` figures: Studio formats the engine's value, never looks it up.
        const figures: { value: string | null; source?: string }[] = [];
        const text = read
          ? (p.options?.text ?? "").replace(
              /\{([a-z0-9-]+(?:#\d+)?\.[a-z0-9_]+)\}/g,
              (_, ref: string) => {
                const found = resolveRef(ref, reads);
                const from = reads.get(ref.split(/[#.]/)[0] ?? "");
                figures.push({
                  value:
                    found.value === null
                      ? null
                      : typeof found.value === "number"
                        ? fmtInt.format(found.value)
                        : found.value,
                  source: from
                    ? `${from.panel} · ${readLine(from)}`
                    : undefined,
                });
                return `{${figures.length}}`;
              },
            )
          : "Writing…";
        return {
          id: p.id,
          kind: "narrative",
          title: p.title,
          grow,
          options: { text, figures },
        };
      }
      case "metric": {
        const row = r?.rows?.[0];
        return {
          id: p.id,
          kind: "grid",
          title: p.title,
          ...state,
          grow,
          options: {
            tiles: Object.entries(row?.measures ?? { count: 0 }).map(
              ([name, value]) => ({
                label: name,
                value: fmtInt.format(value),
              }),
            ),
          },
        };
      }
      case "ranked":
        return {
          id: p.id,
          kind: "ranked",
          title: p.title,
          ...state,
          grow,
          options: {
            items: (r?.rows ?? []).map((row) => {
              const value = Object.values(row.measures)[0] ?? 0;
              return {
                label: row.group ?? "—",
                value,
                display: fmtInt.format(value),
              };
            }),
          },
        };
      case "canvas":
        return {
          id: p.id,
          kind: "canvas",
          title: p.title,
          ...state,
          grow,
          flush: true,
          options: { dataRef: p.id, styling: AIRPORT_STYLING },
        };
      case "table": {
        const cols = [
          "code",
          "name",
          "city",
          "country",
          "runways",
          "routes_out",
        ];
        return {
          id: p.id,
          kind: "table",
          title: p.title,
          ...state,
          grow,
          flush: true,
          options: {
            columns: cols.map((key) => ({
              key,
              label: key.replace("_", " "),
              align:
                key === "runways" || key === "routes_out" ? "right" : "left",
              mono: key === "code",
            })),
            rows: (r?.nodes ?? []).map((n) => n.properties),
            noun: "airports",
            sort: { key: "routes_out", dir: "desc" },
          },
        };
      }
    }
  };

  return {
    title: board.title,
    header: {
      crumbs: [board.title],
      chips: [
        { label: read ? read.world.name : WORLD.name, variant: "outline" },
        read
          ? {
              label: `Read ${clock(read.read_at)} · ${ago(read.read_at, now)}`,
              tone: stale ? "warning" : "muted",
            }
          : { label: "Reading…", tone: "running" },
      ],
      actions: [
        {
          id: "refresh",
          label: "Refresh",
          icon: "refresh",
          variant: "outline",
        },
        { id: "story", label: "Story", icon: "story", variant: "ghost" },
        { id: "share", label: "Share", icon: "share", variant: "ghost" },
        { id: "menu", icon: "more", variant: "ghost" },
      ],
    },
    rows: board.spec.rows.map((row) => ({
      ...(row.fill ? { fill: true } : {}),
      panels: row.panels.map((p) => panel(p, p.kind === "canvas" ? 2 : 1)),
    })),
  };
}

/** A canvas panel's graph: the plan's nodes and edges from the engine's read, by panel id. */
function graphOf(read: BoardRead | null, panel: string): GraphData | undefined {
  const r = read?.panels.find((p) => p.panel === panel);
  if (!r?.nodes || !r.edges) return undefined;
  return {
    nodes: r.nodes.map((n) => ({
      id: n.id,
      type: "airport",
      data: n.properties,
    })),
    edges: r.edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      type: "route",
    })),
  };
}

const ICONS = {
  refresh: RefreshCw,
  story: BookOpen,
  share: Share2,
  more: MoreHorizontal,
};

// ── The story ────────────────────────────────────────────────────────────────

interface Args {
  /** Moves Studio's clock on, to see the read time go stale after 15 minutes. */
  minutesLater: number;
}

const meta: Meta<Args> = {
  title: "canvas-ui/boards/ExploreBoard",
  args: { minutesLater: 0 },
  argTypes: {
    minutesLater: { control: { type: "range", min: 0, max: 30, step: 1 } },
  },
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<Args>;

function ExploreBoard({ minutesLater }: Args) {
  const [read, setRead] = useState<BoardRead | null>(null);
  const [reading, setReading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  const refresh = useCallback(() => {
    setReading(true);
    void readBoard(BUSIEST).then((r) => {
      setRead(r);
      setReading(false);
    });
  }, []);

  useEffect(refresh, [refresh]);
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const now = tick + minutesLater * 60_000;
  const spec = useMemo(
    () => toKitBoard(BUSIEST, read, reading, now),
    [read, reading, now],
  );
  // One graph per read: a re-read is a new graph, laid out again.
  const graphs = useMemo(
    () => new Map([["canvas", graphOf(read, "canvas")]]),
    [read],
  );
  const resolveData = useCallback((ref: string) => graphs.get(ref), [graphs]);

  return (
    <div className="bg-background text-foreground h-dvh w-dvw">
      <CanvasBoard
        spec={spec}
        resolveData={resolveData}
        icons={ICONS}
        onAction={(id) => {
          if (id === "refresh") refresh();
        }}
      />
    </div>
  );
}

export const Default: Story = {
  name: "ExploreBoard",
  render: (args) => <ExploreBoard {...args} />,
};
