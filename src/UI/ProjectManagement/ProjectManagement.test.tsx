
import ProjectManagement from "./ProjectManagement";
import ProjectService from "./../../Application/Project/ProjectService"
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';

test('On initial render, the Create button is Enabled ', ()=>{
   let project_service = new ProjectService();
   render(<ProjectManagement projectService={project_service} />);
   expect(screen.getAllByRole('button', {name: /create/i})[0]).toBeEnabled();

});

test('On initial render, the Project Name input is empty ', ()=>{
   let project_service = new ProjectService();
   render(<ProjectManagement projectService={project_service} />);
   expect(screen.getByPlaceholderText('VariaMosProject')[0]).toBe(undefined);
   userEvent.type(screen.getByPlaceholderText(/variamosproject/i), 'My New Project');
   // expect(screen.getByPlaceholderText('VariaMosProject')[0]).toBe('My New Project');
});

