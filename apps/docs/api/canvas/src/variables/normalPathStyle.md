# Variable: normalPathStyle

> `const` **normalPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [packages/canvas/src/primitives/connectors/pathStyles/normal.ts:11](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/connectors/pathStyles/normal.ts#L11)

Sharp segments. Walks the polyline emitting `M` then `L L L …`.

For a 2-point polyline, this is `[M source, L target]` — equivalent to
the straight-line baseline. For an N-point polyline (router-produced
bends), this draws straight segments between every consecutive pair with
no corner treatment.
