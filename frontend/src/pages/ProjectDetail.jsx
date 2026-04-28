// ─── Project detail — list of substitutions inside one project ──────────
import React, { useState, useMemo } from 'react';
import { C, GRAIN_URL, Mono, Btn, IconPlus, IconArrow, IconSearch, IconCheck } from '../shared.jsx';

// Seed data — substitutions per project. Real app would come from API.
const SUBSTITUTIONS_BY_PROJECT = {
  1: [ // Ørestad 4B
    { id: 'or4b-001', title: 'Mineral wool → wood fibre', element: 'External wall insulation', materialA: 'Rockwool 200mm', materialB: 'Steico Protect', status: 'complete', verdict: 'conditionally-viable', confidence: 'moderate', updated: '2 hours ago', updatedTs: Date.now() - 2*3600*1000, author: 'Mette Friis', dimensions: { improves: 2, maintains: 2, degrades: 0, unclear: 1, lowConfidence: 1 } },
    { id: 'or4b-002', title: 'Aluminium cladding → thermo-modified pine', element: 'Facade cladding', materialA: 'Reynobond PE', materialB: 'Kebony Clear', status: 'complete', verdict: 'viable', confidence: 'high', updated: '5 hours ago', updatedTs: Date.now() - 5*3600*1000, author: 'Mette Friis', dimensions: { improves: 4, maintains: 1, degrades: 0, unclear: 0, lowConfidence: 0 } },
    { id: 'or4b-003', title: 'Concrete slab → CLT floor', element: 'Intermediate floor', materialA: 'C30/37 reinforced', materialB: 'CLT 240mm + screed', status: 'running', verdict: null, confidence: null, updated: '12 min ago', updatedTs: Date.now() - 12*60*1000, author: 'Mette Friis', dimensions: null },
    { id: 'or4b-004', title: 'PVC window frames → aluclad timber', element: 'Window frames', materialA: 'Veka softline', materialB: 'NorDan NTech', status: 'draft', verdict: null, confidence: null, updated: 'yesterday', updatedTs: Date.now() - 86400000, author: 'Sofie Brandt', dimensions: null },
    { id: 'or4b-005', title: 'Bituminous roof → green roof + EPDM', element: 'Flat roof build-up', materialA: 'Icopal Top 5000', materialB: 'Sempergreen Sedum + Carlisle EPDM', status: 'complete', verdict: 'conditionally-viable', confidence: 'moderate', updated: '3 days ago', updatedTs: Date.now() - 3*86400000, author: 'Mette Friis', dimensions: { improves: 3, maintains: 1, degrades: 1, unclear: 0, lowConfidence: 1 } },
    { id: 'or4b-006', title: 'Gypsum board → clay panel', element: 'Internal partition lining', materialA: 'Gyproc 12.5mm', materialB: 'Lehmorange clay 22mm', status: 'complete', verdict: 'not-viable', confidence: 'high', updated: '4 days ago', updatedTs: Date.now() - 4*86400000, author: 'Jonas Vestergaard', dimensions: { improves: 1, maintains: 0, degrades: 2, unclear: 0, lowConfidence: 0 } },
    { id: 'or4b-007', title: 'Standard concrete → low-clinker mix', element: 'Foundation wall', materialA: 'CEM I C30/37', materialB: 'Aalborg FUTURECEM C30/37', status: 'complete', verdict: 'viable', confidence: 'high', updated: '1 week ago', updatedTs: Date.now() - 7*86400000, author: 'Mette Friis', dimensions: { improves: 3, maintains: 3, degrades: 0, unclear: 0, lowConfidence: 0 } },
  ],
  2: [
    { id: 'vs22-001', title: 'PVC flooring → linoleum', element: 'Classroom floor finish', materialA: 'Tarkett iQ Granit', materialB: 'Forbo Marmoleum', status: 'complete', verdict: 'viable', confidence: 'high', updated: 'yesterday', updatedTs: Date.now() - 86400000, author: 'Sofie Brandt', dimensions: { improves: 4, maintains: 1, degrades: 0, unclear: 0, lowConfidence: 0 } },
    { id: 'vs22-002', title: 'MDF acoustic panel → wood wool', element: 'Ceiling acoustic treatment', materialA: 'Knauf Heradesign', materialB: 'Troldtekt Natural', status: 'complete', verdict: 'viable', confidence: 'high', updated: '2 days ago', updatedTs: Date.now() - 2*86400000, author: 'Sofie Brandt', dimensions: { improves: 3, maintains: 2, degrades: 0, unclear: 0, lowConfidence: 0 } },
    { id: 'vs22-003', title: 'EPS insulation → mineral wool', element: 'Roof insulation', materialA: 'Sundolitt EPS', materialB: 'Rockwool Toprock', status: 'running', verdict: null, confidence: null, updated: '40 min ago', updatedTs: Date.now() - 40*60*1000, author: 'Sofie Brandt', dimensions: null },
  ],
  3: [
    { id: 'hg124-001', title: 'New double glazing → restored sash + secondary', element: 'Heritage windows', materialA: 'Saint-Gobain SGG Climaplus', materialB: 'Restored sash + Slimline secondary', status: 'complete', verdict: 'conditionally-viable', confidence: 'moderate', updated: '3 days ago', updatedTs: Date.now() - 3*86400000, author: 'Mette Friis', dimensions: { improves: 2, maintains: 2, degrades: 1, unclear: 0, lowConfidence: 1 } },
    { id: 'hg124-002', title: 'Synthetic plaster → traditional lime', element: 'Internal wall finish', materialA: 'Knauf MP75', materialB: 'St. Astier NHL 3.5', status: 'complete', verdict: 'viable', confidence: 'moderate', updated: '5 days ago', updatedTs: Date.now() - 5*86400000, author: 'Mette Friis', dimensions: { improves: 3, maintains: 2, degrades: 0, unclear: 0, lowConfidence: 0 } },
  ],
  4: [
    { id: 'nhlib-001', title: 'Steel mullions → laminated timber', element: 'Glazing system', materialA: 'Schüco FW50+', materialB: 'Glulam GL28h', status: 'complete', verdict: 'viable', confidence: 'high', updated: '2 weeks ago', updatedTs: Date.now() - 14*86400000, author: 'Jonas Vestergaard', dimensions: { improves: 4, maintains: 1, degrades: 0, unclear: 0, lowConfidence: 0 } },
  ],
  5: [
    { id: 'pg09-001', title: 'Vinyl wallcovering → mineral paint', element: 'Internal wall finish', materialA: 'Vescom Ultra', materialB: 'Keim Optil', status: 'running', verdict: null, confidence: null, updated: '8 min ago', updatedTs: Date.now() - 8*60*1000, author: 'Mette Friis', dimensions: null },
    { id: 'pg09-002', title: 'Suspended ceiling tile → timber slats', element: 'Office ceiling', materialA: 'Armstrong Ultima+', materialB: 'Hunter Douglas Linear Wood', status: 'draft', verdict: null, confidence: null, updated: 'yesterday', updatedTs: Date.now() - 86400000, author: 'Mette Friis', dimensions: null },
    { id: 'pg09-003', title: 'Glass partition → demountable timber', element: 'Internal partition', materialA: 'Optima 117', materialB: 'Maars HiQ Modular', status: 'complete', verdict: 'viable', confidence: 'moderate', updated: '4 days ago', updatedTs: Date.now() - 4*86400000, author: 'Mette Friis', dimensions: { improves: 3, maintains: 2, degrades: 0, unclear: 0, lowConfidence: 0 } },
  ],
  6: [
    { id: 'sg11-001', title: 'Brick veneer → reclaimed brick', element: 'External cladding', materialA: 'Petersen Tegl D32', materialB: 'Gamle Mursten reclaimed', status: 'complete', verdict: 'viable', confidence: 'high', updated: '1 week ago', updatedTs: Date.now() - 7*86400000, author: 'Sofie Brandt', dimensions: { improves: 5, maintains: 0, degrades: 0, unclear: 0, lowConfidence: 0 } },
  ],
};

const VERDICT_META = {
  'viable':                 { label: 'Viable',                 fg: '#1a6b4b', bg: 'rgba(26,107,75,0.10)' },
  'conditionally-viable':   { label: 'Conditional',            fg: '#a86a1c', bg: 'rgba(168,106,28,0.10)' },
  'not-viable':             { label: 'Not viable',             fg: '#9c2a23', bg: 'rgba(156,42,35,0.10)' },
};

const STATUS_META = {
  draft:    { label: 'Draft',    dot: '#a8a193' },
  running:  { label: 'Running',  dot: '#1a6b4b', pulse: true },
  complete: { label: 'Complete', dot: '#141414' },
};

// ProjectThumbPattern is duplicated here since ProjectDetail uses it independently
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

function ProjectDetail({ project, onBack, onOpenSubstitution, onNewSubstitution }) {
  const [filter, setFilter] = useState('all'); // all | running | complete | draft
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated');

  const allSubs = SUBSTITUTIONS_BY_PROJECT[project.id] || [];

  const counts = useMemo(() => ({
    all:      allSubs.length,
    running:  allSubs.filter(s => s.status === 'running').length,
    complete: allSubs.filter(s => s.status === 'complete').length,
    draft:    allSubs.filter(s => s.status === 'draft').length,
  }), [allSubs]);

  const filtered = useMemo(() => {
    let rows = allSubs;
    if (filter !== 'all') rows = rows.filter(s => s.status === filter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.element.toLowerCase().includes(q) ||
        (s.materialA || '').toLowerCase().includes(q) ||
        (s.materialB || '').toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return b.updatedTs - a.updatedTs;
    });
    return rows;
  }, [allSubs, filter, search, sortBy]);

  // Aggregate stats — only over completed assessments
  const completed = allSubs.filter(s => s.status === 'complete');
  const verdictStats = {
    viable:      completed.filter(s => s.verdict === 'viable').length,
    conditional: completed.filter(s => s.verdict === 'conditionally-viable').length,
    notViable:   completed.filter(s => s.verdict === 'not-viable').length,
  };
  const totalImproves = completed.reduce((a, s) => a + (s.dimensions?.improves || 0), 0);
  const totalLowConf  = completed.reduce((a, s) => a + (s.dimensions?.lowConfidence || 0), 0);

  return (
    <div data-screen-label="03 Project detail">
      {/* Header — back link, title, project meta, primary CTA */}
      <div style={{ padding: '32px 40px 0' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 20,
        }}>
          <IconArrow size={10} color={C.dim} dir="left" /> All projects
        </button>

        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr auto',
          gap: 32, alignItems: 'flex-start',
        }}>
          {/* Project thumb — small */}
          <div style={{
            height: 124, background: project.cover, position: 'relative', overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}>
            <ProjectThumbPattern kind={project.thumb} />
            <div aria-hidden style={{
              position: 'absolute', inset: 0, backgroundImage: GRAIN_URL,
              backgroundSize: 180, opacity: 0.35, mixBlendMode: 'multiply',
            }} />
          </div>

          {/* Title + meta */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
              <Mono style={{ color: C.muted }}>{project.project_number}</Mono>
              {project.status === 'archived' && (
                <span style={{
                  padding: '2px 10px', background: 'rgba(20,20,20,0.7)', color: C.bg,
                  fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>archived</span>
              )}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 300,
              letterSpacing: '-0.035em', lineHeight: 1, color: C.text,
              margin: '0 0 16px',
            }}>{project.name}</h1>
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: C.dim, fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
              <span><span style={{ color: C.muted }}>City</span> · {project.city}</span>
              <span><span style={{ color: C.muted }}>Jurisdiction</span> · {project.jurisdiction}</span>
              <span><span style={{ color: C.muted }}>Class</span> · {project.building_class}</span>
              <span><span style={{ color: C.muted }}>Architect</span> · {project.architect_name}</span>
            </div>
          </div>

          <Btn variant="primary" icon={<IconPlus size={13} color={C.bg} />} onClick={() => onNewSubstitution(project)}>
            New substitution
          </Btn>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '40px 40px 32px',
        gap: 40,
      }}>
        {[
          ['Substitutions',     allSubs.length,       null],
          ['Completed',         completed.length,     `${verdictStats.viable} viable · ${verdictStats.conditional} conditional · ${verdictStats.notViable} not viable`],
          ['Currently running', counts.running,       counts.running > 0 ? 'engine working' : 'idle'],
          ['Improvements',      totalImproves,        'dimension verdicts: improves'],
          ['Low confidence',    totalLowConf,         totalLowConf > 0 ? 'flagged claims' : 'none flagged'],
        ].map(([label, value, hint], i) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36, fontWeight: 300, letterSpacing: '-0.035em',
              color: C.text, lineHeight: 1,
            }}>{value}</div>
            <div style={{ fontSize: 12, color: C.dim, letterSpacing: '-0.01em', marginTop: 12 }}>{label}</div>
            {hint && <div style={{
              fontSize: 10, color: hint.includes('working') || hint.includes('flagged') ? C.warn : C.muted,
              fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: '0.03em',
            }}>{hint}</div>}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 40px 22px', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[
            ['all',      'All',      counts.all],
            ['running',  'Running',  counts.running],
            ['complete', 'Complete', counts.complete],
            ['draft',    'Draft',    counts.draft],
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
            padding: '6px 12px', border: `1px solid ${C.border}`,
            borderRadius: 9999, background: C.surface, width: 240,
          }}>
            <IconSearch size={12} color={C.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Find substitution…"
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
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Substitutions list */}
      <div style={{ padding: '0 40px 60px' }}>
        {filtered.length === 0 ? (
          <EmptyState onNew={() => onNewSubstitution(project)} />
        ) : (
          <div>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 140px 130px 120px 110px',
              padding: '14px 20px', borderBottom: `1px solid ${C.border}`,
              fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em', textTransform: 'uppercase', gap: 16,
            }}>
              <span>Substitution</span>
              <span>Element & materials</span>
              <span>Status</span>
              <span>Verdict</span>
              <span>Updated</span>
              <span style={{ textAlign: 'right' }}>Author</span>
            </div>

            {filtered.map((s, i) => (
              <SubstitutionRow key={s.id} s={s}
                onClick={() => onOpenSubstitution(project, s)}
                delay={i * 0.02}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Substitution row ─────────────────────────────────────────────────────
function SubstitutionRow({ s, onClick, delay = 0 }) {
  const status = STATUS_META[s.status];
  const verdict = s.verdict ? VERDICT_META[s.verdict] : null;
  return (
    <button
      style={{
        width: '100%', textAlign: 'left', background: 'transparent',
        border: 'none', borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 140px 130px 120px 110px',
        padding: '20px', alignItems: 'center', gap: 16,
        transition: 'background 0.12s',
      }}
      onClick={onClick}
      onMouseOver={e => e.currentTarget.style.background = 'rgba(20,20,20,0.025)'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Title */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, color: C.text, letterSpacing: '-0.01em', marginBottom: 4, fontWeight: 500 }}>{s.title}</div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{s.id}</div>
      </div>

      {/* Element & materials */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.dim, letterSpacing: '-0.01em', marginBottom: 4 }}>{s.element}</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.materialA} → {s.materialB}
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: status.dot,
          boxShadow: status.pulse ? `0 0 0 3px ${status.dot}33` : 'none',
          animation: status.pulse ? 'fadeIn 1.4s ease-in-out infinite alternate' : 'none',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, color: C.text, letterSpacing: '-0.01em' }}>{status.label}</span>
      </div>

      {/* Verdict */}
      <div>
        {verdict ? (
          <span style={{
            display: 'inline-block', padding: '4px 10px',
            background: verdict.bg, color: verdict.fg,
            fontSize: 11, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em', borderRadius: 2,
          }}>
            {verdict.label}
            {s.confidence && <span style={{ opacity: 0.65, marginLeft: 8 }}>· {s.confidence}</span>}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>—</span>
        )}
      </div>

      {/* Updated */}
      <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
        {s.updated}
      </span>

      {/* Author */}
      <span style={{ fontSize: 11, color: C.dim, letterSpacing: '-0.01em', textAlign: 'right' }}>{s.author}</span>
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div style={{
      padding: '60px 20px', textAlign: 'center',
      border: `1px dashed ${C.borderStrong}`, background: C.surface,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: C.text, color: C.bg, margin: '0 auto 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><IconPlus size={20} color={C.bg} /></div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: C.text, letterSpacing: '-0.02em', marginBottom: 8 }}>
        No substitutions yet
      </div>
      <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, maxWidth: 420, margin: '0 auto 20px', textWrap: 'pretty' }}>
        Start one by uploading a contractor email, a spec excerpt, or describing the swap in plain language.
      </p>
      <Btn variant="primary" icon={<IconPlus size={13} color={C.bg} />} onClick={onNew}>New substitution</Btn>
    </div>
  );
}

export { ProjectDetail, SUBSTITUTIONS_BY_PROJECT };
export default ProjectDetail;
