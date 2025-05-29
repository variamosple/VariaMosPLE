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
  const { selectedModel } = this.state;
  const key = selectedModel?.id;

  if (!selectedModel) return [];

  const isMxGraphModel = selectedModel.type !== "Catalog of potential products";
  if (isMxGraphModel) {
    return [
      <td key="diagram" style={{ padding: 0, width: "85%", verticalAlign: "top" }}>
        <div style={{
            width: "100%",           // llena el 100% de la celda
            height: "calc(100vh - 100px)",          // idéntico para altura
            overflow: "auto",        // scroll cuando ancho o alto se excedan
            boxSizing: "border-box",
          }}>
       <DiagramEditor projectService={this.props.projectService} />
       </div>
      </td>,
      <td key="panel" style={{ padding: 0, width: "15%", verticalAlign: "top" }}>
        <ElementsPannel projectService={this.props.projectService} />
      </td>
    ];
  } else {
    return [
      <td key="bom">
        <div>
        <BillOfMaterialsEditor
          key={`bom-${key}`}
          projectService={this.props.projectService}
          onClose={() => {}}
        />
        </div>
      </td>
    ];
  }
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