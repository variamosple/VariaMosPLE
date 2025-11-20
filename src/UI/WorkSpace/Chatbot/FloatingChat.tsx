import React, { useState, useEffect } from "react";
import Chatbot from "./Chatbot";
import { ReactComponent as ChatIcon } from "./support_agent.svg";
import ProjectService from "../../../Application/Project/ProjectService";
import "./Chatbot.css";

type ChatMode = "smart" | "edit" | "create";

type FloatingChatProps = {
  projectService: ProjectService;
};

const FloatingChat: React.FC<FloatingChatProps> = ({ projectService }) => {
  // Default inteligente: si hay modelo seleccionado -> edit; si no -> create
  const hasSelectedModel = !!projectService.getTreeIdItemSelected?.();
  const [mode, setMode] = useState<ChatMode>(hasSelectedModel ? "edit" : "create");

  const [visible, setVisible] = useState(false);    // mostrar/ocultar panel
  const [minimized, setMinimized] = useState(false); // colapsar a header
  const [projectLoaded, setProjectLoaded] = useState(projectService.isProjectLoaded());

  const isGuestUser = projectService.isGuessUser();
  const showChatbot = projectLoaded || isGuestUser;
  const openFull = () => { setVisible(true); setMinimized(false); };

// LLamar para actualizar el estado de carga del proyecto
  useEffect(() => {
    const handleProjectUpdate = () => {
      setProjectLoaded(projectService.isProjectLoaded());
    };

    projectService.addUpdateProjectListener(handleProjectUpdate);

    return () => {
      projectService.removeUpdateProjectListener(handleProjectUpdate);
    };
  }, [projectService]);

  if (!showChatbot) {
    return null;
  }

  return (
    <>
      {/* Botón flotante (aparece cuando el panel está oculto) */}
      {!visible && (
        <button
          aria-label="Open assistant"
          onClick={openFull}
          className="chat-fab"
          title="Modeling Assistant"
        >
          <ChatIcon className="chat-fab__icon" />
        </button>
      )}

      {/* Panel flotante: SIEMPRE montado (no se pierde el estado), solo cambia visibilidad/tamaño */}
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          height: minimized ? 56 : 560,
          maxHeight: "calc(100vh - 32px)",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 18px 48px rgba(0,0,0,.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 9999,

          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          visibility: visible ? "visible" : "hidden",

          transition: "height .2s ease, opacity .18s ease, transform .18s ease, visibility .18s ease",
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 12px",
            background: "#f8fafc",
            borderBottom: "1px solid #e5e7eb",
            cursor: minimized ? "pointer" : "default",
          }}
          onClick={() => minimized && setMinimized(false)}
        >
          <strong>Modeling Assistant</strong>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Toggle de modo */}
        
            {/* Minimizar / Restaurar */}
            <button
              onClick={() => setMinimized(m => !m)}
              aria-label={minimized ? "Restaurar" : "Minimizar"}
              title={minimized ? "Restaurar" : "Minimizar"}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 18,
                lineHeight: 1,
                cursor: "pointer",
                padding: 6,
              }}
            >
              {minimized ? "▣" : "—"}
            </button>

            {/* Ocultar (NO desmonta) */}
            <button
              onClick={() => setVisible(false)}
              aria-label="Ocultar"
              title="Ocultar"
              style={{
                border: "none",
                background: "transparent",
                fontSize: 20,
                lineHeight: 1,
                cursor: "pointer",
                padding: 6,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: minimized ? "none" : "block" }}>
          {/* Pasamos projectService y el modo inicial (override con /edit /create en el prompt) */}
          <Chatbot projectService={projectService}/>
        </div>
      </div>
    </>
  );
};

export default FloatingChat;
