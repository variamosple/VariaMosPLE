import axios, { Method } from "axios";
import { ExternalFuntion } from "../../Domain/ProductLineEngineering/Entities/ExternalFuntion";
import { ResponseAPISuccess } from "./languageService";
import config from "../../Infraestructure/config.json";

export default class ExternalFuntionService {
  apiVariamos: any;

  getExternalFunctions(callback: any, languageId: number) {
    this.apiVariamos = axios.create({
      baseURL: config.urlBackEndLanguage,
    });
    let externalFunctions: ExternalFuntion[] = [];
    try {
      this.apiVariamos
        .get("/languages/" + languageId + "/externalfunctions")
        .then((res) => {
          let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
          responseAPISuccess = Object.assign(responseAPISuccess, res.data);

          if (responseAPISuccess.message?.includes("Error"))
            throw new Error(JSON.stringify(res.data));

          externalFunctions = Object.assign(
            externalFunctions,
            responseAPISuccess.data
          );
          callback(externalFunctions);
        });
    } catch (error) {
      console.log("Something wrong in getExternalFunctions Service: " + error);
      callback(externalFunctions);
    }
  }

  callExternalFuntion(callback: any, externalFunction: ExternalFuntion): any {
    const config = {
      baseURL: externalFunction.url,
      method: "POST" as Method, 
      headers: externalFunction.header,
      data: externalFunction.request
    };

    try {
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(responseAPISuccess);
      });
    } catch (error) {
      console.log("Something wrong in getExternalFunctions Service: " + error);
    }
  }
}
