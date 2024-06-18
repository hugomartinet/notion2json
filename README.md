# notion2json

A library built with Bun and Notion API client to extract and parse data from a Notion database.

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

// Retrieve id, type and related databaseId (for relation properties only) of every property in the database
const propertyConfigs = await querier.fetchDatabasePropertyConfigs('478cb452-7694-467a-9470-1934dc35ca87')
```

## `NotionFormatter`

This class needs to be initiated with the `pages` and `propertyConfigs`, which can be fetched by the `NotionQuerier`.

### Format database pages

```typescript
const formatter = new NotionFormatter({ '478cb452-7694-467a-9470-1934dc35ca87': { pages, propertyConfigs } })

// Format all pages in the given database to JSON objects with property ids as keys and property content as values
const formattedPages = formatter.formatDatabase('478cb452-7694-467a-9470-1934dc35ca87')
```

> [!WARNING]
> You must provide the `NotionFormatter` with all databases that will be needed to format the pages' properties. This means that if one of the properties in the formatted database is a relation prop towards another database, you will need to provide the `NotionFormatter` the pointed database as well.

#### Example

The return value of the `formatDatabase()` method will be an array of pages. Each of these pages will be an object where **keys are property IDs** and **values are formatted values from the Notion page**. For instance, a formatted page would look like:

```typescript
{
  id:
  qPsw: "Done",
  "qby%3F": [""],
  "s%3C%3Fk": 1,
  "s%5Cxn": ["John Doe"],
  "s_~%7C": [{ text: "john.doe@gmail.com", url: "mailto:john.doe@gmail.com" }],
  tgaC: ["1550 Notion Street"],
  tkIR: "",
  ugTi: [],
  vJrh: 1,
  "vm%7Cc": "",
  "z%5EUR": 2023-03-02T13:07:00.000Z,
  "zvJ~": "IDF",
  "%7BXp%5C": [2024-02-26T00:00:00.000Z],
  "%7BloJ": [],
  "%7DsuD": "",
  "~OYv": "",
  title: ["John's Todo List"],
  id: { text: "06cae4ca-5542-444c-adde-b48a2dcca40b", url: "https://www.notion.so/06cae4ca5542444caddeb48a2dcca40b" }
}

```
