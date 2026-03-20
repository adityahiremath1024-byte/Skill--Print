import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import useSkillPrintStore from '../store/useSkillPrintStore';
import { generateLearningPath } from '../../api/client';

/* ─── Course Recommendations (client-side generated) ────────── */
const COURSE_DB = {
  'Python': [
    { title: 'Python for Data Science', provider: 'Coursera', url: 'https://coursera.org/learn/python', level: 'Intermediate', hours: 25 },
    { title: 'Automate the Boring Stuff', provider: 'Udemy', url: 'https://automatetheboringstuff.com', level: 'Beginner', hours: 10 },
  ],
  'JavaScript': [
    { title: 'JavaScript: Understanding the Weird Parts', provider: 'Udemy', url: 'https://udemy.com', level: 'Intermediate', hours: 12 },
    { title: 'The Odin Project — Full Stack JS', provider: 'Open Source', url: 'https://theodinproject.com', level: 'Beginner', hours: 80 },
  ],
  'React': [
    { title: 'React — The Complete Guide', provider: 'Udemy', url: 'https://udemy.com', level: 'Intermediate', hours: 48 },
    { title: 'React Docs — Learn React', provider: 'React.dev', url: 'https://react.dev/learn', level: 'Beginner', hours: 15 },
  ],
  'TypeScript': [
    { title: 'TypeScript Deep Dive', provider: 'Open Source', url: 'https://basarat.gitbook.io/typescript', level: 'Intermediate', hours: 20 },
  ],
  'Node.js': [
    { title: 'Node.js — The Complete Guide', provider: 'Udemy', url: 'https://udemy.com', level: 'Intermediate', hours: 36 },
  ],
  'SQL': [
    { title: 'SQL for Data Science', provider: 'Coursera', url: 'https://coursera.org', level: 'Beginner', hours: 15 },
    { title: 'SQLBolt Interactive Tutorial', provider: 'SQLBolt', url: 'https://sqlbolt.com', level: 'Beginner', hours: 5 },
  ],
  'Docker': [
    { title: 'Docker Mastery', provider: 'Udemy', url: 'https://udemy.com', level: 'Intermediate', hours: 20 },
  ],
  'AWS': [
    { title: 'AWS Cloud Practitioner', provider: 'AWS', url: 'https://aws.amazon.com/training', level: 'Beginner', hours: 30 },
  ],
  'Machine Learning': [
    { title: 'Machine Learning Specialization', provider: 'Coursera', url: 'https://coursera.org', level: 'Advanced', hours: 60 },
    { title: 'Fast.ai Practical Deep Learning', provider: 'Fast.ai', url: 'https://fast.ai', level: 'Intermediate', hours: 40 },
  ],
  'System Design': [
    { title: 'Grokking System Design', provider: 'Educative', url: 'https://educative.io', level: 'Advanced', hours: 30 },
  ],
};

function getCoursesForSkill(name) {
  const exact = COURSE_DB[name];
  if (exact) return exact;
  const key = Object.keys(COURSE_DB).find(k => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase()));
  if (key) return COURSE_DB[key];
  return [{ title: `Learn ${name} — Official Docs`, provider: 'Web', url: `https://google.com/search?q=learn+${encodeURIComponent(name)}+course`, level: 'Beginner', hours: 15 }];
}

/* ─── Node Drawer with Courses ──────────────────────────────── */
function NodeDrawer({ node, onClose }) {
  if (!node) return null;
  const courses = getCoursesForSkill(node.label);
  const pC = { critical: 'var(--color-danger)', high: 'var(--color-ember)', medium: 'var(--color-neon)', low: 'var(--color-success)' };

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 w-[340px] h-full bg-[var(--color-abyss-raised)] border-l border-[var(--color-abyss-border)] shadow-2xl z-40 flex flex-col overflow-y-auto"
    >
      <div className="p-4 border-b border-[var(--color-abyss-border)] flex items-center justify-between">
        <h3 className="text-sm text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{node.label}</h3>
        <button onClick={onClose} className="text-[var(--color-text-faint)] hover:text-white text-sm cursor-pointer bg-transparent border-none">✕</button>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: 'Mastery', v: `${(node.mastery * 100).toFixed(0)}%`, c: 'var(--color-ember)' },
            { l: 'Required', v: `${(node.required * 100).toFixed(0)}%`, c: 'var(--color-neon)' },
            { l: 'Gap', v: `${(node.gap * 100).toFixed(0)}%`, c: pC[node.priority] },
            { l: 'Hours', v: `${node.hours_to_close}h`, c: '#f9fafb' },
          ].map(s => (
            <div key={s.l} className="card !p-2 text-center">
              <p className="text-[8px] text-[var(--color-text-faint)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>{s.l}</p>
              <p className="text-base" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: s.c }}>{s.v}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[8px] text-[var(--color-text-faint)] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Priority</p>
          <span className={`badge badge-${node.priority} text-xs`}>{node.priority.toUpperCase()}</span>
        </div>

        {/* Reasoning */}
        <div>
          <p className="text-[8px] text-[var(--color-text-faint)] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Reasoning</p>
          <div className="card !p-3 text-[10px] text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
            {node.reasoning}
          </div>
        </div>

        {/* Courses */}
        <div>
          <p className="text-[8px] text-[var(--color-text-faint)] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-mono)' }}>📚 Recommended Courses</p>
          <div className="flex flex-col gap-2">
            {courses.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="card !p-3 no-underline group hover:border-[var(--color-neon)] transition-colors">
                <p className="text-xs text-white mb-0.5" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{c.title}</p>
                <div className="flex items-center gap-2 text-[9px]" style={{ fontFamily: 'var(--font-mono)' }}>
                  <span className="text-[var(--color-neon)]">{c.provider}</span>
                  <span className="text-[var(--color-text-faint)]">·</span>
                  <span className="text-[var(--color-text-faint)]">{c.level}</span>
                  <span className="text-[var(--color-text-faint)]">·</span>
                  <span className="text-[var(--color-text-faint)]">{c.hours}h</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── LEARNING PATH PAGE ────────────────────────────────────── */
export default function LearningPath() {
  const navigate = useNavigate();
  const { skills, jdRequirements, bktUpdates, dagNodes, dagEdges, setLearningPath, setLoading, isLoading } = useSkillPrintStore();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [hideMastered, setHideMastered] = useState(false);
  const [init, setInit] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  /* dagNodes are pre-loaded from store — no API call needed */

  // Roadmap data
  const roadmapItems = useMemo(() => {
    return dagNodes
      .filter(n => n.gap > 0.05)
      .sort((a, b) => {
        const pri = { critical: 0, high: 1, medium: 2, low: 3 };
        return (pri[a.priority] || 3) - (pri[b.priority] || 3);
      })
      .map(n => ({
        ...n,
        courses: getCoursesForSkill(n.label),
        totalHours: n.hours_to_close,
      }));
  }, [dagNodes]);

  useEffect(() => {
    if (!dagNodes.length || !svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    let nodes = [...dagNodes];
    if (criticalOnly) nodes = nodes.filter(n => n.priority === 'critical' || n.priority === 'high');
    if (hideMastered) nodes = nodes.filter(n => n.gap > 0.05);
    const ids = new Set(nodes.map(n => n.id));
    const edges = dagEdges.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({ ...e }));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const f = defs.append('filter').attr('id', 'glow');
    f.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'b');
    const m = f.append('feMerge');
    m.append('feMergeNode').attr('in', 'b');
    m.append('feMergeNode').attr('in', 'SourceGraphic');

    defs.append('marker').attr('id', 'arr').attr('viewBox', '0 -5 10 10').attr('refX', 18).attr('refY', 0)
      .attr('markerWidth', 4).attr('markerHeight', 4).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L10,0L0,4').attr('fill', 'rgba(255,255,255,0.1)');

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e) => g.attr('transform', e.transform)));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    g.append('g').selectAll('line').data(edges).join('line')
      .attr('stroke', 'rgba(255,255,255,0.05)').attr('stroke-width', 1).attr('marker-end', 'url(#arr)')
      .each(function(d) { d._el = this; });

    const cMap = { critical: '#ef4444', high: '#f59e0b', medium: '#00f5d4', low: '#22c55e' };

    const node = g.append('g').selectAll('g').data(nodes).join('g')
      .style('cursor', 'pointer').on('click', (_, d) => setSelectedNode(d))
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append('circle').attr('r', d => 8 + d.gap * 28)
      .attr('fill', d => `${cMap[d.priority]}12`).attr('stroke', d => cMap[d.priority]).attr('stroke-width', 1.5).attr('filter', 'url(#glow)');

    node.append('text').text(d => d.label).attr('text-anchor', 'middle').attr('dy', d => -(11 + d.gap * 28))
      .attr('fill', '#d1d5db').attr('font-size', '9px').attr('font-family', "'DM Sans'").attr('font-weight', 400);

    node.append('text').text(d => `${(d.gap * 100).toFixed(0)}%`).attr('text-anchor', 'middle').attr('dy', '3px')
      .attr('fill', '#fff').attr('font-size', '7px').attr('font-family', "'JetBrains Mono'").attr('font-weight', 500);

    const link = g.selectAll('line');
    sim.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [dagNodes, dagEdges, criticalOnly, hideMastered]);

  return (
    <div className="min-h-screen bg-[var(--color-abyss)] flex flex-col" style={{ paddingTop: '56px' }}>
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-[var(--color-abyss-border)] bg-[var(--color-abyss-raised)] flex items-center justify-between z-20 flex-wrap gap-2">
        <div>
          <h2 className="text-sm text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>
            Learning Path <span className="gradient-text">DAG</span>
          </h2>
          <p className="text-[9px] text-[var(--color-text-faint)]" style={{ fontFamily: 'var(--font-mono)' }}>{dagNodes.length} nodes · {dagEdges.length} edges</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] cursor-pointer">
            <input type="checkbox" checked={criticalOnly} onChange={e => setCriticalOnly(e.target.checked)} className="accent-[var(--color-danger)]" />Critical
          </label>
          <label className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] cursor-pointer">
            <input type="checkbox" checked={hideMastered} onChange={e => setHideMastered(e.target.checked)} className="accent-[var(--color-success)]" />Hide Met
          </label>
          <button onClick={() => setShowRoadmap(!showRoadmap)} className={`btn-ghost !py-1.5 !px-3 !text-[10px] ${showRoadmap ? '!border-[var(--color-neon)] !text-white' : ''}`}>
            📋 Roadmap
          </button>
          <button onClick={() => navigate('/sandbox')} className="btn-primary !py-1.5 !px-3 !text-[10px]">Sandbox →</button>
        </div>
      </div>

      {showRoadmap ? (
        /* ─── Roadmap View ─── */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container-main">
            <div className="mb-4">
              <h2 className="text-lg text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                📋 Learning <span className="gradient-text">Roadmap</span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {roadmapItems.length} skills to improve · ~{roadmapItems.reduce((s, n) => s + n.totalHours, 0)} total hours
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {roadmapItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg opacity-20" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: { critical: 'var(--color-danger)', high: 'var(--color-ember)', medium: 'var(--color-neon)', low: 'var(--color-success)' }[item.priority] }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="text-sm text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{item.label}</h3>
                        <p className="text-[10px] text-[var(--color-text-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
                          Gap: {(item.gap * 100).toFixed(0)}% · ~{item.totalHours}h to close
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-${item.priority} text-[10px]`}>{item.priority}</span>
                  </div>

                  {/* Progress */}
                  <div className="relative h-1 bg-[var(--color-abyss)] rounded-full overflow-hidden mb-3">
                    <div className="absolute top-0 left-0 h-full rounded-full bg-[var(--color-abyss-border)]" style={{ width: `${item.required * 100}%` }} />
                    <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${item.mastery * 100}%`, background: { critical: 'var(--color-danger)', high: 'var(--color-ember)', medium: 'var(--color-neon)', low: 'var(--color-success)' }[item.priority] }} />
                  </div>

                  {/* Courses */}
                  <div className="grid md:grid-cols-2 gap-2">
                    {item.courses.map((c, ci) => (
                      <a key={ci} href={c.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-abyss)] border border-[var(--color-abyss-border)] no-underline hover:border-[var(--color-neon)] transition-colors">
                        <span className="text-sm">📚</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>{c.title}</p>
                          <p className="text-[9px] text-[var(--color-text-faint)]" style={{ fontFamily: 'var(--font-mono)' }}>{c.provider} · {c.hours}h · {c.level}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ─── Graph View ─── */
        <div ref={containerRef} className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center"><div className="spinner mx-auto mb-2" /><p className="text-[10px] text-[var(--color-text-faint)]">Generating graph…</p></div>
            </div>
          ) : <svg ref={svgRef} width="100%" height="100%" />}

          <div className="absolute bottom-3 left-3 card !p-2 text-[9px]" style={{ fontFamily: 'var(--font-mono)' }}>
            <div className="flex items-center gap-2">
              {[{ c: 'var(--color-success)', l: 'Met' }, { c: 'var(--color-neon)', l: 'Gap' }, { c: 'var(--color-ember)', l: 'High' }, { c: 'var(--color-danger)', l: 'Critical' }].map(x => (
                <span key={x.l} className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: x.c }} />{x.l}</span>
              ))}
            </div>
            <p className="text-[var(--color-text-faint)] mt-0.5">Click node · Drag to move · Scroll to zoom</p>
          </div>
        </div>
      )}

      <AnimatePresence>{selectedNode && <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />}</AnimatePresence>
    </div>
  );
}
