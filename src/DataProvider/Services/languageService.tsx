import axios from "axios";

export default class LanguageService {
  apiVariamos = axios.create({
    baseURL: "http://variamosmicroservice.eastus.azurecontainer.io:4000/",
  });

  getLanguages(callBack: any) {
    this.getLanguagesRest(callBack);
  }

  getLanguagesRest(callBack: any) {
    try {
      this.apiVariamos.get("/languagesDetail").then((res) => {
        callBack(res.data);
      });
    } catch (error) {
      console.log("Error " + error);
    }
  }
  getLanguagesAvailable(callBack: any) {
    try {
      this.apiVariamos.get("/languages").then((res) => {
        callBack(res.data);
      });
    } catch (error) {
      console.log("Error " + error);
    }
  }

  getLanguagesNative(method: string, url: string, languageName: string) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    return new Promise((resolve, reject) => {
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr);
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.send(languageName);
    });
  }
}
