import React, { useEffect, useMemo, useState } from "react";

type Phase = "SCOPE" | "DOMAIN" | "APPLICATION";
interface Message { role: "user" | "assistant"; content: string; }

const Chatbot: React.FC = () => {
  // Instancia del ProjectService (misma que expone TreeMenu en window.projectService)
  const [ps, setPs] = useState<any>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // UI selectors
  const [phase, setPhase] = useState<Phase>("SCOPE");
  const [allLanguages, setAllLanguages] = useState<any[]>([]);
  const [languageId, setLanguageId] = useState<string>("");

  // --------------------------------------------------------------------
  // A) ESPERAR a que TreeMenu exponga window.projectService
  //    - intento inmediato
  //    - escucha evento 'projectservice:ready'
  //    - polling de respaldo
  // --------------------------------------------------------------------
  useEffect(() => {
    const tryAttach = () => {
      const svc = (window as any).projectService;
      if (svc) {
        console.log("[Chatbot] projectService listo:", svc);
        setPs(svc);

        // Carga inicial
        const arr = Array.isArray(svc.languages) ? svc.languages : [];
        console.log(
          "[Chatbot] lenguajes iniciales:",
          arr.map((l: any) => ({ id: l.id, name: l.name, type: l.type }))
        );
        setAllLanguages(arr);

        // Suscripción a futuros cambios (cuando corra refreshLanguageList)
        try {
          svc.addLanguagesDetailListener(() => {
            const latest = Array.isArray(svc.languages) ? svc.languages : [];
            console.log(
              "[Chatbot] lenguajes actualizados:",
              latest.map((l: any) => ({ id: l.id, name: l.name, type: l.type }))
            );
            setAllLanguages(latest);
          });
        } catch (e) {
          console.warn("[Chatbot] addLanguagesDetailListener no disponible:", e);
        }

        // Forzar refresh por si aún no ha ocurrido
        try { svc.refreshLanguageList?.(); } catch {}

        // (opcional) un intento de detalle síncrono
        try {
          const detail = svc.getLanguagesDetail?.() || [];
          if (Array.isArray(detail) && detail.length) {
            console.log("[Chatbot] getLanguagesDetail():", detail.length);
            setAllLanguages(detail);
          }
        } catch {}

        return true;
      }
      return false;
    };

    // a) Intento inmediato
    if (tryAttach()) return;

    // b) Escucha el evento disparado por TreeMenu
    const onReady = () => { tryAttach(); };
    window.addEventListener("projectservice:ready", onReady);

    // c) Polling de respaldo (por si el evento no corre por orden de montaje)
    let tries = 0;
    const id = setInterval(() => {
      if (tryAttach() || ++tries > 40) { // ~12s si interval=300ms
        clearInterval(id);
        window.removeEventListener("projectservice:ready", onReady);
      }
    }, 300);

    return () => {
      clearInterval(id);
      window.removeEventListener("projectservice:ready", onReady);
    };
  }, []);

  // --------------------------------------------------------------------
  // B) Filtrar lenguajes por Phase (mismo criterio de TreeMenu)
  // --------------------------------------------------------------------
  const phaseLanguages = useMemo(() => {
    // TreeMenu filtra con: language.type === this.state.newSelected
    const filtered = allLanguages.filter((l: any) => l?.type === phase);
    // fallback: si no viene type bien formateado, mostrar todos para no dejar vacío
    return filtered.length ? filtered : allLanguages;
  }, [allLanguages, phase]);

  // Autoselección cuando cambie la lista filtrada
  useEffect(() => {
    if (phaseLanguages.length) setLanguageId(String(phaseLanguages[0].id));
    else setLanguageId("");
  }, [phaseLanguages]);

  // --------------------------------------------------------------------
  // C) Envío de mensaje (inyectando contexto Phase/Language)
  // --------------------------------------------------------------------
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const lang = phaseLanguages.find((l: any) => String(l.id) === languageId);
    const systemContext =
      `Phase: ${phase}. ` +
      (lang ? `Language: ${lang.name}. ` : ``) +
      `Usa este contexto para interpretar el prompt.`;

    try {
      let url = process.env.REACT_APP_CHATBOT_URL || "/v1/chat/completions";
      if (url.startsWith("http://localhost:8080") || url.startsWith("https://localhost:8080")) {
        url = url.replace(/^https?:\/\/localhost:8080/, "");
      }
      const model = process.env.REACT_APP_CHATBOT_MODEL || "ai/llama3.3";

      const payload = {
        model,
        messages: [
          { role: "system", content: systemContext },
          ...messages,
          userMsg,
        ].map(m => ({ role: m.role, content: m.content })),
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      const reply = data?.choices?.[0]?.message?.content || "";
      setMessages(prev => [...prev, { role: "assistant", content: reply || "(no reply)" }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message }]);
    }
  };

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Debug mínimo para verificar disponibilidad */}
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.7 }}>
        ps: {ps ? "ok" : "null"}{"\n"}
        languages: {allLanguages.length}
      </pre>

      {/* Phase + Language */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
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
            {phaseLanguages.map((l: any) => (
              <option key={String(l.id)} value={String(l.id)}>{l.name}</option>
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
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <strong>{m.role === "user" ? "You" : "Bot"}:</strong> {m.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex" }}>
        <input
          style={{ flex: 1 }}
          value={input}
          placeholder="Type your message…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
