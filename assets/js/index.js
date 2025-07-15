import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import ServerSideSortableTable from './serverSideSortableTable'

govukFrontend.initAll()
mojFrontend.initAll()

window.addEventListener('load', () => {
  document
    .querySelectorAll('table[data-module="moj-server-side-sortable-table"]')
    .forEach(table => new ServerSideSortableTable(table))
})
