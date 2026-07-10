import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { PATCH_SCHEMA_TEXT } from '../UI/WorkSpace/Chatbot/ModelEditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const colors = { reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m" };

// Dependencias ecosistema
let semanticDictionary: Record<string, string> = {};
const semanticDictionaryPath = path.join(__dirname, 'semantic_dictionary.json');
if (fs.existsSync(semanticDictionaryPath)) {
  semanticDictionary = JSON.parse(fs.readFileSync(semanticDictionaryPath, 'utf8'));
}

async function fetchProjectFull(projectId: string): Promise<any> {
  const token = process.env.TEST_API_KEY || process.env.VARIAMOS_TOKEN;
  const url = `https://app.variamos.com/vms_projects/getProject?project_id=${projectId}`;
  const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
  if (!response.ok) return null;
  const data = await response.json();
  return data.data;
}

async function fetchTemplateProjectsMetadata(): Promise<any[]> {
  const token = process.env.TEST_API_KEY || process.env.VARIAMOS_TOKEN;
  const url = "https://app.variamos.com/vms_projects/getTemplateProjects";
  const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
  if (!response.ok) return [];
  const data = await response.json();
  return data.data?.projects || [];
}

function sanitizeModel(model: any) {
  return {
    type: model.type,
    elements: (model.elements || []).map((e: any) => ({ name: e.name, type: e.type })),
    relationships: (model.relationships || []).map((r: any) => ({ type: r.type }))
  };
}

async function retrieveOrganicPatterns(languageName: string): Promise<string> {
  let cache = await fetchTemplateProjectsMetadata();
  const matchingModels: any[] = [];
  const seenNodeTypes = new Set<string>();

  for (const pMeta of cache) {
    if (matchingModels.length >= 2) break;
    const fullProject = await fetchProjectFull(pMeta.id);
    const productLines = fullProject?.project?.productLines;
    if (productLines) {
      for (const pl of productLines) {
        const allModels = [...(pl.domainEngineering?.models || []), ...(pl.applicationEngineering?.models || []), ...(pl.scope?.models || [])];
        for (const model of allModels) {
          const baseLanguageName = languageName.replace(/\s*\((DOMAIN|APPLICATION|SCOPE)\)$/i, "").trim();
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

  const baseLanguageName = languageName.replace(/\s*\((DOMAIN|APPLICATION|SCOPE)\)$/i, "").trim();
  const semanticRulesText = semanticDictionary[baseLanguageName] ? `\n[SEMANTIC RULES FOR THIS LANGUAGE]\n${semanticDictionary[baseLanguageName]}\n` : "";
  const injectedModels = matchingModels.map((m: any, i: number) => `Organic Example ${i + 1}:\n${JSON.stringify(m, null, 2)}`).join("\n\n");

  console.log(`\n${colors.cyan}[RAG] Encontrados ${matchingModels.length} modelos dinámicos para '${languageName}'${colors.reset}`);
  return `${semanticRulesText}\n[ORGANIC RAG EXAMPLES]\n${injectedModels || '(no organic models found)'}`.trim();
}

async function extrapolateLanguage(languageName: string, abstractSyntax: string, userPrompt: string, expectedTypes: string[], expectedRels: string[]) {
  console.log(`\n${colors.yellow}-${colors.reset}`);
  console.log(`${colors.yellow}EXTRAPOLACIÓN: ${languageName}${colors.reset}`);
  console.log(`${colors.yellow}-${colors.reset}`);

  const apiKey = process.env.TEST_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;
  const dynamicMemory = await retrieveOrganicPatterns(languageName);
  
  const systemPrompt = `You are a modeling assistant. Output MUST be one valid JSON (no backticks).
Return ONLY valid JSON matching this TypeScript type: { "ops": PatchOp[] }.

Abstract syntax (strict):
${abstractSyntax}

PROJECT MEMORY (traceability-aware):
${dynamicMemory}

TRACEABILITY DIRECTIVES (STRICT):
- Reuse EXACT element NAMES from the lists above when the user asks for a new model in a different language.`;

  // Constructor de prompts de VariaMosPLE
  const { buildCreatePrompt, PATCH_SCHEMA_TEXT } = await import('../UI/WorkSpace/Chatbot/ModelEditService.js');
  const userPromptText = buildCreatePrompt({
    languageName: languageName,
    userGoal: userPrompt,
    patchSchema: PATCH_SCHEMA_TEXT
  });

  const body = {
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPromptText }
    ]
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  let content = data.choices[0].message.content;
  // Limpiar backticks si el LLM los generó por error
  content = content.replace(/^```(json)?/m, "").replace(/```$/m, "").trim();

  let isSuccess = true;
  const missing: string[] = [];

  try {
    const parsed = JSON.parse(content);
    const ops = parsed.ops || [];
    
    // Extraer tipos creados
    const createdTypes = ops.filter((o: any) => o.op === "createElement").map((o: any) => o.type);
    const connectedTypes = ops.filter((o: any) => o.op === "connect").map((o: any) => o.type);

    for (const exp of expectedTypes) {
      if (!createdTypes.includes(exp)) {
        isSuccess = false;
        missing.push(exp);
      }
    }
    for (const exp of expectedRels) {
      if (!connectedTypes.includes(exp)) {
        isSuccess = false;
        missing.push(exp);
      }
    }

  } catch (e) {
    isSuccess = false;
    missing.push("Invalid JSON format");
  }

  console.log(`\n${colors.cyan}[LLM OUTPUT JSON]${colors.reset}\n${content}\n`);

  if (isSuccess) {
    console.log(`   ${colors.green}[ÉXITO] El modelo generó la estructura correctamente.${colors.reset}`);
  } else {
    console.log(`   ${colors.red}[ALUCINACIÓN ESTRUCTURAL] El modelo omitió elementos requeridos.${colors.reset}`);
    console.log(`   Faltan: ${missing.join(", ")}`);
  }
}

async function run() {
  await extrapolateLanguage(
    "KAOS (SCOPE)",
    "Elements: [Goal, SubGoal, Requirement, Agent]\nRelationships: Goal_SubGoal: Goal->[SubGoal]; SubGoal_Requirement: SubGoal->[Requirement]; Requirement_Agent: Requirement->[Agent]",
    "Create a goal model for a Library. The main goal is 'Manage Library'. It has two subgoals: 'Borrow Book' and 'Return Book'. The 'Borrow Book' requirement is assigned to 'Librarian' agent.",
    ["Goal", "SubGoal", "Requirement", "Agent"],
    ["Goal_SubGoal", "SubGoal_Requirement", "Requirement_Agent"]
  );

  await extrapolateLanguage(
    "Class diagram (DOMAIN)",
    "Elements: [Class, Interface]\nRelationships: Association: Class->[Class]; Inheritance: Class->[Class, Interface]; Aggregation: Class->[Class]",
    "Create a class diagram for a school. It has a 'Student' class and a 'Course' class. They have an Association relationship.",
    ["Class"],
    ["Association"]
  );

  await extrapolateLanguage(
    "Component diagram (DOMAIN)",
    "Elements: [Component, ProvidedInterface, RequiredInterface]\nRelationships: Component_Provided: Component->[ProvidedInterface]; Component_Required: Component->[RequiredInterface]; Required_Provided: RequiredInterface->[ProvidedInterface]",
    "Create a component diagram for an e-commerce backend. The 'PaymentService' component provides a 'ProcessPayment' interface. The 'OrderService' component requires the 'ProcessPayment' interface.",
    ["Component", "ProvidedInterface", "RequiredInterface"],
    ["Component_Provided", "Component_Required"]
  );
}

run().catch(console.error);
