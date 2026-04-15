import { useState, useRef, useEffect } from "react";
import Head from "next/head";

function renderMarkdown(text) {
  let html = text
    // Escape HTML first
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Headers (### ## #)
    .replace(/^### (.+)$/gm, '<span style="font-weight:600;font-size:13.5px;color:#0A1628;display:block;margin:12px 0 4px">$1</span>')
    .replace(/^## (.+)$/gm, '<span style="font-weight:600;font-size:14px;color:#0A1628;display:block;margin:14px 0 4px">$1</span>')
    .replace(/^# (.+)$/gm, '<span style="font-weight:600;font-size:15px;color:#0A1628;display:block;margin:14px 0 6px">$1</span>')
    // Bullet lists — group consecutive lines starting with - or *
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> items in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul style="margin:6px 0 6px 16px;display:flex;flex-direction:column;gap:4px">${match}</ul>`)
    // Horizontal rule
    .replace(/^━+$/gm, '<hr style="border:none;border-top:1px solid #D8E0EC;margin:10px 0">')
    // Line breaks — double newline = paragraph gap
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    // Single newline
    .replace(/\n/g, "<br>");
  return html;
}

const CHIPS = [
  "What does Trustana's platform do?",
  "How does the AI Native Product Catalog work?",
  "What should I expect in the interview?",
  "Who are Trustana's customers?",
  "What results do customers get?",
  "How does Trustana help with SEO?",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const prefill = (text) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    setStarted(true);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, question: text, session: isNewSession }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";

      // Add empty assistant message to stream into
      setMessages([...next, { role: "assistant", content: "" }]);
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.token) {
              reply += parsed.token;
              const captured = reply;
              setMessages([...next, { role: "assistant", content: captured }]);
            }
            if (parsed.done) {
              setIsNewSession(false);
            }
          } catch {}
        }
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong — please try again." }]);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Trustana Assistant</title>
        <meta name="description" content="Ask anything about Trustana" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy: #0A1628;
          --blue: #1A56DB;
          --blue-light: #EEF3FF;
          --blue-border: #C3D4F7;
          --bg: #EEF2F8;
          --surface: #FFFFFF;
          --grey-mid: #6B7A8F;
          --grey-light: #D8E0EC;
          --text: #0A1628;
          --text-soft: #4A5568;
        }
        html, body { height: 100%; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
        .page { display: flex; flex-direction: column; height: 100vh; max-width: 800px; margin: 0 auto; }
        header { background: var(--navy); display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; flex-shrink: 0; }
        .logo img { height: 24px; display: block; filter: brightness(0) invert(1); }
        .header-links { display: flex; align-items: center; gap: 24px; }
        .hlink { font-size: 13px; color: rgba(255,255,255,0.65); text-decoration: none; font-weight: 400; transition: color .15s; }
        .hlink:hover { color: #fff; }
        .intro { padding: 28px 28px 20px; flex-shrink: 0; background: var(--bg); }
        .intro h1 { font-size: 20px; font-weight: 600; color: var(--navy); letter-spacing: -.3px; line-height: 1.3; margin-bottom: 5px; }
        .intro p { font-size: 13.5px; color: var(--grey-mid); line-height: 1.65; margin-bottom: 18px; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { font-size: 12.5px; font-family: 'Inter', sans-serif; color: var(--blue); background: var(--blue-light); border: 1px solid var(--blue-border); border-radius: 20px; padding: 6px 14px; cursor: pointer; transition: background .12s; line-height: 1; font-weight: 500; }
        .chip:hover { background: #DDE8FF; }
        .divider { height: 1px; background: var(--grey-light); flex-shrink: 0; margin: 0 28px; }
        .msgs-wrap { flex: 1; overflow-y: auto; padding: 20px 28px; display: flex; flex-direction: column; gap: 20px; }
        .msgs-wrap::-webkit-scrollbar { width: 4px; }
        .msgs-wrap::-webkit-scrollbar-thumb { background: var(--grey-light); border-radius: 4px; }
        .msg { display: flex; flex-direction: column; gap: 4px; }
        .msg-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: var(--grey-mid); }
        .msg.user { align-items: flex-end; }
        .msg.user .msg-label { color: var(--blue); }
        .msg.user .bubble { background: var(--blue); color: #fff; border-radius: 16px 16px 4px 16px; padding: 11px 16px; max-width: 78%; font-size: 14px; line-height: 1.7; }
        .msg.assistant { align-items: flex-start; }
        .msg.assistant .msg-label { color: var(--navy); }
        .msg.assistant .bubble { background: var(--surface); color: var(--text-soft); border: 1px solid var(--grey-light); border-radius: 4px 16px 16px 16px; padding: 14px 18px; max-width: 88%; font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
        .typing-dots { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--grey-light); animation: pulse 1.2s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: .2s; } .dot:nth-child(3) { animation-delay: .4s; }
        @keyframes pulse { 0%,80%,100%{transform:scale(1);background:var(--grey-light)} 40%{transform:scale(1.4);background:var(--blue)} }
        .input-area { flex-shrink: 0; padding: 14px 28px 20px; background: var(--bg); border-top: 1px solid var(--grey-light); }
        .input-row { display: flex; gap: 10px; align-items: flex-end; background: var(--surface); border: 1.5px solid var(--grey-light); border-radius: 12px; padding: 12px 14px; transition: border-color .15s; }
        .input-row:focus-within { border-color: var(--blue); }
        textarea { flex: 1; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 14px; color: var(--text); resize: none; outline: none; line-height: 1.55; max-height: 120px; }
        textarea::placeholder { color: #A0AEBF; font-style: italic; }
        .send-btn { background: var(--blue); color: #fff; border: none; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .send-btn:hover { background: #1344BB; }
        .send-btn:disabled { background: var(--grey-light); cursor: not-allowed; }
        .send-btn svg { width: 14px; height: 14px; fill: #fff; }
        .send-btn:disabled svg { fill: var(--grey-mid); }
        .hint { font-size: 11px; color: #A0AEBF; text-align: center; margin-top: 10px; }
        .hint a { color: #A0AEBF; text-decoration: none; }
        .hint a:hover { color: var(--grey-mid); }
      `}</style>

      <div className="page">
        <header>
          <a className="logo" href="https://www.trustana.com" target="_blank" rel="noreferrer">
            <img src="https://cdn.prod.website-files.com/67ce8860c51a8737c7693d68/67cebf204135c29027749bed_trustana-black-logo.svg" alt="Trustana" />
          </a>
          <div className="header-links">
            <a className="hlink" href="https://www.trustana.com" target="_blank" rel="noreferrer">Website</a>
            <a className="hlink" href="https://www.trustana.com/case-studies" target="_blank" rel="noreferrer">Case Studies</a>
          </div>
        </header>

        {!started && (
          <div className="intro">
            <h1>Ask us anything about Trustana</h1>
            <p>Get answers about our platform, how it works, who it's for, and what to expect from the hiring process.</p>
            <div className="chips">
              {CHIPS.map((c) => (
                <button key={c} className="chip" onClick={() => prefill(c)}>{c}</button>
              ))}
            </div>
          </div>
        )}

        {!started && <div className="divider" />}

        <div className="msgs-wrap">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="msg-label">{m.role === "assistant" ? "Trustana" : "You"}</div>
              {m.role === "assistant"
                ? <div className="bubble" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                : <div className="bubble">{m.content}</div>
              }
            </div>
          ))}
          {loading && (
            <div className="msg assistant">
              <div className="msg-label">Trustana</div>
              <div className="bubble">
                <div className="typing-dots">
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              placeholder="Ask anything about Trustana…"
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
          <div className="hint">
            <a href="https://www.trustana.com" target="_blank" rel="noreferrer">trustana.com</a>
            {" · "}
            <a href="https://www.trustana.com/company-pages/careers" target="_blank" rel="noreferrer">Open Roles</a>
          </div>
        </div>
      </div>
    </>
  );
}
