# notion2json

To install dependencies:

```bash
bun install
```

This project was created using `bun init` in bun v1.1.8. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Query

Use the `NotionQuerier` class to query pages in a Notion database.
In order to query all pages of a database, the querier exposes several methods :

- `NotionQuerier.queryAllDatabasePages`: which queries pages one after the other using Notion's `next_cursor` return value
- `NotionQuerier.queryDatabaseBidirectionally`: which uses 2 threads, one querying from the oldest created page upward, and one from the most recent page downward
- `NotionQuerier.queryAllDatabasePagesByPartition`: which partitions the database into a defined number of segments (based on the creation date) and queries all segments concurrently
