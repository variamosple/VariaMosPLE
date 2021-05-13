import axios from "axios";

export const apiVariamos = axios.create({
  // baseURL: "http://localhost:4000/",
  baseURL: "http://variamosmicroservice.eastus.azurecontainer.io:4000/",
});

export function getLanguages(language: string, callBack: any) {
  let dummy=false;
  if (dummy) {
    getLanguagesDummy(language, callBack);
  }else{
    getLanguagesRest(language, callBack);
  }
}

export function getLanguagesRest(language: string, callBack: any) {
  try {
    apiVariamos.get("/languagesDetail").then((res) => { 
      for (let index = 0; index < res.data.length; index++) {
        if(res.data[index].name==language){
          callBack(res.data[index]);
        } 
      }
    });
  } catch (error) {
    console.log("Test Wrong");
  }
}

export function getLanguagesDummy(language: string, callBack: any) {
  let data = [{
    "definition": {
      "RootFeature": {
        "languageType":"Domain",
        "properties": [
          {
            "name": "Name",
            "type": "String"
          }
        ]
      },
      "Feature": {
        "languageType":"Domain",
        "properties": [
          {
            "name": "Name",
            "type": "String"
          }
        ]
      }
    },
    "style": {
      "elements": {
        "RootFeature": {
          "label": "Root feature",
          "design": "shape=rectangle;",
          "width": 100,
          "height": 50
        },
        "Abstract": {
          "label": "Abstract feature",
          "design": "shape=rectangle;",
          "width": 100,
          "height": 50
        },
        "Concrete": {
          "label": "Concrete feature",
          "design": "shape=rectangle;",
          "width": 100,
          "height": 50
        },
        "Bundle": {
          "label": "Bundle",
          "design": "shape=ellipse;",
          "width": 100,
          "height": 50
        }
      }
    }
  }];
  callBack(data);
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

