import semanticDictionaryRaw from './semantic_dictionary.json';
import { PROJECTS_CLIENT } from "../../../Infraestructure/AxiosConfig";

const semanticDictionary = semanticDictionaryRaw as Record<string, string>;

// Caché en memoria para no saturar la red cada vez que el usuario chatea
const ragCache: Record<string, string> = {};

async function fetchProjectFull(projectId: string): Promise<any> {
  try {
    const response = await PROJECTS_CLIENT.get(`/getProject`, { params: { project_id: projectId } });
    let responseAPISuccess = response.data;
    if (responseAPISuccess.message?.includes("Error")) {
      throw new Error(JSON.stringify(response.data));
    }
    return responseAPISuccess.data;
  } catch (error) {
    console.error("Error fetching project in RAG:", error);
    return null;
  }
}

async function fetchTemplateProjectsMetadata(): Promise<any[]> {
  try {
    const response = await PROJECTS_CLIENT.get("/getTemplateProjects");
    let responseAPISuccess = response.data;
    if (responseAPISuccess.message?.includes("Error")) {
      throw new Error(JSON.stringify(response.data));
    }
    return responseAPISuccess.data?.projects || [];
  } catch (error) {
    console.error("Error fetching templates in RAG:", error);
    return [];
  }
}

function sanitizeModel(model: any) {
  return {
    type: model.type,
    elements: (model.elements || []).map((e: any) => ({ name: e.name, type: e.type })),
    relationships: (model.relationships || []).map((r: any) => ({ type: r.type }))
  };
}

export async function getOrganicRAG(languageName: string): Promise<string> {
  const baseLanguageName = languageName.replace(/\s*\((DOMAIN|APPLICATION|SCOPE)\)$/i, "").trim();

  // 1. Inyectar Reglas Semánticas (del diccionario JSON)
  const semanticRulesText = semanticDictionary[baseLanguageName] 
    ? `\n[SEMANTIC RULES FOR THIS LANGUAGE]\n${semanticDictionary[baseLanguageName]}\n` 
    : "";

  // Si ya tenemos ejemplos orgánicos cacheados para este lenguaje, usar la caché
  if (ragCache[baseLanguageName]) {
    return `${semanticRulesText}\n[ORGANIC RAG EXAMPLES]\n${ragCache[baseLanguageName]}`.trim();
  }

  // 2. Buscar Modelos Dinámicos en los Templates Públicos
  const cacheMetadata = await fetchTemplateProjectsMetadata();
  const matchingModels: any[] = [];
  const seenNodeTypes = new Set<string>();

  for (const pMeta of cacheMetadata) {
    if (matchingModels.length >= 2) break; // Límite de modelos por contexto
    
    const fullProject = await fetchProjectFull(pMeta.id);
    const productLines = fullProject?.project?.productLines;
    
    if (productLines) {
      for (const pl of productLines) {
        const allModels = [
          ...(pl.domainEngineering?.models || []), 
          ...(pl.applicationEngineering?.models || []), 
          ...(pl.scope?.models || [])
        ];
        
        for (const model of allModels) {
          if (model.type === baseLanguageName && model.elements) {
            const typesInModel = new Set<string>(model.elements.map((e: any) => e.type));
            let isDiverse = matchingModels.length === 0;
            
            if (!isDiverse) {
                for (const t of typesInModel) {
                    if (!seenNodeTypes.has(t)) { isDiverse = true; break; }
                }
            }
            
            if (isDiverse) {
                matchingModels.push(sanitizeModel(model));
                for (const t of typesInModel) seenNodeTypes.add(t);
            }
            if (matchingModels.length >= 2) break;
          }
        }
        if (matchingModels.length >= 2) break;
      }
    }
  }

  const injectedModels = matchingModels.map((m: any, i: number) => `Organic Example ${i+1}:\n${JSON.stringify(m, null, 2)}`).join("\n\n");
  const ragContent = injectedModels || '(no organic models found)';
  
  // Guardar en caché para futuras consultas en esta sesión web
  ragCache[baseLanguageName] = ragContent;

  return `${semanticRulesText}\n[ORGANIC RAG EXAMPLES]\n${ragContent}`.trim();
}
