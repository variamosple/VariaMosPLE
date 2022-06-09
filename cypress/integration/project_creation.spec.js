describe('Create a project', () => {
    it('user can create a project', () => {
        cy.visit('http://localhost:3000')
        // add Project name
        cy.findByPlaceholderText(/variamosproject/i).type('My New Project');
        // add Product line
        cy.findByPlaceholderText(/variamosproductlinee/i).type('My New Product Line');
        // Click on create
        cy.findByRole('button', {  name: /create/i}).click();

    })
})

describe('Create a (istar) Model', () =>{
    it('user can create the model', () => {

        cy.findByText(/domain engineering/i).rightclick();

        cy.findByText(/application engineering/i).trigger('pointermove').rightclick();


        //
        //
        //
        // cy.wait(500);
        // cy.get('button[class="close"]').should('be.visible').click();
        //
        // // go to the project feature model section
        // cy.get('a').contains("FeatureModel").click();
        //
        // // create root element
        // cy.get('img[class="mxToolbarModeSelected"]:first').trigger('pointerdown', { which: 1 });
        // cy.get('div[id="vgraph-container"]').find('svg').trigger('pointermove');
        // cy.get('div[id="vgraph-container"]').find('svg').trigger('pointerup', { force: true });
        //
        // //should contain root text inside svg
        // cy.get('div[id="vgraph-container"]').find('svg').should('contain', 'root');

    });
})
