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
    it('user can create the model', () => {

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
})
