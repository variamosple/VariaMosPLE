import axios, { Method } from "axios";
import { Config } from "../../Config";
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import { json } from "react-router-dom";

export default class LanguageService { 
  apiVariamos = axios.create({
    baseURL: Config.SERVICES.urlBackEndLanguage,
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

  getLanguagesByUser(user: string): Language[] { 
    let languages: Language[] = [];
    try {
      let url = "/languagesbyuser/" + user;
      this.apiVariamos.get(url).then((res) => {
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

  createLanguage(callback: any, language: Language, user: string) {
    let response: string;

    // Standard Request Start
    let requestBody = {
      transactionId: "createLanguage_Frontend",
      data: language,
      user: user
    };
    // Standard Request End

    const config = {
      baseURL: Config.SERVICES.urlBackEndLanguage + "/languages",
      method: "post" as Method,
      data: requestBody,
    };
    try {
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        response = responseAPISuccess.message;

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(response);
      }).catch(function (error) {
        console.log(JSON.stringify(error));
        let response = {
          messageError: "Something wrong in createLanguage Service."
        }
        if (error.response) { 
          if (error.response.data) { 
            if (error.response.data.data) { 
              response = JSON.parse(error.response.data.data);
            }
          }
        }
        callback(response);
      });
    } catch (error) {
      response = "Something wrong in createLanguage Service: " + error;
      console.log(response);
      callback(response);
    }
  }

  deleteLanguage(callback: any, languageId: string, user: string) {
    let response: string;

    // Standard Request Start
    let requestBody = {
      transactionId: "deleteLanguage_Frontend",
    };
    // Standard Request End

    const config = {
      baseURL: Config.SERVICES.urlBackEndLanguage + "/languages/" + languageId + "/" + user,
      method: "delete" as Method,
      data: requestBody,
    };

    try {
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        response = responseAPISuccess.message;

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(response);
      }).catch(function (error) {
        console.log(JSON.stringify(error));
        let response = {
          messageError: "Something wrong in createLanguage Service."
        }
        if (error.response) { 
          if (error.response.data) { 
            if (error.response.data.data) { 
              response = JSON.parse(error.response.data.data);
            }
          }
        }
        callback(response);
      });
    } catch (error) {
      response = "Something wrong in deleteLanguage Service: " + error;
      console.log(response);
      callback(response);
    }
  }

  updateLanguage(callback: any, language: Language, user: string) {
    let response: string;

    // Standard Request Start
    let requestBody = {
      transactionId: "updateLanguage_Frontend",
      data: language,
      user: user
    };
    // Standard Request End

    const config = {
      baseURL: Config.SERVICES.urlBackEndLanguage + "/languages/" + language.id,
      method: "put" as Method,
      data: requestBody,
    };

    try {
      axios(config).then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);
        response = responseAPISuccess.message;

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        callback(response);
      }).catch(function (error) {
        console.log(JSON.stringify(error));
        let response = {
          messageError: "Something wrong in createLanguage Service."
        }
        if (error.response) { 
          if (error.response.data) { 
            if (error.response.data.data) { 
              response = JSON.parse(error.response.data.data);
            }
          }
        }
        callback(response);
      });
    } catch (error) {
      response = "Something wrong in createLanguage Service: " + error;
      console.log(response);
      callback(response);
    }
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
