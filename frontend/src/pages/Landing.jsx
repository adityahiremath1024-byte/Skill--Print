import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSkillPrintStore from '../store/useSkillPrintStore';
import { parseResume } from '../../api/client';

function Particles() {
  return (
    <div className="particles-bg">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="particle" />)}
    </div>
  );
}

function CyclingWord() {
  const words = ['Genome', 'Blueprint', 'Fingerprint', 'DNA'];
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[idx];
    let timer;
    if (!deleting) {
      if (displayed.length < word.length) {
        timer = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      } else {
        timer = setTimeout(() => setDeleting(true), 2000);
      }
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
      } else {
        setDeleting(false);
        setIdx((idx + 1) % words.length);
      }
    }
    return () => clearTimeout(timer);
  }, [displayed, deleting, idx]);

  return <span className="gradient-text typewriter">{displayed}</span>;
}

function DropZone({ label, sublabel, icon, accept, onFile, onText, value, textMode }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFile) onFile(file);
  }, [onFile]);

  if (textMode) {
    return (
      <div className="card flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'var(--color-signal-dim)' }}>{icon}</span>
          <div>
            <h3 className="text-[13px] text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{label}</h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">{sublabel}</p>
          </div>
        </div>
        <textarea
          value={value || ''}
          onChange={(e) => onText(e.target.value)}
          placeholder="Paste the full job description here..."
          className="flex-1 bg-[var(--color-abyss)] border border-[var(--color-abyss-border)] rounded-lg p-3 text-xs text-[var(--color-text)] resize-none focus:outline-none focus:border-[var(--color-neon)] transition-colors min-h-[120px]"
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`drop-zone p-5 flex flex-col items-center justify-center gap-3 min-h-[140px] ${dragActive ? 'active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f && onFile) onFile(f); }} />
      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--color-neon-dim)' }}>{icon}</span>
      <div className="text-center">
        <p className="text-white text-[13px]" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{label}</p>
        <p className="text-[var(--color-text-muted)] text-[10px] mt-1">
          {value ? <span className="text-[var(--color-neon)]">✓ {value.name || 'Loaded'}</span> : sublabel}
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { resumeFile, setResumeFile, jdText, setJdText, setParseResult, setLoading, isLoading } = useSkillPrintStore();
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!resumeFile && !jdText) { setError('Upload a resume or paste a job description to begin.'); return; }
    setError('');
    setLoading(true, 'Mapping your skill genome...');
    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      formData.append('jd_text', jdText || '');
      formData.append('resume_text', '');
      const result = await parseResume(formData);
      setParseResult(result);
      navigate('/diagnostic');
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative">
      <Particles />

      {/* HERO */}
      <section className="relative z-10" style={{ paddingTop: '80px', paddingBottom: '32px' }}>
        <div className="container-main grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 relative">
            <div className="morph-blob" style={{ top: '-100px', left: '-80px', width: '400px', height: '400px' }} />
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="badge badge-medium mb-3 text-[10px] tracking-wider uppercase"
            >AI-Powered Skill Analysis</motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-3" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}
            >
              Map Your Skill<br /><CyclingWord />
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
              className="text-[var(--color-text-muted)] text-sm max-w-md leading-relaxed mb-5"
            >
              Upload your resume. Paste a job description. Our Bayesian engine maps every skill
              with <span className="text-[var(--color-neon)]">temporal decay</span> modeling — then
              diagnoses what you <em>actually</em> know.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-wrap gap-5"
            >
              {[
                { n: '5-Layer', l: 'Analysis Pipeline' },
                { n: 'BKT', l: 'Bayesian Tracing' },
                { n: 'e⁻λt', l: 'Decay Modeling' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <div className="text-xl gradient-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{s.n}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-5 flex flex-col gap-3"
          >
            <DropZone label="Resume PDF" sublabel="Drag & drop or click" icon="📄" accept=".pdf" value={resumeFile} onFile={(f) => setResumeFile(f)} />
            <DropZone label="Job Description" sublabel="Paste the target role" icon="💼" textMode value={jdText} onText={(t) => setJdText(t)} />
            {error && <p className="text-[var(--color-danger)] text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>}
            <button onClick={handleAnalyze} disabled={isLoading} className="btn-primary w-full justify-center">
              {isLoading ? <span className="flex items-center gap-2"><span className="spinner !w-4 !h-4" />Analyzing...</span> : 'Analyze My SkillPrint →'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 section-alt" style={{ padding: '32px 0' }}>
        <div className="container-main">
          <div className="reveal mb-6">
            <p className="text-[var(--color-neon)] text-[10px] tracking-widest uppercase mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Process</p>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>Five stages to your <span className="gradient-text">complete SkillPrint</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 reveal-stagger">
            {[
              { n: '01', title: 'Extract', desc: 'AI parses your resume and maps every skill with confidence scores', accent: 'var(--color-neon)' },
              { n: '02', title: 'Decay', desc: 'Exponential decay model recalculates real proficiency over time', accent: 'var(--color-ember)' },
              { n: '03', title: 'Diagnose', desc: 'Claude Sonnet 4 asks adaptive questions to probe your depth', accent: 'var(--color-signal)' },
              { n: '04', title: 'Trace', desc: 'BKT updates mastery probability after each diagnostic answer', accent: 'var(--color-danger)' },
              { n: '05', title: 'Path', desc: 'Personalized DAG maps the optimal route to close skill gaps', accent: 'var(--color-success)' },
            ].map((item) => (
              <div key={item.n} className="card reveal">
                <span className="text-3xl block mb-2 opacity-15" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: item.accent }}>{item.n}</span>
                <h3 className="text-[13px] text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{item.title}</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALGORITHMS */}
      <section className="relative z-10" style={{ padding: '32px 0' }}>
        <div className="container-main grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 reveal">
            <p className="text-[var(--color-neon)] text-[10px] tracking-widest uppercase mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Under the Hood</p>
            <h2 className="mb-2" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>Two algorithms.<br />Zero guesswork.</h2>
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
              SkillPrint AI combines exponential temporal decay
              with Bayesian Knowledge Tracing — validated through adversarial diagnostic questions.
            </p>
          </div>
          <div className="md:col-span-7 grid gap-3 reveal-stagger">
            <div className="card-glow reveal">
              <div className="flex items-start gap-3">
                <span className="text-2xl opacity-20 gradient-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}>λ</span>
                <div>
                  <h3 className="text-[13px] text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Temporal Decay</h3>
                  <p className="text-[11px] mb-2 text-[var(--color-text-muted)]">Skills erode without practice:</p>
                  <code className="text-[10px] text-[var(--color-neon)] block bg-[var(--color-abyss)] rounded-lg px-3 py-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    C_decayed = C_raw × e^(−λt)  │  λ=0.15
                  </code>
                </div>
              </div>
            </div>
            <div className="card-glow reveal">
              <div className="flex items-start gap-3">
                <span className="text-2xl opacity-20 gradient-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}>P</span>
                <div>
                  <h3 className="text-[13px] text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Bayesian Knowledge Tracing</h3>
                  <p className="text-[11px] mb-2 text-[var(--color-text-muted)]">Every answer updates mastery:</p>
                  <code className="text-[10px] text-[var(--color-ember)] block bg-[var(--color-abyss)] rounded-lg px-3 py-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    P(mastery|correct) = P(M)×(1−P_slip) / P(correct)
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative z-10 overflow-hidden py-4 border-t border-b border-[var(--color-abyss-border)]">
        <div className="flex gap-8 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
          {['React', 'FastAPI', 'Claude AI', 'D3.js', 'BKT Engine', 'Temporal Decay', 'Chart.js', 'PyMuPDF', 'Zustand', 'Framer Motion',
            'React', 'FastAPI', 'Claude AI', 'D3.js', 'BKT Engine', 'Temporal Decay', 'Chart.js', 'PyMuPDF', 'Zustand', 'Framer Motion'
          ].map((tag, i) => (
            <span key={i} className="text-[10px] text-[var(--color-text-faint)] uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-mono)' }}>{tag}</span>
          ))}
        </div>
        <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </section>

      <footer className="relative z-10 text-center py-4">
        <p className="text-[var(--color-text-faint)] text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>SkillPrint AI — Hackathon 2026</p>
      </footer>
    </div>
  );
}
