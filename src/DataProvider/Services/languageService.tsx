import axios from "axios";

export const apiVariamos = axios.create({ 
  baseURL: "http://variamosmicroservice.eastus.azurecontainer.io:4000/",
});

export function getLanguages(callBack: any) { 
  getLanguagesRest(callBack);
}

export function getLanguagesRest(callBack: any) {
  try {
    apiVariamos.get("/languagesDetail").then((res) => { 
      callBack(res.data);
    });
  } catch (error) {
    console.log("Test Wrong");
  }
} 


export function getLanguagesNative(
  method: string,
  url: string,
  languageName: string
) {
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

