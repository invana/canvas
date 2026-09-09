# Interface: FrameStats

Windowed frame statistics — a cheap pull-model summary for a HUD / status
bar, computed on demand from a [FrameTick](FrameTick.md) ring buffer. (The push model
is the `render:loop:tick` event; this is the complementary "read the last N"
view.)

## Properties

### count

> **count**: `number`

Number of samples the stats were computed over.

***

### dropped

> **dropped**: `number`

Count of long (jank) frames in the window.

***

### fps

> **fps**: `number`

Median FPS across the window (`1000 / p50Ms`).

***

### maxMs

> **maxMs**: `number`

Worst single frame time (ms) in the window — the dip.

***

### p50Ms

> **p50Ms**: `number`

Median frame time (ms).

***

### p95Ms

> **p95Ms**: `number`

95th-percentile frame time (ms) — the "typical worst" frame.
