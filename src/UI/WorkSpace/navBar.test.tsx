import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    })
    test('The docs button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(screen.getByRole('listitem', {name: /view docs/i})).toBeVisible()
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
    })
    test('The login button should be visible', ()=>{
        const project_service = new ProjectService();
        render(<NavBar projectService={project_service} />);

        expect(screen.getByRole('listitem', {name: /user setting/i})).toBeVisible()

    })

})
