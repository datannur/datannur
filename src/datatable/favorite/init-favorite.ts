import jQuery from 'jquery'
import {
  animateFavoriteRemoval,
  animateFavoriteToHeader,
} from '@favorite/favorite-transition'
import Favorites from '@favorite/favorites'
import type { Api } from 'datatables.net'
import type { FavoritableEntityName } from '@type'

export default function initFavorite(tableId: string, datatable: Api) {
  const jqueryFavorite = jQuery('table#' + tableId + '._datatables')
  jqueryFavorite.on('click', '.icon.favorite', function (this: HTMLElement) {
    const elem = jQuery(this)
    const isFavorite = Boolean(elem.data('is-favorite'))
    const column = Number(elem.data('col'))
    const row = Number(elem.data('row'))
    const favId = elem.data('id') as string | number
    const entity = elem.data('entity') as FavoritableEntityName
    const cell = datatable.cell({ row, column })
    if (isFavorite) {
      animateFavoriteRemoval()
      Favorites.remove(entity, favId)
      cell.data(false)
    } else {
      animateFavoriteToHeader(this)
      Favorites.add(entity, favId)
      cell.data(true)
      jQuery(cell.node()).find('.favorite').addClass('clicked')
    }
  })
}
