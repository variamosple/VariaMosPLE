import { useEffect, useState } from "react";

import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
//Prism Stuff
import "prism-themes/themes/prism-vsc-dark-plus.css";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-lisp";
import Editor from "react-simple-code-editor";

//Import the code to run the query
import { TabContainer, TabContent, TabPane } from "react-bootstrap";
import ProjectService from "../../Application/Project/ProjectService";
import { Query } from "../../Domain/ProductLineEngineering/Entities/Query";
import {
  hasSemantics,
  runQuery,
  sanitizeConcreteSemantics,
  syncConcreteSemantics,
  syncSemantics,
} from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import QueryBuilder from "./queryBuilder";
import QueryResult from "./queryResult";

type QueryModalProps = {
  handleCloseCallback: () => void;
  projectService: ProjectService;
};

export default function QueryModal({
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
    <div className="px-2">
  
      <TabContainer
        defaultActiveKey="query"
        activeKey={key}
        id="controlled-tab-example"
        onSelect={(k) => setKey(k)}
      >
        <Dropdown className="w-100">
          <Dropdown.Toggle className="w-100" variant="primary">
            Options
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item eventKey="query">Query</Dropdown.Item>
            <Dropdown.Item eventKey="construct">Construct Query</Dropdown.Item>
            <Dropdown.Item eventKey="results" disabled={!resultsReady}>Results</Dropdown.Item>
            <Dropdown.Item eventKey="semantics" disabled={!semanticsReady}>CLIF Semantics</Dropdown.Item>
            <Dropdown.Item eventKey="solversemantics" >Solver Specific Semantics</Dropdown.Item>
            <Dropdown.Item eventKey="saved_queries">Saved Queries</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* <Accordion defaultActiveKey="query" flush>
          <Accordion.Item eventKey="query">
            <Accordion.Header>Queries</Accordion.Header>
            <Accordion.Body></Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="construct">
            <Accordion.Header>Construct Query</Accordion.Header>
            <Accordion.Body></Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="results">
            <Accordion.Header>Results</Accordion.Header>
            <Accordion.Body></Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="semantics">
            <Accordion.Header>CLIF Semantics</Accordion.Header>
            <Accordion.Body></Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="solversemantics">
            <Accordion.Header>Solver Specific Semantics</Accordion.Header>
            <Accordion.Body></Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="saved_queries">
            <Accordion.Header>Saved Queries</Accordion.Header>
            <Accordion.Body></Accordion.Body>
          </Accordion.Item>
        </Accordion> */}

        <TabContent className="mt-2">
          {/* Main tab for sending the query */}
          <TabPane eventKey="query" title="Query">
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
              <Form.Group className="d-flex flex-column gap-2" controlId="query">
                <Form.Label className="m-0">Query</Form.Label>
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
          </TabPane>
          {/* New tab for constructing the query */}
          <TabPane eventKey="construct" title="Construct Query">
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
          </TabPane>
          {/* Tab for showing the results of the query */}
          <TabPane
            eventKey="results"
            title="Results"
            // disabled={!resultsReady}
          >
            {results.map((result, index) => (
              <QueryResult
                key={index}
                index={index}
                result={result}
                projectService={projectService}
                onVisualize={queryResult_onVisualize}
              />
            ))}
          </TabPane>
          <TabPane
            eventKey="semantics"
            title="CLIF Semantics"
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
          </TabPane>
          {/* Tab for syncing the concrete solver semantics */}
          <TabPane
            eventKey="solversemantics"
            title="Solver Specific Semantics"
          >
            <Container
              style={{ maxHeight: "800px", overflow: "auto" }}
              className="mt-2"
            >
              <Row>
                <Col className="d-flex flex-column gap-2 p-0">
                  <Dropdown>
                    <Dropdown.Toggle variant="primary" id="dropdown-basic" className="w-100">
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
          </TabPane>
          <TabPane eventKey="saved_queries" title="Saved Queries">
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
          </TabPane>
        </TabContent>
      </TabContainer>

      <div className="d-flex flex-column gap-2 mt-2">
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
      </div>
    </div>
  );
}
