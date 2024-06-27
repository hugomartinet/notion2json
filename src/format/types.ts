import { Page, Property, PropertyConfig } from '../common/types'

export type DateProperty = Extract<Property, { type: 'date' }>
export type FileProperty = Extract<Property, { type: 'files' }>
export type FormulaProperty = Extract<Property, { type: 'formula' }>
export type RollupProperty = Extract<Property, { type: 'rollup' }>
export type RelationProperty = Extract<Property, { type: 'relation' }>

export type Databases = { [databaseId: string]: { pages: Page[]; propertyConfigs: PropertyConfig[] } }

export type FormattedProperty = number | string | boolean | Date | { text: string; url: string } | undefined
export type FormattedPage = { [propertyId: string]: FormattedProperty | FormattedProperty[] }
