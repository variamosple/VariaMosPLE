import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Chatbot.css";
import ProjectService from "../../../Application/Project/ProjectService";
import { Language as DomainLanguage } from "../../../Domain/ProductLineEngineering/Entities/Language";

import {
  buildSnapshot,
  buildEditPrompt,
  buildCreatePrompt,
  PATCH_SCHEMA_TEXT,
  applyPatch
} from "./ModelEditService";
import { PatchEnvelope } from "./Patch";

/** ===== Tipos ===== */
type ModePref = "AUTO" | "EDIT" | "CREATE";

type Phase = "SCOPE" | "DOMAIN" | "APPLICATION";
type Role = "system" | "user" | "assistant";
interface Message { role: Role; content: string; }

type Language = DomainLanguage;

type MetaProp = { name: string; type: string; defaultValue?: any; possibleValues?: string; comment?: string; linked_property?: string; linked_value?: string;[k: string]: any };
type MetaElementDef = { properties?: MetaProp[] };
type MetaRelDef = { min: number; max: number; source: string; target: string[]; properties?: MetaProp[] };
type AbstractSyntax = {
  elements: Record<string, MetaElementDef>;
  relationships: Record<string, MetaRelDef>;
  restrictions?: {
    quantity_element?: Array<{ element: string; min: number; max: number }>;
    parent_child?: Array<{ parentElement: string[]; childElement: string }>;
    unique_name?: { elements: string[][] };
    [k: string]: any;
  };
};

type PLKnowledge = {
  productLineName: string;
  languages: string[];
  models: Array<{ phase: string; type: string; name: string }>;
  knownElementNames: string[];           // top N nombres (global)
  knownElementTypes: string[];           // top N tipos (global)
  relationshipPatterns: Array<{ type: string; sourceType: string; targetType: string }>; // global
  rootNames: string[];                   // top N nombres de RootFeature
  // Filtros por lenguaje actual
  sameLang: {
    knownElementNames: string[];
    knownElementTypes: string[];
    relationshipPatterns: Array<{ type: string; sourceType: string; targetType: string }>;
    rootNames: string[];
  };
};

type PlanElement = { name: string; type: string; props?: Record<string, any> };
type PlanRelationship = { type: string; source: string; target: string; props?: Record<string, any> };

type PlanLLM = { name: string; elements: PlanElement[]; relationships: PlanRelationship[] };

type ModelOption = { id: string; label: string; free?: boolean };

const getLanguageKey = (l: Language) => String(l.id ?? l.name);

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_OPTIONS: ModelOption[] = [
  { id: "deepseek/deepseek-chat-v3.1:free", label: "DeepSeek V3.1", free: true },
  { id: "qwen/qwen3-coder:free", label: "Qwen: Qwen3 Coder 480B", free: true },
  { id: "x-ai/grok-4-fast:free", label: "xAI: Grok 4 Fast", free: true },
  { id: "mistralai/mistral-small-3.2-24b-instruct:free", label: "Mistral: Mistral Small 3.2", free: true },
  { id: "openai/gpt-oss-120b:free", label: "OpenAI: gpt-oss-120b", free: true },
  { id: "openai/gpt-oss-20b:free", label: "OpenAI: gpt-oss-20b", free: true }
];

// Helper: label amigable para mostrar al usuario
const modelLabel = (id: string) =>
  MODEL_OPTIONS.find(m => m.id === id)?.label || id;

// Forzar modo por comando inline (no heurística): /create o /edit al inicio del mensaje
const extractInlineMode = (
  text: string
): { clean: string; forced: "EDIT" | "CREATE" | null } => {
  let t = String(text || "").trim();
  let forced: "EDIT" | "CREATE" | null = null;

  // Comandos aceptados al comienzo del mensaje (cualquiera de estos):
  // /create   /new     ::create   [create]
  // /edit     /modify  ::edit     [edit]
  const patterns: Array<{ re: RegExp; mode: "EDIT" | "CREATE" }> = [
    { re: /^\/(new|create)\b/i, mode: "CREATE" },
    { re: /^::(new|create)\b/i, mode: "CREATE" },
    { re: /^\[(new|create)\]/i, mode: "CREATE" },

    { re: /^\/(edit|modify)\b/i, mode: "EDIT" },
    { re: /^::(edit|modify)\b/i, mode: "EDIT" },
    { re: /^\[(edit|modify)\]/i, mode: "EDIT" },
  ];

  for (const p of patterns) {
    if (p.re.test(t)) {
      forced = p.mode;
      t = t.replace(p.re, "").trim();
      break;
    }
  }

  return { clean: t, forced };
};


// Helper: orden de cascada a partir de MODEL_OPTIONS (primero el elegido)
const buildCascadeOrder = (primary: string) => {
  const listed = MODEL_OPTIONS.map(m => m.id);
  const seq = [primary, ...listed.filter(id => id !== primary)];
  return Array.from(new Set(seq)); // sin duplicados
};

/** ===== Util ===== */
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const stripCodeFences = (t: string) => {
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) return fence[1];
  const curly = t.match(/\{[\s\S]*\}$/);
  if (curly) return curly[0];
  return t.trim();
};

const softJsonRepair = (raw: string) => {
  let s = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\").replace(/,\s*([}\]])/g, "$1");
  const looksLikeSingle = /(^|[:,{\[])\s*'([^']*)'\s*([}\],:])/m.test(s);
  if (looksLikeSingle) s = s.replace(/'([^'\\]|\\.)*'/g, (m) => `"${m.slice(1, -1).replace(/"/g, '\\"')}"`);
  return s;
};

const safeParseJSON = (raw: string) => {
  try { return JSON.parse(raw); } catch { }
  try { return JSON.parse(softJsonRepair(raw)); } catch { }
  return null;
};
const getLangPhase = (l: any): Phase | null => {
  const byName = phaseFromName(l?.name);
  if (byName) return byName;
  const raw = String(l?.type ?? "").trim().toUpperCase().replace(/\s+/g, "-");
  if (raw.includes("SCOPE")) return "SCOPE";
  if (raw.startsWith("DOMAIN")) return "DOMAIN";
  if (raw.startsWith("APPLICATION")) return "APPLICATION";
  return null;
};
const phaseFromName = (n?: string): Phase | null => {
  const txt = String(n ?? "").toUpperCase();
  const matches = txt.match(/\(([^()]*)\)/g) || [];
  const last = matches.length ? matches[matches.length - 1] : "";
  const token = last.replace(/[()]/g, "").trim();
  if (token.includes("SCOPE")) return "SCOPE";
  if (token.includes("DOMAIN")) return "DOMAIN";
  if (token.includes("APPLICATION")) return "APPLICATION";
  return null;
};

const Typing = ({ text = "thinking..." }: { text?: string }) => (
  <div className="typing"><span>{text}</span><span className="dots"><i /><i /><i /></span></div>
);

const titleCase = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/** Mapea respuestas tipo nodes/edges → plan genérico */
const nodesEdgesToPlan = (input: any): PlanLLM | null => {
  if (!input || typeof input !== "object") return null;
  const nodes = Array.isArray(input.nodes) ? input.nodes : null;
  const edges = Array.isArray(input.edges) ? input.edges : null;
  if (!nodes && !edges) return null;
  const name = typeof input.name === "string" ? input.name : "Generated Model";

  const elements: PlanElement[] = nodes ? nodes.map((n: any, i: number) => ({
    name: String(n?.name ?? `Element${i + 1}`),
    type: String(n?.type ?? ""),
    ...(n?.props && typeof n.props === "object" ? { props: n.props } : {})
  })) : [];

  const relationships: PlanRelationship[] = edges ? edges.map((e: any) => ({
    type: String(e?.type ?? e?.relation ?? ""),
    source: String(e?.source ?? ""),
    target: String(e?.target ?? ""),
    ...(e?.props && typeof e.props === "object" ? { props: e.props } : {})
  })) : [];

  return { name, elements, relationships };
};

const harvestProductLineKnowledge = (ps: any, currentLanguage?: Language, maxItems = 20): PLKnowledge | null => {
  try {
    const project = ps?.getProject?.() ?? ps?.project ?? null;
    if (!project?.productLines?.length) return null;

    let plIdx = 0;
    try {
      const idx = ps.getIdCurrentProductLine?.();
      if (Number.isInteger(idx) && idx >= 0 && idx < project.productLines.length) plIdx = idx;
    } catch { }

    const pl = project.productLines[plIdx];
    if (!pl) return null;

    const allModels: any[] = [];
    const pushWithPhase = (arr: any[], phase: string) => {
      if (Array.isArray(arr)) for (const m of arr) allModels.push({ ...m, __phase: phase });
    };
    pushWithPhase(pl?.scope?.models || [], "SCOPE");
    pushWithPhase(pl?.domainEngineering?.models || [], "DOMAIN");
    pushWithPhase(pl?.applicationEngineering?.models || [], "APPLICATION-ENG");
    const apps = pl?.applicationEngineering?.applications || [];
    for (const app of apps) {
      pushWithPhase(app?.models || [], "APPLICATION");
      const adaps = app?.adaptations || [];
      for (const ad of adaps) pushWithPhase(ad?.models || [], "ADAPTATION");
    }

    const nameCount = new Map<string, number>();
    const typeCount = new Map<string, number>();
    const rootNameCount = new Map<string, number>();
    const relPatternCount = new Map<string, { type: string; sourceType: string; targetType: string; n: number }>();

    const langName = currentLanguage?.name || currentLanguage?.id || null;
    const sameLangNames = new Map<string, number>();
    const sameLangTypes = new Map<string, number>();
    const sameLangRootNames = new Map<string, number>();
    const sameLangPatterns = new Map<string, { type: string; sourceType: string; targetType: string; n: number }>();

    const add = (map: Map<string, number>, k: string, inc = 1) => map.set(k, (map.get(k) || 0) + inc);
    const addPattern = (map: Map<string, any>, p: { type: string; sourceType: string; targetType: string }) => {
      const key = `${p.type}::${p.sourceType}->${p.targetType}`;
      const cur = map.get(key) || { ...p, n: 0 };
      cur.n += 1;
      map.set(key, cur);
    };

    for (const m of allModels) {
      const isSame = langName && (String(m?.type) === String(langName));

      const elemById: Record<string, any> = {};
      for (const e of (m?.elements || [])) {
        if (!e?.name || !e?.type) continue;
        elemById[e.id] = e;
        add(nameCount, String(e.name));
        add(typeCount, String(e.type));
        if (String(e.type) === "RootFeature") add(rootNameCount, String(e.name));

        if (isSame) {
          add(sameLangNames, String(e.name));
          add(sameLangTypes, String(e.type));
          if (String(e.type) === "RootFeature") add(sameLangRootNames, String(e.name));
        }
      }

      for (const r of (m?.relationships || [])) {
        const s = elemById[r.sourceId];
        const t = elemById[r.targetId];
        if (!s?.type || !t?.type || !r?.type) continue;
        const patt = { type: String(r.type), sourceType: String(s.type), targetType: String(t.type) };
        addPattern(relPatternCount, patt);
        if (isSame) addPattern(sameLangPatterns, patt);
      }
    }

    const topKeys = (map: Map<string, number>, n = maxItems) =>
      [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
    const topPatterns = (map: Map<string, any>, n = maxItems) =>
      [...map.values()].sort((a, b) => b.n - a.n).slice(0, n).map(({ n, ...rest }) => rest);

    return {
      productLineName: pl?.name || "",
      languages: Array.from(new Set(allModels.map(m => String(m?.type || "")).filter(Boolean))),
      models: allModels.map(m => ({ phase: m.__phase, type: String(m?.type || ""), name: String(m?.name || "") })),
      knownElementNames: topKeys(nameCount, maxItems),
      knownElementTypes: topKeys(typeCount, Math.min(maxItems, 12)),
      relationshipPatterns: topPatterns(relPatternCount, maxItems),
      rootNames: topKeys(rootNameCount, Math.min(maxItems, 5)),
      sameLang: {
        knownElementNames: topKeys(sameLangNames, maxItems),
        knownElementTypes: topKeys(sameLangTypes, Math.min(maxItems, 12)),
        relationshipPatterns: topPatterns(sameLangPatterns, maxItems),
        rootNames: topKeys(sameLangRootNames, Math.min(maxItems, 5)),
      }
    };
  } catch {
    return null;
  }
};

type CascadeOpts = {
  perModelRetries?: number;     // reintentos por modelo
  retryDelayMs?: number;        // backoff base
  validate?: (content: string) => boolean; // validación del contenido; si falla, prueba siguiente modelo
};

async function callOpenRouterCascade(
  apiKey: string,
  primaryModelId: string,
  userContent: string,
  systemContent?: string,
  opts?: CascadeOpts
): Promise<{ text: string; usedModelId: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "HTTP-Referer": (typeof window !== "undefined" ? window.location.origin : ""),
    "X-Title": (typeof document !== "undefined" ? (document.title || "Variamos") : "Variamos")
  };

  const {
    perModelRetries = 1,
    retryDelayMs = 600,
    validate
  } = opts || {};

  const order = buildCascadeOrder(primaryModelId);
  const errors: string[] = [];

  const tryOnce = async (mdl: string) => {
    const body = {
      model: mdl,
      messages: systemContent
        ? [{ role: "system", content: systemContent }, { role: "user", content: userContent }]
        : [{ role: "user", content: userContent }]
    };
    const resp = await fetch(OPENROUTER_URL, { method: "POST", headers, body: JSON.stringify(body) });
    const rawText = await resp.text();

    let data: any = null;
    try { data = JSON.parse(rawText); } catch { /* no-op */ }

    if (!resp.ok) {
      const msg = data?.error?.message || rawText || `HTTP ${resp.status}`;
      const status = resp.status;
      const err = Object.assign(new Error(msg), { status });
      throw err;
    }

    // Si pediste :free, evitamos que el proveedor te "suba" a uno de pago
    const usedModel = data?.model || data?.choices?.[0]?.model || data?.choices?.[0]?.provider;
    const requestedIsFree = MODEL_OPTIONS.some(m => m.id === mdl && m.free);
    if (requestedIsFree && usedModel && !/:free(\b|$)/i.test(String(usedModel))) {
      throw new Error(`The free pool is not available. (used: ${usedModel})`);
    }

    const content = String(data?.choices?.[0]?.message?.content ?? "");
    if (validate && !validate(content)) {
      throw new Error("Validation failed for this model output.");
    }
    return content;
  };

  for (const mdl of order) {
    for (let attempt = 0; attempt <= perModelRetries; attempt++) {
      try {
        const text = await tryOnce(mdl);
        return { text, usedModelId: mdl };
      } catch (err: any) {
        const msg = String(err?.message || err);
        errors.push(`[${mdl}] ${msg}`);
        const st = Number(err?.status || 0);
        const retriable = st === 429 || (st >= 500 && st <= 599) || /provider returned error/i.test(msg);
        const noEndpoint = /no endpoints found/i.test(msg) || /free pool is not available/i.test(msg);
        if (attempt < perModelRetries && retriable && !noEndpoint) {
          const backoff = retryDelayMs * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        // si no es reintetable o ya agoté reintentos → paso al siguiente modelo
        break;
      }
    }
  }

  throw new Error(`All models failed.\n${errors.join("\n")}`);
}

// =======================
// 1) callOpenRouterOnce
// =======================
async function callOpenRouterOnce(
  apiKey: string,
  modelId: string,
  userContent: string,
  systemContent?: string,
  opts?: {
    maxRetries?: number;
    retryDelayMs?: number;
    fallbackModels?: string[]; // si el provider falla/no hay endpoints
  }
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "HTTP-Referer": (typeof window !== "undefined" ? window.location.origin : ""),
    "X-Title": (typeof document !== "undefined" ? (document.title || "Variamos") : "Variamos")
  };

  const tryOnce = async (mdl: string) => {
    const body = {
      model: mdl,
      messages: systemContent
        ? [{ role: "system", content: systemContent }, { role: "user", content: userContent }]
        : [{ role: "user", content: userContent }]
    };
    const resp = await fetch(OPENROUTER_URL, { method: "POST", headers, body: JSON.stringify(body) });
    const rawText = await resp.text();
    let data: any = null;
    try { data = JSON.parse(rawText); } catch { /* noop */ }

    if (!resp.ok) {
      const msg = data?.error?.message || rawText || `HTTP ${resp.status}`;
      const status = resp.status;
      throw Object.assign(new Error(msg), { status });
    }

    // Anti-fallback si pediste :free
    const usedModel = data?.model || data?.choices?.[0]?.model || data?.choices?.[0]?.provider;
    const requestedIsFree = MODEL_OPTIONS.some(m => m.id === mdl && m.free);
    if (requestedIsFree && usedModel && !/:free(\b|$)/i.test(String(usedModel))) {
      throw new Error(`The free pool is not available. (used: ${usedModel})`);
    }
    return String(data?.choices?.[0]?.message?.content ?? "");
  };

  const {
    maxRetries = 2,
    retryDelayMs = 600,
    fallbackModels = MODEL_OPTIONS.filter(m => m.free && m.id !== modelId).map(m => m.id)
  } = opts || {};

  let attempt = 0;
  let curModel = modelId;
  let usedFallbackIdx = -1;

  while (true) {
    try {
      return await tryOnce(curModel);
    } catch (err: any) {
      const msg = String(err?.message || err);
      const st = Number(err?.status || 0);
      const retriable = st === 429 || (st >= 500 && st <= 599) || /provider returned error/i.test(msg);
      const noEndpoint = /no endpoints found/i.test(msg);

      if (noEndpoint || /free pool is not available/i.test(msg)) {
        // prueba con otro modelo gratuito
        usedFallbackIdx++;
        if (usedFallbackIdx < fallbackModels.length) {
          curModel = fallbackModels[usedFallbackIdx];
          continue;
        }
        // sin fallback disponible → cae al mecanismo de reintentos con el modelo original
      }

      if (retriable && attempt < maxRetries) {
        attempt++;
        const backoff = retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      throw err;
    }
  }
}




type IntentResult = { intent: "create" | "edit"; language?: string; confidence?: number };

const heuristicIntent = (text: string, hasSelection: boolean): IntentResult => {
  const t = text.toLowerCase();
  // Palabras en varios idiomas (muy cortita solo como fallback)
  const createHints = [
    "nuevo modelo", "modelo nuevo", "crear modelo", "crear un modelo", "genera un modelo",
    "new model", "create a new model", "another model", "separate model",
    "novo modelo", "criar modelo", "model novo",
    "nouveau modèle", "créer un modèle",
    "nuovo modello", "crea un modello",
    "neues modell", "neues model", "neues modell anlegen"
  ];
  const editHints = [
    "editar", "modifica", "cambia", "agrega", "añade", "elimina", "borra", "conecta", "relaciona", "renombra", "ajusta", "actualiza", "set ",
    "edit", "modify", "change", "add ", "remove", "delete", "connect", "rename", "update", "set ",
    "editar", "alterar", "adicionar", "remover", "conectar", "renomear",
    "modifier", "ajouter", "supprimer", "connecter", "renommer",
    "modificare", "aggiungi", "rimuovi", "collega", "rinomina",
    "bearbeiten", "ändern", "hinzufügen", "entfernen", "verbinden", "umbenennen", "aktualisieren"
  ];
  if (createHints.some(h => t.includes(h))) return { intent: "create", confidence: 0.6 };
  if (editHints.some(h => t.includes(h))) return { intent: "edit", confidence: 0.6 };
  // Ambiguo → si hay selección, preferimos editar
  return { intent: hasSelection ? "edit" : "create", confidence: 0.4 };
};

const heuristicIntentFallback = (text: string, hasSelection: boolean): IntentResult => {
  const t = text.toLowerCase();

  // CREATE hints en varios idiomas
  const createHints = [
    "nuevo modelo", "modelo nuevo", "crear modelo", "crear un modelo", "genera un modelo",
    "new model", "create a new model", "another model", "separate model", "duplicate model", "duplicar modelo",
    "novo modelo", "criar modelo", "model novo",
    "nouveau modèle", "créer un modèle",
    "nuovo modello", "crea un modello",
    "neues modell", "modell anlegen"
  ];

  // EDIT hints (mucho más amplio, incluye “quítame”, “sácala”, etc.)
  const editHints = [
    "editar", "modifica", "cambia", "agrega", "añade", "elimina", "borra", "conecta", "relaciona", "renombra", "ajusta", "actualiza", "set ",
    "edit", "modify", "change", "add ", "remove", "delete", "connect", "rename", "update", "set ",
    "quítame", "quitame", "quita", "sácala", "sacala", "sácalo", "sacalo", "borra esa", "elimina esa", "remueve",
    "alterar", "adicionar", "remover", "conectar", "renomear",
    "modifier", "ajouter", "supprimer", "connecter", "renommer",
    "modificare", "aggiungi", "rimuovi", "collega", "rinomina",
    "bearbeiten", "ändern", "hinzufügen", "entfernen", "verbinden", "umbenennen", "aktualisieren"
  ];

  if (createHints.some(h => t.includes(h))) return { intent: "create", confidence: 0.55 };
  if (editHints.some(h => t.includes(h))) return { intent: "edit", confidence: 0.55 };
  return { intent: hasSelection ? "edit" : "create", confidence: 0.4 };
};


async function detectIntentWithAI(
  apiKey: string,
  modelId: string, // modelo rápido para la cascada
  userText: string,
  hasSelection: boolean
): Promise<IntentResult> {
  // Prompt multilingüe + política de desempate explícita
  const system = [
    "You are an intent classifier for a model-editing tool. The user may write in ANY language.",
    "Classify the instruction as either CREATE (make a brand-new/separate model) or EDIT (modify the currently selected model).",
    "Rules:",
    "- If the message asks to add/rename/delete/remove/connect/link/relate/set/fix/update/refactor/complete something in the existing model, it's EDIT.",
    "- If it asks to generate/produce/build a new/separate/another model/template from scratch, it's CREATE.",
    `- If ambiguous and hasSelection=${hasSelection}, prefer EDIT when true, else CREATE.`,
    'Return ONLY valid JSON (no backticks): {"intent":"create|edit","language":"<auto-detected or empty>","confidence":0..1}',
    "",
    // Ejemplos en varios idiomas (no son listas de palabras, son demostraciones de salida)
    'User: "genera un modelo para representar el ecommerce" → {"intent":"create"}',
    'User: "quítame la feature NFC" → {"intent":"edit"}',
    'User: "haz otro modelo con pagos" → {"intent":"create"}',
    'User: "add a relation between A and B" → {"intent":"edit"}',
    'User: "cria um novo modelo de pagamentos" → {"intent":"create"}',
    'User: "remova a feature NFC" → {"intent":"edit"}',
    'User: "créer un modèle distinct pour les rôles" → {"intent":"create"}',
    'User: "relie A à B" → {"intent":"edit"}',
    'User: "erstelle ein neues Modell für Zahlungen" → {"intent":"create"}',
    'User: "verbinde A mit B" → {"intent":"edit"}',
    'User: "crea un nuovo modello per i sensori" → {"intent":"create"}',
    'User: "rinomina la feature X" → {"intent":"edit"}'
  ].join("\n");

  const user = `User:\n${userText}\n\nhasSelection=${hasSelection}`;

  // 1) Intento con cascada de modelos (multimodel fallback)
  try {
    const { text } = await callOpenRouterCascade(
      apiKey,
      modelId,
      user,
      system,
      {
        perModelRetries: 1,
        validate: (out) => {
          const p = safeParseJSON(stripCodeFences(out));
          return !!p && (p.intent === "create" || p.intent === "edit");
        }
      }
    );
    const parsed = safeParseJSON(stripCodeFences(text)) as IntentResult | null;
    if (parsed && (parsed.intent === "create" || parsed.intent === "edit")) {
      // 2) Fallback neutral si la confianza es baja o falta
      const conf = typeof parsed.confidence === "number" ? parsed.confidence : 0.0;
      if (conf < 0.5) {
        return hasSelection ? { intent: "edit", confidence: 0.5, language: parsed.language }
          : { intent: "create", confidence: 0.5, language: parsed.language };
      }
      return parsed;
    }
  } catch {
    // cae al fallback neutral
  }

  // 3) Fallback neutral SIN listas por idioma:
  //    si hay un modelo seleccionado → EDIT; si no → CREATE
  return hasSelection ? { intent: "edit", confidence: 0.5 } : { intent: "create", confidence: 0.5 };
}


type ChatbotProps = {
  projectService?: ProjectService;
};

/** ===== Chatbot ===== */
const Chatbot: React.FC<ChatbotProps> = ({ projectService }) => {
  // PS por props o fallback a window
  const [ps, setPs] = useState<any>(projectService ?? null);
  const [modePref, setModePref] = useState<ModePref>("AUTO");
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [phase, setPhase] = useState<Phase>("DOMAIN");
  const [languageId, setLanguageId] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].id);
  const [apiKey] = useState<string>(() => process.env.REACT_APP_OPENROUTER_API_KEY || "");
  useEffect(() => { localStorage.setItem("openrouter_api_key", apiKey); }, [apiKey]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<Message[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (s: string) => setLog(prev => [...prev, s]);
  const lastModelIdRef = useRef<string | null>(null);

  // Vinculación por props (si llega)
  useEffect(() => {
    if (!projectService) return;
    setPs(projectService);
    const langs: Language[] = Array.isArray(projectService.languages) ? projectService.languages : [];
    setAllLanguages(langs);
    try {
      projectService.addLanguagesDetailListener?.(() => {
        const latest: Language[] = Array.isArray(projectService.languages) ? projectService.languages : [];
        setAllLanguages(latest);
      });
    } catch { }
    try { projectService.refreshLanguageList?.(); } catch { }
  }, [projectService]);

  // Fallback a window.projectService si no llegó por props
  useEffect(() => {
    if (projectService) return;
    const tryAttach = () => {
      const svc = (window as any).projectService;
      if (!svc) return false;
      setPs(svc);
      const langs: Language[] = Array.isArray(svc.languages) ? svc.languages : [];
      setAllLanguages(langs);
      try {
        svc.addLanguagesDetailListener?.(() => {
          const latest: Language[] = Array.isArray(svc.languages) ? svc.languages : [];
          setAllLanguages(latest);
        });
      } catch { }
      try { svc.refreshLanguageList?.(); } catch { }
      return true;
    };
    if (tryAttach()) return;
    const onReady = () => { tryAttach(); };
    window.addEventListener("projectservice:ready", onReady);
    let tries = 0;
    const id = setInterval(() => {
      if (tryAttach() || ++tries > 40) {
        clearInterval(id);
        window.removeEventListener("projectservice:ready", onReady);
      }
    }, 300);
    return () => {
      clearInterval(id);
      window.removeEventListener("projectservice:ready", onReady);
    };
  }, [projectService]);

  // Poll suave (mantengo tu mecanismo)
  useEffect(() => {
    if (!ps) return;
    let stop = false;
    let lastSig = "";
    const snapshot = (arr: Language[]) =>
      arr.map(l => `${getLanguageKey(l)}|${l.name}|${l.type}|${l.name?.length}`).join("§");
    const tick = () => {
      const arr: Language[] = Array.isArray((ps as any).languages) ? (ps as any).languages : [];
      const sig = snapshot(arr);
      if (sig && sig !== lastSig) {
        lastSig = sig;
        setAllLanguages([...arr]);
        addLog(`[ps] languages poll → ${arr.length}`);
      }
      if (!stop) setTimeout(tick, 350);
    };
    tick();
    return () => { stop = true; };
  }, [ps]);

  const phaseLanguages = useMemo(() => {
    if (!allLanguages?.length) return [];
    const filtered = allLanguages.filter(l => getLangPhase(l) === phase);
    return filtered.length ? filtered : allLanguages;
  }, [allLanguages, phase]);

  useEffect(() => {
    if (phaseLanguages.length) setLanguageId(getLanguageKey(phaseLanguages[0]));
    else setLanguageId("");
  }, [phaseLanguages]);

  const currentLanguage = useMemo(
    () => phaseLanguages.find(l => getLanguageKey(l) === languageId),
    [phaseLanguages, languageId]
  );

  useEffect(() => {
    const el = document.getElementById("chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, busy]);

  /** Helper: parsea string u objeto */
  const parseMaybeJson = (v: any): any | null => {
    if (!v) return null;
    if (typeof v === "string") {
      const parsed = safeParseJSON(v);
      if (!parsed) throw new Error(`"${v}" is not valid JSON`);
      return parsed;
    }
    if (typeof v === "object") return v;
    return null;
  };

  /** 3) Cargar abstractSyntax (string u objeto) */
  const getAbstract = (): AbstractSyntax => {
    try {
      const rawFromLang = currentLanguage?.abstractSyntax ?? null;
      let abs = parseMaybeJson(rawFromLang);

      if (!abs && ps?.getLanguageDefinition && currentLanguage?.name) {
        const def = ps.getLanguageDefinition(currentLanguage.name);
        const candidate = def?.abstractSyntax ?? def;
        abs = parseMaybeJson(candidate);
      }

      if (!abs || !abs.elements || !abs.relationships) {
        addLog("abstractSyntax vacío");
        return { elements: {}, relationships: {}, restrictions: {} };
      }

      const out: AbstractSyntax = {
        elements: abs.elements || {},
        relationships: abs.relationships || {},
        restrictions: abs.restrictions || {}
      };
      addLog(`[abstractSyntax] ok (elements=${Object.keys(out.elements).length}, relationships=${Object.keys(out.relationships).length})`);
      return out;
    } catch (e: any) {
      addLog(`[abstractSyntax] parse error: ${e?.message || e}`);
      return { elements: {}, relationships: {}, restrictions: {} };
    }
  };

  /** ===== Heurísticas derivadas del lenguaje y del prompt ===== */
  const buildPossibleValueIndex = (abs: AbstractSyntax) => {
    const idx = new Map<string, Array<{ element: string; prop: string }>>();
    for (const [elName, elDef] of Object.entries(abs.elements || {})) {
      for (const p of elDef.properties || []) {
        if (typeof p.possibleValues === "string" && p.possibleValues.trim()) {
          for (const tok of p.possibleValues.split(",").map(s => s.trim()).filter(Boolean)) {
            const arr = idx.get(tok) || [];
            arr.push({ element: elName, prop: p.name });
            idx.set(tok, arr);
          }
        }
      }
    }
    return idx;
  };

  const chooseDefaultElementType = (abs: AbstractSyntax) => {
    const elDefs = abs.elements || {};
    const relDefs = abs.relationships || {};
    const elems = Object.keys(elDefs);
    if (!elems.length) return "";
    const incoming = new Map<string, number>();
    for (const r of Object.values(relDefs)) {
      for (const t of r.target) incoming.set(t, (incoming.get(t) || 0) + 1);
    }
    return elems.reduce((best, k) =>
      (incoming.get(k) || 0) > (incoming.get(best) || 0) ? k : best, elems[0]);
  };

  const pickRelationTypeFor = (abs: AbstractSyntax, sourceType: string, targetType: string): string | null => {
    for (const [rname, rdef] of Object.entries(abs.relationships || {})) {
      if (rdef.source === sourceType && rdef.target.includes(targetType)) return rname;
    }
    return null;
  };

  const coerceElementFromTypos = (
    raw: any,
    allowedEl: Set<string>,
    pvIndex: Map<string, Array<{ element: string; prop: string }>>,
    defaultType: string,
    i: number
  ): PlanElement | null => {
    let name = String(raw?.name ?? "").trim();
    let type = String(raw?.type ?? "").trim();
    const props = (raw?.props && typeof raw.props === "object") ? { ...raw.props } : {};

    if (!allowedEl.has(type) && allowedEl.has(name)) { type = name; name = `${type}_${i + 1}`; }

    if (!allowedEl.has(type) && type) {
      const candidates = pvIndex.get(type);
      if (candidates && candidates.length) {
        const { element, prop } = candidates[0];
        (props as any)[prop] = type;
        type = element;
        if (!name) name = `${type}_${i + 1}`;
      }
    }

    if (!allowedEl.has(type)) type = defaultType;
    if (!allowedEl.has(type)) return null;

    if (!name) name = `${type}_${i + 1}`;
    return { name, type, ...(Object.keys(props).length ? { props } : {}) };
  };

  /** 4) Prompt del sistema enriquecido */
  const buildUnifiedSystemPrompt = (
    abs: AbstractSyntax,
    plk?: PLKnowledge,
    hasSelection: boolean = false,
    patchSchemaText: string = PATCH_SCHEMA_TEXT
  ) => {
    const elEntries = Object.entries(abs.elements || {});
    const relEntries = Object.entries(abs.relationships || {});
    const restr = abs.restrictions || {};
    const defaultElType = (() => {
      const elems = Object.keys(abs.elements || {});
      if (!elems.length) return "";
      const incoming = new Map<string, number>();
      for (const r of Object.values(abs.relationships || {})) {
        for (const t of r.target) incoming.set(t, (incoming.get(t) || 0) + 1);
      }
      return elems.reduce((best, k) =>
        (incoming.get(k) || 0) > (incoming.get(best) || 0) ? k : best, elems[0]);
    })();

    const elementsDesc = elEntries.map(([ename, edef]) => {
      const props = (edef.properties || []).map(p => {
        const pv = typeof p.possibleValues === "string" && p.possibleValues.trim() ? ` (possibleValues: ${p.possibleValues})` : "";
        const df = p.defaultValue !== undefined ? ` (default: ${p.defaultValue})` : "";
        return `- ${p.name}: ${p.type}${pv}${df}`;
      }).join("\n");
      return `* ${ename}${props ? `\n${props}` : ""}`;
    }).join("\n");

    const relsDesc = relEntries.map(([rname, rdef]) => {
      const props = (rdef.properties || []).map(p => {
        const pv = typeof p.possibleValues === "string" && p.possibleValues.trim() ? ` (possibleValues: ${p.possibleValues})` : "";
        const df = p.defaultValue !== undefined ? ` (default: ${p.defaultValue})` : "";
        return `- ${p.name}: ${p.type}${pv}${df}`;
      }).join("\n");
      return [
        `* ${rname}`,
        `  source: ${rdef.source}`,
        `  targets permitidos: [${rdef.target.join(", ")}]`,
        props ? `  properties:\n${props}` : `  properties: none`
      ].join("\n");
    }).join("\n");

    const restrLines: string[] = [];
    if (restr.quantity_element?.length) for (const q of restr.quantity_element) restrLines.push(`- quantity_element: element=${q.element}, min=${q.min}, max=${q.max}`);
    if (restr.unique_name?.elements?.length) restrLines.push(`- unique_name over groups: ${JSON.stringify(restr.unique_name.elements)}`);
    if (restr.parent_child?.length) for (const pc of restr.parent_child) restrLines.push(`- parent_child: child=${pc.childElement}, parent in [${pc.parentElement.join(", ")}]`);

    const plCtx = plk ? [
      `Contexto de la LP: "${plk.productLineName || "(sin nombre)"}"`,
      `- Lenguajes: ${plk.languages.join(", ") || "(n/a)"}`,
      `- Modelos (${plk.models.length}): ${plk.models.slice(0, 12).map(m => `[${m.phase}] ${m.name} <${m.type}>`).join("; ") || "(n/a)"}`,
      `- Glosario: ${plk.sameLang.knownElementNames.slice(0, 10).join(", ") || plk.knownElementNames.slice(0, 10).join(", ") || "(n/a)"}`,
      `- Tipos frecuentes: ${plk.sameLang.knownElementTypes.slice(0, 8).join(", ") || plk.knownElementTypes.slice(0, 8).join(", ") || "(n/a)"}`,
      `- Patrones: ${(plk.sameLang.relationshipPatterns.length ? plk.sameLang.relationshipPatterns : plk.relationshipPatterns)
        .slice(0, 12).map(p => `${p.type}: ${p.sourceType}→${p.targetType}`).join("; ") || "(n/a)"}`
    ].join("\n") : "(sin contexto de LP)";

    return [
      "Eres un asistente de modelado para una herramienta de Líneas de Producto.",
      "",
      "Salida obligatoria: **devuelve un único objeto JSON válido, sin backticks**, en UNO de estos dos formatos:",
      "A) **PATCH** (para modificar el modelo seleccionado): `{ \"ops\": [ ... ] }`",
      "   - Debe seguir exactamente este esquema:",
      patchSchemaText,
      "",
      "B) **PLAN** (para crear un modelo nuevo):",
      "{\"name\": string, \"elements\":[{\"name\": string, \"type\": string, \"props\"?: object}], \"relationships\":[{\"type\": string, \"source\": string, \"target\": string, \"props\"?: object}]}",
      "",
      hasSelection
        ? "- Hay un *modelo seleccionado*. Si la instrucción del usuario implica modificar/renombrar/eliminar/conectar/ajustar propiedades o consistencia del modelo, **devuelve PATCH**. Si requiere un nuevo modelo, **devuelve PLAN**."
        : "- No hay modelo seleccionado. **Debes devolver PLAN** para crear uno nuevo.",
      "",
      "Reglas del lenguaje (debes respetarlas estrictamente):",
      `- Usa tipos solo de 'Elementos permitidos'. Si dudas, usa '${defaultElType}'.`,
      "- `name` de cada elemento debe ser un concepto del dominio (no repitas el tipo).",
      "- Si una propiedad tiene 'possibleValues', usa exactamente uno de esos valores.",
      "- Relaciones: objetos con `type, source, target`. Para varios destinos, crea varios objetos.",
      "- `source` y `target` son **nombres de elementos** definidos en `elements`.",
      "",
      "Elementos permitidos y propiedades:",
      elementsDesc || "(sin elementos definidos)",
      "",
      "Relaciones permitidas:",
      relsDesc || "(sin relaciones definidas)",
      "",
      "Restricciones del lenguaje:",
      restrLines.length ? restrLines.join("\n") : "(sin restricciones declaradas)",
      "",
      "— Contexto de la línea de productos —",
      plCtx
    ].join("\n");
  };


  /** 5) Validación + normalización */
  const validateAndNormalizePlan = (planRaw: any, abs: AbstractSyntax, userText: string, plk?: PLKnowledge): PlanLLM => {
    let plan: PlanLLM | null = planRaw && typeof planRaw === "object" ? (planRaw as PlanLLM) : null;
    if (!plan?.elements && !plan?.relationships) {
      const mapped = nodesEdgesToPlan(planRaw);
      if (mapped) plan = mapped;
    }
    if (!plan) return { name: "Invalid", elements: [], relationships: [] };

    const elDefs = abs.elements || {};
    const relDefs = abs.relationships || {};
    const allowedEl = new Set(Object.keys(elDefs));
    const relNames = new Set(Object.keys(relDefs));
    const pvIndex = buildPossibleValueIndex(abs);
    const defaultElType = chooseDefaultElementType(abs);

    const domainTerms: string[] = [];

    const rawElems: any[] = Array.isArray(plan.elements) ? plan.elements : [];
    const elems: PlanElement[] = [];
    for (let i = 0; i < rawElems.length; i++) {
      const fixed = coerceElementFromTypos(rawElems[i], allowedEl, pvIndex, defaultElType, i);
      if (fixed) elems.push(fixed);
    }

    const typeCounters = new Map<string, number>();
    for (const e of elems) {
      const count = (typeCounters.get(e.type) || 0) + 1;
      typeCounters.set(e.type, count);
      if (!e.name || e.name === e.type) {
        e.name = `${e.type}_${count}`;
      }
    }

    const uniqueGroups = abs.restrictions?.unique_name?.elements || [];
    if (uniqueGroups.length) {
      for (const group of uniqueGroups) {
        const groupSet = new Set(group);
        const seen = new Set<string>();
        for (let i = 0; i < elems.length; i++) {
          if (!groupSet.has(elems[i].type)) continue;
          let base = elems[i].name;
          let name = base;
          let k = 2;
          while (seen.has(name)) name = `${base}_${k++}`;
          elems[i].name = name;
          seen.add(name);
        }
      }
    }

    const qty = abs.restrictions?.quantity_element || [];
    for (const q of qty) {
      if (!allowedEl.has(q.element)) continue;
      const count = elems.filter(e => e.type === q.element).length;
      if (q.min && count < q.min) {
        const toAdd = q.min - count;
        for (let i = 0; i < toAdd; i++) {
          const base = titleCase(q.element);
          const name = (count === 0 && i === 0) ? base : `${base}_${count + i + 1}`;
          elems.push({ name, type: q.element, props: {} });
        }
      }
    }

    const haveNames = new Set(elems.map(e => e.name));
    const toAddConcepts = domainTerms.filter(c => !haveNames.has(c));
    for (const c of toAddConcepts) {
      elems.push({ name: c, type: defaultElType, props: {} });
    }

    const name2type = new Map(elems.map(e => [e.name, e.type]));
    const firstByType = new Map<string, string>();
    for (const e of elems) if (!firstByType.has(e.type)) firstByType.set(e.type, e.name);

    const rawRels: any[] = Array.isArray(plan.relationships) ? plan.relationships : [];
    const expanded: Array<{ type: string; source: string; target: string; props?: any }> = [];
    for (const r of rawRels) {
      if (!r) continue;
      const tgtList: string[] = Array.isArray(r.targets) ? r.targets : (r.target ? [r.target] : []);
      if (!tgtList.length) continue;

      let sourceName = String(r.source ?? "").trim();
      if (!name2type.has(sourceName) && firstByType.has(sourceName)) {
        sourceName = firstByType.get(sourceName)!;
      }
      if (!name2type.has(sourceName)) continue;
      const sType = name2type.get(sourceName)!;

      for (let t of tgtList) {
        t = String(t ?? "").trim();
        let targetName = t;
        if (!name2type.has(targetName) && firstByType.has(targetName)) {
          targetName = firstByType.get(targetName)!;
        }
        if (!name2type.has(targetName)) continue;
        const tType = name2type.get(targetName)!;

        let rType = String(r.type ?? "").trim();
        if (!relNames.has(rType) || !(relDefs[rType].source === sType && relDefs[rType].target.includes(tType))) {
          const mapped = pickRelationTypeFor(abs, sType, tType);
          if (!mapped) continue;
          rType = mapped;
        }

        const props = (r.props && typeof r.props === "object") ? r.props : undefined;
        expanded.push({ type: rType, source: sourceName, target: targetName, props });
      }
    }

    if (allowedEl.has("RootFeature")) {
      const roots = elems.filter(e => e.type === "RootFeature").map(e => e.name);
      for (const root of roots) {
        const srcType = name2type.get(root)!;
        for (const e of elems) {
          if (e.name === root) continue;
          const mapped = pickRelationTypeFor(abs, srcType, e.type);
          if (!mapped) continue;
          const already = expanded.some(x => x.source === root && x.target === e.name);
          if (!already) expanded.push({ type: mapped, source: root, target: e.name });
        }
      }
    }

    const pattList = (plk?.sameLang?.relationshipPatterns?.length
      ? plk.sameLang.relationshipPatterns
      : (plk?.relationshipPatterns || [])).slice(0, 10);

    for (const p of pattList) {
      if (!relDefs[p.type]) continue;
      const sName = firstByType.get(p.sourceType);
      const tName = firstByType.get(p.targetType);
      if (!sName || !tName) continue;
      const exists = expanded.some(x => x.type === p.type && x.source === sName && x.target === tName);
      if (!exists) {
        const valid = relDefs[p.type].source === p.sourceType && relDefs[p.type].target.includes(p.targetType);
        if (valid) expanded.push({ type: p.type, source: sName, target: tName });
        else {
          const mapped = pickRelationTypeFor(abs, p.sourceType, p.targetType);
          if (mapped && !expanded.some(x => x.type === mapped && x.source === sName && x.target === tName)) {
            expanded.push({ type: mapped, source: sName, target: tName });
          }
        }
      }
    }
    const name = plan.name || "Generated Model";
    return { name, elements: elems, relationships: expanded };
  };

  // --- Dedupe + normalization helpers (avoid duplicates in EDIT) ---
  type ElementIndex = Map<string, { id: string; name: string; type: string }>;

  const buildElementIndexCI = (model: any): ElementIndex => {
    const idx: ElementIndex = new Map();
    for (const e of (model?.elements || [])) {
      idx.set(String(e.name).trim().toLowerCase(), { id: e.id, name: e.name, type: e.type });
    }
    return idx;
  };

  const findByNameCI = (model: any, name: string) => {
    const key = String(name || "").trim().toLowerCase();
    return (model?.elements || []).find((e: any) => String(e.name).trim().toLowerCase() === key) || null;
  };

  const canonicalizeName = (name: string, idx: ElementIndex) => {
    const key = String(name || "").trim().toLowerCase();
    return idx.get(key)?.name || name;
  };

  const relExists = (model: any, type: string, sName: string, tName: string) => {
    const s = findByNameCI(model, sName)?.id;
    const t = findByNameCI(model, tName)?.id;
    if (!s || !t) return false;
    return !!(model?.relationships || []).find((r: any) => r.type === type && r.sourceId === s && r.targetId === t);
  };

  const normalizeRefsInOps = (ops: any[], model: any) => {
    const idx = buildElementIndexCI(model);
    const fixRef = (ref: any) => {
      if (!ref) return ref;
      const token = String(ref.name ?? ref.id ?? "").trim();
      if (!token) return ref;
      const cname = canonicalizeName(token, idx);
      return { name: cname };
    };
    for (const op of ops) {
      if (op?.source) op.source = fixRef(op.source);
      if (op?.target) op.target = fixRef(op.target);
      if (op?.selector?.source || op?.selector?.target) {
        op.selector.source = fixRef(op.selector.source);
        op.selector.target = fixRef(op.selector.target);
      }
    }
  };
  type RefLike = { id?: string; name?: string } | null | undefined;
const getRefName = (ref: RefLike): string =>
  String(((ref as any)?.name ?? (ref as any)?.id ?? "")).trim();

type DeleteRelSelector = {
  id?: string;
  type?: string;
  relType?: string;
  source?: RefLike;
  target?: RefLike;
  sourceName?: string;
  targetName?: string;
};

const sanitizePatchForEdit = (patch: PatchEnvelope, model: any, abs: AbstractSyntax): PatchEnvelope => {
  const idx = buildElementIndexCI(model);
  const sanitized: PatchEnvelope = { ops: [] };

  // 0) Canonicaliza referencias para que "mobileDevice" apunte a "MobileDevice"
  normalizeRefsInOps(patch.ops || [], model);

  for (const op of (patch.ops || [])) {
    if (!op || !op.op) continue;

    // 1) Evitar duplicados de elementos en EDIT (case-insensitive)
    if (op.op === "createElement") {
      const name = String((op as any).name ?? "").trim();
      const type = String((op as any).type ?? "").trim();
      if (!name || !type) continue;
      const already = idx.has(name.toLowerCase());
      if (already) continue; // no duplicar
      sanitized.ops.push(op);
      idx.set(name.toLowerCase(), { id: "", name, type });
      continue;
    }

    // 2) Evitar duplicar relaciones exactas (usa helpers lazos)
    if (op.op === "connect") {
      const type = String((op as any).type ?? "").trim();
      const sName = getRefName((op as any).source);
      const tName = getRefName((op as any).target);
      if (!type || !sName || !tName) continue;

      if (relExists(model, type, sName, tName)) continue; // ya existe → descartar

      sanitized.ops.push(op);
      continue;
    }

    // 3) deleteRelationship con selector por nombres → resolver a id (selector laxo)
    if (op.op === "deleteRelationship") {
      const sel = ((op as any).selector || {}) as DeleteRelSelector;
      if (!sel.id) {
        const type = String(sel.type || sel.relType || "").trim();
        const sName = getRefName(sel.source) || String(sel.sourceName || "").trim();
        const tName = getRefName(sel.target) || String(sel.targetName || "").trim();
        if (type && sName && tName) {
          const sId = findByNameCI(model, sName)?.id;
          const tId = findByNameCI(model, tName)?.id;
          const rel = (model?.relationships || []).find(
            (r: any) => r.type === type && r.sourceId === sId && r.targetId === tId
          );
          if (rel) (op as any).selector = { id: rel.id };
        }
      }
      sanitized.ops.push(op);
      continue;
    }

    // Default: dejar pasar
    sanitized.ops.push(op);
  }

  return sanitized;
};
// Convierte un PLAN (name/elements/relationships) a un PATCH con ops createElement/connect.
// - Solo crea elementos que NO existan por nombre (case-insensitive).
// - Evita crear un segundo RootFeature si el modelo ya tiene uno.
// - Propiedades del plan se llevan como { name, value } (ajusta si tu PATCH requiere otro formato).
const planToPatch = (plan: PlanLLM, model: any, abs: AbstractSyntax): PatchEnvelope => {
  const ops: any[] = [];
  const allowedEl = new Set(Object.keys(abs.elements || {}));

  const hasRootAlready =
    Array.isArray(model?.elements) &&
    model.elements.some((e: any) => String(e?.type) === "RootFeature");

  const propsToPatchProps = (props?: Record<string, any>) => {
    if (!props || typeof props !== "object") return [];
    return Object.entries(props).map(([k, v]) => ({ name: k, value: String(v) }));
  };

  // 1) createElement para los que no existen ya por nombre (CI)
  const elems = Array.isArray(plan?.elements) ? plan.elements : [];
  for (const el of elems) {
    if (!el || !el.name || !el.type) continue;
    if (!allowedEl.has(el.type)) continue;

    const exists = !!findByNameCI(model, el.name);
    if (exists) {
      // Si quisieras actualizar props de existentes, aquí podrías emitir ops de setProperty.
      continue;
    }

    // Evita crear más de un RootFeature en modo de edición (regla defensiva)
    if (el.type === "RootFeature" && hasRootAlready) continue;

    const properties = propsToPatchProps(el.props);
    ops.push({
      op: "createElement",
      name: el.name,
      type: el.type,
      ...(properties.length ? { properties } : {})
    });
  }

  // 2) connect (si ya existían por nombre, se referencian por nombre; si son nuevos, se acaban de crear)
  const rels = Array.isArray(plan?.relationships) ? plan.relationships : [];
  for (const r of rels) {
    if (!r || !r.type || !r.source || !r.target) continue;
    const properties = propsToPatchProps(r.props);

    ops.push({
      op: "connect",
      type: r.type,
      source: { name: String(r.source) },
      target: { name: String(r.target) },
      ...(properties.length ? { properties } : {})
    });
  }

  return { ops };
};


  /** 6) Materializar PlanLLM como modelo Variamos */
  const materializeIntoModel = (model: any, gp: PlanLLM, abs: AbstractSyntax) => {
    const elDefs = abs.elements || {};
    const relDefs = abs.relationships || {};

    const gridW = 240, gridH = 140;
    let col = 0, row = 0;
    const nameToId = new Map<string, string>();

    for (const n of gp.elements) {
      const def = elDefs[n.type] as MetaElementDef | undefined;
      const defProps: any[] = (def?.properties || []).map(p => ({
        id: uuid(),
        name: p.name,
        type: p.type,
        value: p.defaultValue !== undefined
          ? String(p.defaultValue)
          : (typeof p.possibleValues === "string" && p.possibleValues.trim())
            ? p.possibleValues.split(",")[0].trim()
            : "",
        custom: false, display: true,
        comment: p.comment || "",
        possibleValues: p.possibleValues || "",
        linked_property: p.linked_property || null,
        linked_value: p.linked_value || null,
        options: (p as any).options || null,
        minCardinality: (p as any).minCardinality || "",
        maxCardinality: (p as any).maxCardinality || ""
      }));

      if (n.props && typeof n.props === "object") {
        for (const [k, v] of Object.entries(n.props)) {
          const idx = defProps.findIndex(pp => pp.name === k);
          if (idx >= 0) defProps[idx].value = String(v);
          else defProps.push({
            id: uuid(), name: k, type: "String", value: String(v),
            custom: true, display: true, comment: "",
            possibleValues: "", linked_property: null, linked_value: null,
            options: null, minCardinality: "", maxCardinality: ""
          });
        }
      }

      const x = 140 + col * gridW;
      const y = 90 + row * gridH;
      col = (col + 1) % 3; if (col === 0) row++;

      const el = {
        id: uuid(),
        type: n.type,
        name: n.name,
        x, y, width: 150, height: 60,
        parentId: null,
        properties: defProps
      };
      model.elements.push(el);
      nameToId.set(n.name, el.id);
    }

    for (const r of gp.relationships) {
      const def = relDefs[r.type] as MetaRelDef | undefined;
      if (!def) continue;
      const srcId = nameToId.get(r.source);
      const tgtId = nameToId.get(r.target);
      if (!srcId || !tgtId) continue;

      const relProps: any[] = (def.properties || []).map(p => ({
        id: uuid(),
        name: p.name,
        type: p.type,
        value: p.defaultValue !== undefined
          ? String(p.defaultValue)
          : (typeof p.possibleValues === "string" && p.possibleValues.trim())
            ? p.possibleValues.split(",")[0].trim()
            : "",
        custom: false, display: true,
        comment: p.comment || "",
        possibleValues: p.possibleValues || "",
        linked_property: p.linked_property || null,
        linked_value: p.linked_value || null
      }));

      if (r.props && typeof r.props === "object") {
        for (const [k, v] of Object.entries(r.props)) {
          const idx = relProps.findIndex(pp => pp.name === k);
          if (idx >= 0) relProps[idx].value = String(v);
          else relProps.push({
            id: uuid(), name: k, type: "String", value: String(v),
            custom: true, display: true, comment: "",
            possibleValues: "", linked_property: null, linked_value: null
          });
        }
      }

      model.relationships.push({
        id: uuid(),
        type: r.type,
        name: "_",
        sourceId: srcId,
        targetId: tgtId,
        points: [],
        min: def.min,
        max: def.max,
        properties: relProps
      });
    }
  };

  /** 7) Inyección al proyecto */
  const injectIntoProject = (gp: PlanLLM, lang: Language, ph: Phase, abs: AbstractSyntax) => {
    try {
      const langName = lang.name;
      const langIdStr = String(lang.id ?? lang.name);
      const createByPhase: Record<Phase, () => any> = {
        SCOPE: () => ps.createScopeModel(ps.project, langName, langIdStr, gp.name, "", "", ""),
        DOMAIN: () => ps.createDomainEngineeringModel(ps.project, langName, langIdStr, gp.name, "", "", ""),
        APPLICATION: () => (ps.getTreeItemSelected?.() === "applicationEngineering"
          ? ps.createApplicationEngineeringModel(ps.project, langName, langIdStr, gp.name, "", "", "")
          : ps.createApplicationModel(ps.project, langName, langIdStr, gp.name, "", "", ""))
      };
      const model = createByPhase[ph]();
      materializeIntoModel(model, gp, abs);
      ps.raiseEventSelectedModel(model);
      ps.saveProject?.();
      addLog(`[inject] ok → ${model.name}`);
      return model;
    } catch (e: any) {
      addLog(`[inject] error: ${e?.message || e}`);
      return null;
    }
  };

  const shouldCreateNew = (text: string): boolean => {
    const t = text.toLowerCase();
    const cuesCreate = [
      "crear modelo", "crear un modelo", "nuevo modelo", "modelo nuevo",
      "create a new model", "new model", "otro modelo", "separate model", "duplicar modelo"
    ];
    return cuesCreate.some(p => t.includes(p));
  };

  const looksLikeEdit = (text: string): boolean => {
    const t = text.toLowerCase();
    const cuesEdit = [
      "renombra", "rename", "agrega", "añade", "add ",
      "elimina", "borra", "remove", "conecta", "relaciona", "connect",
      "set ", "establece", "cambia", "modifica", "update", "editar", "edit"
    ];
    return cuesEdit.some(p => t.includes(p));
  };

  /** 8) Enviar mensaje */
  // =========
  // send (con IA para intención + descomposición de tareas + refresco de canvas)
  // =========
// =========
// send (EDIT si así lo indica override/selector; CREATE si así lo indica; AUTO: Edit si hay selección, si no Create)
// =========
const send = async (userText: string) => {
  if (busy) return;
  setBusy(true);

  if (!ps || !currentLanguage) { addLog("ps/language not available"); setBusy(false); return; }

  const stageStep = (s: string) => { setStage(s); addLog(`[stage] ${s}`); };

  stageStep("Preparing prompt");
  const abs = getAbstract();
  if (!Object.keys(abs.elements).length) { addLog("abstractSyntax void"); setBusy(false); return; }

  if (!apiKey) {
    setThread(prev => [...prev, { role: "assistant", content: "Your OpenRouter API Key is missing. Enter the key in the header field." }]);
    setBusy(false);
    return;
  }

  stageStep("Gathering context from the product line…");
  const plKnowledge = harvestProductLineKnowledge(ps, currentLanguage);

  // Modelo objetivo
  const selectedId = ps.getTreeIdItemSelected?.();
  let targetModel = selectedId ? ps.findModelById(ps.project, selectedId) : null;
  if (!targetModel && lastModelIdRef.current) {
    targetModel = ps.findModelById(ps.project, lastModelIdRef.current);
  }
  const hasSelection = !!targetModel;

  // --- override por comando + preferencia de UI
  const { clean: cleanUserText, forced } = extractInlineMode(userText);
  const effectiveMode: "EDIT" | "CREATE" =
    forced ||
    (modePref === "AUTO" ? (hasSelection ? "EDIT" : "CREATE") : modePref);

  // — UI —
  let placeholderIdx = -1;
  setThread(prev => {
    const next: Message[] = [...prev, { role: "user" as Role, content: String(userText) }, { role: "assistant" as Role, content: "__typing__" }];
    placeholderIdx = next.length - 1;
    return next;
  });

  const forceRefresh = (model?: any) => {
    if (model) ps.raiseEventSelectedModel?.(model);
    ps.requestRender?.();
    ps.repaint?.();
  };

  // Resolver deleteRelationship por nombres → id (helper externo)
  const resolveLooseSelectors = (patch: PatchEnvelope, model: any) => {
    const elByName = new Map<string, any>();
    for (const e of (model?.elements || [])) elByName.set(String(e.name), e);
    const findRelId = (type: string, sName: string, tName: string) => {
      const s = elByName.get(sName)?.id;
      const t = elByName.get(tName)?.id;
      if (!s || !t) return null;
      const r = (model?.relationships || []).find((rr: any) =>
        rr.type === type && rr.sourceId === s && rr.targetId === t);
      return r?.id || null;
    };
    for (const op of (patch?.ops || [])) {
      if (op.op === "deleteRelationship" && op.selector && !op.selector.id) {
        const sel = op.selector as any;
        const type = sel.type || sel.relType || "";
        const sName = sel?.source?.name || sel?.sourceName || "";
        const tName = sel?.target?.name || sel?.targetName || "";
        if (type && sName && tName) {
          const rid = findRelId(type, sName, tName);
          if (rid) op.selector = { id: rid };
        }
      }
    }
  };

  // Descomponer en pasos en EDIT
  const decomposeIfNeeded = async (text: string, enabled: boolean) => {
    if (!enabled) return [text];
    const sys = [
      "You split a user modeling instruction (any language) into ordered, minimal edit steps.",
      "Each step must be self-contained and executable against the current model.",
      "Return JSON with an array 'steps' of strings. No backticks.",
      `Example output: {"steps":["create X and connect ...","delete relation ...","remove feature Y"]}`
    ].join("\n");

    const { text: out } = await callOpenRouterCascade(
      apiKey,
      selectedModel,
      `Instruction:\n${text}`,
      sys,
      {
        perModelRetries: 1,
        validate: (raw) => {
          const parsed = safeParseJSON(stripCodeFences(raw));
          return Array.isArray(parsed?.steps) && parsed.steps.every((s: any) => typeof s === "string");
        }
      }
    );

    const parsed = safeParseJSON(stripCodeFences(out));
    return (Array.isArray(parsed?.steps) ? parsed.steps : [text]) as string[];
  };

  try {
    const genModelId = selectedModel;

    // =======================
    // EDIT (PATCH por pasos)
    // =======================
    if (effectiveMode === "EDIT") {
      const steps = await decomposeIfNeeded(cleanUserText, true);

      for (let i = 0; i < steps.length; i++) {
        const subGoal = steps[i];
        const snapshot = buildSnapshot(targetModel);

        const idPolicy =
          "\nSTRICT EDIT MODE:" +
          "\n- You MUST return a PATCH object only (no PLAN)." +
          "\n- NEVER create a new RootFeature; modify the existing model." +
          "\n- Do NOT invent UUIDs; refer to elements/relationships by names only." +
          "\n- If an element already exists (case-insensitive), REUSE it; never duplicate." +
          "\n- For deletions, if you don't know the relationship id, use selector {type, source.name, target.name}." +
          "\n- Apply ALL requested changes for this step in a single PATCH.";

        const sys = buildUnifiedSystemPrompt(abs, plKnowledge || undefined, true, PATCH_SCHEMA_TEXT) + idPolicy;
        const prompt = buildEditPrompt({ snapshot, userGoal: subGoal, patchSchema: PATCH_SCHEMA_TEXT });

        stageStep(`Calling API… (edit step ${i + 1}/${steps.length})`);
        const { text: botText, usedModelId } = await callOpenRouterCascade(
          apiKey,
          genModelId,
          prompt,
          sys,
          {
            perModelRetries: 1,
            validate: (raw) => !!safeParseJSON(stripCodeFences(raw))
          }
        );

        setThread(prev => {
          const copy = [...prev];
          copy[placeholderIdx] = {
            role: "assistant",
            content: (botText || "(no content)") + `\n\n— Modelo: ${modelLabel(usedModelId)}`
          };
          return copy;
        });
        if (!botText) continue;

        const parsed = safeParseJSON(stripCodeFences(botText));
        if (!parsed) throw new Error("La respuesta no es JSON válido.");

        // Si el LLM se equivoca y manda PLAN en EDIT → convertimos a PATCH
        let env: PatchEnvelope;
        if (Array.isArray((parsed as any).ops)) {
          env = parsed as PatchEnvelope;
        } else if ((parsed as any).elements) {
          env = planToPatch(parsed as PlanLLM, targetModel, abs);
        } else {
          throw new Error("La respuesta no contiene PATCH ni PLAN reconocible.");
        }

        // Sanitizar + resolver deletes
        env = sanitizePatchForEdit(env, targetModel, abs);
        resolveLooseSelectors(env, targetModel);

        if (!env.ops.length) {
          addLog("[edit] Patch quedó vacío tras sanitizar (no-ops).");
        } else {
          stageStep(`Applying patch (${env.ops.length} ops)…`);
          applyPatch(ps, targetModel, env);
          lastModelIdRef.current = targetModel!.id;
          forceRefresh(targetModel);
        }
      }

      ps.saveProject?.();
      stageStep("Done ✅");
      return;
    }

    // =======================
    // CREATE (nuevo modelo)
    // =======================
    const langName = (currentLanguage?.name) || ps.getSelectedLanguage?.() || "Generic Language";
    const prompt = buildCreatePrompt({ languageName: langName, userGoal: cleanUserText, patchSchema: PATCH_SCHEMA_TEXT });
    const sysCreate =
      buildUnifiedSystemPrompt(abs, plKnowledge || undefined, false, PATCH_SCHEMA_TEXT) +
      "\nIMPORTANT: Prefer returning a PLAN object for creation. If you still return PATCH, only use createElement/connect ops. " +
      "Never invent UUIDs; refer to elements by names in source/target.";

    stageStep("Calling API… (create)");
    const { text: botText, usedModelId } = await callOpenRouterCascade(
      apiKey,
      genModelId,
      prompt,
      sysCreate,
      {
        perModelRetries: 1,
        validate: (raw) => !!safeParseJSON(stripCodeFences(raw))
      }
    );

    setThread(prev => {
      const copy = [...prev];
      copy[placeholderIdx] = {
        role: "assistant",
        content: (botText || "(no content)") + `\n\n— Modelo: ${modelLabel(usedModelId)}`
      };
      return copy;
    });
    if (!botText) return;

    const parsed = safeParseJSON(stripCodeFences(botText));
    if (!parsed) throw new Error("La respuesta del modelo no es JSON válido.");

    // Si vino PATCH → convertir a PLAN para inyectar
    const patchToPlan = (patch: any): PlanLLM => {
      const elements: { name: string; type: string; props?: Record<string, any> }[] = [];
      const relationships: { type: string; source: string; target: string; props?: Record<string, any> }[] = [];
      const have = new Set<string>();
      const getNameFromRef = (ref: any) => (ref?.name || ref?.id || "").toString();

      for (const op of (patch?.ops || [])) {
        if (!op || !op.op) continue;
        if (op.op === "createElement") {
          const name = String(op.name ?? "").trim();
          const type = String(op.type ?? "").trim();
          if (!name || !type) continue;
          if (!have.has(name)) {
            const props: Record<string, any> = {};
            if (Array.isArray(op.properties)) for (const p of op.properties) if (p?.name) props[p.name] = p.value ?? "";
            elements.push({ name, type, ...(Object.keys(props).length ? { props } : {}) });
            have.add(name);
          }
        }
        if (op.op === "connect") {
          const type = String(op.type ?? "").trim();
          const source = getNameFromRef(op.source);
          const target = getNameFromRef(op.target);
          if (!type || !source || !target) continue;
          const props: Record<string, any> = {};
          if (Array.isArray(op.properties)) for (const p of op.properties) if (p?.name) props[p.name] = p.value ?? "";
          relationships.push({ type, source, target, ...(Object.keys(props).length ? { props } : {}) });
        }
      }
      return { name: "Generated Model", elements, relationships };
    };

    let planCandidate: any = parsed;
    if (Array.isArray((parsed as any).ops)) {
      addLog("[create] PATCH detected → converting to PLAN");
      planCandidate = patchToPlan(parsed);
    } else if (parsed.nodes || parsed.edges) {
      planCandidate = nodesEdgesToPlan(parsed);
    }

    stageStep("Validating and normalizing (plan)...");
    const plan = validateAndNormalizePlan(planCandidate, abs, cleanUserText, plKnowledge || undefined);
    if (!plan || !plan.elements.length) throw new Error("PLAN vacío tras validación.");

    stageStep("Inyectando al proyecto…");
    const created = injectIntoProject(plan, currentLanguage as Language, phase, abs);
    if (created?.id) lastModelIdRef.current = created.id;

    stageStep("Listo ✅");
    return;

  } catch (e: any) {
    stageStep("Error");
    addLog(`[error] ${e?.message || e}`);
    setThread(prev => {
      const copy = [...prev];
      copy[placeholderIdx] = { role: "assistant", content: "Error: " + (e?.message || e) };
      return copy;
    });
  } finally {
    setBusy(false);
    setTimeout(() => setStage(""), 1200);
  }
};






    /** 9) UI: Enter = enviar */
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !busy) {
        const t = input.trim();
        if (t) {
          setInput("");
          void send(t);
        }
      }
    };

    /* ===== Render ===== */
    return (
      <div className="chatbot">
        {/* Header */}
        <div className="chat-hd">
          <div>
            <label>Phase</label>
            <select className="select" value={phase} onChange={e => setPhase(e.target.value as Phase)}>
              <option value="SCOPE">Scope</option>
              <option value="DOMAIN">Domain</option>
              <option value="APPLICATION">Application</option>
            </select>
          </div>
          <div>
            <label>Language</label>
            <select className="select" value={languageId} onChange={e => setLanguageId(e.target.value)}>
              <option value="">— Select language —</option>
              {phaseLanguages.map(l => {
                const key = getLanguageKey(l);
                return (
                  <option key={key} value={key}>
                    {l.name} ({l.type})
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label>AI model</label>
            <select className="select" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
              {MODEL_OPTIONS.map(m => (
                <option key={m.id} value={m.id}>{m.label}{m.free ? " (free)" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversación */}
        <div className="chat-body" id="chat-scroll">
          {thread.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "user" : "bot"}`}>
              <div className="bubble">
                {m.content === "__typing__" ? <Typing /> : m.content}
              </div>
              <div className="meta">{m.role === "user" ? "You" : m.role === "assistant" ? "bot" : "Sys"}</div>
            </div>
          ))}
        </div>

        {/* Barra de estado */}
        {busy && (
          <div className="statusbar">
            <div className="spinner" />
            <span>{stage || "Processing…"}</span>
          </div>
        )}

        {/* Input */}
        <div className="chat-ft">
          <input
            placeholder={busy ? "Generating…" : "Describe the model you want and press Enter.…"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
          />
          <button disabled={busy || !input.trim()} onClick={() => { const t = input.trim(); if (t) { setInput(""); void send(t); } }}>
            Send
          </button>
        </div>

        {/* Log plegable */}
        <details className="logbox">
          <summary>Log</summary>
          <pre>{log.join("\n")}</pre>
        </details>
      </div>
    );
  };

  export default Chatbot;
