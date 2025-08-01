import Page from '../pages/page'
import IndexPage from '../pages'

context('Data quality page', () => {
  it('can click alert header link', () => {
    cy.visit('/')
    Page.verifyOnPage(IndexPage)

    cy.get('#notifications').should('contain.text', '99+')
    cy.get('#notifications').click()
    cy.url().should('contain', '/data-quality/invalid?provider=N56')
    cy.get('.moj-sub-navigation__link').eq(0).should('contain.text', 'Invalid mobile numbers (34)')
    cy.get('.moj-sub-navigation__link').eq(1).should('contain.text', 'Missing mobile numbers')
    cy.get('.moj-sub-navigation__link').eq(2).should('contain.text', 'Duplicate mobile numbers')
  })

  it('can sort table', () => {
    cy.visit('/data-quality/invalid?provider=N56')
    cy.get('table tbody tr.govuk-table__row').should('have.length', 10)
    cy.get('table thead th:nth-child(1)').should('have.attr', 'aria-sort').should('equal', 'ascending')

    cy.get('table thead th:nth-child(2) button').click()
    cy.url().should('contain', '/data-quality/invalid?provider=N56&sort=CRN.ascending')
    cy.get('table thead th:nth-child(1)').should('have.attr', 'aria-sort').should('equal', 'none')
    cy.get('table thead th:nth-child(2)').should('have.attr', 'aria-sort').should('equal', 'ascending')

    cy.get('table thead th:nth-child(2) button').click()
    cy.url().should('contain', '/data-quality/invalid?provider=N56&sort=CRN.descending')
    cy.get('table thead th:nth-child(2)').should('have.attr', 'aria-sort').should('equal', 'descending')
  })

  it('cannot access other providers', () => {
    cy.visit('/data-quality/invalid?provider=N99', { failOnStatusCode: false })
    cy.url().should('contain', '/autherror')
  })
})
