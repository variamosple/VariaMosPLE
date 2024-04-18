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

export function runQuery(
  projectService: ProjectService,
  translatorEndpoint: string,
  query: Query
) {
  // We must build the request body both from the query and the project
  // information.

  // First, get the project information.
  // get currently selected language
  const semantics = projectService.currentLanguage.semantics;
  const data = {
    rules: semantics,
    query: query,
    modelSelectedId: projectService.getTreeIdItemSelected(),
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
