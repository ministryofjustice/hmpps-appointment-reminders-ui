import IndexPage from '../pages/index'
import Page from '../pages/page'

context('Sign In', () => {
  it('User name visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerUserName().should('contain.text', 'T. Test')
  })

  it('Phase banner visible in header', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.headerPhaseBanner().should('contain.text', 'dev')
  })

  it('User can sign out', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.signOut().click()
    cy.url().should('include', 'http://localhost:9090/auth/sign-out')
  })

  it('User can manage their details', () => {
    cy.visit('/')
    const indexPage = Page.verifyOnPage(IndexPage)

    indexPage.manageDetails().get('a').invoke('removeAttr', 'target')
    indexPage.manageDetails().click()
    cy.url().should('include', 'http://localhost:9090/auth/account-details')
  })
})
