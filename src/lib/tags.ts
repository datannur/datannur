import db from '@db'
import { capitalize } from '@lib/util'
import type { Tag, EntityWithRelations } from '@type'

type TagWithCounts = Tag & {
  nbOrganization: number
  nbFolder: number
  nbDataset: number
}

export default class Tags {
  static getFromEntities(entities: {
    organizations?: EntityWithRelations[]
    folders?: EntityWithRelations[]
    datasets?: EntityWithRelations[]
  }) {
    const tagsDb = db.getAll('tag')
    const tagsById: Record<string | number, TagWithCounts> = {}

    const tags: TagWithCounts[] = tagsDb.map(tag => ({
      ...tag,
      nbOrganization: 0,
      nbFolder: 0,
      nbDataset: 0,
    }))
    for (const tag of tags) {
      tagsById[tag.id] = tag
    }

    function incrementTagItemNb(
      items: EntityWithRelations[] | undefined,
      entity: string,
    ) {
      if (!items) return
      for (const item of items) {
        if (!item.tags) continue
        for (const tag of item.tags) {
          const tagWithCount = tagsById[tag.id]
          if (tagWithCount) {
            const key = ('nb' + capitalize(entity)) as keyof TagWithCounts
            ;(tagWithCount[key] as number)++
          }
        }
      }
    }
    incrementTagItemNb(entities.organizations, 'organization')
    incrementTagItemNb(entities.folders, 'folder')
    incrementTagItemNb(entities.datasets, 'dataset')

    for (const tag of tags) {
      tag.nbOrganization = tagsById[tag.id].nbOrganization
      tag.nbFolder = tagsById[tag.id].nbFolder
      tag.nbDataset = tagsById[tag.id].nbDataset
    }
    return tags.filter(
      (tag: TagWithCounts) =>
        tag.nbOrganization > 0 || tag.nbFolder > 0 || tag.nbDataset > 0,
    )
  }
}
