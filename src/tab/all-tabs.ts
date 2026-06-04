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
import type { TranslationKey } from '@i18n/types'

type StaticTabConfig = TabConfig & { nameKey: TranslationKey }

export const allTabs: Record<string, StaticTabConfig> = {
  organizations: {
    nameKey: 'entity.organization',
    icon: 'organization',
    component: Organizations,
  },
  folders: {
    nameKey: 'entity.folder',
    icon: 'folder',
    component: Folders,
  },
  tags: {
    nameKey: 'entity.tag',
    icon: 'tag',
    component: Tags,
  },
  concepts: {
    nameKey: 'entity.concept',
    icon: 'concept',
    component: Concepts,
  },
  datasets: {
    nameKey: 'entity.dataset',
    icon: 'dataset',
    component: Datasets,
  },
  variables: {
    nameKey: 'entity.variable',
    icon: 'variable',
    component: Variables,
  },
  enumerations: {
    nameKey: 'entity.enumeration',
    icon: 'enumeration',
    component: Enumerations,
  },
  enumerationsCompare: {
    nameKey: 'tab.similarity',
    icon: 'compare',
    component: EnumerationsCompare,
    loadAsync: true,
  },
  values: {
    nameKey: 'tab.value',
    icon: 'value',
    component: Values,
  },
  variableValues: {
    nameKey: 'tab.value',
    icon: 'value',
    component: VariableValues,
  },
  frequency: {
    nameKey: 'tab.frequency',
    icon: 'frequency',
    component: Frequency,
  },
  allFav: {
    nameKey: 'tab.favorite',
    icon: 'favorite',
    component: AllFav,
  },
  logs: {
    nameKey: 'tab.log',
    icon: 'log',
    component: Logs,
  },
  evolutions: {
    nameKey: 'tab.evolution',
    icon: 'evolution',
    component: Evolution,
  },
  metaFolders: {
    nameKey: 'entity.folder',
    icon: 'folder',
    component: Folders,
    isMeta: true,
    metaKey: 'folders',
  },
  metaDatasets: {
    nameKey: 'entity.dataset',
    icon: 'dataset',
    component: Datasets,
    isMeta: true,
    metaKey: 'datasets',
  },
  metaVariables: {
    nameKey: 'entity.variable',
    icon: 'variable',
    component: Variables,
    isMeta: true,
    metaKey: 'variables',
  },
  variableMetaValues: {
    nameKey: 'tab.value',
    icon: 'value',
    component: VariableValues,
    isMeta: true,
    metaKey: 'variableValues',
  },
  metaDiagramm: {
    nameKey: 'tab.diagram',
    icon: 'diagram',
    component: MetaDiagramm,
    withoutNum: true,
    withoutProp: true,
    footerVisible: true,
  },
  checkDb: {
    nameKey: 'tab.integrity',
    icon: 'integrity',
    component: CheckDbFrame,
    withoutNum: true,
    withoutProp: true,
    footerVisible: true,
  },
  docs: {
    nameKey: 'entity.doc',
    icon: 'doc',
    component: Docs,
  },
  options: {
    nameKey: 'tab.option',
    icon: 'option',
    component: Options,
    withoutNum: true,
    withoutProp: true,
    footerVisible: true,
  },
  api: {
    nameKey: 'tab.api',
    icon: 'database',
    component: Api,
    withoutNum: true,
    footerVisible: true,
  },
  datasetPreview: {
    nameKey: 'tab.preview',
    icon: 'preview',
    component: DatasetPreview,
  },
  variablePreview: {
    nameKey: 'tab.preview',
    icon: 'preview',
    component: VariablePreview,
  },
  stat: {
    nameKey: 'tab.stat',
    icon: 'stat',
    component: Stat,
    withoutProp: true,
  },
  dashboard: {
    nameKey: 'tab.dashboard',
    icon: 'dashboard',
    component: Dashboard,
    footerVisible: true,
  },
  aboutStructure: {
    nameKey: 'tab.structure',
    icon: 'diagram',
    component: AboutFile,
    footerVisible: true,
    useAboutFile: true,
  },
  aboutFeatures: {
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
