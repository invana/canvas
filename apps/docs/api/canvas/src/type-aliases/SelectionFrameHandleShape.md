# Type Alias: SelectionFrameHandleShape

> **SelectionFrameHandleShape** = `"circle"` \| `"square"`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:52](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L52)

Visual kind of a drag handle. Circles read as "round nub"; squares are
the classic CAD/Figma look. Both kinds use the same hit geometry (a
disk of radius `handleRadius + HIT_PADDING_PX`) so the resize behaviour
doesn't need to branch on shape.
