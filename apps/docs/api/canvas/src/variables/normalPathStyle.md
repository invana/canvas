# Variable: normalPathStyle

> `const` **normalPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [canvas/src/primitives/connectors/pathStyles/normal.ts:11](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/connectors/pathStyles/normal.ts#L11)

Sharp segments. Walks the polyline emitting `M` then `L L L …`.

For a 2-point polyline, this is `[M source, L target]` — equivalent to
the straight-line baseline. For an N-point polyline (router-produced
bends), this draws straight segments between every consecutive pair with
no corner treatment.
