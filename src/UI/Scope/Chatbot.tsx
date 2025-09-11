import React, { useEffect, useMemo, useState } from "react";

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

type MetaProp = { name: string; type: string; defaultValue?: any; possibleValues?: string; comment?: string; linked_property?: string; linked_value?: string; [k: string]: any };
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

type PlanElement = { name: string; type: string; props?: Record<string, any> };
type PlanRelationship = { type: string; source: string; target: string; props?: Record<string, any> };

type PlanLLM = { name: string; elements: PlanElement[]; relationships: PlanRelationship[] };

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
  try { return JSON.parse(raw); } catch {}
  try { return JSON.parse(softJsonRepair(raw)); } catch {}
  return null;
};

const titleCase = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/** Mapea respuestas tipo nodes/edges → plan genérico */
const nodesEdgesToPlan = (input: any): PlanLLM | null => {
  if (!input || typeof input !== "object") return null;
  const nodes = Array.isArray(input.nodes) ? input.nodes : null;
  const edges = Array.isArray(input.edges) ? input.edges : null;
  if (!nodes && !edges) return null;
  const name = typeof input.name === "string" ? input.name : "Generated Model";

  const elements: PlanElement[] = nodes ? nodes.map((n: any, i: number) => ({
    name: String(n?.name ?? `Element${i+1}`),
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

/** ===== Chatbot ===== */
const Chatbot: React.FC = () => {
  const [ps, setPs] = useState<any>(null);
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [phase, setPhase] = useState<Phase>("DOMAIN");
  const [languageId, setLanguageId] = useState<string>("");

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<Message[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const addLog = (s: string) => setLog(prev => [...prev, s]);

  /** 1) Esperar ProjectService */
  useEffect(() => {
    const tryAttach = () => {
      const svc = (window as any).projectService;
      if (!svc) return false;
      setPs(svc);
      const langs: Language[] = Array.isArray(svc.languages) ? svc.languages : [];
      setAllLanguages(langs);
      addLog(`[ps] attach ok, languages=${langs.length}`);
      try {
        svc.addLanguagesDetailListener(() => {
          const latest: Language[] = Array.isArray(svc.languages) ? svc.languages : [];
          setAllLanguages(latest);
          addLog(`[ps] languages updated=${latest.length}`);
        });
      } catch {}
      try { svc.refreshLanguageList?.(); } catch {}
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
  }, []);

  /** 2) Lenguajes por fase */
  const phaseLanguages = useMemo(() => {
    const f = allLanguages.filter(l => l?.type === phase);
    return f.length ? f : allLanguages;
  }, [allLanguages, phase]);

  useEffect(() => {
    if (phaseLanguages.length) setLanguageId(String(phaseLanguages[0].id));
    else setLanguageId("");
  }, [phaseLanguages]);

  const currentLanguage: Language | undefined = useMemo(
    () => phaseLanguages.find(l => String(l.id) === String(languageId)),
    [phaseLanguages, languageId]
  );

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

    // puntuación por "conectabilidad" (nº de veces como target)
    const score = new Map<string, number>();
    for (const r of Object.values(relDefs)) for (const t of r.target) {
      score.set(t, (score.get(t) || 0) + 1);
    }
    let best = "";
    let bestScore = -1;
    for (const k of elems) {
      const s = score.get(k) || 0;
      if (s > bestScore) { best = k; bestScore = s; }
    }

    if (elems.includes("ConcreteFeature")) return "ConcreteFeature";
    if (elems.includes("AbstractFeature")) return "AbstractFeature";
    return best || elems[0];
  };

  // Relación válida para sourceType → targetType
  const pickRelationTypeFor = (abs: AbstractSyntax, sourceType: string, targetType: string): string | null => {
    for (const [rname, rdef] of Object.entries(abs.relationships || {})) {
      if (rdef.source === sourceType && rdef.target.includes(targetType)) return rname;
    }
    return null;
  };

  // Extrae nombres del dominio desde el prompt (es/es-EN simple)
  const inferDomainFromPrompt = (text: string) => {
    const t = (text || "").toLowerCase();

    let rootName = "Modelo";
    if (/ventas?\s+de\s+productos?/.test(t)) rootName = "Ventas de Productos";
    else if (/sistema/.test(t) && /venta|sales/.test(t)) rootName = "Sistema de Ventas";
    else if (/productos?/.test(t)) rootName = "Sistema de Productos";
    else if (/sales/.test(t)) rootName = "Sales System";

    const concepts: string[] = [];
    const add = (s: string) => { if (!concepts.includes(s)) concepts.push(s); };

    if (/productos?/.test(t)) add("Producto");
    if (/categor(ía|ia)s?/.test(t)) add("Categoria");
    if (/compr(as|a)|orden(es)?|pedido(s)?/.test(t)) add("Compra");
    if (/transacci(ó|o)n/.test(t)) add("Transaccion");
    if (/tarjeta\s+de\s+cr(é|e)dito|credit\s*card/.test(t)) add("PagoTarjeta");
    if (/transferenc(ia|e)/.test(t)) add("Transferencia");

    return { rootName, concepts };
  };

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
  const buildSystemPrompt = (abs: AbstractSyntax) => {
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
      "",
      "Elementos permitidos y sus propiedades:",
      elementsDesc || "(sin elementos definidos)",
      "",
      "Relaciones permitidas:",
      relsDesc || "(sin relaciones definidas)",
      "",
      "Restricciones del lenguaje:",
      restrLines.length ? restrLines.join("\n") : "(sin restricciones declaradas)"
    ].join("\n");
  };

  /** 5) Validación + normalización con renombrado de dominio */
  const validateAndNormalizePlan = (planRaw: any, abs: AbstractSyntax, userText: string): PlanLLM => {
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

    const { rootName, concepts } = inferDomainFromPrompt(userText);

    // 1) Elements (coerción)
    const rawElems: any[] = Array.isArray(plan.elements) ? plan.elements : [];
    const elems: PlanElement[] = [];
    for (let i = 0; i < rawElems.length; i++) {
      const fixed = coerceElementFromTypos(rawElems[i], allowedEl, pvIndex, defaultElType, i);
      if (fixed) elems.push(fixed);
    }

    // 1.b) Si name === type en elementos típicos, renombrar a conceptos de dominio
    const renameIfGeneric = (e: PlanElement, idx: number) => {
      if (!e.name || e.name === e.type || /^(Root|Abstract|Concrete)Feature$/i.test(e.name)) {
        if (e.type === "RootFeature") e.name = rootName || "Root";
        else if (concepts.length) e.name = concepts[Math.min(idx, concepts.length - 1)];
        else e.name = `${e.type}_${idx + 1}`;
      }
    };
    let afIdx = 0, cfIdx = 0;
    for (const e of elems) {
      if (e.type === "RootFeature") renameIfGeneric(e, 0);
      if (e.type === "AbstractFeature") renameIfGeneric(e, afIdx++);
      if (e.type === "ConcreteFeature") renameIfGeneric(e, cfIdx++);
    }

    // 2) unique_name
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

    // 3) quantity_element (crear mínimos que falten)
    const qty = abs.restrictions?.quantity_element || [];
    for (const q of qty) {
      const count = elems.filter(e => e.type === q.element).length;
      if (q.min && count < q.min) {
        const toAdd = q.min - count;
        for (let i = 0; i < toAdd; i++) {
          const base = titleCase(q.element);
          const name = count === 0 && i === 0 ? (q.element === "RootFeature" ? rootName : base) : `${base}_${count + i + 1}`;
          elems.push({ name, type: q.element, props: {} });
        }
      }
    }

    // 3.b) Asegurar presencia de conceptos del prompt (si no vinieron)
    const haveNames = new Set(elems.map(e => e.name));
    const toAddConcepts = concepts.filter(c => !haveNames.has(c));
    for (const c of toAddConcepts) {
      elems.push({ name: c, type: defaultElType, props: {} });
    }

    // Índices
    const name2type = new Map(elems.map(e => [e.name, e.type]));
    const firstByType = new Map<string, string>();
    for (const e of elems) if (!firstByType.has(e.type)) firstByType.set(e.type, e.name);

    // 4) Relaciones: aceptar type inventado → remap; aceptar targets[] → expandir
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

    // 5) Si hay RootFeature y conceptos del dominio, garantizar arcos root→concepto cuando exista relación válida
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

    const name = plan.name || rootName || "Generated Model";
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
  if (!ps || !currentLanguage) { addLog("ps/language no disponible"); return; }
  const abs = getAbstract();
  if (!Object.keys(abs.elements).length) { return; }

  const systemPrompt = buildSystemPrompt(abs);
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userText }
  ];

  // URL y modelo (pueden venir del .env)
  let url = process.env.REACT_APP_CHATBOT_URL || "/v1/chat/completions";
  if (url.startsWith("http://localhost:8080") || url.startsWith("https://localhost:8080")) {
    url = url.replace(/^https?:\/\/localhost:8080/, "");
  }
  const model =
    process.env.REACT_APP_CHATBOT_MODEL ||
    "deepseek/deepseek-chat-v3.1:free"; // <- usa un slug válido en OpenRouter

  // Headers (con OpenRouter)
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (url.includes("openrouter.ai")) {
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY || "";
    if (!apiKey) {
      addLog("[auth] Falta REACT_APP_OPENROUTER_API_KEY");
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    headers["HTTP-Referer"] =
      process.env.REACT_APP_OPENROUTER_REFERER ||
      (typeof window !== "undefined" ? window.location.origin : "");
    headers["X-Title"] =
      process.env.REACT_APP_OPENROUTER_TITLE ||
      (typeof document !== "undefined" ? document.title : "Variamos");
  }

  setBusy(true);
  setThread(prev => [...prev, { role: "user", content: userText }]);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers, // <<<<<<<<<<<<<< ¡AHORA SÍ usamos los headers con Authorization!
      body: JSON.stringify({ model, messages })
    });

    let data: any = null;
    const text = await resp.text();
    try { data = JSON.parse(text); } catch { /* deja text crudo */ }

    addLog(`[http] ${resp.status}`);

    if (!resp.ok) {
      const msg = data?.error?.message || text || `HTTP ${resp.status}`;
      addLog(`[http error] ${msg}`);
      setThread(prev => [...prev, { role: "assistant", content: `Error del modelo: ${msg}` }]);
      setBusy(false);
      return;
    }

    const raw = data?.choices?.[0]?.message?.content ?? "";
    setThread(prev => [...prev, { role: "assistant", content: raw || "(sin contenido)" }]);
    if (!raw) { setBusy(false); return; }

    const parsed0 = safeParseJSON(stripCodeFences(raw));
    if (!parsed0) { addLog("[parse] JSON inválido"); setBusy(false); return; }

    const plan = validateAndNormalizePlan(parsed0, abs, userText);
    if (!plan.elements.length) { addLog("[plan] sin elementos válidos tras validación"); setBusy(false); return; }

    injectIntoProject(plan, currentLanguage, phase, abs);
  } catch (e: any) {
    addLog(`[error] ${e?.message || e}`);
    setThread(prev => [...prev, { role: "assistant", content: "Error: " + (e?.message || e) }]);
  } finally {
    setBusy(false);
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
  const phaseLanguagesMemo = phaseLanguages;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* Phase + Language */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>Phase</label>
          <select value={phase} onChange={e => setPhase(e.target.value as Phase)} style={{ width: "100%" }}>
            <option value="SCOPE">Scope</option>
            <option value="DOMAIN">Domain</option>
            <option value="APPLICATION">Application</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>Language</label>
          <select value={languageId} onChange={e => setLanguageId(e.target.value)} style={{ width: "100%" }}>
            <option value="">— Select language —</option>
            {phaseLanguagesMemo.map(l => (
              <option key={String(l.id)} value={String(l.id)}>{l.name} ({l.type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conversación */}
      <div style={{ flex: 1, overflow: "auto", border: "1px solid #eee", padding: 8 }}>
        {thread.map((m, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <b>{m.role === "user" ? "You" : m.role === "assistant" ? "Bot" : "Sys"}:</b>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <input
        placeholder={busy ? "Generando…" : "Describe el modelo que quieres y presiona Enter…"}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={busy}
        style={{ padding: 8 }}
      />

      {/* Log */}
      <details>
        <summary>Log</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre>
      </details>
    </div>
  );
};

export default Chatbot;
