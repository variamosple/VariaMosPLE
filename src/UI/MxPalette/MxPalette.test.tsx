import {render} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import ProjectService from "../../Application/Project/ProjectService";
import MxPalette from "./MxPalette";
import React from "react";
// There a lot of method to test

test('The palette Should be created on render', ()=>{

    const componentDidMountMock = jest
    .spyOn(MxPalette.prototype, "componentDidMount")

    const addNewProductLineListenerMock = jest
    .spyOn(ProjectService.prototype, "addNewProductLineListener")

    const addSelectedModelListenerMock = jest
    .spyOn(ProjectService.prototype, "addSelectedModelListener")

    let project_service = new ProjectService();
    render(<MxPalette projectService={project_service}/>)

    expect(componentDidMountMock).toHaveBeenCalled()
    expect(addNewProductLineListenerMock).toHaveBeenCalled()
    expect(addSelectedModelListenerMock).toHaveBeenCalled()

});



test('The mxpalette panel should have the right font size', ()=>{

    let project_service = new ProjectService();
    render(<MxPalette projectService={project_service} />);
    let mxpalette = document.getElementById('graph_palette');

    expect(mxpalette).toContainHTML('style="font-size: 8px;"');
})

