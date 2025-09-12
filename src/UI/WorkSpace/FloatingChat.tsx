import React, { useState } from "react";
import Chatbot from "../Scope/Chatbot";

const FloatingChat: React.FC = () => {
  const [visible, setVisible] = useState(false);   // mostrar/ocultar panel
  const [minimized, setMinimized] = useState(false); // colapsar a header

  const openFull = () => { setVisible(true); setMinimized(false); };

  return (
    <>
      {/* Botón flotante (aparece cuando el panel está oculto) */}
      {!visible && (
        <button
          aria-label="Abrir asistente"
          onClick={openFull}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            width: 64,
            height: 64,
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
            background: "#2563eb",
            color: "#fff",
            boxShadow: "0 12px 32px rgba(0,0,0,.25)",
            zIndex: 9999,
          }}
          title="Asistente de modelado"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ pointerEvents: "none" }}
          >
            <path d="M20 2H4a2 2 0 0 0-2 2v16l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
          </svg>
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
          height: minimized ? 56 : 560, // altura colapsada vs completa
          maxHeight: "calc(100vh - 32px)",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 18px 48px rgba(0,0,0,.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 9999,

          // visibilidad sin desmontar el componente
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
          // Permite restaurar a expandido al hacer click en el header cuando está minimizado
          onClick={() => minimized && setMinimized(false)}
        >
          <strong>Asistente de modelado</strong>

          <div style={{ display: "flex", gap: 6 }}>
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

        {/* Cuerpo del chat: se oculta visualmente cuando está minimizado, pero sigue montado */}
        <div style={{ flex: 1, minHeight: 0, display: minimized ? "none" : "block" }}>
          <Chatbot />
        </div>
      </div>
    </>
  );
};

export default FloatingChat;
