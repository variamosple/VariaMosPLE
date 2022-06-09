

import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';
import TreeMenu from "./TreeMenu";
import ProjectService from "../../Application/Project/ProjectService";
import ProjectManagement from "../ProjectManagement/ProjectManagement";


test('On initial render, the tree menu is hidden', async ()=> {
    let project_service = new ProjectService();
    render(<TreeMenu projectService={project_service}/>);
    expect(screen.getByText("New model")).toHaveAttribute("class", "hidden dropdown-item")
})

test('Should verify that the languge is in the drop-down menu', async ()=>{
    //todo i have to mock the language from the database --> I need to pass args/props to ProjectService

    let project_service = new ProjectService();
    render(<TreeMenu projectService={project_service} />);

    const dropDownMenu = screen.queryByTestId('dropdown-menu-test-id');

    //Checking if the language is in the drop-down menu
    expect(dropDownMenu).toHaveTextContent('New model');//todo Here i need to change 'New model'
})

test('Hovering "New model > " reveals the context menu', async ()=>{
    //todo i have to mock the language from the database
    // I need to pass args/props to ProjectService
    let project_service = new ProjectService();
    render(<TreeMenu projectService={project_service} />);
    const newModelButton = screen.queryByText('New Model');

    const dropDownMenu = screen.queryByTestId('dropdown-menu-test-id');
    expect(dropDownMenu).toHaveTextContent('New model');


    // now it should not be in the document
    const modelList = screen.queryByText('Test Model');
    expect(modelList).not.toBeInTheDocument()
    // after hover it should be seen
    await userEvent.hover(newModelButton);
    // expect(screen.queryByText('Test Model')).toBeInTheDocument()
    // screen.debug()

    //
    // await userEvent.unhover(newModelButton);
    // expect(screen.queryByText('Test Model')).not.toBeInTheDocument()
    // screen.debug()

    //
    // expect(screen.getByText("New model")).toContainHTML()
    // expect(screen.getByText("New model")).toHaveDisplayValue()
    // expect(screen.getByText("New model")).toHaveProperty()
    // expect(screen.getByText("New model")).toHaveStyle()

  // wait for appearance inside an assertion
  // await waitFor(() => {
  //   expect(screen.getByText(/new model/i)).toBeInTheDocument()
  // })
})
