import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import TreeMenu from "./TreeMenu";
import ProjectService from "../../Application/Project/ProjectService";

describe('Testing the Tree menu', ()=>{
    test('On initial render, the tree menu is hidden', async ()=> {
        let project_service = new ProjectService();
        render(<TreeMenu projectService={project_service}/>);
        expect(screen.getByText("New model")).toHaveAttribute("class", "hidden dropdown-item")
    })

    afterEach(()=>{
        jest.clearAllMocks();
    })
})

