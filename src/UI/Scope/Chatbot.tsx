import React, { useEffect, useMemo, useState } from "react";

// ==== Tipos básicos ====
type Phase = "SCOPE" | "DOMAIN" | "APPLICATION";
type Role = "system" | "user" | "assistant";
interface Message { role: Role; content: string; }
interface Lang { id: string | number; name: string; type?: Phase | string; abstractSyntax?: any; }

// ==== Utilidades ====
// Normaliza el historial para que siempre alterne: system? → user → assistant → user → …
function normalizeHistory(
  history: Message[],
  systemMsg?: Message,      // { role:"system", content:"..." }
  pendingUser?: Message     // el user del input actual
): Message[] {
  const out: Message[] = [];

  // 1) System (opcional) SOLO al inicio
  if (systemMsg && systemMsg.content.trim()) {
    out.push({ role: "system", content: systemMsg.content });
  }

  // 2) Copia historial, evitando repetidos por rol y sistemas en medio
  let prev: Role | null = out.length ? out[out.length - 1].role : null;
  for (const m of history) {
    if (!m?.content?.trim()) continue;
    if (m.role === "system") continue;     // no systems en medio
    if (prev === m.role) continue;         // no dos iguales seguidos
    out.push({ role: m.role, content: m.content });
    prev = m.role;
  }

  // 3) Inserta/mergea el user del turno actual
  if (pendingUser && pendingUser.content.trim()) {
    if (out.length && out[out.length - 1].role === "user") {
      out[out.length - 1] = pendingUser;   // reemplaza para no romper alternancia
    } else {
      out.push(pendingUser);
    }
  }

  // 4) Limpiezas defensivas
  if (out[0]?.role === "assistant") out.shift();
  return out;
}

// Reparador JSON opcional (no falla si no está instalado)
function tryJsonRepair(raw: string): string {
  try {
    // @ts-ignore
    const { jsonrepair } = require("jsonrepair");
    return jsonrepair(raw);
  } catch {
    // jsonrepair no instalado ⇒ devolvemos tal cual
    return raw;
  }
}

const Chatbot: React.FC = () => {
  // ==== Estado principal ====
  const [ps, setPs] = useState<any>(null);                  // ProjectService expuesto por TreeMenu
  const [allLanguages, setAllLanguages] = useState<Lang[]>([]);
  const [phase, setPhase] = useState<Phase>("SCOPE");
  const [languageId, setLanguageId] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // ==== Adjuntarse a window.projectService (evento + polling) ====
  useEffect(() => {
    const tryAttach = () => {
      const svc = (window as any).projectService;
      if (svc) {
        setPs(svc);

        // Carga inicial de lenguajes
        const prim = Array.isArray(svc.languages) ? svc.languages : [];
        setAllLanguages(prim);

        // Listener cuando el servicio refresque la lista
        try {
          svc.addLanguagesDetailListener(() => {
            const latest = Array.isArray(svc.languages) ? svc.languages : [];
            setAllLanguages(latest);
          });
        } catch {}

        // Forzar refresh explícito (si expone el método)
        try { svc.refreshLanguageList?.(); } catch {}

        // Fallback: detalle sincrónico
        try {
          const detail = svc.getLanguagesDetail?.() || [];
          if (Array.isArray(detail) && detail.length) setAllLanguages(detail);
        } catch {}

        return true;
      }
      return false;
    };

    // intento inmediato
    if (tryAttach()) return;

    // evento propio disparado desde TreeMenu
    const onReady = () => { tryAttach(); };
    window.addEventListener("projectservice:ready", onReady);

    // polling de respaldo
    let tries = 0;
    const id = setInterval(() => {
      if (tryAttach() || ++tries > 40) {  // ~12s si 300ms
        clearInterval(id);
        window.removeEventListener("projectservice:ready", onReady);
      }
    }, 300);

    return () => {
      clearInterval(id);
      window.removeEventListener("projectservice:ready", onReady);
    };
  }, []);

  // ==== Filtrado de lenguajes según Phase ====
  const phaseLanguages = useMemo(() => {
    const filtered = allLanguages.filter(l => (l?.type || "").toUpperCase() === phase);
    return filtered.length ? filtered : allLanguages; // si no hay type bien puesto, muestra todos
  }, [allLanguages, phase]);

  // Autoselección básica al cambiar la lista
  useEffect(() => {
    if (phaseLanguages.length) setLanguageId(String(phaseLanguages[0].id));
    else setLanguageId("");
  }, [phaseLanguages]);

  // ==== Envío de mensaje ====
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    // Pinta en UI el mensaje del usuario
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Contexto (system)
    const lang = phaseLanguages.find(l => String(l.id) === String(languageId));
    const systemContext =
      `Eres un asistente para Ingeniería de Líneas de Producto (SPL). ` +
      `Phase=${phase}. ` +
      (lang ? `Language='${lang.name}'. ` : ``) +
      `Responde con JSON válido si se solicita; evita texto extra cuando te pidan estrictamente JSON.`;

    try {
      // Construimos historial normalizado usando el estado ACTUAL (sin esperar setState)
      const normalized = normalizeHistory(
        messages,
        { role: "system", content: systemContext },
        userMsg
      );

      // Endpoint y modelo
      let url = process.env.REACT_APP_CHATBOT_URL || "/v1/chat/completions";
      if (url.startsWith("http://localhost:8080") || url.startsWith("https://localhost:8080")) {
        url = url.replace(/^https?:\/\/localhost:8080/, "");
      }
      const model = process.env.REACT_APP_CHATBOT_MODEL || "ai/llama3.3";

      const payload: any = {
        model,
        messages: normalized.map(m => ({ role: m.role, content: m.content })),
        // Si tu backend lo soporta, fuerza JSON:
        // response_format: { type: "json_object" },
        // temperature: 0.2,
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      console.log("[Chatbot] full response:", data);

      const raw =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        data?.output ??
        data?.text ??
        "";

      if (!raw) {
        setMessages(prev => [...prev, { role: "assistant", content: "No llegó contenido del servidor." }]);
        return;
      }

      // Si necesitas parsear JSON de la respuesta, repara primero:
      // const repaired = tryJsonRepair(raw);
      // try {
      //   const obj = JSON.parse(repaired);
      //   // ...haz algo con obj si corresponde...
      // } catch {
      //   // si no es JSON, simplemente lo mostramos como texto
      // }

      setMessages(prev => [...prev, { role: "assistant", content: raw }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message }]);
    }
  };

  // ==== UI ====
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* Filtros Phase + Language */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>Phase</label>
          <select value={phase} onChange={(e) => setPhase(e.target.value as Phase)} style={{ width: "100%" }}>
            <option value="SCOPE">Scope</option>
            <option value="DOMAIN">Domain</option>
            <option value="APPLICATION">Application</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>Language</label>
          <select
            value={languageId}
            onChange={(e) => setLanguageId(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">— Select language —</option>
            {phaseLanguages.map((l) => (
              <option key={String(l.id)} value={String(l.id)}>
                {l.name}{l.type ? ` (${String(l.type).toUpperCase()})` : ""}
              </option>
            ))}
          </select>
          {!phaseLanguages.length && (
            <div style={{ fontSize: 12, color: "#c2185b", marginTop: 4 }}>
              No hay lenguajes visibles para <b>{phase}</b>. Revisa <code>projectService.languages</code> y su <code>type</code>.
            </div>
          )}
        </div>
      </div>

      {/* Conversación */}
      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <strong>{m.role === "user" ? "You" : m.role === "assistant" ? "Bot" : "System"}:</strong>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={input}
          placeholder='Ej: "Genera un modelo para representar la variabilidad de los teléfonos móviles..."'
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
