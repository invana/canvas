# Roadmap

## The why

**We are not a data visualization library. We are a data exploration tool.**

Visualization libraries render a snapshot and stop. Real understanding doesn't come
from looking at a picture — it comes from *interacting* with the data: asking a
question, filtering, re-laying it out, annotating what you find, and watching the
view respond. Most graph tooling makes you leave the view to change the question.

Invana Canvas is a surface for **making decisions by interacting with your data**.
The picture is a means, not the product. Every visual is something you can
interrogate and change in place.

## The interaction loop

Four ways the user acts on data — all without leaving the canvas:

1. **Pull data via APIs** — grow the picture from a seed; expand neighbourhoods on demand.
2. **Tune the view live** — apply updates to filters, layouts, and behaviours as
   first-class editable state, not config you set once at init.
3. **Annotate to enrich** — add knowledge back onto the data (groups, notes, tags,
   relationships) to capture what you learn.
4. **Run analysis** — queries, short tasks, long-running tasks, and pipelines.

## Division of responsibility

Canvas is the interactive exploration front-end. **Modelling and analysis execution
live in the backend — [invana-backend](https://github.com/invana/invana)** (queries,
tasks, pipelines). Canvas drives and reflects them; it does not own them.

## What's next

Today, behaviours, layers, and layouts are configured at construction time. To make
data genuinely *interactive*, their runtime state has to be **editable from the UI**.

The next effort: schema-driven **editor components in `@invana/canvas-ui` for every
behaviour, layer, and layout**, following the pattern the existing `NodeStyleEditor`
and template editors already establish (`fields.ts` + `mapping.ts` + an `<Editor>`),
applying changes through `useGraphCanvasUpdate().update(...)` → `setOptions`
(init-only options remount via the canvas-react wrapper).

Editors turn the visualization's state into something the user steers —
interaction over illustration, decisions over diagrams.
