import { useEffect, useRef, useState } from "react";

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

type NewDialogProps = {
  show: boolean;
  handleCloseCallback: () => void;
  projectService: ProjectService;
};

export default function NewDialog({
  show,
  handleCloseCallback,
  projectService,
}: NewDialogProps) {
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


  const [projectName, setProjectName] = useState("");
  const [productLineName, setProductLineName] = useState("");
  const [plDomains, setPlDomains] = useState(['Advertising and Marketing', 'Agriculture', 'Architecture and Design', 'Art and Culture', 'Automotive', 'Beauty and Wellness', 'Childcare and Parenting', 'Construction', 'Consulting and Professional Services', 'E-commerce', 'Education', 'Energy and Utilities', 'Environmental Services', 'Event Planning and Management', 'Fashion and Apparel', 'Finance and Banking', 'Food and Beverage', 'Gaming and Gambling', 'Government and Public Sector', 'Healthcare', 'Hospitality and Tourism', 'Insurance', 'Legal Services', 'Manufacturing', 'Media and Entertainment', 'Non-profit and Social Services', 'Pharmaceuticals', 'Photography and Videography', 'Printing and Publishing', 'Real Estate', 'Research and Development', 'Retail', 'Security and Surveillance', 'Software and Web Development', 'Sports and Recreation', 'Telecommunications', 'Transportation and Logistics', 'Travel and Leisure', 'Wholesale and Distribution']);
  const [plTypes, setPlTypes] = useState(['Software', 'System']);
  const [productLineDomain, setProductLineDomain] = useState('Retail');
  const [productLineType, setProductLineType] = useState("System");
  
  const inputProjectNameRef = useRef(null);
  const inputProductLineNameRef = useRef(null);

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

  
  useEffect(() => { 
    inputProjectNameRef.current.focus();
  }, []); 


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

  const renderProjects = () => {
    let elements = [];
    if (projects) {
      for (let i = 0; i < projects.length; i++) {
        let project = projects[i];
        const element = (<li><a href="#" className="link-project" data-id={project.id} data-template={false} onClick={btnProject_onClic}>{project.name}</a></li>);
        elements.push(element);
      }
    }
    return (
      <ul>{elements}</ul>
    )
  }

  const renderTemplateProjects = () => {
    let elements = [];
    if (templateProjects) {
      for (let i = 0; i < templateProjects.length; i++) {
        let project = templateProjects[i];
        const element = (<li><a href="#" className="link-project" data-id={project.id} data-template={true} onClick={btnProject_onClic}>{project.name}</a></li>);
        elements.push(element);
      }
    }
    return (
      <ul>{elements}</ul>
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

  const handleSaveProject = () => {
    if (!projectName) {
      inputProjectNameRef.current.focus();
      return;
    }
    if (!productLineName) {
      inputProductLineNameRef.current.focus();
      return;
    }
    let project = projectService.createNewProject(projectName, productLineName, productLineType, productLineDomain);
    projectService.setProjectInformation(null);
    projectService.updateProject(project, null);
    handleCloseCallback();
  };

  const inputProjectName_onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };

  const inputProductLineName_onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProductLineName(event.target.value);
  };

  const inputProductLineType_onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setProductLineType(event.target.value);
  };

  const inputProductLineDomain_onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setProductLineDomain(event.target.value);
  };

  return (
    <>
      <Modal show={show} onHide={handleCloseCallback} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>New project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="translatorEndpoint">
              <Form.Label>Project name *</Form.Label>
              <Form.Control
                ref={inputProjectNameRef}
                type="text"
                placeholder=""
                value={projectName}
                onChange={inputProjectName_onChange}
              />
              <Form.Label>Product line name *</Form.Label>
              <Form.Control
                ref={inputProductLineNameRef}
                type="text"
                placeholder=""
                value={productLineName}
                onChange={inputProductLineName_onChange}
              />
              <Form.Label>Type</Form.Label>
              <Form.Select aria-label="Type" value={productLineType} onChange={inputProductLineType_onChange}>
                {plTypes.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
              <Form.Label>Domain</Form.Label>
              <Form.Select aria-label="Domain" value={productLineDomain} onChange={inputProductLineDomain_onChange}>
                {plDomains.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCallback}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveProject}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
