# Type Alias: EventSourceKind

> **EventSourceKind** = `"canvas"` \| `"layer"` \| `"behaviour"` \| `"layout"`

Defined in: [packages/canvas/src/events/CanvasEvent.ts:18](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/events/CanvasEvent.ts#L18)

Telemetry envelope for events crossing into the canvas-wide tap channel.

Architecture: see `architecture-proposal.md` §2.5.

Two channels coexist:
  - **Typed events** — clean payloads on the emitter you care about
    (`canvas.events.on('camera:zoom', ...)`, `graphLayer.events.on('node:click', ...)`).
  - **Tap channel** — a single firehose receiving an envelope for every event
    emitted system-wide (`canvas.events.tap(handler)`). Telemetry sinks subscribe here.

App code uses the first; observability uses the second.

Type strings follow `<source-kind>:<source-id>:<event-name>` so a tap subscriber
can filter without inspecting `source` (e.g. `'layer:graph:node:click'`).
