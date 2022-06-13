import LanguageManagement from "./LanguageManagement";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';


describe('Testing the update button',()=>{
    test('The update button is enabled ', ()=>{
        // screen.getByRole('')

    });

    test('The update button throw an error if no language is selected ', ()=>{
        // screen.getByRole('')
        //Check if the function which throw the error has been called
    });

    test('User should be able to change Language name', ()=>{
        // screen.getByRole('')
    });

    test('User should be able to change Language type', ()=>{
        // screen.getByRole('')
    });

    test('User should be able to change Language state', ()=>{
        // screen.getByRole('')
    });

    test('User should be able to change abstract syntax', ()=>{
        // screen.getByRole('')
    });

    test('User should be able to change concrete syntax', ()=>{
        // screen.getByRole('')
    });

    test('Both button should be enabled', ()=>{
        // screen.getByRole('')
    });

})

describe('Testing the delete button',()=> {
    test('The delete button is enabled ', () => {
        // screen.getByRole('')

    });

    test('The delete button throw an error if no language is selected ', () => {
        // screen.getByRole('')
        //Check if the function which throw the error has been called
    });

});

describe('Testing the creation of languages', ()=>{
    test('Clicking on the "New language" button will display the correct panel', () => {
        // screen.getByRole('')
        // check if 'Create language' is on the screen
    });

    test('Empty name for new language should throw an error', () => {
        // screen.getByRole('')
        // check if the error function is called when cliking on the creat button without a name
    });

    test('Already taken name for new language should throw an error', () => {
        // screen.getByRole('')
        // check if the error function is called when cliking on the creat button without a name
    });

    test('Empty abstract syntax for new language should throw an error', () => {
        // screen.getByRole('')
        // check if the error function is called when cliking on the creat button without a name
    });


    test('Wrong abstract syntax for new language should throw an error', () => {
        // screen.getByRole('')
        // check if the error function is called when cliking on the creat button without a name
    });

    test('Empty concrete syntax for new language should throw an error', () => {
        // screen.getByRole('')
        // check if the error function is called when cliking on the creat button without a name
    });

    test('Wrong concrete syntax for new language should throw an error', () => {
        // screen.getByRole('')
        // check if the error function is called when cliking on the creat button without a name
    });



})

