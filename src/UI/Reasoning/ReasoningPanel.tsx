import { Button, Col, Container, Dropdown, Nav, Row, Spinner, TabContainer, TabContent, TabPane } from "react-bootstrap";
import { useState } from "react";
import QueryWriter from "./QueryWriter";
import QueryBuilder from "./QueryBuilder";
import QueryResults from "./QueryResults";
import QueryNavbar from "./QueryNavbar";
import "./ReasoningPanel.css";
import { Query } from "../../Domain/ProductLineEngineering/Entities/Query";
import { runQuery, sanitizeConcreteSemantics, syncConcreteSemantics, syncSemantics } from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import QueryLoaderModal from "./QueryLoaderModal";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";


function ReasoningPanel({ projectService }): JSX.Element {

  const [queryMode, setQueryMode] = useState("write");
  const [query, setQuery] = useState("");
  const [queryName, setQueryName] = useState("");
  const [queryInProgress, setQueryInProgress] = useState(false);
  const [results, setResults] = useState([]);
  const translatorEndpoint = "https://app.variamos.com/semantic_translator";
  const [savedQueries, setSavedQueries] = useState({});
  const [showLoadQuery, setShowLoadQuery] = useState(false);

  const [semantics, setSemantics] = useState("");
  const [selectedSolver, setSelectedSolver] = useState("swi");
  const [solverSemantics, setSolverSemantics] = useState("");
  const [semanticsInProgress, setSemanticsInProgress] = useState(false);

  const handleSaveQuery = () => {
    if (!queryName.trim()) {
      alert("Please enter a query name");
      return;
    }
    try {
      const parsedQuery = JSON.parse(query);
      setSavedQueries((prevQueries) => ({
        ...prevQueries,
        [queryName]: parsedQuery,
      }));
    } catch (error) {
      alert("Invalid JSON query: " + (error as Error).message);
    }
  };

  const handleLoadQuery = () => {
    setShowLoadQuery(true);
  };

  const handleSubmitQuery = async () => {
    setQueryInProgress(true);
    try {
      const query_object = new Query(JSON.parse(query));
      const result = await runQuery(
        projectService,
        translatorEndpoint,
        query_object
      );
      //Populate the results tab
      if (
        result ||
        (["sat", "solve", "nsolve"].includes(query_object.operation) &&
          result === false)
      ) {
        setResults((prevResults) => [...prevResults, result]);
      }
    } catch (error) {
      console.error("Error running query:", error);
    } finally {
      setQueryInProgress(false);
    }
  };

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

  const handleSyncSemantics = async () => {
    setSemanticsInProgress(true);
    console.log("Syncing Semantics for the model");
    const result = await syncSemantics(projectService, translatorEndpoint);
    console.log("Result,", result);
    if (result) {
      setSemantics(result);
    }
    setSemanticsInProgress(false);
  };

  return (
    <div id="reasoning-panel">

      <QueryLoaderModal 
        show={showLoadQuery}
        savedQueries={savedQueries}
        setQuery={setQuery}
        onHide={() => setShowLoadQuery(false)}
      />

      <TabContainer defaultActiveKey="query">
        
        <Nav justify variant="tabs">
          <Nav.Item>
            <Nav.Link eventKey="query">Query</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="results">Results</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="semantics">Semantics</Nav.Link>
          </Nav.Item>
        </Nav>
        
        <TabContent>
          <TabPane eventKey="query">
            <QueryNavbar 
              setQueryMode={setQueryMode} 
              setQueryName={setQueryName} 
              queryName={queryName}
              handleSaveQuery={handleSaveQuery} 
              handleLoadQuery={handleLoadQuery} 
            />
            {queryMode === "write" && <QueryWriter 
              query={query} 
              setQuery={setQuery} 
            />}
            {queryMode === "build" && <QueryBuilder 
              projectService={projectService} 
              setQuery={setQuery}
            />}
            <Button id="submit-query-btn" variant="primary" onClick={handleSubmitQuery} disabled={queryInProgress}>
              {queryInProgress && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />}
              {queryInProgress ? " Submitting..." : "Submit Query"}
            </Button>
          </TabPane>

          <TabPane eventKey="results">
            <QueryResults projectService={projectService} results={results} onVisualize={() => {}} />
          </TabPane>
          
          <TabPane eventKey="semantics">
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
            <div>
              CLIF semantics
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
            </div>
            <div>
              Solver Specific Semantics
              <Container
                style={{ maxHeight: "800px", overflow: "auto" }}
                className="mt-2"
              >
                <Row>
                  <Col className="d-flex flex-column gap-2 p-0">
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="primary"
                        id="dropdown-basic"
                        className="w-100"
                      >
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
            </div>
          </TabPane>
        </TabContent>
      </TabContainer>
    </div>
  );
}

export default ReasoningPanel;