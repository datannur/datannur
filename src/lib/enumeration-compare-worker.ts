import type { Enumeration, EnumerationSimilitute } from '@type'

type EnumerationToCompare = {
  enumerationId: string | number
  valuesClean: unknown[]
  name: string
  type: string
  nbVariable: number
  folderId: string | number
  folderName: string
}

export function enumerationCompareWorker(param: {
  enumerationsCompare: Enumeration[]
  limit: number | null
}) {
  function getSimilitudes(
    enumerationsToCompare: EnumerationToCompare[],
    limit: number | null = null,
  ) {
    const similitutes: EnumerationSimilitute[] = []
    for (const enumeration1 of enumerationsToCompare) {
      const nbValue = enumeration1.valuesClean.length
      for (const enumeration2 of enumerationsToCompare) {
        if (enumeration1.enumerationId === enumeration2.enumerationId) continue
        let nbSimilitude = 0
        for (const value1 of enumeration1.valuesClean) {
          if (enumeration2.valuesClean.includes(value1)) nbSimilitude += 1
        }
        const ratio = nbSimilitude / nbValue
        if (ratio > 0.5) {
          similitutes.push({
            enumeration1Id: enumeration1.enumerationId,
            enumeration2Id: enumeration2.enumerationId,
            enumeration1FolderId: enumeration1.folderId,
            enumeration2FolderId: enumeration2.folderId,
            enumeration1Name: enumeration1.name,
            enumeration2Name: enumeration2.name,
            enumeration1FolderName: enumeration1.folderName,
            enumeration2FolderName: enumeration2.folderName,
            enumeration1Type: enumeration1.type,
            enumeration2Type: enumeration2.type,
            enumeration1NbValue: enumeration1.valuesClean.length,
            enumeration2NbValue: enumeration2.valuesClean.length,
            enumeration1NbVariable: enumeration1.nbVariable,
            enumeration2NbVariable: enumeration2.nbVariable,
            ratio: Math.round(ratio * 100),
          })
          if (limit && similitutes.length >= limit) return similitutes
        }
      }
    }
    return similitutes
  }

  const limit = param.limit
  const enumerationsToCompare: EnumerationToCompare[] = []
  for (const enumeration of param.enumerationsCompare) {
    if (!enumeration.values) continue
    const valuesClean: unknown[] = []
    for (let i = 0; i < enumeration.values.length; i++) {
      const value = enumeration.values[i]
      if (value.value === null || value.value === undefined) continue
      let valueClean = value.value.toString().toLowerCase()
      if (value.description !== null && value.description !== undefined) {
        valueClean += '___' + value.description.toString().toLowerCase()
      }
      valuesClean.push(valueClean)
    }
    enumerationsToCompare.push({
      enumerationId: enumeration.id,
      valuesClean,
      name: enumeration.name,
      type: enumeration.typeClean ?? '',
      nbVariable: enumeration.variables?.length ?? 0,
      folderId: enumeration.folderId ?? '',
      folderName: enumeration.folderName ?? '',
    })
  }
  const similitutes = getSimilitudes(enumerationsToCompare, limit)
  similitutes.sort((a, b) => b.ratio - a.ratio)
  return similitutes
}
