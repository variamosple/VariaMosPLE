/* eslint-disable no-use-before-define */
describe('User should be able to visit VariaMos Website', ()=>{
    it('User should get to the page by clicking on the home button', () => {
        // visit the url
        cy.visit('http://localhost:3000')

        // Verify the different links
        cy.get('a[href="https://variamos.com/home/variamos-web/"]').should('have.attr', 'target', '_blank')
        cy.get('a[href="https://github.com/VariaMosORG/VariaMos/wiki"]').should('have.attr', 'target', '_blank')

    })

})
describe('User should be able to manage a project', ()=>{
    it('user should be able to create a project', () => {
        cy.visit('http://localhost:3000')

        //Verify if there is a name for the project
        cy.findByRole('button', {
                    name: /create/i
                }).click();
        cy.findByText('Project name is required').should('be.visible')

        //Verify if there is a name for the product line
        cy.findByPlaceholderText(/variamosproject/i).type('M').clear();
        cy.findByPlaceholderText(/variamosproject/i).type('My New Project');
        cy.findByRole('button', {
            name: /create/i
        }).click();
        cy.findByText('Product line name is required').should('be.visible')

        //Add product line and create the project
        cy.findByPlaceholderText(/variamosproductlinee/i).type('My New Product Line');
        cy.findByRole('button', {
            name: /create/i
        }).click();

        //Verify that the project was created
        cy.findByText('My New Project').should('be.visible')
        cy.findByText('My New Product Line').should('be.visible')

    })
    it('user should be able to change the project name', () => {
        //Dsiplay the menu to change the name
        cy.findByRole('listitem', {
            name: /project management/i
        }).click()

        //Verify that an empty name returns an error
        cy.findByRole('textbox').clear()
        cy.findByRole('button', {
            name: /save/i
        }).click()
        cy.findByText('Project name is required').should('be.visible');

        //Changing the name and saving
        cy.findByRole('textbox').type('My New Project Name', {force: true})
        cy.findByRole('button', {
            name: /save/i
        }).click()

    });
    it('user should be able to download the project', () => {
        cy.findByRole('listitem', {
            name: /download project/i
        }).click();

    });
    it('user should be able to upload a project', () => {
        //Dsiplay the menu to upload
        cy.findByRole('listitem', {
            name: /project management/i
        }).click()

        //Look for the right tab
        cy.findByRole('tab', {
            name: /upload/i
        }).click()

        //Upload
        cy.findByLabelText(/upload a json file/i).click()
        cy.findByRole('button', {
            name: /upload/i
        }).click()

    });
    it('user should be able to create a language', () => {
        //Display the menu to create a language
        cy.findByRole('listitem', {
            name: /project management/i
        }).click()

        //Look for the right tab
        cy.findByRole('tab', {
            name: /upload/i
        }).click()
        cy.findByRole('tab', {
            name: /settings/i
        }).click()

        //Verify an empty language cannot be created.
        cy.findByRole('listitem', {
            name: /new language/i
        }).click()
        cy.findByRole('button', {
            name: /create/i
        }).click()
        cy.findByText('Language name is required').should('be.visible')

        //Add the name of the new language
        cy.get('div[class="form-floating"] > input[id="newLanguageName"]').type('New Language Name Test')
        cy.findByRole('button', {
            name: /create/i
        }).click()

        //Verify an abtract language is given
        cy.findByText('Abstract syntax is required').should('be.visible')
        cy.findByRole('textbox', {
            name: /enter abstract syntax enter abstract syntax/i
        }).type('{}');
        cy.findByRole('button', {
            name: /create/i
        }).click()

        //Verify a concrete language is given
        cy.findByText('Concrete syntax is required').should('be.visible')
        cy.findByRole('textbox', {
            name: /enter concrete syntax enter concrete syntax/i
        }).type('{}');

        //Change the type and save the language
        cy.findByRole('combobox', {
            name: /select type/i
        }).select('Adaptation');
        cy.findByRole('button', {
            name: /create/i
        }).click()
        cy.findByText('Language created successfully').should('be.visible')

    });
    it('user should not be able to create an existing language', () => {
        //Go to the correct tab
        cy.findByRole('listitem', {
            name: /new language/i
        }).click()

        //Enter the correct element for the language
        cy.get('div[class="form-floating"] > input[id="newLanguageName"]').type('New Language Name Test')
        cy.findByRole('textbox', {
            name: /enter abstract syntax enter abstract syntax/i
        }).type('{}');
        cy.findByRole('textbox', {
            name: /enter concrete syntax enter concrete syntax/i
        }).type('{}');
        cy.findByRole('combobox', {
            name: /select type/i
        }).select('Adaptation');

        //Create and verify that if should not be saved
        cy.findByRole('button', {
            name: /create/i
        }).click()
        cy.findByText('Language name already exist').should('be.visible')

    });
    it('user should be able to modify an existing language', () => {
        // Go to the right tab
        cy.findByRole('tab', {
            name: /language list/i
        }).click()

        //Select the language that needs to be modify
        cy.findByRole('combobox', {
            name: /select language/i
        }).select('New Language Name Test');
        cy.findByRole('listitem', {
            name: /update language/i
        }).click();

        //Verify that the name should not be empty
        cy.get('#updateLanguageName').clear()
        cy.findByRole('button', {
            name: /update/i
        }).click();
        cy.findByText('Language name is required').should('be.visible')

        //Enter a new name and choose a new type
        cy.get('#updateLanguageName').type('New Language Name Test Modified')
        cy.get('#updateLanguageType').select('Domain');
        cy.get('#updateLanguageState').select('Active');

        //Verify that the abstract language cannot be remove
        cy.get('#updateLanguageAbSy').clear()
        cy.findByRole('button', {
            name: /update/i
        }).click();
        cy.findByText('Abstract syntax is required').should('be.visible')
        cy.get('#updateLanguageAbSy').type('{}')

        //Verify that the concrete language cannot be remove
        cy.get('#updateLanguageCoSy').clear()
        cy.findByRole('button', {
            name: /update/i
        }).click();
        cy.findByText('Concrete syntax is required').should('be.visible')
        cy.get('#updateLanguageCoSy').type('{}')

        //Save and verify the language was updated
        cy.findByRole('button', {
            name: /update/i
        }).click();
        cy.findByText('Language updated successfully').should('be.visible')

    });
    it('user should be able to delete a language', () => {

        //Verify that you should select a language before deleting a language
        cy.findByRole('listitem', {
            name: /delete language/i
        }).click()
        cy.findByText('Select language is required').should('be.visible');

        //Select a language
        cy.findByRole('combobox', {
            name: /select language/i
        }).select('New Language Name Test Modified');

        //Verify the 'No' button does not delete the language
        cy.findByRole('listitem', {
            name: /delete language/i
        }).click()
        cy.wait(1000)
        cy.findByRole('button', {
            name: /no/i
        }).click()

        //Delete the language and verify it has been done
        cy.findByRole('listitem', {
            name: /delete language/i
        }).click()
        cy.wait(1000)
        cy.findByRole('button', {
            name: /yes/i
        }).click()
        cy.findByText('Language deleted successfully').should('be.visible')

    });
    it('user should be able to visit help tab', () => {
        //Choose the right tab
        cy.findByRole('tab', {
            name: /help/i
        }).click()
        cy.findByText('What is VariaMos?').should('be.visible')

        //Verify the link redirects out of the website
        cy.findByRole('link', {
            name: /what is variamos\?/i
        }).should('have.attr', 'target', '_blank')
        cy.findByRole('link', {
            name: /how can i define a language\?/i
        }).should('have.attr', 'target', '_blank')

    });
    it('user should be able to delete a project', () => {
        //Go to the required tab
        cy.findByRole('tab', {
            name: /current/i
        }).click({ force: true })

        //Delete and verification
        cy.findByRole('button', {  name: /delete/i}).click({ force: true })
        cy.findByText('Project management').should('be.visible')

    });

})

describe('User should be able to create graphs', ()=>{
    it('user can create a project', () => {
        cy.visit('http://localhost:3000')
        cy.findByPlaceholderText(/variamosproject/i).type('M').clear();
        cy.findByPlaceholderText(/variamosproject/i).type('My New Project');
        cy.findByPlaceholderText(/variamosproductlinee/i).type('My New Product Line');
        cy.findByRole('button', {
            name: /create/i
        }).click();

    })
    it('user should be able to close and open the side menu',()=>{
        //Spam click on the menu button
        cy.get('#hiddenProject').trigger('click');
        cy.get('#hiddenProject').trigger('click');

    })
    it('user should be able to create a new model', () => {
        //Right-click on domain engineering (the two following lines do the same thing)
        cy.findByText(/domain engineering/i).rightclick(-10,-10,{ force: true });
        cy.get('#domainEngineering').rightclick('left');
        //List of equivalent command : cy.findByText(/domain engineering/i).rightclick(); cy.findByText(/domain engineering/i).rightclick('left'); cy.findByText(/domain engineering/i).rightclick('topLeft'); cy.findByText(/domain engineering/i).rightclick('bottomLeft'); cy.findByText(/domain engineering/i).rightclick('top'); cy.findByText(/domain engineering/i).rightclick('bottom'); cy.findByText(/domain engineering/i).rightclick('topRight'); cy.findByText(/domain engineering/i).rightclick('right'); cy.findByText(/domain engineering/i).rightclick('bottomRight');

        cy.findByText(/new model/i).trigger('pointermove')

        //Click and drop an element on the display panel
        // cy.get('img[class="mxToolbarModeSelected"]:first').trigger('pointerdown', { which: 1 });
        // cy.get('div[id="vgraph-container"]').find('svg').trigger('pointermove');
        // cy.get('div[id="vgraph-container"]').find('svg').trigger('pointerup', { force: true });

    });

    it('user should be able to create a new product line', () => {
        cy.findByText(/my new product line/i).rightclick();
        cy.findByText(/new product line/i).trigger('pointermove')

    });

    it('user should be able to rename a product line', () => {
        cy.findByText(/my new product line/i).rightclick();
        cy.findByText(/rename/i).trigger('pointermove')

    });

    it('user should be able to delete a product line', () => {
        cy.findByText(/my new product line/i).rightclick();
        cy.findByText(/delete/i).trigger('pointermove')

    });
})
