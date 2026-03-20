import React, { useState, useRef, useEffect } from 'react';

/* ─── Animated Canvas Background ───────────────────────────── */
const ParticleCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const particles = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() * 2 + 0.5, hue: Math.random() * 60 + 160 });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,65%,0.5)`; ctx.fill();
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `hsla(190,70%,60%,${0.15 * (1 - d / 120)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        });
      });
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
};

/* ─── DNA Strand Animation ──────────────────────────────────── */
const DnaCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 280; canvas.height = 280;
    let angle = 0;
    const colors = ['#00e5ff', '#7c4dff', '#ff6090', '#69f0ae', '#ffd740', '#ff6e40'];
    const draw = () => {
      ctx.clearRect(0, 0, 280, 280);
      const cx = 140;
      for (let i = 0; i < 40; i++) {
        const t = i / 40 * Math.PI * 4 + angle;
        const y = 20 + (i / 40) * 240;
        const x1 = cx + Math.sin(t) * 50;
        const x2 = cx - Math.sin(t) * 50;
        const a = 0.3 + Math.abs(Math.sin(t)) * 0.7;
        const c1 = colors[i % colors.length];
        const c2 = colors[(i + 3) % colors.length];
        const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
        const [r1,g1,b1] = hex2rgb(c1);
        const [r2,g2,b2] = hex2rgb(c2);
        ctx.beginPath(); ctx.arc(x1, y, 4, 0, Math.PI * 2); ctx.fillStyle = `rgba(${r1},${g1},${b1},${a})`; ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y, 4, 0, Math.PI * 2); ctx.fillStyle = `rgba(${r2},${g2},${b2},${a})`; ctx.fill();
        if (i % 4 === 0) { ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.strokeStyle = `rgba(255,255,255,${a * 0.2})`; ctx.lineWidth = 1; ctx.stroke(); }
      }
      angle += 0.015;
      requestAnimationFrame(draw);
    };
    draw();
  }, []);
  return <canvas ref={ref} style={{ width: 280, height: 280 }} />;
};

/* ─── Radar Chart ───────────────────────────────────────────── */
const RadarChart = ({ data }) => {
  const n = data.length, cx = 150, cy = 150, R = 110;
  const pts = data.map((d, i) => { const a = Math.PI * 2 * i / n - Math.PI / 2; return { x: cx + Math.cos(a) * R * (d.value / 100), y: cy + Math.sin(a) * R * (d.value / 100), lx: cx + Math.cos(a) * (R + 22), ly: cy + Math.sin(a) * (R + 22), label: d.label }; });
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 300 }}>
      {[20, 40, 60, 80, 100].map(v => (
        <polygon key={v} points={Array.from({ length: n }, (_, i) => { const a = Math.PI * 2 * i / n - Math.PI / 2; return `${cx + Math.cos(a) * R * (v / 100)},${cy + Math.sin(a) * R * (v / 100)}`; }).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      <polygon points={poly} fill="rgba(0,229,255,0.15)" stroke="#00e5ff" strokeWidth="2" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#00e5ff" />
          <text x={p.lx} y={p.ly} fill="rgba(255,255,255,0.7)" fontSize="9" textAnchor="middle" dominantBaseline="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

/* ─── Tag Input ─────────────────────────────────────────────── */
const TagInput = ({ tags, setTags, placeholder, maxTags = 10 }) => {
  const [val, setVal] = useState('');
  const add = () => { const t = val.trim(); if (t && tags.length < maxTags && !tags.includes(t)) { setTags([...tags, t]); setVal(''); } };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {tags.map((t, i) => (
          <span key={i} style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#b0e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            {t}<span onClick={() => setTags(tags.filter((_, j) => j !== i))} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 16, lineHeight: 1 }}>×</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} placeholder={placeholder}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', color: '#e0f0f4', fontSize: 14, outline: 'none' }} />
        <button onClick={add} style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 10, padding: '10px 20px', color: '#00e5ff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>+</button>
      </div>
    </div>
  );
};

/* ─── Main App ──────────────────────────────────────────────── */
export default function App() {
  const [step, setStep] = useState('intro');
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [interests, setInterests] = useState([]);
  const [country, setCountry] = useState('');
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');
  const [unlockClicked, setUnlockClicked] = useState(false);

  // Upload step state
  const [uploadMode, setUploadMode] = useState('pdf'); // 'pdf' | 'jd'
  const [jdText, setJdText] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const messages = [
    'Mapping your skill constellation...',
    'Cross-referencing 14M+ professional profiles...',
    'Calculating your rarity index...',
    'Identifying hidden skill intersections...',
    'Finding your monetization sweet spots...',
    'Generating your SkillPrint DNA...',
  ];

  /* ── Parse Resume / JD ── */
  const handleParse = async () => {
    setUploading(true);
    setUploadError('');
    try {
      let body;
      if (uploadMode === 'pdf' && uploadFile) {
        const arrayBuffer = await uploadFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const pdfBase64 = btoa(binary);
        body = { pdfBase64, mimeType: uploadFile.type || 'application/pdf' };
      } else if (uploadMode === 'jd' && jdText.trim()) {
        body = { jdText };
      } else {
        setUploadError('Please upload a PDF or paste job description text.');
        setUploading(false);
        return;
      }

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');

      if (data.skills?.length) setSkills(data.skills.slice(0, 10));
      if (data.experience) setExperience(data.experience);
      if (data.education) setEducation(data.education);
      if (data.interests?.length) setInterests(data.interests.slice(0, 6));
      if (data.country) setCountry(data.country);
      setStep('skills');
    } catch (e) {
      setUploadError(e.message || 'Could not extract skills. Please fill in manually.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Analyze ── */
  const analyze = async () => {
    setStep('analyzing');
    setProgress(0);
    setError('');
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 8 + 2;
      if (pct > 95) pct = 95;
      setProgress(pct);
      setProgressLabel(messages[Math.min(Math.floor(pct / 17), messages.length - 1)]);
    }, 400);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, experience, education, interests, country }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);
      setProgressLabel('SkillPrint complete!');
      setTimeout(() => { setResult(data); setStep('results'); }, 600);
    } catch {
      clearInterval(interval);
      setError('Analysis failed. Please try again.');
      setStep('interests');
    }
  };

  /* ── Styles ── */
  const page = { minHeight: '100vh', background: 'linear-gradient(145deg, #0a0e1a 0%, #0d1527 30%, #0a1628 60%, #081018 100%)', color: '#e0f0f4', fontFamily: "'Sora','DM Sans',sans-serif", position: 'relative', overflow: 'hidden' };
  const card = { background: 'rgba(13,22,42,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: 20, padding: '40px 36px', maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 };
  const btn = { background: 'linear-gradient(135deg,#00e5ff 0%,#7c4dff 100%)', border: 'none', borderRadius: 14, padding: '14px 36px', color: '#0a0e1a', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, transition: 'transform 0.2s,box-shadow 0.2s', boxShadow: '0 4px 24px rgba(0,229,255,0.25)' };
  const btnGhost = { ...btn, background: 'rgba(255,255,255,0.05)', color: '#e0f0f4', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.12)' };
  const label = { fontSize: 13, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'block', fontWeight: 600 };
  const input = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', color: '#e0f0f4', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const stepBadge = { fontSize: 11, color: '#00e5ff', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, fontWeight: 600 };
  const tabBtn = (active) => ({ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: active ? 'rgba(0,229,255,0.15)' : 'transparent', color: active ? '#00e5ff' : 'rgba(255,255,255,0.4)', borderBottom: active ? '2px solid #00e5ff' : '2px solid transparent' });

  const shareText = result ? `🧬 My SkillPrint: "${result.title}" — Rarity: ${result.rarityScore}/100 (${result.rarityRatio}). Discover yours:` : '';

  return (
    <div style={page}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <ParticleCanvas />

      <div style={{ padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#00e5ff', marginBottom: 8, fontWeight: 600 }}>✦ Powered by AI</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg,#00e5ff,#7c4dff,#ff6090)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SkillPrint AI</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '8px 0 0', fontFamily: "'Space Mono',monospace" }}>Discover Your Rare Skill DNA</p>
        </div>

        {/* INTRO */}
        {step === 'intro' && (
          <div style={card}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🧬</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.3 }}>Your skills aren't just skills.<br /><span style={{ color: '#00e5ff' }}>They're a fingerprint.</span></h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>Individual skills are common. But YOUR specific combination? That's extraordinarily rare.</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>SkillPrint AI reveals your rarity score, hidden superpowers, and exactly how to turn your combination into income.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 28, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                <span>🔬 Rarity Index</span><span>💡 Hidden Powers</span><span>💰 Income Paths</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => setStep('upload')} style={btn}>📄 Upload Resume / JD →</button>
                <button onClick={() => setStep('skills')} style={{ ...btnGhost, fontSize: 14, padding: '12px 24px' }}>✍️ Enter Skills Manually</button>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>Takes 60 seconds · 100% free</p>
            </div>
          </div>
        )}

        {/* STEP 0: UPLOAD */}
        {step === 'upload' && (
          <div style={card}>
            <div style={stepBadge}>Auto-Extract Skills</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Upload your resume or job description</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>AI will extract your skills, experience & education automatically.</p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
              <button style={tabBtn(uploadMode === 'pdf')} onClick={() => setUploadMode('pdf')}>📄 Resume PDF</button>
              <button style={tabBtn(uploadMode === 'jd')} onClick={() => setUploadMode('jd')}>📋 Job Description</button>
            </div>

            {uploadMode === 'pdf' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '2px dashed rgba(0,229,255,0.25)', borderRadius: 14, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: uploadFile ? 'rgba(0,229,255,0.05)' : 'transparent', transition: 'all 0.2s' }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>{uploadFile ? '✅' : '📁'}</div>
                <p style={{ color: uploadFile ? '#69f0ae' : 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, fontWeight: uploadFile ? 600 : 400 }}>
                  {uploadFile ? uploadFile.name : 'Click to upload PDF resume'}
                </p>
                {!uploadFile && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: '6px 0 0' }}>Supports .pdf files up to 10MB</p>}
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0] || null)} />
              </div>
            ) : (
              <div>
                <label style={label}>Paste Job Description</label>
                <textarea value={jdText} onChange={e => setJdText(e.target.value)} rows={7} placeholder="Paste the full job description here — AI will extract required skills and role details..."
                  style={{ ...input, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            )}

            {uploadError && <p style={{ color: '#ff6090', fontSize: 13, marginTop: 12 }}>{uploadError}</p>}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <button onClick={() => setStep('intro')} style={btnGhost}>← Back</button>
              <button
                onClick={handleParse}
                disabled={uploading || (uploadMode === 'pdf' ? !uploadFile : !jdText.trim())}
                style={{ ...btn, opacity: uploading || (uploadMode === 'pdf' ? !uploadFile : !jdText.trim()) ? 0.5 : 1, flex: 1 }}
              >
                {uploading ? '⏳ Extracting...' : '✨ Extract Skills →'}
              </button>
            </div>
            <p style={{ textAlign: 'center', marginTop: 12 }}>
              <span onClick={() => setStep('skills')} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', textDecoration: 'underline' }}>Skip — enter skills manually instead</span>
            </p>
          </div>
        )}

        {/* STEP 1: SKILLS */}
        {step === 'skills' && (
          <div style={card}>
            <div style={stepBadge}>Step 1 of 3</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>What are your skills?</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Technical skills, soft skills, languages, tools — anything you're good at.</p>
            <label style={label}>Your Skills (add 3–10)</label>
            <TagInput tags={skills} setTags={setSkills} placeholder="e.g., Python, Public Speaking, English..." maxTags={10} />
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('intro')} style={btnGhost}>← Back</button>
              <button onClick={() => skills.length >= 3 && setStep('experience')} style={{ ...btn, opacity: skills.length >= 3 ? 1 : 0.4 }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 2: EXPERIENCE */}
        {step === 'experience' && (
          <div style={card}>
            <div style={stepBadge}>Step 2 of 3</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Your background</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Helps calibrate your rarity against the right professional landscape.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={label}>Years of Experience</label>
                <select value={experience} onChange={e => setExperience(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  <option>Student/Fresh Graduate</option>
                  <option>1-2 years</option>
                  <option>3-5 years</option>
                  <option>5-10 years</option>
                  <option>10+ years</option>
                </select>
              </div>
              <div>
                <label style={label}>Highest Education</label>
                <select value={education} onChange={e => setEducation(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  <option>High School</option>
                  <option>Bachelor's</option>
                  <option>Master's</option>
                  <option>PhD</option>
                  <option>Self-taught</option>
                </select>
              </div>
              <div>
                <label style={label}>Country</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., India" style={input} />
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('skills')} style={btnGhost}>← Back</button>
              <button onClick={() => experience && education && country && setStep('interests')} style={{ ...btn, opacity: experience && education && country ? 1 : 0.4 }}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 3: INTERESTS */}
        {step === 'interests' && (
          <div style={card}>
            <div style={stepBadge}>Step 3 of 3</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>What fascinates you?</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Your interests often hide your most monetizable skill intersections.</p>
            <label style={label}>Interests & Passions (add 2–6)</label>
            <TagInput tags={interests} setTags={setInterests} placeholder="e.g., AI Ethics, Mental Health..." maxTags={6} />
            {error && <p style={{ color: '#ff6090', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('experience')} style={btnGhost}>← Back</button>
              <button onClick={() => interests.length >= 2 && analyze()} style={{ ...btn, opacity: interests.length >= 2 ? 1 : 0.4 }}>🧬 Generate My SkillPrint</button>
            </div>
          </div>
        )}

        {/* ANALYZING */}
        {step === 'analyzing' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: '50%', border: '3px solid rgba(0,229,255,0.2)', borderTopColor: '#00e5ff', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>{progressLabel}</h2>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, height: 6, overflow: 'hidden', marginTop: 20 }}>
              <div style={{ background: 'linear-gradient(90deg,#00e5ff,#7c4dff)', height: '100%', borderRadius: 8, width: `${progress}%`, transition: 'width 0.4s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>{Math.round(progress)}%</p>
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && result && (
          <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ ...card, textAlign: 'center', maxWidth: '100%', marginBottom: 16, background: 'linear-gradient(145deg,rgba(13,22,42,0.9),rgba(20,10,40,0.8))', borderColor: 'rgba(124,77,255,0.2)' }}>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7c4dff', marginBottom: 16, fontWeight: 600 }}>Your SkillPrint DNA</div>
              <DnaCanvas />
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0 4px', background: 'linear-gradient(135deg,#00e5ff,#7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{result.title}</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>{result.tagline}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: 42, fontWeight: 800, fontFamily: "'Space Mono'", color: '#00e5ff' }}>{result.rarityScore}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Rarity Score</div></div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div><div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Space Mono'", color: '#7c4dff' }}>{result.rarityRatio}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Among Professionals</div></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ ...card, maxWidth: '100%', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12, fontWeight: 600 }}>Skill Dimensions</div>
                <RadarChart data={result.radarData} />
              </div>
              <div style={{ ...card, maxWidth: '100%', padding: 24 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16, fontWeight: 600 }}>Rare Intersections</div>
                {result.topIntersections.map((x, i) => (
                  <div key={i} style={{ marginBottom: i < 2 ? 16 : 0, paddingBottom: i < 2 ? 16 : 0, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: ['#00e5ff', '#7c4dff', '#ff6090'][i] }}>{x.combo}</div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0', lineHeight: 1.5 }}>{x.insight}</p>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Space Mono'" }}>Only {x.rarity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...card, maxWidth: '100%', marginBottom: 16, padding: 24, background: 'linear-gradient(135deg,rgba(0,229,255,0.06),rgba(124,77,255,0.06))' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#ffd740', marginBottom: 10, fontWeight: 600 }}>⚡ Hidden Superpower</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: 'rgba(255,255,255,0.75)' }}>{result.hiddenSuperpower}</p>
            </div>

            <div style={{ ...card, maxWidth: '100%', marginBottom: 16, padding: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#69f0ae', marginBottom: 16, fontWeight: 600 }}>💰 Monetization Paths</div>
              {result.monetizationPaths.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{m.path}</div><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>⏱ {m.timeToRevenue}</span></div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 14, color: '#69f0ae', fontWeight: 700 }}>{m.potential}</div>
                </div>
              ))}
            </div>

            <div style={{ ...card, maxWidth: '100%', marginBottom: 16, padding: 24, border: '1px solid rgba(255,96,144,0.2)' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#ff6090', marginBottom: 10, fontWeight: 600 }}>🚀 Your 7-Day Challenge</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: 'rgba(255,255,255,0.75)' }}>{result.oneWeekChallenge}</p>
            </div>

            <div style={{ ...card, maxWidth: '100%', textAlign: 'center', padding: 32, background: 'linear-gradient(145deg,rgba(124,77,255,0.12),rgba(255,96,144,0.08))', border: '1px solid rgba(124,77,255,0.25)', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>🔓 Want the Full Report?</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>30-day monetization roadmap, skill gap analysis, curated job matches, and shareable SkillPrint card.</p>
              <button onClick={() => setUnlockClicked(true)} style={{ ...btn, background: 'linear-gradient(135deg,#7c4dff,#ff6090)' }}>Unlock Full Report — $4.99</button>
              {unlockClicked && <p style={{ fontSize: 12, color: '#ffd740', marginTop: 12 }}>💡 Coming soon! Share your SkillPrint to get early access.</p>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigator.clipboard.writeText(shareText)} style={{ ...btn, fontSize: 13, padding: '12px 24px' }}>📋 Copy</button>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' https://skill-print-lbei.vercel.app')}`} target="_blank" rel="noopener noreferrer" style={{ ...btn, fontSize: 13, padding: '12px 24px', textDecoration: 'none', background: 'linear-gradient(135deg,#1da1f2,#0d8bd9)' }}>Share on 𝕏</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://skill-print-lbei.vercel.app')}`} target="_blank" rel="noopener noreferrer" style={{ ...btn, fontSize: 13, padding: '12px 24px', textDecoration: 'none', background: 'linear-gradient(135deg,#0077b5,#005f8d)' }}>LinkedIn</a>
              <button onClick={() => { setStep('intro'); setSkills([]); setExperience(''); setEducation(''); setCountry(''); setInterests([]); setResult(null); setUploadFile(null); setJdText(''); }} style={{ ...btnGhost, fontSize: 13, padding: '12px 24px' }}>↻ Restart</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 48, fontSize: 11, color: 'rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}>Built by Aditya M Hiremath · Powered by AI</div>
      </div>
    </div>
  );
}
