import { useState, useMemo } from "react";

import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import Pagination from "react-bootstrap/Pagination";

import ProjectService from "../../Application/Project/ProjectService";

import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";
import mx from "../MxGEditor/mxgraph";
import MxgraphUtils from "../../Infraestructure/Mxgraph/MxgraphUtils";

type QueryResultProps = {
  index: number;
  result: object | Array<any> | boolean;
  projectService: ProjectService;
  onVisualize:any
};

function isIterationResult(result: Array<any> | object | boolean): boolean {
  return (
    Array.isArray(result) &&
    result.some((elem) => Array.isArray(elem) && elem.length === 2)
  );
}

function hasFailedIterationResult(
  result: Array<any> | object | boolean
): boolean {
  return (
    Array.isArray(result) &&
    result.some((elem) => Array.isArray(elem) && elem.length === 2 && !elem[1])
  );
}

export default function QueryResult({
  index,
  result,
  projectService,
  onVisualize
}: QueryResultProps) {
  const [paginationSelection, setPaginationSelection] = useState(0);

  const visibleResults = useMemo(() => {
    if (Array.isArray(result) && isIterationResult(result)) {
      // We know then that these are iteration results
      // We will now strip the first part of the strings in the first element
      return (
        result
          .map((elem) => [
            elem[0].replace("UUID_", "").replaceAll("_", "-"),
            elem[1],
          ])
          // Let's filter only those that are false
          .filter((elem) => !elem[1])
      );
    } else {
      return result;
    }
  }, [result]);

  const handleIterationQueryVisualization = () => {
    //we'll use the ids in the first element of the array to create overlays
    //for the elements in the graph.
    const graph = projectService.getGraph();
    (visibleResults as Array<Array<string | boolean>>).forEach(
      ([elem_id, _]) => {
        // const cell = MxgraphUtils.findVerticeById(graph, elem_id, null);
        const cell = graph.getModel().filterDescendants((cell) => {
          if (cell.value) {
            const uid = cell.value.getAttribute("uid");
            if (uid === elem_id) {
              return true;
            }
          }
          return false;
        })[0];

        //const cell = graph.getModel().getCell(elem_id);
        if (cell) {
          const overlayFrame = new mx.mxCellOverlay(
            new mx.mxImage(
              "images/models/Eo_circle_red_white_no-entry.svg",
              24,
              24
            ),
            "Failed Query"
          );
          overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
          overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
          overlayFrame.offset = new mx.mxPoint(0, 0);

          overlayFrame.addListener(mx.mxEvent.CLICK, function (_sender, _evt) {
            graph.removeCellOverlay(cell, overlayFrame);
          });

          graph.addCellOverlay(cell, overlayFrame);
          graph.refresh();
        }
      }
    );
  };

  const handleVisualize = () => {
    //Save the current project state so that we can restore it later
    console.info("Visualizing solution ", index, " of query result", result);
    if (!Array.isArray(result)) {
      projectService.updateSelection(
        result as Project,
        projectService.getTreeIdItemSelected()
      );
      // projectService.updateProject(
      //   result as Project, projectService.getTreeIdItemSelected()
      // );
      // projectService.lookupAndReselectModel();
      projectService.getGraph().refresh();
    } else {
      if (isIterationResult(result)) {
        handleIterationQueryVisualization();
      } else {
        projectService.updateSelection(
          result[paginationSelection] as Project,
          projectService.getTreeIdItemSelected()
        );
        // projectService.updateProject(
        //   result as Project, projectService.getTreeIdItemSelected()
        // );
        // projectService.lookupAndReselectModel();
        projectService.getGraph().refresh();
      }
    }
    if (onVisualize) {
      onVisualize();
    }
  };

  return (
    <>
      <ListGroup horizontal className="flex d-flex my-2">
        <ListGroup.Item className="flex-fill d-flex align-items-center justify-content-center">
          Solution {index}
        </ListGroup.Item>
        {Array.isArray(visibleResults) && (
          <ListGroup.Item className="flex-fill d-flex align-items-center justify-content-center" style={{ overflow: "hidden" }}>
            {visibleResults.length > 0 && !isIterationResult(visibleResults) ? (
              <Pagination style={{ overflow: "auto" }}>
                {visibleResults.map((_, idx) => (
                  <Pagination.Item
                    key={idx}
                    active={idx === paginationSelection}
                    onClick={() => setPaginationSelection(idx)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            ) : hasFailedIterationResult(visibleResults) ? (
              `${visibleResults.length} elements failed query`
            ) : (
              "No element failed query"
            )}
          </ListGroup.Item>
        )}
        {(isIterationResult(result) &&
          hasFailedIterationResult(result as Array<any>)) ||
        (typeof result === "object" && !isIterationResult(result)) ? (
          <ListGroup.Item className="flex-fill d-flex align-items-center justify-content-center">
            <Button size="sm" onClick={handleVisualize}>
              Visualize
            </Button>
          </ListGroup.Item>
        ) : (
          typeof result === "boolean" && (
            <ListGroup.Item className="flex-fill d-flex align-items-center justify-content-center">
              {result ? "SAT" : "UNSAT"}
            </ListGroup.Item>
          )
        )}
      </ListGroup>
    </>
  );
}
