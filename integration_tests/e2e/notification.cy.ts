context('Notification page', () => {
  it('displays message', () => {
    cy.visit('/notification/00000000-0000-0000-0000-000000000001')
    cy.get('body').should('contain.text', "'Unpaid Work Appointment Reminder' was sent to 07700900000.")
  })

  it('can navigate back to list screen', () => {
    cy.visit('/notification/00000000-0000-0000-0000-000000000001')
    cy.get('a.govuk-back-link').click()
    cy.get('h1').should('have.text', 'Text messages')
  })
})
