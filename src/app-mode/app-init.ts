import db from '@db'
import Options from '@lib/options'
import MainFilter from '@lib/main-filter'
import { loadUserData } from '@lib/user-data'
import { dbAddProcessedData } from '@lib/db'
import { initI18n } from '@i18n/i18n'
import search from '@search/search'
import Logs from '@lib/logs'
import Favorites from '@favorite/favorites'
import SearchHistory from '@search/search-history'
import dbSchema from '@src/assets/db-schema.json'
import { checkLocalEditStatus } from '@src/local-edit/local-edit-config'
import { localEditStatus } from '@lib/store'
import { isSsgRendering } from '@lib/url'
import type { SearchHistoryEntry } from '@search/search-history'
import type { Favorite } from '@favorite/favorites'
import type { ConfigFilter, Log } from '@src/type'

let initPromise: Promise<void> | null = null

export function initApp(): Promise<void> {
  if (initPromise) {
    return initPromise
  }

  const timer = performance.now()

  initPromise = (async () => {
    try {
      const optionsTimer = performance.now()
      const optionsReady = Options.init().then(
        () => performance.now() - optionsTimer,
      )
      await initI18n()

      const filterTimer = performance.now()
      const filterReady = MainFilter.init().then(
        () => performance.now() - filterTimer,
      )

      const filterMs = await filterReady

      let stepTimer = performance.now()
      await db.init({
        filterBuilder: tables => {
          const configFilters =
            (tables.configFilter as readonly ConfigFilter[] | undefined) ?? []
          return MainFilter.buildDbFilters(
            MainFilter.getInactiveFilters(configFilters),
          )
        },
      })
      const loadDbMs = performance.now() - stepTimer

      stepTimer = performance.now()
      const userData = await loadUserData()
      db.addMeta(userData, dbSchema as Record<string, unknown>[])
      dbAddProcessedData()
      const processDbMs = performance.now() - stepTimer

      const scheduleSearchInit = () => {
        const searchTimer = performance.now()
        search.init().then(() => {
          console.log(
            'search init time',
            Math.round(performance.now() - searchTimer),
          )
        })
      }
      if (!isSsgRendering) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(scheduleSearchInit)
        } else {
          setTimeout(scheduleSearchInit, 0)
        }
      }

      stepTimer = performance.now()
      Logs.init(userData.log as Log[] | null)
      Favorites.init(userData.favorite as Favorite[])
      SearchHistory.init(userData.searchHistory as SearchHistoryEntry[], {
        limit: 100,
      })
      const stateMs = performance.now() - stepTimer

      const optionsMs = await optionsReady

      checkLocalEditStatus()
        .then(status => {
          localEditStatus.set(status)
          console.log('local edit status:', status)
        })
        .catch(error => {
          const status = {
            available: false,
            error: `Cannot check local edit server status: ${error}`,
          } as const
          localEditStatus.set(status)
          console.log('local edit status:', status)
        })

      const totalMs = performance.now() - timer
      const otherMs = totalMs - filterMs - loadDbMs - processDbMs - stateMs
      console.log('init', {
        optionsMs: Math.round(optionsMs),
        filterMs: Math.round(filterMs),
        loadDbMs: Math.round(loadDbMs),
        processDbMs: Math.round(processDbMs),
        stateMs: Math.round(stateMs),
        totalMs: Math.round(totalMs),
        otherMs: Math.round(otherMs),
      })
    } catch (error) {
      console.error('App initialization failed:', error)
      throw error
    }
  })()

  return initPromise
}
