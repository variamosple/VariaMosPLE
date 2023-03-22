import { useState } from "react";

import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import Pagination from "react-bootstrap/Pagination";

import ProjectService from "../../Application/Project/ProjectService";

import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";

type QueryResultProps = {
  index: number;
  result: object;
  projectService: ProjectService;

}

export default function QueryResult(
  { index, result, projectService }: QueryResultProps
) {

  const [paginationSelection, setPaginationSelection] = useState(0);

  const handleVisualize = () => {
    //Save the current project state so that we can restore it later
    console.info("Visualizing solution ", index, " of query result", result);
    if(! Array.isArray(result)){
      projectService.updateProject(
        result as Project, projectService.getTreeIdItemSelected()
      );
    }else{
      projectService.updateProject(
        result[paginationSelection] as Project, projectService.getTreeIdItemSelected()
      );
    }
  }

  return (
    <>
      <ListGroup horizontal className="flex d-flex my-2">
        <ListGroup.Item className="flex-fill d-flex align-items-center justify-content-center">Solution {index}</ListGroup.Item>
        { Array.isArray(result) &&
          <ListGroup.Item 
            className="flex-fill d-flex align-items-center justify-content-center"
          >
            <Pagination>
              {result.map((_, idx) => 
                <Pagination.Item 
                  key={idx} 
                  active={idx === paginationSelection}
                  onClick={() => setPaginationSelection(idx)}
                >
                  {idx + 1}
                </Pagination.Item>
              )}
            </Pagination>
          </ListGroup.Item>
        }
        { typeof result === "object" ?
          <ListGroup.Item 
            className="flex-fill d-flex align-items-center justify-content-center"
          >
            <Button size="sm" onClick={handleVisualize}>Visualize</Button>
          </ListGroup.Item> :
          typeof result === "boolean" &&
          <ListGroup.Item
            className="flex-fill d-flex align-items-center justify-content-center"
          >
            {result ? "SAT" : "UNSAT"}
          </ListGroup.Item> 
        }
      </ListGroup>
    </>
  )
}