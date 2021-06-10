import axios from "axios";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";

export default class LanguageService {
  apiVariamos = axios.create({
    // baseURL: "http://variamosmicroservice02.eastus.azurecontainer.io:4000/",
    baseURL: "https://variamos-ms-languages.azurewebsites.net/",
  });

  getLanguagesDetail(): Language[] {
    let languages: Language[] = [];

    try {
      this.apiVariamos.get("/languages/detail").then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        languages = Object.assign(languages, responseAPISuccess.data);
      });
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service: " + error);
    }
    return languages;
  }

  getLanguages(callBack: any) {
    let languages: Language[] = [];
    try {
      this.apiVariamos.get("/languages/detail").then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        languages = Object.assign(languages, responseAPISuccess.data);
        callBack(languages);
      });
    } catch (error) {
      console.log("Something wrong in getLanguages service: " + error);
      callBack(languages);
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
