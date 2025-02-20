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
import ModelRenderer from "./ModelRenderer";

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
      <ModelRenderer projectService={projectService} />
      </div>
    </Layout>
  );
};

export default DashBoard;