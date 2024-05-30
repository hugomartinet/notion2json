import { Client } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { chain } from 'lodash'
import type { DatabaseResponse, PartitionOptions, QueryDatabaseOptions } from './types'
import { getDecreasingSizePartitionBetween, getIntervals } from './utils'

export class NotionClient extends Client {
  constructor() {
    super({ auth: Bun.env.NOTION_API_SECRET })
  }

  public async queryDatabasePage(databaseId: string, options?: QueryDatabaseOptions): Promise<DatabaseResponse> {
    try {
      const response = await this.databases.query({
        page_size: 100,
        ...options,
        database_id: databaseId,
      })
      return { ...response, results: response.results as PageObjectResponse[] }
    } catch (error: any) {
      if (error.code === 'notionhq_client_request_timeout') return this.queryDatabasePage(databaseId, options)
      throw error
    }
  }

  public async queryAllDatabasePages(databaseId: string, options?: Omit<QueryDatabaseOptions, 'start_cursor'>) {
    const results: PageObjectResponse[] = []
    let cursor: string | undefined
    while (true) {
      const query = await this.queryDatabasePage(databaseId, { ...options, start_cursor: cursor })
      results.push(...query.results)
      if (!query.has_more || !query.next_cursor) break
      cursor = query.next_cursor
    }
    return results
  }

  public async queryMissingDatabasePages(
    databaseId: string,
    results: PageObjectResponse[],
    options?: Omit<QueryDatabaseOptions, 'start_cursor'>
  ) {
    let cursor: string | undefined
    while (true) {
      const query = await this.queryDatabasePage(databaseId, { ...options, start_cursor: cursor })
      results.push(...query.results)
      if (!query.has_more || !query.next_cursor || results.some(result => result.id === query.next_cursor)) break
      cursor = query.next_cursor
    }
    return results
  }

  public async queryAllDatabasePagesByPartition(
    databaseId: string,
    partitionOptions?: PartitionOptions,
    options?: Omit<QueryDatabaseOptions, 'start_cursor' | 'filter'>
  ) {
    const [oldestPageQuery, newestPageQuery] = await Promise.all([
      this.queryDatabasePage(databaseId, { page_size: 1, sorts: [{ timestamp: 'created_time', direction: 'ascending' }] }),
      this.queryDatabasePage(databaseId, { page_size: 1, sorts: [{ timestamp: 'created_time', direction: 'descending' }] }),
    ])
    const oldestCreationTime = new Date(oldestPageQuery.results[0].created_time)
    const newestCreationTime = new Date(newestPageQuery.results[0].created_time)
    const partition = getDecreasingSizePartitionBetween(oldestCreationTime.getTime(), newestCreationTime.getTime(), partitionOptions)
    const intervals = getIntervals(partition)

    const results = await Promise.all(
      intervals.map(interval =>
        this.queryAllDatabasePages(databaseId, {
          ...options,
          filter: {
            and: [
              { created_time: { on_or_after: new Date(interval[0]).toISOString() }, timestamp: 'created_time' },
              { created_time: { on_or_before: new Date(interval[1]).toISOString() }, timestamp: 'created_time' },
            ],
          },
        })
      )
    )

    return chain(results)
      .flatten()
      .uniqBy(result => result.id)
      .sortBy(result => result.created_time)
      .value()
  }

  public async queryDatabaseBidirectionally(databaseId: string, options?: Omit<QueryDatabaseOptions, 'start_cursor' | 'sorts'>) {
    const results: PageObjectResponse[] = []
    await Promise.all([
      this.queryMissingDatabasePages(databaseId, results, { ...options, sorts: [{ timestamp: 'created_time', direction: 'ascending' }] }),
      this.queryMissingDatabasePages(databaseId, results, { ...options, sorts: [{ timestamp: 'created_time', direction: 'descending' }] }),
    ])
    return chain(results)
      .uniqBy(result => result.id)
      .sortBy(result => result.created_time)
      .value()
  }
}