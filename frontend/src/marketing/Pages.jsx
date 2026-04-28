// ─── Secondary pages: Platform, Pricing, About, Journal, Contact ──────────
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FadeUp, ScrollRevealText, Section, SectionLabel, GRAIN_URL, RaesonMark } from './Shared.jsx';
import { CtaBand } from './HomeSections.jsx';

// ── Platform — how it works in depth ──────────────────────────────────────
function PlatformPage({ C, onNavigate }) {
  const capabilities = [
    { n: '01', t: 'Every answer is graded', d: 'Each claim shows how confident the engine is — high, moderate, low, or not enough evidence. When the data is thin, Ræson says so instead of guessing.' },
    { n: '02', t: 'Asks only what it needs', d: 'Three short rounds: what you\'re swapping, where the building is, what the project cares about. Never more than three questions at a time. Skips anything it can look up.' },
    { n: '03', t: 'Checks performance first', d: 'Before anything else, Ræson confirms the new material can do what the old one was specified to do — fire rating, structure, thermal, acoustic, moisture. If it can\'t, the swap stops there.' },
    { n: '04', t: 'Reads your request, then runs the numbers', d: 'You can paste an email, a spec, or a sentence. Ræson works out the materials and element, then runs the checks against published product data and recognised databases.' },
    { n: '05', t: 'Shows its sources', d: 'Every claim links to where the number came from — manufacturer EPD, generic database, or estimate — so an auditor or client can trace any line back to a source.' },
    { n: '06', t: 'A report you can hand over', d: 'Verdict, the two or three things that drive it, dimension-by-dimension breakdown, what\'s still uncertain, and a rephrased version of any claim you want to make. PDF or markdown.' },
  ];

  const dimensions = [
    { t: 'Does it perform?',          d: 'Can the new material do the job the old one was specified for — fire, structure, thermal, acoustic, moisture? Pass or fail. Everything else depends on this.' },
    { t: 'Is it allowed?',            d: 'Building codes, CE marking, banned substances, certification credits (BREEAM, LEED, DGNB), public-tender carbon caps. All checked against your jurisdiction.' },
    { t: 'What\'s the carbon impact?', d: 'Emissions from making the material, with a clear range. Manufacturer data first, recognised databases (Ökobaudat, ecoinvent, INIES, KBOB) second, estimates last — always labelled.' },
    { t: 'Is it healthy indoors?',    d: 'Off-gassing, fibre release, mould risk, comfort. Wellbeing claims only appear when the research actually supports them.' },
    { t: 'Will it last?',             d: 'Expected lifespan with a range, maintenance, how often it needs replacing, what happens at end of life, and any known regulatory risk to the material.' },
    { t: 'Where does it come from?',  d: 'Transport distance, local availability, recycled or bio-based content, and how easily the assembly can be taken apart at the end.' },
  ];

  const rules = [
    'Never give a single number when the real answer is a range. Always show the range.',
    'Never claim a health or wellbeing benefit unless the research clearly supports it for this material, this population, and this use.',
    'Always show whether a number comes from the manufacturer, a database, or an estimate. Never blur them.',
    'Always say what we still don\'t know — and what would change if we knew it.',
    'Always check that the new material can do the job before judging anything else.',
    'When the data is thin, take the cautious view — and tell the user that\'s what we did.',
    'Never call a swap "more sustainable" without saying in what way and how confident we are.',
  ];

  return (
    <div style={{ paddingTop: 140 }}>
      <Section C={C} style={{ paddingTop: 20, paddingBottom: 120 }}>
        <FadeUp><SectionLabel C={C}>The platform</SectionLabel></FadeUp>
        <FadeUp delay={0.05}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 120px)', fontWeight: 300,
            lineHeight: 0.95, letterSpacing: '-0.05em',
            color: C.text, margin: '20px 0 48px', maxWidth: 1100,
          }}>
            An honest answer, <em style={{ fontStyle: 'italic' }}>not a guess.</em>
          </h1>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p style={{ fontSize: 18, color: C.dim, lineHeight: 1.6, maxWidth: 680, textWrap: 'pretty' }}>
            Tell Ræson what you want to swap. It asks a few short questions, checks the swap
            across six dimensions, and gives you a verdict you can defend to a client,
            an auditor, or a tender officer.
          </p>
        </FadeUp>
      </Section>

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

      <Section C={C} style={{ paddingBottom: 140 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
          <div>
            <FadeUp><SectionLabel C={C}>Six questions</SectionLabel></FadeUp>
            <FadeUp delay={0.05}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300,
                lineHeight: 1, letterSpacing: '-0.04em',
                color: C.text, margin: '20px 0 24px',
              }}>Six things we check<br/>on every swap.</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, maxWidth: 360, textWrap: 'pretty', margin: 0 }}>
                Each one gets a clear answer — better, the same, worse, or unclear — with a number where we can defend it and a confidence level always.
              </p>
            </FadeUp>
          </div>
          <div>
            {dimensions.map((d, i) => (
              <motion.div key={d.t}
                initial={{ opacity: 0, x: 8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr',
                  columnGap: 24, rowGap: 8,
                  padding: '24px 0', borderTop: `1px solid ${C.border}`,
                  borderBottom: i === dimensions.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', paddingTop: 8 }}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: C.text, letterSpacing: '-0.015em', marginBottom: 6 }}>{d.t}</div>
                  <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.6, textWrap: 'pretty' }}>{d.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section C={C} style={{ paddingBottom: 140 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
          <div>
            <FadeUp><SectionLabel C={C}>How we stay honest</SectionLabel></FadeUp>
            <FadeUp delay={0.05}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 4.4vw, 60px)', fontWeight: 300,
                lineHeight: 1.05, letterSpacing: '-0.04em',
                color: C.text, margin: '20px 0 24px',
              }}>Seven rules<br/>we don't break.</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, maxWidth: 360, textWrap: 'pretty', margin: 0 }}>
                The promises Ræson makes on every assessment. They're the reason architects can put their name on the report.
              </p>
            </FadeUp>
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', counterReset: 'rule' }}>
            {rules.map((r, i) => (
              <motion.li key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr',
                  columnGap: 24,
                  padding: '20px 0', borderTop: `1px solid ${C.border}`,
                  borderBottom: i === rules.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', paddingTop: 4 }}>R.{String(i+1).padStart(2,'0')}</span>
                <span style={{ fontSize: 16, color: C.text, lineHeight: 1.55, letterSpacing: '-0.01em', textWrap: 'pretty' }}>{r}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </Section>

      <CtaBand C={C} onNavigate={onNavigate} />
    </div>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
function PricingPage({ C, onNavigate }) {
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
                <button onClick={() => onNavigate && onNavigate('contact')} style={{
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

      <CtaBand C={C} onNavigate={onNavigate} />
    </div>
  );
}

// ── About ──────────────────────────────────────────────────────────────────
function AboutPage({ C, onNavigate }) {
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

      <CtaBand C={C} onNavigate={onNavigate} />
    </div>
  );
}

// ── Journal ────────────────────────────────────────────────────────────────
function JournalPage({ C }) {
  const articles = [
    { date: 'Apr 24, 2026', read: '11 min', cat: 'Briefing', t: 'Brussels just rewrote the contract with the built environment', a: 'Sofie Brandt', lede: "EPBD IV, CPR, ESRS E5, ESPR — four files, one new shape. Every component now needs a verifiable origin story, and every substitution a paper trail that survives an audit." },
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

      <Section C={C} style={{ paddingBottom: 120, paddingTop: 0 }}>
        <FadeUp>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48,
            padding: '40px 0',
            borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{
              aspectRatio: '16/10',
              background: `linear-gradient(135deg, ${C.surface} 0%, ${C.bg} 50%, ${C.surface} 100%)`,
              position: 'relative', overflow: 'hidden',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN_URL, backgroundSize: 220, opacity: 0.35, mixBlendMode: 'overlay' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 10, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>COVER · BRIEFING APR 2026</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <SectionLabel C={C}>Featured · {articles[0].cat}</SectionLabel>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 3.4vw, 48px)', fontWeight: 300,
                  lineHeight: 1.1, letterSpacing: '-0.03em',
                  color: C.text, margin: '20px 0 20px',
                }}>{articles[0].t}</h2>
                <p style={{ fontSize: 15, color: C.dim, lineHeight: 1.65, textWrap: 'pretty' }}>
                  {articles[0].lede}
                </p>
              </div>
              <div style={{ marginTop: 32, fontSize: 12, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                {articles[0].date} · {articles[0].read} · {articles[0].a}
              </div>
            </div>
          </div>
        </FadeUp>
      </Section>

      <Section C={C} style={{ paddingBottom: 140, paddingTop: 0 }}>
        <SectionLabel C={C}>Index · ({articles.length})</SectionLabel>
        <div style={{ marginTop: 32 }}>
          {articles.slice(1).map((a, i) => (
            <motion.div key={a.t}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 160px 80px',
                padding: '24px 0', borderTop: `1px solid ${C.border}`,
                alignItems: 'baseline',
                borderBottom: i === articles.length - 2 ? `1px solid ${C.border}` : 'none',
              }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{a.date}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: C.text, letterSpacing: '-0.015em', textWrap: 'pretty' }}>{a.t}</span>
              <span style={{ fontSize: 12, color: C.dim, fontFamily: 'var(--font-mono)' }}>{a.cat}</span>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{a.read}</span>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Contact ────────────────────────────────────────────────────────────────
function ContactPage({ C }) {
  const [submitted, setSubmitted] = useState(false);
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

export { PlatformPage, PricingPage, AboutPage, JournalPage, ContactPage };
