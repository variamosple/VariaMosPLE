import { useEffect, useState } from "react";


import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Spinner from "react-bootstrap/Spinner";

//Import the code to run the query
import { runQuery } from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import { Query } from "../../Domain/ProductLineEngineering/Entities/Query";
import ProjectService from "../../Application/Project/ProjectService";
import QueryResult from "./queryResult";

type QueryModalProps = {
  show: boolean;
  handleCloseCallback: () => void;
  projectService: ProjectService
}

export default function QueryModal(
  { show, handleCloseCallback, projectService }: QueryModalProps
) {
  const [key, setKey] = useState("query");
  const [translatorEndpoint, setTranslatorEndpoint] = useState("");
  const [query, setQuery] = useState("");
  const [queryInProgress, setQueryInProgress] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    localStorage.setItem("currentResults", JSON.stringify(results));
  },[results]);

  //Handle setting the value of the endpoint
  const handleSetTranslatorEndpoint = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTranslatorEndpoint(event.target.value);
  }

  //Handle setting the value of the query
  const handleSetQuery = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(event.target.value);
  }

  const populateResultsTab = (results) => {
    setResults((prevResults) => [...prevResults, results]);
  }

  //Handle submiting the query
  const handleSubmitQuery = async () => {
    setQueryInProgress(true);
    setResultsReady(false);
    console.log("Submit query", translatorEndpoint, query);
    const query_object = new Query(JSON.parse(query));
    const result = await runQuery(projectService, translatorEndpoint, query_object);
    console.log("Result", result);
    //Populate the results tab
    if(result){
      populateResultsTab(result);
      setResultsReady(true);
    }
    setQueryInProgress(false);
  }

  const clearResults = () => {
    setResults([]);
    setResultsReady(false);
    setKey("query");
  }

  const handleResetModelConfig = () => {
    projectService.resetModelConfig();
  }

  return (
    <>
      <Modal show={show} onHide={handleCloseCallback} size="lg">
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
            {/* Main tab for sending the query */}
            <Tab eventKey="query" title="Query">
              <Form>
                <Form.Group className="mb-3" controlId="translatorEndpoint">
                  <Form.Label>Translator Endpoint</Form.Label>
                  <Form.Control type="text" placeholder="Enter endpoint" value={translatorEndpoint} onChange={handleSetTranslatorEndpoint} />
                  <Form.Text className="text-muted">
                    Enter the adress of the endpoint to use for the queries.
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3" controlId="query">
                  <Form.Label>Query</Form.Label>
                  <Form.Control as="textarea" rows={5} value={query} onChange={handleSetQuery} />
                </Form.Group>
              </Form>
            </Tab>
            {/* Tab for showing the results of the query */}
            <Tab eventKey="results" title="Results" disabled={!resultsReady}>
              {results.map((result, index) => 
                <QueryResult 
                  key={index} 
                  index={index} 
                  result={result} 
                  projectService={projectService} 
                />
              )}
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCallback}>
            Close
          </Button>
          {
            key === "query" && 
            <Button variant="primary" onClick={handleSubmitQuery}>
              {queryInProgress && <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />}
              Submit Query
            </Button>
          }
          {
            key === "results" && 
            <Button variant="primary" onClick={clearResults}>
              Clear Query Results
            </Button>
          }
          <Button variant="primary" onClick={handleResetModelConfig}>
            Reset model configuration state
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}