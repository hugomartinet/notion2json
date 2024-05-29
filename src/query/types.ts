import type { PageObjectResponse, QueryDatabaseParameters, QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'

export type QueryDatabaseOptions = Omit<QueryDatabaseParameters, 'database_id'>

export interface DatabaseResponse extends QueryDatabaseResponse {
  results: PageObjectResponse[]
}

export type PartitionOptions = { decreaseRatio?: number; count?: number }
