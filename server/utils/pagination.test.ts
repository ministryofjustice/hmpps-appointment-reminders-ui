import getPaginationLinks from './pagination'

describe('pagination', () => {
  it.each([
    { currentPage: 1, totalPages: 1, maxPagesToShow: 7, expected: [1] },
    { currentPage: 2, totalPages: 3, maxPagesToShow: 7, expected: [1, 2, 3] },
    { currentPage: 3, totalPages: 10, maxPagesToShow: 7, expected: [1, 2, 3, 4, 5, 6, '...'] },
    { currentPage: 4, totalPages: 10, maxPagesToShow: 5, expected: ['...', 2, 3, 4, 5, 6, '...'] },
    { currentPage: 5, totalPages: 5, maxPagesToShow: 2, expected: ['...', 4, 5] },
    { currentPage: 1, totalPages: 5, maxPagesToShow: 2, expected: [1, 2, '...'] },
  ])('should return page numbers for page %s', ({ currentPage, totalPages, maxPagesToShow, expected }) => {
    const paginationItems = getPaginationLinks(currentPage, totalPages, 100, () => '', 10, maxPagesToShow).items
    const pageNumbers = paginationItems.map(item => ('ellipsis' in item ? '...' : item.number))
    expect(pageNumbers).toEqual(expected)
  })
})

describe('pagination from/to', () => {
  it.each([
    { currentPage: 1, totalResults: 1, pageSize: 10, expected: { from: '1', to: '1' } },
    { currentPage: 3, totalResults: 100, pageSize: 6, expected: { from: '13', to: '18' } },
    { currentPage: 10, totalResults: 95, pageSize: 10, expected: { from: '91', to: '95' } },
    { currentPage: 10, totalResults: 10000, pageSize: 1000, expected: { from: '9,001', to: '10,000' } },
  ])('should return correct from and to for page %s', ({ currentPage, totalResults, pageSize, expected }) => {
    const pagination = getPaginationLinks(currentPage, 100, totalResults, () => '', pageSize, 10)
    expect(pagination.from).toEqual(expected.from)
    expect(pagination.to).toEqual(expected.to)
  })
})
