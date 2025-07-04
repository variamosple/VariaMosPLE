import React, { useState } from "react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    try {
      let url = process.env.REACT_APP_CHATBOT_URL || "/v1/chat/completions";
      // If someone accidentally sets the full localhost URL, strip the host so
      // CRA's proxy can intercept the request and avoid CORS issues.
      if (url.startsWith("http://localhost:8080") || url.startsWith("https://localhost:8080")) {
        url = url.replace(/^https?:\/\/localhost:8080/, "");
      }
      const model =
        process.env.REACT_APP_CHATBOT_MODEL ||
        "ai/llama3.3";
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await resp.json();
      const reply = data.choices?.[0]?.message?.content || "";
      const botMsg: Message = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const botMsg: Message = { role: 'assistant', content: 'Error: ' + err.message };
      setMessages(prev => [...prev, botMsg]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '0.5rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '0.25rem' }}>
            <strong>{m.role === 'user' ? 'You' : 'Bot'}:</strong> {m.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <input
          style={{ flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') sendMessage();
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;