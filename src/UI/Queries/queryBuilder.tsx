import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

enum QueryType {
  SAT = "sat",
  SOLVE_ONCE = "solve",
  SOLVE_N_TIMES = "nsolve",
  OPTIMIZE = "optimize",
  ITERATIVE_CHECK = "iterative_check",
}

enum Solver {
  SWI = "swi",
  MINIZINC = "minizinc",
  Z3 = "z3",
}

enum ModelObject {
  ELEMENT = "element",
  RELATIONSHIP = "relationship",
  RELATIONSHIP_ELEMENT = "relationship_element",
  REIFIED = "reified",
}

enum RelationshipElement {
  SOURCE = "source",
  TARGET = "target",
}

interface ModelSelectorSpec {
  model_object: ModelObject;
  relationship_element?: RelationshipElement;
  object_type: string[];
  with_value?: number;
}

type IterationSpec = ModelSelectorSpec[];

interface QueryBuilderProps {
  projectService: any;
}

export default function QueryBuilder({ projectService }: QueryBuilderProps) {
  const [queryType, setQueryType] = useState<QueryType>(QueryType.SAT);
  const [selectedSolver, setSelectedSolver] = useState<Solver>(Solver.SWI);
  const [targetVariable, setTargetVariable] = useState<string>("");
  const [numberOfSolutions, setNumberOfSolutions] = useState<number>(1);
  const [addingNewIteration, setAddingNewIteration] = useState<boolean>(false);
  const [iterationSpec, setIterationSpec] = useState<IterationSpec>([]);

  const onQueryTypeChange = ({ target: { value } }) => {
    setQueryType(value);
    if (value !== QueryType.OPTIMIZE) {
      setTargetVariable("");
    } else if (value !== QueryType.SOLVE_N_TIMES) {
      setNumberOfSolutions(1);
    }
  };

  const onSolverChange = ({ target: { value } }) => {
    setSelectedSolver(value);
  };

  const onTargetVariableChange = ({ target: { value } }) => {
    setTargetVariable(value);
  };

  const onNumberOfSolutionsChange = ({ target: { value } }) => {
    setNumberOfSolutions(value);
  };

  function handleAddNewIteration(): void {
    setAddingNewIteration(true);
  }

  return (
    <Form className="my-2">
      <Form.Group>
        <Form.Label>Query Type</Form.Label>
        <div>
          <Form.Check
            type="radio"
            inline
            label="Sat"
            name="queryType"
            checked={queryType === QueryType.SAT}
            onChange={onQueryTypeChange}
            value={QueryType.SAT}
          />
          <Form.Check
            type="radio"
            inline
            label="Solve Once"
            name="queryType"
            checked={queryType === QueryType.SOLVE_ONCE}
            onChange={onQueryTypeChange}
            value={QueryType.SOLVE_ONCE}
          />
          <Form.Check
            type="radio"
            inline
            label="Solve N Times"
            name="queryType"
            checked={queryType === QueryType.SOLVE_N_TIMES}
            onChange={onQueryTypeChange}
            value={QueryType.SOLVE_N_TIMES}
          />
          <Form.Check
            type="radio"
            inline
            label="Optimize"
            name="queryType"
            checked={queryType === QueryType.OPTIMIZE}
            onChange={onQueryTypeChange}
            value={QueryType.OPTIMIZE}
          />
          <Form.Check
            type="radio"
            inline
            label="Iterative Check"
            name="queryType"
            checked={queryType === QueryType.ITERATIVE_CHECK}
            onChange={onQueryTypeChange}
            value={QueryType.ITERATIVE_CHECK}
          />
        </div>
      </Form.Group>
      <Form.Group className="my-2">
        <Form.Label>Solver</Form.Label>
        <div>
          <Form.Check
            type="radio"
            inline
            label="SWI-Prolog CLP(FD)"
            name="selectedSolver"
            checked={selectedSolver === Solver.SWI}
            onChange={onSolverChange}
            value={Solver.SWI}
          />
          <Form.Check
            type="radio"
            inline
            label="Minizinc (Gecode)"
            name="selectedSolver"
            checked={selectedSolver === Solver.MINIZINC}
            onChange={onSolverChange}
            value={Solver.MINIZINC}
          />
          <Form.Check
            type="radio"
            inline
            label="Microsoft Z3"
            name="selectedSolver"
            checked={selectedSolver === Solver.Z3}
            onChange={onSolverChange}
            value={Solver.Z3}
          />
        </div>
      </Form.Group>
      {/* Show this part of the form when it's an optimization query. */}
      {queryType === QueryType.OPTIMIZE && (
        <Form.Group className="my-2">
          <Form.Label>Optimization Target</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter target variable"
            value={targetVariable}
            onChange={onTargetVariableChange}
          />
        </Form.Group>
      )}
      {/* Show this part of the form when we need to solve N times. */}
      {queryType === QueryType.SOLVE_N_TIMES && (
        <Form.Group className="my-2">
          <Form.Label>Number of Solutions</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter number of solutions"
            value={numberOfSolutions}
            onChange={onNumberOfSolutionsChange}
          />
        </Form.Group>
      )}
      {/* This part of the form concerns the construction of the iterative query */}
      {queryType === QueryType.ITERATIVE_CHECK && (
        <Form.Group className="my-2">
          {!addingNewIteration && <div>
            <Button onClick={handleAddNewIteration}>
              Add new iteration rule
            </Button>
          </div>
          }
          {addingNewIteration && (
            <>
              <Form.Label>Target Variable</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter target variable"
                value={targetVariable}
                onChange={onTargetVariableChange}
              />
            </>
          )}
        </Form.Group>
      )}
    </Form>
  );
}
