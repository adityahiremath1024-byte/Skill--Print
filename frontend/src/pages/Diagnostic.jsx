import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useSkillPrintStore from '../store/useSkillPrintStore';
import { generateDiagnostic, submitAnswer } from '../../api/client';

function SkillCard({ skill, index }) {
  const decay = skill.decayed_confidence;
  const raw = skill.raw_confidence;
  const decayPct = raw > 0 ? ((1 - decay / raw) * 100).toFixed(0) : 0;
  const color = decay >= 0.7 ? 'var(--color-success)' : decay >= 0.4 ? 'var(--color-ember)' : 'var(--color-danger)';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="card !p-3 group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{skill.name}</span>
        <span className="text-[8px] text-[var(--color-text-faint)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>{skill.category}</span>
      </div>
      <div className="w-full h-[3px] bg-[var(--color-abyss)] rounded-full overflow-hidden mb-1.5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(decay * 100)}%` }} transition={{ duration: 0.5, delay: index * 0.04 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <div className="flex justify-between text-[9px]" style={{ fontFamily: 'var(--font-mono)' }}>
        <span style={{ color }}>{(decay * 100).toFixed(0)}%</span>
        {skill.years_since_used > 0 && <span className="text-[var(--color-text-faint)]">−{decayPct}% · {skill.years_since_used.toFixed(1)}y</span>}
      </div>
    </motion.div>
  );
}

function ChatBubble({ role, content, isTyping }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (role !== 'bot' || !isTyping) { setDisplayed(content); setDone(true); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const iv = setInterval(() => { i++; setDisplayed(content.slice(0, i)); if (i >= content.length) { clearInterval(iv); setDone(true); } }, 10);
    return () => clearInterval(iv);
  }, [content, role, isTyping]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
        role === 'user' ? 'text-[var(--color-abyss)] rounded-br-sm' : 'card !rounded-bl-sm text-[var(--color-text)]'
      }`} style={role === 'user' ? { background: 'linear-gradient(135deg, var(--color-neon), var(--color-neon-end))' } : undefined}>
        <span className={!done && role === 'bot' ? 'typewriter' : ''}>{displayed}</span>
      </div>
    </motion.div>
  );
}

function BKTToast({ update, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const up = update.posterior > update.prior;
  return (
    <motion.div initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 280, opacity: 0 }}
      className="bkt-toast card-glow !py-2 !px-3 max-w-[240px]">
      <p className="text-[8px] text-[var(--color-text-faint)] uppercase tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-mono)' }}>BKT Update</p>
      <p className="text-xs text-white" style={{ fontFamily: 'var(--font-display)' }}>
        {update.skill}{' '}
        <span className="text-[var(--color-ember)]">{update.prior.toFixed(2)}</span>→
        <span style={{ color: up ? 'var(--color-success)' : 'var(--color-danger)' }}>{update.posterior.toFixed(2)}</span>
        {up ? ' ↑' : ' ↓'}
      </p>
    </motion.div>
  );
}

export default function Diagnostic() {
  const navigate = useNavigate();
  const { skills, questions, setQuestions, currentQuestionIndex, advanceQuestion, addBktUpdate, bktUpdates, updateSkillMastery, skillMastery, setLoading, isLoading } = useSkillPrintStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (skills.length > 0 && questions.length > 0 && !initialized) {
      setInitialized(true);
      // Use pre-loaded questions from store (mock or real)
      setMessages([{ role: 'bot', content: `${skills.length} skills loaded. I'll ask ${questions.length} targeted questions. Ready?`, isTyping: true }]);
      setTimeout(() => {
        if (questions.length > 0) {
          setMessages(prev => [...prev, { role: 'bot', content: `[${questions[0].skill} · ${questions[0].difficulty}]\n\n${questions[0].question}`, isTyping: true }]);
        }
      }, 1200);
    }
  }, [skills, questions, initialized]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const currentQ = questions[currentQuestionIndex];

  const handleSend = async () => {
    if (!input.trim() || !currentQ || isLoading) return;
    const answer = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: answer, isTyping: false }]);
    setLoading(true);
    try {
      const mastery = skillMastery[currentQ.skill] ?? currentQ.claimed_depth;
      const res = await submitAnswer({ question_id: currentQ.id, skill: currentQ.skill, question: currentQ.question, answer, current_mastery: mastery });
      addBktUpdate(res.bkt_update);
      updateSkillMastery(res.bkt_update.skill, res.bkt_update.posterior);
      setToast(res.bkt_update);
      advanceQuestion();
      const nextIdx = currentQuestionIndex + 1;
      if (nextIdx < questions.length) {
        const nextQ = questions[nextIdx];
        setTimeout(() => { setMessages(prev => [...prev, { role: 'bot', content: `[${nextQ.skill} · ${nextQ.difficulty}]\n\n${nextQ.question}`, isTyping: true }]); }, 1000);
      } else {
        setTimeout(() => { setMessages(prev => [...prev, { role: 'bot', content: 'Diagnostic complete. All mastery estimates calibrated. →', isTyping: true }]); }, 1000);
      }
    } catch { setMessages(prev => [...prev, { role: 'bot', content: 'Error. Try again.', isTyping: false }]); }
    finally { setLoading(false); }
  };

  const done = currentQuestionIndex >= questions.length && questions.length > 0;

  return (
    <div className="min-h-screen flex" style={{ paddingTop: '56px' }}>
      {/* LEFT */}
      <aside className="hidden md:flex w-[280px] border-r border-[var(--color-abyss-border)] bg-[var(--color-abyss-raised)] flex-col overflow-y-auto">
        <div className="p-3 border-b border-[var(--color-abyss-border)]">
          <h2 className="text-xs text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Extracted Skills</h2>
          <p className="text-[9px] text-[var(--color-text-faint)]" style={{ fontFamily: 'var(--font-mono)' }}>{skills.length} detected</p>
        </div>
        <div className="p-2 flex flex-col gap-1.5 flex-1">{skills.map((s, i) => <SkillCard key={s.name} skill={s} index={i} />)}</div>
        <div className="p-2 border-t border-[var(--color-abyss-border)] flex items-center gap-3 text-[8px]" style={{ fontFamily: 'var(--font-mono)' }}>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" /> Fresh</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ember)]" /> Decaying</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)]" /> Stale</span>
        </div>
      </aside>

      {/* RIGHT */}
      <main className="flex-1 flex flex-col bg-[var(--color-abyss)]">
        <div className="px-4 py-2 border-b border-[var(--color-abyss-border)] flex items-center justify-between">
          <div>
            <h2 className="text-xs text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Adaptive Diagnostic</h2>
            <p className="text-[9px] text-[var(--color-text-faint)]" style={{ fontFamily: 'var(--font-mono)' }}>
              Q{Math.min(currentQuestionIndex + 1, questions.length)}/{questions.length}
            </p>
          </div>
          {done && <button onClick={() => navigate('/results')} className="btn-primary !py-1.5 !px-4 !text-[10px]">Results →</button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, i) => <ChatBubble key={i} {...msg} />)}
          <div ref={chatEndRef} />
        </div>

        <div className="px-4 py-2 border-t border-[var(--color-abyss-border)]">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={done ? 'Complete!' : 'Type your answer...'} disabled={done || isLoading}
              className="flex-1 bg-[var(--color-abyss-card)] border border-[var(--color-abyss-border)] rounded-lg px-3 py-2 text-xs text-white placeholder-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-neon)] transition-colors disabled:opacity-40"
              style={{ fontFamily: 'var(--font-body)' }} />
            <button onClick={handleSend} disabled={done || isLoading || !input.trim()} className="btn-primary !py-2 !px-4 !text-xs">
              {isLoading ? '···' : 'Send'}
            </button>
          </div>
        </div>
      </main>

      <AnimatePresence>{toast && <BKTToast update={toast} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
}
