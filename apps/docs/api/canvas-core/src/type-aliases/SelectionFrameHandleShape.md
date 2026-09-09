# Type Alias: SelectionFrameHandleShape

> **SelectionFrameHandleShape** = `"circle"` \| `"square"`

Visual kind of a drag handle. Circles read as "round nub"; squares are
the classic CAD/Figma look. Both kinds use the same hit geometry (a
disk of radius `handleRadius + HIT_PADDING_PX`) so the resize behaviour
doesn't need to branch on shape.
