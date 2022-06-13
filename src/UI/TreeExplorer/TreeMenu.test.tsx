import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';
import TreeMenu from "./TreeMenu";
import ProjectService from "../../Application/Project/ProjectService";
import ProjectManagement from "../ProjectManagement/ProjectManagement";

describe('Testing the Tree menu', ()=>{
    test('On initial render, the tree menu is hidden', async ()=> {
        let project_service = new ProjectService();
        render(<TreeMenu projectService={project_service}/>);
        expect(screen.getByText("New model")).toHaveAttribute("class", "hidden dropdown-item")
    })

    test('When you click on "New Application" the modal becomes visible', ()=>{
        // screen.getByRole('')

    });

    test('Should verify that the language is in the drop-down menu', async ()=>{

        //todo i have to mock the language from the database --> I need to pass args/props to ProjectService


    })

    test('Hovering "New model > " reveals the context menu', async ()=>{
        //todo i have to mock the language from the database
        // I need to pass args/props to ProjectService

    })

    afterEach(()=>{
        jest.clearAllMocks();
    })
})

