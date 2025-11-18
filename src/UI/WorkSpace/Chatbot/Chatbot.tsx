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

import treeCollaborationService from "../../../DataProvider/Services/collab/treeCollaborationService";

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

type ValueProp = { name: string; value: string };

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

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(s || ""));


const stripCodeFences = (t: string) => {
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) return fence[1];
  const curly = t.match(/\{[\s\S]*\}$/);
  if (curly) return curly[0];
  return t.trim();
};


const extractFirstJsonObject = (t: string) => {
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) return fence[1];
  for (let i = t.indexOf("{"); i >= 0; i = t.indexOf("{", i + 1)) {
    for (let j = t.lastIndexOf("}"); j > i; j = t.lastIndexOf("}", j - 1)) {
      const sub = t.slice(i, j + 1).trim();
      try { JSON.parse(sub); return sub; } catch { }
    }
  }
  return t.trim();
};

const softJsonRepair = (raw: string) => {
  let s = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\").replace(/,\s*([}\]])/g, "$1");
  const looksLikeSingle = /(^|[:,{\[])\s*'([^']*)'\s*([}\],:])/m.test(s);
  if (looksLikeSingle) s = s.replace(/'([^'\\]|\\.)*'/g, (m) => `"${m.slice(1, -1).replace(/"/g, '\\"')}"`);
  return s;
};

const looksLikePatch = (o: any) => !!o && Array.isArray(o.ops);
const looksLikePlan = (o: any) => !!o && (Array.isArray(o.elements) || Array.isArray(o.nodes) || Array.isArray(o.relationships));


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

// Pon esto cerca de harvestProductLineKnowledge (mismo archivo)
// Pon esto cerca de harvestProductLineKnowledge (mismo archivo)
const renderProjectMemory = (plk?: PLKnowledge, lang?: Language) => {
  if (!plk) return "";

  const langKey = lang ? getLanguageKey(lang) : null;
  const same = plk.sameLang ?? {
    knownElementNames: plk.knownElementNames,
    knownElementTypes: plk.knownElementTypes,
    relationshipPatterns: plk.relationshipPatterns,
    rootNames: plk.rootNames
  };

  const isSameLang = (t: string) => {
    if (!lang) return false;
    const tt = String(t);
    return (
      tt === String(langKey) ||
      tt === String(lang?.name) ||
      tt === String(lang?.id)
    );
  };

  const modelsSameLang = plk.models
    .filter(m => isSameLang(m.type))
    .slice(0, 12)
    .map(m => `- [${m.phase}] ${m.name}`)
    .join("\n");

  const rels = same.relationshipPatterns
    .slice(0, 12)
    .map(p => `${p.type}: ${p.sourceType}→${p.targetType}`)
    .join("; ");

  // NUEVO: listas explícitas de conceptos para guiar reuso
  const globalConcepts = plk.knownElementNames.slice(0, 30).join(", ");
  const sameLangConcepts = same.knownElementNames.slice(0, 20).join(", ");
  const roots = same.rootNames.length ? same.rootNames.join(", ") : "(none)";
  const sameTypes = same.knownElementTypes.slice(0, 12).join(", ") || "(none)";

  return [
    "PROJECT MEMORY (traceability-aware):",
    modelsSameLang || "(no models in this language yet)",
    "",
    `Common root features: ${roots}`,
    `Frequent element types (same language): ${sameTypes}`,
    `Frequent names (same language): ${sameLangConcepts || "(none)"}`,
    `Frequent names (global PL): ${globalConcepts || "(none)"}`,
    `Frequent relationship patterns: ${rels || "(none)"}`,
    "",
    "TRACEABILITY DIRECTIVES (STRICT):",
    "- Reuse EXACT element NAMES from the lists above when the user asks for a new model in a different language (e.g., Requirements derived from a Domain/Variability model).",
    "- When the abstract syntax allows it, create explicit relationships from the new elements (e.g., FunctionalRequirement/SecurityRequirement/UseCase/etc.) to those existing domain concepts—pick a valid relationship type from the meta (see 'Relationships' section in the system prompt).",
    "- If the root is unspecified, prefer one from 'Common root features'.",
    "- Never use internal ids in refs; only element NAMES.",
  ].join("\n");
};




const harvestProductLineKnowledge = (ps: any, currentLanguage?: Language, maxItems = 20): PLKnowledge | null => {
  try {
    const project = ps?.getProject?.() ?? ps?.project ?? null;
    if (!project?.productLines?.length) return null;

    // Product line actual (por índice si existe)
    let plIdx = 0;
    try {
      const idx = ps.getIdCurrentProductLine?.();
      if (Number.isInteger(idx) && idx >= 0 && idx < project.productLines.length) plIdx = idx;
    } catch { /* ignore */ }

    const pl = project.productLines[plIdx];
    if (!pl) return null;

    // Recolecta TODOS los modelos de la PL (con etiqueta de fase)
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

    // Contadores globales
    const nameCount = new Map<string, number>();
    const typeCount = new Map<string, number>();
    const rootNameCount = new Map<string, number>();
    const relPatternCount = new Map<
      string,
      { type: string; sourceType: string; targetType: string; n: number }
    >();

    // Contadores "mismo lenguaje"
    const langKey = currentLanguage ? getLanguageKey(currentLanguage) : null;
    const isSameLang = (mm: any) => {
      const t = String(mm?.type || "");
      return (
        !!langKey &&
        (t === String(langKey) || t === String(currentLanguage?.name) || t === String(currentLanguage?.id))
      );
    };

    const sameLangNames = new Map<string, number>();
    const sameLangTypes = new Map<string, number>();
    const sameLangRootNames = new Map<string, number>();
    const sameLangPatterns = new Map<
      string,
      { type: string; sourceType: string; targetType: string; n: number }
    >();

    const add = (map: Map<string, number>, k: string, inc = 1) =>
      map.set(k, (map.get(k) || 0) + inc);

    const addPattern = (
      map: Map<string, { type: string; sourceType: string; targetType: string; n: number }>,
      p: { type: string; sourceType: string; targetType: string }
    ) => {
      const key = `${p.type}::${p.sourceType}->${p.targetType}`;
      const cur = map.get(key) || { ...p, n: 0 };
      cur.n += 1;
      map.set(key, cur);
    };

    for (const m of allModels) {
      const same = isSameLang(m);

      // Índice por id para resolver patrones de relaciones
      const elemById: Record<string, any> = {};
      for (const e of (m?.elements || [])) {
        if (!e?.name || !e?.type) continue;
        elemById[String(e.id)] = e;

        add(nameCount, String(e.name));
        add(typeCount, String(e.type));
        if (String(e.type) === "RootFeature") add(rootNameCount, String(e.name));

        if (same) {
          add(sameLangNames, String(e.name));
          add(sameLangTypes, String(e.type));
          if (String(e.type) === "RootFeature") add(sameLangRootNames, String(e.name));
        }
      }

      for (const r of (m?.relationships || [])) {
        const s = elemById[String(r.sourceId)];
        const t = elemById[String(r.targetId)];
        if (!s?.type || !t?.type || !r?.type) continue;

        const patt = { type: String(r.type), sourceType: String(s.type), targetType: String(t.type) };
        addPattern(relPatternCount, patt);
        if (same) addPattern(sameLangPatterns, patt);
      }
    }

    const topKeys = (map: Map<string, number>, n = maxItems) =>
      [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

    const topPatterns = (
      map: Map<string, { type: string; sourceType: string; targetType: string; n: number }>,
      n = maxItems
    ) => [...map.values()].sort((a, b) => b.n - a.n).slice(0, n).map(({ n: _n, ...rest }) => rest);

    return {
      productLineName: pl?.name || "",
      languages: Array.from(
        new Set(allModels.map(m => String(m?.type || "")).filter(Boolean))
      ),
      models: allModels.map(m => ({
        phase: m.__phase,
        type: String(m?.type || ""),
        name: String(m?.name || "")
      })),
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

// =======================
// callOpenRouterCascade
// =======================
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
    "X-Title": (typeof document !== "undefined" ? (document.title || "Variamos") : "Variamos"),
  };

  const {
    perModelRetries = 1,
    retryDelayMs = 600,
    validate,
  } = opts || {};

  const FETCH_TIMEOUT_MS = 25000; // timeout defensivo (no añadimos nueva opción pública)
  const order = buildCascadeOrder(primaryModelId); // SIEMPRE primero el modelo elegido por el usuario
  const errors: string[] = [];

  const tryOnce = async (mdl: string) => {
    // helper local para timeout (no crea nuevas funciones a nivel módulo)
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const body = {
      model: mdl,
      messages: systemContent
        ? [{ role: "system", content: systemContent }, { role: "user", content: userContent }]
        : [{ role: "user", content: userContent }],
    };

    let resp: Response;
    try {
      resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(t);
    }

    const rawText = await resp.text();
    let data: any = null;
    try { data = JSON.parse(rawText); } catch { /* ok, algunos 5xx devuelven HTML */ }

    const mkErr = (status: number, msg: string) => {
      const e: any = new Error(msg || `HTTP ${status}`);
      e.status = status;
      // Propaga Retry-After si existe
      const ra = resp.headers?.get?.("retry-after");
      if (ra) {
        const n = Number(ra);
        e.retryAfterMs = Number.isFinite(n) ? Math.max(0, n) * 1000 : 0;
      }
      return e;
    };

    if (!resp.ok) {
      const msg = data?.error?.message || rawText || `HTTP ${resp.status}`;
      throw mkErr(resp.status, msg);
    }

    // Anti-fallback si pediste :free, evita upgrades silenciosos a modelos de pago
    const usedModel = data?.model || data?.choices?.[0]?.model || data?.choices?.[0]?.provider;
    const requestedIsFree = MODEL_OPTIONS.some(m => m.id === mdl && m.free);
    if (requestedIsFree && usedModel && !/:free(\b|$)/i.test(String(usedModel))) {
      throw mkErr(460, `The free pool is not available. (used: ${usedModel})`);
    }

    const content = String(data?.choices?.[0]?.message?.content ?? "");
    if (!content) {
      throw mkErr(461, "Empty response from provider");
    }
    if (validate && !validate(content)) {
      throw mkErr(462, "Validation failed for this model output");
    }
    return content;
  };

  // bucle de cascada (sin modelo por defecto; empieza por el elegido)
  for (const mdl of order) {
    for (let attempt = 0; attempt <= perModelRetries; attempt++) {
      try {
        const text = await tryOnce(mdl);
        return { text, usedModelId: mdl };
      } catch (err: any) {
        const msg = String(err?.message || err);
        const st = Number(err?.status || 0);
        const retryAfterMs = Number(err?.retryAfterMs || 0);

        errors.push(`[${mdl}] ${st || "ERR"} ${msg}`);

        // Clasificación de error
        const isRateLimit = st === 429 || /rate limit/i.test(msg);
        const isServer = st >= 500 && st <= 599;
        const isTimeoutOrNetwork = /aborted|timeout|network|Failed to fetch/i.test(msg);
        const isNoEndpoint =
          st === 404 ||
          /no endpoints? found/i.test(msg) ||
          /model not found/i.test(msg) ||
          /not found/i.test(msg) ||
          /free pool is not available/i.test(msg);

        // ¿reintentar el MISMO modelo?
        const canRetrySame =
          (isRateLimit || isServer || isTimeoutOrNetwork) &&
          attempt < perModelRetries &&
          !isNoEndpoint;

        if (canRetrySame) {
          // backoff exponencial + jitter, respetando Retry-After si viene
          const base = retryAfterMs > 0 ? retryAfterMs : retryDelayMs * Math.pow(2, attempt);
          const jitter = base * (0.75 + Math.random() * 0.5);
          await new Promise(r => setTimeout(r, Math.min(15000, Math.max(250, jitter))));
          continue; // reintenta mismo modelo
        }

        // Si no conviene reintentar (o ya agotamos), pasamos al siguiente modelo de la lista
        break;
      }
    }
  }

  throw new Error(`All models failed.\n${errors.join("\n")}`);
}


// =======================
// callOpenRouterOnce
// =======================
async function callOpenRouterOnce(
  apiKey: string,
  modelId: string,
  userContent: string,
  systemContent?: string,
  opts?: {
    maxRetries?: number;
    retryDelayMs?: number;
    fallbackModels?: string[];
  }
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "HTTP-Referer": (typeof window !== "undefined" ? window.location.origin : ""),
    "X-Title": (typeof document !== "undefined" ? (document.title || "Variamos") : "Variamos"),
  };

  const {
    maxRetries = 2,
    retryDelayMs = 600,
    fallbackModels = MODEL_OPTIONS.filter(m => m.free && m.id !== modelId).map(m => m.id),
  } = opts || {};

  const FETCH_TIMEOUT_MS = 25000;

  const tryOnce = async (mdl: string) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const body = {
      model: mdl,
      messages: systemContent
        ? [{ role: "system", content: systemContent }, { role: "user", content: userContent }]
        : [{ role: "user", content: userContent }],
    };

    let resp: Response;
    try {
      resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(t);
    }

    const rawText = await resp.text();
    let data: any = null;
    try { data = JSON.parse(rawText); } catch { }

    const mkErr = (status: number, msg: string) => {
      const e: any = new Error(msg || `HTTP ${status}`);
      e.status = status;
      const ra = resp.headers?.get?.("retry-after");
      if (ra) {
        const n = Number(ra);
        e.retryAfterMs = Number.isFinite(n) ? Math.max(0, n) * 1000 : 0;
      }
      return e;
    };

    if (!resp.ok) {
      const msg = data?.error?.message || rawText || `HTTP ${resp.status}`;
      throw mkErr(resp.status, msg);
    }

    // Anti-fallback si pediste :free
    const usedModel = data?.model || data?.choices?.[0]?.model || data?.choices?.[0]?.provider;
    const requestedIsFree = MODEL_OPTIONS.some(m => m.id === mdl && m.free);
    if (requestedIsFree && usedModel && !/:free(\b|$)/i.test(String(usedModel))) {
      throw mkErr(460, `The free pool is not available. (used: ${usedModel})`);
    }

    const content = String(data?.choices?.[0]?.message?.content ?? "");
    if (!content) throw mkErr(461, "Empty response from provider");
    return content;
  };

  let attempt = 0;
  let curModel = modelId;
  let fallbackIdx = -1;

  while (true) {
    try {
      // SIEMPRE intentamos primero el modelo elegido por el usuario
      return await tryOnce(curModel);
    } catch (err: any) {
      const msg = String(err?.message || err);
      const st = Number(err?.status || 0);
      const retryAfterMs = Number(err?.retryAfterMs || 0);

      const isRateLimit = st === 429 || /rate limit/i.test(msg);
      const isServer = st >= 500 && st <= 599;
      const isTimeoutOrNetwork = /aborted|timeout|network|Failed to fetch/i.test(msg);
      const isNoEndpoint =
        st === 404 ||
        /no endpoints? found/i.test(msg) ||
        /model not found/i.test(msg) ||
        /not found/i.test(msg) ||
        /free pool is not available/i.test(msg);

      // Cambiar de modelo si no hay endpoint o si insistir ya no tiene sentido
      if (isNoEndpoint) {
        fallbackIdx++;
        if (fallbackIdx < fallbackModels.length) {
          curModel = fallbackModels[fallbackIdx];
          continue;
        }
        // sin fallback → seguimos con reintentos del actual (caerá abajo)
      }

      const canRetrySame = (isRateLimit || isServer || isTimeoutOrNetwork) && attempt < maxRetries;
      if (canRetrySame) {
        attempt++;
        const base = retryAfterMs > 0 ? retryAfterMs : retryDelayMs * Math.pow(2, attempt - 1);
        const jitter = base * (0.75 + Math.random() * 0.5);
        await new Promise(r => setTimeout(r, Math.min(15000, Math.max(250, jitter))));
        continue;
      }

      // Si llegamos aquí: o no conviene reintentar o se agotaron los intentos
      // Intentamos fallback como último recurso (si no lo probamos aún)
      fallbackIdx++;
      if (fallbackIdx < fallbackModels.length) {
        curModel = fallbackModels[fallbackIdx];
        attempt = 0; // reinicia ventana de reintentos para el nuevo modelo
        continue;
      }

      throw err;
    }
  }
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

  useEffect(() => {
    lastModelIdRef.current = null;
  }, [languageId]);

  const assignPositionsToCreates = (env: PatchEnvelope, model: any): PatchEnvelope => {
    const nextPos = nextGridPosGenerator(model);
    const out: PatchEnvelope = { ops: [] };

    for (const raw of env.ops || []) {
      const op: any = { ...raw };
      if (op?.op === "createElement") {
        const hasXY = Number.isFinite(op.x) && Number.isFinite(op.y);
        if (!hasXY) {
          const { x, y } = nextPos();
          op.x = x; op.y = y;
          if (!Number.isFinite(op.width)) op.width = 150;
          if (!Number.isFinite(op.height)) op.height = 60;
          op.geometry = { x: op.x, y: op.y, width: op.width, height: op.height };
          if (op.parentId === undefined) op.parentId = null;
        }
      }
      out.ops.push(op);
    }
    return out;
  };

  // =========================
  // Helper: limitar relaciones espurias en EDIT
  // Mantiene connects si uno de los extremos es NUEVO en este patch
  //    o si AMBOS nombres aparecen en el texto del usuario.
  // Nunca duplica relaciones ya existentes.
  // =========================
  const filterConnectsForEdit = (
    connects: PatchEnvelope,
    creates: PatchEnvelope,
    model: any,
    _userText: string
  ): PatchEnvelope => {
    const createdLC = new Set<string>(
      (creates.ops || [])
        .filter((o: any) => o?.op === "createElement" && o?.name)
        .map((o: any) => String(o.name).toLowerCase())
    );

    const modelNamesLC = new Set<string>(
      (model?.elements || []).map((e: any) => String(e.name).toLowerCase())
    );

    const seen = new Set<string>();
    const MAX_PER_NEW = 12; // más permisivo
    const countPerNew = new Map<string, number>();
    const ok: any[] = [];

    const exists = (n: string) => {
      const lc = String(n || "").toLowerCase();
      return createdLC.has(lc) || modelNamesLC.has(lc);
    };

    for (const raw of connects.ops || []) {
      const op: any = raw;
      if (op?.op !== "connect") { ok.push(op); continue; }

      const type = String(op.type || "");
      const s = String(op.source?.name ?? op.source?.id ?? "");
      const t = String(op.target?.name ?? op.target?.id ?? "");
      if (!s || !t) continue;

      // extremos deben existir (en este patch o en el modelo)
      if (!exists(s) || !exists(t)) continue;

      // evitar duplicados ya en el modelo
      if (relExists(model, type, s, t)) continue;

      // cap por fan-out SOLO cuando alguno es nuevo
      const sNew = createdLC.has(s.toLowerCase());
      const tNew = createdLC.has(t.toLowerCase());
      if (sNew || tNew) {
        const key = sNew ? s.toLowerCase() : t.toLowerCase();
        const n = (countPerNew.get(key) || 0) + 1;
        if (n > MAX_PER_NEW) continue;
        countPerNew.set(key, n);
      }

      const dedupeKey = `${type}|${s}|${t}|${JSON.stringify(op.properties || [])}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      ok.push(op);
    }

    return { ops: ok };
  };
  ;

  // Convierte delete+create (mismo elemento) en updateElement (+rename) para preservar relaciones
  // === Core: plegar delete+create → update/rename (preserva relaciones) ===
  const upgradeDeleteCreateToUpdate = (
    patch: PatchEnvelope,
    model: any,
    abs: AbstractSyntax
  ): PatchEnvelope => {
    if (!patch?.ops?.length || !model) return patch;

    // Índices del modelo
    const idIdx = new Map<string, any>();
    const nameIdxCI = new Map<string, any>();
    for (const e of (model.elements || [])) {
      const nm = String(e.name || "").trim();
      const id = String(e.id || "").trim();
      if (!nm) continue;
      idIdx.set(id, e);
      nameIdxCI.set(nm.toLowerCase(), e);
    }

    // Meta
    const allowedEl = new Set(Object.keys(abs.elements || {}));
    const elPropsMeta = (t: string) => (abs.elements?.[t]?.properties || []) as MetaProp[];

    const createsByNameLC = new Map<string, any>();
    const deleteByNameLC = new Map<string, any>();
    const oldByNameLC = new Map<string, any>(); // elemento viejo del modelo

    // Recolectar creates y deletes con el nombre canónico del elemento viejo
    for (const raw of patch.ops || []) {
      const op: any = raw;
      if (op?.op === "createElement" && op?.name) {
        createsByNameLC.set(String(op.name).toLowerCase(), op);
      }
      if (op?.op === "deleteElement" && op?.selector) {
        const token = String(op.selector.name ?? op.selector.id ?? "").trim();
        if (!token) continue;
        let old = nameIdxCI.get(token.toLowerCase()) || idIdx.get(token);
        if (!old && idIdx.has(token)) old = idIdx.get(token);
        if (!old?.name) continue;
        deleteByNameLC.set(String(old.name).toLowerCase(), op);
        oldByNameLC.set(String(old.name).toLowerCase(), old);
      }
    }

    if (!deleteByNameLC.size) return patch;

    // Emparejar delete ↔ create por nombre (case-insensitive)
    const pairs: Array<{ oldName: string; delOp: any; crtOp: any; oldEl: any }> = [];
    for (const [lcName, delOp] of deleteByNameLC) {
      const crtOp = createsByNameLC.get(lcName);
      const oldEl = oldByNameLC.get(lcName);
      if (!crtOp || !oldEl) continue;
      const newType = String(crtOp.type || "").trim();
      if (!newType || !allowedEl.has(newType)) continue;
      pairs.push({ oldName: oldEl.name, delOp, crtOp, oldEl });
    }
    if (!pairs.length) return patch;

    // Construcción de nuevo array de ops
    const toSkip = new Set<any>();
    for (const p of pairs) { toSkip.add(p.delOp); toSkip.add(p.crtOp); }

    const outOps: any[] = [];
    for (const raw of patch.ops || []) {
      if (toSkip.has(raw)) {
        // Insertamos en el lugar del delete un update (+rename si cambia el nombre)
        const pair = pairs.find(p => p.delOp === raw);
        if (!pair) continue;

        const { oldName, crtOp, oldEl } = pair;
        const newType = String(crtOp.type).trim();
        const newName = String(crtOp.name || oldName).trim();

        // 1) props: preserva intersección y deja que create overridee por nombre si son válidas en el nuevo tipo
        const keepProps = mergePropsRespectMeta(abs, oldEl, newType);
        const keepMap = new Map<string, string>(keepProps.map(p => [p.name, p.value]));
        const allowedNew = new Set(elPropsMeta(newType).map(pm => pm.name));
        const incoming = Array.isArray(crtOp.properties) ? crtOp.properties : [];
        for (const p of incoming) {
          const pn = String(p?.name || "");
          if (allowedNew.has(pn)) keepMap.set(pn, String(p?.value ?? ""));
        }
        const mergedProps = Array.from(keepMap.entries()).map(([name, value]) => ({ name, value }));

        // 2) rename si cambia nombre
        if (newName && newName !== oldName) {
          outOps.push({
            op: "renameElement",
            selector: { name: oldName },
            newName
          });
        }

        // 3) update de tipo (+ props)
        outOps.push({
          op: "updateElement",
          selector: { name: newName || oldName },
          changes: {
            type: newType,
            ...(mergedProps.length ? { properties: mergedProps } : {})
          }
        });

        // (opcional) mover según geometry de create:
        // if (crtOp.geometry) {
        //   const { x, y, width, height } = crtOp.geometry;
        //   outOps.push({
        //     op: "updateElement",
        //     selector: { name: newName || oldName },
        //     changes: { x, y, width, height }
        //   });
        // }
        continue;
      }

      // resto de operaciones pasan igual
      outOps.push(raw);
    }

    return { ops: outOps };
  };


  const sanitizePatchForEditStrict = (patch: PatchEnvelope, model: any, abs: AbstractSyntax): PatchEnvelope => {
    const allowedEl = new Set(Object.keys(abs.elements || {}));

    // Índices del modelo (por nombre/id/id-negocio)
    const nameIdxCI = new Map<string, any>();
    const idIdx = new Map<string, any>();
    const bizIdIdx = new Map<string, string>(); // biz-id (lc) -> name
    for (const e of (model?.elements || [])) {
      const nm = String(e.name || "").trim();
      const id = String(e.id || "").trim();
      nameIdxCI.set(nm.toLowerCase(), e);
      idIdx.set(id, e);
      const props = Array.isArray(e.properties) ? e.properties : [];
      const biz = props.find((p: any) => String(p?.name || "").toLowerCase() === "id");
      const bizVal = String(biz?.value || "").trim();
      if (bizVal) bizIdIdx.set(bizVal.toLowerCase(), nm);
    }

    // Tipos que crea el propio patch (para poder conectar contra lo nuevo)
    const futureType = new Map<string, string>();
    for (const op of (patch.ops || [])) {
      const o: any = op;
      if (o?.op === "createElement" && o.name && o.type) {
        futureType.set(String(o.name), String(o.type));
      }
    }

    const canonicalName = (token: string): string => {
      const t = String(token || "").trim();
      if (!t) return "";
      if (idIdx.has(t)) return String(idIdx.get(t)?.name || "");
      const tl = t.toLowerCase();
      if (nameIdxCI.has(tl)) return String(nameIdxCI.get(tl)?.name || "");
      if (bizIdIdx.has(tl)) return String(bizIdIdx.get(tl) || "");
      return t;
    };

    const typeOfName = (name: string): string | null => {
      if (futureType.has(name)) return futureType.get(name)!;
      const e = nameIdxCI.get(name.toLowerCase());
      return e?.type || null;
    };

    const relExists = (type: string, sName: string, tName: string) => {
      const s = nameIdxCI.get(sName.toLowerCase())?.id;
      const t = nameIdxCI.get(tName.toLowerCase())?.id;
      if (!s || !t) return false;
      return !!(model?.relationships || []).find((r: any) => r.type === type && r.sourceId === s && r.targetId === t);
    };

    const out: PatchEnvelope = { ops: [] };

    for (const raw of (patch.ops || [])) {
      const op: any = raw;
      if (!op || !op.op) continue;

      // ---- createElement (limpio, sin id/geometry)
      if (op.op === "createElement") {
        const name = String(op.name || "");
        const type = String(op.type || "");
        if (!name || !allowedEl.has(type)) continue;
        if (nameIdxCI.has(name.toLowerCase())) continue;

        const cleaned = { ...op };
        delete (cleaned as any).id;
        delete (cleaned as any).geometry;
        delete (cleaned as any).x;
        delete (cleaned as any).y;
        delete (cleaned as any).width;
        delete (cleaned as any).height;

        out.ops.push(cleaned);
        // reflejar para siguientes connects del mismo patch
        nameIdxCI.set(name.toLowerCase(), { id: null, name, type });
        continue;
      }

      // ---- connect: elegir type SÓLO por meta → si ambiguo, descartar
      if (op.op === "connect") {
        const sToken = String((op.source?.name ?? op.source?.id ?? "") || "");
        const tToken = String((op.target?.name ?? op.target?.id ?? "") || "");
        const sName = canonicalName(sToken);
        const tName = canonicalName(tToken);
        if (!sName || !tName) continue;

        const sType = typeOfName(sName);
        const tType = typeOfName(tName);
        if (!sType || !tType) continue;

        const rType = pickRelTypeByMeta(abs, sType, tType, op);
        if (!rType) continue; // AMBIGUO o inválido → no conectamos
        if (relExists(rType, sName, tName)) continue;

        const props = finalizeConnectProps(abs, rType, op);
        out.ops.push({
          op: "connect",
          type: rType,
          source: { name: sName },
          target: { name: tName },
          ...(props.length ? { properties: props } : {})
        });
        continue;
      }

      // ---- setProp(on: element, prop: type) → updateElement (selector por id si es válido; si no, por nombre canónico)
      if (
        op.op === "setProp" &&
        String(op.on || "").toLowerCase() === "element" &&
        String(op.prop || "").toLowerCase() === "type"
      ) {
        const token = String((op.selector?.name ?? op.selector?.id ?? "") || "").trim();
        const newType = String(op.value || "").trim();
        if (!token || !newType) continue;
        if (!allowedEl.has(newType)) continue;

        // Preferir selector por id cuando venga un id real
        const byId = idIdx.get(token);
        const elName = byId ? String(byId.name || "") : canonicalName(token);

        // Si no logramos resolver a un elemento existente por id o nombre → ignorar
        const current =
          byId ||
          (elName ? nameIdxCI.get(elName.toLowerCase()) : null);
        if (!current) continue;

        const keepProps = mergePropsRespectMeta(abs, current, newType);

        out.ops.push({
          op: "updateElement",
          selector: byId ? { id: String(current.id) } : { name: elName },
          changes: {
            type: newType,
            ...(keepProps.length ? { properties: keepProps } : {})
          }
        });
        continue;
      }

      // ---- updateElement: si cambia type, preserva props compatibles (por nombre)
      if (op.op === "updateElement") {
        const token = String((op.selector?.name ?? op.selector?.id ?? "") || "");
        const byId = idIdx.get(token);
        const elName = byId ? String(byId.name || "") : canonicalName(token);
        if (!byId && !elName) continue;

        const changesIn = op.changes || {};
        if (!changesIn || typeof changesIn !== "object") continue;
        const next: any = { ...changesIn };

        if ("type" in next) {
          const newType = String(next.type || "").trim();
          if (!newType || !allowedEl.has(newType)) {
            const { type, ...rest } = next;
            Object.assign(next, rest);
          } else {
            const current =
              byId ||
              (elName ? nameIdxCI.get(elName.toLowerCase()) : null);
            const keepProps = current ? mergePropsRespectMeta(abs, current, newType) : [];
            if (keepProps.length) next.properties = keepProps;
          }
        }

        if (!Object.keys(next).length) continue;
        out.ops.push({ op: "updateElement", selector: byId ? { id: String(byId.id) } : { name: elName }, changes: next });
        continue;
      }

      // ---- deleteProp(type) sobre elemento → ignorar
      if (
        op.op === "deleteProp" &&
        String(op.on || "").toLowerCase() === "element" &&
        String(op.prop || "").toLowerCase() === "type"
      ) {
        continue;
      }

      // ---- resto pasa tal cual (deleteElement, deleteRelationship, renameElement, setProp NO-type, etc.)
      out.ops.push(op);
    }

    return { ops: out.ops };
  };



const sanitizePatchForCreateStrictLocal = (
  patch: PatchEnvelope,
  abs: AbstractSyntax
): PatchEnvelope => {
  // Reuse the edit sanitizer against an empty model to validate types/props/rel-types
  const emptyModel = { elements: [], relationships: [] };
  const cleaned = sanitizePatchForEditStrict(patch, emptyModel, abs);

  // For CREATE, keep only creates/connects and strip geometry/ids from creates
  const outOps = [];
  for (const raw of cleaned.ops || []) {
    const op: any = raw;
    if (op?.op === "createElement") {
      const c = { ...op };
      delete c.id;
      delete c.geometry;
      delete c.x;
      delete c.y;
      delete c.width;
      delete c.height;
      outOps.push(c);
    } else if (op?.op === "connect") {
      outOps.push(op);
    }
    // drop other ops in CREATE context
  }
  return { ops: outOps };
};

/** Rellena propiedades faltantes en creates/updates y normaliza props de connects
 *  - createElement: agrega defaults según meta (defaultValue o primer possibleValues; si nada, "")
 *  - updateElement con changes.type y sin props: puede agregar defaults del nuevo tipo (sin sobreescribir existentes)
 *  - connect: mantiene sólo props declaradas en el meta del rel y aplica defaultValue
 */
const addMissingRequiredPropsLocal = (
  patch: PatchEnvelope,
  abs: AbstractSyntax,
  _userText?: string
): PatchEnvelope => {
  const out: PatchEnvelope = { ops: [] };

  const normPropsArray = (arr: any[]): ValueProp[] =>
    Array.isArray(arr)
      ? arr.map(p => ({ name: String(p?.name ?? ""), value: String(p?.value ?? "") }))
          .filter(p => p.name)
      : [];

  const ensureElementProps = (type: string, incoming?: ValueProp[]): ValueProp[] => {
    const meta = (abs.elements?.[type]?.properties || []) as MetaProp[];
    if (!meta.length) return incoming || [];

    const byName = new Map<string, string>((incoming || []).map(p => [p.name, p.value]));
    for (const pm of meta) {
      if (byName.has(pm.name)) continue;
      if (pm.defaultValue !== undefined) {
        byName.set(pm.name, String(pm.defaultValue));
      } else if (typeof pm.possibleValues === "string" && pm.possibleValues.trim()) {
        // Para elementos, alineamos con materializeIntoModel: primer valor de possibleValues
        const first = pm.possibleValues.split(",").map(s => s.trim()).filter(Boolean)[0] ?? "";
        byName.set(pm.name, first);
      } else {
        byName.set(pm.name, "");
      }
    }
    return Array.from(byName.entries()).map(([name, value]) => ({ name, value }));
  };

  for (const raw of (patch?.ops || [])) {
    const op: any = raw ? { ...raw } : raw;
    if (!op || !op.op) { out.ops.push(raw); continue; }

    if (op.op === "createElement") {
      const t = String(op.type || "");
      op.properties = ensureElementProps(t, normPropsArray(op.properties));
      out.ops.push(op);
      continue;
    }

    if (op.op === "updateElement") {
      const ch = op.changes || {};
      if (ch && typeof ch === "object" && "type" in ch) {
        const t = String(ch.type || "");
        const incoming = normPropsArray(ch.properties);
        // NO sobreescribimos las que ya vienen; sólo completamos faltantes
        ch.properties = ensureElementProps(t, incoming);
        op.changes = ch;
      }
      out.ops.push(op);
      continue;
    }

    if (op.op === "connect") {
      const rType = String(op.type || "");
      if (rType) {
        const props = finalizeConnectProps(abs, rType, op);
        if (props.length) op.properties = props;
        else delete op.properties; // limpia props no meta
      }
      out.ops.push(op);
      continue;
    }

    out.ops.push(op);
  }

  return out;
};

/** Convierte un PATCH (creates/connects) en un PLAN "liviano".
 *  Ignora ops que no sean createElement/connect. Convierte arrays de {name,value} a props {k:v}.
 */
const patchToPlanLiteLocal = (patch: PatchEnvelope): PlanLLM => {
  const elementsMap = new Map<string, PlanElement>();
  const relationships: PlanRelationship[] = [];

  const propsArrayToObj = (arr?: any[]): Record<string, any> => {
    const o: Record<string, any> = {};
    for (const p of arr || []) {
      if (p && p.name != null) o[String(p.name)] = String(p.value ?? "");
    }
    return o;
  };

  for (const raw of (patch?.ops || [])) {
    const op: any = raw;
    if (!op || !op.op) continue;

    if (op.op === "createElement") {
      const name = String(op.name || "");
      const type = String(op.type || "");
      if (!name || !type) continue;
      elementsMap.set(name, {
        name,
        type,
        ...(op.properties ? { props: propsArrayToObj(op.properties) } : {})
      });
      continue;
    }

    if (op.op === "connect") {
      const s = String(op?.source?.name ?? "");
      const t = String(op?.target?.name ?? "");
      const type = String(op?.type ?? "");
      if (!s || !t || !type) continue;
      relationships.push({
        type,
        source: s,
        target: t,
        ...(op.properties ? { props: propsArrayToObj(op.properties) } : {})
      });
      continue;
    }
  }

  return {
    name: "Generated Model",
    elements: Array.from(elementsMap.values()),
    relationships
  };
};




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
  /** 3) Cargar abstractSyntax (string u objeto) — ahora con override opcional de lenguaje */
  const getAbstract = (languageOverride?: Language): AbstractSyntax => {
    try {
      const lang = languageOverride || currentLanguage;
      const rawFromLang = lang?.abstractSyntax ?? null;
      let abs = parseMaybeJson(rawFromLang);

      if (!abs && ps?.getLanguageDefinition && lang?.name) {
        const def = ps.getLanguageDefinition(lang.name);
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

  // Helpers internos para re-tipear “a mano” si applyPatch ignora el updateElement { type: ... }

const buildPropsForType = (abs: AbstractSyntax, newType: string, prevProps: any[] = []) => {
  const meta = ((abs.elements || {})[newType]?.properties || []) as MetaProp[];
  const prevByName = new Map<string, any>(
    (Array.isArray(prevProps) ? prevProps : []).map(p => [String(p?.name || ""), p])
  );

  const out: any[] = [];
  for (const m of meta) {
    const old = prevByName.get(m.name);
    // Mantén valor previo si existía; si no, default o primer possibleValue; si nada, ""
    const value =
      old?.value !== undefined ? String(old.value) :
      m.defaultValue !== undefined ? String(m.defaultValue) :
      (typeof m.possibleValues === "string" && m.possibleValues.trim()
        ? m.possibleValues.split(",").map(s => s.trim()).filter(Boolean)[0] ?? ""
        : "");

    out.push({
      id: old?.id || uuid(),
      name: m.name,
      type: m.type || "String",
      value,
      custom: Boolean(old?.custom),
      display: true,
      comment: m.comment || "",
      possibleValues: m.possibleValues || "",
      linked_property: m.linked_property || null,
      linked_value: m.linked_value || null,
      options: (m as any).options || null,
      minCardinality: (m as any).minCardinality || "",
      maxCardinality: (m as any).maxCardinality || ""
    });
  }

  // Conserva propiedades “custom” que no estén en el meta del tipo nuevo
  for (const p of prevProps) {
    const nm = String(p?.name || "");
    if (!nm) continue;
    if (!meta.find(m => m.name === nm)) {
      out.push({ ...p, id: p?.id || uuid(), custom: true, display: true });
    }
  }
  return out;
};

const findElementByToken = (model: any, token: string) => {
  const t = String(token || "").trim();
  if (!t) return null;
  // por id
  const byId = (model?.elements || []).find((e: any) => String(e.id) === t);
  if (byId) return byId;
  // por nombre (case-insensitive)
  const key = t.toLowerCase();
  return (model?.elements || []).find((e: any) => String(e.name || "").toLowerCase() === key) || null;
};

const forceRetypeElementInModel = (model: any, selector: any, newType: string, abs: AbstractSyntax) => {
  const token = String((selector?.id ?? selector?.name ?? "") || "");
  const el = findElementByToken(model, token);
  if (!el) return false;

  if (String(el.type) === String(newType)) return false; // ya está

  el.type = String(newType);
  el.properties = buildPropsForType(abs, newType, Array.isArray(el.properties) ? el.properties : []);
  return true;
};

/** Recorre un PATCH ya aplicado y garantiza que los updateElement{type} realmente cambiaron el tipo.
 *  Si no, fuerza el cambio directamente en el modelo (preserva id/posiciones/relaciones).
 *  Devuelve true si hizo al menos un re-tipado forzado.
 */
const ensureTypeChangeApplied = (patchApplied: PatchEnvelope, model: any, abs: AbstractSyntax): boolean => {
  let changed = false;
  for (const raw of patchApplied?.ops || []) {
    const op: any = raw;
    if (op?.op !== "updateElement") continue;
    const nextType = String(op?.changes?.type || "");
    if (!nextType) continue;

    // Intenta por id o por name
    const sel = op.selector || {};
    // Si selector viene en {id}, úsalo; si viene {name}, úsalo también
    const ok = forceRetypeElementInModel(model, sel, nextType, abs);
    if (ok) changed = true;
  }
  return changed;
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

const buildUnifiedSystemPrompt = (
  abs: AbstractSyntax,
  hasSelection: boolean = false,
  patchSchemaText: string = PATCH_SCHEMA_TEXT
) => {
  const elEntries = Object.entries(abs.elements || {});
  const relEntries = Object.entries(abs.relationships || {});
  const restr = abs.restrictions || {};

  const elementsDesc = elEntries.map(([ename, edef]) => {
    const props = (edef.properties || []).map(p => {
      const pv = typeof p.possibleValues === "string" && p.possibleValues.trim()
        ? ` (possibleValues: ${p.possibleValues})` : "";
      const df = p.defaultValue !== undefined ? ` (default: ${p.defaultValue})` : "";
      return `- ${p.name}: ${p.type}${pv}${df}`;
    }).join("\n");
    return `* ${ename}${props ? `\n${props}` : ""}`;
  }).join("\n");

  const relsDesc = relEntries.map(([rname, rdef]) => {
    const props = (rdef.properties || []).map(p => {
      const pv = typeof p.possibleValues === "string" && p.possibleValues.trim()
        ? ` (possibleValues: ${p.possibleValues})` : "";
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
  if (restr.quantity_element?.length)
    for (const q of restr.quantity_element)
      restrLines.push(`- quantity_element: element=${q.element}, min=${q.min}, max=${q.max}`);
  if (restr.unique_name?.elements?.length)
    restrLines.push(`- unique_name over groups: ${JSON.stringify(restr.unique_name.elements)}`);
  if (restr.parent_child?.length)
    for (const pc of restr.parent_child)
      restrLines.push(`- parent_child: child=${pc.childElement}, parent in [${pc.parentElement.join(", ")}]`);

  const allowedTypes = Object.keys(abs.elements || {}).join(", ") || "(none)";

  return [
    "You are a modeling assistant operating STRICTLY in the CURRENT LANGUAGE (abstract syntax below).",
    "You MUST NOT create elements or relationships that are not declared in this abstract syntax.",
    "",
    "Return exactly ONE valid JSON object, no backticks, in ONE of these formats:",
    "A) PATCH (to modify the selected model):",
    patchSchemaText,
    "",
    "B) PLAN (to create a new model):",
    "{\"name\": string, \"elements\":[{\"name\": string, \"type\": string, \"props\"?: object}], \"relationships\":[{\"type\": string, \"source\": string, \"target\": string, \"props\"?: object}]}",
    "",
    hasSelection
      ? "- A model is selected → return PATCH only."
      : "- No model is selected → prefer PLAN; PATCH is also accepted.",
    "",
    "Hard rules:",
    "- Use ONLY element/relationship TYPES that exist in this language. Allowed element types:",
    `  [ ${allowedTypes} ]`,
    "- Use only element NAMES (not ids) in refs (source/target/selectors).",
    "- Never include internal 'id' fields; the tool generates them.",
    "- To change an element’s classification/kind (e.g., AbstractFeature↔ConcreteFeature within this language), emit:",
    "  {\"op\":\"updateElement\",\"selector\":{\"name\":\"X\"},\"changes\":{\"type\":\"NewType\"}}",
    "- If the user mentions concepts from OTHER languages (e.g., features/bundles) you MUST NOT create those elements here.",
    "- Instead, MAP those concepts into valid elements of this language (e.g., Functional/NonFunctional/Security requirements, UseCases, etc.).",
    "- If the current language defines cross-language/trace relationships in its meta, you MAY create those relationships",
    "  from the new elements to EXISTING names in the project (names only; do NOT create foreign-language elements).",
    "- If a relationship type is not specified and there is exactly ONE valid candidate in the meta for source/target types, use it.",
    "",
    "Elements:",
    elementsDesc || "(none)",
    "",
    "Relationships:",
    relsDesc || "(none)",
    "",
    "Restrictions:",
    restrLines.length ? restrLines.join("\n") : "(none)"
  ].join("\n");
};







  /** 5) Validación + normalización */
  const validatePlanStrict = (planRaw: any, abs: AbstractSyntax): PlanLLM => {
    const plan = (planRaw && typeof planRaw === "object")
      ? (planRaw.nodes || planRaw.edges ? nodesEdgesToPlan(planRaw) : planRaw)
      : null;
    if (!plan) return { name: "Invalid", elements: [], relationships: [] };

    const elDefs = abs.elements || {};
    const allowedEl = new Set(Object.keys(elDefs));

    // 1) Elementos: solo tipos válidos, nombre no vacío
    const elems: PlanElement[] = [];
    const seenNames = new Set<string>();
    for (const e of (Array.isArray(plan.elements) ? plan.elements : [])) {
      if (!e || !e.name || !e.type) continue;
      if (!allowedEl.has(e.type)) continue;
      if (seenNames.has(e.name)) continue;
      seenNames.add(e.name);
      elems.push({ name: e.name, type: e.type, ...(e.props ? { props: e.props } : {}) });
    }
    const name2type = new Map(elems.map(e => [e.name, e.type]));

    // 2) Relaciones: válidas según el meta; si type falta o es inválido pero hay 1 única opción → úsala
    const rels: PlanRelationship[] = [];
    for (const r of (Array.isArray(plan.relationships) ? plan.relationships : [])) {
      if (!r || !r.source || !r.target) continue;
      if (!name2type.has(r.source) || !name2type.has(r.target)) continue;

      const sType = name2type.get(r.source)!;
      const tType = name2type.get(r.target)!;
      let rType = r.type || "";

      const candidates = validRelTypes(abs, sType, tType);
      if (rType && candidates.includes(rType)) {
        rels.push({ type: rType, source: r.source, target: r.target, ...(r.props ? { props: r.props } : {}) });
        continue;
      }
      if (!rType || !candidates.includes(rType)) {
        if (candidates.length === 1) {
          rels.push({ type: candidates[0], source: r.source, target: r.target, ...(r.props ? { props: r.props } : {}) });
        } // si 0 o >1, lo descartamos (la IA debe ser específica)
      }
    }

    return { name: plan.name || "Generated Model", elements: elems, relationships: rels };
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

// Sustituye tu normalizeRefsInOps actual por ESTA versión (misma firma + userText opcional)
const normalizeRefsInOps = (
  ops: any[],
  model?: any,
  patchForCreate?: PatchEnvelope,
  userText?: string
) => {
  // Índices del modelo
  const nameIdxCI = new Map<string, { name: string; id: string; type: string }>();
  const internalIdIdx = new Map<string, { name: string; id: string; type: string }>();
  const bizIdIdxModel = new Map<string, string>(); // biz-id (lc) -> canonical name

  if (model?.elements?.length) {
    for (const e of model.elements) {
      const nm = String(e?.name || "").trim();
      const id = String(e?.id || "").trim();
      const tp = String(e?.type || "").trim();
      if (!nm) continue;
      nameIdxCI.set(nm.toLowerCase(), { name: nm, id, type: tp });
      internalIdIdx.set(id, { name: nm, id, type: tp });

      const props = Array.isArray(e.properties) ? e.properties : [];
      const biz = props.find((p: any) => String(p?.name || "").toLowerCase() === "id");
      const bizVal = String(biz?.value || "").trim();
      if (bizVal) bizIdIdxModel.set(bizVal.toLowerCase(), nm);
    }
  }

  // Índices del patch (creates) para permitir referencias “adelante”
  const bizIdIdxPatch = new Map<string, string>();
  const createdNamesLC = new Map<string, string>();
  if (patchForCreate?.ops?.length) {
    for (const raw of patchForCreate.ops) {
      const op: any = raw;
      if (op?.op !== "createElement") continue;
      const nm = String(op?.name || "").trim();
      if (nm) createdNamesLC.set(nm.toLowerCase(), nm);
      const props = Array.isArray(op?.properties) ? op.properties : [];
      const biz = props.find((p: any) => String(p?.name || "").toLowerCase() === "id");
      const bizVal = String(biz?.value || "").trim();
      if (bizVal && nm) bizIdIdxPatch.set(bizVal.toLowerCase(), nm);
    }
  }

  // Menciones por texto del usuario (para reparar selectores desconocidos)
  const t = String(userText || "").toLowerCase();
  const mentionedNames = Array.from(nameIdxCI.keys()).filter(k => t.includes(k));
  const uniqueMention = mentionedNames.length === 1 ? nameIdxCI.get(mentionedNames[0])?.name ?? null : null;

  const toCanonicalName = (token: string): string | null => {
    const tok = String(token || "").trim();
    if (!tok) return null;

    // 1) id interno
    if (internalIdIdx.has(tok)) return internalIdIdx.get(tok)!.name;

    const tl = tok.toLowerCase();
    // 2) nombre (modelo)
    if (nameIdxCI.has(tl)) return nameIdxCI.get(tl)!.name;
    // 3) nombre creado en este patch
    if (createdNamesLC.has(tl)) return createdNamesLC.get(tl)!;
    // 4) id negocio del patch
    if (bizIdIdxPatch.has(tl)) return bizIdIdxPatch.get(tl)!;
    // 5) id negocio del modelo
    if (bizIdIdxModel.has(tl)) return bizIdIdxModel.get(tl)!;

    // 6) fallback por mención ÚNICA en el prompt (sólo si no resolvimos nada)
    if (uniqueMention) return uniqueMention;

    return null;
  };

  const fixElemRef = (ref: any) => {
    if (ref == null) return ref;
    if (typeof ref === "string") {
      const c = toCanonicalName(ref);
      return c ? { name: c } : { name: ref }; // deja name crudo si no resolvió; lo arreglará el reparador de más adelante
    }
    if (typeof ref === "object") {
      const token = String((ref.name ?? ref.id ?? "") || "").trim();
      if (!token) return ref;
      const c = toCanonicalName(token);
      return c ? { name: c } : ref;
    }
    return ref;
  };

  const isElementSelectorOp = (op: any) =>
    (op?.op === "setProp" && String(op?.on || "").toLowerCase() === "element") ||
    op?.op === "deleteElement" ||
    op?.op === "updateElement" ||
    op?.op === "renameElement";

  for (const op of ops) {
    if (!op || typeof op !== "object") continue;


    if (op.op === "createElement") delete (op as any).id;

    if (op.op === "connect") {
      if (op.source) op.source = fixElemRef(op.source);
      if (op.target) op.target = fixElemRef(op.target);
      continue;
    }
    if (op.op === "deleteRelationship" && op.selector && typeof op.selector === "object") {
      if (op.selector.source) op.selector.source = fixElemRef(op.selector.source);
      if (op.selector.target) op.selector.target = fixElemRef(op.selector.target);
      continue;
    }
    if (isElementSelectorOp(op) && op.selector) {
      op.selector = fixElemRef(op.selector);
      continue;
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

  // --- Helpers de layout y validación de relaciones ---
  const modelBBox = (model: any) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of (model?.elements || [])) {
      const x = Number(e.x ?? 0), y = Number(e.y ?? 0);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX, minY, maxX, maxY };
  };

  const nextGridPosGenerator = (model: any) => {
    let i = 0;
    const baseX = 140, baseY = 90, gridW = 220, gridH = 120, cols = 3;
    const has = Array.isArray(model?.elements) ? model.elements.length : 0;
    if (has > 0) {
      let maxX = 0; for (const e of (model.elements || [])) maxX = Math.max(maxX, Number(e.x ?? 0));
      return () => { const col = i % cols, row = Math.floor(i++ / cols); return { x: maxX + 200 + col * gridW, y: baseY + row * gridH }; };
    }
    return () => { const col = i % cols, row = Math.floor(i++ / cols); return { x: baseX + col * gridW, y: baseY + row * gridH }; };
  };

  const relTypeIsValid = (abs: AbstractSyntax, relType: string, sType: string, tType: string) => {
    const def = (abs.relationships || {})[relType];
    return !!def && def.source === sType && def.target.includes(tType);
  };

  const pickRelTypeOrMap = (abs: AbstractSyntax, requested: string, sType: string, tType: string) => {
    if (requested && relTypeIsValid(abs, requested, sType, tType)) return requested;
    for (const [name, def] of Object.entries(abs.relationships || {})) {
      if (def.source === sType && def.target.includes(tType)) return name;
    }
    return null;
  };

  // === REL STRICT ===
  const validRelTypes = (abs: AbstractSyntax, sType: string, tType: string): string[] => {
    const out: string[] = [];
    for (const [name, def] of Object.entries(abs.relationships || {})) {
      if (def.source === sType && def.target.includes(tType)) out.push(name);
    }
    return out;
  };
  const getRelMeta = (abs: AbstractSyntax, relType: string): MetaRelDef | undefined =>
    (abs.relationships || {})[relType];

  const getRelPropsMeta = (abs: AbstractSyntax, relType: string): MetaProp[] =>
    (getRelMeta(abs, relType)?.properties || []) as MetaProp[];

  const getElPropsMeta = (abs: AbstractSyntax, elType: string) =>
    ((abs.elements || {})[elType]?.properties || []) as MetaProp[];

  const pickRelTypeByMeta = (
    abs: AbstractSyntax,
    sType: string,
    tType: string,
    op: any
  ): string | null => {
    const candidates = validRelTypes(abs, sType, tType);
    const req = String(op?.type || "");

    if (req && candidates.includes(req)) return req;
    if (candidates.length === 1) return candidates[0];
    if (!candidates.length) return null;

    const opProps: ValueProp[] = Array.isArray(op?.properties)
      ? op.properties.map((p: any) => ({ name: String(p?.name), value: String(p?.value ?? "") }))
      : [];

    let best: string | null = null;
    let bestScore = -1;

    for (const c of candidates) {
      const meta = getRelPropsMeta(abs, c);
      const metaNames = new Set(meta.map(m => m.name));
      const possibleByName = new Map<string, string[]>(
        meta
          .filter(m => typeof m.possibleValues === "string" && m.possibleValues.trim())
          .map(m => [m.name, m.possibleValues!.split(",").map(s => s.trim())])
      );

      let score = 0;
      for (const p of opProps) {
        if (metaNames.has(p.name)) {
          score += 1;
          const pv = possibleByName.get(p.name);
          if (pv && pv.map(v => v.toLowerCase()).includes(p.value.toLowerCase())) score += 1;
        }
      }

      if (score > bestScore) { bestScore = score; best = c; }
      else if (score === bestScore) { best = null; } // empate → ambiguo
    }

    if (bestScore <= 0) return null; // nada ayuda a desambiguar
    return best;
  };

  /**
   * Filtra y normaliza propiedades del connect:
   * - Mantiene SOLO las propiedades definidas en el meta del relType.
   * - Si el meta define defaultValue y no viene esa prop → agrega default.
   * - No inventa valores (no usa primeros possibleValues, ni mapea “min/max”, ni “Type”).
   */
  const finalizeConnectProps = (
    abs: AbstractSyntax,
    relType: string,
    op: any
  ): ValueProp[] => {
    const metaProps = getRelPropsMeta(abs, relType);
    if (!metaProps.length) return [];

    const incoming: ValueProp[] = Array.isArray(op?.properties)
      ? op.properties.map((p: any) => ({ name: String(p?.name), value: String(p?.value ?? "") }))
      : [];

    const byName = new Map<string, string>(incoming.map(p => [p.name, p.value]));
    const out: ValueProp[] = [];

    for (const pm of metaProps) {
      if (byName.has(pm.name)) {
        out.push({ name: pm.name, value: String(byName.get(pm.name) ?? "") });
      } else if (pm.defaultValue !== undefined) {
        out.push({ name: pm.name, value: String(pm.defaultValue) });
      }
      // NO: elegir primer possibleValue
      // NO: mapear min/max o 'Type' o sinónimos
    }
    return out;
  };

  /**
   * Cuando cambia el tipo de un elemento, preserva valores de propiedades que
   * existan tanto en el tipo anterior como en el nuevo (por nombre exacto).
   */
  const mergePropsRespectMeta = (
    abs: AbstractSyntax,
    prevElement: any,
    newType: string
  ): ValueProp[] => {
    const prevPropsArr: ValueProp[] = Array.isArray(prevElement?.properties)
      ? prevElement.properties.map((p: any) => ({ name: String(p.name), value: String(p.value ?? "") }))
      : [];

    const newMeta = getElPropsMeta(abs, newType);
    if (!newMeta.length || !prevPropsArr.length) return [];

    const allowed = new Set(newMeta.map(pm => pm.name));
    return prevPropsArr.filter(p => allowed.has(p.name));
  };

  const scopeRelationshipDeletesToDeletedElements = (
    env: PatchEnvelope,
    model: any
  ): PatchEnvelope => {
    if (!env?.ops?.length || !model) return env;

    // Índices del modelo
    const nameToIdLC = new Map<string, string>();
    const relById = new Map<string, any>();
    for (const e of (model.elements || [])) {
      const nm = String(e.name || "").trim();
      if (nm) nameToIdLC.set(nm.toLowerCase(), String(e.id));
    }
    for (const r of (model.relationships || [])) {
      relById.set(String(r.id), r);
    }

    // Recopila los elementos que se van a eliminar (por id)
    const deletedIds = new Set<string>();
    const getIdBySelector = (sel: any): string | null => {
      if (!sel) return null;
      const byId = String(sel.id || "").trim();
      if (byId) return byId;
      const byName = String(sel.name || sel.id || "").trim();
      if (byName) return nameToIdLC.get(byName.toLowerCase()) || null;
      return null;
    };

    for (const op of env.ops) {
      if (op?.op === "deleteElement" && op.selector) {
        const id = getIdBySelector(op.selector);
        if (id) deletedIds.add(id);
      }
    }

    // Si no hay deleteElement en el patch, no acotamos (no tenemos ancla confiable)
    if (!deletedIds.size) return env;

    // Filtra deleteRelationship para conservar sólo los que tocan a alguno de los elementos borrados
    const filtered: any[] = [];
    for (const raw of env.ops) {
      const op: any = raw;
      if (op?.op !== "deleteRelationship") {
        filtered.push(op);
        continue;
      }

      // Caso 1: selector por id de relación
      const rid = String(op?.selector?.id || "").trim();
      if (rid && relById.has(rid)) {
        const rr = relById.get(rid);
        if (deletedIds.has(String(rr.sourceId)) || deletedIds.has(String(rr.targetId))) {
          filtered.push(op); // toca al elemento que borramos → mantener
        }
        // si no toca, se descarta silenciosamente
        continue;
      }

      // Caso 2: selector por source/target (name o id)
      const sSel = op?.selector?.source || null;
      const tSel = op?.selector?.target || null;
      const sId = getIdBySelector(sSel);
      const tId = getIdBySelector(tSel);

      if ((sId && deletedIds.has(sId)) || (tId && deletedIds.has(tId))) {
        filtered.push(op); // toca al elemento que borramos → mantener
      }
      // si no toca, se descarta
    }

    return { ops: filtered };
  };


  const bindNameRefsToIds = (patch: PatchEnvelope, model: any): PatchEnvelope => {
    const nameToIdLC = new Map<string, string>();
    const elementIdSet = new Set<string>();
    for (const e of (model?.elements || [])) {
      const nm = String(e.name || "").trim();
      const id = String(e.id || "").trim();
      if (nm) nameToIdLC.set(nm.toLowerCase(), id);
      if (id) elementIdSet.add(id);
    }

    const relIndex = new Map<string, any>(); // key: type|sId|tId -> rel
    const relById = new Map<string, any>();
    for (const r of (model?.relationships || [])) {
      const key = `${String(r.type)}|${String(r.sourceId)}|${String(r.targetId)}`;
      relIndex.set(key, r);
      relById.set(String(r.id), r);
    }

    const getIdByName = (name: string): string | undefined =>
      nameToIdLC.get(String(name || "").trim().toLowerCase());

    const fixElemRefToId = (ref: any) => {
      if (!ref || typeof ref !== "object") return ref;

      // Caso 1: viene por id → si es un id real de ELEMENTO, úsalo
      if ("id" in ref && ref.id) {
        const raw = String(ref.id).trim();
        if (elementIdSet.has(raw)) return { id: raw };

        // Si el "id" traía realmente un NOMBRE, conviértelo
        const idFromName = getIdByName(raw);
        if (idFromName) return { id: idFromName };
      }

      // Caso 2: viene por name → si el name ES un id real, úsalo; si es nombre, mapear
      const name = ("name" in ref) ? String(ref.name || "").trim() : "";
      if (name && elementIdSet.has(name)) return { id: name };
      const id = getIdByName(name);
      return id ? { id } : ref;
    };

    const out: PatchEnvelope = { ops: [] };

    for (const raw of (patch.ops || [])) {
      const op: any = raw && typeof raw === "object" ? { ...raw } : raw;
      if (!op || !op.op) { out.ops.push(raw); continue; }

      if (op.op === "connect") {
        if (op.source) op.source = fixElemRefToId(op.source);
        if (op.target) op.target = fixElemRefToId(op.target);
        out.ops.push(op);
        continue;
      }

      if (op.op === "deleteRelationship") {
        // Si ya viene con id y existe, lo dejamos
        const sel = op.selector || {};
        const relId = String(sel?.id || "");
        if (relId && relById.has(relId)) { out.ops.push(op); continue; }

        // Intentar resolver por (type?, source, target)
        const type = String(op.type || sel.type || sel.relType || "");
        const sId = sel?.source?.id || getIdByName(sel?.source?.name || sel?.source?.id || "");
        const tId = sel?.target?.id || getIdByName(sel?.target?.name || sel?.target?.id || "");
        if (sId && tId) {
          let candidates = (model?.relationships || []).filter((r: any) =>
            String(r.sourceId) === String(sId) && String(r.targetId) === String(tId)
          );
          if (type) candidates = candidates.filter((r: any) => String(r.type) === type);
          if (candidates.length === 1) {
            out.ops.push({ op: "deleteRelationship", selector: { id: String(candidates[0].id) } });
            continue;
          }
        }
        out.ops.push(op);
        continue;
      }

      if (
        (op.op === "setProp" && String(op.on || "").toLowerCase() === "element") ||
        op.op === "deleteElement" ||
        op.op === "updateElement" ||
        op.op === "renameElement"
      ) {
        if (op.selector) op.selector = fixElemRefToId(op.selector);
        out.ops.push(op);
        continue;
      }

      out.ops.push(op);
    }

    return out;
  };



  function fixDanglingConnectsUsingTypes(
    connects: PatchEnvelope,
    model: any,
    abs: AbstractSyntax,
    userText: string,
    created?: PatchEnvelope
  ): PatchEnvelope {
    const txt = (userText || "").toLowerCase();

    const createdNames = new Set(
      (created?.ops || [])
        .filter((o: any) => o?.op === "createElement" && o?.name)
        .map((o: any) => String(o.name).toLowerCase())
    );

    const elems = Array.isArray(model?.elements) ? model.elements : [];
    const namesByType = new Map<string, string[]>();
    for (const e of elems) {
      const t = String(e.type || "");
      const n = String(e.name || "");
      if (!t || !n) continue;
      const arr = namesByType.get(t) || [];
      arr.push(n);
      namesByType.set(t, arr);
    }

    const pickOne = (cands: string[]) => {
      if (cands.length <= 1) return cands[0] || null;
      // 1) si el usuario mencionó explícitamente el nombre
      const byMention = cands.filter(n => txt.includes(n.toLowerCase()));
      if (byMention.length === 1) return byMention[0];
      // 2) si fue creado en ESTE patch
      const byCreated = cands.filter(n => createdNames.has(n.toLowerCase()));
      if (byCreated.length === 1) return byCreated[0];
      return null; // ambiguo → mejor no inventar
    };

    const out: PatchEnvelope = { ops: [] };
    for (const raw of connects.ops || []) {
      const op: any = { ...(raw as any) };
      if (op?.op !== "connect") { out.ops.push(op); continue; }

      let sName = String(op?.source?.name || "").trim();
      let tName = String(op?.target?.name || "").trim();

      if (sName && tName) { out.ops.push(op); continue; }

      // Si tenemos el tipo de relación, usamos el metamodelo para deducir tipos fuente/target
      const rType = String(op?.type || "");
      const rMeta: MetaRelDef | undefined = (abs.relationships || {})[rType];
      if (!rMeta) { /* sin meta, no podemos desambiguar con seguridad */ continue; }

      if (!sName) {
        const srcCands = namesByType.get(rMeta.source) || [];
        const pick = pickOne(srcCands);
        if (!pick) continue;
        sName = pick;
      }
      if (!tName) {
        // target admite múltiples tipos: juntamos candidatos de todos los tipos permitidos
        const tgtCands = rMeta.target.flatMap(tt => namesByType.get(tt) || []);
        const pick = pickOne(tgtCands);
        if (!pick) continue;
        tName = pick;
      }

      op.source = { name: sName };
      op.target = { name: tName };
      out.ops.push(op);
    }

    return out;
  }



  // PLAN → PATCH respetando restricciones del lenguaje (sin nombres fijos)
  const planToPatch = (plan: PlanLLM, model: any, abs: AbstractSyntax): PatchEnvelope => {
    const ops: any[] = [];
    const allowedEl = new Set(Object.keys(abs.elements || {}));
    const qty = Array.isArray(abs.restrictions?.quantity_element) ? abs.restrictions!.quantity_element : [];
    const maxOne = new Set(qty.filter(q => q.max === 1).map(q => q.element));

    const countInModel: Record<string, number> = {};
    for (const e of (model?.elements || [])) {
      const t = String(e?.type);
      countInModel[t] = (countInModel[t] || 0) + 1;
    }

    const propsToPatchProps = (props?: Record<string, any>) =>
      !props ? [] : Object.entries(props).map(([k, v]) => ({ name: k, value: String(v) }));

    // createElement (solo tipos válidos; no exceder max==1 si aplica)
    const elems = Array.isArray(plan?.elements) ? plan.elements : [];
    for (const el of elems) {
      if (!el || !el.name || !el.type) continue;
      if (!allowedEl.has(el.type)) continue;

      if (maxOne.has(el.type) && (countInModel[el.type] || 0) >= 1) continue; // respeta max==1

      const exists = !!findByNameCI(model, el.name);
      if (exists) continue;

      const properties = propsToPatchProps(el.props);
      ops.push({ op: "createElement", name: el.name, type: el.type, ...(properties.length ? { properties } : {}) });

      countInModel[el.type] = (countInModel[el.type] || 0) + 1;
    }

    // connect
    const rels = Array.isArray(plan?.relationships) ? plan.relationships : [];
    for (const r of rels) {
      if (!r || !r.type || !r.source || !r.target) continue;
      const properties = propsToPatchProps(r.props);
      ops.push({ op: "connect", type: r.type, source: { name: String(r.source) }, target: { name: String(r.target) }, ...(properties.length ? { properties } : {}) });
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

  const autoSelectModelInTree = (ps: any, model: any, ph: Phase) => {
  try {
    const project = ps.project;
    if (!project?.productLines?.length) return;


    const idPl = ps.getIdCurrentProductLine?.() ?? 0;
    const pl = project.productLines[idPl];
    if (!pl) return;

    if (ph === "DOMAIN") {
      const models = pl.domainEngineering?.models || [];
      let idx = models.findIndex((m: any) => m.id === model.id);
      if (idx < 0) idx = models.length - 1;
      if (idx < 0) return;

      ps.modelDomainSelected?.(idPl, idx);
    }

    if (ph === "SCOPE") {
      const models = pl.scope?.models || [];
      let idx = models.findIndex((m: any) => m.id === model.id);
      if (idx < 0) idx = models.length - 1;
      if (idx < 0) return;

      ps.modelScopeSelected?.(idPl, idx);
    }

    if (ph === "APPLICATION") {
      const apps = pl.applicationEngineering?.applications || [];
      let idApp = -1;
      let idAppModel = -1;

      outer: for (let i = 0; i < apps.length; i++) {
        const ms = apps[i].models || [];
        const j = ms.findIndex((m: any) => m.id === model.id);
        if (j >= 0) {
          idApp = i;
          idAppModel = j;
          break outer;
        }
      }

      if (idApp >= 0 && idAppModel >= 0) {
        ps.modelApplicationSelected?.(idPl, idApp, idAppModel);
      }
    }

    ps.saveProject?.();
  } catch (err) {
    addLog(`[autoSelectModelInTree] warn: ${err}`);
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
    const raiseEventByPhase: Record<Phase, () => void> = {
      SCOPE: () => ps.raiseEventScopeModel(model),
      DOMAIN: () => ps.raiseEventDomainEngineeringModel(model),
      APPLICATION: () => ps.raiseEventApplicationEngineeringModel(model)
    };
    raiseEventByPhase[ph]();
    autoSelectModelInTree(ps, model, ph);
    
     try {
      ps.raiseEventSelectedModel?.(model);  // marca el modelo como seleccionado
      ps.requestRender?.();                 // fuerza render en React
      ps.repaint?.();                       // fuerza repintado de mxGraph
    } catch (err) {
      addLog(`[inject] warn: no se pudo abrir en mxgEditor: ${err}`);
    }

    const projectInfo = ps.getProjectInformation?.();
    if (projectInfo?.is_collaborative) {
      const modelTypeByPhase: Record<Phase, string> = {
        SCOPE: 'scope',
        DOMAIN: 'domainEngineering',
        APPLICATION: 'applicationEngineering'
      };
      
      const modelDataForSync = {
        ...model,
        type: modelTypeByPhase[ph],
        languageName: langName,
        languageId: langIdStr
      };

      treeCollaborationService.syncAddModelOperation(modelDataForSync, ps);
    
      const projectId = ps.project?.id;
      if (projectId && model.id) {
        ps.updateModelState(projectId, model.id, (state: any) => {
          state.set("data", {
            elements: model.elements || [],
            relationships: model.relationships || [],
            timestamp: Date.now()
          });
        });
      }
    }

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
/** Repara selectores de elemento que vienen con id/nombre inválido.
 * Si el usuario mencionó EXACTAMENTE un nombre de elemento del modelo en su texto,
 * reescribe el selector a ese nombre.
 */
const repairUnknownSelectorsByMentions = (
  env: PatchEnvelope,
  model: any,
  userText: string
): PatchEnvelope => {
  if (!env?.ops?.length || !model?.elements?.length) return env;

  const t = String(userText || "").toLowerCase();
  const nameIdxLC = new Map<string, string>();
  const idSet = new Set<string>();

  for (const e of model.elements) {
    const nm = String(e?.name || "");
    const id = String(e?.id || "");
    if (nm) nameIdxLC.set(nm.toLowerCase(), nm);
    if (id) idSet.add(id);
  }

  // nombres del modelo que aparecen textual en el prompt del usuario
  const mentions = Array.from(nameIdxLC.keys()).filter(n => t.includes(n));
  const only = mentions.length === 1 ? nameIdxLC.get(mentions[0]) || null : null;

  const mustFixSelector = (sel: any): boolean => {
    const tok = String((sel?.name ?? sel?.id ?? "") || "");
    if (!tok) return true;
    if (idSet.has(tok)) return false;                      // id real
    if (nameIdxLC.has(tok.toLowerCase())) return false;    // nombre real
    return true; // id/nombre inválido → candidato a reparar
  };

  const fix = (sel: any) => (only ? { name: only } : sel);

  const out: PatchEnvelope = { ops: [] };
  for (const raw of (env.ops || [])) {
    const op: any = raw && typeof raw === "object" ? { ...raw } : raw;
    if (!op || !op.op) { out.ops.push(raw); continue; }

    if (
      (op.op === "updateElement" || op.op === "deleteElement" || op.op === "renameElement" ||
       (op.op === "setProp" && String(op.on || "").toLowerCase() === "element"))
      && op.selector && mustFixSelector(op.selector)
    ) {
      op.selector = fix(op.selector);
    } else if (op.op === "deleteRelationship" && op.selector) {
      if (op.selector.source && mustFixSelector(op.selector.source)) op.selector.source = fix(op.selector.source);
      if (op.selector.target && mustFixSelector(op.selector.target)) op.selector.target = fix(op.selector.target);
    } else if (op.op === "connect") {
      if (op.source && mustFixSelector(op.source)) op.source = fix(op.source);
      if (op.target && mustFixSelector(op.target)) op.target = fix(op.target);
    }

    out.ops.push(op);
  }
  return out;
};


const send = async (userText: string) => {
  if (busy) return;
  setBusy(true);

  // ---------- HELPERS LOCALES ----------
  const dedupeConnects = (env: PatchEnvelope): PatchEnvelope => {
    const seen = new Set<string>();
    const out: PatchEnvelope = { ops: [] };
    for (const raw of env.ops || []) {
      const op: any = raw;
      if (op?.op !== "connect") { out.ops.push(op); continue; }
      const sTok = String(op.source?.name ?? op.source?.id ?? "");
      const tTok = String(op.target?.name ?? op.target?.id ?? "");
      const rTyp = String(op.type ?? "");
      const key = `${rTyp}|${sTok}|${tTok}|${JSON.stringify(op.properties || [])}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.ops.push(op);
    }
    return out;
  };

  const splitCreateConnect = (env: PatchEnvelope) => {
    const creates: any[] = [], connects: any[] = [], others: any[] = [];
    for (const raw of env.ops || []) {
      const op: any = raw;
      if (!op || !op.op) continue;
      if (op.op === "createElement") creates.push(op);
      else if (op.op === "connect") connects.push(op);
      else others.push(op);
    }
    return {
      creates: { ops: creates } as PatchEnvelope,
      connects: { ops: connects } as PatchEnvelope,
      others: { ops: others } as PatchEnvelope
    };
  };

  const mergePatches = (base: PatchEnvelope, extra: PatchEnvelope): PatchEnvelope => {
    const names = new Set<string>();
    for (const op of base.ops || [])
      if ((op as any).op === "createElement") names.add(String((op as any).name || ""));
    const out: PatchEnvelope = { ops: [...(base.ops || [])] };
    const seen = new Set<string>();
    for (const raw of extra.ops || []) {
      const op: any = raw;
      const key = JSON.stringify(op);
      if (seen.has(key)) continue;
      seen.add(key);
      if (op.op === "createElement") {
        const nm = String(op.name || "");
        if (!nm || names.has(nm)) continue;
        names.add(nm);
        out.ops.push(op);
      } else {
        out.ops.push(op);
      }
    }
    return out;
  };

  // suprime alert durante applyPatch
  const withNoAlert = async <T,>(fn: () => T | Promise<T>): Promise<T> => {
    const prev = window.alert;
    window.alert = (...args: any[]) => { try { addLog(`[alert suppressed] ${args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}`); } catch { } };
    try { return await fn(); } finally { window.alert = prev; }
  };

  // Verificador/completador LLM reutilizable para EDIT/CREATE (NUEVO)
  const llmCompleteMissingOpsLocal = async (
    mode: "EDIT" | "CREATE",
    userGoal: string,
    currentPatch: PatchEnvelope,
    modelSnapshot?: unknown
  ): Promise<PatchEnvelope> => {
    const abs = getAbstract();
    const summarizeAbs = (a: AbstractSyntax) => {
      const els = Object.keys(a.elements || {}).join(", ") || "(none)";
      const rels = Object.entries(a.relationships || {}).map(([k, v]) => `${k}: ${v.source}→[${v.target.join(", ")}]`).join("; ") || "(none)";
      return `Elements: [${els}]\nRelationships: ${rels}`;
    };

    const sys = [
      "You are a strict patch verifier for a modeling tool. The user may write in ANY language.",
      "Task: Compare the user's instruction with the CURRENT PATCH. If anything is missing, return ONLY the missing operations to fully satisfy the instruction.",
      'Output MUST be a single valid JSON object: {"ops": [...]} (PATCH schema).',
      "Do NOT repeat operations already covered. Use only element names in refs.",
      "Use ONLY element/relationship types allowed by the abstract syntax below.",
      "If a relationship type is not provided and exactly one candidate fits the meta, use it.",
      "Expand lists/conjunctions in the user's instruction.",
      'If nothing is missing, return {"ops":[]}."',
      "",
      "Abstract syntax (strict):",
      summarizeAbs(abs)
    ].join("\n");

    const payload = {
      mode,
      userInstruction: userGoal,
      currentPatch,
      ...(modelSnapshot ? { modelSnapshot } : {})
    };

    const { text } = await callOpenRouterCascade(
      apiKey,
      selectedModel,
      JSON.stringify(payload),
      sys,
      { perModelRetries: 1, validate: (out) => !!safeParseJSON(stripCodeFences(out)) }
    );

    const extra = safeParseJSON(stripCodeFences(text));
    if (extra && Array.isArray(extra.ops)) return extra as PatchEnvelope;
    return { ops: [] };
  };

  const stageStep = (s: string) => { setStage(s); addLog(`[stage] ${s}`); };
  const strip = (t: string) => stripCodeFences(t);
  const parse = (t: string) => safeParseJSON(strip(t));

  const getSelectedModel = () => {
    const selectedId = ps.getTreeIdItemSelected?.();
    let m = selectedId ? ps.findModelById(ps.project, selectedId) : null;
    if (!m) return null;
    const currentLangKey = String(currentLanguage?.name || currentLanguage?.id || "");
    if (String(m.type) !== currentLangKey) {
      addLog(`[warn] Selected model type "${m.type}" ≠ dropdown "${currentLanguage?.name}". Usaré el lenguaje del modelo seleccionado para EDIT.`);
    }
    return m;
  };

  const forceRefresh = (model?: any) => {
    if (model) ps.raiseEventSelectedModel?.(model);
    ps.requestRender?.();
    ps.repaint?.();
  };
  // ---------- FIN HELPERS ----------

  if (!ps || !currentLanguage) {
    addLog("ps/language not available");
    setBusy(false);
    return;
  }

  // ------------------ FAST-PATH JSON (igual) ------------------
  try {
    const rawCandidate = stripCodeFences(userText);
    const userObj = safeParseJSON(rawCandidate);

    if (userObj && (looksLikePatch(userObj) || looksLikePlan(userObj))) {
      const abs = getAbstract();
      if (!Object.keys(abs.elements || {}).length) throw new Error("abstractSyntax vacío");

      setThread(prev => [...prev, { role: "assistant", content: "Recibí JSON. Ejecutándolo sin LLM…" }]);

      if (looksLikePatch(userObj)) {
        let targetModel = getSelectedModel();
        if (!targetModel) throw new Error("No hay modelo seleccionado para aplicar el PATCH.");

        let patch: PatchEnvelope = userObj as PatchEnvelope;
        patch = upgradeDeleteCreateToUpdate(patch, targetModel, abs);
        patch = addMissingRequiredPropsLocal(patch, abs, userText);
        patch = dedupeConnects(patch);
        normalizeRefsInOps(patch.ops as any[], targetModel, patch);
        patch = repairUnknownSelectorsByMentions(patch, targetModel, userText);
        const { creates, connects, others } = splitCreateConnect(patch);

        // 1) create
        let createsSan = sanitizePatchForEditStrict(creates, targetModel, abs);
        createsSan = assignPositionsToCreates(createsSan, targetModel);
        if (createsSan.ops.length) {
          stageStep(`Creating elements (${createsSan.ops.length})…`);
          await withNoAlert(() => applyPatch(ps, targetModel!, createsSan));
          targetModel = ps.findModelById(ps.project, targetModel!.id) || targetModel;
          forceRefresh(targetModel);
          ps.saveProject?.();
        }

        // 2) otros
        let othersSan = sanitizePatchForEditStrict(others, targetModel, abs);
        if (othersSan.ops.length) {
          stageStep(`Applying other ops (${othersSan.ops.length})…`);
          othersSan = bindNameRefsToIds(othersSan, targetModel);
          othersSan = scopeRelationshipDeletesToDeletedElements(othersSan, targetModel);
          await withNoAlert(() => applyPatch(ps, targetModel!, othersSan));

          if (ensureTypeChangeApplied(othersSan, targetModel, abs)) {
            forceRefresh(targetModel);
            ps.saveProject?.();
          }

          targetModel = ps.findModelById(ps.project, targetModel!.id) || targetModel;
          forceRefresh(targetModel);
          ps.saveProject?.();
        }

        // 3) relaciones
        let connectsHealed = fixDanglingConnectsUsingTypes(connects, targetModel, abs, userText, createsSan);
        let connectsSan = sanitizePatchForEditStrict(connectsHealed, targetModel, abs);
        connectsSan = filterConnectsForEdit(connectsSan, createsSan, targetModel, userText);
        connectsSan = bindNameRefsToIds(connectsSan, targetModel);
        if (connectsSan.ops.length) {
          stageStep(`Applying relationships (${connectsSan.ops.length})…`);
          await withNoAlert(() => applyPatch(ps, targetModel!, connectsSan));
          forceRefresh(targetModel);
          ps.saveProject?.();
        } else {
          addLog("[edit] No quedaron relaciones válidas tras sanitizar/bind.");
        }

        stageStep("Done ✅");
        setBusy(false);
        setTimeout(() => setStage(""), 800);
        return;
      }

      // PLAN directo → crear modelo nuevo
      if (looksLikePlan(userObj)) {
        const plan0 = userObj.nodes || userObj.edges ? nodesEdgesToPlan(userObj) : userObj;
        const absPlan = getAbstract();
        const plan = validatePlanStrict(plan0, absPlan);
        if (!plan.elements.length) throw new Error("PLAN vacío o inválido.");

        let patch = planToPatch(plan, { elements: [], relationships: [] }, absPlan);
        patch = sanitizePatchForCreateStrictLocal(dedupeConnects(patch), absPlan);
        normalizeRefsInOps(patch.ops as any[], undefined, patch);

        const planLite = patchToPlanLiteLocal(patch);

        stageStep("Injecting model…");
        await withNoAlert(() => {
          const created = injectIntoProject(planLite, currentLanguage as Language, phase, absPlan);
          if (created?.id) lastModelIdRef.current = created.id;
        });

        stageStep("Listo ✅");
        setBusy(false);
        setTimeout(() => setStage(""), 800);
        return;
      }
    }
  } catch (err: any) {
    setThread(prev => [...prev, { role: "assistant", content: "Error (fast-path JSON): " + (err?.message || err) }]);
    setBusy(false);
    return;
  }
  // ------------------ FIN FAST-PATH ------------------

  // ============ LLM PATH ============
  const abs = getAbstract();
  if (!Object.keys(abs.elements || {}).length) { addLog("abstractSyntax vacío"); setBusy(false); return; }

  // (1) Memoria del proyecto
  const plk = harvestProductLineKnowledge(ps, currentLanguage, 40);

  const summarizeAbs = (a: AbstractSyntax) => {
    const els = Object.keys(a.elements || {}).join(", ") || "(none)";
    const rels = Object.entries(a.relationships || {}).map(([k, v]) => `${k}: ${v.source}→[${v.target.join(", ")}]`).join("; ") || "(none)";
    return `Elements: [${els}]\nRelationships: ${rels}`;
  };

  const sysBase = (hasSel: boolean, plkArg?: PLKnowledge) => {
    const absSummary = summarizeAbs(abs);
    const memory = renderProjectMemory(plkArg, currentLanguage as Language);
    return [
      "You are a modeling assistant. Output MUST be one valid JSON (no backticks).",
      hasSel
        ? 'Return a PATCH only: {"ops":[...]}'
        : 'Prefer a PLAN: {"name":...,"elements":[...],"relationships":[...]}. PATCH is also accepted.',
      "CRITICAL: cover ALL instructions in one response. Use only element NAMES in refs.",
      "To change classification (AbstractFeature↔ConcreteFeature) use updateElement with changes.type.",
      "",
      "Abstract syntax (strict):",
      absSummary,
      "",
      memory
    ].join("\n");
  };

  // selección actual (para modo)
  const selectedId = ps.getTreeIdItemSelected?.();
  let targetModel = selectedId ? ps.findModelById(ps.project, selectedId) : null;
  const currentLangKey = String(currentLanguage?.name || currentLanguage?.id || "");
  if (targetModel && String(targetModel.type) !== currentLangKey) targetModel = null;
  const hasSelection = !!targetModel;

  const { clean: cleanUserText, forced } = extractInlineMode(userText);
  const effectiveMode: "EDIT" | "CREATE" = forced ?? (hasSelection ? "EDIT" : "CREATE");

  let placeholderIdx = -1;
  setThread((prev) => {
    const next: Message[] = [...prev, { role: "user", content: String(userText) }, { role: "assistant", content: "__typing__" }];
    placeholderIdx = next.length - 1;
    return next;
  });

  if (!apiKey) {
    setThread(prev => [...prev, { role: "assistant", content: "Missing OpenRouter API Key." }]);
    setBusy(false);
    return;
  }

  try {
    const langName = currentLanguage?.name || ps.getSelectedLanguage?.() || "Language";

    // ========= EDIT =========
    if (effectiveMode === "EDIT" && hasSelection) {
      const snapshot = buildSnapshot(targetModel);
      const prompt = buildEditPrompt({ snapshot, userGoal: cleanUserText, patchSchema: PATCH_SCHEMA_TEXT });
      stageStep("Calling API… (edit)");

      const { text: botText, usedModelId } = await callOpenRouterCascade(
        apiKey, selectedModel, prompt, sysBase(true, plk),
        { perModelRetries: 1, validate: (raw) => !!parse(raw) }
      );

      setThread((prev) => {
        const copy = [...prev];
        copy[placeholderIdx] = { role: "assistant", content: (botText || "(no content)") + `\n\n— Modelo: ${modelLabel(usedModelId)}` };
        return copy;
      });

      const parsed = parse(botText || "");
      if (!parsed) throw new Error("La respuesta no es JSON válido.");
      let patch: PatchEnvelope = Array.isArray((parsed as any)?.ops)
        ? (parsed as PatchEnvelope)
        : (() => { throw new Error("Esperaba PATCH en modo EDIT."); })();

      // 2 pasadas de completitud
      for (let pass = 0; pass < 2; pass++) {
        const extra = await llmCompleteMissingOpsLocal("EDIT", cleanUserText, patch, snapshot);
        if (!extra?.ops?.length) break;
        patch = mergePatches(patch, extra);
      }

      // Saneos + normalización
      patch = upgradeDeleteCreateToUpdate(patch, targetModel, abs);
      patch = addMissingRequiredPropsLocal(patch, abs, cleanUserText);
      patch = dedupeConnects(patch);
      normalizeRefsInOps(patch.ops as any[], targetModel, patch);
      patch = repairUnknownSelectorsByMentions(patch, targetModel, cleanUserText);
      const { creates, connects, others } = splitCreateConnect(patch);

      // 1) create
      let createsSan = sanitizePatchForEditStrict(creates, targetModel, abs);
      createsSan = assignPositionsToCreates(createsSan, targetModel);
      if (createsSan.ops.length) {
        stageStep(`Creating elements (${createsSan.ops.length})…`);
        await withNoAlert(() => applyPatch(ps, targetModel!, createsSan));
        targetModel = ps.findModelById(ps.project, targetModel!.id) || targetModel;
        forceRefresh(targetModel);
        ps.saveProject?.();
      }

      // 2) otros
      let othersSan = sanitizePatchForEditStrict(others, targetModel, abs);
      if (othersSan.ops.length) {
        stageStep(`Applying other ops (${othersSan.ops.length})…`);
        othersSan = bindNameRefsToIds(othersSan, targetModel);
        othersSan = scopeRelationshipDeletesToDeletedElements(othersSan, targetModel);
        await withNoAlert(() => applyPatch(ps, targetModel!, othersSan));

        if (ensureTypeChangeApplied(othersSan, targetModel, abs)) {
          forceRefresh(targetModel);
          ps.saveProject?.();
        }

        targetModel = ps.findModelById(ps.project, targetModel!.id) || targetModel;
        forceRefresh(targetModel);
        ps.saveProject?.();
      }

      // 3) relaciones
      let connectsHealed = fixDanglingConnectsUsingTypes(connects, targetModel, abs, cleanUserText, createsSan);
      let connectsSan = sanitizePatchForEditStrict(connectsHealed, targetModel, abs);
      connectsSan = filterConnectsForEdit(connectsSan, createsSan, targetModel, cleanUserText);
      connectsSan = bindNameRefsToIds(connectsSan, targetModel);
      if (connectsSan.ops.length) {
        stageStep(`Applying relationships (${connectsSan.ops.length})…`);
        await withNoAlert(() => applyPatch(ps, targetModel!, connectsSan));
        lastModelIdRef.current = targetModel!.id;
        forceRefresh(targetModel);
        ps.saveProject?.();
      } else {
        addLog("[edit] No quedaron relaciones válidas tras sanitizar/bind.");
      }

      stageStep("Done ✅");
      setBusy(false);
      setTimeout(() => setStage(""), 800);
      return;
    }

    // ========= CREATE =========
    stageStep("Calling API… (create)");

    const memoryHint = plk ? [
      `[Contexto del proyecto]`,
      `Raíces comunes (mismo lenguaje): {${(plk.sameLang.rootNames || []).join(", ")}}`,
      `Conceptos frecuentes (mismo lenguaje): ${plk.sameLang.knownElementNames.slice(0, 15).join(", ")}`,
      `Conceptos frecuentes (global PL): ${plk.knownElementNames.slice(0, 20).join(", ")}`,
      `Directiva: si el usuario menciona conceptos de OTRO lenguaje (p.ej., Features/Bundles),`,
      `- MAPEAR a elementos válidos de este lenguaje (no crees elementos de otros lenguajes).`,
      `- Si la meta define relaciones para trazabilidad, úsalas hacia NOMBRES existentes.`,
    ].join("\n") : "";

    const userPromptCreate = buildCreatePrompt({
      languageName: langName,
      userGoal: `${memoryHint}\n\n${cleanUserText}`,
      patchSchema: PATCH_SCHEMA_TEXT
    });

    const { text: botText, usedModelId } = await callOpenRouterCascade(
      apiKey, selectedModel, userPromptCreate, sysBase(false, plk),
      { perModelRetries: 1, validate: (raw) => !!parse(raw) }
    );

    setThread((prev) => {
      const copy = [...prev];
      copy[placeholderIdx] = { role: "assistant", content: (botText || "(no content)") + `\n\n— Modelo: ${modelLabel(usedModelId)}` };
      return copy;
    });

    const parsed = parse(botText || "");
    if (!parsed) throw new Error("La respuesta del modelo no es JSON válido.");

    // Normalizamos a PLAN sin salirnos del lenguaje
    let originalCreatesCount = 0;
    let planNormalized: PlanLLM;
    if (Array.isArray((parsed as any)?.ops)) {
      const patchLLM = parsed as PatchEnvelope;
      originalCreatesCount = (patchLLM.ops || []).filter(o => (o as any).op === "createElement").length;
      const absCreate = getAbstract();
      const patchSan1 = sanitizePatchForCreateStrictLocal(
        dedupeConnects(addMissingRequiredPropsLocal(patchLLM, absCreate, cleanUserText)),
        absCreate
      );
      const planLite = patchToPlanLiteLocal(patchSan1);
      planNormalized = validatePlanStrict(planLite, absCreate);
    } else {
      const plan0 = (parsed as any).nodes || (parsed as any).edges ? nodesEdgesToPlan(parsed) : (parsed as any);
      planNormalized = validatePlanStrict(plan0, abs);
      originalCreatesCount = (planNormalized.elements || []).length;
    }

    if (!planNormalized.elements.length) throw new Error("PLAN vacío tras sanitizar.");

    // PLAN → PATCH inicial
    let patch = planToPatch(planNormalized, { elements: [], relationships: [] }, abs);
    patch = sanitizePatchForCreateStrictLocal(dedupeConnects(patch), abs);
    normalizeRefsInOps(patch.ops as any[], /*model*/ undefined, /*patchForCreate*/ patch);

    // ===== PASADAS DE COMPLETITUD EN CREATE (NUEVO) =====
    for (let pass = 0; pass < 2; pass++) {
      const extra = await llmCompleteMissingOpsLocal("CREATE", cleanUserText, patch /* no snapshot */);
      if (!extra?.ops?.length) break;

      // Sanitizar el extra y fusionar
      let extraSan = sanitizePatchForCreateStrictLocal(
        dedupeConnects(addMissingRequiredPropsLocal(extra, abs, cleanUserText)),
        abs
      );
      normalizeRefsInOps(extraSan.ops as any[], undefined, extraSan);
      patch = mergePatches(patch, extraSan);
    }

    // Si el LLM propuso muchos elementos pero la sanitización dejó muy pocos → recast dentro del lenguaje
    const keptCreates = (patch.ops || []).filter(o => (o as any).op === "createElement").length;
    const heavyDrop = originalCreatesCount > 0 && keptCreates < Math.max(3, Math.ceil(originalCreatesCount / 2));
    if (heavyDrop) {
      addLog(`[create] Heavy drop detected (${keptCreates}/${originalCreatesCount}). Recasting within language…`);

      const allowed = Object.keys(abs.elements || {}).join(", ");
      const recastSys = sysBase(false, plk);
      const recastUser = [
        "Your previous output used types outside the current language.",
        "Re-issue a complete PLAN strictly using ONLY these element types:",
        `[ ${allowed} ]`,
        "Map any foreign-language concepts (e.g., Features/Bundles) into valid elements of this language.",
        "Prefer relationships where exactly one valid type exists for the chosen source/target.",
        "",
        cleanUserText
      ].join("\n");

      const { text: recastText } = await callOpenRouterCascade(
        apiKey, selectedModel, recastUser, recastSys,
        { perModelRetries: 1, validate: (raw) => !!parse(raw) }
      );

      const recParsed = parse(recastText || "");
      if (recParsed) {
        let recPlan: PlanLLM;
        if (Array.isArray((recParsed as any)?.ops)) {
          const patchLLM = recParsed as PatchEnvelope;
          const patchSan1 = sanitizePatchForCreateStrictLocal(
            dedupeConnects(addMissingRequiredPropsLocal(patchLLM, abs, cleanUserText)),
            abs
          );
          normalizeRefsInOps(patchSan1.ops as any[], undefined, patchSan1);
          const planLite = patchToPlanLiteLocal(patchSan1);
          recPlan = validatePlanStrict(planLite, abs);
        } else {
          const plan0 = (recParsed as any).nodes || (recParsed as any).edges ? nodesEdgesToPlan(recParsed) : (recParsed as any);
          recPlan = validatePlanStrict(plan0, abs);
        }

        if (recPlan.elements.length) {
          let recPatch = planToPatch(recPlan, { elements: [], relationships: [] }, abs);
          recPatch = sanitizePatchForCreateStrictLocal(dedupeConnects(recPatch), abs);
          normalizeRefsInOps(recPatch.ops as any[], undefined, recPatch);
          patch = mergePatches({ ops: [] }, recPatch); // reemplaza por la versión recasteada
        }
      }
    }

    // Descarta connects con ids en CREATE
    patch.ops = patch.ops.filter(op =>
      op.op !== "connect" || (!op.source?.id && !op.target?.id)
    );

    const planLiteFinal = patchToPlanLiteLocal(patch);

    stageStep("Injecting model…");
    await withNoAlert(() => {
      const created = injectIntoProject(planLiteFinal, currentLanguage as Language, phase, abs);
      if (created?.id) lastModelIdRef.current = created.id;
    });

    stageStep("Listo ✅");
    setBusy(false);
    setTimeout(() => setStage(""), 800);
    return;

  } catch (e: any) {
    addLog(`[error] ${e?.message || e}`);
    const msg = String(e?.message || "");
    let hint = "";
    if (/free model publication/i.test(msg)) {
      hint = "\nAjusta tu privacidad en OpenRouter (Settings → Privacy → habilita Free model publication) o usa un modelo no-free.";
    } else if (/404/i.test(msg)) {
      hint = "\nEl endpoint del proveedor no está disponible ahora (404). Prueba de nuevo o selecciona otro modelo.";
    } else if (/429/i.test(msg)) {
      hint = "\nHas alcanzado el rate limit (429). Espera un poco o cambia de modelo.";
    }
    setThread((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((m) => m.content === "__typing__");
      const text = "Error: " + msg + hint;
      if (idx >= 0) copy[idx] = { role: "assistant", content: text };
      else copy.push({ role: "assistant", content: text });
      return copy;
    });
  } finally {
    setBusy(false);
    setTimeout(() => setStage(""), 800);
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
