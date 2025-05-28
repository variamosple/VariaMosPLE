import React, { Component } from "react";
import { Pane, ResizablePanes } from "resizable-panes-react";
import ProjectService from "../../Application/Project/ProjectService";
import DiagramEditor from "../DiagramEditor/DiagramEditor";
import ElementsPannel from "../DiagramEditor/ElementsPannel";
import BillOfMaterialsEditor from "../Scope/BillOfMaterialsEditor";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

interface ModelRendererProps {
    projectService: ProjectService;
}

interface ModelRendererState {
    width: number;
    selectedModel: Model
}

class ModelRenderer extends Component<ModelRendererProps, ModelRendererState> {
    constructor(props: ModelRendererProps) {
        super(props);
        this.state = {
            width: window.innerWidth,
            selectedModel: null
        };
        this.props.projectService.addSelectedModelListener(this.updateModel);
    }

    updateModel = (e) => {
        let model = e.model;
        this.setState({
            selectedModel: model
        }
        )
    };


    renderEditor(): any {
        let elements = [];
        const { selectedModel } = this.state;
        if (selectedModel) {
            const key = selectedModel.id;
            const isMxGraphModel = selectedModel.type !== "Catalog of potential products";
            if (isMxGraphModel) {
                elements.push(
                    <td>
                        <DiagramEditor projectService={this.props.projectService} />
                    </td>
                )
                elements.push(
                    <td>
                        <ElementsPannel projectService={this.props.projectService} />
                    </td>
                )
            }
            else {
                elements.push(
                    <td>
                        <BillOfMaterialsEditor
                            key={`bom-${key}`}
                            projectService={this.props.projectService}
                            onClose={() => {
                                // Aquí puedes agregar acciones opcionales al cerrar el editor BOM
                            }}
                        ></BillOfMaterialsEditor>
                    </td>
                )
            }
        }
        return elements;
    }

    render() {
        return (
            <div className="w-100 h-100">
                <table>
                    <tbody>
                    <tr>
                        <td className="td-treexplorer">
                            <TreeExplorer projectService={this.props.projectService} />
                        </td>
                        {this.renderEditor()}
                    </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

export default ModelRenderer;
