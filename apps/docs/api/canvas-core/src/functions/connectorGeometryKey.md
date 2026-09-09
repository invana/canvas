# Function: connectorGeometryKey()

> **connectorGeometryKey**(`spec`): `string`

Stable key of a connector spec with paint removed — geometry only.

Two specs with the same key route to the same path, so a caller can skip a
re-route when only `stroke` changed. Pure: it reads the spec and nothing
else, which is why it lives here rather than on a renderer.

## Parameters

### spec

`object`

## Returns

`string`
