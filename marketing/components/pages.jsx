// ─── Secondary pages: Platform, Pricing, About, Journal, Contact ──────────
const { useState: useStateP, useRef: useRefP } = React;
const { motion: motionP } = window.Motion;

// ── Platform — how it works in depth ──────────────────────────────────────
function PlatformPage({ C }) {
  const capabilities = [
    { n: '01', t: 'Code intelligence', d: 'BR18, BR25 (Denmark) and Bbl (Netherlands) encoded as a deterministic rule set. 65 provisions, updated quarterly.' },
    { n: '02', t: 'Material catalogue', d: '679 products with fire class, lambda, density, A1–A3 carbon, durability rating. 50 named manufacturer products, 594 ÖKOBAUDAT generics.' },
    { n: '03', t: 'LLM parsing', d: 'Claude reads contractor emails, PDFs, or structured input. Extracts products, elements, and project context — never compliance decisions.' },
    { n: '04', t: 'Deterministic engine', d: 'Every check is a direct lookup and comparison. No hallucination on the critical path. Every result traces to a provision and a property.' },
    { n: '05', t: 'Signed PDFs', d: 'Report with firm logo, architect name, timestamped decision. Drops into the project file as a formal record.' },
    { n: '06', t: 'Audit trail', d: 'Every assessment preserved with query, parse, check outputs, and decision. Filterable, exportable, insurer-ready.' },
  ];

  const dimensions = [
    'Fire reaction', 'Fire resistance', 'Thermal performance', 'Carbon A1–A3',
    'Durability class', 'Acoustic transmission', 'Moisture / vapour',
    'Material compatibility', 'Daylight (plan upload)', 'Biophilic quality',
  ];

  return (
    <div style={{ paddingTop: 140 }}>
      {/* Hero */}
      <Section C={C} style={{ paddingTop: 20, paddingBottom: 120 }}>
        <FadeUp><SectionLabel C={C}>The platform</SectionLabel></FadeUp>
        <FadeUp delay={0.05}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 120px)', fontWeight: 300,
            lineHeight: 0.95, letterSpacing: '-0.05em',
            color: C.text, margin: '20px 0 48px', maxWidth: 1100,
          }}>
            Six systems, <em style={{ fontStyle: 'italic' }}>one verdict.</em>
          </h1>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p style={{ fontSize: 18, color: C.dim, lineHeight: 1.6, maxWidth: 680, textWrap: 'pretty' }}>
            Ræson is the result of two years of encoding building codes and curating material data
            so architects get a single, traceable answer to a question they otherwise spend hours on.
          </p>
        </FadeUp>
      </Section>

      {/* Capability grid */}
      <Section C={C} style={{ paddingTop: 0, paddingBottom: 140 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          border: `1px solid ${C.border}`, background: C.border,
        }}>
          {capabilities.map((c, i) => (
            <FadeUp key={c.n} delay={(i%3) * 0.05}>
              <div style={{ background: C.bg, padding: '40px 32px', height: '100%', minHeight: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>{c.n}</span>
                  <RaesonMark size={10} color={C.muted} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24, fontWeight: 400, color: C.text,
                  letterSpacing: '-0.02em', marginBottom: 14,
                }}>{c.t}</div>
                <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.65, textWrap: 'pretty' }}>{c.d}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* Dimensions */}
      <Section C={C} style={{ paddingBottom: 140 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
          <div>
            <FadeUp><SectionLabel C={C}>Dimensions checked</SectionLabel></FadeUp>
            <FadeUp delay={0.05}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300,
                lineHeight: 1, letterSpacing: '-0.04em',
                color: C.text, margin: '20px 0 0',
              }}>Ten checks.<br/>One report.</h2>
            </FadeUp>
          </div>
          <div>
            {dimensions.map((d, i) => (
              <motionP.div key={d}
                initial={{ opacity: 0, x: 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  padding: '20px 0', borderTop: `1px solid ${C.border}`,
                  borderBottom: i === dimensions.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: C.text, letterSpacing: '-0.01em' }}>{d}</span>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>{String(i+1).padStart(2,'0')}</span>
              </motionP.div>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand C={C} />
    </div>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
function PricingPage({ C }) {
  const tiers = [
    { n: 'Atelier', price: '€180', per: '/ month', desc: 'For small practices. Unlimited assessments, one active project at a time, email support.',
      features: ['1 active project', 'Unlimited assessments', 'PDF signed exports', 'DK + NL codes', 'Email support'],
      cta: 'Start · free 14-day trial', highlight: false },
    { n: 'Studio', price: '€420', per: '/ month', desc: 'For growing practices. Unlimited projects, shared records, firm-branded PDFs.',
      features: ['Unlimited projects', 'Firm-branded PDFs', 'Shared assessment history', 'Team seats up to 8', 'Priority support'],
      cta: 'Start · book onboarding', highlight: true },
    { n: 'Practice', price: 'Custom', per: '', desc: 'For 25+ seat practices or agencies with multiple offices. SSO, custom code sets, revit integration early access.',
      features: ['SSO · SAML', 'Custom codes / regions', 'Revit plugin (beta)', 'Dedicated engineer', 'On-prem available'],
      cta: 'Contact us', highlight: false },
  ];

  return (
    <div style={{ paddingTop: 140 }}>
      <Section C={C} style={{ paddingBottom: 80 }}>
        <FadeUp><SectionLabel C={C}>Pricing</SectionLabel></FadeUp>
        <FadeUp delay={0.05}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 120px)', fontWeight: 300,
            lineHeight: 0.95, letterSpacing: '-0.05em',
            color: C.text, margin: '20px 0 48px', maxWidth: 900,
          }}>Priced for the<br/><em style={{ fontStyle: 'italic' }}>time</em> it saves.</h1>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p style={{ fontSize: 17, color: C.dim, lineHeight: 1.6, maxWidth: 620, textWrap: 'pretty' }}>
            An average project runs 45 substitutions. At three hours each, ræson returns its
            Studio license in the first week of any project. Billed monthly, cancel anytime.
          </p>
        </FadeUp>
      </Section>

      <Section C={C} style={{ paddingBottom: 140, paddingTop: 0 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          border: `1px solid ${C.border}`, background: C.border,
        }}>
          {tiers.map((t, i) => (
            <FadeUp key={t.n} delay={i * 0.07}>
              <div style={{
                background: t.highlight ? (C.isDark ? '#141414' : '#FFFFFF') : C.bg,
                padding: '40px 32px 48px', height: '100%', minHeight: 560,
                display: 'flex', flexDirection: 'column',
                position: 'relative',
              }}>
                {t.highlight && <div style={{
                  position: 'absolute', top: 16, right: 16,
                  padding: '4px 10px',
                  background: C.accent, color: '#FFFFFF',
                  fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                }}>most chosen</div>}
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 28,
                  color: C.text, letterSpacing: '-0.02em', marginBottom: 8,
                }}>{t.n}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 300, color: C.text, letterSpacing: '-0.04em', lineHeight: 1 }}>{t.price}</span>
                  <span style={{ fontSize: 13, color: C.dim, fontFamily: 'var(--font-mono)' }}>{t.per}</span>
                </div>
                <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.6, marginBottom: 28, textWrap: 'pretty' }}>{t.desc}</div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 32, flex: 1 }}>
                  {t.features.map(f => (
                    <div key={f} style={{ fontSize: 13, color: C.text, padding: '8px 0', display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span style={{ color: C.accent, fontFamily: 'var(--font-mono)', fontSize: 11 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button style={{
                  padding: '12px 20px',
                  background: t.highlight ? C.text : 'transparent',
                  color: t.highlight ? C.bg : C.text,
                  border: t.highlight ? 'none' : `1px solid ${C.borderStrong}`,
                  borderRadius: 9999, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                }}>{t.cta}</button>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      <CtaBand C={C} />
    </div>
  );
}

// ── About ──────────────────────────────────────────────────────────────────
function AboutPage({ C }) {
  return (
    <div style={{ paddingTop: 140 }}>
      <Section C={C} style={{ paddingBottom: 120 }}>
        <FadeUp><SectionLabel C={C}>About · method</SectionLabel></FadeUp>
        <FadeUp delay={0.05}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 130px)', fontWeight: 300,
            lineHeight: 0.95, letterSpacing: '-0.05em',
            color: C.text, margin: '20px 0 0', maxWidth: 1200,
          }}>
            Evidence, not<br/><em style={{ fontStyle: 'italic' }}>estimation.</em>
          </h1>
        </FadeUp>
      </Section>

      <Section C={C} style={{ paddingBottom: 140, paddingTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
          <FadeUp><SectionLabel C={C}>Why we built it</SectionLabel></FadeUp>
          <div>
            <ScrollRevealText
              text="Material substitution is where good design goes to die. A contractor emails a change. An architect approves under time pressure. Nobody documents the tradeoff. Six months later a defect appears and nobody knows who decided what, based on which code provision, against which property."
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(24px, 2.6vw, 36px)', fontWeight: 300,
                lineHeight: 1.3, letterSpacing: '-0.02em',
                color: C.text, margin: 0, textWrap: 'pretty',
              }}
            />
          </div>
        </div>
      </Section>

      <Section C={C} style={{ paddingBottom: 140, paddingTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
          <FadeUp><SectionLabel C={C}>The principle</SectionLabel></FadeUp>
          <div>
            <FadeUp>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300,
                lineHeight: 1.4, letterSpacing: '-0.02em', color: C.text,
                margin: '0 0 32px', textWrap: 'pretty',
              }}>
                The LLM doesn't decide. It parses the request. It writes the narrative.
                The <em style={{ fontStyle: 'italic' }}>compliance engine</em> — deterministic, auditable,
                traceable — does the actual check.
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p style={{ fontSize: 15, color: C.dim, lineHeight: 1.7, maxWidth: 580, textWrap: 'pretty' }}>
                This is not a matter of preference. Compliance is law. Every conclusion must
                trace back to a specific provision and a specific material property — no
                probabilistic shortcut. That's where the trust comes from.
              </p>
            </FadeUp>
          </div>
        </div>
      </Section>

      {/* Team */}
      <Section C={C} style={{ paddingBottom: 140, paddingTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
          <FadeUp><SectionLabel C={C}>Built by</SectionLabel></FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 48 }}>
            {[
              { n: 'Mette Friis', r: 'Co-founder · research', bio: 'MSc AI, University of Amsterdam. Previously architectural practice at KKLP and Aedile.' },
              { n: 'Sofie Brandt', r: 'Co-founder · product', bio: 'MArch, Royal Danish Academy. Specialised in code consultancy for residential practice.' },
              { n: 'Jonas Vestergaard', r: 'Engineering', bio: 'Compliance engine, ingestion pipelines, and the deterministic check language.' },
              { n: 'Advisor · Ida Lund', r: 'Technical building law', bio: 'Former head of compliance at a top-10 Nordic practice, BR25 working group.' },
            ].map((p, i) => (
              <FadeUp key={p.n} delay={i * 0.06}>
                <div>
                  <div style={{
                    width: '100%', aspectRatio: '1/1',
                    background: `linear-gradient(135deg, ${C.surface} 0%, ${C.bg} 100%)`,
                    border: `1px solid ${C.border}`,
                    marginBottom: 16, position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: GRAIN_URL, backgroundSize: 180,
                      opacity: 0.25, mixBlendMode: 'overlay',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: 16, left: 16,
                      fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
                    }}>PORTRAIT · {p.n.split(' ')[0].toUpperCase()}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: C.text, letterSpacing: '-0.02em' }}>{p.n}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 4, textTransform: 'uppercase' }}>{p.r}</div>
                  <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.6, marginTop: 10, textWrap: 'pretty' }}>{p.bio}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand C={C} />
    </div>
  );
}

// ── Journal ────────────────────────────────────────────────────────────────
function JournalPage({ C }) {
  const articles = [
    { date: 'Apr 2, 2026', read: '12 min', cat: 'Essay', t: 'Why most material substitutions fail at handoff, not specification', a: 'Mette Friis' },
    { date: 'Mar 14, 2026', read: '8 min', cat: 'Method', t: 'The integrity index — how we score what others estimate', a: 'Jonas Vestergaard' },
    { date: 'Feb 28, 2026', read: '15 min', cat: 'Research', t: "Carbon and durability don't trade off. Here's the evidence.", a: 'Sofie Brandt' },
    { date: 'Feb 09, 2026', read: '6 min', cat: 'Note', t: 'BR25 is live. What actually changed for facade assemblies', a: 'Mette Friis' },
    { date: 'Jan 22, 2026', read: '10 min', cat: 'Essay', t: 'The 72 hour problem, and the cost of not documenting it', a: 'Sofie Brandt' },
    { date: 'Jan 05, 2026', read: '9 min', cat: 'Case study', t: 'Ørestad 4B — 142 substitutions, one project file', a: 'Studio Aedile' },
  ];

  return (
    <div style={{ paddingTop: 140 }}>
      <Section C={C} style={{ paddingBottom: 100 }}>
        <FadeUp><SectionLabel C={C}>Journal</SectionLabel></FadeUp>
        <FadeUp delay={0.05}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 130px)', fontWeight: 300,
            lineHeight: 0.95, letterSpacing: '-0.05em',
            color: C.text, margin: '20px 0 0', maxWidth: 1000,
          }}>
            Notes on rigour,<br/><em style={{ fontStyle: 'italic' }}>method,</em> and material.
          </h1>
        </FadeUp>
      </Section>

      {/* Feature */}
      <Section C={C} style={{ paddingBottom: 120, paddingTop: 0 }}>
        <FadeUp>
          <a href="#" style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48,
            textDecoration: 'none', padding: '40px 0',
            borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{
              aspectRatio: '16/10',
              background: `linear-gradient(135deg, ${C.surface} 0%, ${C.bg} 50%, ${C.surface} 100%)`,
              position: 'relative', overflow: 'hidden',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN_URL, backgroundSize: 220, opacity: 0.35, mixBlendMode: 'overlay' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>COVER · ESSAY APR 2026</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <SectionLabel C={C}>Featured · Essay</SectionLabel>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 3.4vw, 48px)', fontWeight: 300,
                  lineHeight: 1.1, letterSpacing: '-0.03em',
                  color: C.text, margin: '20px 0 20px',
                }}>{articles[0].t}</h2>
                <p style={{ fontSize: 15, color: C.dim, lineHeight: 1.65, textWrap: 'pretty' }}>
                  Ninety percent of substitutions are decided correctly at specification. They still
                  fail. The failure mode is almost never technical — it's documentation. A field study.
                </p>
              </div>
              <div style={{ marginTop: 32, fontSize: 12, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                {articles[0].date} · {articles[0].read} · {articles[0].a}
              </div>
            </div>
          </a>
        </FadeUp>
      </Section>

      {/* Index */}
      <Section C={C} style={{ paddingBottom: 140, paddingTop: 0 }}>
        <SectionLabel C={C}>Index · ({articles.length})</SectionLabel>
        <div style={{ marginTop: 32 }}>
          {articles.slice(1).map((a, i) => (
            <motionP.a key={a.t} href="#"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 160px 80px',
                padding: '24px 0', borderTop: `1px solid ${C.border}`,
                alignItems: 'baseline', textDecoration: 'none',
                borderBottom: i === articles.length - 2 ? `1px solid ${C.border}` : 'none',
              }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{a.date}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: C.text, letterSpacing: '-0.015em', textWrap: 'pretty' }}>{a.t}</span>
              <span style={{ fontSize: 12, color: C.dim, fontFamily: 'var(--font-mono)' }}>{a.cat}</span>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{a.read}</span>
            </motionP.a>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Contact ────────────────────────────────────────────────────────────────
function ContactPage({ C }) {
  const [submitted, setSubmitted] = useStateP(false);
  return (
    <div style={{ paddingTop: 140 }}>
      <Section C={C} style={{ paddingBottom: 120 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
          <div>
            <FadeUp><SectionLabel C={C}>Contact</SectionLabel></FadeUp>
            <FadeUp delay={0.05}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(52px, 7vw, 110px)', fontWeight: 300,
                lineHeight: 0.95, letterSpacing: '-0.05em',
                color: C.text, margin: '20px 0 48px',
              }}>
                Talk to the <em style={{ fontStyle: 'italic' }}>studio.</em>
              </h1>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p style={{ fontSize: 16, color: C.dim, lineHeight: 1.6, maxWidth: 420, marginBottom: 40, textWrap: 'pretty' }}>
                Bring a substitution you're currently working through. We'll walk you through
                ræson with your own scenario — and answer anything about method, pricing, or integration.
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginTop: 32 }}>
                {[
                  ['Copenhagen', 'Sølvgade 38, 1307 · DK'],
                  ['Amsterdam', 'Herengracht 124, 1015 · NL'],
                  ['General', 'studio@raeson.app'],
                  ['Press', 'press@raeson.app'],
                ].map(([l, v]) => (
                  <div key={l} style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr',
                    padding: '14px 0', borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</span>
                    <span style={{ fontSize: 14, color: C.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          <FadeUp delay={0.1}>
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }}
              style={{
                border: `1px solid ${C.border}`,
                padding: 40,
                background: C.isDark ? '#101010' : '#FFFFFF',
              }}>
              {submitted ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: C.text, letterSpacing: '-0.02em', marginBottom: 16 }}>Received.</div>
                  <div style={{ fontSize: 14, color: C.dim, maxWidth: 320, margin: '0 auto' }}>We'll reply from studio@raeson.app within one working day.</div>
                </div>
              ) : (
                <>
                  <SectionLabel C={C}>Book a walkthrough</SectionLabel>
                  <div style={{ marginTop: 28 }}>
                    {[
                      ['Name', 'text', 'Mette Friis'],
                      ['Practice', 'text', 'Studio Aedile'],
                      ['Email', 'email', 'you@practice.com'],
                    ].map(([l, t, ph]) => (
                      <div key={l} style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{l}</label>
                        <input type={t} placeholder={ph} required style={{
                          width: '100%', padding: '10px 0', background: 'transparent',
                          border: 'none', borderBottom: `1px solid ${C.border}`,
                          color: C.text, fontSize: 15, fontFamily: 'inherit', outline: 'none',
                        }} />
                      </div>
                    ))}
                    <div style={{ marginBottom: 28 }}>
                      <label style={{ display: 'block', fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>A substitution you're working on</label>
                      <textarea rows={4} placeholder="Paste a contractor request, or describe a current scenario…" required style={{
                        width: '100%', padding: '10px 0', background: 'transparent',
                        border: 'none', borderBottom: `1px solid ${C.border}`,
                        color: C.text, fontSize: 15, fontFamily: 'inherit', outline: 'none',
                        resize: 'vertical',
                      }} />
                    </div>
                    <button type="submit" style={{
                      padding: '14px 28px', background: C.text, color: C.bg,
                      border: 'none', borderRadius: 9999, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                      width: '100%',
                    }}>Send request →</button>
                  </div>
                </>
              )}
            </form>
          </FadeUp>
        </div>
      </Section>
    </div>
  );
}

Object.assign(window, { PlatformPage, PricingPage, AboutPage, JournalPage, ContactPage });
