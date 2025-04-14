import { ConfigurationInformation } from "../../Domain/ProductLineEngineering/Entities/ConfigurationInformation";
import { ProjectInformation } from "../../Domain/ProductLineEngineering/Entities/ProjectInformation";
import { PROJECTS_CLIENT } from "../../Infraestructure/AxiosConfig";

export default class ProjectPersistenceService {
  getProjectsByUser(user: string, successCallback: any, errorCallback: any) {
    try {
      PROJECTS_CLIENT.get("/getProjects").then((res) => {
        const { owned_projects, shared_projects } = res.data;
        if (!owned_projects && !shared_projects) {
          throw new Error("Invalid server response: Missing owned_projects or shared_projects");
        }
        successCallback({
          owned_projects: owned_projects,
          shared_projects: shared_projects});
      });
    } catch (error) {
      console.log("Something wrong in getProjectsByUser Service: " + error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  }

  getTemplateProjectsByUser(
    user: string,
    successCallback: any,
    errorCallback: any
  ) {
    try {
      PROJECTS_CLIENT.get("/getTemplateProjects").then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        if (responseAPISuccess.message?.includes("Error")) {
          throw new Error(JSON.stringify(res.data));
        }
        let records: ProjectInformation[] = [];
        records = Object.assign(records, responseAPISuccess.data["projects"]);
        successCallback(records);
      });
    } catch (error) {
      console.log(
        "Something wrong in getTemplateProjectsByUser Service: " + error
      );
    }
  }

  saveProject(
    user: string,
    projectInformation: ProjectInformation,
    successCallback: any,
    errorCallback: any
  ): void {
    try {
      PROJECTS_CLIENT.post("/saveProject", projectInformation).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        if (responseAPISuccess.message?.includes("Error")) {
          throw new Error(JSON.stringify(res.data));
        }
        if (successCallback) {
          projectInformation.id = responseAPISuccess.data["id"];
          successCallback(projectInformation);
        }
      });
    } catch (error) {
      console.log("Something wrong in saveProject Service: " + error);
    }
  }

  deleteProject(
    user: string,
    projectInformation: ProjectInformation,
    successCallback: any,
    errorCallback: any
  ): void {
    try {
      PROJECTS_CLIENT.delete("/deleteProject", {
        data: projectInformation,
      }).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        if (responseAPISuccess.message?.includes("Error")) {
          throw new Error(JSON.stringify(res.data));
        }
        if (successCallback) {
          projectInformation.id = responseAPISuccess.data["id"];
          successCallback(projectInformation);
        }
      });
    } catch (error) {
      console.log("Something wrong in deleteProject Service: " + error);
    }
  }

  openProject(
    user: string,
    projectId: string,
    successCallback: any,
    errorCallback: any
  ): void {
    try {
      PROJECTS_CLIENT.get("/getProject", {
        params: { project_id: projectId },
      }).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        if (responseAPISuccess.message?.includes("Error")) {
          throw new Error(JSON.stringify(res.data));
        }
        let record = responseAPISuccess.data["project"];
        successCallback(record);
      });
    } catch (error) {
      console.log("Something wrong in openProject Service: " + error);
    }
  }

  addConfiguration(
    user: string,
    projectInformation: ProjectInformation,
    configurationInformation: ConfigurationInformation,
    successCallback: any,
    errorCallback: any
  ): void {
    try {
      PROJECTS_CLIENT.post("/addConfiguration", configurationInformation, {
        params: { project_id: projectInformation.id },
      })
        .then((res) => {
          let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
          responseAPISuccess = Object.assign(responseAPISuccess, res.data);
          if (responseAPISuccess.message?.includes("Error")) {
            throw new Error(JSON.stringify(res.data));
          }
          if (successCallback) {
            successCallback(configurationInformation);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          if (errorCallback) {
            errorCallback(error);
          }
        });
    } catch (error) {
      console.log("Something wrong in addConfiguration Service: " + error);
    }
  }

  deleteConfiguration(
    user: string,
    projectInformation: ProjectInformation,
    configurationInformation: ConfigurationInformation,
    successCallback: any,
    errorCallback: any
  ): void {
    try {
      PROJECTS_CLIENT.delete("/deleteConfiguration", {
        params: {
          project_id: projectInformation.id,
          model_id: configurationInformation.id_feature_model,
          configuration_id: configurationInformation.id,
        },
      })
        .then((res) => {
          let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
          responseAPISuccess = Object.assign(responseAPISuccess, res.data);
          if (responseAPISuccess.message?.includes("Error")) {
            throw new Error(JSON.stringify(res.data));
          }
          if (successCallback) {
            successCallback(responseAPISuccess.data);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          if (errorCallback) {
            errorCallback(error);
          }
        });
    } catch (error) {
      console.log("Something wrong in deleteConfiguration Service: " + error);
    }
  }

  applyConfiguration(
    user: string,
    projectInformation: ProjectInformation,
    configurationInformation: ConfigurationInformation,
    successCallback: any,
    errorCallback: any
  ): void {
    try {
      PROJECTS_CLIENT.post("/applyConfiguration", configurationInformation, {
        params: { project_id: projectInformation.id },
      })
        .then((res) => {
          let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
          responseAPISuccess = Object.assign(responseAPISuccess, res.data);
          if (responseAPISuccess.message?.includes("Error")) {
            throw new Error(JSON.stringify(res.data));
          }
          if (successCallback) {
            successCallback(responseAPISuccess.data);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          if (errorCallback) {
            errorCallback(error);
          }
        });
    } catch (error) {
      console.log("Something wrong in applyConfiguration Service: " + error);
    }
  }

  getAllConfigurations(
    user: string,
    projectInformation: ProjectInformation,
    configurationInformation: ConfigurationInformation,
    successCallback: any,
    errorCallback: any
  ): void {
    try {
      let project_id = projectInformation.id;
      let model_id = configurationInformation.id_feature_model;

      PROJECTS_CLIENT.get("/getAllConfigurations", {
        params: { project_id, model_id },
      }).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        if (responseAPISuccess.message?.includes("Error")) {
          throw new Error(JSON.stringify(res.data));
        }
        let records: ConfigurationInformation[] = [];
        records = Object.assign(records, responseAPISuccess.data);
        successCallback(records);
      });
    } catch (error) {
      console.log("Something wrong in getAllConfigurations Service: " + error);
    }
  }
  // ADDED SHARE FUNCTIONS
  shareProject(
    projectInformation: ProjectInformation,
    toUserId: string,
    successCallback: any,
    errorCallback: any
  ): void {

    try {

      if (!projectInformation?.id || !toUserId) {
        console.error("Invalid project information or username.");
        if (errorCallback) {
          errorCallback("Invalid project information or username.");
        }
        return;
      }

      let project_id = projectInformation.id;
      let user_id = toUserId;

      PROJECTS_CLIENT.post("/shareProject", {
        project_id,
        user_id,
      }).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        if (responseAPISuccess.message?.includes("Error")) {
          throw new Error(JSON.stringify(res.data));
        }
        if (successCallback) {
          successCallback(responseAPISuccess.data);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        if (errorCallback) {
          errorCallback(error);
        }
      });

    } catch (error) {
      console.error("Something wrong in shareProject Service:", error);
      if (errorCallback) {
        errorCallback(error);
      }    }
  }
}

export class ResponseAPISuccess {
  transactionId?: string;
  message?: string;
  data?: JSON;
  constructor(transactionId?: string, message?: string, data?: JSON) {
    this.transactionId = transactionId;
    this.message = message;
    this.data = data;
  }
}

export class ResponseAPIError {
  transactionId?: string;
  message?: string;
  errorCode?: string;
  data?: JSON;
  constructor(
    transactionId?: string,
    message?: string,
    errorCode?: string,
    data?: JSON
  ) {
    this.transactionId = transactionId;
    this.message = message;
    this.errorCode = errorCode;
    this.data = data;
  }
}
