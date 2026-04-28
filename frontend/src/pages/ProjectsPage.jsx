// ─── Projects list — Google Docs-style overview ──────────────────────────
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { C, EASE, GRAIN_URL, Mono, Btn, PageHeader, IconPlus, IconSearch, IconArrow, IconDot } from '../shared.jsx';

const PROJECTS_SEED = [
  {
    id: 1, name: 'Ørestad 4B', project_number: 'OR-4B',
    building_type: 'etageboliger', building_class: 'klasse 2',
    city: 'Copenhagen', jurisdiction: 'DK · BR25',
    architect_name: 'Mette Friis',
    assessment_count: 14, pending: 3, status: 'active',
    updated: '2 hours ago', updatedTs: Date.now() - 2*3600*1000,
    thumb: 'residential',
    cover: 'linear-gradient(135deg, #c6b8a3, #8b7a65)',
  },
  {
    id: 2, name: 'Vesterbro Skolen', project_number: 'VS-22',
    building_type: 'utdaningsfunctie', building_class: 'klasse 3',
    city: 'Copenhagen', jurisdiction: 'DK · BR25',
    architect_name: 'Sofie Brandt',
    assessment_count: 38, pending: 1, status: 'active',
    updated: 'yesterday', updatedTs: Date.now() - 86400000,
    thumb: 'school',
    cover: 'linear-gradient(135deg, #a8b8a0, #5a6b56)',
  },
  {
    id: 3, name: 'Herengracht 124', project_number: 'HG-124',
    building_type: 'woonfunctie', building_class: 'klasse 2',
    city: 'Amsterdam', jurisdiction: 'NL · Bbl',
    architect_name: 'Mette Friis',
    assessment_count: 7, pending: 0, status: 'active',
    updated: '3 days ago', updatedTs: Date.now() - 3*86400000,
    thumb: 'heritage',
    cover: 'linear-gradient(135deg, #d4c5a8, #9a8565)',
  },
  {
    id: 4, name: 'Nordhavn Biblioteket', project_number: 'NH-Lib',
    building_type: 'bijeenkomstfunctie', building_class: 'klasse 2',
    city: 'Copenhagen', jurisdiction: 'DK · BR25',
    architect_name: 'Jonas Vestergaard',
    assessment_count: 22, pending: 0, status: 'archived',
    updated: '2 weeks ago', updatedTs: Date.now() - 14*86400000,
    thumb: 'library',
    cover: 'linear-gradient(135deg, #b5a898, #6f6355)',
  },
  {
    id: 5, name: 'Prinsengracht Studio', project_number: 'PG-09',
    building_type: 'kantoorfunctie', building_class: 'klasse 2',
    city: 'Amsterdam', jurisdiction: 'NL · Bbl',
    architect_name: 'Mette Friis',
    assessment_count: 3, pending: 2, status: 'active',
    updated: '5 days ago', updatedTs: Date.now() - 5*86400000,
    thumb: 'office',
    cover: 'linear-gradient(135deg, #c0b4a0, #7d6f5c)',
  },
  {
    id: 6, name: 'Strandgade Residence', project_number: 'SG-11',
    building_type: 'woonfunctie', building_class: 'klasse 2',
    city: 'Copenhagen', jurisdiction: 'DK · BR25',
    architect_name: 'Sofie Brandt',
    assessment_count: 11, pending: 0, status: 'active',
    updated: '1 week ago', updatedTs: Date.now() - 7*86400000,
    thumb: 'residential',
    cover: 'linear-gradient(135deg, #cab9a2, #857157)',
  },
];

function ProjectsPage({ onOpenProject, onNewSubstitution, projects }) {
  const [view, setView] = useState('grid'); // grid | list
  const [filter, setFilter] = useState('all'); // all | active | archived | mine
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // updated | name | pending

  const filtered = useMemo(() => {
    let rows = projects;
    if (filter === 'active') rows = rows.filter(p => p.status === 'active');
    if (filter === 'archived') rows = rows.filter(p => p.status === 'archived');
    if (filter === 'mine') rows = rows.filter(p => p.architect_name === 'Mette Friis');
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.project_number.toLowerCase().includes(s) ||
        p.city.toLowerCase().includes(s)
      );
    }
    rows = [...rows].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'pending') return b.pending - a.pending;
      return b.updatedTs - a.updatedTs;
    });
    return rows;
  }, [projects, filter, search, sortBy]);

  const totalPending = projects.reduce((a, p) => a + p.pending, 0);

  return (
    <div
      data-screen-label="02 Projects"
    >
      <PageHeader
        title="Projects"
        desc="Every substitution assessment is scoped to a project. Create one per building, or link to an existing BIM workspace."
        right={
          <>
            <Btn variant="ghost" icon={<IconSearch size={13} color={C.text} />} onClick={() => {}}>Search</Btn>
            <Btn variant="primary" icon={<IconPlus size={13} color={C.bg} />} onClick={onNewSubstitution}>New substitution</Btn>
          </>
        }
      />

      {/* Stat strip — clean, no dividers, editorial spacing */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '36px 40px 40px',
        gap: 56,
      }}>
        {[
          ['Active projects', projects.filter(p => p.status === 'active').length, null],
          ['Assessments this month', projects.reduce((a,p)=>a+p.assessment_count,0), '+ 14 vs last'],
          ['Pending review', totalPending, totalPending > 0 ? 'requires action' : 'clear'],
          ['Avg resolution', '2.4 h', '− 38% vs. Q1'],
        ].map(([label, value, hint], i) => (
          <div key={label} style={{
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 44, fontWeight: 300, letterSpacing: '-0.035em',
              color: C.text, lineHeight: 1,
            }}>{value}</div>
            <div style={{
              fontSize: 12, color: C.dim, letterSpacing: '-0.01em',
              marginTop: 12,
            }}>{label}</div>
            {hint && <div style={{ fontSize: 11, color: hint.includes('action') ? C.warn : C.muted, fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: '0.03em' }}>{hint}</div>}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 40px 22px',
        gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[
            ['all', 'All', projects.length],
            ['active', 'Active', projects.filter(p => p.status === 'active').length],
            ['mine', 'Mine', projects.filter(p => p.architect_name === 'Mette Friis').length],
            ['archived', 'Archived', projects.filter(p => p.status === 'archived').length],
          ].map(([k, label, count]) => {
            const active = filter === k;
            return (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: '6px 12px', border: 'none', cursor: 'pointer',
                background: active ? C.text : 'transparent',
                color: active ? C.bg : C.dim,
                fontFamily: 'var(--font-sans)', fontSize: 12,
                letterSpacing: '-0.01em', borderRadius: 9999,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}>
                {label}
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: active ? 'rgba(246,244,238,0.6)' : C.muted,
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            border: `1px solid ${C.border}`,
            borderRadius: 9999,
            background: C.surface,
            width: 240,
          }}>
            <IconSearch size={12} color={C.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Find project…"
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12, fontFamily: 'inherit', color: C.text,
              }} />
          </div>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: '7px 12px', border: `1px solid ${C.border}`, borderRadius: 9999,
            background: C.surface, color: C.dim, fontSize: 12, fontFamily: 'inherit',
            letterSpacing: '-0.01em', cursor: 'pointer',
          }}>
            <option value="updated">Recently updated</option>
            <option value="name">Name</option>
            <option value="pending">Pending first</option>
          </select>

          {/* View toggle */}
          <div style={{
            display: 'flex', border: `1px solid ${C.border}`,
            borderRadius: 9999, overflow: 'hidden',
          }}>
            {[
              ['grid', (<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5"/><rect x="7" y="0" width="5" height="5"/><rect x="0" y="7" width="5" height="5"/><rect x="7" y="7" width="5" height="5"/></svg>)],
              ['list', (<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="1" width="12" height="1.6"/><rect x="0" y="5.2" width="12" height="1.6"/><rect x="0" y="9.4" width="12" height="1.6"/></svg>)],
            ].map(([k, icon]) => (
              <button key={k} onClick={() => setView(k)} style={{
                padding: '7px 12px', border: 'none', cursor: 'pointer',
                background: view === k ? C.text : 'transparent',
                color: view === k ? C.bg : C.dim,
                display: 'flex', alignItems: 'center',
              }}>{icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'grid' ? (
        <ProjectGrid projects={filtered} onOpen={onOpenProject} onNew={onNewSubstitution} />
      ) : (
        <ProjectList projects={filtered} onOpen={onOpenProject} />
      )}
    </div>
  );
}

// ── Grid view (Google Docs-style cards) ──────────────────────────────────
function ProjectGrid({ projects, onOpen, onNew }) {
  return (
    <div style={{ padding: '32px 40px' }}>
      <Mono style={{ display: 'block', marginBottom: 18 }}>Recent · {projects.length}</Mono>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 20,
      }}>
        {/* New substitution card */}
        <button
          onClick={onNew}
          style={{
            background: 'transparent',
            border: `1px dashed ${C.borderStrong}`,
            padding: 0, textAlign: 'left',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column',
            minHeight: 280,
          }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: C.text, color: C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconPlus size={18} color={C.bg} /></div>
          </div>
          <div style={{ padding: '16px 18px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 14, color: C.text, letterSpacing: '-0.01em' }}>New substitution</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>upload email, PDF or BIM</div>
          </div>
        </button>

        {projects.map((p, i) => (
          <ProjectCard key={p.id} p={p} onOpen={() => onOpen(p)} delay={i * 0.03} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ p, onOpen, delay = 0 }) {
  return (
    <button
      onClick={onOpen}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: 0, textAlign: 'left',
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', flexDirection: 'column',
        minHeight: 280,
        transition: 'border-color 0.18s, box-shadow 0.18s',
      }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 20px 40px rgba(20,20,20,0.06)'; e.currentTarget.style.borderColor = C.borderStrong; }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; }}
    >
      {/* Thumb — abstract architectural rendering */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: p.cover,
        minHeight: 140,
      }}>
        <ProjectThumbPattern kind={p.thumb} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, backgroundImage: GRAIN_URL,
          backgroundSize: 180, opacity: 0.35, mixBlendMode: 'multiply',
        }} />
        {p.pending > 0 && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            padding: '4px 10px',
            background: 'rgba(246,244,238,0.94)',
            border: `1px solid ${C.border}`,
            fontSize: 10, color: C.warn, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <IconDot size={6} color={C.warn} />
            {p.pending} pending
          </div>
        )}
        {p.status === 'archived' && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            padding: '4px 10px',
            background: 'rgba(20,20,20,0.7)', color: '#FFF',
            fontSize: 10, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>archived</div>
        )}
      </div>

      <div style={{ padding: '16px 18px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 14, color: C.text, letterSpacing: '-0.01em', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: C.muted, letterSpacing: '0.04em' }}>{p.project_number}</span>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.city} · {p.building_type} · {p.jurisdiction}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: 11, color: C.dim }}>
            <span style={{ color: C.text, fontFamily: 'var(--font-mono)' }}>{p.assessment_count}</span> assessments
          </span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{p.updated}</span>
        </div>
      </div>
    </button>
  );
}

// ── Abstract thumb patterns (no real imagery) ────────────────────────────
function ProjectThumbPattern({ kind }) {
  const stroke = 'rgba(255,255,255,0.18)';
  const fill = 'rgba(255,255,255,0.08)';
  if (kind === 'residential') {
    return (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 200" style={{ position: 'absolute', inset: 0 }}>
        {[...Array(8)].map((_, r) => [...Array(16)].map((_, c) => (
          <rect key={`${r}${c}`} x={10 + c * 24} y={20 + r * 22} width="14" height="14"
            fill={fill} stroke={stroke} strokeWidth="0.6" />
        )))}
      </svg>
    );
  }
  if (kind === 'school') {
    return (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 200" style={{ position: 'absolute', inset: 0 }}>
        {[...Array(5)].map((_, r) => [...Array(8)].map((_, c) => (
          <rect key={`${r}${c}`} x={15 + c * 48} y={30 + r * 32} width="36" height="22"
            fill={fill} stroke={stroke} strokeWidth="0.8" />
        )))}
      </svg>
    );
  }
  if (kind === 'heritage') {
    return (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 200" style={{ position: 'absolute', inset: 0 }}>
        {[...Array(4)].map((_, r) => [...Array(10)].map((_, c) => (
          <g key={`${r}${c}`}>
            <rect x={20 + c * 38} y={20 + r * 42} width="24" height="30" fill={fill} stroke={stroke} strokeWidth="0.8" />
            <path d={`M ${20 + c * 38} ${20 + r * 42} Q ${32 + c * 38} ${14 + r * 42} ${44 + c * 38} ${20 + r * 42}`} fill="none" stroke={stroke} strokeWidth="0.8" />
          </g>
        )))}
      </svg>
    );
  }
  if (kind === 'library') {
    return (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 200" style={{ position: 'absolute', inset: 0 }}>
        {[...Array(12)].map((_, c) => (
          <rect key={c} x={10 + c * 32} y="20" width="20" height="160" fill={fill} stroke={stroke} strokeWidth="0.8" />
        ))}
      </svg>
    );
  }
  if (kind === 'office') {
    return (
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 200" style={{ position: 'absolute', inset: 0 }}>
        {[...Array(10)].map((_, r) => [...Array(20)].map((_, c) => (
          <rect key={`${r}${c}`} x={5 + c * 20} y={10 + r * 18} width="14" height="12"
            fill={r % 2 === c % 3 ? 'rgba(255,255,255,0.16)' : fill} stroke={stroke} strokeWidth="0.4" />
        )))}
      </svg>
    );
  }
  return null;
}

// ── List view ────────────────────────────────────────────────────────────
function ProjectList({ projects, onOpen }) {
  return (
    <div style={{ padding: '8px 40px 40px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 140px 80px',
        padding: '16px 0', borderBottom: `1px solid ${C.border}`,
        fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        <span>Project</span>
        <span>Location</span>
        <span>Building class</span>
        <span>Architect</span>
        <span style={{ textAlign: 'right' }}>Assessments</span>
        <span style={{ textAlign: 'right' }}>Updated</span>
      </div>
      {projects.map((p, i) => (
        <button key={p.id}
          onClick={() => onOpen(p)}
          style={{
            width: '100%', textAlign: 'left', background: 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 140px 80px',
            padding: '18px 0', borderBottom: `1px solid ${C.border}`,
            alignItems: 'center', gap: 16,
            transition: 'background 0.12s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(20,20,20,0.02)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 28, background: p.cover, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C.text, letterSpacing: '-0.01em' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{p.project_number} · {p.building_type}</div>
            </div>
          </div>
          <span style={{ fontSize: 12, color: C.dim }}>{p.city} · {p.jurisdiction}</span>
          <span style={{ fontSize: 12, color: C.dim, fontFamily: 'var(--font-mono)' }}>{p.building_class}</span>
          <span style={{ fontSize: 12, color: C.dim }}>{p.architect_name}</span>
          <span style={{ textAlign: 'right', fontSize: 12, color: C.text, fontFamily: 'var(--font-mono)' }}>
            {p.assessment_count}
            {p.pending > 0 && <span style={{ color: C.warn, marginLeft: 8 }}>· {p.pending} ⏵</span>}
          </span>
          <span style={{ textAlign: 'right', fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)' }}>{p.updated}</span>
        </button>
      ))}
    </div>
  );
}

export { PROJECTS_SEED, ProjectsPage, ProjectCard };
export default ProjectsPage;
