import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import TreeExplorer from "./TreeExplorer";
import ProjectService from "../../Application/Project/ProjectService";

test('The name of the project should appear on the screen', ()=>{

    //Arrange
    let project_service = new ProjectService();
    project_service.project.name = "VariaMos Project Name"
    render(<TreeExplorer projectService={project_service} />);

    //Assert
    expect(screen.getByText(/variamos project name/i)).toBeVisible();
});

// Ne marche pas surement a cause de this.props.projectService.project.productLines.map(
test('The name of the product line should appear on the screen', ()=>{

    //Arrange
    let project_service = new ProjectService();
    project_service.project.name = "Product Line Name"
    // @ts-ignore
    project_service.project.productLines = ['Product line name']
    render(<TreeExplorer projectService={project_service} />);

    //Assert
    expect(screen.getByText(/product line name/i)).toBeVisible();
});

test('Domain engineering should appear on the screen', ()=>{

    //Arrange
    let project_service = new ProjectService();
    project_service.project.name = "Product Line Name"
    // @ts-ignore
    project_service.project.productLines = ['Product line name']
    render(<TreeExplorer projectService={project_service} />);

    //Assert
    expect(screen.getByText(/domain engineering/i)).toBeVisible();
});

test('Application engineering should appear on the screen', ()=>{

    //Arrange
    let project_service = new ProjectService();
    project_service.project.name = "Product Line Name"
    // @ts-ignore
    project_service.project.productLines = ['Product line name']
    render(<TreeExplorer projectService={project_service} />);

    //Assert
    expect(screen.getByText(/application engineering/i)).toBeVisible();

});

test('When you left click on "Application Engineering" the + becomes -', ()=>{

    //Arrange
    let project_service = new ProjectService();
    project_service.project.name = "Product Line Name"
    // @ts-ignore
    project_service.project.productLines = ['Product line name']
    render(<TreeExplorer projectService={project_service} />);


    const clickableElement = screen.getByText(/application engineering/i);
    expect(clickableElement).toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o appE");
    //Act
    clickableElement.click();
    //Assert
    expect(clickableElement).not.toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o appE")

});

test('When you left click on "Domain Engineering" the + becomes -', ()=>{

    //Arrange
    let project_service = new ProjectService();
    project_service.project.name = "Product Line Name"
    // @ts-ignore
    project_service.project.productLines = ['Product line name']
    render(<TreeExplorer projectService={project_service} />);

    const clickableElement = screen.getByText(/domain engineering/i);
    expect(clickableElement).toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o domainE");
    //Act
    clickableElement.click();
    //Assert
    expect(clickableElement).not.toHaveAttribute("class", "fa fa-plus-square fa-minus-square-o domainE")
});
