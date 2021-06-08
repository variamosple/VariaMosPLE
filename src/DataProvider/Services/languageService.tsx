import axios from "axios";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";

export default class LanguageService {
  apiVariamos = axios.create({
    baseURL: "http://variamosmicroservice02.eastus.azurecontainer.io:4000/",
  });

  getLanguagesDetail(): Language[] {
    let languages: Language[] = [];
    try {
      this.apiVariamos.get("/languages/detail").then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        languages = Object.assign(languages, responseAPISuccess.data);
      });
    } catch (error) {
      console.log("Error " + error);
    }
    return languages;
  }

  getLanguages(callBack: any) {
    try {
      this.apiVariamos.get("/languages").then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        callBack(responseAPISuccess.data);
      });
    } catch (error) {
      console.log("Error " + error);
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
