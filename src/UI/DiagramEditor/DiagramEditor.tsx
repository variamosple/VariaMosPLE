import React, { Component } from "react";
import ProjectService from "../../Infraestructure/project/ProjectService";
import MxGEditor from "../MxGEditor/MxGEditor";

interface Props {
  projectService: ProjectService
}
interface State {}

class DiagramEditor extends Component<Props, State> {
  state = {};

  constructor(props:Props){
    super(props);
  }

  render() {
    return (
      <div id="EditorPannel" className="col-sm p-1 h-100">
        <div className="col-sm-12 p-1 h-100">
          <div className="card text-center h-100 shadow-sm p-1 bg-body rounded">
            <div className="card-header bg-lightblue-Variamos border-title-lighblue-variamos">
              <span
                className="fa fa-arrow-circle-o-left float-start p-1 shadow bg-lightblue-Variamos rounded"
                id="hiddenProject"
              ></span>
              Editor Space
            </div>
            <div className="card-body">
              <MxGEditor projectService={this.props.projectService} />
            </div>
            <div className="card-footer text-muted"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiagramEditor;
