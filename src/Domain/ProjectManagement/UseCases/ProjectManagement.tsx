import { cMyProject } from "../Entities/ProjectModel";

export function saveProject(myProject: cMyProject): void {
  // Save data to sessionStorage
  sessionStorage.setItem("myProject", JSON.stringify(myProject));
}

export function deleteProject() {
  // Remove saved data from sessionStorage
  sessionStorage.removeItem("myProject");

  // Remove all saved data from sessionStorage
  sessionStorage.clear();
}



