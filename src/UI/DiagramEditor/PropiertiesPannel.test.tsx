import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import PropiertiesPannel from "./PropiertiesPannel";

// There is only the render method
test('The propierties pannel should be visible', ()=>{
    //Arrange
    // let project_service = new ProjectService();
    // project_service.project.name = "VariaMos Project Name"
    // render(<PropiertiesPannel projectService={project_service} />);

});

// You can test Name, Selectiveness, Type, RangeMin, RangeMax, Testing, Comment, Possible values

test('The name of the element should be changeable', ()=>{
  // screen.getByRole('')

});


test('The selectiveness of the element should be changeable', ()=>{
    // screen.getByRole('')

});


