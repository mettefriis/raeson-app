import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const C = {
  bg:     '#141414',
  text:   '#FFFFFF',
  dim:    'rgba(255,255,255,0.5)',
  muted:  'rgba(255,255,255,0.28)',
  border: 'rgba(255,255,255,0.1)',
}

const VERDICT_COLOR = { Accepted: '#4ade80', Conditional: '#fbbf24', Fail: '#f87171' }

// ─── Scroll-reveal word ───────────────────────────────────────────────────────
function Word({ word, progress, start, end }) {
  const opacity = useTransform(progress, [start, end], [0.1, 1])
  return <motion.span style={{ opacity, display: 'inline' }}>{word}{' '}</motion.span>
}

function ScrollRevealText({ text, style }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'center 0.25'] })
  const words = text.split(' ')
  return (
    <p ref={ref} style={style}>
      {words.map((word, i) => (
        <Word key={i} word={word} progress={scrollYProgress}
          start={i / words.length} end={(i + 1) / words.length} />
      ))}
    </p>
  )
}

function FadeUp({ children, delay = 0, style }) {
  return (
    <motion.div style={style}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

// ─── Grain background — dark whole page ──────────────────────────────────────
function GrainBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#141414' }}>
      <motion.div
        animate={{ x: [0, -18, 12, 0], y: [0, 20, -14, 0], scale: [1, 1.05, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '80vw', height: '80vh', borderRadius: '50%',
          background: 'radial-gradient(ellipse at 35% 45%, rgba(6,6,6,0.95) 0%, transparent 65%)',
          top: 0, left: 0,
        }}
      />
      <motion.div
        animate={{ x: [0, 16, -10, 0], y: [0, -12, 18, 0], scale: [1, 0.96, 1.07, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        style={{
          position: 'absolute', width: '65vw', height: '65vh', borderRadius: '50%',
          background: 'radial-gradient(ellipse at 65% 60%, rgba(28,28,28,0.88) 0%, transparent 60%)',
          bottom: '-10%', right: '-10%',
        }}
      />
      <div style={{
        position: 'absolute', inset: '-100px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
        opacity: 0.28,
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
      }} />
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ onEnter }) {
  const { scrollY } = useScroll()
  const logoScale = useTransform(scrollY, [0, 120], [1, 0.8])

  return (
    <motion.header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'transparent' }}>
      <nav style={{
        maxWidth: 1200, margin: '0 auto', padding: '28px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <motion.span style={{
          scale: logoScale, transformOrigin: 'left center',
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
          color: C.text, letterSpacing: '-0.03em', display: 'block',
        }}>
          ræson
        </motion.span>

        <div style={{ display: 'flex', gap: 36 }}>
          {['Platform', 'Pricing', 'About'].map(link => (
            <span key={link} style={{
              fontSize: 13, color: C.dim, cursor: 'pointer', letterSpacing: '-0.01em',
              transition: 'color 0.15s',
            }}
              onMouseOver={e => e.target.style.color = C.text}
              onMouseOut={e => e.target.style.color = C.dim}
            >{link}</span>
          ))}
        </div>

        <button onClick={onEnter} style={{
          padding: '7px 20px', background: 'transparent',
          color: C.text, fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em',
          border: '1px solid rgba(255,255,255,0.28)', borderRadius: 4,
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}
          onMouseOver={e => e.currentTarget.style.borderColor = C.text}
          onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'}
        >
          Contact
        </button>
      </nav>
    </motion.header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onEnter }) {
  return (
    <section style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '0 40px 68px',
      maxWidth: 1200, margin: '0 auto',
    }}>
      {/* Light gradient — right half, creates the dark/light split */}
      <motion.div
        animate={{ x: [0, 22, -12, 0], y: [0, -18, 22, 0], scale: [1, 0.95, 1.08, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          position: 'absolute', top: 0, right: '-15%', width: '70vw', height: '100%',
          background: 'radial-gradient(ellipse at 70% 48%, rgba(185,185,185,0.4) 0%, rgba(130,130,130,0.15) 45%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />
      {/* Bright focal glow at the meeting point */}
      <motion.div
        animate={{ x: [0, 16, -10, 0], y: [0, -10, 18, 0], scale: [1, 1.14, 0.90, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{
          position: 'absolute', width: '20vw', height: '32vh',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.55) 25%, rgba(255,255,255,0.15) 55%, transparent 70%)',
          top: '28%', left: '53%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: 68, right: 40, zIndex: 1 }}>
        <span style={{ fontSize: 12, color: C.muted, letterSpacing: '0.05em' }}>(Scroll)</span>
      </div>

      {/* Main statement */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 3.8vw, 52px)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          color: C.text,
          maxWidth: 680,
          margin: 0,
          position: 'relative', zIndex: 1,
        }}
      >
        ræson is a material intelligence platform built for architectural practices who need rigour, not instinct, when a substitution is on the table.
      </motion.p>
    </section>
  )
}

// ─── About band ───────────────────────────────────────────────────────────────
function AboutBand() {
  return (
    <section style={{
      padding: '120px 40px',
      maxWidth: 1200, margin: '0 auto',
      borderTop: `1px solid ${C.border}`,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
        <FadeUp>
          <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            About ræson
          </span>
        </FadeUp>
        <div>
          <ScrollRevealText
            text="ræson evaluates material substitutions across carbon, durability, compatibility, and wellbeing — giving architectural practices the evidence to specify with confidence."
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 2.6vw, 34px)',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              color: C.text,
              margin: '0 0 32px',
              fontWeight: 600,
            }}
          />
          <FadeUp delay={0.1}>
            <button style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 13, color: C.dim, cursor: 'pointer',
              letterSpacing: '-0.01em',
              textDecoration: 'underline', textUnderlineOffset: 4,
            }}>
              Read the method →
            </button>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}

// ─── Cases ────────────────────────────────────────────────────────────────────
const CASES = [
  { name: 'Nordic Museum',            detail: 'Timber facade substitution',  verdict: 'Accepted' },
  { name: 'Project Stockholm_04',     detail: 'Acetylated wood proposal',     verdict: 'Conditional' },
  { name: 'Copenhagen Port Pavilion', detail: 'Recycled aluminium cladding',  verdict: 'Accepted' },
  { name: 'Aedile Bergen',            detail: 'Stone composite assessment',   verdict: 'Fail' },
  { name: 'Urban KKLP',               detail: 'Structural glazing review',    verdict: 'Accepted' },
]

function Cases() {
  return (
    <section style={{ padding: '0 40px 120px', maxWidth: 1200, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
      <FadeUp>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '48px 0 32px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', color: C.text }}>
            Cases
          </span>
          <span style={{ fontSize: 13, color: C.muted }}>(5)</span>
        </div>
      </FadeUp>
      <FadeUp delay={0.05}>
        <p style={{ fontSize: 15, color: C.dim, marginBottom: 48, letterSpacing: '-0.01em', maxWidth: 480 }}>
          Every substitution has consequences.<br />These practices chose evidence over assumption.
        </p>
      </FadeUp>
      <div>
        {CASES.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 15, color: C.text, letterSpacing: '-0.02em' }}>{c.name}</span>
            <span style={{ fontSize: 13, color: C.dim, flex: 1, marginLeft: 40 }}>{c.detail}</span>
            <span style={{ fontSize: 11, color: VERDICT_COLOR[c.verdict] || C.dim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {c.verdict}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── Index ────────────────────────────────────────────────────────────────────
const INDEX_ROWS = [
  { project: 'Nordic Museum, Oslo',       material: 'Timber cladding',    verdict: 'Accepted' },
  { project: 'Project Stockholm_04',      material: 'Acetylated wood',    verdict: 'Conditional' },
  { project: 'Copenhagen Port Pavilion',  material: 'Recycled aluminium', verdict: 'Accepted' },
  { project: 'Aedile Bergen',             material: 'Stone composite',    verdict: 'Fail' },
  { project: 'Urban KKLP',               material: 'Structural glazing',  verdict: 'Accepted' },
  { project: 'Harbour Arts Centre',       material: 'Exposed concrete',   verdict: 'Conditional' },
  { project: 'Marienplatz Offices',       material: 'Cork insulation',    verdict: 'Accepted' },
  { project: 'East Bridge Cultural Hub',  material: 'Reclaimed brick',    verdict: 'Accepted' },
]

function IndexSection() {
  return (
    <section style={{ padding: '0 40px 120px', maxWidth: 1200, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
      <FadeUp>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '48px 0 40px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', color: C.text }}>
            index
          </span>
        </div>
      </FadeUp>
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px',
          padding: '0 0 12px', borderBottom: `1px solid ${C.border}`,
          fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <span>Project</span><span>Material</span><span>Verdict</span><span style={{ textAlign: 'right' }}>Year</span>
        </div>
        {INDEX_ROWS.map((row, i) => (
          <motion.div
            key={row.project}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px',
              padding: '16px 0', borderBottom: `1px solid ${C.border}`,
              fontSize: 13, color: C.dim,
            }}
          >
            <span style={{ color: C.text, letterSpacing: '-0.01em' }}>{row.project}</span>
            <span>{row.material}</span>
            <span style={{ color: VERDICT_COLOR[row.verdict] || C.dim }}>{row.verdict}</span>
            <span style={{ textAlign: 'right', color: C.muted }}>2025</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── Journal ──────────────────────────────────────────────────────────────────
const ARTICLES = [
  { date: 'Apr 2, 2026',  title: 'Why most material substitutions fail at handoff, not specification' },
  { date: 'Mar 14, 2026', title: 'The integrity index: how we score what others estimate' },
  { date: 'Feb 28, 2026', title: 'Carbon and durability don\'t trade off. Here\'s the evidence.' },
]

function Journal() {
  return (
    <section style={{ padding: '0 40px 120px', maxWidth: 1200, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
      <FadeUp>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '48px 0 32px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', color: C.text }}>
            Journal
          </span>
          <span style={{ fontSize: 13, color: C.muted }}>(6)</span>
        </div>
      </FadeUp>
      <FadeUp delay={0.05}>
        <p style={{ fontSize: 15, color: C.dim, marginBottom: 48, letterSpacing: '-0.01em', maxWidth: 480 }}>
          Perspectives on material specification and evidence-based design from the ræson team.
        </p>
      </FadeUp>
      <div>
        {ARTICLES.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 40,
              padding: '24px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 12, color: C.muted, minWidth: 100, letterSpacing: '0.01em' }}>{a.date}</span>
            <span style={{ fontSize: 16, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4, transition: 'color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = C.dim}
              onMouseOut={e => e.currentTarget.style.color = C.text}
            >{a.title}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ─── CTA Band ─────────────────────────────────────────────────────────────────
function CtaBand({ onEnter }) {
  return (
    <section style={{ borderTop: `1px solid ${C.border}`, padding: '120px 40px', textAlign: 'center' }}>
      <FadeUp>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 72px)',
          fontWeight: 700, letterSpacing: '-0.035em',
          color: C.text, margin: '0 0 40px', lineHeight: 1.05,
        }}>
          Ready to evaluate your<br />next substitution?
        </h2>
        <button onClick={onEnter} style={{
          padding: '14px 36px',
          background: C.text, color: C.bg,
          fontSize: 13, fontWeight: 600,
          letterSpacing: '0.03em', textTransform: 'uppercase',
          border: 'none', borderRadius: 4, cursor: 'pointer',
          fontFamily: 'var(--font-display)',
        }}>
          Enter the studio
        </button>
      </FadeUp>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: '60px 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginBottom: 60 }}>
        <div>
          <p style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Sitemap</p>
          {['Cases', 'Index', 'Journal'].map(l => (
            <p key={l} style={{ fontSize: 13, color: C.dim, marginBottom: 8, cursor: 'pointer' }}>{l}</p>
          ))}
        </div>
        <div>
          <p style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Studio</p>
          {['About', 'Contact'].map(l => (
            <p key={l} style={{ fontSize: 13, color: C.dim, marginBottom: 8, cursor: 'pointer' }}>{l}</p>
          ))}
        </div>
        <div>
          <p style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Social</p>
          {['X', 'LinkedIn'].map(l => (
            <p key={l} style={{ fontSize: 13, color: C.dim, marginBottom: 8, cursor: 'pointer' }}>{l}</p>
          ))}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 100px)',
          fontWeight: 700, letterSpacing: '-0.04em',
          color: C.text, lineHeight: 1,
        }}>
          ræson
        </span>
        <span style={{ fontSize: 12, color: C.muted }}>Copyright 2026. All rights reserved.</span>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage({ onEnter }) {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh', color: C.text, position: 'relative' }}>
      <GrainBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav onEnter={onEnter} />
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Hero onEnter={onEnter} />
        </div>
        <AboutBand />
        <Cases />
        <IndexSection />
        <Journal />
        <CtaBand onEnter={onEnter} />
        <Footer />
      </div>
    </div>
  )
}
