/**
 * **Explore board** — one Explore board, as the boards design draws
 * it: the assistant laid it out, and the engine filled it.
 *
 * | Panel | Kind | Source |
 * |---|---|---|
 * | What it shows | narrative; its numbers are references to other panels' values | — |
 * | In this World | metric tiles (the kit's `grid`) | an aggregate: count |
 * | Most routes out | ranked | an aggregate: routes out by airport |
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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Board, type BoardSpec, type PanelRegistry, type PanelRendererProps, type PanelSpec } from '@invana/boards';
import { GraphBoard } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import { Skeleton } from '@invana/ui';
import { BookOpen, MoreHorizontal, RefreshCw, Share2 } from 'lucide-react';

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
    code: 'IST',
    name: 'Istanbul',
    city: 'Istanbul',
    country: 'TR',
    runways: 3,
    routesOut: 279,
  },
  {
    code: 'FRA',
    name: 'Frankfurt',
    city: 'Frankfurt',
    country: 'DE',
    runways: 4,
    routesOut: 262,
  },
  {
    code: 'AMS',
    name: 'Schiphol',
    city: 'Amsterdam',
    country: 'NL',
    runways: 6,
    routesOut: 255,
  },
  {
    code: 'CDG',
    name: 'Charles de Gaulle',
    city: 'Paris',
    country: 'FR',
    runways: 4,
    routesOut: 248,
  },
  {
    code: 'MUC',
    name: 'Munich',
    city: 'Munich',
    country: 'DE',
    runways: 2,
    routesOut: 199,
  },
  {
    code: 'LHR',
    name: 'Heathrow',
    city: 'London',
    country: 'GB',
    runways: 2,
    routesOut: 191,
  },
  {
    code: 'MAD',
    name: 'Barajas',
    city: 'Madrid',
    country: 'ES',
    runways: 4,
    routesOut: 186,
  },
  {
    code: 'DUB',
    name: 'Dublin',
    city: 'Dublin',
    country: 'IE',
    runways: 2,
    routesOut: 182,
  },
  {
    code: 'BCN',
    name: 'El Prat',
    city: 'Barcelona',
    country: 'ES',
    runways: 3,
    routesOut: 178,
  },
  {
    code: 'FCO',
    name: 'Fiumicino',
    city: 'Rome',
    country: 'IT',
    runways: 4,
    routesOut: 171,
  },
];

const ROUTES: [string, string][] = [
  ['IST', 'FRA'],
  ['IST', 'AMS'],
  ['IST', 'CDG'],
  ['IST', 'MUC'],
  ['IST', 'LHR'],
  ['IST', 'FCO'],
  ['FRA', 'AMS'],
  ['FRA', 'CDG'],
  ['FRA', 'MUC'],
  ['FRA', 'LHR'],
  ['FRA', 'MAD'],
  ['FRA', 'DUB'],
  ['AMS', 'CDG'],
  ['AMS', 'LHR'],
  ['AMS', 'DUB'],
  ['AMS', 'BCN'],
  ['CDG', 'LHR'],
  ['CDG', 'MAD'],
  ['CDG', 'BCN'],
  ['CDG', 'FCO'],
  ['LHR', 'DUB'],
  ['LHR', 'MAD'],
  ['MAD', 'BCN'],
  ['BCN', 'FCO'],
  ['MUC', 'FCO'],
  ['DUB', 'MAD'],
  ['DUB', 'BCN'],
  ['MUC', 'AMS'],
];

/** The World's counts, as the engine's aggregates answer them. */
const WORLD_COUNTS = { airports: 412, routes: 9860, countries: 38 };

const WORLD = { id: 'eu-h1-2026', name: 'EU · H1 2026' };

// ── The engine's side: a stored board holds sources, never values ────────────

interface Plan {
  start: { type: string };
  steps?: { via: string; direction: 'out' | 'in' | 'both'; to: string }[];
  limit: number;
}

type Source = { kind: 'plan'; plan: Plan } | { kind: 'aggregate'; plan: Plan; group_by?: string; measures: string[] };

interface StoredPanel {
  id: string;
  kind: 'narrative' | 'metric' | 'ranked' | 'canvas' | 'table';
  title: string;
  source?: Source;
  /** A narrative's text: `{panel.key}` is a reference to another panel's value. */
  options?: { text?: string };
}

interface StoredBoard {
  id: string;
  title: string;
  world: string;
  spec: { version: 1; rows: { panels: StoredPanel[]; fill?: boolean }[] };
}

const AIRPORT_PLAN: Plan = { start: { type: 'AirRoutes.airport' }, limit: 25 };

/** What `create_board` stored for "Which European airports have the most routes, and how do they connect?". */
const BUSIEST: StoredBoard = {
  id: 'busiest',
  title: 'Busiest airports in Europe',
  world: WORLD.id,
  spec: {
    version: 1,
    rows: [
      {
        panels: [
          {
            id: 'narr',
            kind: 'narrative',
            title: 'What it shows',
            options: {
              text:
                'Istanbul has the most routes out of any airport in this World, {rank.IST}, ahead of Frankfurt ' +
                '{rank.FRA} and Schiphol {rank.AMS}. Across the World, {met.airports} airports in {met.countries} ' +
                'countries fly {met.routes} routes between them.',
            },
          },
          {
            id: 'met',
            kind: 'metric',
            title: 'In this World',
            source: {
              kind: 'aggregate',
              plan: AIRPORT_PLAN,
              measures: ['count'],
            },
          },
        ],
      },
      {
        fill: true,
        panels: [
          {
            id: 'rank',
            kind: 'ranked',
            title: 'Most routes out',
            source: {
              kind: 'aggregate',
              plan: AIRPORT_PLAN,
              group_by: 'code',
              measures: ['count(route out)'],
            },
          },
          {
            id: 'canvas',
            kind: 'canvas',
            title: 'The ten and the routes between them',
            source: {
              kind: 'plan',
              plan: {
                ...AIRPORT_PLAN,
                steps: [
                  {
                    via: 'AirRoutes.route',
                    direction: 'out',
                    to: 'AirRoutes.airport',
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
            id: 'table',
            kind: 'table',
            title: 'Airports',
            source: { kind: 'plan', plan: AIRPORT_PLAN },
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
  status: 'ok' | 'refused' | 'failed';
  world: { id: string; name: string };
  read_at: string;
  took_ms: number;
  run_id: string;
  nodes?: PlanNode[];
  edges?: PlanEdge[];
  rows?: AggregateRow[];
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
        status: 'ok' as const,
        world: WORLD,
        read_at: new Date().toISOString(),
        took_ms: took,
        run_id: `run-${Date.now().toString(36)}-${run++}`,
      };
      const nodes = AIRPORTS.map((a) => ({
        id: a.code,
        type: 'AirRoutes.airport',
        properties: {
          code: a.code,
          name: a.name,
          city: a.city,
          country: a.country,
          runways: a.runways,
          routes_out: a.routesOut,
        },
      }));
      if (panel.kind === 'metric') {
        panels.push({
          ...base,
          rows: [{ group: null, measures: WORLD_COUNTS }],
        });
      } else if (panel.kind === 'ranked') {
        panels.push({
          ...base,
          rows: AIRPORTS.map((a) => ({
            group: a.code,
            measures: { routes_out: a.routesOut },
          })),
        });
      } else if (panel.kind === 'canvas') {
        const edges = ROUTES.map(([from, to], i) => ({
          id: `r${i}`,
          type: 'AirRoutes.route',
          from,
          to,
        }));
        panels.push({ ...base, nodes, edges });
      } else {
        panels.push({ ...base, nodes });
      }
    }
  }
  const oldest = panels.map((p) => p.read_at).sort()[0] ?? new Date().toISOString();
  return {
    board: board.id,
    world: WORLD,
    read_at: oldest,
    stale_at: new Date(Date.parse(oldest) + STALE_AFTER_MS).toISOString(),
    panels,
  };
}

// ── Studio's side: format the engine's answer, derive nothing ────────────────

const fmtInt = new Intl.NumberFormat('en');
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function ago(iso: string, now: number): string {
  const min = Math.floor((now - Date.parse(iso)) / 60_000);
  return min < 1 ? 'just now' : min < 60 ? `${min} min ago` : `${Math.floor(min / 60)} h ago`;
}

/** A panel's read line: when, in which World, how long. The kit has no panel footer yet, so it sits in `aside`. */
const readLine = (r: PanelRead) => `${clock(r.read_at)} · ${r.world.name} · ${r.took_ms} ms`;

/** A narrative reference's value: another panel's figure exactly as the engine answered it. */
function resolveRef(ref: string, reads: Map<string, PanelRead>): string {
  const [panel, key] = ref.split('.');
  const rows = reads.get(panel ?? '')?.rows ?? [];
  const grouped = rows.find((r) => r.group === key);
  const value = grouped ? Object.values(grouped.measures)[0] : key ? rows[0]?.measures[key] : undefined;
  return value === undefined ? '—' : fmtInt.format(value);
}

type Kinds = { canvas: { panel: string } };

/** The engine's board and its read, as the kit's `BoardSpec`. */
function toKitBoard(board: StoredBoard, read: BoardRead | null, reading: boolean, now: number): BoardSpec<Kinds> {
  const reads = new Map((read?.panels ?? []).map((p) => [p.panel, p]));
  const stale = read ? now > Date.parse(read.stale_at) : false;

  const panel = (p: StoredPanel, grow: number): PanelSpec<Kinds> => {
    const r = reads.get(p.id);
    const aside = reading && read ? 'Reading…' : r ? readLine(r) : undefined;
    const waiting = !read && p.kind !== 'narrative';
    if (waiting) {
      return {
        id: p.id,
        kind: 'text',
        title: p.title,
        aside: 'Reading…',
        grow,
        options: { text: '' },
        render: <Skeleton className="h-24 w-full" />,
      };
    }
    switch (p.kind) {
      case 'narrative': {
        const text = read
          ? (p.options?.text ?? '').replace(
              /\{([a-zA-Z]+\.[a-zA-Z0-9]+)\}/g,
              (_, ref: string) => `**${resolveRef(ref, reads)}**`,
            )
          : 'Writing…';
        return {
          id: p.id,
          kind: 'narrative',
          title: p.title,
          grow,
          options: { text },
        };
      }
      case 'metric': {
        const m = r?.rows?.[0]?.measures ?? {};
        return {
          id: p.id,
          kind: 'grid',
          title: p.title,
          aside,
          grow,
          options: {
            tiles: [
              {
                label: 'Airports',
                value: fmtInt.format(m.airports ?? 0),
                delta: `in ${WORLD.name}`,
              },
              {
                label: 'Routes',
                value: fmtInt.format(m.routes ?? 0),
                delta: 'between them',
              },
              {
                label: 'Countries',
                value: fmtInt.format(m.countries ?? 0),
                delta: 'with an airport',
              },
            ],
          },
        };
      }
      case 'ranked':
        return {
          id: p.id,
          kind: 'ranked',
          title: p.title,
          aside,
          grow,
          options: {
            items: (r?.rows ?? []).map((row) => {
              const value = Object.values(row.measures)[0] ?? 0;
              return {
                label: row.group ?? '—',
                value,
                display: fmtInt.format(value),
              };
            }),
          },
        };
      case 'canvas':
        return {
          id: p.id,
          kind: 'canvas',
          title: p.title,
          aside,
          grow,
          flush: true,
          options: { panel: p.id },
        };
      case 'table': {
        const cols = ['code', 'name', 'city', 'country', 'runways', 'routes_out'];
        return {
          id: p.id,
          kind: 'table',
          title: p.title,
          aside,
          grow,
          flush: true,
          options: {
            columns: cols.map((key) => ({
              key,
              label: key.replace('_', ' '),
              align: key === 'runways' || key === 'routes_out' ? 'right' : 'left',
              mono: key === 'code',
            })),
            rows: (r?.nodes ?? []).map((n) => n.properties),
            noun: 'airports',
            sort: { key: 'routes_out', dir: 'desc' },
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
        { label: read ? read.world.name : WORLD.name, variant: 'outline' },
        read
          ? {
              label: `Read ${clock(read.read_at)} · ${ago(read.read_at, now)}`,
              tone: stale ? 'warning' : 'muted',
            }
          : { label: 'Reading…', tone: 'running' },
      ],
      actions: [
        {
          id: 'refresh',
          label: 'Refresh',
          icon: 'refresh',
          variant: 'outline',
        },
        { id: 'story', label: 'Story', icon: 'story', variant: 'ghost' },
        { id: 'share', label: 'Share', icon: 'share', variant: 'ghost' },
        { id: 'menu', icon: 'more', variant: 'ghost' },
      ],
    },
    rows: board.spec.rows.map((row) => ({
      ...(row.fill ? { fill: true } : {}),
      panels: row.panels.map((p) => panel(p, p.kind === 'canvas' || p.kind === 'metric' ? 2 : 1)),
    })),
  };
}

// ── The `canvas` panel kind: `GraphBoard` over the engine's nodes and edges ──

const ReadContext = createContext<BoardRead | null>(null);

function CanvasBoardPanel({ options }: PanelRendererProps<{ panel: string }>) {
  const read = useContext(ReadContext);
  const r = read?.panels.find((p) => p.panel === options.panel);
  // One graph per run: a re-read is a new graph, laid out again.
  const data = useMemo<GraphData | null>(
    () =>
      r?.nodes && r.edges
        ? {
            nodes: r.nodes.map((n) => ({
              id: n.id,
              type: 'airport',
              data: n.properties,
            })),
            edges: r.edges.map((e) => ({
              id: e.id,
              source: e.from,
              target: e.to,
              type: 'route',
            })),
          }
        : null,
    [r?.run_id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // The panel body is as tall as its row; the canvas takes all of it.
  if (!data) return <Skeleton className="m-3 min-h-0 flex-1" />;
  return (
    <div className="min-h-0 flex-1">
      <GraphBoard data={data} defaultPanel={null} />
    </div>
  );
}

const REGISTRY: PanelRegistry = { canvas: CanvasBoardPanel };
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
  title: 'canvas-ui/boards/ExploreBoard',
  args: { minutesLater: 0 },
  argTypes: {
    minutesLater: { control: { type: 'range', min: 0, max: 30, step: 1 } },
  },
  parameters: { layout: 'fullscreen' },
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
  const spec = useMemo(() => toKitBoard(BUSIEST, read, reading, now), [read, reading, now]);

  return (
    <ReadContext.Provider value={read}>
      <div className="bg-background text-foreground h-dvh w-dvw">
        <Board<Kinds>
          spec={spec}
          registry={REGISTRY}
          icons={ICONS}
          onAction={(id) => {
            if (id === 'refresh') refresh();
          }}
        />
      </div>
    </ReadContext.Provider>
  );
}

export const Default: Story = {
  name: 'ExploreBoard',
  render: (args) => <ExploreBoard {...args} />,
};
