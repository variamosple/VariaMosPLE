import { useEffect, useState } from "react";

import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Spinner from "react-bootstrap/Spinner";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import Editor from "react-simple-code-editor";
import { ProjectInformation } from "../../Domain/ProductLineEngineering/Entities/ProjectInformation";

import { IoMdTrash } from 'react-icons/io';
import { MdEdit } from "react-icons/md";

//Import the code to run the query
import {
  runQuery,
  sanitizeConcreteSemantics,
  syncConcreteSemantics,
  syncSemantics,
} from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import { Query } from "../../Domain/ProductLineEngineering/Entities/Query";
import ProjectService from "../../Application/Project/ProjectService";
import { set } from "immer/dist/internal";
import { json } from "react-router-dom";
import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";

type OpenDialogProps = {
  show: boolean;
  handleCloseCallback: () => void;
  projectService: ProjectService;
};

export default function OpenDialog({
  show,
  handleCloseCallback,
  projectService,
}: OpenDialogProps) {
  const [key, setKey] = useState("templateProjects");
  const [translatorEndpoint, setTranslatorEndpoint] = useState(
    ""
  );
  const [query, setQuery] = useState("");
  const [queryInProgress, setQueryInProgress] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [results, setResults] = useState([]);
  const [semantics, setSemantics] = useState("");
  const [solverSemantics, setSolverSemantics] = useState("\n\n\n");
  const [selectedSolver, setSelectedSolver] = useState("swi");
  const [semanticsInProgress, setSemanticsInProgress] = useState(false);
  const [semanticsReady, setSemanticsReady] = useState(false);
  const [savedQueries, setSavedQueries] = useState({});
  const [queryName, setQueryName] = useState("");
  const [projects, setProjects] = useState([]);
  const [templateProjects, setTemplateProjects] = useState([]);
  const [users, setUsers] = useState(["Hugo", "Paco", "Luis"]);

  //Load the saved queries from the local storage on load
  useEffect(() => {
    const savedQueries = localStorage.getItem("savedQueries");
    if (savedQueries) {
      setSavedQueries(JSON.parse(savedQueries));
    }
    getProjectsByUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("savedQueries", JSON.stringify(savedQueries));
  }, [savedQueries]);

  useEffect(() => {
    localStorage.setItem("currentResults", JSON.stringify(results));
  }, [results]);

  //Handle setting the value of the endpoint
  const handleSetTranslatorEndpoint = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTranslatorEndpoint(event.target.value);
  };

  //Handle setting the value of the query
  const handleSetQuery = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(event.target.value);
  };

  const populateResultsTab = (results) => {
    setResults((prevResults) => [...prevResults, results]);
  };

  const handleSyncSemantics = async () => {
    setSemanticsInProgress(true);
    setSemanticsReady(false);
    console.log("Syncing Semantics for the model");
    const result = await syncSemantics(projectService, translatorEndpoint);
    console.log("Result,", result);
    if (result) {
      setSemanticsReady(true);
      setSemantics(result);
    }
    setSemanticsInProgress(false);
  };

  // Handle getting the concrete semantics for the model
  const handleGetConcreteSemantics = async (lang: string) => {
    console.log(`Getting concrete semantics for the model with lang ${lang}`);
    const result = await syncConcreteSemantics(
      projectService,
      translatorEndpoint,
      lang
    );
    if (result) {
      setSolverSemantics(sanitizeConcreteSemantics(result, projectService));
    }
  };

  //Handle submiting the query
  const handleSubmitQuery = async () => {
    setQueryInProgress(true);
    setResultsReady(false);
    console.log("Submit query", translatorEndpoint, query);
    const query_object = new Query(JSON.parse(query));
    const result = await runQuery(
      projectService,
      translatorEndpoint,
      query_object
    );
    console.log("Result", result);
    //Populate the results tab
    if (result || (["sat", "solve", "nsolve"].includes(query_object.operation) && result === false)) {
      console.log("Populating results tab with ", result)
      console.log("Query object", query_object)
      populateResultsTab(result);
      setResultsReady(true);
    }
    setQueryInProgress(false);
  };

  const clearResults = () => {
    setResults([]);
    setResultsReady(false);
    setKey("query");
  };

  const handleResetModelConfig = () => {
    projectService.resetModelConfig();
  };

  const handleSaveQuery = () => {
    setSavedQueries((prevQueries) => ({
      ...prevQueries,
      [queryName]: JSON.parse(query),
    }));
    //savedQueries[queryName] = (JSON.parse(query));
    //setSavedQueries(savedQueries);
  };

  const getProjectsByUser = () => {
    if (!projectService.isGuessUser()) {
      setKey("privateProjects");
    }
    projectService.getProjectsByUser(getProjectsByUserSuccessCallback, getProjectsByUserErrorCallback);
    projectService.getTemplateProjects(getTemplateProjectsSuccessCallback, getTemplateProjectsErrorCallback);
  }

  const getProjectsByUserSuccessCallback = (records: ProjectInformation[]) => {
    setProjects(records);
  }

  const getProjectsByUserErrorCallback = (e) => {
    alert(JSON.stringify(e));
  }

  const getTemplateProjectsSuccessCallback = (records: ProjectInformation[]) => {
    setTemplateProjects(records);
  }

  const getTemplateProjectsErrorCallback = (e) => {
    alert(JSON.stringify(e));
  }

  const btnProject_onClic = (e) => {
    e.preventDefault();
    let projectId = e.target.attributes["data-id"].value;
    let template = JSON.parse(e.target.attributes["data-template"].value);
    projectService.openProjectInServer(projectId, template);
    handleCloseCallback();
  }

  const btnDeleteProject_onClic = (e) => {
    e.preventDefault();
    if (window.confirm("Delete this project?") == true) {
      let p = e.target;
      p = p.parentElement;
      p = p.parentElement;
      let projectId = p.attributes["data-id"].value;
      let pi = new ProjectInformation(projectId, null, null, false, null, null, null, null);
      let successCallback = (e) => {
        getProjectsByUser();
      }
      projectService.deleteProjectInServer(pi, successCallback, null);
    }
  }

  const renderProjects = () => {
    let elements = [];
    if (projects) {
      for (let i = 0; i < projects.length; i++) {
        let project: ProjectInformation = projects[i];
        const element = (
          <tr>
            {/* <a title="Change name" href="#" className="link-project" data-id={project.id} data-template={false} onClick={btnProject_onClic}><MdEdit/></a> */}
            <td>
              <a title="Delete project" href="#" className="link-project" data-id={project.id} data-template={false} onClick={btnDeleteProject_onClic}><IoMdTrash /></a>
            </td>
            <td>
              <a href="#" className="link-project" data-id={project.id} data-template={false} onClick={btnProject_onClic}>{project.name}</a>
            </td>
            <td>
              {new Date(project.date).toLocaleString()}
            </td>
            <td>
              {project.description}
            </td>
            <td>
              {project.author}
            </td>
            <td>
              {project.source}
            </td>
          </tr>
        );
        elements.push(element);
      }
    }
    return (
      <table>
        <thead style={{ position: 'sticky', top: '0', backgroundColor: 'white' }}>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Date</th>
            <th>Description</th>
            <th>Author</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {elements}
        </tbody>
      </table>
    )
  }

  const renderTemplateProjects = () => {
    if (templateProjects) {
      let elements = [];
      for (let i = 0; i < templateProjects.length; i++) {
        let project: ProjectInformation = templateProjects[i];
        const element = (
          <tr> 
            <td>
              <a href="#" className="link-project" data-id={project.id} data-template={false} onClick={btnProject_onClic}>{project.name}</a>
            </td>
            <td>
              {new Date(project.date).toLocaleString()}
            </td>
            <td>
              {project.description}
            </td>
            <td>
              {project.author}
            </td>
            <td>
              {project.source}
            </td>
          </tr>
        );
        elements.push(element);
      }
      return (
        <table>
          <thead style={{ position: 'sticky', top: '0', backgroundColor: 'white' }}>
            <tr> 
              <th>Name</th>
              <th>Date</th>
              <th>Description</th>
              <th>Author</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {elements}
          </tbody>
        </table>
      )
    }
  }

  const renderUsers = () => {
    let elements = [];
    if (users) {
      for (let i = 0; i < users.length; i++) {
        let user = users[i];
        const element = (<li><span>{user}</span></li>);
        elements.push(element);
      }
    }
    return (
      <ul>{elements}</ul>
    )
  }

  const btnImportProject_onClick = () => {
    var uploadInput = document.getElementById("uploadInput");
    uploadInput.click();
  }

  const uploadInput_onChange = (e) => {
    var uploadInput = e.target;
    var file = uploadInput.files[0]; // Get the selected file
    if (file) {
      // Create a FileReader object
      var reader = new FileReader();

      // Read file data when it's loaded
      reader.onload = function (event) {
        var fileData: any = event.target.result;
        projectService.importProject(fileData);
        handleCloseCallback();
      };

      // Read the file as a data URL
      reader.readAsText(file);
    }
  }

  return (
    <>
      <Modal show={show} onHide={handleCloseCallback} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Open project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="NavBar">
            <a title="Upload" onClick={btnImportProject_onClick}><span><img src="/images/menuIcons/upload.png"></img></span></a>{" "}
          </div>
          <input type="file" id="uploadInput" onChange={uploadInput_onChange} style={{ display: 'none' }}></input>
          <br />
          <Tabs
            defaultActiveKey="templateProjects"
            activeKey={key}
            id="controlled-tab-example"
            onSelect={(k) => setKey(k)}
          >
            {projectService.isGuessUser() ? (null) : (
              <Tab eventKey="privateProjects" title="Personal">
                <div className="div-container-projects">
                  {renderProjects()}
                </div>
              </Tab>
            )}
            <Tab eventKey="templateProjects" title="Public">
              <div className="div-container-projects">
                {renderTemplateProjects()}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCallback}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
