import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import ElementsPannel from "./ElementsPannel";

// There is only the render method
test('The element panel should be visible', ()=>{
  // screen.getByRole('')
    let project_service = new ProjectService();
    render(<ElementsPannel projectService={project_service} />);

    expect(screen.getByText(/elements/i)).toBeVisible();
});

//CSS test to kill a mutant (Css test are not really useful in testing the functionnality of the system)
test('The elements panel  should be the right size', ()=>{
    let project_service = new ProjectService();
    render(<ElementsPannel projectService={project_service} />);

    let diagram = document.getElementById('ElementsPannel');
    expect(diagram).toContainHTML('style="height: 35vh; overflow: auto;"');

})
