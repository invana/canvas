/**
 * **Board story** — a board walked step by step, with no engine behind it.
 *
 * `BoardStory` is the kit's `Presenter` over a board's bottom edge. Each step names a panel
 * (the subject: the host passes `focus` on it, and the others step back), what is said, and what
 * the canvas lights (`canvas: { canvasId, ids, camera }`). The host also calls out a record inside
 * a panel with the kind's own `highlight` — here a table row. Closing clears the focus and puts the
 * camera back where the viewer left it.
 *
 * | Step | Subject | Lights |
 * |---|---|---|
 * | 1 | the table | its first row |
 * | 2 | the canvas | three nodes; the camera frames them |
 * | 3 | the canvas | none; the camera fits all |
 */

import { useCallback, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { BoardSpec } from "@invana/boards";
import {
  BoardStory,
  type BoardStoryStep,
  type CanvasPanelKinds,
} from "@invana/canvas-ui/boards";
import { CanvasBoardProvider } from "@invana/canvas-ui/boards";
import { Board } from "@invana/boards";
import { CANVAS_PANELS } from "@invana/canvas-ui/boards";
import type { GraphData } from "@invana/graph";

const CITIES = ["IST", "FRA", "CDG", "AMS", "MAD", "LHR"];
const GRAPH = {
  nodes: CITIES.map((id) => ({ id, type: "airport", data: { code: id } })),
  edges: CITIES.slice(1).map((id, i) => ({
    id: `e${i}`,
    source: "IST",
    target: id,
    type: "route",
  })),
} as unknown as GraphData;

const meta: Meta = {
  title: "canvas-ui/boards/BoardStory",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const STEPS: BoardStoryStep[] = [
  {
    id: "table",
    title: "Airports",
    narration: "The first airport in the list is lit.",
    panel: "table",
  },
  {
    id: "hub",
    title: "The hub",
    narration: "Three of the routes out of Istanbul.",
    panel: "map",
    canvas: { canvasId: "map", ids: ["IST", "FRA", "CDG"], camera: "focus" },
  },
  {
    id: "all",
    title: "All of it",
    narration: "Everything, framed.",
    panel: "map",
    canvas: { canvasId: "map", ids: [], camera: "fit" },
  },
];

function Walk() {
  const [playing, setPlaying] = useState(true);
  const [on, setOn] = useState<BoardStoryStep | null>(null);
  const spec = useMemo<BoardSpec<CanvasPanelKinds>>(
    () => ({
      title: "Airports",
      rows: [
        {
          fill: true,
          panels: [
            {
              id: "map",
              kind: "canvas",
              title: "Routes",
              flush: true,
              ...(on?.panel === "map" ? { focus: true } : {}),
              options: { dataRef: "map", canvasId: "map" },
            },
          ],
        },
        {
          panels: [
            {
              id: "table",
              kind: "table",
              title: "Airports",
              flush: true,
              ...(on?.panel === "table" ? { focus: true } : {}),
              options: {
                columns: [{ key: "code", label: "code" }],
                rows: CITIES.map((code) => ({ code })),
                noun: "airports",
                ...(on?.panel === "table" ? { highlight: [0] } : {}),
              },
            },
          ],
        },
      ],
    }),
    [on],
  ) as BoardSpec<CanvasPanelKinds>;
  const resolveData = useCallback(() => GRAPH, []);
  const onStep = useCallback((s: BoardStoryStep | null) => setOn(s), []);
  const close = useCallback(() => setPlaying(false), []);

  return (
    <div className="bg-background text-foreground h-dvh w-dvw">
      <CanvasBoardProvider resolveData={resolveData}>
        <div className="relative h-full">
          <Board<CanvasPanelKinds> spec={spec} registry={CANVAS_PANELS} />
          {playing ? (
            <BoardStory
              steps={STEPS}
              label="Airports story"
              onStep={onStep}
              onClose={close}
            />
          ) : (
            <button
              type="button"
              className="absolute bottom-3 left-3 rounded border px-2 py-1"
              onClick={() => setPlaying(true)}
            >
              Play again
            </button>
          )}
        </div>
      </CanvasBoardProvider>
    </div>
  );
}

export const Default: Story = { name: "BoardStory", render: () => <Walk /> };
