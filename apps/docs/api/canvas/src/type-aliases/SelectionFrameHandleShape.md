# Type Alias: SelectionFrameHandleShape

> **SelectionFrameHandleShape** = `"circle"` \| `"square"`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L52)

Visual kind of a drag handle. Circles read as "round nub"; squares are
the classic CAD/Figma look. Both kinds use the same hit geometry (a
disk of radius `handleRadius + HIT_PADDING_PX`) so the resize behaviour
doesn't need to branch on shape.
