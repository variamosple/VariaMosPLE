// useSelectedModel.ts
import { useState, useEffect } from "react";
import ProjectService from "../../Application/Project/ProjectService";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";

export const useSelectedModel = (projectService: ProjectService): Model | null => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  useEffect(() => {
    const updateModel = () => {
      const id = projectService.getTreeIdItemSelected();
      if (!id) {
        setSelectedModel(null);
      } else {
        const m = projectService.findModelById(projectService.project, id);
        setSelectedModel(m ?? null);
      }
    };

    // Llamamos de inmediato para tener el modelo actual
    updateModel();

    projectService.addUpdateProjectListener(updateModel);
    projectService.addUpdateSelectedListener(updateModel);

    return () => {
      projectService.removeUpdateProjectListener(updateModel);
      projectService.removeUpdateSelectedListener(updateModel);
    };
  }, [projectService]);

  return selectedModel;
};
