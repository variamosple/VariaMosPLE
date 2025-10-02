import React, { useEffect, useMemo, useState } from "react";
import "./Chatbot.css";

/** ===== Tipos ===== */
type Phase = "SCOPE" | "DOMAIN" | "APPLICATION";
type Role = "system" | "user" | "assistant";
interface Message { role: Role; content: string; }

interface Language {
  id: string | number;
  name: string;
  type: Phase;
  abstractSyntax?: any; // string u objeto
}

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

const OPENROUTER_URL = process.env.REACT_APP_CHATBOT_URL;

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
  // 1) Primero intenta por nombre (último paréntesis, p.ej. "... (Domain)")
  const byName = phaseFromName(l?.name);
  if (byName) return byName;

  // 2) Si no hay pista en el nombre, intenta por tipo (tolerante a variantes)
  const raw = String(l?.type ?? "").trim().toUpperCase().replace(/\s+/g, "-");
  if (raw.includes("SCOPE")) return "SCOPE";
  if (raw.startsWith("DOMAIN")) return "DOMAIN";
  if (raw.startsWith("APPLICATION")) return "APPLICATION";

  return null; // no clasifica → que no aparezca en ninguna fase
};
const phaseFromName = (n?: string): Phase | null => {
  const txt = String(n ?? "").toUpperCase();
  // toma el ÚLTIMO paréntesis por si hay otros en el nombre
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

    // Recolectar todos los modelos de la LP
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

    // Contadores
    const nameCount = new Map<string, number>();
    const typeCount = new Map<string, number>();
    const rootNameCount = new Map<string, number>();
    const relPatternCount = new Map<string, { type: string; sourceType: string; targetType: string; n: number }>();

    // Mismo lenguaje (por nombre)
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

/** ===== Chatbot ===== */
const Chatbot: React.FC = () => {
  const [ps, setPs] = useState<any>(null);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [phase, setPhase] = useState<Phase>("DOMAIN");
  const [languageId, setLanguageId] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].id);
  const [apiKey, setApiKey] = useState<string>(() => process.env.REACT_APP_OPENROUTER_API_KEY || "");
  useEffect(() => { localStorage.setItem("openrouter_api_key", apiKey); }, [apiKey]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<Message[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (s: string) => setLog(prev => [...prev, s]);

useEffect(() => { const tryAttach = () => { const svc = (window as any).projectService; if (!svc) return false; setPs(svc); const langs: Language[] = Array.isArray(svc.languages) ? svc.languages : []; setAllLanguages(langs); addLog(`[ps] attach ok, languages=${langs.length}`); try { svc.addLanguagesDetailListener(() => { const latest: Language[] = Array.isArray(svc.languages) ? svc.languages : []; setAllLanguages(latest); addLog(`[ps] languages updated=${latest.length}`); }); } catch {} try { svc.refreshLanguageList?.(); } catch {} return true; }; if (tryAttach()) return; const onReady = () => { tryAttach(); }; window.addEventListener("projectservice:ready", onReady); let tries = 0; const id = setInterval(() => { if (tryAttach() || ++tries > 40) { clearInterval(id); window.removeEventListener("projectservice:ready", onReady); } }, 300); return () => { clearInterval(id); window.removeEventListener("projectservice:ready", onReady); }; }, []); 

useEffect(() => {
  if (!ps) return;

  let stop = false;
  let lastSig = "";

  const snapshot = (arr: Language[]) =>
    arr.map(l => `${l.id}|${l.name}|${l.type}|${l.name?.length}`).join("§");

  const tick = () => {
    const arr: Language[] = Array.isArray((ps as any).languages) ? (ps as any).languages : [];
    const sig = snapshot(arr);

    if (sig && sig !== lastSig) {
      lastSig = sig;
      setAllLanguages([...arr]);              // nueva referencia
      addLog(`[ps] languages poll → ${arr.length}`);
    }
    if (!stop) setTimeout(tick, 350);         // poll liviano
  };

  tick();
  return () => { stop = true; };
}, [ps]);  
 // /** 2) Lenguajes por fase */ const phaseLanguages = useMemo(() => { const f = allLanguages.filter(l => l?.type === phase); return f.length ? f : allLanguages; }, [allLanguages, phase]);
 /*
 const phaseLanguages = useMemo(() => {
  if (!allLanguages?.length) return [];

  // Ej.: "Context diagram (SCOPE)", "Class diagram (DOMAIN)", etc.
  const rx = new RegExp(`\\(\\s*${phase}\\s*\\)\\s*$`, "i");
  const byName = allLanguages.filter(l => rx.test(String(l?.name ?? "")));
  if (byName.length) return byName;

  const byType = allLanguages.filter(l => String(l?.type ?? "").toUpperCase() === phase);
  return byType.length ? byType : allLanguages;
}, [allLanguages, phase]);
*/
//const phaseLanguages = useMemo(() => {
//  if (!allLanguages?.length) return [];
  // Filtra estrictamente por la fase activa, usando la clasificación robusta.
//  return allLanguages.filter(l => getLangPhase(l) === phase);
//}, [allLanguages, phase]);
const phaseLanguages = useMemo(() => {
  if (!allLanguages?.length) return [];
  const filtered = allLanguages.filter(l => getLangPhase(l) === phase);
  return filtered.length ? filtered : allLanguages;
}, [allLanguages, phase]);



 useEffect(() => {
    if (phaseLanguages.length) setLanguageId(String(phaseLanguages[0].id));
    else setLanguageId("");
  }, [phaseLanguages]);

  const currentLanguage: Language | undefined = useMemo(
    () => phaseLanguages.find(l => String(l.id) === String(languageId)),
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

  // Índice de valores enumerados → [{element, prop}]
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

  // Tipo por defecto para instanciar conceptos del dominio
const chooseDefaultElementType = (abs: AbstractSyntax) => {
  const elDefs = abs.elements || {};
  const relDefs = abs.relationships || {};
  const elems = Object.keys(elDefs);
  if (!elems.length) return "";
  const incoming = new Map<string, number>();
  for (const r of Object.values(relDefs)) {
    for (const t of r.target) incoming.set(t, (incoming.get(t) || 0) + 1);
  }
  // Elegimos el tipo con más “conectabilidad” como fallback neutral
  return elems.reduce((best, k) =>
    (incoming.get(k) || 0) > (incoming.get(best) || 0) ? k : best, elems[0]);
};

  // Relación válida para sourceType → targetType
  const pickRelationTypeFor = (abs: AbstractSyntax, sourceType: string, targetType: string): string | null => {
    for (const [rname, rdef] of Object.entries(abs.relationships || {})) {
      if (rdef.source === sourceType && rdef.target.includes(targetType)) return rname;
    }
    return null;
  };

  // Extrae nombres del dominio desde el prompt (es/es-EN simple)
/*
  const inferDomainFromPrompt = (text: string, plk?: PLKnowledge) => {
    const t = (text || "").toLowerCase();

    // Heurística básica original
    let rootName = "Modelo";
    if (/ventas?\s+de\s+productos?/.test(t)) rootName = "Ventas de Productos";
    else if (/sistema/.test(t) && /venta|sales/.test(t)) rootName = "Sistema de Ventas";
    else if (/productos?/.test(t)) rootName = "Sistema de Productos";
    else if (/sales/.test(t)) rootName = "Sales System";

    const concepts: string[] = [];
    const add = (s: string) => { if (s && !concepts.includes(s)) concepts.push(s); };

    if (/productos?/.test(t)) add("Producto");
    if (/categor(ía|ia)s?/.test(t)) add("Categoria");
    if (/compr(as|a)|orden(es)?|pedido(s)?/.test(t)) add("Compra");
    if (/transacci(ó|o)n/.test(t)) add("Transaccion");
    if (/tarjeta\s+de\s+cr(é|e)dito|credit\s*card/.test(t)) add("PagoTarjeta");
    if (/transferenc(ia|e)/.test(t)) add("Transferencia");

    // Sesgo por LP: preferir rootNames y glosario existentes
    const preferredRoot = plk?.sameLang?.rootNames?.[0] || plk?.rootNames?.[0];
    if (preferredRoot) rootName = preferredRoot;

    const glossary = plk?.sameLang?.knownElementNames?.length
      ? plk.sameLang.knownElementNames
      : (plk?.knownElementNames || []);
    for (const g of glossary.slice(0, 8)) add(g);

    return { rootName, concepts };
  };
*/

  // Coerciona elemento; si type inválido lo mapea al tipo por defecto o a partir de possibleValues
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
        props[prop] = type;
        type = element;
        if (!name) name = `${type}_${i + 1}`;
      }
    }

    if (!allowedEl.has(type)) type = defaultType;
    if (!allowedEl.has(type)) return null;

    if (!name) name = `${type}_${i + 1}`;
    return { name, type, ...(Object.keys(props).length ? { props } : {}) };
  };

  /** 4) Prompt generado desde el lenguaje */
  /** (ACTUALIZADA) Prompt del sistema enriquecido con el contexto de la línea de productos */
  const buildSystemPrompt = (abs: AbstractSyntax, plk?: PLKnowledge) => {
    const elEntries = Object.entries(abs.elements || {});
    const relEntries = Object.entries(abs.relationships || {});
    const restr = abs.restrictions || {};
    const defaultElType = chooseDefaultElementType(abs);

    const elementsDesc = elEntries.map(([ename, edef]) => {
      const props = (edef.properties || []).map(p => {
        const pv = typeof p.possibleValues === "string" && p.possibleValues.trim().length
          ? ` (possibleValues: ${p.possibleValues})` : "";
        const df = p.defaultValue !== undefined ? ` (default: ${p.defaultValue})` : "";
        return `- ${p.name}: ${p.type}${pv}${df}`;
      }).join("\n");
      return `* ${ename}${props ? `\n${props}` : ""}`;
    }).join("\n");

    const relsDesc = relEntries.map(([rname, rdef]) => {
      const props = (rdef.properties || []).map(p => {
        const pv = typeof p.possibleValues === "string" && p.possibleValues.trim().length
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
    if (restr.quantity_element?.length) for (const q of restr.quantity_element) restrLines.push(`- quantity_element: element=${q.element}, min=${q.min}, max=${q.max}`);
    if (restr.unique_name?.elements?.length) restrLines.push(`- unique_name over groups: ${JSON.stringify(restr.unique_name.elements)}`);
    if (restr.parent_child?.length) for (const pc of restr.parent_child) restrLines.push(`- parent_child: child=${pc.childElement}, parent in [${pc.parentElement.join(", ")}]`);

    const plCtx = plk ? [
      `Contexto de la línea de productos activa: "${plk.productLineName || "(sin nombre)"}"`,
      `- Lenguajes en uso: ${plk.languages.join(", ") || "(n/a)"}`,
      `- Modelos (${plk.models.length}): ${plk.models.slice(0, 12).map(m => `[${m.phase}] ${m.name} <${m.type}>`).join("; ") || "(n/a)"}`,
      `- Glosario de conceptos (priorizar consistencia): ${plk.sameLang.knownElementNames.slice(0, 10).join(", ") || plk.knownElementNames.slice(0, 10).join(", ") || "(n/a)"}`,
      `- Tipos frecuentes: ${plk.sameLang.knownElementTypes.slice(0, 8).join(", ") || plk.knownElementTypes.slice(0, 8).join(", ") || "(n/a)"}`,
      `- Patrones de relación frecuentes: ${(plk.sameLang.relationshipPatterns.length ? plk.sameLang.relationshipPatterns : plk.relationshipPatterns)
        .slice(0, 12).map(p => `${p.type}: ${p.sourceType}→${p.targetType}`).join("; ") || "(n/a)"
      }`,
      `- Nombres raíz preferidos: ${plk.sameLang.rootNames.slice(0, 3).join(", ") || plk.rootNames.slice(0, 3).join(", ") || "(n/a)"}`
    ].join("\n") : "(sin contexto de LP)";

    return [
      "Eres un generador de modelos para una herramienta de Líneas de Producto.",
      "Devuelve **solo** JSON válido (sin backticks) con esta forma exacta:",
      `{"name": string, "elements":[{"name": string, "type": string, "props"?: object}], "relationships":[{"type": string, "source": string, "target": string, "props"?: object}]}`,
      "",
      "Instrucciones (derivadas del lenguaje):",
      `- Usa tipos **solo** de la lista de 'Elementos permitidos'. Si dudas, usa '${defaultElType}'.`,
      "- El campo `name` DEBE ser el **concepto del dominio** (ej.: Producto, Categoria, Compra, ...). Evita nombres iguales al tipo como 'ConcreteFeature'.",
      "- Si una propiedad tiene 'possibleValues', usa exactamente uno de esos valores en `props.<Propiedad>`.",
      "- Cada relación es un objeto con `type, source, target`. Si hay varios destinos, crea varios objetos (uno por destino).",
      "- `source` y `target` deben ser **nombres de elementos** creados en `elements`.",
      "- Mantén consistencia con el glosario, patrones de relación y nombres raíz usados previamente en la línea de productos. Si faltan elementos mínimos para la coherencia, puedes sugerir/agregar los imprescindibles siempre respetando las restricciones.",
      "",
      "Elementos permitidos y sus propiedades:",
      elementsDesc || "(sin elementos definidos)",
      "",
      "Relaciones permitidas:",
      relsDesc || "(sin relaciones definidas)",
      "",
      "Restricciones del lenguaje:",
      restrLines.length ? restrLines.join("\n") : "(sin restricciones declaradas)",
      "",
      "— Contexto de la línea de productos (resumen) —",
      plCtx
    ].join("\n");
  };


  /** 5) Validación + normalización con renombrado de dominio */
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

    // Terminos del usuario + sesgo LP
    const domainTerms: string[] = [];
    //const plConcepts = (plk?.sameLang?.knownElementNames?.length ? plk.sameLang.knownElementNames : (plk?.knownElementNames || [])).slice(0, 8);
    //const domainTerms = Array.from(new Set([...concepts, ...plConcepts]));

    // Elements (coerción)
    const rawElems: any[] = Array.isArray(plan.elements) ? plan.elements : [];
    const elems: PlanElement[] = [];
    for (let i = 0; i < rawElems.length; i++) {
      const fixed = coerceElementFromTypos(rawElems[i], allowedEl, pvIndex, defaultElType, i);
      if (fixed) elems.push(fixed);
    }

    // Renombrado de genéricos
    /*
    const renameIfGeneric = (e: PlanElement, idx: number) => {
      if (!e.name || e.name === e.type || /^(Root|Abstract|Concrete)Feature$/i.test(e.name)) {
        if (e.type === "RootFeature") e.name = rootName || "Root";
        else if (domainTerms.length) e.name = domainTerms[Math.min(idx, domainTerms.length - 1)];
        else e.name = `${e.type}_${idx + 1}`;
      }
    };
    let afIdx = 0, cfIdx = 0;
    for (const e of elems) {
      if (e.type === "RootFeature") renameIfGeneric(e, 0);
      if (e.type === "AbstractFeature") renameIfGeneric(e, afIdx++);
      if (e.type === "ConcreteFeature") renameIfGeneric(e, cfIdx++);
    }
   */
    const typeCounters = new Map<string, number>();
for (const e of elems) {
  const count = (typeCounters.get(e.type) || 0) + 1;
  typeCounters.set(e.type, count);
  if (!e.name || e.name === e.type) {
    e.name = `${e.type}_${count}`;
  }
}
    // unique_name
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

    // quantity_element (crear mínimos que falten)
    const qty = abs.restrictions?.quantity_element || [];
for (const q of qty) {
  if (!allowedEl.has(q.element)) continue; // saltar tipos que NO existen en este lenguaje
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

    // Asegurar presencia de conceptos del prompt + LP
    const haveNames = new Set(elems.map(e => e.name));
    const toAddConcepts = domainTerms.filter(c => !haveNames.has(c));
    for (const c of toAddConcepts) {
      elems.push({ name: c, type: defaultElType, props: {} });
    }

    // Índices
    const name2type = new Map(elems.map(e => [e.name, e.type]));
    const firstByType = new Map<string, string>();
    for (const e of elems) if (!firstByType.has(e.type)) firstByType.set(e.type, e.name);

    // Relaciones: aceptar invenciones → remap; expandir targets[]
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

    // Asegurar arcos root→concepto si existe relación válida
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

    // Patrones frecuentes de la LP: añadir los imprescindibles si aplican
    const pattList = (plk?.sameLang?.relationshipPatterns?.length
      ? plk.sameLang.relationshipPatterns
      : (plk?.relationshipPatterns || [])).slice(0, 10);

    for (const p of pattList) {
      if (!relDefs[p.type]) continue; // patrón no existe en el lenguaje actual
      const sName = firstByType.get(p.sourceType);
      const tName = firstByType.get(p.targetType);
      if (!sName || !tName) continue;
      const exists = expanded.some(x => x.type === p.type && x.source === sName && x.target === tName);
      if (!exists) {
        // Validar compatibilidad por si difiere de este lenguaje
        const valid = relDefs[p.type].source === p.sourceType && relDefs[p.type].target.includes(p.targetType);
        if (valid) expanded.push({ type: p.type, source: sName, target: tName });
        else {
          // fallback: mapear un tipo válido disponible
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

    // Elements
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

    // Relationships
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
      const langIdStr = String(lang.id);
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

  /** 8) Enviar mensaje */
  /** 8) Enviar mensaje */
  const send = async (userText: string) => {
    if (!ps || !currentLanguage) { addLog("ps/language not available"); return; }

    // helper para mostrar la etapa actual en la UI
    const stageStep = (s: string) => { setStage(s); addLog(`[stage] ${s}`); };

    stageStep("Preparing prompt");
    const abs = getAbstract();
    if (!Object.keys(abs.elements).length) { addLog("abstractSyntax void"); return; }

    // Requiere API key (OpenRouter)
    if (!apiKey) {
      setThread(prev => [...prev, {
        role: "assistant",
        content: "Your OpenRouter API Key is missing. Enter the key in the header field."
      }]);
      return;
    }

    // 1) Contexto adicional de la línea de productos
    stageStep("Gathering context from the product line…");
    const plKnowledge = harvestProductLineKnowledge(ps, currentLanguage);

    // 2) Construcción de mensajes
    const systemPrompt = buildSystemPrompt(abs, plKnowledge || undefined);
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText }
    ];

    // 3) OpenRouter
    const url = OPENROUTER_URL;
    const model = selectedModel;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": (typeof window !== "undefined" ? window.location.origin : ""),
      "X-Title": (typeof document !== "undefined" ? (document.title || "Variamos") : "Variamos")
    };

    // 4) UI: push del mensaje del usuario + placeholder “typing…” (en un solo setState)
    setBusy(true);
    let placeholderIdx = -1;
    setThread(prev => {
      const next: Message[] = [
        ...prev,
        { role: "user" as Role, content: String(userText) },
        { role: "assistant" as Role, content: "__typing__" }
      ];
      placeholderIdx = next.length - 1; // índice del "__typing__"
      return next;
    });

    try {
      // 5) Llamada HTTP
      stageStep("Calling API…");
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages })
      });

      const txt = await resp.text();
      let data: any = null;
      try { data = JSON.parse(txt); } catch { }
      addLog(`[http] ${resp.status}`);

      if (!resp.ok) {
        const msg = data?.error?.message || txt || `HTTP ${resp.status}`;
        stageStep("Error");
        setThread(prev => {
          const copy = [...prev];
          if (placeholderIdx >= 0 && placeholderIdx < copy.length) {
            copy[placeholderIdx] = { role: "assistant", content: `Model error: ${msg}` };
          } else {
            copy.push({ role: "assistant", content: `Model error: ${msg}` });
          }
          return copy;
        });
        setBusy(false);
        return;
      }

      // 6) Anti-fallback pagado si se pidió :free
      const requestedIsFree = MODEL_OPTIONS.find(m => m.id === model)?.free === true;
      const usedModel = data?.model || data?.choices?.[0]?.model || data?.choices?.[0]?.provider;
      addLog(`[llm] requested=${model} used=${usedModel || "(n/a)"} usage=${JSON.stringify(data?.usage || {})}`);
      if (requestedIsFree && usedModel && !/:free(\b|$)/i.test(String(usedModel))) {
        const msg = `The free pool is not available. (used: ${usedModel})`;
        stageStep("Cancel");
        setThread(prev => {
          const copy = [...prev];
          if (placeholderIdx >= 0 && placeholderIdx < copy.length) {
            copy[placeholderIdx] = { role: "assistant", content: msg };
          } else {
            copy.push({ role: "assistant", content: msg });
          }
          return copy;
        });
        setBusy(false);
        return;
      }

      // 7) Mostrar texto del bot
      stageStep("Parsing response...");
      const raw = data?.choices?.[0]?.message?.content ?? "";
      setThread(prev => {
        const copy = [...prev];
        const content = raw || "(no content)";
        if (placeholderIdx >= 0 && placeholderIdx < copy.length) {
          copy[placeholderIdx] = { role: "assistant", content };
        } else {
          copy.push({ role: "assistant", content });
        }
        return copy;
      });
      if (!raw) { setBusy(false); stageStep(""); return; }

      // 8) Validación y normalización
      stageStep("Validating and normalizing...");
      const parsed0 = safeParseJSON(stripCodeFences(raw));
      if (!parsed0) { addLog("[parse] Invalid JSON"); setBusy(false); stageStep(""); return; }

      const plan = validateAndNormalizePlan(parsed0, abs, userText, plKnowledge || undefined);
      if (!plan.elements.length) { addLog("[plan] with no valid elements after validation"); setBusy(false); stageStep(""); return; }

      // 9) Inyección al proyecto
      stageStep("Inyectando al proyecto…");
      injectIntoProject(plan, currentLanguage, phase, abs);

      stageStep("Listo ✅");
    } catch (e: any) {
      stageStep("Error");
      addLog(`[error] ${e?.message || e}`);
      setThread(prev => {
        const copy = [...prev];
        const content = "Error: " + (e?.message || e);
        if (placeholderIdx >= 0 && placeholderIdx < copy.length) {
          copy[placeholderIdx] = { role: "assistant", content };
        } else {
          copy.push({ role: "assistant", content });
        }
        return copy;
      });
    } finally {
      setBusy(false);
      setTimeout(() => setStage(""), 1200);
    }
  };






  /** 9) UI mínima: Enter = generar e inyectar */
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
            {phaseLanguages.map(l => (
              <option key={String(l.id)} value={String(l.id)}>{l.name} ({l.type})</option>
            ))}
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

      {/* Barra de estado fina */}
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
