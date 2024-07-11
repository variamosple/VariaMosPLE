import axios, { Method } from "axios";
import { Config } from "../../Config";
import { ProjectInformation } from "../../Domain/ProductLineEngineering/Entities/ProjectInformation";
import { Project } from "../../Domain/ProductLineEngineering/Entities/Project";
import { json } from "react-router-dom";
import { ConfigurationInformation } from "../../Domain/ProductLineEngineering/Entities/ConfigurationInformation";

export default class ProjectPersistenceService { 
  apiVariamos = axios.create({
    baseURL: Config.SERVICES.urlBackEndProjectPersistence,
  });

  getTokenByUser(user:string, successCallback:any, errorCallback: any){
    try {
      let data={user_id: user}
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/token",
        method: "POST" as Method, 
        data: data
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        let token=responseAPISuccess.data["access_token"];
        successCallback(token);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }   

  getProjectsByUser(user:string, successCallback:any, errorCallback: any){
    try {
      let data={user_id: user}
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/token",
        method: "POST" as Method, 
        data: data
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        let token=responseAPISuccess.data["access_token"];
        this.getProjectsByToken(token, successCallback, errorCallback);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }   

  getProjectsByToken(token:string, successCallback:any, errorCallback: any) {
    try { 
      let me=this;
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/getProjects",
        method: "GET" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        let records: ProjectInformation[] = []; 
        records = Object.assign(records, responseAPISuccess.data["projects"]);
        successCallback(records);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }    

  getTemplateProjectsByUser(user:string, successCallback:any, errorCallback: any){
    try {
      let data={user_id: user}
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/token",
        method: "POST" as Method, 
        data: data
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        let token=responseAPISuccess.data["access_token"];
        this.getTemplateProjectsByToken(token, successCallback, errorCallback);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }   

  getTemplateProjectsByToken(token:string, successCallback:any, errorCallback: any) {
    try { 
      let me=this;
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/getTemplateProjects",
        method: "GET" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        let records: ProjectInformation[] = []; 
        records = Object.assign(records, responseAPISuccess.data["projects"]);
        successCallback(records);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }  

  saveProject(user:string, projectInformation:ProjectInformation, successCallback:any, errorCallback: any): void {
    let me=this; 
    let success=(token)=>{
      me.saveProjectByToken(token, projectInformation,  successCallback, errorCallback);
    }
    this.getTokenByUser(user,success, errorCallback );
  }

  saveProjectByToken(token:string,  projectInformation:ProjectInformation,  successCallback:any, errorCallback: any): void {
    try { 
      let me=this;
      let data=projectInformation;
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/saveProject",
        method: "POST" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: data
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        if(successCallback){
          projectInformation.id=responseAPISuccess.data["id"];
          successCallback(projectInformation);
        }
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }
 
  deleteProject(user:string, projectInformation:ProjectInformation, successCallback:any, errorCallback: any): void {
    let me=this; 
    let success=(token)=>{
      me.deleteProjectByToken(token, projectInformation,  successCallback, errorCallback);
    }
    this.getTokenByUser(user,success, errorCallback );
  }

  deleteProjectByToken(token:string,  projectInformation:ProjectInformation,  successCallback:any, errorCallback: any): void {
    try { 
      let me=this;
      let data=projectInformation;
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/deleteProject",
        method: "DELETE" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: data
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        if(successCallback){
          projectInformation.id=responseAPISuccess.data["id"];
          successCallback(projectInformation);
        }
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  } 

  openProject(user:string, projectId:string, successCallback:any, errorCallback: any): void {
    let me=this; 
    let success=(token)=>{
      me.openProjectByToken(token, projectId,  successCallback, errorCallback);
    }
    this.getTokenByUser(user,success, errorCallback );
  }

  openProjectByToken(token:string,  projectId:string,  successCallback:any, errorCallback: any): void {
    try { 
      let me=this;
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/getProject?project_id=" + projectId,
        method: "GET" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        let record=responseAPISuccess.data["project"];
        successCallback(record);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }

  addConfiguration(user:string,projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void {
    let me=this; 
    let success=(token)=>{
      me.addConfigurationByToken(token,projectInformation, configurationInformation,  successCallback, errorCallback);
    }
    this.getTokenByUser(user,success, errorCallback );
  }

  addConfigurationByToken(token:string, projectInformation:ProjectInformation,  configurationInformation:ConfigurationInformation,  successCallback:any, errorCallback: any): void {
    try { 
      let me=this;
      let data=configurationInformation;
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/addConfiguration?project_id=" + projectInformation.id,
        method: "POST" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: data
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        if(successCallback){ 
          successCallback(configurationInformation);
        }
      })
      .catch((error) => {
        console.error("Error:", error); 
        if (errorCallback) {
          errorCallback(error);
        }
      });;
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }

  deleteConfiguration(user:string,projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void {
    let me=this; 
    let success=(token)=>{
      me.deleteConfigurationByToken(token,projectInformation, configurationInformation,  successCallback, errorCallback);
    }
    this.getTokenByUser(user,success, errorCallback );
  }

  deleteConfigurationByToken(token:string, projectInformation:ProjectInformation,  configurationInformation:ConfigurationInformation,  successCallback:any, errorCallback: any): void {
    try { 
      let me=this; 
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/deleteConfiguration?project_id=" + projectInformation.id + "&model_id=" + configurationInformation.id_feature_model+ "&configuration_id=" + configurationInformation.id,
        method: "DELETE" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        if(successCallback){ 
          successCallback(responseAPISuccess.data);
        }
      })
      .catch((error) => {
        console.error("Error:", error); 
        if (errorCallback) {
          errorCallback(error);
        }
      });;
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }

  applyConfiguration(user:string,projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void {
    let me=this; 
    let success=(token)=>{
      me.applyConfigurationByToken(token,projectInformation, configurationInformation,  successCallback, errorCallback);
    }
    this.getTokenByUser(user,success, errorCallback );
  }

  applyConfigurationByToken(token:string, projectInformation:ProjectInformation,  configurationInformation:ConfigurationInformation,  successCallback:any, errorCallback: any): void {
    try { 
      let me=this; 
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/applyConfiguration?project_id=" + projectInformation.id,
        method: "POST" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        },
        data: configurationInformation
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        if(successCallback){ 
          successCallback(responseAPISuccess.data);
        }
      })
      .catch((error) => {
        console.error("Error:", error); 
        if (errorCallback) {
          errorCallback(error);
        }
      });;
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
  }

  getAllConfigurations(user:string,projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any): void {
    let me=this; 
    let success=(token)=>{
      me.getAllConfigurationsByToken(token,projectInformation, configurationInformation,  successCallback, errorCallback);
    }
    this.getTokenByUser(user,success, errorCallback );
  } 

  getAllConfigurationsByToken(token:string,projectInformation:ProjectInformation, configurationInformation:ConfigurationInformation, successCallback:any, errorCallback: any) {
    try { 
      let me=this;
      let project_id=projectInformation.id;
      let model_id=configurationInformation.id_feature_model;
      const config = {
        baseURL: Config.SERVICES.urlBackEndProjectPersistence + "/getAllConfigurations?project_id=" + project_id + "&model_id=" + model_id,
        method: "GET" as Method, 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }; 
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data); 
        if (responseAPISuccess.message?.includes("Error")){
          throw new Error(JSON.stringify(res.data));
        }
        let records: ConfigurationInformation[] = []; 
        records = Object.assign(records, responseAPISuccess.data);
        successCallback(records);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
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
