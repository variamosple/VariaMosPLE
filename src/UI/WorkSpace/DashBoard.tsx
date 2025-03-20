import React, { Component } from "react";
import { Pane, ResizablePanes } from "resizable-panes-react";
import ProjectService from "../../Application/Project/ProjectService";
import Layout from "../../core/components/Layout";
// import useWindowDimensions from "../../core/hooks/useWindowDimensions";
import DiagramEditor from "../DiagramEditor/DiagramEditor";
import ElementsPannel from "../DiagramEditor/ElementsPannel";
import ProjectManagement from "../ProjectManagement/ProjectManagement";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import "./DashBoard.css";

interface Props {
  loginEnabled?: boolean;
}

interface State {
  projectService: ProjectService;
  width: number;
  loading: boolean,
}

class DashBoard extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      projectService: new ProjectService(),
      width: window.innerWidth,
      loading: true,
    };
  }

  async componentDidMount() {
    window.addEventListener("resize", this.updateWindowDimensions);
    await this.initializeProject();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    this.setState({ width: window.innerWidth });
  };

  initializeProject = async () => {
    const { projectService } = this.state;
    await projectService.initialize();
    let project = projectService.getProject(); 
    if (project) {
      if (project.productLines.length === 0) {
        projectService.createLPS(project, "My product line", "System", "Retail");
      }
      projectService.updateProject(project, null);
    }
    this.setState({
      loading: false
    })
  };

  render() {
    if (this.state.loading) {
      return <div>Loading...</div>;
    }

    const {  projectService, width } = this.state;

    
    return (
      <Layout>
        <ProjectManagement projectService={projectService} />
        <div className="w-100 h-100">
          <ResizablePanes
            uniqueId="dashboardPanes"
            vertical
            resizerClass="bg-slate-500"
            unit="ratio"
            minMaxUnit="ratio"
          >
            <Pane
              id="TreeExplorerPane"
              size={Math.ceil((330 * 100) / width)}
              minSize={Math.ceil((330 * 100) / width)}
              className="overflow-y-auto overflow-x-hidden"
            >
              <TreeExplorer projectService={projectService} />
            </Pane>
            <Pane id="DiagramEditorPane" size={75} minSize={50} maxSize={75}>
              <DiagramEditor projectService={projectService} />
            </Pane>
            <Pane id="ElementsPannelPane" size={8} minSize={8} maxSize={8}>
              <ElementsPannel projectService={projectService} />
            </Pane>
          </ResizablePanes>
        </div>
      </Layout>
    );
  }
}

export default DashBoard;
