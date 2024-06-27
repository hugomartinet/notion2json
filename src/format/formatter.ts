import { PartialUserObjectResponse, RichTextItemResponse, UserObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { compact } from 'lodash'
import { Page, Property } from '../common/types'
import {
  Databases,
  DateProperty,
  FileProperty,
  FormattedPage,
  FormattedProperty,
  FormulaProperty,
  RelationProperty,
  RollupProperty,
} from './types'

export class NotionFormatter {
  private databases: Databases

  constructor(databases: Databases) {
    this.databases = databases
  }

  public formatDatabase(databaseId: string): FormattedPage[] {
    const pages = this.databases[databaseId]?.pages
    if (!pages) throw new Error(`Database not found ${databaseId}`)
    return pages.map(page => this.formatPage(databaseId, page))
  }

  public formatPage(databaseId: string, page: Page) {
    const propertyConfigs = this.databases[databaseId]?.propertyConfigs
    if (!propertyConfigs) throw new Error(`Property configs not found for database ${databaseId}`)
    const propertyIds = propertyConfigs.map(config => config.id)

    const formattedPage: FormattedPage = Object.fromEntries(propertyIds.map(propertyId => [propertyId, undefined]))
    formattedPage.id = { text: page.id, url: page.url }

    for (const propertyId of propertyIds) {
      const property = Object.values(page.properties).find(property => property.id === propertyId)
      if (property) formattedPage[propertyId] = this.formatProperty(databaseId, property)
    }

    return formattedPage
  }

  private formatProperty(databaseId: string, property: Property): FormattedProperty | FormattedProperty[] {
    switch (property.type) {
      case 'number':
        return property.number ?? undefined
      case 'url':
        return property.url ? { text: property.url, url: property.url } : undefined
      case 'checkbox':
        return property.checkbox
      case 'created_by':
        return this.formatUser(property.created_by)
      case 'created_time':
        return new Date(property.created_time)
      case 'date':
        return this.formatDate(property.date)
      case 'email':
        return property.email ?? undefined
      case 'files':
        return property.files.map(this.formatFile)
      case 'formula':
        return this.formatFormula(property.formula)
      case 'last_edited_by':
        return this.formatUser(property.last_edited_by)
      case 'last_edited_time':
        return new Date(property.last_edited_time)
      case 'multi_select':
        return property.multi_select.map(option => option.name)
      case 'people':
        return property.people.map(this.formatUser)
      case 'phone_number':
        return property.phone_number ?? undefined
      case 'relation':
        return this.formatRelation(databaseId, property)
      case 'rich_text':
        return property.rich_text.map(this.formatText)
      case 'rollup':
        return this.formatRollup(databaseId, property.rollup)
      case 'select':
        return property.select?.name ?? undefined
      case 'status':
        return property.status?.name ?? undefined
      case 'title':
        return property.title.map(this.formatText)
      case 'unique_id':
        return this.formatUniqueId(property.unique_id)
      case 'verification':
        return property.verification?.state ?? undefined
      default:
        return undefined
    }
  }

  private formatUser(user: PartialUserObjectResponse | UserObjectResponse) {
    return (user as UserObjectResponse).name ?? undefined
  }

  private formatDate(date?: DateProperty['date']) {
    return compact([date?.start && new Date(date.start), date?.end && new Date(date.end)])
  }

  private formatText(text: RichTextItemResponse) {
    return text.href ? { text: text.plain_text, url: text.href } : text.plain_text || undefined
  }

  private formatFile(file: FileProperty['files'][number]) {
    return { text: file.name, url: 'external' in file ? file.external.url : file.file.url }
  }

  private formatUniqueId(id: { prefix: string | null; number: number | null }) {
    if (!id.number) return undefined
    return id.prefix ? `${id.prefix}-${id.number}` : id.number.toString()
  }

  private formatFormula(formula: FormulaProperty['formula']) {
    switch (formula.type) {
      case 'boolean':
        return formula.boolean ?? undefined
      case 'date':
        return this.formatDate(formula.date)
      case 'number':
        return formula.number ?? undefined
      case 'string':
        return formula.string || undefined
      default:
        return undefined
    }
  }

  private formatRollup(databaseId: string, rollup: RollupProperty['rollup']) {
    switch (rollup.type) {
      case 'number':
        return rollup.number ?? undefined
      case 'date':
        return this.formatDate(rollup.date)
      case 'array':
        return rollup.array.flatMap(item => this.formatProperty(databaseId, item as Property))
    }
  }

  private formatRelation(databaseId: string, property: RelationProperty) {
    const relationDatabaseId = this.databases[databaseId]?.propertyConfigs.find(config => config.id === property.id)?.relation?.databaseId
    if (!relationDatabaseId) throw new Error(`Relation database ID not found for property ${property.id}`)
    return property.relation.flatMap(relation => {
      const relatedPage = this.databases[relationDatabaseId]?.pages.find(page => page.id === relation.id)
      if (!relatedPage) return undefined
      const relatedPageTitle = Object.values(relatedPage.properties).find(relatedPageProperty => relatedPageProperty.type === 'title')
      if (!relatedPageTitle) return undefined
      return this.formatProperty(relationDatabaseId, relatedPageTitle)
    })
  }
}
