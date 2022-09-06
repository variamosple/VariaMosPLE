import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import PropiertiesPannel from "./PropiertiesPannel";

// There is only the render method
test('The propierties pannel should be visible', ()=>{
    //Arrange
    let project_service = new ProjectService();
    render(<PropiertiesPannel projectService={project_service} />);

    expect(screen.getByText(/propierties/i)).toBeVisible();
    expect(screen.queryByRole('button', {name: /custom properties button/i})).toBe(null)

});

// You can test Name, Selectiveness, Type, RangeMin, RangeMax, Testing, Comment, Possible values

//CSS test to kill a mutant (Css test are not really useful in testing the functionnality of the system)
test('The elements panel  should be the right size', ()=>{
    let project_service = new ProjectService();
    render(<PropiertiesPannel projectService={project_service} />);

    let property = document.getElementById('PropiertiesPannel');
    console.log(property)

    expect(property).toContainHTML('style="height: 60vh;"');
    expect(property).toContainHTML('style="overflow: auto;"');

})

