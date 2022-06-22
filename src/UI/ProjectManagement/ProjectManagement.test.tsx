
import ProjectManagement from "./ProjectManagement";
import ProjectService from "./../../Application/Project/ProjectService"
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import React from "react";

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

