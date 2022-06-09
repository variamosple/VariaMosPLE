
import ProjectManagement from "./ProjectManagement";
import ProjectService from "./../../Application/Project/ProjectService"
import {fireEvent, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/extend-expect';

test('On initial render, the Create button should be enabled ', ()=>{
   //Arrange
   let project_service = new ProjectService();
   render(<ProjectManagement projectService={project_service} />);
   //Assert
   expect(screen.getAllByRole('button', {name: /create/i})[0]).toBeEnabled();
});

describe('Testing the Project name input', ()=>{

   test('On initial render, the Project Name input should be empty ', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProject');
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("");
   });

   test('Should be able to type in Project Name input', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProject');
      //Act
      fireEvent.change(inputElement, {target : {value : "Project name for testing"}});
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("Project name for testing");
   });

   test('Project Name input should display name of the project once it is passed', ()=>{



   });



})

describe('Testing the Product line name input', ()=>{

   test('On initial render, the Product Line Name input should be empty ', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProductLineE');
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("");
   });

   test('Should be able to type in Product Line Name input', ()=>{
      //Arrange
      let project_service = new ProjectService();
      render(<ProjectManagement projectService={project_service} />);
      const inputElement = screen.getByPlaceholderText('VariaMosProductLineE');
      //Act
      fireEvent.change(inputElement, {target : {value : "Product line name for testing"}});
      //Assert
      // @ts-ignore
      expect(inputElement.value).toBe("Product line name for testing");
   });

})




test('Clicking on upload should shows the upload modal', ()=>{
   //Checks if the upload button is visible

   // expect(screen.getByPlaceholderText('VariaMosProject')).toHaveValue("test");
   // expect(screen.getByDisplayValue('The text changes')).toBeInTheDocument();
   screen.getByRole('')
});

test('Clicking on settings should shows the settings modal', ()=>{
   //Checks if the user can select the language
   //Have to check the LanguageManagement Component
   screen.getByRole('')
});

test('Clicking on help shows the help', ()=>{
   //Checks if the upload button is visible
   screen.getByRole('')
});
