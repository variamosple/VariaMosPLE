import axios, { Method } from "axios";
import { Config } from "../../Config";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

export default class RestrictionService {
  apiVariamos = axios.create({
    baseURL: Config.SERVICES.urlBackEndRestriction,
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
      baseURL: Config.SERVICES.urlBackEndRestriction + "/restriction/" + name,
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
      }).catch(function (error) {
        let m=JSON.stringify(error);
        console.log(m);
        // alert(m);

        // if (error.response) {
        //   // Request made and server responded
        //   alert(error.response.data);
        //   alert(error.response.status);
        //   alert(error.response.headers);
        // } else if (error.request) {
        //   // The request was made but no response was received
        //   alert(error.request);
        // } else {
        //   // Something happened in setting up the request that triggered an Error
        //   alert('Error ' + error.message);
        // }
    
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
