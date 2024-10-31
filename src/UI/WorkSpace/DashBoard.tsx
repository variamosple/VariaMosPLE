import { FC, useEffect, useMemo } from "react";
import { Pane, ResizablePanes } from "resizable-panes-react";
import ProjectService from "../../Application/Project/ProjectService";
import Layout from "../../core/components/Layout";
import useWindowDimensions from "../../core/hooks/useWindowDimensions ";
import DiagramEditor from "../DiagramEditor/DiagramEditor";
import ElementsPannel from "../DiagramEditor/ElementsPannel";
import ProjectManagement from "../ProjectManagement/ProjectManagement";
import { getUserProfile } from "../SignUp/SignUp.utils";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import "./DashBoard.css";

interface Props {
  loginEnabled?: boolean;
}

const DashBoard: FC<Props> = ({ loginEnabled }) => {
  const userProfile = useMemo(() => getUserProfile(), []);
  const projectService: ProjectService = useMemo(
    () => new ProjectService(),
    []
  );
  const { width } = useWindowDimensions();

  useEffect(() => {
    let project = projectService.createProject("My project");
    if (project.productLines.length == 0) {
      projectService.createLPS(project, "My product line", "System", "Retail");
    }
    projectService.updateProject(project, null);
  }, [projectService]);

  if (loginEnabled && !userProfile) {
    window.location.href = "/";
    return null;
  }

  return (
    <Layout>
      <ProjectManagement projectService={projectService} />
      {/* <NavBar projectService={projectService} /> */}
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
};

export default DashBoard;
