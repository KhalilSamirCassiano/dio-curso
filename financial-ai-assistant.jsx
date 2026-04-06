import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Você é a VERA, uma assistente financeira pessoal inteligente, empática e especializada. Você foi criada para ajudar brasileiros a entenderem e melhorarem sua vida financeira.

Suas capacidades:
- Explicar produtos financeiros (CDB, LCI, LCA, Tesouro Direto, fundos, ações, etc.)
- Calcular juros compostos, rentabilidade, parcelas de financiamento
- Responder dúvidas sobre orçamento pessoal, dívidas e investimentos
- Dar orientações sobre planejamento financeiro
- Explicar conceitos como CDI, IPCA, Selic, IOF, IR em renda variável/fixa
- Ajudar a comparar investimentos

Personalidade: Profissional mas acessível, didática, usa exemplos práticos com valores em reais (R$). Nunca recomenda produtos específicos de corretoras. Sempre alerta sobre riscos. Usa emojis com moderação para tornar a conversa mais amigável.

Se perguntarem algo fora de finanças, redirecione gentilmente para tópicos financeiros.`;

const QUICK_QUESTIONS = [
  { icon: "📈", label: "Comparar investimentos", q: "Como comparar CDB, Tesouro Direto e fundos de renda fixa?" },
  { icon: "💳", label: "Sair das dívidas", q: "Tenho dívidas no cartão de crédito com juros altos. Por onde começo?" },
  { icon: "🏠", label: "Financiamento", q: "Como funciona o financiamento imobiliário? Vale mais a pena do que alugar?" },
  { icon: "🔢", label: "Juros compostos", q: "Explica juros compostos com um exemplo prático de R$ 10.000" },
  { icon: "💼", label: "Reserva de emergência", q: "Como montar uma reserva de emergência? Quanto devo guardar?" },
  { icon: "📊", label: "Entender o CDI", q: "O que é CDI e por que os investimentos são atrelados a ele?" },
];

const CALC_TYPES = [
  { id: "juros", label: "Juros Compostos" },
  { id: "financiamento", label: "Parcela de Financiamento" },
  { id: "meta", label: "Meta de Investimento" },
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#C9A84C",
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Calculator({ onResult }) {
  const [type, setType] = useState("juros");
  const [fields, setFields] = useState({
    principal: "", rate: "", period: "", pmt: "", fv: ""
  });
  const [result, setResult] = useState(null);

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtN = (v) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v);

  const calc = () => {
    const p = parseFloat(fields.principal);
    const r = parseFloat(fields.rate) / 100;
    const n = parseFloat(fields.period);

    if (type === "juros") {
      if (!p || !r || !n) return;
      const monthlyRate = r / 12;
      const total = p * Math.pow(1 + monthlyRate, n);
      const juros = total - p;
      setResult({
        lines: [
          { label: "Capital inicial", value: fmt(p) },
          { label: "Taxa mensal", value: `${fmtN(r / 12 * 100)}%` },
          { label: "Período", value: `${n} meses` },
          { label: "Juros ganhos", value: fmt(juros), highlight: true },
          { label: "Total final", value: fmt(total), big: true },
        ],
        summary: `Investindo ${fmt(p)} a ${fmtN(r)}% a.a. por ${n} meses, você teria ${fmt(total)} — um ganho de ${fmt(juros)}.`
      });
    } else if (type === "financiamento") {
      if (!p || !r || !n) return;
      const monthlyRate = r / 12;
      const pmt = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      const total = pmt * n;
      const juros = total - p;
      setResult({
        lines: [
          { label: "Valor financiado", value: fmt(p) },
          { label: "Taxa anual", value: `${fmtN(r * 100)}%` },
          { label: "Parcelas", value: `${n}x` },
          { label: "Parcela mensal", value: fmt(pmt), big: true },
          { label: "Total pago", value: fmt(total) },
          { label: "Total em juros", value: fmt(juros), highlight: true },
        ],
        summary: `Financiamento de ${fmt(p)} em ${n}x: parcela de ${fmt(pmt)}, pagando ${fmt(juros)} só em juros.`
      });
    } else {
      const fv = parseFloat(fields.fv);
      const monthlyPmt = parseFloat(fields.pmt);
      if (!fv || !r || !n) return;
      const monthlyRate = r / 12;
      const pv = fv / Math.pow(1 + monthlyRate, n);
      const totalInvested = monthlyPmt ? monthlyPmt * n : pv;
      const rendimento = fv - totalInvested;
      setResult({
        lines: [
          { label: "Meta", value: fmt(fv) },
          { label: "Prazo", value: `${n} meses` },
          { label: "Taxa anual", value: `${fmtN(r * 100)}%` },
          { label: "Valor presente necessário", value: fmt(pv), big: true },
          { label: "Aporte único para atingir a meta", value: fmt(pv), highlight: true },
        ],
        summary: `Para ter ${fmt(fv)} em ${n} meses com ${fmtN(r * 100)}% a.a., você precisa investir ${fmt(pv)} hoje.`
      });
    }
  };

  const f = (key, label, placeholder) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
      <input
        type="number"
        placeholder={placeholder}
        value={fields[key]}
        onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
        style={{
          background: "#1a1a2e", border: "1px solid #333", borderRadius: 8,
          padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none",
          transition: "border-color 0.2s"
        }}
        onFocus={e => e.target.style.borderColor = "#C9A84C"}
        onBlur={e => e.target.style.borderColor = "#333"}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CALC_TYPES.map(ct => (
          <button key={ct.id} onClick={() => { setType(ct.id); setResult(null); }} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600,
            background: type === ct.id ? "#C9A84C" : "#1a1a2e",
            color: type === ct.id ? "#0d0d1a" : "#888",
            transition: "all 0.2s"
          }}>{ct.label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {(type === "juros" || type === "financiamento" || type === "meta") && f("principal", type === "meta" ? "Valor atual (R$)" : "Valor (R$)", "Ex: 10000")}
        {f("rate", "Taxa anual (%)", "Ex: 12")}
        {f("period", "Período (meses)", "Ex: 24")}
        {type === "meta" && f("fv", "Meta (R$)", "Ex: 50000")}
      </div>

      <button onClick={calc} style={{
        background: "linear-gradient(135deg, #C9A84C, #e8c96d)",
        border: "none", borderRadius: 10, padding: "12px",
        color: "#0d0d1a", fontWeight: 700, fontSize: 14, cursor: "pointer",
        letterSpacing: 0.5
      }}>Calcular →</button>

      {result && (
        <div style={{ background: "#0d0d1a", borderRadius: 12, padding: 16, border: "1px solid #C9A84C33" }}>
          {result.lines.map((l, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 0",
              borderBottom: i < result.lines.length - 1 ? "1px solid #1a1a2e" : "none"
            }}>
              <span style={{ fontSize: 12, color: "#888" }}>{l.label}</span>
              <span style={{
                fontSize: l.big ? 18 : 13, fontWeight: l.big ? 700 : 500,
                color: l.big ? "#C9A84C" : l.highlight ? "#4caf7d" : "#fff",
                fontFamily: "monospace"
              }}>{l.value}</span>
            </div>
          ))}
          <button onClick={() => onResult(result.summary)} style={{
            marginTop: 10, width: "100%", background: "#1a1a2e",
            border: "1px solid #333", borderRadius: 8, padding: "8px",
            color: "#C9A84C", fontSize: 12, cursor: "pointer", fontWeight: 600
          }}>💬 Perguntar à VERA sobre esse resultado</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá! Sou a **VERA**, sua assistente financeira pessoal 👋\n\nEstou aqui para ajudar com investimentos, dívidas, planejamento e qualquer dúvida financeira. Use as sugestões abaixo ou me pergunte qualquer coisa!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chat");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    setTab("chat");

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content.replace(/\*\*/g, "")
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages
        })
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Desculpe, ocorreu um erro. Tente novamente.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Erro de conexão. Verifique sua internet e tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "#C9A84C" }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const styles = {
    container: {
      fontFamily: "'Crimson Pro', Georgia, serif",
      background: "#0d0d1a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      color: "#fff",
      maxWidth: 800,
      margin: "0 auto",
      position: "relative",
    },
    header: {
      padding: "20px 24px 0",
      borderBottom: "1px solid #1a1a2e",
    },
    logo: {
      display: "flex", alignItems: "center", gap: 12, marginBottom: 16
    },
    logoIcon: {
      width: 40, height: 40, borderRadius: 12,
      background: "linear-gradient(135deg, #C9A84C, #8B5E1A)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, fontWeight: 700
    },
    logoText: {
      fontSize: 22, fontWeight: 700, letterSpacing: -0.5,
      background: "linear-gradient(135deg, #C9A84C, #fff)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
    },
    logoSub: { fontSize: 12, color: "#666", marginTop: 1, fontFamily: "sans-serif" },
    tabs: {
      display: "flex", gap: 0,
    },
    tab: (active) => ({
      padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
      fontSize: 13, fontWeight: active ? 700 : 400, fontFamily: "sans-serif",
      color: active ? "#C9A84C" : "#555",
      borderBottom: active ? "2px solid #C9A84C" : "2px solid transparent",
      transition: "all 0.2s", letterSpacing: 0.3
    }),
    chatArea: {
      flex: 1, overflowY: "auto", padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 16,
      minHeight: 0,
    },
    msgWrap: (role) => ({
      display: "flex",
      justifyContent: role === "user" ? "flex-end" : "flex-start",
      alignItems: "flex-end", gap: 8
    }),
    avatar: {
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: "linear-gradient(135deg, #C9A84C, #8B5E1A)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14
    },
    bubble: (role) => ({
      maxWidth: "75%",
      padding: "12px 16px",
      borderRadius: role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      background: role === "user"
        ? "linear-gradient(135deg, #C9A84C22, #C9A84C11)"
        : "#141428",
      border: role === "user" ? "1px solid #C9A84C44" : "1px solid #1e1e3a",
      fontSize: 14.5,
      lineHeight: 1.65,
      fontFamily: "'Crimson Pro', Georgia, serif",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }),
    quickGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 10, padding: "0 24px 16px"
    },
    quickBtn: {
      background: "#141428", border: "1px solid #1e1e3a",
      borderRadius: 12, padding: "12px 14px", cursor: "pointer",
      textAlign: "left", transition: "all 0.2s", display: "flex",
      alignItems: "center", gap: 10
    },
    inputArea: {
      padding: "16px 24px 20px",
      borderTop: "1px solid #1a1a2e",
      display: "flex", gap: 10
    },
    input: {
      flex: 1, background: "#141428", border: "1px solid #1e1e3a",
      borderRadius: 12, padding: "12px 16px", color: "#fff",
      fontSize: 14, outline: "none", fontFamily: "sans-serif",
      resize: "none"
    },
    sendBtn: (canSend) => ({
      background: canSend ? "linear-gradient(135deg, #C9A84C, #e8c96d)" : "#1a1a2e",
      border: "none", borderRadius: 12, padding: "0 20px",
      cursor: canSend ? "pointer" : "default",
      color: canSend ? "#0d0d1a" : "#444",
      fontWeight: 700, fontSize: 18, transition: "all 0.2s",
      minWidth: 50
    }),
    calcPanel: {
      flex: 1, overflowY: "auto", padding: "20px 24px",
    }
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #1e1e3a; border-radius: 4px; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-anim { animation: fadeIn 0.3s ease; }
        .quick-btn:hover { background: #1a1a2e !important; border-color: #C9A84C44 !important; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>₿</div>
          <div>
            <div style={styles.logoText}>VERA Finance</div>
            <div style={styles.logoSub}>Assistente Financeira com IA</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf7d", boxShadow: "0 0 8px #4caf7d" }} />
            <span style={{ fontSize: 11, color: "#4caf7d", fontFamily: "sans-serif" }}>Online</span>
          </div>
        </div>
        <div style={styles.tabs}>
          {[["chat", "💬 Chat"], ["calc", "🔢 Calculadora"], ["faq", "❓ FAQ"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={styles.tab(tab === id)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Chat Tab */}
      {tab === "chat" && (
        <>
          <div style={styles.chatArea}>
            {messages.map((m, i) => (
              <div key={i} className="msg-anim" style={styles.msgWrap(m.role)}>
                {m.role === "assistant" && <div style={styles.avatar}>V</div>}
                <div style={styles.bubble(m.role)}>
                  {renderText(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg-anim" style={styles.msgWrap("assistant")}>
                <div style={styles.avatar}>V</div>
                <div style={{ ...styles.bubble("assistant"), padding: 0 }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div style={styles.quickGrid}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="quick-btn"
                  style={styles.quickBtn}
                  onClick={() => sendMessage(q.q)}
                >
                  <span style={{ fontSize: 20 }}>{q.icon}</span>
                  <span style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif", lineHeight: 1.3 }}>{q.label}</span>
                </button>
              ))}
            </div>
          )}

          <div style={styles.inputArea}>
            <input
              ref={inputRef}
              style={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Pergunte sobre investimentos, dívidas, planejamento..."
            />
            <button style={styles.sendBtn(canSend)} onClick={() => sendMessage()} disabled={!canSend}>
              →
            </button>
          </div>
        </>
      )}

      {/* Calculadora Tab */}
      {tab === "calc" && (
        <div style={styles.calcPanel}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Calculadora Financeira</h2>
            <p style={{ fontSize: 13, color: "#666", fontFamily: "sans-serif" }}>Simule investimentos, financiamentos e metas</p>
          </div>
          <Calculator onResult={(summary) => { sendMessage("Com base nesse resultado: " + summary + " — o que você me recomenda?"); }} />
        </div>
      )}

      {/* FAQ Tab */}
      {tab === "faq" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Perguntas Frequentes</h2>
            <p style={{ fontSize: 13, color: "#666", fontFamily: "sans-serif" }}>Toque em uma pergunta para consultar a VERA</p>
          </div>
          {[
            { cat: "💰 Investimentos", questions: ["Qual a diferença entre CDB e Tesouro Direto?", "O que é CDI e como ele afeta meus investimentos?", "Como funciona a tabela regressiva do Imposto de Renda?", "Vale a pena investir em ações sendo iniciante?"] },
            { cat: "💳 Dívidas e Crédito", questions: ["Como sair das dívidas pelo método bola de neve?", "O que é score de crédito e como melhorá-lo?", "Rotativo do cartão: quando devo parcelar a fatura?", "Como funciona a portabilidade de dívidas?"] },
            { cat: "🏦 Planejamento", questions: ["Como criar um orçamento pessoal do zero?", "O que é regra dos 50-30-20 para finanças?", "Quanto preciso guardar para me aposentar?", "Como declarar investimentos no Imposto de Renda?"] },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A84C", marginBottom: 10, fontFamily: "sans-serif" }}>{section.cat}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.questions.map((q, j) => (
                  <button key={j} onClick={() => sendMessage(q)} style={{
                    background: "#141428", border: "1px solid #1e1e3a",
                    borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                    textAlign: "left", color: "#ccc", fontSize: 14,
                    fontFamily: "'Crimson Pro', Georgia, serif",
                    transition: "all 0.2s", display: "flex", justifyContent: "space-between",
                    alignItems: "center"
                  }}
                    onMouseEnter={e => { e.target.style.borderColor = "#C9A84C44"; e.target.style.color = "#fff"; }}
                    onMouseLeave={e => { e.target.style.borderColor = "#1e1e3a"; e.target.style.color = "#ccc"; }}
                  >
                    {q} <span style={{ color: "#C9A84C", fontSize: 16 }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
