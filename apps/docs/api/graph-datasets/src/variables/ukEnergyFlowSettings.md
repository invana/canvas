# Variable: ukEnergyFlowSettings

> `const` **ukEnergyFlowSettings**: [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Recommended look for the **UK energy flow** Sankey.

A flow diagram, so it expects a `D3SankeyLayout` mounted under the id `layout`.
The ribbons are the data — edge width comes from the layout, and the endpoints
attach to node faces (`edge-port`) rather than being trimmed at an outline, which
is what keeps a ribbon flush against its bar.
