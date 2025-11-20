import { FC, useEffect, useMemo } from "react";
import { Pane, ResizablePanes } from "resizable-panes-react";
import ProjectService from "../../Application/Project/ProjectService";
import Layout from "../../core/components/Layout";
import useWindowDimensions from "../../core/hooks/useWindowDimensions ";
import DiagramEditor from "../DiagramEditor/DiagramEditor";
import ElementsPannel from "../DiagramEditor/ElementsPannel";
import ProjectManagement from "../ProjectManagement/ProjectManagement";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import "./DashBoard.css";
import ModelRenderer from "./ModelRenderer";

const DashBoard: FC<unknown> = () => {
  const projectService: ProjectService = useMemo(
    () => new ProjectService(),
    []
  );
  const { width } = useWindowDimensions();

  useEffect(() => {
    const init = async () => {
      try{
        await projectService.initUser();
        // Si es Guest, crear proyecto por defecto
        if (projectService.isGuessUser()) {
          let project = projectService.createProject("My project");
          if (project.productLines.length == 0) {
            projectService.createLPS(project, "My product line", "System", "Retail");
          }
          projectService.updateProject(project, null);
          // Cambiar estado a cargado
          projectService.setProjectLoaded(true);
        } else {
          // Si no es guest, mantener estado de no cargado (Por Defecto)
          projectService.setProjectLoaded(false);
        }
      }catch(error){
        console.error("Error initializing project service", error);
      }
    }
    init();
  }, [projectService]);


  return (
    <Layout>
      <ProjectManagement projectService={projectService}/>
      {/* <NavBar projectService={projectService} /> */}
      <div className="w-100 h-100">
      <ModelRenderer projectService={projectService} />
      </div>
    </Layout>
  );
};

export default DashBoard;