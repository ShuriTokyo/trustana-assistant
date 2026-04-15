import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const CHIPS = [
  "What does Trustana's platform do?",
  "How does the AI Native Product Catalog work?",
  "What should I expect in the interview?",
  "What is the culture like at Trustana?",
  "Who are Trustana's customers?",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);
  const [isNewSession, setIsNewSession] = useState(true);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setLoading(true);
    setChipsVisible(false);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, question: text, session: isNewSession }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply }]);
      setIsNewSession(false);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong — please try again." }]);
    } finally {
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
        :root { --black: #0A0B0D; --grey-dark: #3D3D3D; --grey-mid: #717171; --grey-light: #E8E8E8; --grey-bg: #F6F6F4; --white: #FFFFFF; }
        html, body { height: 100%; font-family: 'Inter', sans-serif; background: var(--white); color: var(--black); -webkit-font-smoothing: antialiased; }
        .page { display: flex; flex-direction: column; height: 100vh; max-width: 780px; margin: 0 auto; padding: 0 24px; }
        header { display: flex; align-items: center; justify-content: space-between; padding: 24px 0 20px; border-bottom: 1px solid var(--grey-light); flex-shrink: 0; }
        .logo img { height: 28px; display: block; }
        .header-links { display: flex; align-items: center; gap: 20px; }
        .header-link { font-size: 13px; color: var(--grey-mid); text-decoration: none; font-weight: 400; transition: color 0.15s; }
        .header-link:hover { color: var(--black); }
        .header-link.primary { background: var(--black); color: var(--white); padding: 7px 14px; border-radius: 6px; font-weight: 500; font-size: 12.5px; }
        .header-link.primary:hover { background: #2a2a2a; color: var(--white); }
        .intro { padding: 36px 0 24px; flex-shrink: 0; }
        .intro-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--grey-mid); font-weight: 500; margin-bottom: 10px; }
        .intro-headline { font-size: 26px; font-weight: 600; color: var(--black); letter-spacing: -0.4px; line-height: 1.25; margin-bottom: 8px; }
        .intro-sub { font-size: 14px; color: var(--grey-mid); line-height: 1.6; margin-bottom: 20px; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { font-size: 12.5px; font-family: 'Inter', sans-serif; color: var(--grey-dark); background: #F0F0EE; border: 1px solid #DEDEDD; border-radius: 20px; padding: 6px 13px; cursor: pointer; transition: background 0.12s; }
        .chip:hover { background: #E4E4E2; }
        .divider { height: 1px; background: var(--grey-light); margin: 20px 0 0; flex-shrink: 0; }
        .msgs { flex: 1; overflow-y: auto; padding: 24px 0; display: flex; flex-direction: column; gap: 20px; }
        .msg { display: flex; flex-direction: column; gap: 4px; }
        .msg-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: var(--grey-mid); }
        .msg.assistant .msg-label { color: var(--black); }
        .bubble { font-size: 14px; line-height: 1.8; color: var(--grey-dark); white-space: pre-wrap; }
        .msg.user .bubble { color: var(--black); font-weight: 500; }
        .typing-dots { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .dot { width: 5px; height: 5px; border-radius: 50%; background: #E8E8E8; animation: pulse 1.2s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: .2s; } .dot:nth-child(3) { animation-delay: .4s; }
        @keyframes pulse { 0%,80%,100%{transform:scale(1);background:#E8E8E8} 40%{transform:scale(1.3);background:#717171} }
        .input-area { flex-shrink: 0; padding: 16px 0 24px; border-top: 1px solid var(--grey-light); }
        .input-row { display: flex; gap: 10px; align-items: flex-end; background: var(--grey-bg); border: 1px solid var(--grey-light); border-radius: 12px; padding: 12px 14px; transition: border-color .15s; }
        .input-row:focus-within { border-color: #AEAEAC; }
        textarea { flex: 1; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 14px; color: var(--black); resize: none; outline: none; line-height: 1.5; max-height: 120px; }
        textarea::placeholder { color: #AEAEAC; }
        .send-btn { background: var(--black); color: var(--white); border: none; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .send-btn:hover { background: #2a2a2a; }
        .send-btn:disabled { background: #E8E8E8; cursor: not-allowed; }
        .send-btn svg { width: 15px; height: 15px; fill: var(--white); }
        .send-btn:disabled svg { fill: #717171; }
        .input-hint { font-size: 11px; color: #BDBDBB; text-align: center; margin-top: 10px; }
        .input-hint a { color: #BDBDBB; text-decoration: none; }
      `}</style>

      <div className="page">
        <header>
          <a className="logo" href="https://www.trustana.com" target="_blank" rel="noreferrer">
            <img src="https://cdn.prod.website-files.com/67ce8860c51a8737c7693d68/67cebf204135c29027749bed_trustana-black-logo.svg" alt="Trustana" />
          </a>
          <div className="header-links">
            <a className="header-link" href="https://www.trustana.com" target="_blank" rel="noreferrer">Website</a>
            <a className="header-link primary" href="https://www.trustana.com/careers" target="_blank" rel="noreferrer">Open Roles →</a>
          </div>
        </header>

        <div className="intro">
          <div className="intro-label"></div>
          <h1 className="intro-headline">Ask us anything about Trustana</h1>
          <p className="intro-sub">Get answers about our product, culture, and what to expect from the interview process.</p>
          {chipsVisible && (
            <div className="chips">
              {CHIPS.map((c) => (
                <button key={c} className="chip" onClick={() => prefill(c)}>{c}</button>
              ))}
            </div>
          )}
        </div>

        <div className="divider" />

        <div className="msgs">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="msg-label">{m.role === "assistant" ? "Trustana" : "You"}</div>
              <div className="bubble">{m.content}</div>
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
              placeholder="Ask a question about Trustana…"
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
          <div className="input-hint">Powered by Trustana · <a href="https://www.trustana.com" target="_blank" rel="noreferrer">trustana.com</a></div>
        </div>
      </div>
    </>
  );
}
