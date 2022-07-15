import {render} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import DiagramEditor from "./DiagramEditor";

// There is only the render method
test('The diagram editor should be visible', ()=>{
    let project_service = new ProjectService();
    render(<DiagramEditor projectService={project_service} />);

    expect(document.querySelector('#EditorPannel')).toBeVisible();
});

//CSS test to kill a mutant (Css test are not really useful in testing the functionnality of the system)
test('The diagram editor should be the right size', ()=>{
    let project_service = new ProjectService();
    render(<DiagramEditor projectService={project_service} />);

    let diagram = document.getElementsByClassName('col-10 col-sm-10 distribution-variamos');
    expect(diagram[0]).toContainHTML('style="height: 95vh;"')
})
