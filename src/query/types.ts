import type { QueryDatabaseParameters, QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import { Page } from '../common/types'

export type QueryDatabaseOptions = Omit<QueryDatabaseParameters, 'database_id'>

export interface DatabaseResponse extends QueryDatabaseResponse {
  results: Page[]
}

export type PartitionOptions = { decreaseRatio?: number; count?: number }
