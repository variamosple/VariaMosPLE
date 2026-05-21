import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno (desde .env en la raíz de VariaMosPLE)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Importar la lógica original de VariaMos que construye los prompts
import { buildCreatePrompt, PATCH_SCHEMA_TEXT } from '../UI/WorkSpace/Chatbot/ModelEditService';

// Utilidades para la terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

interface TestCase {
  id: string;
  complexity: string;
  prompt: string;
  expected_elements: string[];
  description: string;
}

// Función de espera (cooldown)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeText(text: string): string {
  // Elimina tildes, diacríticos, convierte a minúsculas y quita cualquier caracter no alfanumérico (como espacios, guiones, etc.)
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function validateResponse(responseStr: string, expectedElements: string[]): { success: boolean, missing: string[] } {
  const missing: string[] = [];
  const normalizedResponse = normalizeText(responseStr);

  for (const expected of expectedElements) {
    const normalizedExpected = normalizeText(expected);
    if (!normalizedResponse.includes(normalizedExpected)) {
      missing.push(expected); // Retornamos la palabra original para que el log sea legible
    }
  }
  return { success: missing.length === 0, missing };
}

// Función aislada que puentea el backend y hace el request HTTP directamente al LLM
async function callDirectLLM(userGoal: string): Promise<string> {
  // Soporta una variable custom para el test o usa la que ya exista para OpenRouter en .env
  const apiKey = process.env.TEST_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("No se encontró la variable de entorno TEST_API_KEY ni REACT_APP_OPENROUTER_API_KEY.");
  }

  // Usamos el constructor de prompts genuino de VariaMosPLE
  const prompt = buildCreatePrompt({
    languageName: "Feature model with attributes (DOMAIN)",
    userGoal: userGoal + "\nImportante: Mantén los nombres de los elementos y atributos exactamente en el idioma original del requerimiento (español), no los traduzcas al inglés.",
    patchSchema: PATCH_SCHEMA_TEXT
  });

  const url = "https://openrouter.ai/api/v1/chat/completions";
  // Es posible usar "openai/gpt-4o-mini", "meta-llama/llama-3.2-3b-instruct:free", etc.
  const modelId = "openai/gpt-4o-mini";

  const systemPrompt = `You are a modeling assistant. Output MUST be one valid JSON (no backticks).
  Prefer a PLAN: {"name":...,"elements":[...],"relationships":[...]}. PATCH is also accepted.
  CRITICAL: cover ALL instructions in one response. Use only element NAMES in refs.
  To change classification/kind use updateElement with changes.type.

  Abstract syntax (strict):
  Elements: [Bundle, Annotation, RootFeature, MLBasedFeature, AbstractFeature, ConcreteFeature]
  Relationships: Bundle_Feature: Bundle→[AbstractFeature, ConcreteFeature, MLBasedFeature]; Annotation_None: Annotation→[None]; Bundle_Annotation: Bundle→[Annotation]; RootFeature_Bundle: RootFeature→[Bundle]; RootFeature_Feature: RootFeature→[AbstractFeature, ConcreteFeature, MLBasedFeature]; MLBasedFeature_Bundle: MLBasedFeature→[Bundle]; AbstractFeature_Bundle: AbstractFeature→[Bundle]; ConcreteFeature_Bundle: ConcreteFeature→[Bundle]; MLBasedFeature_Feature: MLBasedFeature→[ConcreteFeature, AbstractFeature, MLBasedFeature]; RootFeature_Annotation: RootFeature→[Annotation]; AbstractFeature_Feature: AbstractFeature→[AbstractFeature, ConcreteFeature, MLBasedFeature]; ConcreteFeature_Feature: ConcreteFeature→[ConcreteFeature, AbstractFeature, MLBasedFeature]; MLBasedFeature_Annotation: MLBasedFeature→[Annotation]; AbstractFeature_Annotation: AbstractFeature→[Annotation]; ConcreteFeature_Annotation: ConcreteFeature→[Annotation]

  PROJECT MEMORY (traceability-aware):
  (no models in this language yet)

  Common root features: (none)
  Frequent element types (same language): (none)
  Frequent names (same language): (none)
  Frequent names (global PL): (none)
  Frequent relationship patterns: (none)

  TRACEABILITY DIRECTIVES (STRICT):
  - Reuse EXACT element NAMES from the lists above when the user asks for a new model in a different language (e.g., Requirements derived from a Domain/Variability model).
  - When the abstract syntax allows it, create explicit relationships from the new elements (e.g., FunctionalRequirement/SecurityRequirement/UseCase/etc.) to those existing domain concepts—pick a valid relationship type from the meta (see 'Relationships' section in the system prompt).
  - If the root is unspecified, prefer one from 'Common root features'.
  - Never use internal ids in refs; only element NAMES.`;

  const body = {
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return content;
}

async function runTests() {
  console.log(`\n${colors.cyan}${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}   Iniciando QA Chatbot (AISLAMIENTO COMPONENTE)   ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}======================================================\n${colors.reset}`);

  const args = process.argv.slice(2);
  // Usa el argumento pasado por consola, o por defecto el banco_prompts_prueba.json
  const jsonFileName = args[0] || 'banco_prompts_prueba.json';
  const filePath = path.isAbsolute(jsonFileName) ? jsonFileName : path.join(__dirname, jsonFileName);

  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}Error: No se encontró el archivo ${filePath}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}Cargando banco de pruebas desde: ${colors.yellow}${path.basename(filePath)}${colors.reset}\n`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const testCases: TestCase[] = JSON.parse(fileContent);

  const isMetamorphic = path.basename(filePath).includes('metamorfica');

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`${colors.yellow}▶ Ejecutando prueba:${colors.reset} ${colors.bold}${test.id}${colors.reset} (${test.complexity})`);

    let llmResponseContent = "";

    try {
      // Petición directa y aislada a la API del LLM
      llmResponseContent = await callDirectLLM(test.prompt);
      console.log(`   ${colors.cyan}[API]${colors.reset} Respuesta recibida correctamente.`);
    } catch (error: any) {
      console.log(`   ${colors.red}[API ERROR]${colors.reset} Falló la conexión:`, error.message);
      llmResponseContent = "{}"; // Fallback seguro para evitar cuelgues
    }

    // Validar los elementos en el JSON (como texto por practicidad en el POC)
    const validation = validateResponse(llmResponseContent, test.expected_elements);

    if (validation.success) {
      const successMsg = isMetamorphic ? "[REPRODUCCIÓN EXITOSA]" : "[ÉXITO]";
      console.log(`   ${colors.green}${successMsg}${colors.reset} El modelo generó la estructura correctamente.`);
      passed++;
    } else {
      const errorMsg = isMetamorphic ? "[FALLO DE REPRODUCIBILIDAD]" : "[ALUCINACIÓN ESTRUCTURAL]";
      console.log(`   ${colors.red}${errorMsg}${colors.reset} El modelo omitió elementos requeridos.`);
      console.log(`   ${colors.red}Faltan:${colors.reset} ${validation.missing.join(', ')}`);
      failed++;
    }

    console.log(`   ${colors.yellow} Cooldown: Esperando 5 segundos antes del siguiente prompt...${colors.reset}`);
    await sleep(5000);
    console.log("");
  }

  // Resumen y cálculo
  const total = passed + failed;
  const hallucinationRate = total > 0 ? (failed / total) * 100 : 0;
  const reproducibilityIndex = total > 0 ? (passed / total) * 100 : 0;

  console.log(`${colors.cyan}${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}                  REPORTE FINAL QA                    ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}======================================================${colors.reset}`);
  console.log(`  Total de prompts evaluados: ${colors.bold}${total}${colors.reset}`);

  if (isMetamorphic) {
    console.log(`  Reproducciones Exitosas:    ${colors.green}${passed}${colors.reset}`);
    console.log(`  Fallas de Reproducción:     ${colors.red}${failed}${colors.reset}`);
    console.log(`\n  ${colors.bold}Índice de Reproducibilidad: ${reproducibilityIndex < 100 ? colors.red : colors.green}${reproducibilityIndex.toFixed(2)}%${colors.reset}`);
  } else {
    console.log(`  Pruebas Exitosas:           ${colors.green}${passed}${colors.reset}`);
    console.log(`  Alucinaciones (Errores):    ${colors.red}${failed}${colors.reset}`);
    console.log(`\n  ${colors.bold}Tasa de Alucinación Estructural: ${hallucinationRate > 0 ? colors.red : colors.green}${hallucinationRate.toFixed(2)}%${colors.reset}`);
  }

  console.log(`${colors.cyan}${colors.bold}======================================================${colors.reset}\n`);
}

runTests().catch(console.error);
