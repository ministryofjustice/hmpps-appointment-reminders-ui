import Page from '../pages/page'
import IndexPage from '../pages'

context('List page', () => {
  it('can filter results', () => {
    cy.visit('/')
    Page.verifyOnPage(IndexPage)

    // Starts with 2 results
    cy.get('#result-count').should('contain.text', 'Showing 2 results.')
    cy.get('table tbody tr.govuk-table__row').should('have.length', 2)

    // Filter on template + status
    cy.get('#template').click()
    cy.get('#status').click()
    cy.get('#apply-filters-button').click()

    // Now has 1 result, and 2 filters applied
    cy.get('#result-count').should('contain.text', 'Showing 1 result.')
    cy.get('table tbody tr.govuk-table__row').should('have.length', 1)
    cy.get('.moj-filter__selected').should('exist').should('contain.text', 'Selected filters')
    cy.get('.moj-filter__tag').should('have.length', 2)

    // Remove first filter
    cy.get('.moj-filter__tag').first().click()
    cy.get('#result-count').should('contain.text', 'Showing 2 results.')
    cy.get('table tbody tr.govuk-table__row').should('have.length', 2)
    cy.get('.moj-filter__selected').should('exist').should('contain.text', 'Selected filters')
    cy.get('.moj-filter__tag').should('have.length', 1)

    // Clear all filters
    cy.get('.moj-filter__heading-action a').click()
    cy.get('.moj-filter__selected').should('not.exist')
    cy.get('.moj-filter__tag').should('not.exist')
  })

  it('can search for keywords from message body', () => {
    cy.visit('/')

    cy.get('#keywords').type('test2')
    cy.get('#apply-filters-button').click()

    cy.get('#keywords').should('have.value', 'test2')
    cy.get('#result-count').should('contain.text', 'Showing 1 result.')
    cy.get('table tbody tr.govuk-table__row').should('have.length', 1).should('contain.text', 'Dear Test2')
  })

  it('can search for CRN', () => {
    cy.visit('/')

    cy.get('#keywords').type('A000001')
    cy.get('#apply-filters-button').click()

    cy.get('#keywords').should('have.value', 'A000001')
    cy.get('#result-count').should('contain.text', 'Showing 1 result.')
    cy.get('table tbody tr.govuk-table__row').should('have.length', 1).should('contain.text', 'A000001')
  })

  it('can search for phone number', () => {
    cy.visit('/')

    cy.get('#keywords').type('07700900000')
    cy.get('#apply-filters-button').click()

    cy.get('#keywords').should('have.value', '07700900000')
    cy.get('#result-count').should('contain.text', 'Showing 1 result.')
    cy.get('table tbody tr.govuk-table__row').should('have.length', 1).should('contain.text', '07700900000')
  })

  it('can navigate to notification screen', () => {
    cy.visit('/')
    cy.get('table tbody tr.govuk-table__row a').first().click()
    cy.get('h1').should('have.text', 'Text message')
  })
})
