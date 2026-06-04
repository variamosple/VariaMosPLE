import { useEffect, useMemo, useState } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import Layout from "../../core/components/Layout";
import DiagramEditor from "../DiagramEditor/DiagramEditor";
import ElementsPannel from "../DiagramEditor/ElementsPannel";
import ProjectManagement from "../ProjectManagement/ProjectManagement";
import TreeExplorer from "../TreeExplorer/TreeExplorer";
import NavBar from "./NavBar";
import "./DashBoard.css";
import ReasoningPanel from "../Reasoning/ReasoningPanel";
import SwitchSelector from "react-switch-selector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesDown } from "@fortawesome/free-solid-svg-icons";

function DashBoard() {

  const projectService: ProjectService = useMemo(
    () => new ProjectService(),
    []
  );

  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    const updateModel = (e: { model: any; }) => {
      setSelectedModel(e.model);
    };
    projectService.addSelectedModelListener(updateModel);
    return () => projectService.removeSelectedModelListener(updateModel);
  }, [projectService]);

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

  const [mode, setMode] = useState("edition");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  return (
    <Layout>
      <ProjectManagement projectService={projectService}/>
      <div className="main">
        <button id="left-panel-collapse-btn" className={`${leftPanelCollapsed ? 'collapsed' : ''}`} onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}>
          <FontAwesomeIcon icon={faAnglesDown} rotation={ leftPanelCollapsed ? 270 : 90} />
        </button>
        {!leftPanelCollapsed && <div id="left-panel" className="panel">
          <NavBar projectService={projectService} />
          <TreeExplorer projectService={projectService} />
        </div>}
        <div id="central-canvas">
          {!selectedModel && "Select a model first"}
          {selectedModel && <div id="mode-switch-selector">
            <SwitchSelector
              onChange={(value) => setMode(value as string)}
              options={[
                {
                  label: "Edition",
                  value: "edition",
                  selectedBackgroundColor: "#000000",
                },
                {
                  label: "Reasoning",
                  value: "reasoning",
                  selectedBackgroundColor: "#000000",
                },
              ]}
              initialSelectedIndex={0}
              name="mode"
            />
          </div>}
          {selectedModel && <DiagramEditor projectService={projectService} />}
        </div>
        {selectedModel && <div id="right-panel" className="panel">
          {mode === "edition" && <ElementsPannel projectService={projectService} />}
          {mode === "reasoning" && <ReasoningPanel projectService={projectService} />}
        </div>}
      </div>
    </Layout>
  );
};

export default DashBoard;
