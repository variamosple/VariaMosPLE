
import axios from "axios";
import ProjectService from "../../../Application/Project/ProjectService";
import * as alertify from "alertifyjs";
import { Query } from "../Entities/Query";

export function runQuery(
    projectService: ProjectService, translatorEndpoint: string, query: Query
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
        project: projectService.project
    }
    alertify.success('request sent ...');
    return axios.post(translatorEndpoint, {data})
        .then(response => {
            alertify.success('request successful ...');
            return response.data.data.content;
        })
        .catch(error => {
            alertify.error('something went wrong ...');
            console.error(error);
            return null;
        });
}