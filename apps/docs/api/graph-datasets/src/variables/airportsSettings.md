# Variable: airportsSettings

> `const` **airportsSettings**: [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Recommended look for the **air routes** airport set.

Airports are geography, not topology: every node's real position comes from
projecting `data.lng` / `data.lat` through whichever map the consumer mounts, so
there is **no layout** (`activeLayout: ''`) and dragging is off — a moved airport
is a wrong airport. Marks are small and uniform because 2,980 of them overlap
heavily at world zoom.
