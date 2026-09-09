# Interface: HttpMeterOptions

Options for [createHttpMeter](../functions/createHttpMeter.md).

## Properties

### batchMs?

> `optional` **batchMs?**: `number`

Max time (ms) a record waits before its batch is POSTed. Default `1000`.

***

### maxBatch?

> `optional` **maxBatch?**: `number`

Force a flush once the buffer reaches this many records. Default `600`.
