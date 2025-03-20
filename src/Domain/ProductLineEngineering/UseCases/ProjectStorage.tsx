import { json } from "react-router-dom";
import { ProjectInformation } from "../Entities/ProjectInformation";

export default class ProjectStorage {
  private dbName = "ProjectDB1";
  private storeName = "projects";

  constructor() {
    this.initializeDB();
  }

  // Initialize the IndexedDB database
  private initializeDB(): void {
    const request = indexedDB.open(this.dbName, 1);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: "id" }); // Assuming each project has a unique 'id' property
      }
    };

    request.onerror = (event) => {
      console.error("Error initializing IndexedDB:", (event.target as IDBRequest).error);
    };

    request.onsuccess = () => {
      console.log("IndexedDB initialized successfully.");
    };
  }

  // Save a project to IndexedDB
  saveProject(project: ProjectInformation): void {
    const request = indexedDB.open(this.dbName);

    request.onsuccess = (event) => {
      try {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        let rec={
          id: 1,
          project: JSON.stringify(project)
        }

        const addRequest = store.put(rec); // 'put' will add or update the project
        addRequest.onsuccess = () => {
          console.log("Project saved successfully:", project);
        };

        addRequest.onerror = (event) => {
          console.error("Error saving project:", (event.target as IDBRequest).error);
        };
      } catch (error) {
        let m = error;
      } 
    };

    request.onerror = (event) => {
      console.error("Error opening IndexedDB for saving:", (event.target as IDBRequest).error);
    };
  }

  // Open a specific project by its ID
  async openProject(projectId: number): Promise<ProjectInformation | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
  
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
  
        const getRequest = store.get(projectId);
  
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            console.log("Project opened successfully:", getRequest.result);
            let pi=JSON.parse(getRequest.result.project);
            resolve(pi as ProjectInformation);
          } else {
            console.warn("Project not found:", projectId);
            resolve(null);
          }
        };
  
        getRequest.onerror = (event) => {
          console.error("Error opening project:", (event.target as IDBRequest).error);
          reject(new Error("Error opening project"));
        };
      };
  
      request.onerror = (event) => {
        console.error("Error opening IndexedDB for retrieving project:", (event.target as IDBRequest).error);
        reject(new Error("Error opening IndexedDB"));
      };
    });
  }

  // Delete a specific project by its ID
  deleteProject(projectId: string): void {
    const request = indexedDB.open(this.dbName);

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const deleteRequest = store.delete(projectId);
      deleteRequest.onsuccess = () => {
        console.log("Project deleted successfully:", projectId);
      };

      deleteRequest.onerror = (event) => {
        console.error("Error deleting project:", (event.target as IDBRequest).error);
      };
    };

    request.onerror = (event) => {
      console.error("Error opening IndexedDB for deleting:", (event.target as IDBRequest).error);
    };
  }

  // Clear all projects from IndexedDB
  clearProjects(): void {
    const request = indexedDB.open(this.dbName);

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        console.log("All projects cleared from storage.");
      };

      clearRequest.onerror = (event) => {
        console.error("Error clearing projects:", (event.target as IDBRequest).error);
      };
    };

    request.onerror = (event) => {
      console.error("Error opening IndexedDB for clearing:", (event.target as IDBRequest).error);
    };
  }
}
