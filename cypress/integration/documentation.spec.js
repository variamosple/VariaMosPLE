describe('User should be able to visit VariaMos Website', ()=>{
    it('User should get to the page by clicking on the home button', () => {
        // visit the url
        cy.visit('http://localhost:3000')

        // Verify the different links
        cy.get('a[href="https://variamos.com/home/variamos-web/"]').should('have.attr', 'target', '_blank')
        cy.get('a[href="https://github.com/VariaMosORG/VariaMos/wiki"]').should('have.attr', 'target', '_blank')

        cy.findByRole('tab', {
            name: /upload/i
        }).click();
    })
})
describe('User should be able to manage a project', ()=>{
    it('user should be able to create a project', () => {
        cy.visit('http://localhost:3000')
        // add Project name
        cy.findByRole('button', {
                    name: /create/i
                }).click();

        cy.findByText('Project name is required').should('be.visible')

        cy.findByPlaceholderText(/variamosproject/i).type('M').clear();
        cy.findByPlaceholderText(/variamosproject/i).type('My New Project');

        cy.findByRole('button', {
            name: /create/i
        }).click();

        cy.findByText('Product line name is required').should('be.visible')

        // add Product line
        cy.findByPlaceholderText(/variamosproductlinee/i).type('My New Product Line');
        // Click on create
        cy.findByRole('button', {
            name: /create/i
        }).click();

        cy.findByText('My New Project').should('be.visible')
        cy.findByText('My New Product Line').should('be.visible')
    })
    it('user should be able to close and open the side menu',()=>{
        cy.get('#hiddenProject').trigger('click');
        cy.get('#hiddenProject').trigger('click');
        cy.get('#hiddenProject').trigger('click');
        cy.get('#hiddenProject').trigger('click');
    })
    it('user should be able to change the project name', () => {

        cy.findByRole('listitem', {
            name: /project management/i
        }).click() //False positive
        cy.findByRole('textbox').type('N')
        cy.wait(200)
        cy.findByRole('textbox').clear()//.type('Brand New Name');
        cy.findByRole('button', {
            name: /save/i
        }).click()

        cy.findByText('Project name is required').should('be.visible');

        cy.findByRole('textbox').type('My New Project Name')//.type('Brand New Name');
        // cy.findByRole('textbox').clear().type('My New Project Name')//.type('Brand New Name');
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
        cy.findByRole('listitem', {
            name: /project management/i
        }).click() //False positive
        cy.findByRole('tab', {
            name: /upload/i
        }).click()
        cy.findByLabelText(/upload a json file/i).click()
        cy.findByRole('button', {
            name: /upload/i
        }).click()

    });
    it('user should be able to create a language', () => {
        cy.findByRole('listitem', {
            name: /project management/i
        }).click() //False positive
        cy.findByRole('tab', {
            name: /upload/i
        }).click()
        cy.findByRole('tab', {
            name: /settings/i
        }).click()
        cy.findByRole('listitem', {
            name: /new language/i
        }).click()

        cy.findByRole('button', {
            name: /create/i
        }).click()

        cy.findByText('Language name is required').should('be.visible')

        cy.get('div[class="form-floating"] > input[id="newLanguageName"]').type('New Language Name Test')


        cy.findByRole('button', {
            name: /create/i
        }).click()

        cy.findByText('Abstract syntax is required').should('be.visible')

        cy.findByRole('textbox', {
            name: /enter abstract syntax enter abstract syntax/i
        }).type('{}');

        cy.findByRole('button', {
            name: /create/i
        }).click()

        cy.findByText('Concrete syntax is required').should('be.visible')

        cy.findByRole('textbox', {
            name: /enter concrete syntax enter concrete syntax/i
        }).type('{}');

        cy.findByRole('combobox', {
            name: /select type/i
        }).select('Adaptation');

        cy.findByRole('button', {
            name: /create/i
        }).click()

        cy.findByText('Language created successfully').should('be.visible')

    });
    it('user should not be able to create an existing language', () => {
        cy.findByRole('listitem', {
            name: /new language/i
        }).click()

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

        cy.findByRole('button', {
            name: /create/i
        }).click()

        cy.findByText('Language name already exist').should('be.visible')

    });
    it('user should be able to modify an existing language', () => {
        cy.findByRole('tab', {
            name: /language list/i
        }).click()

        cy.findByRole('combobox', {
            name: /select language/i
        }).select('New Language Name Test');

        cy.findByRole('listitem', {
            name: /update language/i
        }).click();

        cy.get('#updateLanguageName').clear()

        cy.findByRole('button', {
            name: /update/i
        }).click();

        cy.findByText('Language name is required').should('be.visible')

        cy.get('#updateLanguageName').type('New Language Name Test Modified')

        cy.get('#updateLanguageType').select('Domain');
        cy.get('#updateLanguageState').select('Active');

        cy.get('#updateLanguageAbSy').clear()

        cy.findByRole('button', {
            name: /update/i
        }).click();

        cy.findByText('Abstract syntax is required').should('be.visible')

        cy.get('#updateLanguageAbSy').type('{}')

        cy.get('#updateLanguageCoSy').clear()

        cy.findByRole('button', {
            name: /update/i
        }).click();

        cy.findByText('Concrete syntax is required').should('be.visible')

        cy.get('#updateLanguageCoSy').type('{}')

        cy.findByRole('button', {
            name: /update/i
        }).click();

        cy.findByText('Language updated successfully').should('be.visible')

    });
    it('user should be able to delete a language', () => {

        cy.findByRole('listitem', {
            name: /delete language/i
        }).click()

        cy.findByText('Select language is required').should('be.visible');

        cy.findByRole('combobox', {
            name: /select language/i
        }).select('New Language Name Test Modified');

        cy.findByRole('listitem', {
            name: /delete language/i
        }).click()

        cy.wait(1000)
        cy.findByRole('button', {
            name: /no/i
        }).click()

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

        cy.findByRole('tab', {
            name: /help/i
        }).click()

        cy.findByText('What is VariaMos?').should('be.visible')

        cy.findByRole('link', {
            name: /what is variamos\?/i
        }).should('have.attr', 'target', '_blank')

        cy.findByRole('link', {
            name: /how can i define a language\?/i
        }).should('have.attr', 'target', '_blank')

        // cy.get('#userSetting').click()
    });
    it('user should be able to delete a project', () => {

        cy.findByRole('tab', {
            name: /current/i
        }).click({ force: true })

        cy.findByRole('button', {  name: /delete/i}).click({ force: true })

        cy.findByText('Project management').should('be.visible')

    });

})

describe('User should be able to create graphs', ()=>{
    it('user can create a project', () => {
        cy.visit('http://localhost:3000')
        // add Project name
        cy.findByPlaceholderText(/variamosproject/i).type('M').clear();
        cy.findByPlaceholderText(/variamosproject/i).type('My New Project');
        // add Product line
        cy.findByPlaceholderText(/variamosproductlinee/i).type('My New Product Line');
        // Click on create
        cy.findByRole('button', {
            name: /create/i
        }).click();

    })

    it('user should be able to create a new model', () => {

        // cy.findByText(/domain engineering/i).rightclick();
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('left');
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('topLeft');
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('bottomLeft');
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('top');
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('bottom');
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('topRight');
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('right');
        // cy.wait(2000)
        // cy.findByText(/domain engineering/i).rightclick('bottomRight');
        // cy.wait(2000)
        cy.findByText(/domain engineering/i).rightclick(-10,-10,{ force: true });
        cy.wait(2000)

        cy.findByText(/application engineering/i).click();

        cy.get('#domainEngineering').rightclick('left');

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

    it('user should be able to create a new product line', () => {

        cy.findByText(/my new product line/i).rightclick();
        cy.wait(5000);
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
