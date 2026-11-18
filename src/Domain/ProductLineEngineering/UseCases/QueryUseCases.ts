import axios from "axios";
import ProjectService from "../../../Application/Project/ProjectService";
import * as alertify from "alertifyjs";
import { Query } from "../Entities/Query";
import { slugify } from "../../../Addons/Library/Utils/Utils";
import ProjectUseCases from "./ProjectUseCases";
import { Element } from "../Entities/Element";
import { Property } from "../Entities/Property";

export function syncSemantics(
  projectService: ProjectService,
  translatorEndpoint: string
) {
  return runQuery(
    projectService,
    translatorEndpoint,
    new Query(JSON.parse('{"solver": "minizinc","operation": "get_model"}'))
  );
}

export function syncConcreteSemantics(
  projectService: ProjectService,
  translatorEndpoint: string,
  lang: string
) {
  return runQuery(
    projectService,
    translatorEndpoint,
    new Query(JSON.parse(`{"solver": "${lang}","operation": "get_code"}`))
  );
}

// Rules of the language of the model that the query targets. The current
// language is only set when a model is clicked in the tree
// (ProjectService.loadExternalFunctions): before that click, or when it
// belongs to another model, the language is found from the model itself.
// Without rules, the query is not sent and the user is told why, instead of
// failing with a TypeError that shows nothing.
export function semanticsForModel(
  projectService: ProjectService,
  modelId: string
): string | null {
  const model = projectService.findModelById(projectService.project, modelId);
  if (!model) {
    alertify.error("Select a model in the project tree first.");
    return null;
  }
  const current = projectService.currentLanguage;
  if (current?.semantics && current.name === model.type) {
    return current.semantics;
  }
  const language = (projectService.languages || []).find(
    (candidate) =>
      (model.languageId && String(candidate.id) === String(model.languageId)) ||
      candidate.name === model.type
  );
  if (!language?.semantics) {
    alertify.error(
      `The language "${model.type}" of this model is not loaded or has no semantics.`
    );
    return null;
  }
  return language.semantics;
}

export function runQuery(
  projectService: ProjectService,
  translatorEndpoint: string,
  query: Query
) {
  // We must build the request body both from the query and the project
  // information.

  // First, get the project information.
  // get the language of the selected model
  const modelSelectedId = projectService.getTreeIdItemSelected();
  const semantics = semanticsForModel(projectService, modelSelectedId);
  if (!semantics) {
    return Promise.resolve(null);
  }
  const data = {
    rules: semantics,
    query: query,
    modelSelectedId: modelSelectedId,
    transactionId: projectService.generateId(),
    project: projectService.project,
    input: "vmos"
  };
  alertify.success("request sent ...");
  return axios
    .post(translatorEndpoint, { data })
    .then((response) => {
      alertify.success("request successful ...");
      return response.data.data.content;
    })
    .catch((error) => {
      alertify.error("something went wrong ...");
      console.error(error);
      return null;
    });
}

export function runQueryFromModel(
  projectService: ProjectService,
  translatorEndpoint: string,
  query: Query,
  modelSelectedId: string,
) {
  // We must build the request body both from the query and the project
  // information.

  // First, get the project information.
  // get the language of the model
  const semantics = semanticsForModel(projectService, modelSelectedId);
  if (!semantics) {
    return Promise.resolve(null);
  }
  const data = {
    rules: semantics,
    query: query,
    modelSelectedId: modelSelectedId,
    transactionId: projectService.generateId(),
    project: projectService.project,
    input: "vmos"
  };
  alertify.success("request sent ...");
  return axios
    .post(translatorEndpoint, { data })
    .then((response) => {
      alertify.success("request successful ...");
      return response.data.data.content;
    })
    .catch((error) => {
      alertify.error("something went wrong ...");
      console.error(error);
      return null;
    });
}

//This function sanitizes the concrete semantics by replacing the id
//of the elements with a sluggified version of their name for readability
export function sanitizeConcreteSemantics(
  concreteSemantics: string,
  projectService: ProjectService
) {
  //Regex that matches the pattern UUID_ followed by a uuid version 4
  //with the hyphens replaced with underscores
  //Example: UUID_12345678_1234_1234_1234_123456789abc
  const uuidRegex =
    /UUID_[a-f0-9]{8}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{4}_[a-f0-9]{12}/g;
  //for each match, replace it with a sluggified version of the name
  return concreteSemantics.replace(uuidRegex, (match) => {
    const id = match.substring(match.indexOf("_") + 1).replaceAll("_", "-");
    console.log(id);
    //find the element in the model
    const element: Element = projectService.findModelElementByIdInProject(id);
    //if the element doesn't exist, check if it exists as a property
    if (!element) {
      const [propElem, property] = projectService.findModelElementPropertyByIdInProject(id);
      if (propElem && property) {
        return `${slugify((propElem as Element).name)}_${slugify((property as Property).name)}`;
      }
    } else {
      return slugify(element.name);
    }
  });
}

//This function extracts all the element types from the concrete semantics
//and returns them as a list of strings
export function hasSemantics(projectService: ProjectService) {
  if(!projectService.currentLanguage) return false;
  return Object.keys(projectService.currentLanguage.semantics).length !== 0 ;
}

export function getCurrentConstraints(projectService: ProjectService){
  if(projectService.currentLanguage){
    const modelSelectedId = projectService.getTreeIdItemSelected();
    const activeModel = projectService.findModelById(projectService.getProject(), modelSelectedId);
    if(activeModel){
      return activeModel.constraints;
    } else {
      console.warn("No model selected");
    }
  } else {
    console.warn("No currently active language");
  }
  return "";
}

export function setModelConstraints(projectService: ProjectService, constraints: string){
  if(projectService.currentLanguage){
    const modelSelectedId = projectService.getTreeIdItemSelected();
    const activeModel = projectService.findModelById(projectService.getProject(),modelSelectedId);
    if(activeModel){
      activeModel.constraints = constraints;
    } else {
      console.warn("No model selected")
    }
  } else {
    console.warn("No currently active language")
  }
}
