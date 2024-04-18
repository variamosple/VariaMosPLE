import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Accordion from "react-bootstrap/Accordion";
import ProjectService from "../../Application/Project/ProjectService";
import { Semantics } from "../../core/components/LanguageManager/index.types";
import * as alertify from "alertifyjs";

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
  RELATIONSHIPELEMENT = "relationship_element",
  REIFIED = "reified",
}

enum RelationshipElement {
  SOURCE = "source",
  TARGET = "target",
}

enum OptimizationDirection {
  MIN = "min",
  MAX = "max",
}

interface ModelSelectorSpec {
  model_object: ModelObject;
  relationship_element?: RelationshipElement;
  object_type: string[];
  with_value?: number;
}

type IterationSpec = ModelSelectorSpec[];

interface QueryBuilderProps {
  projectService: ProjectService;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setKey: React.Dispatch<React.SetStateAction<string>>;
}

export default function QueryBuilder({
  projectService,
  setQuery,
  setKey,
}: QueryBuilderProps) {
  const [queryType, setQueryType] = useState<QueryType>(QueryType.SAT);
  const [selectedSolver, setSelectedSolver] = useState<Solver>(Solver.SWI);
  const [targetVariable, setTargetVariable] = useState<string>("");
  const [numberOfSolutions, setNumberOfSolutions] = useState<number>(1);
  const [addingNewIteration, setAddingNewIteration] = useState<boolean>(false);
  const [optimizationDirection, setOptimizationDirection] =
    useState<string>("min");
  const [newIterationModelObject, setNewIterationModelObject] =
    useState<ModelObject>(ModelObject.ELEMENT);
  // const [isRelationshipElement, setIsRelationshipElement] =
  //   useState<boolean>(false);
  const [newIterationRelationshipElement, setNewIterationRelationshipElement] =
    useState<RelationshipElement>(RelationshipElement.SOURCE);
  const [withValue, setWithValue] = useState<number>(0);
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

  const onOptimizationDirectionChange = ({ target: { value } }) => {
    setOptimizationDirection(value);
  };

  const onTargetVariableChange = ({ target: { value } }) => {
    setTargetVariable(value);
  };

  const onNumberOfSolutionsChange = ({ target: { value } }) => {
    setNumberOfSolutions(value);
  };

  const onIterationModelObjectChange = ({ target: { value } }) => {
    setNewIterationModelObject(value);
    setSelectedOptions([]);
  };

  const onIterationRelationshipElementChange = ({ target: { value } }) => {
    setNewIterationRelationshipElement(value);
  };

  // useEffect(() => {
  //   if (newIterationModelObject === ModelObject.RELATIONSHIPELEMENT) {
  //     setIsRelationshipElement(true);
  //   } else {
  //     setIsRelationshipElement(false);
  //   }
  // }, [newIterationModelObject]);

  function handleAddNewIteration(): void {
    setAddingNewIteration(true);
  }

  const handleAddNewIterationOk = () => {
    if (selectedOptions.length === 0) {
      alertify.error("Please select at least one option");
      return;
    } else {
      setAddingNewIteration(false);
      const newSpec: ModelSelectorSpec = {
        model_object: newIterationModelObject,
        object_type: selectedOptions.map((idx) => {
          if (newIterationModelObject === ModelObject.ELEMENT) {
            return availableElementTypes[idx].label;
          } else if (newIterationModelObject === ModelObject.RELATIONSHIP) {
            return availableRelationshipTypes[idx].label;
          } else {
            return availableReifiedRelationTypes[idx].label;
          }
        }),
        with_value: withValue,
      };
      if (newIterationModelObject === ModelObject.RELATIONSHIPELEMENT) {
        newSpec.relationship_element = newIterationRelationshipElement;
      }
      console.log(newSpec);
      setIterationSpec([...iterationSpec, newSpec]);
      setSelectedOptions([]);
    }
  };

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionChange = (event) => {
    const optionId = parseInt(event.target.value);
    const isChecked = event.target.checked;

    if (isChecked) {
      setSelectedOptions([...selectedOptions, optionId]);
    } else {
      setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
    }
  };

  const semantics = projectService.currentLanguage
    .semantics as unknown as Semantics;
  const availableElementTypes = semantics.elementTypes.map((key, idx) => ({
    id: idx,
    label: key,
  }));
  const availableRelationshipTypes = Object.keys({
    ...semantics.relationTranslationRules,
    ...semantics.typingRelationTranslationRules,
  }).map((key, idx) => ({ id: idx, label: key }));
  const availableReifiedRelationTypes = Object.entries(
    semantics.relationReificationTranslationRules
  )
    .map(([_, rule]) => Object.keys(rule.constraint))
    .flat()
    .map((key, idx) => ({ id: idx, label: key }));
  // const availableElementTypes = Object.keys(
  //   // I am forced to type this like this because the type
  //   // definitions are wrong
  //   (
  //     projectService.currentLanguage.abstractSyntax as unknown as {
  //       elements: object;
  //       restrictions: object;
  //       relationships: object;
  //     }
  //   ).elements
  // ).map((key, idx) => ({ id: idx, label: key }));

  const onWithValueChange = ({ target: { value } }) => {
    setWithValue(value);
  };

  const handleRemoveIterationSpec = (idx) => {
    setIterationSpec(iterationSpec.filter((_, i) => i !== idx));
  };

  const handleSetQuery = () => {
    const query = {
      solver: selectedSolver,
      operation: queryType,
    };
    if (queryType === QueryType.OPTIMIZE) {
      query["optimization_target"] = targetVariable;
      query["optimization_direction"] = optimizationDirection;
    }
    if (queryType === QueryType.SOLVE_N_TIMES) {
      query["operation_n"] = numberOfSolutions;
    }
    if (queryType === QueryType.ITERATIVE_CHECK) {
      query["operation"] = QueryType.SAT;
      query["iterate_over"] = iterationSpec;
    }
    console.log(query);
    setQuery(JSON.stringify(query, null, 2));
    setKey("query");
  };

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
        <>
          <Form.Group className="my-2">
            <Form.Label>Minimize or Maximize?</Form.Label>
            <div>
              <Form.Check
                type="radio"
                inline
                label={"Minimize"}
                name="optimizationDirection"
                value={OptimizationDirection.MIN}
                checked={
                  optimizationDirection === OptimizationDirection.MIN
                }
                onChange={onOptimizationDirectionChange}
              />
              <Form.Check
                type="radio"
                inline
                label={"Maximize"}
                name="optimizationDirection"
                value={OptimizationDirection.MAX}
                checked={
                  optimizationDirection === OptimizationDirection.MAX
                }
                onChange={onOptimizationDirectionChange}
              />
            </div>
          </Form.Group>
          <Form.Group className="my-2">
            <Form.Label>Optimization Target</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter target variable"
              value={targetVariable}
              onChange={onTargetVariableChange}
            />
          </Form.Group>
        </>
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
          <Form.Label>Iteration Specification</Form.Label>
          {iterationSpec.length > 0 && (
            <Accordion>
              {iterationSpec.map((spec, idx) => (
                <Accordion.Item key={idx} eventKey={idx.toString()}>
                  <Accordion.Header>Iteration Rule {idx + 1}</Accordion.Header>
                  <Accordion.Body>
                    <div>
                      <p>
                        Iterating over{" "}
                        {spec.model_object === ModelObject.ELEMENT
                          ? "Elements"
                          : spec.model_object === ModelObject.RELATIONSHIP
                          ? "Relationships"
                          : spec.model_object ===
                            ModelObject.RELATIONSHIPELEMENT
                          ? "Relationship Elements"
                          : "Reified relations"}
                        {spec.model_object ===
                          ModelObject.RELATIONSHIPELEMENT &&
                          `( ${spec.relationship_element} )`}
                      </p>
                      <p>With value: {spec.with_value}</p>
                      <p>Object types: {spec.object_type.join(", ")}</p>
                    </div>
                    <Button onClick={() => handleRemoveIterationSpec(idx)}>
                      Remove
                    </Button>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
          {!addingNewIteration && (
            <div>
              <Button onClick={handleAddNewIteration}>
                Add new iteration rule
              </Button>
            </div>
          )}
          {/* This part will exist if we are adding a new iteration specification */}
          {addingNewIteration && (
            <>
              <div><Form.Label>What type of element will you iterate over?</Form.Label></div>
              <div>
                <Form.Check
                  type="radio"
                  inline
                  label={"Element"}
                  name="modelObject"
                  value={ModelObject.ELEMENT}
                  checked={newIterationModelObject === ModelObject.ELEMENT}
                  onChange={onIterationModelObjectChange}
                />
                <Form.Check
                  type="radio"
                  inline
                  label={"Relationship"}
                  name="modelObject"
                  value={ModelObject.RELATIONSHIP}
                  checked={newIterationModelObject === ModelObject.RELATIONSHIP}
                  onChange={onIterationModelObjectChange}
                />
                <Form.Check
                  type="radio"
                  inline
                  label={"Relationship Element"}
                  name="modelObject"
                  value={ModelObject.RELATIONSHIPELEMENT}
                  checked={
                    newIterationModelObject === ModelObject.RELATIONSHIPELEMENT
                  }
                  onChange={onIterationModelObjectChange}
                />
                <Form.Check
                  type="radio"
                  inline
                  label={"Reified Relation"}
                  name="modelObject"
                  value={ModelObject.REIFIED}
                  checked={newIterationModelObject === ModelObject.REIFIED}
                  onChange={onIterationModelObjectChange}
                />
              </div>
              {newIterationModelObject === ModelObject.RELATIONSHIPELEMENT && (
                <>
                  <Form.Label>Source or Target?</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      inline
                      label={"Source"}
                      name="modelObject"
                      value={RelationshipElement.SOURCE}
                      checked={
                        newIterationRelationshipElement ===
                        RelationshipElement.SOURCE
                      }
                      onChange={onIterationRelationshipElementChange}
                    />
                    <Form.Check
                      type="radio"
                      inline
                      label={"Target"}
                      name="modelObject"
                      value={RelationshipElement.TARGET}
                      checked={
                        newIterationRelationshipElement ===
                        RelationshipElement.TARGET
                      }
                      onChange={onIterationRelationshipElementChange}
                    />
                  </div>
                </>
              )}
              {/* Based on https://stackoverflow.com/a/76428105 */}
              <div className={`dropdown ${isOpen ? "show" : ""} my-2`}>
                <button
                  style={{ width: "20%" }}
                  className="btn btn-secondary dropdown-toggle"
                  type="button"
                  id="multiSelectDropdown"
                  onClick={toggleDropdown}
                >
                  Select Options
                </button>
                <div
                  style={{ width: "20%" }}
                  className={`dropdown-menu ${isOpen ? "show" : ""}`}
                  aria-labelledby="multiSelectDropdown"
                >
                  {(newIterationModelObject === ModelObject.ELEMENT
                    ? availableElementTypes
                    : newIterationModelObject === ModelObject.RELATIONSHIP ||
                      newIterationModelObject ===
                        ModelObject.RELATIONSHIPELEMENT
                    ? availableRelationshipTypes
                    : availableReifiedRelationTypes
                  ).map((option) => (
                    <Form.Check
                      style={{ marginLeft: "10%" }}
                      key={option.id}
                      type="checkbox"
                      id={`option_${option.id}`}
                      label={option.label}
                      checked={selectedOptions.includes(option.id)}
                      onChange={handleOptionChange}
                      value={option.id}
                    />
                  ))}
                </div>
                {JSON.stringify(selectedOptions)}
              </div>
              <div>
                <Form.Label>
                  What value should be assigned to the Variables associated with
                  the selected elements?
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter target variable value"
                  value={withValue}
                  onChange={onWithValueChange}
                />
              </div>
              <div className="my-2">
                <Button onClick={handleAddNewIterationOk}>
                  Add Iteration Rule
                </Button>
              </div>
            </>
          )}
        </Form.Group>
      )}
      <Button onClick={handleSetQuery}>Generate Query</Button>
    </Form>
  );
}
