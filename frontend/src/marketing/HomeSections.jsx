// ─── Homepage — minimal, ElevenLabs-inspired ──────────────────────────────
import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { EASE, FadeUp } from './Shared.jsx';

const EASE_H = [0.16, 1, 0.3, 1];

// ── Hero ─────────────────────────────────────────────────────────────────
function CinematicHero({ C, onNavigate }) {
  return (
    <section style={{
      position: 'relative', zIndex: 2,
      paddingTop: 200, paddingBottom: 140,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '0 48px', textAlign: 'center' }}>
        <motion.h1 key="h1"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_H }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 8vw, 128px)',
            fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.0,
            color: C.text, margin: '0 auto 40px',
            textWrap: 'balance', maxWidth: 1080,
          }}>
          A contractor wants to change a material — know if it's safe to approve.
        </motion.h1>

        <motion.div key="sub"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE_H }}
          style={{ display: 'flex', flexDirection: 'column', gap: 44, maxWidth: 620, margin: '0 auto', alignItems: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(17px, 1.35vw, 19px)',
            fontWeight: 400, color: C.dim, lineHeight: 1.55, letterSpacing: '-0.005em',
            margin: 0, textWrap: 'pretty',
          }}>
            ræson checks fire safety, insulation, carbon, and durability against Danish and Dutch requirements. Signed verdict in fifteen seconds.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <PrimaryBtn C={C} onClick={() => onNavigate && onNavigate('demo')}>Run the demo</PrimaryBtn>
            <GhostBtn C={C} onClick={() => onNavigate && onNavigate('platform')}>How it works</GhostBtn>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: EASE_H }}
          style={{ marginTop: 120, textAlign: 'left' }}>
          <PreviewFrame C={C} />
        </motion.div>
      </div>
    </section>
  );
}

function PrimaryBtn({ C, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '13px 22px', background: C.text, color: C.bg,
      borderRadius: 999, fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 500,
      letterSpacing: '-0.01em', border: `1px solid ${C.text}`,
      cursor: 'pointer',
    }}>{children}</button>
  );
}
function GhostBtn({ C, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '13px 22px', background: 'transparent', color: C.text,
      borderRadius: 999, fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 500,
      letterSpacing: '-0.01em', border: `1px solid ${C.borderStrong}`,
      cursor: 'pointer',
    }}>{children}</button>
  );
}

// ── Preview (used further down) ──────────────────────────────────────────
function PreviewFrame({ C }) {
  return (
    <div style={{
      position: 'relative', zIndex: 2,
      border: `1px solid ${C.border}`,
      background: C.surface,
      borderRadius: 12, overflow: 'hidden',
      boxShadow: C.isDark ? '0 40px 120px rgba(0,0,0,0.5)' : '0 20px 60px rgba(20,20,20,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: C.muted, letterSpacing: '0.04em' }}>
          ræson · Ørestad 4B
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: C.muted, letterSpacing: '0.08em' }}>
          ASSESSED · 11.4s
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 340 }}>
        <div style={{ padding: 32, borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.dim, fontFamily: 'var(--font-sans)', marginBottom: 16 }}>Request</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: C.text, lineHeight: 1.55, marginBottom: 24 }}>
            Can we use Kingspan K15 100mm in place of Rockwool Frontrock on elevations N/E?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 8, columnGap: 18, fontSize: 12, fontFamily: 'var(--font-mono)', color: C.text }}>
            <span style={{ color: C.muted }}>existing</span><span>Rockwool Frontrock · A1</span>
            <span style={{ color: C.muted }}>proposed</span><span>Kingspan K15 100mm · B-s2,d0</span>
            <span style={{ color: C.muted }}>location</span><span>N/E ventilated rainscreen</span>
          </div>
        </div>

        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.dim, fontFamily: 'var(--font-sans)' }}>Verdict</div>
            <span style={{ padding: '4px 10px', color: C.warn,
              fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
              borderRadius: 999, border: `1px solid ${C.warn}` }}>Conditional</span>
          </div>
          {[
            ['Fire safety', 'pass', 'BR §5-1 met'],
            ['Insulation', 'pass', 'Δ −18% U-value'],
            ['Carbon footprint', 'warn', '+42% kgCO₂e / m²'],
            ['Moisture seal', 'warn', 'check at window edges'],
            ['Durability', 'pass', 'class 2 · 50 yr'],
          ].map(([l, s, d], i) => (
            <div key={l} style={{ display: 'grid', gridTemplateColumns: '8px 1fr auto', gap: 12, alignItems: 'center',
              padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: s === 'pass' ? C.accent : C.warn }} />
              <div>
                <div style={{ fontSize: 13, color: C.text }}>{l}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{d}</div>
              </div>
              <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section helpers ──────────────────────────────────────────────────────
function DisplayH2({ children, style }) {
  return <h2 style={{
    fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5vw, 80px)',
    fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1.05,
    margin: 0, textWrap: 'balance', ...style,
  }}>{children}</h2>;
}

function Eyebrow({ C, children, style }) {
  return <div style={{
    fontFamily: 'var(--font-sans)', fontSize: 13, color: C.dim,
    letterSpacing: '-0.005em', ...style,
  }}>{children}</div>;
}

// ── Problem — single statement, no stat boxes ────────────────────────────
function ProblemSection({ C }) {
  return (
    <section style={{ position: 'relative', zIndex: 2, padding: '220px 48px 180px', borderTop: `1px solid ${C.border}`, background: C.bg }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2.6fr', gap: 120 }}>
        <FadeUp><Eyebrow C={C}>Problem</Eyebrow></FadeUp>
        <FadeUp delay={0.05}>
          <DisplayH2 style={{ color: C.text, maxWidth: 880 }}>
            Every project carries dozens of substitution requests. Each one takes hours to assess, and most end as an email buried in a thread.
          </DisplayH2>
        </FadeUp>
      </div>
    </section>
  );
}

function ProductTease() { return null; }

// ── Flow ─────────────────────────────────────────────────────────────────
function HowItWorks({ C }) {
  const steps = [
    ['01', 'Intake', 'Paste the contractor email or drag in the PDF.'],
    ['02', 'Check', 'Checked against fire, insulation, carbon, and durability requirements.'],
    ['03', 'Verdict', 'Pass, conditional, or fail — with the value measured.'],
    ['04', 'File', 'Signed PDF into the project record.'],
  ];
  return (
    <section style={{ position: 'relative', zIndex: 2, padding: '0 48px 200px', background: C.bg }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.6fr', gap: 120, marginBottom: 80 }}>
          <FadeUp><Eyebrow C={C}>Flow</Eyebrow></FadeUp>
          <FadeUp delay={0.05}>
            <DisplayH2 style={{ color: C.text, maxWidth: 880 }}>
              From email to project file in fifteen seconds.
            </DisplayH2>
          </FadeUp>
        </div>
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {steps.map(([n, t, d], i) => (
            <FadeUp key={n} delay={i * 0.05}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 280px 1fr', gap: 64, padding: '40px 0', borderBottom: `1px solid ${C.border}`, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: C.muted, letterSpacing: '0.12em' }}>{n}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: C.text, letterSpacing: '-0.02em', fontWeight: 400 }}>{t}</span>
                <span style={{ fontSize: 15, color: C.dim, lineHeight: 1.6, maxWidth: 520 }}>{d}</span>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────
function CtaBand({ C, onNavigate }) {
  return (
    <section style={{ position: 'relative', zIndex: 2, borderTop: `1px solid ${C.border}`, padding: '240px 48px', background: C.bg }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <FadeUp>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 7vw, 112px)',
            fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.02,
            color: C.text, margin: '0 0 64px', textWrap: 'balance',
          }}>
            Check your next substitution.
          </h2>
        </FadeUp>
        <FadeUp delay={0.08}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <PrimaryBtn C={C} onClick={() => onNavigate && onNavigate('demo')}>Run the demo</PrimaryBtn>
            <GhostBtn C={C} onClick={() => onNavigate && onNavigate('contact')}>Book a walkthrough</GhostBtn>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function Practices() { return null; }

export { CinematicHero, ProblemSection, ProductTease, HowItWorks, Practices, CtaBand, PreviewFrame, PrimaryBtn, GhostBtn };
