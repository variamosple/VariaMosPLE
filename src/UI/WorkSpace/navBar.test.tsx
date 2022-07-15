import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import NavBar from "./navBar";

describe('The navbar should be displayed', ()=>{

    test('The menu button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(document.querySelector('#hiddenProject')).toBeVisible()
    })
    test('The home button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(screen.getByRole('listitem', {name: /home/i})).toBeVisible()
        // expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', 'https://variamos.com/home/variamos-web/');
    })
    test('The docs button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(screen.getByRole('listitem', {name: /view docs/i})).toBeVisible()
        // expect(screen.getAllByRole('link')[1]).toHaveAttribute('href', 'https://github.com/VariaMosORG/VariaMos/wiki');
    })
    test('The downlooad button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(screen.getByRole('listitem', {name: /download project/i})).toBeVisible()
    })
    test('The setting button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(screen.getByRole('listitem', {name: /project management/i})).toBeVisible()
        expect(screen.queryByRole('button', {name: /project management/i})).toBe(null)
    })
    test('The login button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(screen.getByRole('listitem', {name: /user setting/i})).toBeVisible()
    })

    //CSS test to kill a mutant (Css test are not really useful in testing the functionnality of the system)
    test('The navBar should be the right size', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        const navBar = document.getElementsByClassName('row distribution-variamos background-variamos');
        expect(navBar[0]).toContainHTML('style="height: 4vh; z-index: 5;"')
    })
})
