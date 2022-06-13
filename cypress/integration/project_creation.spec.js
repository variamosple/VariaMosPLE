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


        // User should be able to drag elements from the element panel
        //
    });
})
