// ─── Substitution flow: intake → parse → check → verdict → file ─────────
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { C, EASE, GRAIN_URL, Mono, Btn, IconArrow, IconDownload, IconUpload, IconCheck, IconClose, api } from '../shared.jsx';
import { RaesonMark } from '../shared.jsx';

const SAMPLE_EMAIL = `From: m.jensen@njalbyg.dk
To: mf@studio-aedile.dk
Date: 12 Apr 2026 09:47 CET
Subject: Substitution · Ørestad 4B · facade insulation

Hej Mette,

Vi har svært ved at skaffe Rockwool Frontrock MAX E 150 mm
til facaden på Ørestad 4B — leveringstid er nu 9 uger.

Foreslår i stedet Kingspan Kooltherm K15 120 mm.
Har du mulighed for at vurdere inden fredag?

Mvh.
Morten — NJAL Byg`;

const FALLBACK_PARSE = {
  specified_product: 'Rockwool Frontrock MAX E 150 mm',
  proposed_product:  'Kingspan Kooltherm K15 120 mm',
  building_element:  'Facade insulation',
  project_reference: 'Ørestad 4B',
  jurisdiction:      'Denmark · BR25',
  building_class:    'klasse 2 · etageboliger',
};

const FALLBACK_CHECKS = [
  { name: 'Fire reaction',           ref: 'BR25 §5.1.4',   status: 'pass', note: 'B-s2,d0 ≥ B-s1,d0',   specified: 'A1 (non-combustible)', proposed: 'B-s1,d0' },
  { name: 'Fire resistance',         ref: 'BR25 §5.2.3',   status: 'pass', note: 'EI 60 maintained',     specified: 'EI 60', proposed: 'EI 60' },
  { name: 'Thermal performance',     ref: 'BR25 §11.3.1',  status: 'pass', note: 'U = 0.17 W/m²K',       specified: 'λ 0.040', proposed: 'λ 0.020' },
  { name: 'Carbon A1–A3',            ref: 'BR25 §12.2',    status: 'warn', note: '+42% vs. specified',   specified: '4.1 kgCO₂/m²', proposed: '5.8 kgCO₂/m²' },
  { name: 'Durability',              ref: 'BR25 §4.3',     status: 'pass', note: 'Class 2 · 50 yr',      specified: '50 yr', proposed: '50 yr' },
  { name: 'Material compatibility',  ref: 'EN 13162',      status: 'warn', note: 'verify vapour junction', specified: 'mineral wool', proposed: 'PIR foam' },
  { name: 'Acoustic transmission',   ref: 'BR25 §10.2',    status: 'pass', note: 'Rʹw = 48 dB',          specified: '48 dB', proposed: '46 dB' },
  { name: 'Moisture risk',           ref: 'DS 418',        status: 'pass', note: 'sd within range',       specified: 'open', proposed: 'sd = 0.2 m' },
];

const FALLBACK_VERDICT = {
  overall: 'conditional',
  headline: 'Acceptable if carbon budget and vapour junction are addressed.',
  summary: "Kingspan K15 meets fire, thermal, durability and acoustic requirements under BR25. Carbon intensity is 42% higher than the specified mineral wool — within the project's current LCA budget but flagged. Install detail 4.2 requires a revised vapour barrier termination at the window reveal.",
  recommendations: [
    'Obtain updated DoP from Kingspan for the as-delivered batch',
    'Revise vapour barrier detail 4.2 at window reveal junction',
    'Offset the +42% A1–A3 carbon in the project LCA budget',
  ],
  alternatives: [
    { name: 'Paroc eXtra 140 mm',   manufacturer: 'Paroc',    why: 'Matches fire class A1 with 11% lower carbon than specified' },
    { name: 'Isover Ultimate 140',  manufacturer: 'Saint-Gobain', why: 'A1 non-combustible, comparable λ, lead time 3 weeks' },
  ],
};

// ── Stepper UI ──────────────────────────────────────────────────────────
function Stepper({ step, steps, onStep }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4,
      padding: '0 40px 24px',
    }}>
      {steps.map((s, i) => (
        <button key={s.key} onClick={() => i <= step && onStep(i)} disabled={i > step}
          style={{
            textAlign: 'left', background: 'none', padding: '14px 0 10px',
            borderTop: `2px solid ${i <= step ? C.text : C.border}`,
            borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
            cursor: i <= step ? 'pointer' : 'default',
            transition: 'border-color 0.3s',
            fontFamily: 'inherit',
          }}>
          <div style={{ fontSize: 10, color: i === step ? C.text : C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>{s.label}</div>
          <div style={{ fontSize: 13, color: i <= step ? C.text : C.muted, marginTop: 4, letterSpacing: '-0.01em' }}>{s.title}</div>
        </button>
      ))}
    </div>
  );
}

// ── SubstitutionFlow — orchestrates all 5 stages ────────────────────────
function SubstitutionFlow({ project, substitution, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [parseData, setParseData] = useState(null);
  const [checks, setChecks] = useState(null);
  const [verdict, setVerdict] = useState(null);

  const steps = [
    { key: 'intake',  label: '01', title: 'Intake' },
    { key: 'parse',   label: '02', title: 'Parse' },
    { key: 'check',   label: '03', title: 'Check' },
    { key: 'verdict', label: '04', title: 'Verdict' },
    { key: 'file',    label: '05', title: 'File' },
  ];

  const advance = () => setStep(s => Math.min(s + 1, steps.length - 1));

  return (
    <div
      data-screen-label="03 Substitution"
    >
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '32px 40px 24px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6, padding: 0,
            }}>
              <IconArrow size={10} color={C.dim} dir="left" /> {project?.name || 'Projects'}
            </button>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)' }}>/</span>
            <Mono>{substitution ? substitution.id : 'New substitution'}</Mono>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36, fontWeight: 400,
            letterSpacing: '-0.035em', lineHeight: 1.05,
            color: C.text, margin: 0,
          }}>
            {substitution
              ? <>{substitution.title}</>
              : <>Run one substitution. Watch it <em style={{ fontStyle: 'italic' }}>resolve.</em></>}
          </h1>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: C.dim, lineHeight: 1.7 }}>
          <div>Scenario</div>
          <div style={{ color: C.text }}>{project?.name || 'Ørestad 4B'}</div>
          <div>{project?.building_class || 'klasse 2'} · {project?.city || 'Copenhagen'}</div>
        </div>
      </div>

      <div style={{ paddingTop: 28 }}>
        <Stepper step={step} steps={steps} onStep={setStep} />
      </div>

      <div style={{ padding: '0 40px 48px' }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          minHeight: 560, position: 'relative', overflow: 'hidden',
        }}>
          <>
            {step === 0 && <IntakeStage key="intake"   onNext={(d) => { setParseData(d); advance(); }} />}
            {step === 1 && <ParseStage  key="parse"    data={parseData || FALLBACK_PARSE} onNext={advance} />}
            {step === 2 && <CheckStage  key="check"    onNext={(c) => { setChecks(c); advance(); }} />}
            {step === 3 && <VerdictStage key="verdict" checks={checks || FALLBACK_CHECKS} onNext={(v) => { setVerdict(v); advance(); }} />}
            {step === 4 && <FileStage   key="file"     project={project} parse={parseData || FALLBACK_PARSE} verdict={verdict || FALLBACK_VERDICT} onComplete={onComplete} />}
          </>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 16, fontSize: 11, fontFamily: 'var(--font-mono)',
          color: C.dim, letterSpacing: '0.05em',
        }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            style={{ background: 'none', border: 'none', color: step === 0 ? C.muted : C.dim, cursor: step === 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
            ← previous
          </button>
          <span>{String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
          <span style={{ opacity: 0 }}>placeholder</span>
        </div>
      </div>
    </div>
  );
}

// ── Stage 1: Intake ─────────────────────────────────────────────────────
function IntakeStage({ onNext }) {
  const [dragOver, setDragOver] = useState(false);
  const [attached, setAttached] = useState(false);
  const [filename, setFilename] = useState('morten_njal_2026-04-12.eml');
  const [parsing, setParsing] = useState(false);

  const handleDrop = (file) => {
    if (file) setFilename(file.name);
    setAttached(true);
  };

  const submit = async () => {
    setParsing(true);
    const form = new FormData();
    form.append('query', SAMPLE_EMAIL);
    const result = await api('/api/assess/with-plan', { method: 'POST', body: form });
    setTimeout(() => {
      if (result && !result.__mock) {
        onNext({
          specified_product: result.specified_product,
          proposed_product:  result.proposed_product,
          building_element:  result.building_element,
          project_reference: 'Ørestad 4B',
          jurisdiction:      `${result.building_class?.includes('kl')?'Denmark · BR25':'Netherlands · Bbl'}`,
          building_class:    result.building_class,
          __api:             result,
        });
      } else {
        onNext(FALLBACK_PARSE);
      }
    }, 900);
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 560,
    }}>
      {/* Left: email preview */}
      <div style={{ padding: 40, borderRight: `1px solid ${C.border}`, background: C.bg }}>
        <Mono style={{ display: 'block', marginBottom: 16 }}>Contractor email · received 09:47</Mono>
        <div style={{
          border: `1px solid ${C.border}`, background: C.surface,
          padding: 24, fontFamily: 'var(--font-mono)', fontSize: 12,
          lineHeight: 1.8, color: C.dim, whiteSpace: 'pre-wrap',
        }}>
          <div style={{ color: C.text, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 14 }}>
            <div>From: m.jensen@njalbyg.dk</div>
            <div>To: mf@studio-aedile.dk</div>
            <div>Subject: Substitution · Ørestad 4B · facade insulation</div>
          </div>
          <div style={{ color: C.text }}>
Hej Mette,

Vi har svært ved at skaffe <span style={{ color: C.text, fontWeight: 500 }}>Rockwool Frontrock MAX E 150 mm</span> til facaden på Ørestad 4B — leveringstid er nu 9 uger.

Foreslår i stedet <span style={{ color: C.text, fontWeight: 500 }}>Kingspan Kooltherm K15 120 mm</span>. Har du mulighed for at vurdere inden fredag?

Mvh.
Morten — NJAL Byg
          </div>
        </div>
      </div>

      {/* Right: drop zone */}
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column' }}>
        <Mono style={{ display: 'block', marginBottom: 16 }}>Drop into ræson</Mono>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300,
          color: C.text, lineHeight: 1.3, letterSpacing: '-0.02em',
          margin: '0 0 32px', textWrap: 'pretty',
        }}>
          Ræson reads the email, identifies the specified and proposed products, and infers the building element from context.
        </p>

        {!attached ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleDrop(e.dataTransfer.files[0]); }}
            onClick={() => handleDrop()}
            style={{
              border: `1px dashed ${dragOver ? C.text : C.borderStrong}`,
              padding: '56px 24px', textAlign: 'center',
              background: dragOver ? 'rgba(20,20,20,0.02)' : 'transparent',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
            <IconUpload size={20} color={C.dim} />
            <div style={{ fontSize: 14, color: C.text, margin: '14px 0 6px', letterSpacing: '-0.01em' }}>Drop email, PDF, or floor plan here</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)' }}>.eml · .pdf · .jpg · .png · .ifc</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              or <u>click to use the sample</u>
            </div>
          </div>
        ) : (
          <div
            style={{ border: `1px solid ${C.accent}40`, background: C.passBg, padding: '14px 18px',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconCheck size={14} color={C.accent} />
              <div>
                <div style={{ fontSize: 13, color: C.text, letterSpacing: '-0.01em' }}>{filename}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', marginTop: 2 }}>2.1 KB · uploaded in 0.3 s</div>
              </div>
            </div>
            <button onClick={() => { setAttached(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <IconClose size={14} color={C.muted} />
            </button>
          </div>
        )}

        {attached && (
          <div
            style={{ marginTop: 20, fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            ▸ ready to parse · engine v0.9.2
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)' }}>
            {parsing ? '▸ calling /api/assess …' : ''}
          </div>
          <Btn variant="primary" disabled={!attached || parsing} onClick={submit}
            icon={<IconArrow size={12} color={attached ? C.bg : C.muted} />}>
            {parsing ? 'Parsing…' : 'Parse this request'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Stage 2: Parse ──────────────────────────────────────────────────────
function ParseStage({ data, onNext }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const rows = [
    ['Specified product', data.specified_product, 400],
    ['Proposed product',  data.proposed_product, 720],
    ['Building element',  data.building_element, 1020],
    ['Project reference', data.project_reference, 1300],
    ['Jurisdiction',      data.jurisdiction, 1560],
    ['Building class',    data.building_class, 1820],
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 560,
    }}>
      <div style={{ padding: 40, borderRight: `1px solid ${C.border}`, background: C.bg,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <Mono style={{ display: 'block', marginBottom: 16 }}>LLM parse · claude-sonnet-4.5</Mono>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300,
            color: C.text, lineHeight: 1.3, letterSpacing: '-0.02em', margin: '0 0 32px',
          }}>
            Claude extracts structured fields. Then the engine takes over — no LLM on the compliance path.
          </p>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: C.dim, lineHeight: 2 }}>
            <ThinkingLine active={!done} delay={0}>▸ reading document…</ThinkingLine>
            <ThinkingLine active={!done} delay={500}>▸ identifying products…</ThinkingLine>
            <ThinkingLine active={!done} delay={1100}>▸ matching to catalogue #20240412…</ThinkingLine>
            <ThinkingLine active={!done} delay={1700}>▸ inferring project context…</ThinkingLine>
            {done && <div style={{ color: C.accent, marginTop: 10 }}>✓ parse complete · 2.4 s · 1,840 tokens</div>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="primary" disabled={!done} onClick={onNext}
            icon={<IconArrow size={12} color={done ? C.bg : C.muted} />}>
            Run compliance checks
          </Btn>
        </div>
      </div>

      <div style={{ padding: 40 }}>
        <Mono style={{ display: 'block', marginBottom: 24 }}>Structured fields</Mono>
        {rows.map(([label, value, delay], i) => (
          <div key={label}
            style={{
              display: 'grid', gridTemplateColumns: '160px 1fr',
              padding: '14px 0', borderBottom: `1px solid ${C.border}`,
              alignItems: 'baseline',
            }}>
            <Mono>{label}</Mono>
            <span style={{ fontSize: 14, color: C.text, letterSpacing: '-0.01em' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThinkingLine({ children, active, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return (
    <div>
      {children}
    </div>
  );
}

// ── Stage 3: Check ──────────────────────────────────────────────────────
function CheckStage({ onNext }) {
  const checks = FALLBACK_CHECKS.map((c, i) => ({ ...c, ms: 400 + i * 350 }));
  const [allDone, setAllDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAllDone(true), 400 + checks.length * 350 + 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ padding: 40, minHeight: 560, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32, gap: 32 }}>
        <div>
          <Mono style={{ display: 'block', marginBottom: 16 }}>Compliance engine · deterministic</Mono>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300,
            color: C.text, lineHeight: 1.25, letterSpacing: '-0.02em',
            margin: 0, maxWidth: 640, textWrap: 'pretty',
          }}>
            Eight checks. Each traces to a BR25 provision and a measured material property. No probabilistic step — the LLM never decides.
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: C.dim, lineHeight: 1.8, minWidth: 160 }}>
          engine v0.9.2<br/>
          catalog #20240412<br/>
          <span style={{ color: allDone ? C.accent : C.dim }}>{allDone ? '✓ ready · 3.4 s' : '▸ running'}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: `1px solid ${C.border}`, borderRadius: 0 }}>
        <div>
          {checks.slice(0, 4).map(c => <CheckRow key={c.name} c={c} />)}
        </div>
        <div style={{ borderLeft: `1px solid ${C.border}` }}>
          {checks.slice(4).map(c => <CheckRow key={c.name} c={c} />)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <Btn variant="primary" disabled={!allDone} onClick={() => onNext(checks)}
          icon={<IconArrow size={12} color={allDone ? C.bg : C.muted} />}>
          View the verdict
        </Btn>
      </div>
    </div>
  );
}

function CheckRow({ c }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), c.ms);
    return () => clearTimeout(t);
  }, [c.ms]);
  const color = c.status === 'pass' ? C.accent : c.status === 'warn' ? C.warn : C.fail;
  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: '12px 1fr auto', gap: 14, alignItems: 'center',
        padding: '18px 20px',
        borderBottom: `1px solid ${C.border}`,
      }}>
      <div
        style={{ width: 8, height: 8, borderRadius: '50%', background: color }}
      />
      <div>
        <div style={{ fontSize: 13, color: C.text, letterSpacing: '-0.01em' }}>{c.name} <span style={{ color: C.muted, fontFamily: 'var(--font-mono)', fontSize: 11 }}>· {c.ref}</span></div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', marginTop: 3 }}>
          spec <span style={{ color: C.dim }}>{c.specified}</span>
          <span style={{ margin: '0 8px' }}>→</span>
          prop <span style={{ color: C.dim }}>{c.proposed}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
        {c.status === 'pass' ? 'pass' : c.status === 'warn' ? 'note' : 'fail'}
      </span>
    </div>
  );
}

// ── Stage 4: Verdict ────────────────────────────────────────────────────
function VerdictStage({ checks, onNext }) {
  const v = FALLBACK_VERDICT;
  const badge = v.overall === 'pass' ? { color: C.accent, bg: C.passBg, label: 'Acceptable' } :
                v.overall === 'fail' ? { color: C.fail, bg: C.failBg, label: 'Rejected' } :
                                       { color: C.warn, bg: C.warnBg, label: 'Conditional acceptance' };

  return (
    <div style={{ padding: 40, minHeight: 560, display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 48 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <Mono style={{ display: 'block', marginBottom: 16 }}>Verdict</Mono>
          <div style={{
            display: 'inline-block', padding: '7px 14px',
            background: badge.bg, color: badge.color,
            border: `1px solid ${badge.color}40`,
            fontSize: 11, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 24,
          }}>{badge.label}</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40, fontWeight: 300,
            lineHeight: 1.12, letterSpacing: '-0.03em',
            color: C.text, margin: '0 0 24px',
            textWrap: 'balance',
          }}>
            Acceptable <em style={{ fontStyle: 'italic' }}>if</em> carbon budget and vapour junction are addressed.
          </h2>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.7, maxWidth: 480, textWrap: 'pretty' }}>
            {v.summary}
          </p>

          <div style={{ marginTop: 32 }}>
            <Mono style={{ display: 'block', marginBottom: 14 }}>Recommended actions</Mono>
            {v.recommendations.map((r, i) => (
              <div key={i}
                style={{
                  display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8,
                  padding: '10px 0', borderTop: i === 0 ? `1px solid ${C.border}` : 'none',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>{String(i+1).padStart(2,'0')}</span>
                <span style={{ fontSize: 13, color: C.text, lineHeight: 1.6, letterSpacing: '-0.01em' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 32 }}>
          <Btn variant="accent" onClick={() => onNext({ decision: 'approved' })} icon={<IconCheck size={12} color="#FFF" />}>
            Approve with conditions
          </Btn>
          <Btn variant="ghost" onClick={() => onNext({ decision: 'info_requested' })}>Request more info</Btn>
          <Btn variant="subtle" onClick={() => onNext({ decision: 'rejected' })}>Reject</Btn>
        </div>
      </div>

      {/* Dimensions panel */}
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`,
        padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <Mono>Compliance dimensions</Mono>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: C.muted }}>{checks.length} checked</span>
        </div>
        {checks.map((c, i) => {
          const color = c.status === 'pass' ? C.accent : c.status === 'warn' ? C.warn : C.fail;
          return (
            <div key={c.name}
              style={{
                display: 'grid', gridTemplateColumns: '8px 1fr auto', gap: 12, alignItems: 'center',
                padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
              }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <div>
                <div style={{ fontSize: 12, color: C.text, letterSpacing: '-0.01em' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.note} · {c.ref}</div>
              </div>
              <span style={{ fontSize: 9, color, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                {c.status === 'pass' ? 'pass' : c.status === 'warn' ? 'note' : 'fail'}
              </span>
            </div>
          );
        })}

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <Mono style={{ display: 'block', marginBottom: 12 }}>Better alternatives</Mono>
          {v.alternatives.map((alt, i) => (
            <div key={alt.name} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.text, letterSpacing: '-0.01em' }}>{alt.name} <span style={{ color: C.muted, fontFamily: 'var(--font-mono)', fontSize: 10 }}>· {alt.manufacturer}</span></div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>{alt.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stage 5: File ───────────────────────────────────────────────────────
function FileStage({ project, parse, verdict, onComplete }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const result = await api('/api/assess/pdf', {
      method: 'POST',
      body: { query: SAMPLE_EMAIL },
    });
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url; a.download = 'raeson_assessment.pdf'; a.click();
        URL.revokeObjectURL(url);
      }
    }, 1200);
  };

  return (
    <div style={{
      padding: 40, minHeight: 560,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48,
      background: 'linear-gradient(180deg, rgba(20,20,20,0.02), transparent)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <Mono style={{ display: 'block', marginBottom: 16 }}>Project file · {project?.name || 'Ørestad 4B'}</Mono>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 44, fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '-0.035em',
            color: C.text, margin: '0 0 24px', textWrap: 'balance',
          }}>Signed, dated, <em style={{ fontStyle: 'italic' }}>and filed.</em></h2>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.7, maxWidth: 460, marginBottom: 32, textWrap: 'pretty' }}>
            The assessment is saved to the project file and a signed PDF is generated — with the firm's logo, architect's name, and exact code citations. The contractor receives a response draft they can reply to.
          </p>

          <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: 18, marginBottom: 24 }}>
            <Mono style={{ display: 'block', marginBottom: 10 }}>Assessment saved</Mono>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 6, fontSize: 12 }}>
              <span style={{ color: C.muted }}>Ref.</span><span style={{ color: C.text, fontFamily: 'var(--font-mono)' }}>AM-0412</span>
              <span style={{ color: C.muted }}>Signed by</span><span style={{ color: C.text }}>M. Friis · Studio Aedile</span>
              <span style={{ color: C.muted }}>Timestamp</span><span style={{ color: C.text, fontFamily: 'var(--font-mono)' }}>2026-04-12 14:22 CET</span>
              <span style={{ color: C.muted }}>Decision</span><span style={{ color: C.warn, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>conditional</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="primary" onClick={handleDownload} disabled={downloading}
              icon={<IconDownload size={12} color={C.bg} />}>
              {downloading ? 'Generating…' : downloaded ? 'Download again' : 'Download signed PDF'}
            </Btn>
            <Btn variant="ghost" onClick={onComplete}>Back to project</Btn>
          </div>
          {downloaded && (
            <div
              style={{ marginTop: 14, fontSize: 11, color: C.accent, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              ✓ raeson_assessment_AM-0412.pdf · filed in project record
            </div>
          )}
        </div>
      </div>

      <FakePdfPreview parse={parse} verdict={verdict} project={project} />
    </div>
  );
}

function FakePdfPreview({ parse, verdict, project }) {
  return (
    <div
      style={{
        background: '#FFFFFF', color: '#0A0A0A',
        padding: '36px 40px',
        minHeight: 520,
        boxShadow: '0 40px 80px rgba(20,20,20,0.18), 0 8px 24px rgba(20,20,20,0.08)',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RaesonMark size={12} color="#0A0A0A" />
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.02em' }}>ræson</span>
        </div>
        <div style={{ fontSize: 9, color: '#666', fontFamily: 'Courier, monospace', letterSpacing: '0.08em' }}>
          ASSESSMENT #AM-0412 · 12 APR 2026
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #ddd', paddingBottom: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Substitution Assessment</div>
        <div style={{ fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Facade insulation<br/>
          {parse.specified_product.split(' ').slice(0, 2).join(' ')} → {parse.proposed_product.split(' ').slice(0, 2).join(' ')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Project</div>
          <div>{project?.name || 'Ørestad Housing Block 4B'}</div>
          <div style={{ color: '#555' }}>{parse.building_class} · {project?.city || 'Copenhagen'}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Architect</div>
          <div>M. Friis — Studio Aedile</div>
          <div style={{ color: '#555' }}>Signed · 12 Apr 2026 14:22 CET</div>
        </div>
      </div>

      <div style={{
        padding: '10px 14px', background: '#FDF6E3', border: '1px solid #E8D794',
        color: '#7A5500', fontSize: 10, marginBottom: 16,
      }}>
        <strong>CONDITIONAL</strong> — acceptable if carbon offset and vapour junction detail 4.2 revised.
      </div>

      <div style={{ fontSize: 9 }}>
        {FALLBACK_CHECKS.map((c, i) => (
          <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i === FALLBACK_CHECKS.length - 1 ? 'none' : '1px solid #eee' }}>
            <span>{c.name} · {c.ref}</span>
            <span style={{
              fontWeight: 500,
              color: c.status === 'pass' ? '#1a6b4b' : c.status === 'warn' ? '#a36d00' : '#b82228',
              letterSpacing: '0.06em',
            }}>{c.status === 'pass' ? 'PASS' : c.status === 'warn' ? 'NOTE' : 'FAIL'}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #ddd', fontSize: 8, color: '#888', fontFamily: 'Courier, monospace', letterSpacing: '0.06em' }}>
        Generated by ræson v0.9.2 · catalog #20240412 · p. 1 / 4
      </div>
    </div>
  );
}

export { SubstitutionFlow, FALLBACK_PARSE, FALLBACK_CHECKS, FALLBACK_VERDICT };
export default SubstitutionFlow;
