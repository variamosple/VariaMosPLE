import LanguageManagement from "./LanguageManagement";
import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import React from "react";



test('The update button is enabled ', ()=>{
    let project_service = new ProjectService();
    render(<LanguageManagement projectService={project_service} />);
    //Assert
    expect(screen.getByRole('listitem', {
        name: /update language/i
    })).toBeEnabled();

});

test('The delete button is enabled ', () => {
    let project_service = new ProjectService();
    render(<LanguageManagement projectService={project_service} />);
    //Assert
    expect(screen.getByRole('listitem', {
        name: /delete language/i
    })).toBeEnabled();
});

test('The create language button is enabled ', () => {
    let project_service = new ProjectService();
    render(<LanguageManagement projectService={project_service} />);
    //Assert
    expect(screen.getByRole('listitem', {
        name: /new language/i
    })).toBeEnabled();
});
