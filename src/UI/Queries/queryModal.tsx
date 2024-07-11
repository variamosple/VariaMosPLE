import { useEffect, useState } from "react";

import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Spinner from "react-bootstrap/Spinner";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
//Prism Stuff
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-lisp";
import "prism-themes/themes/prism-vsc-dark-plus.css";
import Editor from "react-simple-code-editor";

//Import the code to run the query
import {
  runQuery,
  sanitizeConcreteSemantics,
  syncConcreteSemantics,
  syncSemantics,
  hasSemantics,
  setModelConstraints,
  getCurrentConstraints,
} from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import { Query } from "../../Domain/ProductLineEngineering/Entities/Query";
import ProjectService from "../../Application/Project/ProjectService";
import QueryResult from "./queryResult";
import QueryBuilder from "./queryBuilder";

type QueryModalProps = {
  show: boolean;
  handleCloseCallback: () => void;
  projectService: ProjectService;
};

export default function QueryModal({
  show,
  handleCloseCallback,
  projectService,
}: QueryModalProps) {
  const [key, setKey] = useState("query");
  const [translatorEndpoint, setTranslatorEndpoint] = useState(
    "https://app.variamos.com/semantic_translator"
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
  const [arbitraryConstraints, setArbitraryConstraints] = useState("");

  //Handle changes on the model's arbitrary constraints
  useEffect(() => {
    console.log("Arbitrary constraints changed");
    setModelConstraints(projectService ,arbitraryConstraints);
  }, [projectService, arbitraryConstraints]);

  //Load constraints on model change
  useEffect(() => {
    if(show){
      const constraints = getCurrentConstraints(projectService);
      setArbitraryConstraints(constraints);
      console.log("Loading model constraints");
    }
  }, [projectService, show]);

  //Load the saved queries from the local storage on load
  useEffect(() => {
    const savedQueries = localStorage.getItem("savedQueries");
    if (savedQueries) {
      setSavedQueries(JSON.parse(savedQueries));
    }
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
    if (
      result ||
      (["sat", "solve", "nsolve"].includes(query_object.operation) &&
        result === false)
    ) {
      console.log("Populating results tab with ", result);
      console.log("Query object", query_object);
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

  const queryResult_onVisualize=()=>{
    let i=0;
    handleCloseCallback();
  }

  return (
    <>
      <Modal show={show} onHide={handleCloseCallback} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Queries</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            defaultActiveKey="query"
            activeKey={key}
            id="controlled-tab-example"
            onSelect={(k) => setKey(k)}
          >
            {/* Tab for setting the arbitrary constraints */}
            <Tab eventKey="constraints" title="Constraints">
              <Editor
                value={arbitraryConstraints}
                onValueChange={setArbitraryConstraints}
                highlight={(arbitraryConstraints) => highlight(arbitraryConstraints, languages.lisp, "lisp")}
                padding={10}
                className="editor"
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 18,
                  backgroundColor: "#1e1e1e",
                  caretColor: "gray",
                  color: "gray",
                  borderRadius: "10px",
                  overflow: "auto",
                }}
              />
            </Tab>
            {/* Main tab for sending the query */}
            <Tab eventKey="query" title="Query">
              <Form>
                <Form.Group className="mb-3" controlId="translatorEndpoint">
                  <Form.Label>Translator Endpoint</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter endpoint"
                    value={translatorEndpoint}
                    onChange={handleSetTranslatorEndpoint}
                  />
                  <Form.Text className="text-muted">
                    Enter the adress of the endpoint to use for the queries.
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3" controlId="query">
                  <Form.Label>Query</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={query}
                    onChange={handleSetQuery}
                  />
                  {/* Save the query with a text field */}
                  <Form.Control
                    type="text"
                    placeholder="Enter Query Name"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleSaveQuery}>
                    Save Query
                  </Button>
                </Form.Group>
              </Form>
            </Tab>
            {/* New tab for constructing the query */}
            <Tab eventKey="construct" title="Construct Query">
              {hasSemantics(projectService) ? (
                <QueryBuilder
                  projectService={projectService}
                  setQuery={setQuery}
                  setKey={setKey}
                />
              ) : (
                <p className="my-2">
                  There are no semantics for the current language
                </p>
              )}
            </Tab>
            {/* Tab for showing the results of the query */}
            <Tab eventKey="results" title="Results" disabled={!resultsReady}>
              {results.map((result, index) => (
                <QueryResult
                  key={index}
                  index={index}
                  result={result}
                  projectService={projectService}
                  onVisualize={queryResult_onVisualize}
                />
              ))}
            </Tab>
            <Tab
              eventKey="semantics"
              title="CLIF Semantics"
              disabled={!semanticsReady}
            >
              <Container style={{ maxHeight: "800px", overflow: "auto" }}>
                <Editor
                  value={semantics}
                  onValueChange={setSemantics}
                  highlight={(semantics) =>
                    highlight(semantics, languages.lisp, "lisp")
                  }
                  padding={10}
                  className="editor"
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 18,
                    backgroundColor: "#1e1e1e",
                    caretColor: "gray",
                    color: "gray",
                    borderRadius: "10px",
                    overflow: "auto",
                  }}
                />
              </Container>
            </Tab>
            {/* Tab for syncing the concrete solver semantics */}
            <Tab eventKey="solversemantics" title="Solver Specific Semantics">
              <Container
                style={{ maxHeight: "800px", overflow: "auto" }}
                className="mt-2"
              >
                <Row>
                  <Col>
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" id="dropdown-basic">
                        Selected solver: <b>{selectedSolver}</b>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setSelectedSolver("swi")}>
                          SWI
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => setSelectedSolver("minizinc")}
                        >
                          MiniZinc
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                  <Col xs={9}>
                    <Button
                      variant="primary"
                      onClick={() => handleGetConcreteSemantics(selectedSolver)}
                    >
                      Get <b>{selectedSolver}</b> Model
                    </Button>
                  </Col>
                </Row>

                <Row>
                  <Editor
                    value={solverSemantics}
                    onValueChange={setSolverSemantics}
                    highlight={(solverSemantics) => solverSemantics}
                    padding={10}
                    className="editor"
                    style={{
                      fontFamily: '"Fira code", "Fira Mono", monospace',
                      fontSize: 18,
                      backgroundColor: "#1e1e1e",
                      caretColor: "gray",
                      color: "gray",
                      borderRadius: "10px",
                      overflow: "auto",
                    }}
                  />
                </Row>
              </Container>
            </Tab>
            <Tab eventKey="saved_queries" title="Saved Queries">
              <Container style={{ maxHeight: "800px", overflow: "auto" }}>
                {(Object.getOwnPropertyNames(savedQueries).length > 0 &&
                  Object.entries(savedQueries).map(([name, query], index) => (
                    <div key={index}>
                      <Button
                        variant="primary"
                        onClick={() => setQuery(JSON.stringify(query))}
                      >
                        {name}
                      </Button>
                    </div>
                  ))) || (
                  <div>
                    <p>No saved queries</p>
                  </div>
                )}
              </Container>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCallback}>
            Close
          </Button>
          {key === "query" && (
            <Button variant="primary" onClick={handleSubmitQuery}>
              {queryInProgress && (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              )}
              Submit Query
            </Button>
          )}
          {key === "results" && (
            <Button variant="primary" onClick={clearResults}>
              Clear Query Results
            </Button>
          )}
          {key !== "results" && (
            <Button variant="primary" onClick={handleSyncSemantics}>
              {semanticsInProgress && (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              )}
              Sync CLIF Semantics
            </Button>
          )}
          <Button variant="primary" onClick={handleResetModelConfig}>
            Reset model configuration state
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
