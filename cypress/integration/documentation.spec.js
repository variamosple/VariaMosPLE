describe('User should be able to visit VariaMos Website', ()=>{

    it('User should get to the page by clicking on the home button', () => {
        //Creating a project

        // visit the url
        cy.visit('http://localhost:3000')

        // Verify the different links
        cy.get('a[href="https://variamos.com/home/variamos-web/"]').should('have.attr', 'target', '_blank')
        cy.get('a[href="https://github.com/VariaMosORG/VariaMos/wiki"]').should('have.attr', 'target', '_blank')

    })
})
