import { SortableTable } from '@ministryofjustice/frontend'

export default class ServerSideSortableTable extends SortableTable {
  onSortButtonClick(event) {
    const $target = /** @type {HTMLElement} */ (event.target)
    const $button = $target.closest('button')

    if (!$button || !($button instanceof HTMLButtonElement) || !$button.parentElement) {
      return
    }

    const $heading = $button.parentElement
    const sortDirection = $heading.getAttribute('aria-sort')
    const columnName = $heading.innerText
    const newSortDirection = sortDirection === 'none' || sortDirection === 'descending' ? 'ascending' : 'descending'

    const url = new URL(window.location.href)
    const currentSort = url.searchParams.get('sort')
    const newSort = `${columnName}.${newSortDirection}`
    if (currentSort !== newSort) {
      url.searchParams.set('sort', `${columnName}.${newSortDirection}`)
      window.location.href = url.toString()
      this.removeButtonStates()
      this.updateButtonState($button, newSortDirection)
      this.updateDirectionIndicators()
    }
  }

  setAriaSortValuesFromUrl() {
    const sort = new URLSearchParams(window.location.search).get('sort')
    if (sort) {
      const sortOptions = sort.split('.')
      const columnName = sortOptions[0]
      const newSortDirection = sortOptions.length > 1 ? sortOptions[1] : 'ascending'
      const $heading = this.$headings.find(h => h.innerText === columnName)
      if ($heading) {
        const $button = $heading.querySelector('button')
        this.removeButtonStates()
        this.updateButtonState($button, newSortDirection)
        this.updateDirectionIndicators()
      }
    }
  }

  initialiseSortedColumn() {
    this.setAriaSortValuesFromUrl()
    super.initialiseSortedColumn()
  }

  // eslint-disable-next-line
  sort($rows, columnNumber, sortDirection) {
    return $rows // no-op - sorting is performed server-side
  }
}

ServerSideSortableTable.moduleName = 'moj-server-side-sortable-table'
