import axios, { Method } from "axios";
import _config from "../../Infraestructure/config.json";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

export default class RestrictionService {
  apiVariamos = axios.create({
    baseURL: _config.urlBackEndRestriction,
  });

  applyRestriction(callback: any, model: Model, name: string, definition: any) {
    let response: string;

    // Standard Request Start
    let requestBody = {
      transactionId: "applyRestriction_",
      data: {
        model,
        restriction: {
          name,
          definition,
        },
      },
    };
    // Standard Request End

    const config = {
      baseURL: _config.urlBackEndRestriction + "/restriction/" + name,
      method: "POST" as Method,
      data: requestBody,
    };
    try {
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        // response = responseAPISuccess.message;

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(responseAPISuccess);
      });
    } catch (error) {
      response = "Something wrong in apply restriction Service: " + error;
      console.log(response);
      callback(response);
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
