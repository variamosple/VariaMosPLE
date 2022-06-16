describe('User should be able to visit VariaMos Website', ()=>{

    it('User should get to the page by clicking on the home button', () => {
        //Creating a project

        // visit the url
        cy.visit('http://localhost:3000')
        // add Project name
        cy.findByPlaceholderText(/variamosproject/i).type('My New Project');
        // add Product line
        cy.findByPlaceholderText(/variamosproductlinee/i).type('My New Product Line');
        // Click on create
        cy.findByRole('button', {  name: /create/i}).click();

        // click on the home button
        cy.findByRole('listitem', {name: /home/i}).invoke('removeAttr','target').click();
        // cy.get('.list-group-item nav-bar-variamos > a').invoke('removeAttr','target').click();
        cy.wait(5000);

        //Verify if the url and if the h1 title are correct
        cy.url().should('include', 'https://variamos.com/home/variamos-web/');
        cy.get('h1').should('have.text', /variamos/i)

        // cy.window().then((win) => {
        //     cy.stub(win, 'open', url => {
        //         win.location.href = 'https://variamos.com/home/variamos-web/';
        //     }).as("popup")
        // })
        // cy.findByRole('listitem', {name: /home/i}).click();
        // cy.wait(7000);
        // cy.get('@popup')
        //     .should("be.called")
        // cy.get('h1')
        //     .should('have.text', 'VariaMos')

    })
})
