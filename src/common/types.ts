import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

export type Page = PageObjectResponse
export type Property = Page['properties'][string]
export type PropertyType = Property['type']

export type PropertyConfig = { id: string; type: PropertyType; relation?: { databaseId: string } }
