import { Client } from '@notionhq/client'
import { chain } from 'lodash'
import { Page, PropertyConfig } from '../common/types'
import type { DatabaseResponse, PartitionOptions, QueryDatabaseOptions } from './types'
import { getDecreasingSizePartitionBetween, getIntervals } from './utils'

export class NotionQuerier extends Client {
  constructor() {
    super({ auth: Bun.env.NOTION_API_SECRET })
  }

  public async queryDatabasePage(databaseId: string, options?: QueryDatabaseOptions, retries: number = 0): Promise<DatabaseResponse> {
    try {
      const response = await this.databases.query({
        page_size: 100,
        ...options,
        database_id: databaseId,
      })
      return { ...response, results: response.results as Page[] }
    } catch (error: any) {
      if (retries < 3) return this.queryDatabasePage(databaseId, options, retries + 1)
      throw error
    }
  }

  public async queryAllDatabasePages(databaseId: string, options?: Omit<QueryDatabaseOptions, 'start_cursor'>): Promise<Page[]> {
    const results: Page[] = []
    let cursor: string | undefined
    while (true) {
      const query = await this.queryDatabasePage(databaseId, { ...options, start_cursor: cursor })
      results.push(...query.results)
      if (!query.has_more || !query.next_cursor) break
      cursor = query.next_cursor
    }
    return results
  }

  public async queryAllDatabasePagesWithFilterPartition(
    databaseId: string,
    filters: QueryDatabaseOptions['filter'][],
    options?: Omit<QueryDatabaseOptions, 'start_cursor' | 'filter'>
  ): Promise<Page[]> {
    const results = await Promise.all(filters.map(filter => this.queryAllDatabasePages(databaseId, { ...options, filter })))

    const pages = chain(results)
      .flatten()
      .uniqBy(result => result.id)
      .sortBy(result => result.created_time)
      .value()

    return pages
  }

  public async queryAllDatabasePagesByPartition(
    databaseId: string,
    partitionOptions?: PartitionOptions,
    options?: Omit<QueryDatabaseOptions, 'start_cursor' | 'filter'>
  ): Promise<Page[]> {
    const [oldestPageQuery, newestPageQuery] = await Promise.all([
      this.queryDatabasePage(databaseId, { page_size: 1, sorts: [{ timestamp: 'created_time', direction: 'ascending' }] }),
      this.queryDatabasePage(databaseId, { page_size: 1, sorts: [{ timestamp: 'created_time', direction: 'descending' }] }),
    ])
    if (!oldestPageQuery.results[0] || !newestPageQuery.results[0]) return []
    const oldestCreationTime = new Date(oldestPageQuery.results[0].created_time)
    const newestCreationTime = new Date(newestPageQuery.results[0].created_time)
    const partition = getDecreasingSizePartitionBetween(oldestCreationTime.getTime(), newestCreationTime.getTime(), partitionOptions)
    const intervals = getIntervals(partition)
    const filters: QueryDatabaseOptions['filter'][] = intervals.map(interval => ({
      and: [
        { created_time: { on_or_after: new Date(interval[0]).toISOString() }, timestamp: 'created_time' },
        { created_time: { on_or_before: new Date(interval[1]).toISOString() }, timestamp: 'created_time' },
      ],
    }))

    const pages = await this.queryAllDatabasePagesWithFilterPartition(databaseId, filters, options)

    return pages
  }

  public async queryDatabaseBidirectionally(
    databaseId: string,
    options?: Omit<QueryDatabaseOptions, 'start_cursor' | 'sorts'>
  ): Promise<Page[]> {
    const results: Page[] = []
    let startCursor: string | undefined
    let endCursor: string | undefined

    while (true) {
      const [startQuery, endQuery] = await Promise.all([
        this.queryDatabasePage(databaseId, {
          ...options,
          start_cursor: startCursor,
          sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
        }),
        this.queryDatabasePage(databaseId, {
          ...options,
          start_cursor: endCursor,
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        }),
      ])
      results.push(...startQuery.results)
      results.push(...endQuery.results)
      if (
        !startQuery.next_cursor ||
        !endQuery.next_cursor ||
        (results.some(result => result.id === startQuery.next_cursor) && results.some(result => result.id === endQuery.next_cursor))
      )
        break
      startCursor = startQuery.next_cursor
      endCursor = endQuery.next_cursor
    }

    return chain(results)
      .uniqBy(result => result.id)
      .sortBy(result => result.created_time)
      .value()
  }

  public async fetchDatabasePropertyConfigs(databaseId: string): Promise<PropertyConfig[]> {
    const schema = await this.databases.retrieve({ database_id: databaseId })
    return Object.values(schema.properties).map(property => ({
      id: property.id,
      name: property.name,
      type: property.type,
      relation: property.type === 'relation' ? { databaseId: property.relation.database_id } : undefined,
    }))
  }
}
