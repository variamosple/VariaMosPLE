import React, { Component } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import MxGEditor from "../MxGEditor/MxGEditor";

interface Props {
  projectService: ProjectService;
}
interface State {}

class DiagramEditor extends Component<Props, State> {
  state = {};

  // constructor(props:Props){
  //   super(props);
  // }

  render() {
    return (
      <div
        id="EditorPannel"
        className="col-10 col-sm-10 distribution-variamos"
        style={{ height: "91vh"}}
      >
        <div className="col-sm-12 h-100">
          <div className="card text-center h-100 shadow-sm bg-body rounded">
            <div className="card-body">
              <MxGEditor projectService={this.props.projectService} />
            </div>
            {/* <div className="card-footer text-muted"></div> */}
          </div>
        </div>
      </div>
    );
  }
}

export default DiagramEditor;
