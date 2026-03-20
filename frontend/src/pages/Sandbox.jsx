import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSkillPrintStore from '../store/useSkillPrintStore';
import { evaluateSandbox } from '../../api/client';
import { mockSandboxScenario } from '../mocks/skillprint_mock';

function ScoreRing({ score }) {
  const pct = score * 100;
  const color = pct >= 80 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-ember)' : 'var(--color-danger)';
  const circ = 2 * Math.PI * 48;
  const offset = circ - score * circ;

  return (
    <div className="relative w-24 h-24 mx-auto stat-ring">
      <svg viewBox="0 0 108 108" className="w-full h-full -rotate-90">
        <circle cx="54" cy="54" r="48" fill="none" stroke="var(--color-abyss-border)" strokeWidth="5" />
        <motion.circle cx="54" cy="54" r="48" fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg text-white" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function StreamText({ text, speed = 6 }) {
  const [disp, setDisp] = useState('');
  useEffect(() => {
    if (!text) { setDisp(''); return; }
    setDisp(''); let i = 0;
    const iv = setInterval(() => { i++; setDisp(text.slice(0, i)); if (i >= text.length) clearInterval(iv); }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{disp}</span>;
}

export default function Sandbox() {
  const navigate = useNavigate();
  const { sandboxScenario, setSandboxScenario, sandboxEvaluation, setSandboxEvaluation, setSandboxResponse, setLoading, isLoading } = useSkillPrintStore();
  const [response, setResponse] = useState('');

  useEffect(() => { if (!sandboxScenario) setSandboxScenario(mockSandboxScenario.scenario); }, []);

  const handleEvaluate = async () => {
    if (!response.trim()) return;
    setSandboxResponse(response);
    setLoading(true);
    try {
      const result = await evaluateSandbox({ scenario: sandboxScenario || mockSandboxScenario.scenario, response, skill: mockSandboxScenario.skill });
      setSandboxEvaluation(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--color-abyss)]" style={{ paddingTop: '56px' }}>
      <section style={{ padding: '20px 0 32px' }}>
        <div className="container-main">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6 reveal">
            <div>
              <p className="text-[var(--color-neon)] text-[10px] tracking-widest uppercase mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Sandbox</p>
              <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>Real-World <span className="gradient-text">Evaluation</span></h1>
              <p className="text-[var(--color-text-muted)] text-sm mt-1">Prove your skills in a realistic scenario. Claude evaluates your approach.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/results')} className="btn-ghost !text-[10px]">← Results</button>
              <button onClick={() => navigate('/')} className="btn-ghost !text-[10px]">New Analysis</button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* LEFT */}
            <div className="flex flex-col gap-3">
              <div className="card-glow reveal">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg grid place-items-center text-sm" style={{ background: 'var(--color-signal-dim)' }}>🧪</span>
                  <h3 className="text-xs text-white flex-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Scenario</h3>
                  <span className="badge badge-high text-[10px]">{mockSandboxScenario.skill}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">
                  {sandboxScenario || mockSandboxScenario.scenario}
                </p>
              </div>

              <div className="card reveal flex flex-col">
                <h3 className="text-xs text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Your Response</h3>
                <textarea
                  value={response} onChange={(e) => setResponse(e.target.value)}
                  placeholder="Describe your approach — tools, commands, architecture decisions..."
                  className="flex-1 bg-[var(--color-abyss)] border border-[var(--color-abyss-border)] rounded-lg p-3 text-xs text-[var(--color-text)] resize-none focus:outline-none focus:border-[var(--color-neon)] transition-colors min-h-[140px]"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
                <button onClick={handleEvaluate} disabled={!response.trim() || isLoading} className="btn-primary w-full justify-center mt-3">
                  {isLoading ? <span className="flex items-center gap-2"><span className="spinner !w-4 !h-4" />Evaluating...</span> : 'Evaluate →'}
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-3">
              {sandboxEvaluation ? (
                <>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center">
                    <p className="text-[9px] text-[var(--color-text-faint)] uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)' }}>Score</p>
                    <ScoreRing score={sandboxEvaluation.score} />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
                    <h3 className="text-xs text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Assessment</h3>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
                      <StreamText text={sandboxEvaluation.feedback} />
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                      <h3 className="text-[10px] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-success)' }}>Strengths</h3>
                      {sandboxEvaluation.strengths.map((s, i) => (
                        <p key={i} className="text-[10px] text-[var(--color-text-muted)] flex gap-1 mb-1"><span className="text-[var(--color-success)]">▸</span>{s}</p>
                      ))}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
                      <h3 className="text-[10px] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-ember)' }}>Improvements</h3>
                      {sandboxEvaluation.improvements.map((s, i) => (
                        <p key={i} className="text-[10px] text-[var(--color-text-muted)] flex gap-1 mb-1"><span className="text-[var(--color-ember)]">▸</span>{s}</p>
                      ))}
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="card grid place-items-center text-center py-10 reveal">
                  <div>
                    <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl mx-auto mb-3 opacity-25" style={{ background: 'var(--color-abyss-border)' }}>🧪</div>
                    <h3 className="text-sm text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Awaiting Your Response</h3>
                    <p className="text-[10px] text-[var(--color-text-faint)] max-w-[200px] mx-auto">Read the scenario, write your approach, and Claude will evaluate.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
