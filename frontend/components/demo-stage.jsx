// ─── Demo: full-screen interactive walkthrough of one substitution ─────────
const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;
const { motion: motionD, AnimatePresence: APD } = window.Motion;

function DemoStage({ C, tweaks }) {
  const [step, setStep] = useStateD(0);
  const [dragOver, setDragOver] = useStateD(false);

  const steps = [
    { key: 'intake',   title: 'Intake', label: '01' },
    { key: 'parse',    title: 'Parse',  label: '02' },
    { key: 'check',    title: 'Check',  label: '03' },
    { key: 'verdict',  title: 'Verdict', label: '04' },
    { key: 'file',     title: 'File',   label: '05' },
  ];

  const advance = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const reset = () => setStep(0);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 80, position: 'relative' }}>
      {/* Top header band */}
      <div style={{
        maxWidth: 1440, margin: '0 auto', padding: '0 32px 40px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, color: C.dim, fontFamily: 'var(--font-sans)', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span aria-hidden style={{ width: 18, height: 1, background: 'currentColor', opacity: 0.35 }} />
            Live demonstration — no login
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(42px, 5vw, 72px)', fontWeight: 300,
            letterSpacing: '-0.04em', lineHeight: 1,
            color: C.text, margin: 0,
          }}>Run one substitution.<br/>Watch it <em style={{ fontStyle: 'italic' }}>resolve.</em></h1>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: C.dim, fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
          Scenario<br/>
          <span style={{ color: C.text }}>Ørestad / 4B</span><br/>
          Facade insulation
        </div>
      </div>

      {/* Progress rail */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px', marginBottom: 40 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 8,
        }}>
          {steps.map((s, i) => (
            <button key={s.key} onClick={() => setStep(i)} style={{
              textAlign: 'left', background: 'none', padding: '12px 0 10px',
              borderTop: `2px solid ${i <= step ? C.text : C.border}`,
              borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.3s',
            }}>
              <div style={{ fontSize: 10, color: i === step ? C.text : C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{s.label}</div>
              <div style={{ fontSize: 14, color: i <= step ? C.text : C.dim, marginTop: 4, letterSpacing: '-0.01em' }}>{s.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stage surface */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px' }}>
        <div style={{
          background: C.isDark ? '#101010' : '#FFFFFF',
          border: `1px solid ${C.border}`,
          minHeight: 640,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <APD mode="wait">
            {step === 0 && <IntakeStage key="intake" C={C} onNext={advance} />}
            {step === 1 && <ParseStage key="parse" C={C} onNext={advance} />}
            {step === 2 && <CheckStage key="check" C={C} onNext={advance} />}
            {step === 3 && <VerdictStage key="verdict" C={C} onNext={advance} />}
            {step === 4 && <FileStage key="file" C={C} onReset={reset} />}
          </APD>
        </div>

        {/* Stage nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 12, fontFamily: 'var(--font-mono)', color: C.dim, letterSpacing: '0.05em' }}>
          <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0} style={{
            background: 'none', border: 'none', color: step === 0 ? C.muted : C.dim, cursor: step === 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12,
          }}>← previous</button>
          <span>{String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
          <button onClick={advance} disabled={step === steps.length - 1} style={{
            background: 'none', border: 'none', color: step === steps.length - 1 ? C.muted : C.text, cursor: step === steps.length - 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12,
          }}>next →</button>
        </div>
      </div>
    </div>
  );
}

const stageFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

// ── Stage 1 — Intake ──────────────────────────────────────────────────────
function IntakeStage({ C, onNext }) {
  const [dragOver, setDragOver] = useStateD(false);
  const [sent, setSent] = useStateD(false);

  return (
    <motionD.div {...stageFade} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 640 }}>
      <div style={{ padding: 48, borderRight: `1px solid ${C.border}` }}>
        <SectionLabel C={C}>Contractor email · received 09:47</SectionLabel>
        <div style={{
          marginTop: 24,
          border: `1px solid ${C.border}`,
          padding: 24,
          background: C.isDark ? '#0A0A0A' : '#F5F4EF',
          fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.75, color: C.dim,
        }}>
          <div style={{ paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid ${C.border}`, color: C.text }}>
            <div>From: m.jensen@njalbyg.dk</div>
            <div>To: mf@studio-aedile.dk</div>
            <div>Subject: Substitution · Ørestad 4B · facade insulation</div>
          </div>
          <p style={{ margin: 0, color: C.text }}>Hej Mette,</p>
          <p style={{ margin: '10px 0' }}>Vi har svært ved at skaffe Rockwool Frontrock MAX E 150 mm til facaden på Ørestad 4B — leveringstid er 9 uger.</p>
          <p style={{ margin: '10px 0' }}>Foreslår i stedet <span style={{ color: C.text }}>Kingspan Kooltherm K15 120 mm</span>. Har du mulighed for at vurdere inden fredag?</p>
          <p style={{ margin: '10px 0' }}>Mvh.<br/>Morten — NJAL Byg</p>
        </div>
      </div>

      <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <SectionLabel C={C}>Drop into ræson</SectionLabel>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 300, color: C.text,
            lineHeight: 1.25, letterSpacing: '-0.02em',
            margin: '16px 0 40px', textWrap: 'pretty',
          }}>
            Ræson reads the email, identifies the specified and proposed products, and infers the building element from context.
          </p>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); setSent(true); }}
            onClick={() => setSent(true)}
            style={{
              border: `1px dashed ${dragOver ? C.text : C.borderStrong}`,
              padding: '48px 24px', textAlign: 'center',
              background: dragOver ? (C.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : 'transparent',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 8 }}>Drop the email or PDF here</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)' }}>or click to use the sample above</div>
          </div>

          {sent && (
            <motionD.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{
                marginTop: 20, padding: '12px 16px',
                background: C.isDark ? 'rgba(0,151,103,0.08)' : 'rgba(0,122,82,0.08)',
                border: `1px solid ${C.accent}40`,
                fontSize: 12, color: C.accent, fontFamily: 'var(--font-mono)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
              <span>✓ Document received · 2.1 KB · .eml</span>
              <span style={{ color: C.dim }}>0.3 s</span>
            </motionD.div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onNext} disabled={!sent} style={{
            padding: '12px 24px',
            background: sent ? C.text : 'transparent',
            color: sent ? C.bg : C.muted,
            border: sent ? 'none' : `1px solid ${C.border}`,
            borderRadius: 9999, fontSize: 13, fontWeight: 500,
            cursor: sent ? 'pointer' : 'default',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            transition: 'all 0.2s',
          }}>Parse this request →</button>
        </div>
      </div>
    </motionD.div>
  );
}

// ── Stage 2 — Parse ───────────────────────────────────────────────────────
function ParseStage({ C, onNext }) {
  const [done, setDone] = useStateD(false);
  useEffectD(() => {
    const t = setTimeout(() => setDone(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const fields = [
    ['Specified product', 'Rockwool Frontrock MAX E 150 mm', 420],
    ['Proposed product', 'Kingspan Kooltherm K15 120 mm', 760],
    ['Building element', 'Facade insulation', 1100],
    ['Project reference', 'Ørestad 4B', 1400],
    ['Jurisdiction', 'Denmark · BR25', 1680],
    ['Building class', 'klasse 2 · etageboliger', 1920],
  ];

  return (
    <motionD.div {...stageFade} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 640 }}>
      <div style={{ padding: 48, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <SectionLabel C={C}>LLM parse · claude-sonnet</SectionLabel>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 300, color: C.text,
            lineHeight: 1.25, letterSpacing: '-0.02em',
            margin: '16px 0 40px',
          }}>
            Claude extracts structured fields. Then the engine takes over — no LLM on the compliance path.
          </p>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: C.dim, lineHeight: 1.9 }}>
            <ThinkingLine active={!done} C={C}>▸ reading document…</ThinkingLine>
            <ThinkingLine active={!done} C={C} delay={600}>▸ identifying products…</ThinkingLine>
            <ThinkingLine active={!done} C={C} delay={1200}>▸ matching to catalogue…</ThinkingLine>
            <ThinkingLine active={!done} C={C} delay={1800}>▸ inferring project context…</ThinkingLine>
            {done && <div style={{ color: C.accent, marginTop: 8 }}>✓ parse complete · 2.4 s</div>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onNext} disabled={!done} style={{
            padding: '12px 24px',
            background: done ? C.text : 'transparent',
            color: done ? C.bg : C.muted,
            border: done ? 'none' : `1px solid ${C.border}`,
            borderRadius: 9999, fontSize: 13, fontWeight: 500,
            cursor: done ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}>Run compliance checks →</button>
        </div>
      </div>

      <div style={{ padding: 48 }}>
        <SectionLabel C={C}>Structured fields</SectionLabel>
        <div style={{ marginTop: 28 }}>
          {fields.map(([label, value, delay], i) => (
            <motionD.div key={label}
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: delay/1000, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'grid', gridTemplateColumns: '160px 1fr',
                padding: '16px 0', borderBottom: `1px solid ${C.border}`,
                alignItems: 'baseline',
              }}>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontSize: 14, color: C.text, letterSpacing: '-0.01em' }}>{value}</span>
            </motionD.div>
          ))}
        </div>
      </div>
    </motionD.div>
  );
}

function ThinkingLine({ children, active, C, delay = 0 }) {
  const [show, setShow] = useStateD(false);
  useEffectD(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return (
    <motionD.div
      initial={{ opacity: 0 }} animate={{ opacity: active ? [0.4, 1, 0.4] : 1 }}
      transition={{ duration: 1.4, repeat: active ? Infinity : 0 }}
    >{children}</motionD.div>
  );
}

// ── Stage 3 — Compliance Check ────────────────────────────────────────────
function CheckStage({ C, onNext }) {
  const checks = [
    { name: 'Fire reaction — BR25 §5.1.4', status: 'pass', note: 'B-s2,d0 ≥ B-s1,d0', ms: 600 },
    { name: 'Fire resistance — BR25 §5.2.3', status: 'pass', note: 'EI 60 maintained', ms: 900 },
    { name: 'Thermal — BR25 §11.3.1', status: 'pass', note: 'U = 0.17 W/m²K', ms: 1200 },
    { name: 'Carbon A1-A3 — BR25 §12.2', status: 'warn', note: '+42% vs. specified', ms: 1500 },
    { name: 'Durability — BR25 §4.3', status: 'pass', note: 'Class 2 · 50 yr', ms: 1900 },
    { name: 'Material compatibility', status: 'warn', note: 'verify vapour junction', ms: 2300 },
    { name: 'Acoustic transmission', status: 'pass', note: 'R\u02B9w = 48 dB', ms: 2700 },
    { name: 'Moisture risk', status: 'pass', note: 'sd-value within range', ms: 3100 },
  ];
  const [running, setRunning] = useStateD(0);
  const [allDone, setAllDone] = useStateD(false);
  useEffectD(() => {
    const t = setTimeout(() => setAllDone(true), 3400);
    return () => clearTimeout(t);
  }, []);

  return (
    <motionD.div {...stageFade} style={{ padding: 48, minHeight: 640, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
        <div>
          <SectionLabel C={C}>Compliance engine · deterministic</SectionLabel>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32, fontWeight: 300, color: C.text,
            lineHeight: 1.2, letterSpacing: '-0.02em',
            margin: '16px 0 0', maxWidth: 720, textWrap: 'pretty',
          }}>
            Eight deterministic checks. Each traces to a specific BR25 provision and a measured material property. No probabilistic step — the LLM never decides.
          </p>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: C.dim,
          textAlign: 'right', lineHeight: 1.8, minWidth: 160,
        }}>
          engine v0.9.2<br/>
          catalog #20240412<br/>
          <span style={{ color: allDone ? C.accent : C.dim }}>{allDone ? '✓ ready · 3.4 s' : '▸ running'}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {checks.slice(0, 4).map((c, i) => <CheckRow key={c.name} c={c} C={C} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {checks.slice(4).map((c, i) => <CheckRow key={c.name} c={c} C={C} />)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
        <button onClick={onNext} disabled={!allDone} style={{
          padding: '12px 24px',
          background: allDone ? C.text : 'transparent',
          color: allDone ? C.bg : C.muted,
          border: allDone ? 'none' : `1px solid ${C.border}`,
          borderRadius: 9999, fontSize: 13, fontWeight: 500,
          cursor: allDone ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}>View the verdict →</button>
      </div>
    </motionD.div>
  );
}

function CheckRow({ c, C }) {
  const [revealed, setRevealed] = useStateD(false);
  useEffectD(() => {
    const t = setTimeout(() => setRevealed(true), c.ms);
    return () => clearTimeout(t);
  }, [c.ms]);
  const color = c.status === 'pass' ? C.accent : c.status === 'warn' ? C.warn : C.fail;
  return (
    <motionD.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: revealed ? 1 : 0.3, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'grid', gridTemplateColumns: '10px 1fr auto', gap: 14, alignItems: 'center',
        padding: '18px 16px',
        borderTop: `1px solid ${C.border}`,
        background: C.bg,
      }}
    >
      <motionD.div
        animate={revealed ? { scale: [0, 1.4, 1] } : { scale: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: 8, height: 8, borderRadius: '50%', background: color }}
      />
      <div>
        <div style={{ fontSize: 13, color: C.text }}>{c.name}</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{c.note}</div>
      </div>
      <span style={{ fontSize: 10, color, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
        {c.status === 'pass' ? 'pass' : c.status === 'warn' ? 'note' : 'fail'}
      </span>
    </motionD.div>
  );
}

// ── Stage 4 — Verdict ─────────────────────────────────────────────────────
function VerdictStage({ C, onNext }) {
  return (
    <motionD.div {...stageFade} style={{ padding: '48px 48px 48px', minHeight: 640, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <SectionLabel C={C}>Verdict</SectionLabel>
          <div style={{ marginTop: 24 }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: C.isDark ? 'rgba(212,160,23,0.12)' : 'rgba(163,109,0,0.08)',
              color: C.warn,
              border: `1px solid ${C.warn}40`,
              fontSize: 12, fontFamily: 'var(--font-mono)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              marginBottom: 24,
            }}>Conditional acceptance</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 300,
              lineHeight: 1.1, letterSpacing: '-0.03em',
              color: C.text, margin: '0 0 24px',
            }}>
              Acceptable <em style={{ fontStyle: 'italic' }}>if</em> carbon budget and vapour junction are addressed.
            </h2>
            <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.7, maxWidth: 460, textWrap: 'pretty' }}>
              Kingspan K15 meets fire, thermal, durability and acoustic requirements under BR25.
              Carbon intensity is 42% higher than the specified mineral wool — within the project's
              current LCA budget but flagged. Install detail 4.2 requires a revised vapour barrier
              termination at the window reveal.
            </p>
          </div>
        </div>
        <div>
          <SectionLabel C={C} style={{ display: 'block', marginBottom: 12 }}>Recommended action</SectionLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={{
              padding: '10px 18px', background: C.accent, color: '#FFFFFF',
              border: 'none', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
            }}>Approve with conditions</button>
            <button style={{
              padding: '10px 18px', background: 'transparent', color: C.text,
              border: `1px solid ${C.borderStrong}`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
            }}>Request more info</button>
            <button style={{
              padding: '10px 18px', background: 'transparent', color: C.dim,
              border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
            }}>Reject</button>
          </div>
        </div>
      </div>

      <div>
        <VerdictCard C={C} />
      </div>
    </motionD.div>
  );
}

// ── Stage 5 — File ────────────────────────────────────────────────────────
function FileStage({ C, onReset }) {
  return (
    <motionD.div {...stageFade} style={{ padding: 48, minHeight: 640, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48 }}>
      <div>
        <SectionLabel C={C}>Project file · Ørestad 4B</SectionLabel>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 300,
          lineHeight: 1.1, letterSpacing: '-0.03em',
          color: C.text, margin: '16px 0 32px',
        }}>
          Signed, dated, and filed.
        </h2>
        <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.7, maxWidth: 460, marginBottom: 32, textWrap: 'pretty' }}>
          The assessment is saved to the project file and a signed PDF is generated — with the firm's
          logo, the architect's name, and the exact code citations. The contractor receives a
          response draft they can reply to.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ padding: '10px 16px', background: C.text, color: C.bg, border: 'none', borderRadius: 9999, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>↓ Download PDF</button>
          <button onClick={onReset} style={{ padding: '10px 16px', background: 'transparent', color: C.text, border: `1px solid ${C.borderStrong}`, borderRadius: 9999, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>↻ Run another</button>
        </div>
      </div>

      <FakePdfPreview C={C} />
    </motionD.div>
  );
}

function FakePdfPreview({ C }) {
  return (
    <motionD.div
      initial={{ opacity: 0, y: 20, rotate: 1 }}
      animate={{ opacity: 1, y: 0, rotate: -0.8 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      style={{
        background: '#FFFFFF', color: '#0A0A0A',
        padding: '40px 44px',
        minHeight: 500,
        boxShadow: '0 40px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RaesonMark size={12} color="#0A0A0A" />
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.02em' }}>ræson</span>
        </div>
        <div style={{ fontSize: 9, color: '#666', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          ASSESSMENT #AM-0412 · 12 APR 2026
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #ddd', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Substitution Assessment</div>
        <div style={{ fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Facade insulation<br/>Rockwool Frontrock → Kingspan K15</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Project</div>
          <div>Ørestad Housing Block 4B</div>
          <div style={{ color: '#555' }}>klasse 2 · etageboliger · Copenhagen</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Architect</div>
          <div>M. Friis — Studio Aedile</div>
          <div style={{ color: '#555' }}>Signed · 12 Apr 2026 14:22 CET</div>
        </div>
      </div>

      <div style={{
        padding: '8px 12px', background: '#FDF6E3', border: '1px solid #E8D794',
        color: '#7A5500', fontSize: 10, marginBottom: 18,
      }}>
        <strong>CONDITIONAL</strong> — acceptable if carbon offset and vapour junction detail 4.2 revised.
      </div>

      <div style={{ fontSize: 9 }}>
        {[
          ['Fire reaction · BR25 §5.1.4', 'PASS'],
          ['Thermal · BR25 §11.3.1', 'PASS'],
          ['Carbon · BR25 §12.2', 'NOTE'],
          ['Durability · BR25 §4.3', 'PASS'],
          ['Material compatibility', 'NOTE'],
        ].map(([l, s]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <span>{l}</span>
            <span style={{
              fontWeight: 500,
              color: s === 'PASS' ? '#007a52' : s === 'NOTE' ? '#a36d00' : '#c12a2e',
              letterSpacing: '0.06em',
            }}>{s}</span>
          </div>
        ))}
      </div>
    </motionD.div>
  );
}

Object.assign(window, { DemoStage });
