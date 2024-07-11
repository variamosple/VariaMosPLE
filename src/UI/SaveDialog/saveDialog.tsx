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

type SaveDialogProps = {
  show: boolean;
  handleCloseCallback: () => void;
  projectService: ProjectService;
};

export default function SaveDialog({
  show,
  handleCloseCallback,
  projectService,
}: SaveDialogProps) {
  const [key, setKey] = useState("solversemantics");
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
  const [projectInformation, setProjectInformation] = useState(new ProjectInformation(null, null, null, false, null, null, null, new Date()));
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
  const inputName_onChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let p2 = JSON.parse(JSON.stringify(projectInformation));
    p2.id = null;
    p2.name = event.target.value;
    setProjectInformation(p2);
  };

  const inputDescription_onChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let p2 = JSON.parse(JSON.stringify(projectInformation));
    p2.id = null;
    p2.description = event.target.value;
    setProjectInformation(p2);
  };

  const inputAuthor_onChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let p2 = JSON.parse(JSON.stringify(projectInformation));
    p2.id = null;
    p2.author = event.target.value;
    setProjectInformation(p2);
  };

  const inputSource_onChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let p2 = JSON.parse(JSON.stringify(projectInformation));
    p2.id = null;
    p2.source = event.target.value;
    setProjectInformation(p2);
  };

  //Handle setting the value of the endpoint
  const inputTemplate_onChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let p2 = JSON.parse(JSON.stringify(projectInformation));
    p2.template = event.target.checked;
    setProjectInformation(p2);
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

  const handleSaveProject = () => {
    if (!projectInformation.name) {
      return;
    }
    projectService.saveProjectInServer(projectInformation, null, null);
    handleCloseCallback();
  };

  const getProjectsByUser = () => {
    let projectInformation = projectService.getProjectInformation();
    if (projectInformation) {
      let p2 = JSON.parse(JSON.stringify(projectInformation));
      setProjectInformation(p2);
    } else {
      let project = projectService.getProject();
      let p2 = new ProjectInformation(null, project.name, null, false, null, null, null, new Date());
      setProjectInformation(p2);
    }
    projectService.getProjectsByUser(getProjectsByUserSuccessCallback, getProjectsByUserErrorCallback);
  }

  const getProjectsByUserSuccessCallback = (records: ProjectInformation[]) => {
    setProjects(records);
  }

  const getProjectsByUserErrorCallback = (e) => {
    alert(JSON.stringify(e));
  }

  const btnProject_onClic = (e) => {
    e.preventDefault();
    let index = e.target.attributes["data-index"].value;
    let projectInformation = projects[index];
    setProjectInformation(projectInformation);
    setKey("solversemantics");
  }

  const renderProjects = () => {
    let elements = [];
    if (projects) {
      for (let i = 0; i < projects.length; i++) {
        let project: ProjectInformation = projects[i];
        const element = (
          <tr>
            {/* <a title="Change name" href="#" className="link-project" data-id={project.id} data-template={false} onClick={btnProject_onClic}><MdEdit/></a> */}
            {/* <td>
              <a title="Delete project" href="#" className="link-project" data-id={project.id} data-template={false} onClick={btnDeleteProject_onClic}><IoMdTrash /></a>
            </td> */}
            <td>
              <a href="#" className="link-project" data-id={project.id} data-index={i} data-template={false} onClick={btnProject_onClic}>{project.name}</a>
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
            {/* <th></th> */}
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

  return (
    <>
      <Modal show={show} onHide={handleCloseCallback} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Save project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            defaultActiveKey="solversemantics"
            activeKey={key}
            id="controlled-tab-example"
            onSelect={(k) => setKey(k)}
          >
            <Tab eventKey="solversemantics" title="Information">
              <Form>
                <Form.Group className="mb-3" controlId="translatorEndpoint">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={projectInformation ? projectInformation.name : ""}
                    onChange={inputName_onChange}
                  />
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={projectInformation ? projectInformation.description : ""}
                    onChange={inputDescription_onChange}
                  />
                  <Form.Label>Author</Form.Label>
                  <Form.Control
                    type="text"
                    value={projectInformation ? projectInformation.author : ""}
                    onChange={inputAuthor_onChange}
                  />
                  <Form.Label>Source</Form.Label>
                  <Form.Control
                    type="text"
                    value={projectInformation ? projectInformation.source : ""}
                    onChange={inputSource_onChange}
                  />
                  <Form.Label>Public</Form.Label>
                  <Form.Check
                    type="checkbox"
                    checked={projectInformation ? projectInformation.template : false}
                    onChange={inputTemplate_onChange}
                  />
                </Form.Group>
              </Form>
            </Tab>
            <Tab eventKey="query" title="Projects">
              <div className="div-container-projects">
                {renderProjects()}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCallback}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveProject}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
