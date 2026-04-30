// ─── Demo: chat-driven substitution capture & graded verdict ──────────────
import React, { useState, useEffect, useRef, useMemo } from 'react';

// ── Scripted conversation state machine ──────────────────────────────────
const SAMPLE_USER_TEXT = `Replacing 200mm Rockwool mineral wool insulation in the external wall build-up with Steico wood fibre insulation. Multi-family residential, ~3,400 m² facade area.`;

const SCRIPT = [
  {
    id: 'open',
    role: 'system',
    kind: 'message',
    body: `Drop in a substitution request. You can paste a spec excerpt, describe the swap in plain language, or upload a BIM/spec file. I'll work out what's missing and ask only what I need.`,
  },
  {
    id: 'u-submit',
    role: 'user',
    kind: 'composer',
    sample: SAMPLE_USER_TEXT,
    sendLabel: 'Send substitution request',
  },
  {
    id: 's-parse',
    role: 'system',
    kind: 'parse-card',
    parsed: [
      { k: 'Replacing',  v: 'Mineral wool insulation (Rockwool, 200mm)', src: 'parsed' },
      { k: 'With',       v: 'Wood fibre insulation (Steico)',            src: 'parsed' },
      { k: 'Element',    v: 'External wall build-up',                    src: 'parsed' },
      { k: 'Quantity',   v: '~3,400 m² facade area',                     src: 'parsed' },
    ],
    body: `Here's what I've got. Tell me if any of it's wrong — otherwise one thing I need before I can run this:`,
    question: {
      prompt: `What jurisdiction is the project in?`,
      why: `It drives which mandatory codes apply, embodied carbon caps, and supply chain assumptions.`,
      chips: ['Netherlands', 'Denmark', 'Germany', 'Skip — not sure'],
    },
  },
  {
    id: 'u-jurisdiction',
    role: 'user',
    kind: 'chip-pick',
    from: 's-parse',
    answer: 'Netherlands',
    contextUpdate: { jurisdiction: 'Netherlands' },
  },
  {
    id: 's-typology',
    role: 'system',
    kind: 'message',
    body: `Got it — Netherlands. Next: building typology. It determines which regulations apply and what needs checking.`,
    question: {
      prompt: `Which typology fits?`,
      chips: ['Multi-family residential', 'Office', 'Education', 'Healthcare', 'Other'],
    },
  },
  {
    id: 'u-typology',
    role: 'user',
    kind: 'chip-pick',
    from: 's-typology',
    answer: 'Multi-family residential',
    contextUpdate: { typology: 'Multi-family residential' },
  },
  {
    id: 's-tier2',
    role: 'system',
    kind: 'message',
    body: `Multi-family residential, noted. Two more things that'll sharpen the assessment — I can run without them if you'd rather skip:`,
    multiQuestion: [
      {
        id: 'lifespan',
        prompt: 'Building lifespan assumption?',
        why: '60 years is the residential default. Affects how embodied carbon is spread over the building\'s life.',
        chips: ['60 years (default)', '50 years', '80 years', 'Skip'],
      },
      {
        id: 'cert',
        prompt: 'Certification target, if any?',
        why: 'Imposes specific material requirements and credit thresholds.',
        chips: ['BREEAM', 'LEED', 'DGNB', 'None', 'Skip'],
      },
    ],
  },
  {
    id: 'u-tier2',
    role: 'user',
    kind: 'chip-pick',
    from: 's-tier2',
    answer: '60 years (default) · None',
    contextUpdate: { lifespan: '60 years (default)', certification: 'None' },
  },
  {
    id: 's-summary',
    role: 'system',
    kind: 'summary-card',
    body: `Here's the full context I'll run the assessment against.`,
    confirmChips: ['Run the assessment', 'Change something'],
  },
  {
    id: 'u-run',
    role: 'user',
    kind: 'chip-pick',
    from: 's-summary',
    answer: 'Run the assessment',
  },
  {
    id: 's-verdict',
    role: 'system',
    kind: 'verdict',
    headline: 'Conditionally viable.',
    rationale: `Improves embodied carbon and end-of-life recoverability, but functional equivalence holds only if the vapour-control strategy is revised for the new permeability profile.`,
    confidenceLine: `Confidence: moderate overall · 6 dimensions assessed · 2 flagged low-confidence.`,
    drivers: [
      { t: 'Embodied carbon',   d: 'A1–A3 reduces by ~38% vs incumbent (manufacturer EPDs, both products).' },
      { t: 'Vapour management', d: 'Wood fibre is vapour-open; existing Sd-value of internal membrane needs re-checking.' },
      { t: 'Fire reaction',     d: 'Drops from A1 to E (treated). Compliant for typology + height, but loses the non-combustible margin.' },
    ],
    dimensions: [
      { t: 'Functional equivalence',     verdict: 'maintains',  magnitude: 'conditional · vapour',          grade: 'high',     rationale: 'Lambda 0.038 vs 0.035 — within tolerance. Fire E vs A1 acceptable for this height. Vapour profile requires assembly review.' },
      { t: 'Regulatory & certification', verdict: 'maintains',  magnitude: '—',                              grade: 'high',     rationale: 'Bouwbesluit, NTA 8800, MPG cap all satisfied. No SVHC concerns. No certification target set.' },
      { t: 'Embodied carbon · LCA',      verdict: 'improves',   magnitude: '−38% A1–A3 (±9%)',               grade: 'high',     rationale: 'Both products have manufacturer EPDs. Biogenic carbon accounted per EN 16485.' },
      { t: 'Indoor environmental quality', verdict: 'maintains', magnitude: 'no material delta',             grade: 'moderate', rationale: 'Both products M1-classified. Fibre release potential equivalent. Wellbeing claims insufficient.' },
      { t: 'Longevity & lifecycle',      verdict: 'unclear',    magnitude: '50–80y range',                   grade: 'low',      rationale: 'Service-life data for wood fibre in Cfb climates limited. Conservative bound used.' },
      { t: 'Supply chain & circularity', verdict: 'improves',   magnitude: '+ recoverability',                grade: 'moderate', rationale: 'Both EU-manufactured. Wood fibre disassembly and recovery infrastructure broader in NL.' },
    ],
    uncertainties: [
      { t: 'Service life of wood fibre in NL Cfb climate', d: 'Limited 50+ year longitudinal data. Manufacturer claims 50y; ecoinvent generic uses 30y. Spread matters for amortisation.' },
      { t: 'Wellbeing / IEQ uplift claims',                d: 'Not assessable at moderate-or-high evidence for this specific substitution. Flagged rather than estimated.' },
    ],
    framing: `More defensibly: this substitution reduces A1–A3 embodied carbon by 38% (±9%) and maintains Bouwbesluit and MPG compliance. It is conditionally viable pending a vapour-control review of the assembly. Wellbeing claims are not supported by current evidence at moderate-or-high grade.`,
    actions: ['Export PDF dossier', 'Try an alternative', 'Ask a follow-up'],
  },
];

// ── DemoStage — top-level controller ──────────────────────────────────────
function DemoStage({ C, tweaks }) {
  const [cursor, setCursor] = useState(1);
  const [composerValue, setComposerValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const scrollerRef = useRef(null);

  const visible = SCRIPT.slice(0, cursor);
  const nextStep = SCRIPT[cursor];

  const context = useMemo(() => {
    const ctx = {
      replacing: 'Mineral wool insulation (Rockwool, 200mm)',
      withMaterial: 'Wood fibre insulation (Steico)',
      element: 'External wall build-up',
      quantity: '~3,400 m² facade area',
    };
    visible.forEach(t => { if (t.contextUpdate) Object.assign(ctx, t.contextUpdate); });
    if (cursor < 3) {
      delete ctx.replacing; delete ctx.withMaterial; delete ctx.element; delete ctx.quantity;
    }
    return ctx;
  }, [cursor]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [cursor, busy]);

  const advance = (skipBusy = false) => {
    const next = SCRIPT[cursor];
    if (!next) return;
    if (next.role === 'system' && !skipBusy) {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        setCursor(c => c + 1);
      }, 900);
    } else {
      setCursor(c => c + 1);
    }
  };

  useEffect(() => {
    if (!nextStep) return;
    if (nextStep.role === 'system' && cursor > 0) {
      const t = setTimeout(() => advance(), 350);
      return () => clearTimeout(t);
    }
  }, [cursor]);

  useEffect(() => {
    if (!autoplay) return;
    if (!nextStep || nextStep.role !== 'user') return;
    const t = setTimeout(() => {
      handleUserTurn(nextStep);
    }, 1200);
    return () => clearTimeout(t);
  }, [autoplay, cursor]);

  const handleUserTurn = (turn) => {
    if (turn.kind === 'composer') {
      setComposerValue('');
      setCursor(c => c + 1);
      return;
    }
    if (turn.kind === 'chip-pick') {
      setCursor(c => c + 1);
      return;
    }
  };

  const onSendComposer = () => {
    setCursor(c => c + 1);
    setComposerValue('');
  };

  const reset = () => {
    setCursor(1);
    setComposerValue('');
    setAutoplay(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 80, position: 'relative' }}>
      {/* Top header band */}
      <div style={{
        maxWidth: 1440, margin: '0 auto', padding: '0 32px 32px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 32,
      }}>
        <div>
          <div style={{ fontSize: 13, color: C.dim, fontFamily: 'var(--font-sans)', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span aria-hidden style={{ width: 18, height: 1, background: 'currentColor', opacity: 0.35 }} />
            Live demonstration — no login
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 4.6vw, 64px)', fontWeight: 300,
            letterSpacing: '-0.04em', lineHeight: 1,
            color: C.text, margin: 0, maxWidth: 880, textWrap: 'balance',
          }}>Try it on a real swap. <em style={{ fontStyle: 'italic' }}>See how it answers.</em></h1>
          <p style={{ fontSize: 15, color: C.dim, lineHeight: 1.55, margin: '20px 0 0', maxWidth: 620, textWrap: 'pretty' }}>
            Tell Ræson what you want to substitute. It asks a few questions, shows what it's working out, and returns a verdict you can defend.
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: C.dim, fontFamily: 'var(--font-mono)', lineHeight: 1.6, letterSpacing: '0.04em', flexShrink: 0 }}>
          <button onClick={reset} style={{
            background: 'none', color: C.dim, border: `1px solid ${C.border}`,
            padding: '8px 14px', fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em',
            cursor: 'pointer', textTransform: 'uppercase', marginBottom: 10,
          }}>↺ Restart</button>
          <div>{cursor - 1} / {SCRIPT.length - 1} turns</div>
        </div>
      </div>

      {/* Two-column workbench */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 0,
          border: `1px solid ${C.border}`,
          background: C.isDark ? '#0E0E0E' : '#FFFFFF',
          minHeight: 720,
        }}>
          {/* Left: chat surface */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, minHeight: 720 }}>
            <div style={{
              padding: '14px 24px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: C.dim, letterSpacing: '0.08em',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#009767', boxShadow: '0 0 0 3px rgba(0,151,103,0.18)' }} />
                RÆSON · ASSESSMENT THREAD
              </span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} style={{ accentColor: '#009767' }} />
                <span>Autoplay</span>
              </label>
            </div>

            <div ref={scrollerRef} style={{
              flex: 1, padding: '32px 24px 24px', overflowY: 'auto', maxHeight: 620,
              display: 'flex', flexDirection: 'column', gap: 24,
            }}>
              {visible.map((turn, i) => (
                <ChatTurn key={turn.id} turn={turn} C={C} index={i} />
              ))}
              {busy && <Thinking C={C} />}
              {!busy && nextStep && nextStep.role === 'user' && (
                <NextUserTurn
                  turn={nextStep} C={C}
                  composerValue={composerValue}
                  setComposerValue={setComposerValue}
                  onSend={onSendComposer}
                  onPickChip={() => setCursor(c => c + 1)}
                />
              )}
              {!busy && !nextStep && (
                <div style={{
                  padding: '20px 0 0', borderTop: `1px solid ${C.border}`,
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: C.muted, letterSpacing: '0.08em',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>END OF DEMONSTRATION THREAD</span>
                  <button onClick={reset} style={{
                    background: 'none', color: C.text, border: `1px solid ${C.border}`,
                    padding: '8px 14px', fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}>↺ RESTART</button>
                </div>
              )}
            </div>
          </div>

          {/* Right: captured context panel */}
          <ContextPanel C={C} context={context} cursor={cursor} />
        </div>
      </div>
    </div>
  );
}

function ChatTurn({ turn, C, index }) {
  const isUser = turn.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {isUser ? 'You' : 'Ræson'} · {String(index + 1).padStart(2, '0')}
      </div>

      {turn.kind === 'message' && (
        <SystemBubble C={C}>
          <p style={{ margin: 0, fontSize: 15, color: C.text, lineHeight: 1.55, textWrap: 'pretty' }}>{turn.body}</p>
          {turn.question && <QuestionBlock q={turn.question} C={C} />}
          {turn.multiQuestion && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {turn.multiQuestion.map((q, i) => (
                <div key={q.id} style={{ paddingLeft: 16, borderLeft: `2px solid ${C.border}` }}>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, marginBottom: 4 }}>{q.prompt}</div>
                  {q.why && <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55 }}>{q.why}</div>}
                </div>
              ))}
            </div>
          )}
        </SystemBubble>
      )}

      {turn.kind === 'parse-card' && <ParseCard turn={turn} C={C} />}
      {turn.kind === 'summary-card' && <SummaryCard C={C} />}
      {turn.kind === 'verdict' && <VerdictPayload turn={turn} C={C} />}

      {turn.kind === 'composer' && (
        <UserBubble C={C}>
          <p style={{ margin: 0, fontSize: 15, color: C.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{turn.sample}</p>
        </UserBubble>
      )}
      {turn.kind === 'chip-pick' && (
        <UserBubble C={C}>
          <p style={{ margin: 0, fontSize: 15, color: C.text, lineHeight: 1.5 }}>{turn.answer}</p>
        </UserBubble>
      )}
    </div>
  );
}

function NextUserTurn({ turn, C, composerValue, setComposerValue, onSend, onPickChip }) {
  if (turn.kind === 'composer') {
    return (
      <div style={{
        marginTop: 8, padding: '16px 20px',
        border: `1px solid ${C.border}`, background: C.isDark ? '#161616' : '#FAFAFA',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <textarea
          value={composerValue}
          onChange={e => setComposerValue(e.target.value)}
          placeholder="Paste a spec excerpt, describe the swap, or type your request…"
          rows={4}
          style={{
            width: '100%', resize: 'vertical', minHeight: 70,
            border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-sans)', fontSize: 15, color: C.text,
            lineHeight: 1.55,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setComposerValue(turn.sample)} style={{
            background: 'none', border: `1px solid ${C.border}`, color: C.dim,
            padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
          }}>↳ Use sample request</button>
          <button onClick={onSend} disabled={!composerValue.trim()} style={{
            background: composerValue.trim() ? C.text : 'transparent',
            color: composerValue.trim() ? C.bg : C.muted,
            border: `1px solid ${composerValue.trim() ? C.text : C.border}`,
            padding: '8px 18px', fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: composerValue.trim() ? 'pointer' : 'default',
          }}>{turn.sendLabel || 'Send'} →</button>
        </div>
      </div>
    );
  }
  if (turn.kind === 'chip-pick') {
    return (
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, alignSelf: 'flex-end',
        maxWidth: '85%', justifyContent: 'flex-end',
      }}>
        <button onClick={onPickChip} style={{
          background: C.text, color: C.bg, border: `1px solid ${C.text}`,
          padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13,
          cursor: 'pointer', letterSpacing: '-0.005em',
        }}>{turn.answer} →</button>
      </div>
    );
  }
  return null;
}

function QuestionBlock({ q, C }) {
  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, marginBottom: 6 }}>{q.prompt}</div>
      {q.why && <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55, marginBottom: 12, textWrap: 'pretty' }}>{q.why}</div>}
      {q.chips && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {q.chips.map(c => (
            <span key={c} style={{
              padding: '5px 10px', fontSize: 11, color: C.dim,
              border: `1px solid ${C.border}`, fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemBubble({ children, C }) {
  return (
    <div style={{
      maxWidth: '85%', padding: '16px 20px',
      border: `1px solid ${C.border}`,
      background: C.isDark ? '#141414' : '#FFFFFF',
    }}>{children}</div>
  );
}
function UserBubble({ children, C }) {
  return (
    <div style={{
      maxWidth: '85%', padding: '14px 18px',
      background: C.isDark ? '#1B1B1B' : '#F4F4F1',
      border: `1px solid ${C.border}`,
    }}>{children}</div>
  );
}

function Thinking({ C }) {
  return (
    <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}>RÆSON · THINKING</div>
      <div style={{
        padding: '14px 20px', border: `1px solid ${C.border}`,
        background: C.isDark ? '#141414' : '#FFFFFF',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {[0,1,2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: C.dim,
            opacity: 0.45,
          }} />
        ))}
      </div>
    </div>
  );
}

function ParseCard({ turn, C }) {
  return (
    <SystemBubble C={C}>
      <p style={{ margin: 0, fontSize: 15, color: C.text, lineHeight: 1.55 }}>{turn.body}</p>
      <div style={{
        marginTop: 14, border: `1px solid ${C.border}`,
        background: C.isDark ? '#0E0E0E' : '#FAFAFA',
      }}>
        {turn.parsed.map((p, i) => (
          <div key={p.k} style={{
            display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 16,
            padding: '12px 16px',
            borderBottom: i < turn.parsed.length - 1 ? `1px solid ${C.border}` : 'none',
            alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.k}</span>
            <span style={{ fontSize: 14, color: C.text, lineHeight: 1.4 }}>{p.v}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#009767', letterSpacing: '0.08em' }}>· {p.src}</span>
          </div>
        ))}
      </div>
      {turn.question && <QuestionBlock q={turn.question} C={C} />}
    </SystemBubble>
  );
}

function SummaryCard({ C }) {
  const sections = [
    {
      label: 'Substitution',
      lines: ['Replacing mineral wool (Rockwool, 200mm, external wall)', 'with wood fibre insulation (Steico)', '~3,400 m² facade area'],
    },
    {
      label: 'Building',
      lines: ['Multi-family residential · Netherlands', 'Köppen Cfb (temperate oceanic) — inferred', '60-year design life · No certification target'],
    },
    {
      label: 'Inferred from jurisdiction',
      mono: true,
      lines: [
        'Applicable codes: Bouwbesluit · NTA 8800 · MPG cap',
        'Grid carbon: ~0.27 kgCO₂e/kWh (NL 2024)',
        'Default transport distance: ~500 km',
      ],
    },
    {
      label: 'Not captured · will be flagged',
      muted: true,
      lines: ['Occupant vulnerability profile', 'Procurement context', 'Adjacent assembly materials'],
    },
  ];
  return (
    <SystemBubble C={C}>
      <p style={{ margin: 0, fontSize: 15, color: C.text, lineHeight: 1.55 }}>Here's the full context I'll run the assessment against.</p>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {sections.map(s => (
          <div key={s.label}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: s.muted ? C.muted : C.dim,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
            }}>{s.label}</div>
            {s.lines.map((l, i) => (
              <div key={i} style={{
                fontSize: s.mono ? 12 : 14,
                fontFamily: s.mono ? 'var(--font-mono)' : 'var(--font-sans)',
                color: s.muted ? C.muted : C.text,
                lineHeight: 1.55, textWrap: 'pretty',
                opacity: s.muted ? 0.85 : 1,
              }}>{l}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 13, color: C.dim }}>
        Run the assessment, or change anything?
      </div>
    </SystemBubble>
  );
}

function VerdictPayload({ turn, C }) {
  const verdictColor = (v) => {
    if (v === 'improves')  return '#009767';
    if (v === 'maintains') return C.text;
    if (v === 'degrades')  return '#C84A3A';
    return C.muted;
  };
  const gradeShade = (g) => {
    if (g === 'high')      return { bg: '#009767', fg: '#0A0A0A' };
    if (g === 'moderate')  return { bg: C.text,   fg: C.bg };
    if (g === 'low')       return { bg: 'transparent', fg: C.dim, border: C.border };
    if (g === 'very low')  return { bg: 'transparent', fg: C.muted, border: C.border };
    return { bg: 'transparent', fg: C.muted, border: C.border };
  };

  return (
    <div style={{
      width: '100%', maxWidth: '100%',
      border: `1px solid ${C.border}`,
      background: C.isDark ? '#0F0F0F' : '#FFFFFF',
    }}>
      <div style={{
        padding: '12px 24px', borderBottom: `1px solid ${C.border}`,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: C.dim,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#009767', boxShadow: '0 0 0 3px rgba(0,151,103,0.18)' }} />
        Assessment complete · {turn.confidenceLine}
      </div>

      <div style={{ padding: '32px 28px 24px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.12em', marginBottom: 12 }}>HEADLINE VERDICT</div>
        <h2 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(28px, 3.6vw, 48px)', letterSpacing: '-0.03em',
          lineHeight: 1.05, color: C.text, textWrap: 'balance',
        }}>{turn.headline}</h2>
        <p style={{ margin: '14px 0 0', fontSize: 15, color: C.dim, lineHeight: 1.55, maxWidth: 720, textWrap: 'pretty' }}>
          {turn.rationale}
        </p>
      </div>

      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.12em', marginBottom: 14 }}>DECISION DRIVERS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}` }}>
          {turn.drivers.map((d, i) => (
            <div key={i} style={{ background: C.isDark ? '#111' : '#FFF', padding: '16px 18px', minHeight: 120 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.08em', marginBottom: 8 }}>D.{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: C.text, letterSpacing: '-0.015em', marginBottom: 8 }}>{d.t}</div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55, textWrap: 'pretty' }}>{d.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.12em', marginBottom: 14 }}>DIMENSIONS · 6 ASSESSED</div>
        <div>
          {turn.dimensions.map((d, i) => {
            const grade = gradeShade(d.grade);
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '24px 1.4fr 1fr 1fr',
                gap: 16, padding: '14px 0',
                borderTop: `1px solid ${C.border}`,
                alignItems: 'baseline',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: C.text, letterSpacing: '-0.01em', marginBottom: 4 }}>{d.t}</div>
                  <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55, textWrap: 'pretty' }}>{d.rationale}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: verdictColor(d.verdict), letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{d.verdict}</span>
                  <span style={{ fontSize: 12, color: C.text }}>{d.magnitude}</span>
                </div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    background: grade.bg, color: grade.fg,
                    border: grade.border ? `1px solid ${grade.border}` : 'none',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{d.grade}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.12em', marginBottom: 14 }}>EXPLICIT UNCERTAINTIES</div>
        {turn.uncertainties.map((u, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '24px 1fr', gap: 16,
            padding: '12px 0',
            borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
            alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.08em' }}>U.{String(i+1).padStart(2,'0')}</span>
            <div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5, marginBottom: 4 }}>{u.t}</div>
              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55, textWrap: 'pretty' }}>{u.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, background: C.isDark ? '#0A1612' : '#F1F8F4' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#009767', letterSpacing: '0.12em', marginBottom: 12 }}>HOW TO EXPLAIN THIS</div>
        <p style={{ margin: 0, fontSize: 15, color: C.text, lineHeight: 1.55, textWrap: 'pretty', fontFamily: 'var(--font-display)', fontWeight: 300, letterSpacing: '-0.005em' }}>
          {turn.framing}
        </p>
      </div>

      <div style={{ padding: '20px 28px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted, letterSpacing: '0.12em', marginRight: 8 }}>WHAT NEXT</span>
        {turn.actions.map((a, i) => (
          <button key={a} style={{
            background: i === 0 ? C.text : 'transparent',
            color: i === 0 ? C.bg : C.text,
            border: `1px solid ${i === 0 ? C.text : C.border}`,
            padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{a} →</button>
        ))}
      </div>
    </div>
  );
}

function ContextPanel({ C, context, cursor }) {
  const has = (k) => context[k] !== undefined;

  const rows = [
    { k: 'replacing',     label: 'Material A',       group: 'Substitution' },
    { k: 'withMaterial',  label: 'Material B',       group: 'Substitution' },
    { k: 'element',       label: 'Element',          group: 'Substitution' },
    { k: 'quantity',      label: 'Quantity',         group: 'Substitution' },
    { k: 'jurisdiction',  label: 'Jurisdiction',     group: 'Tier 1' },
    { k: 'typology',      label: 'Typology',         group: 'Tier 1' },
    { k: 'climate',       label: 'Climate zone',     group: 'Tier 1', inferred: true, value: 'Cfb · inferred from NL' },
    { k: 'lifespan',      label: 'Building lifespan', group: 'Tier 2' },
    { k: 'certification', label: 'Certification',    group: 'Tier 2' },
  ];
  const groups = ['Substitution', 'Tier 1', 'Tier 2'];
  const inferredClimate = has('jurisdiction');

  return (
    <div style={{
      padding: '14px 20px 24px',
      background: C.isDark ? '#0A0A0A' : '#FAFAFA',
      display: 'flex', flexDirection: 'column', gap: 16,
      minHeight: 720,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '4px 0 12px', borderBottom: `1px solid ${C.border}`,
      }}>Captured context · live</div>

      {groups.map(g => {
        const groupRows = rows.filter(r => r.group === g);
        return (
          <div key={g}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, color: C.dim,
              letterSpacing: '0.08em', marginBottom: 8,
            }}>{g.toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {groupRows.map(r => {
                const isClimateInferred = r.k === 'climate' && inferredClimate;
                const filled = has(r.k) || isClimateInferred;
                const value = isClimateInferred ? r.value : context[r.k];
                return (
                  <div key={r.k} style={{
                    display: 'grid', gridTemplateColumns: '1fr', gap: 2,
                    padding: '8px 10px',
                    background: filled ? (C.isDark ? '#141414' : '#FFFFFF') : 'transparent',
                    border: `1px solid ${filled ? C.border : 'transparent'}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, color: C.muted,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      display: 'flex', justifyContent: 'space-between',
                    }}>
                      <span>{r.label}</span>
                      {isClimateInferred && <span style={{ color: '#009767' }}>· inferred</span>}
                    </div>
                    <div style={{
                      fontSize: 13, color: filled ? C.text : C.muted,
                      lineHeight: 1.4, textWrap: 'pretty',
                    }}>
                      {filled ? value : <span style={{ opacity: 0.55 }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{
        marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${C.border}`,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: C.muted,
        letterSpacing: '0.06em', lineHeight: 1.5,
      }}>
        Engine asks only what materially changes the verdict. Skipped fields are flagged as uncertainty in the output, never silently estimated.
      </div>
    </div>
  );
}

export { DemoStage };
export default DemoStage;
