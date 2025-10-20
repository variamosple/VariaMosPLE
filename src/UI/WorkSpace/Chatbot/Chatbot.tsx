import React, { useEffect, useMemo, useState } from "react";
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

// =======================
// 1) callOpenRouterOnce
// =======================
async function callOpenRouterOnce(
  apiKey: string,
  modelId: string,
  userContent: string,
  systemContent?: string
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "HTTP-Referer": (typeof window !== "undefined" ? window.location.origin : ""),
    "X-Title": (typeof document !== "undefined" ? (document.title || "Variamos") : "Variamos")
  };

  const body = {
    model: modelId,
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
    throw new Error(msg);
  }

  // Anti-fallback si se pidió un modelo ":free"
  const usedModel = data?.model || data?.choices?.[0]?.model || data?.choices?.[0]?.provider;
  const requestedIsFree = MODEL_OPTIONS.some(m => m.id === modelId && m.free);
  if (requestedIsFree && usedModel && !/:free(\b|$)/i.test(String(usedModel))) {
    throw new Error(`The free pool is not available. (used: ${usedModel})`);
  }

  return String(data?.choices?.[0]?.message?.content ?? "");
}



type IntentResult = { intent: "create" | "edit"; language?: string; confidence?: number };

const heuristicIntent = (text: string, hasSelection: boolean): IntentResult => {
  const t = text.toLowerCase();
  // Palabras en varios idiomas (muy cortita solo como fallback)
  const createHints = [
    "nuevo modelo","modelo nuevo","crear modelo","crear un modelo","genera un modelo",
    "new model","create a new model","another model","separate model",
    "novo modelo","criar modelo","model novo",
    "nouveau modèle","créer un modèle",
    "nuovo modello","crea un modello",
    "neues modell","neues model","neues modell anlegen"
  ];
  const editHints = [
    "editar","modifica","cambia","agrega","añade","elimina","borra","conecta","relaciona","renombra","ajusta","actualiza","set ",
    "edit","modify","change","add ","remove","delete","connect","rename","update","set ",
    "editar","alterar","adicionar","remover","conectar","renomear",
    "modifier","ajouter","supprimer","connecter","renommer",
    "modificare","aggiungi","rimuovi","collega","rinomina",
    "bearbeiten","ändern","hinzufügen","entfernen","verbinden","umbenennen","aktualisieren"
  ];
  if (createHints.some(h => t.includes(h))) return { intent: "create", confidence: 0.6 };
  if (editHints.some(h => t.includes(h))) return { intent: "edit", confidence: 0.6 };
  // Ambiguo → si hay selección, preferimos editar
  return { intent: hasSelection ? "edit" : "create", confidence: 0.4 };
};

async function detectIntentWithAI(
  apiKey: string,
  modelId: string,
  userText: string,
  hasSelection: boolean
): Promise<IntentResult> {
  const system = [
    "You are a multilingual intent classifier for a modeling tool.",
    "The user can write in ANY language.",
    "Decide if the instruction wants to CREATE a NEW model or EDIT the CURRENTLY SELECTED model.",
    "If the message asks to add/rename/delete/connect/set/fix/update/complete/refactor or otherwise modify an existing model → intent='edit'.",
    "If it asks for a new/another/separate/different model, from scratch, template, or multiple alternatives → intent='create'.",
    `If ambiguous, and hasSelection=${hasSelection}, prefer 'edit' when true; otherwise 'create'.`,
    "Return ONLY valid JSON without backticks: " +
      `{"intent":"create|edit","language":"<iso guess or ''>","confidence":0..1}`
  ].join("\n");
  const user = `User instruction:\n${userText}\n\nhasSelection=${hasSelection}`;
  try {
    const raw = await callOpenRouterOnce(apiKey, modelId, user, system);
    const parsed = safeParseJSON(stripCodeFences(raw)) as IntentResult | null;
    if (parsed && (parsed.intent === "create" || parsed.intent === "edit")) return parsed;
  } catch { /* caemos al heurístico */ }
  return heuristicIntent(userText, hasSelection);
}


type ChatbotProps = {
  projectService?: ProjectService;
};

/** ===== Chatbot ===== */
const Chatbot: React.FC<ChatbotProps> = ({ projectService}) => {
  // PS por props o fallback a window
  const [ps, setPs] = useState<any>(projectService ?? null);
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
// 2) send
// =========
// =========
// 2) send
// =========
const send = async (userText: string) => {
  if (!ps || !currentLanguage) { addLog("ps/language not available"); return; }

  const stageStep = (s: string) => { setStage(s); addLog(`[stage] ${s}`); };

  stageStep("Preparing prompt");
  const abs = getAbstract();
  if (!Object.keys(abs.elements).length) { addLog("abstractSyntax void"); return; }

  if (!apiKey) {
    setThread(prev => [...prev, { role: "assistant", content: "Your OpenRouter API Key is missing. Enter the key in the header field." }]);
    return;
  }

  stageStep("Gathering context from the product line…");
  const plKnowledge = harvestProductLineKnowledge(ps, currentLanguage);

  // — Modelo seleccionado —
  const selectedId = ps.getTreeIdItemSelected?.();
  const targetModel = selectedId ? ps.findModelById(ps.project, selectedId) : null;
  const hasSelection = !!targetModel;

  // ===== IA: detección de intención multilingüe =====
  stageStep("Detecting intent (language-agnostic)...");
  const modelId = selectedModel;

  const heuristicIntent = (text: string): "create" | "edit" => {
    const t = text.toLowerCase();
    const createHints = [
      "nuevo modelo","modelo nuevo","crear modelo","crear un modelo","genera un modelo",
      "new model","create a new model","another model","separate model","duplicate model","duplicar modelo",
      "novo modelo","criar modelo","model novo",
      "nouveau modèle","créer un modèle",
      "nuovo modello","crea un modello",
      "neues modell","modell anlegen"
    ];
    const editHints = [
      "editar","modifica","cambia","agrega","añade","elimina","borra","conecta","relaciona","renombra","ajusta","actualiza","set ",
      "edit","modify","change","add ","remove","delete","connect","rename","update","set ",
      "alterar","adicionar","remover","conectar","renomear",
      "modifier","ajouter","supprimer","connecter","renommer",
      "modificare","aggiungi","rimuovi","collega","rinomina",
      "bearbeiten","ändern","hinzufügen","entfernen","verbinden","umbenennen","aktualisieren"
    ];
    if (createHints.some(h => t.includes(h))) return "create";
    if (editHints.some(h => t.includes(h))) return "edit";
    return hasSelection ? "edit" : "create";
  };

  let wantCreate: boolean;
  try {
    const sysIntent = [
      "You are a multilingual intent classifier for a modeling tool.",
      "The user may write in ANY language.",
      "Decide if the instruction wants to CREATE a NEW model or EDIT the CURRENTLY SELECTED model.",
      "If the message asks to add/rename/delete/connect/set/fix/update/complete/refactor or otherwise modify an existing model → intent='edit'.",
      "If it asks for a new/another/separate/different model, from scratch, template, or multiple alternatives → intent='create'.",
      `If ambiguous and hasSelection=${hasSelection}, prefer 'edit' when true; else 'create'.`,
      "Return ONLY valid JSON without backticks: {\"intent\":\"create|edit\",\"language\":\"<guess or ''>\",\"confidence\":0..1}"
    ].join("\n");
    const userIntent = `User instruction:\n${userText}\n\nhasSelection=${hasSelection}`;
    const rawIntent = await callOpenRouterOnce(apiKey, modelId, userIntent, sysIntent);
    const intentParsed = safeParseJSON(stripCodeFences(rawIntent)) as { intent?: string; confidence?: number; language?: string } | null;
    const intent = (intentParsed?.intent === "create" || intentParsed?.intent === "edit")
      ? (intentParsed.intent as "create" | "edit")
      : heuristicIntent(userText);
    addLog(`[intent] ${intent} conf=${(intentParsed?.confidence ?? 0).toFixed?.(2) ?? "?"} lang=${intentParsed?.language ?? "?"}`);
    wantCreate = !hasSelection ? true : intent === "create";
  } catch {
    const intent = heuristicIntent(userText);
    addLog(`[intent:fallback] ${intent}`);
    wantCreate = !hasSelection ? true : intent === "create";
  }

  // — UI —
  setBusy(true);
  let placeholderIdx = -1;
  setThread(prev => {
    const next: Message[] = [...prev, { role: "user" as Role, content: String(userText) }, { role: "assistant" as Role, content: "__typing__" }];
    placeholderIdx = next.length - 1;
    return next;
  });

  // Helper local: convierte PATCH (de creación) → PLAN
  const patchToPlan = (patch: any): PlanLLM => {
    const elements: { name: string; type: string; props?: Record<string, any> }[] = [];
    const relationships: { type: string; source: string; target: string; props?: Record<string, any> }[] = [];
    const have = new Set<string>();

    const getNameFromRef = (ref: any) =>
      (ref?.name || ref?.id || "").toString();

    for (const op of (patch?.ops || [])) {
      if (!op || !op.op) continue;

      if (op.op === "createElement") {
        const name = String(op.name ?? "").trim();
        const type = String(op.type ?? "").trim();
        if (!name || !type) continue;
        if (!have.has(name)) {
          const props: Record<string, any> = {};
          if (Array.isArray(op.properties)) {
            for (const p of op.properties) {
              if (p?.name) props[p.name] = p.value ?? "";
            }
          }
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
        if (Array.isArray(op.properties)) {
          for (const p of op.properties) {
            if (p?.name) props[p.name] = p.value ?? "";
          }
        }
        relationships.push({ type, source, target, ...(Object.keys(props).length ? { props } : {}) });
      }
    }
    return { name: "Generated Model", elements, relationships };
  };

  try {
    // =======================
    // EDIT (PATCH)
    // =======================
    if (hasSelection && !wantCreate) {
      const snapshot = buildSnapshot(targetModel);
      const prompt = buildEditPrompt({ snapshot, userGoal: userText, patchSchema: PATCH_SCHEMA_TEXT });
      const sys = buildUnifiedSystemPrompt(abs, plKnowledge || undefined, true, PATCH_SCHEMA_TEXT);

      stageStep("Calling API… (edit)");
      const botText = await callOpenRouterOnce(apiKey, modelId, prompt, sys);

      setThread(prev => { const copy = [...prev]; copy[placeholderIdx] = { role: "assistant", content: botText || "(no content)" }; return copy; });
      if (!botText) return;

      stageStep("Parsing patch…");
      const parsed = safeParseJSON(stripCodeFences(botText));
      if (!parsed || !Array.isArray((parsed as any).ops)) throw new Error("La respuesta no es un PATCH válido.");

      const env: PatchEnvelope = parsed as PatchEnvelope;
      stageStep(`Applying patch (${env.ops.length} ops)…`);
      applyPatch(ps, targetModel, env);
      ps.saveProject?.();
      stageStep("Done ✅");
      return;
    }

    // =======================
    // CREATE (PLAN preferido; PATCH → convert to PLAN)
    // =======================
    if (hasSelection) {
      const ok = window.confirm?.("Tienes un modelo seleccionado. ¿Crear uno nuevo en vez de editarlo?") ?? true;
      if (!ok) { stageStep("Cancel"); return; }
    }

    const langName = (currentLanguage?.name) || ps.getSelectedLanguage?.() || "Generic Language";
    const prompt = buildCreatePrompt({ languageName: langName, userGoal: userText, patchSchema: PATCH_SCHEMA_TEXT });
    const sysCreate = buildUnifiedSystemPrompt(abs, plKnowledge || undefined, false, PATCH_SCHEMA_TEXT)
      + "\n\nIMPORTANT: For creation, prefer returning a PLAN object. If you still return PATCH, it must contain only createElement/connect ops.";

    stageStep("Calling API… (create)");
    const botText = await callOpenRouterOnce(apiKey, modelId, prompt, sysCreate);

    setThread(prev => { const copy = [...prev]; copy[placeholderIdx] = { role: "assistant", content: botText || "(no content)" }; return copy; });
    if (!botText) return;

    stageStep("Parsing response…");
    const parsed = safeParseJSON(stripCodeFences(botText));
    if (!parsed) throw new Error("La respuesta del modelo no es JSON válido.");

    // Si llega PATCH, lo convertimos a PLAN (para evitar el bug de applyPatch en creación)
    let planCandidate: any = parsed;
    if (Array.isArray((parsed as any).ops)) {
      addLog("[create] PATCH detected → converting to PLAN");
      planCandidate = patchToPlan(parsed);
    } else if (parsed.nodes || parsed.edges) {
      planCandidate = nodesEdgesToPlan(parsed);
    }

    stageStep("Validating and normalizing (plan)...");
    const plan = validateAndNormalizePlan(planCandidate, abs, userText, plKnowledge || undefined);
    if (!plan || !plan.elements.length) throw new Error("PLAN vacío tras validación.");

    stageStep("Inyectando al proyecto…");
    injectIntoProject(plan, currentLanguage as Language, phase, abs);
    stageStep("Listo ✅");
    return;

  } catch (e: any) {
    stageStep("Error");
    addLog(`[error] ${e?.message || e}`);
    setThread(prev => { const copy = [...prev]; copy[placeholderIdx] = { role: "assistant", content: "Error: " + (e?.message || e) }; return copy; });
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
