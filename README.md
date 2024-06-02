# notion2json

## `NotionQuerier`

This class needs a `NOTION_API_SECRET` environment variable in your project.

### Query a database's pages

```typescript
const querier = new NotionQuerier()

// Query pages sequentially: uses Notion's `next_cursor` after each call
const pages = await querier.queryAllDatabasePages('478cb452-7694-467a-9470-1934dc35ca87')

// Query pages bidirectionally: uses 2 threads, one querying from the oldest created page upward and one from the most recent page downward
const pages = await querier.queryDatabaseBidirectionally('478cb452-7694-467a-9470-1934dc35ca87')

// Query pages by partition: partitions the database based on the creation date and queries all segments concurrently
const pages = await querier.queryAllDatabasePagesByPartition('478cb452-7694-467a-9470-1934dc35ca87', { decreaseRatio: 2, count: 10 })

// Add options to queried pages (uses NotionClient options)
const pages = await querier.queryAllDatabasePages('478cb452-7694-467a-9470-1934dc35ca87', { filter_properties: ['%3BVB%3D', '%3Caie'] })
```

### Retrieve property configurations

```typescript
const querier = new NotionQuerier()

// Retrieve id, type and related databaseId (for relation properties only) of every propery in the database
const propertyConfigs = await querier.fetchDatabasePropertyConfigs('478cb452-7694-467a-9470-1934dc35ca87')
```
