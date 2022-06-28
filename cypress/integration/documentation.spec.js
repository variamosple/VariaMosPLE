describe('User should be able to visit VariaMos Website', ()=>{

    it('User should get to the page by clicking on the home button', () => {
        //Creating a project

        // visit the url
        cy.visit('http://localhost:3000')

        // Verify the different links
        cy.get('a[href="https://variamos.com/home/variamos-web/"]').should('have.attr', 'target', '_blank')
        cy.get('a[href="https://github.com/VariaMosORG/VariaMos/wiki"]').should('have.attr', 'target', '_blank')

        cy.findByRole('tab', { name: /upload/i }).click();
    })
})
describe('User should be able to create a simple project', ()=>{

    it('user can create a project', () => {
        cy.visit('http://localhost:3000')
        // add Project name
        cy.findByPlaceholderText(/variamosproject/i).type('My New Project');
        // add Product line
        cy.findByPlaceholderText(/variamosproductlinee/i).type('My New Product Line');
        // Click on create
        cy.findByRole('button', {  name: /create/i}).click();

    })
    it('user should be able to close and open the side menu',()=>{
        cy.get('#hiddenProject').trigger('click');
        cy.get('#hiddenProject').trigger('click');
        cy.get('#hiddenProject').trigger('click');
        cy.get('#hiddenProject').trigger('click');
    })
    it('user should be able to create the model', () => {

        cy.findByText(/domain engineering/i).rightclick();

        cy.findByText(/application engineering/i).rightclick();

        cy.findByText(/new model/i).trigger('pointermove')

        // // create root element
        // cy.get('img[class="mxToolbarModeSelected"]:first').trigger('pointerdown', { which: 1 });
        // cy.get('div[id="vgraph-container"]').find('svg').trigger('pointermove');
        // cy.get('div[id="vgraph-container"]').find('svg').trigger('pointerup', { force: true });
        //
        // //should contain root text inside svg
        // cy.get('div[id="vgraph-container"]').find('svg').should('contain', 'root');

        // User should be able to drag elements from the element panel
        //
    });

    it('user should be able to change the project name', () => {

        cy.findByRole('listitem', {name: /project management/i}).click() //False positive
        cy.findByRole('textbox').type('{ctrl}a').type('Brand New Name');
        cy.findByRole('button', {name: /save/i}).click()

    });

})
