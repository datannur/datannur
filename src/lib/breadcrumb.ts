import db from '@db'
import type { MainEntityName, MetaVariable } from '@type'

type RecursiveBreadcrumbEntityName =
  | 'organization'
  | 'folder'
  | 'tag'
  | 'concept'

export type BreadcrumbItem = {
  type: MainEntityName
  id: string | number
  name: string
  href?: string
}

function toBreadcrumbItem(
  type: MainEntityName,
  item: { id?: string | number; name: string },
): BreadcrumbItem | undefined {
  if (item.id === undefined) return undefined
  return { type, id: item.id, name: item.name }
}

function getRecursiveItems(
  type: RecursiveBreadcrumbEntityName,
  id: string | number,
  includeSelf = false,
): BreadcrumbItem[] {
  const items = db.getParents(type, id).reverse()
  if (includeSelf) {
    const current = db.get(type, id)
    if (current) items.push(current)
  }
  return items.flatMap(item => {
    const breadcrumbItem = toBreadcrumbItem(type, item)
    return breadcrumbItem ? [breadcrumbItem] : []
  })
}

function getFolderItems(
  folderId: string | number | undefined,
): BreadcrumbItem[] {
  return folderId ? getRecursiveItems('folder', folderId, true) : []
}

function getMetaFolderItem(metaFolderId: string | number): BreadcrumbItem[] {
  const metaFolder = db.get('metaFolder', metaFolderId)
  if (!metaFolder) return []
  return [
    {
      type: 'folder',
      id: metaFolder.id,
      name: metaFolder.name,
      href: `metaFolder/${metaFolder.id}`,
    },
  ]
}

export function getMetaDatasetBreadcrumbItems(
  metaFolderId: string | number,
): BreadcrumbItem[] {
  return getMetaFolderItem(metaFolderId)
}

export function getMetaVariableBreadcrumbItems(
  metaVariable: MetaVariable,
): BreadcrumbItem[] {
  const metaDataset = db.get('metaDataset', metaVariable.metaDatasetId)
  if (!metaDataset) return []
  return [
    ...getMetaDatasetBreadcrumbItems(metaDataset.metaFolderId),
    {
      type: 'dataset',
      id: metaDataset.id,
      name: metaDataset.name,
      href: `metaDataset/${metaDataset.id}`,
    },
  ]
}

export function getBreadcrumbItems(
  type: MainEntityName,
  id: string | number | undefined,
): BreadcrumbItem[] {
  if (id === undefined) return []

  if (type === 'organization' || type === 'folder' || type === 'tag') {
    return getRecursiveItems(type, id)
  }

  if (type === 'dataset') {
    const dataset = db.get('dataset', id)
    if (!dataset) return []
    return getFolderItems(dataset.folderId)
  }

  if (type === 'variable') {
    const variable = db.get('variable', id)
    const dataset = variable ? db.get('dataset', variable.datasetId) : undefined
    if (!variable) return []
    return [
      ...getFolderItems(dataset?.folderId),
      ...(dataset
        ? [{ type: 'dataset' as const, id: dataset.id, name: dataset.name }]
        : []),
    ]
  }

  if (type === 'enumeration') {
    const enumeration = db.get('enumeration', id)
    if (!enumeration) return []
    return getFolderItems(enumeration.folderId)
  }

  if (type === 'concept') {
    return getRecursiveItems('concept', id)
  }

  return []
}
