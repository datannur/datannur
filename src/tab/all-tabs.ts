import Organizations from '@component/organization/Organizations.svelte'
import Folders from '@component/folder/Folders.svelte'
import Tags from '@component/tag/Tags.svelte'
import Concepts from '@component/concept/Concepts.svelte'
import Docs from '@component/doc/Docs.svelte'
import Datasets from '@component/dataset/Datasets.svelte'
import Variables from '@component/variable/Variables.svelte'
import Enumerations from '@component/enumeration/Enumerations.svelte'
import EnumerationsCompare from '@component/enumeration/EnumerationsCompare.svelte'
import Values from '@component/enumeration/Values.svelte'
import VariableValues from '@component/variable/VariableValues.svelte'
import Frequency from '@component/variable/Frequency.svelte'
import OrganizationInfo from '@component/organization/OrganizationInfo.svelte'
import FolderInfo from '@component/folder/FolderInfo.svelte'
import TagInfo from '@component/tag/TagInfo.svelte'
import ConceptInfo from '@component/concept/ConceptInfo.svelte'
import DocInfo from '@component/doc/DocInfo.svelte'
import DatasetInfo from '@component/dataset/DatasetInfo.svelte'
import VariableInfo from '@component/variable/VariableInfo.svelte'
import EnumerationInfo from '@component/enumeration/EnumerationInfo.svelte'
import MetaFolderInfo from '@component/folder/MetaFolderInfo.svelte'
import MetaDatasetInfo from '@component/dataset/MetaDatasetInfo.svelte'
import MetaVariableInfo from '@component/variable/MetaVariableInfo.svelte'
import MetaDiagramm from '@component/MetaDiagramm.svelte'
import CheckDbFrame from '@component/CheckDbFrame.svelte'
import DatasetPreview from '@component/preview/DatasetPreview.svelte'
import VariablePreview from '@component/preview/VariablePreview.svelte'
import AboutFile from '@layout/AboutFile.svelte'
import Stat from '@stat/Stat.svelte'
import Dashboard from '@src/dashboard/Dashboard.svelte'
import AllFav from '@favorite/AllFav.svelte'
import Options from '@component/options/Options.svelte'
import Api from '@component/options/Api.svelte'
import Logs from '@component/options/Logs.svelte'
import Evolution from '@component/Evolution.svelte'
import { allTabsIcon } from '@lib/store'
import type { TabConfig } from './tabs-helper'

export const allTabs: Record<string, TabConfig> = {
  organizations: {
    name: 'Organisation',
    nameKey: 'entity.organization',
    icon: 'organization',
    component: Organizations,
  },
  folders: {
    name: 'Dossier',
    nameKey: 'entity.folder',
    icon: 'folder',
    component: Folders,
  },
  tags: {
    name: 'Mot clé',
    nameKey: 'entity.tag',
    icon: 'tag',
    component: Tags,
  },
  concepts: {
    name: 'Concept',
    nameKey: 'entity.concept',
    icon: 'concept',
    component: Concepts,
  },
  datasets: {
    name: 'Dataset',
    nameKey: 'entity.dataset',
    icon: 'dataset',
    component: Datasets,
  },
  variables: {
    name: 'Variable',
    nameKey: 'entity.variable',
    icon: 'variable',
    component: Variables,
  },
  enumerations: {
    name: 'Énumération',
    nameKey: 'entity.enumeration',
    icon: 'enumeration',
    component: Enumerations,
  },
  enumerationsCompare: {
    name: 'Similitude',
    nameKey: 'tab.similarity',
    icon: 'compare',
    component: EnumerationsCompare,
    loadAsync: true,
  },
  values: {
    name: 'Valeur',
    nameKey: 'tab.value',
    icon: 'value',
    component: Values,
  },
  variableValues: {
    name: 'Valeur',
    nameKey: 'tab.value',
    icon: 'value',
    component: VariableValues,
  },
  frequency: {
    name: 'Fréquence',
    nameKey: 'tab.frequency',
    icon: 'frequency',
    component: Frequency,
  },
  allFav: {
    name: 'Favori',
    nameKey: 'tab.favorite',
    icon: 'favorite',
    component: AllFav,
  },
  logs: {
    name: 'Log',
    nameKey: 'tab.log',
    icon: 'log',
    component: Logs,
  },
  evolutions: {
    name: 'Evolution',
    nameKey: 'tab.evolution',
    icon: 'evolution',
    component: Evolution,
  },
  metaFolders: {
    name: 'Dossier',
    nameKey: 'entity.folder',
    icon: 'folder',
    component: Folders,
    isMeta: true,
    metaKey: 'folders',
  },
  metaDatasets: {
    name: 'Dataset',
    nameKey: 'entity.dataset',
    icon: 'dataset',
    component: Datasets,
    isMeta: true,
    metaKey: 'datasets',
  },
  metaVariables: {
    name: 'Variable',
    nameKey: 'entity.variable',
    icon: 'variable',
    component: Variables,
    isMeta: true,
    metaKey: 'variables',
  },
  variableMetaValues: {
    name: 'Valeur',
    nameKey: 'tab.value',
    icon: 'value',
    component: VariableValues,
    isMeta: true,
    metaKey: 'variableValues',
  },
  metaDiagramm: {
    name: 'Diagramme',
    nameKey: 'tab.diagram',
    icon: 'diagram',
    component: MetaDiagramm,
    withoutNum: true,
    withoutProp: true,
    footerVisible: true,
  },
  checkDb: {
    name: 'Intégrité',
    nameKey: 'tab.integrity',
    icon: 'integrity',
    component: CheckDbFrame,
    withoutNum: true,
    withoutProp: true,
    footerVisible: true,
  },
  docs: {
    name: 'Doc',
    nameKey: 'entity.doc',
    icon: 'doc',
    component: Docs,
  },
  options: {
    name: 'Option',
    nameKey: 'tab.option',
    icon: 'option',
    component: Options,
    withoutNum: true,
    withoutProp: true,
    footerVisible: true,
  },
  api: {
    name: 'API',
    nameKey: 'tab.api',
    icon: 'database',
    component: Api,
    withoutNum: true,
    footerVisible: true,
  },
  datasetPreview: {
    name: 'Aperçu',
    nameKey: 'tab.preview',
    icon: 'preview',
    component: DatasetPreview,
  },
  variablePreview: {
    name: 'Aperçu',
    nameKey: 'tab.preview',
    icon: 'preview',
    component: VariablePreview,
  },
  stat: {
    name: 'Stat',
    nameKey: 'tab.stat',
    icon: 'stat',
    component: Stat,
    withoutProp: true,
  },
  dashboard: {
    name: 'Bilan',
    nameKey: 'tab.dashboard',
    icon: 'dashboard',
    component: Dashboard,
    footerVisible: true,
  },
  aboutStructure: {
    name: 'Structure',
    nameKey: 'tab.structure',
    icon: 'diagram',
    component: AboutFile,
    footerVisible: true,
    useAboutFile: true,
  },
  aboutFeatures: {
    name: 'Fonctionnalités',
    nameKey: 'tab.features',
    icon: 'features',
    component: AboutFile,
    footerVisible: true,
    useAboutFile: true,
  },
}

const infoItems = {
  aboutFile: AboutFile,
  organization: OrganizationInfo,
  folder: FolderInfo,
  tag: TagInfo,
  concept: ConceptInfo,
  doc: DocInfo,
  dataset: DatasetInfo,
  variable: VariableInfo,
  enumeration: EnumerationInfo,
  metaFolder: MetaFolderInfo,
  metaDataset: MetaDatasetInfo,
  metaVariable: MetaVariableInfo,
}
for (const [key, value] of Object.entries(infoItems)) {
  allTabs[key] = {
    name: 'A propos',
    nameKey: 'tab.about',
    icon: 'about',
    component: value,
    footerVisible: true,
  }
}

const allTabsIconValue: Record<string, { icon: string }> = {}
for (const key in allTabs) {
  const tab = allTabs[key] as { icon: string }
  allTabsIconValue[key] = { icon: tab.icon }
}
allTabsIcon.set(allTabsIconValue)
