import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const C = {
  bg:     '#141414',
  text:   '#FFFFFF',
  dim:    'rgba(255,255,255,0.45)',
  muted:  'rgba(255,255,255,0.25)',
  border: 'rgba(255,255,255,0.08)',
}

const VERDICT_COLOR = { Accepted: '#4ade80', Conditional: '#fbbf24', Fail: '#f87171' }

// Large light-weight section headings
const H = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(52px, 6vw, 80px)',
  fontWeight: 300,
  letterSpacing: '-0.025em',
  lineHeight: 1,
  color: '#FFFFFF',
}

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

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

// ─── Dark grain background (for scrolled sections) ────────────────────────────
function GrainBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#181818' }}>
      <motion.div
        animate={{ x: [0, -22, 18, 0], y: [0, 18, -14, 0], scale: [1, 0.93, 1.06, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{
          position: 'absolute', width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(50,50,50,0.55) 0%, transparent 60%)',
          bottom: '-18%', left: '-12%',
        }}
      />
      <div style={{
        position: 'absolute', inset: '-100px',
        backgroundImage: GRAIN, backgroundSize: '256px 256px',
        opacity: 0.3, pointerEvents: 'none', mixBlendMode: 'overlay',
      }} />
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ onEnter }) {
  const { scrollY } = useScroll()
  const logoOpacity = useTransform(scrollY, [0, 120], [1, 0.7])

  return (
    <motion.header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'transparent' }}>
      <nav style={{
        maxWidth: 1440, margin: '0 auto', padding: '28px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <motion.span style={{
          opacity: logoOpacity,
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
          color: C.text, letterSpacing: '-0.03em',
        }}>
          ræson
        </motion.span>

        <div style={{ display: 'flex', gap: 40 }}>
          {['Platform', 'Pricing', 'About'].map(link => (
            <span key={link} style={{
              fontSize: 13, fontWeight: 300, color: C.dim, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
              onMouseOver={e => e.target.style.color = C.text}
              onMouseOut={e => e.target.style.color = C.dim}
            >{link}</span>
          ))}
        </div>

        <button onClick={onEnter} style={{
          padding: '7px 20px', background: 'transparent',
          color: C.text, fontSize: 13, fontWeight: 300,
          border: '1px solid rgba(255,255,255,0.22)', borderRadius: 4,
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'}
        >
          contact
        </button>
      </nav>
    </motion.header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* Content — constrained width */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 48px 72px' }}>
        <div style={{ position: 'absolute', bottom: 72, right: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>(Scroll)</span>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 3.2vw, 46px)',
            fontWeight: 700,
            lineHeight: 1.12, letterSpacing: '-0.025em',
            color: '#FFFFFF', maxWidth: 520, margin: 0,
          }}
        >
          ræson is a material intelligence platform built for architectural practices who need rigour, not instinct, when a substitution is on the table.
        </motion.p>
      </div>
    </section>
  )
}

// ─── Section helpers ──────────────────────────────────────────────────────────
function Section({ children, style }) {
  return (
    <section style={{ padding: '0 48px 120px', maxWidth: 1200, margin: '0 auto', borderTop: `1px solid ${C.border}`, ...style }}>
      {children}
    </section>
  )
}

function SectionHead({ title, count }) {
  return (
    <FadeUp>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '64px 0 20px' }}>
        <span style={H}>{title}</span>
        {count && <span style={{ ...H, color: C.dim }}>({count})</span>}
      </div>
    </FadeUp>
  )
}

function SubText({ children }) {
  return (
    <FadeUp delay={0.05}>
      <p style={{ fontSize: 15, fontWeight: 300, color: C.dim, marginBottom: 48, lineHeight: 1.65, maxWidth: 560 }}>
        {children}
      </p>
    </FadeUp>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutBand() {
  return (
    <section style={{ padding: '100px 48px', maxWidth: 1200, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
        <FadeUp>
          <span style={{ fontSize: 11, fontWeight: 400, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            About ræson
          </span>
        </FadeUp>
        <div>
          <ScrollRevealText
            text="ræson evaluates material substitutions across carbon, durability, compatibility, and wellbeing — giving architectural practices the evidence to specify with confidence."
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 2.8vw, 36px)',
              fontWeight: 300, lineHeight: 1.35,
              letterSpacing: '-0.02em', color: C.text,
              margin: '0 0 32px',
            }}
          />
          <FadeUp delay={0.1}>
            <button style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 13, fontWeight: 300, color: C.dim, cursor: 'pointer',
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
    <Section>
      <SectionHead title="collaborations" count={5} />
      <SubText>Every substitution has consequences.<br />These practices chose evidence over assumption.</SubText>
      <div>
        {CASES.map((c, i) => (
          <motion.div key={c.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '18px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 15, fontWeight: 400, color: C.text, minWidth: 240 }}>{c.name}</span>
            <span style={{ fontSize: 13, fontWeight: 300, color: C.dim, flex: 1, marginLeft: 40 }}>{c.detail}</span>
            <span style={{ fontSize: 13, fontWeight: 300, color: VERDICT_COLOR[c.verdict] || C.dim }}>{c.verdict}</span>
          </motion.div>
        ))}
      </div>
    </Section>
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
    <Section>
      <SectionHead title="index" count={INDEX_ROWS.length} />
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px', padding: '0 0 12px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 400, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span>Project</span><span>Material</span><span>Verdict</span><span style={{ textAlign: 'right' }}>Year</span>
        </div>
        {INDEX_ROWS.map((row, i) => (
          <motion.div key={row.project}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px', padding: '16px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 300, color: C.dim }}
          >
            <span style={{ color: C.text, fontWeight: 400 }}>{row.project}</span>
            <span>{row.material}</span>
            <span style={{ color: VERDICT_COLOR[row.verdict] || C.dim }}>{row.verdict}</span>
            <span style={{ textAlign: 'right', color: C.muted }}>2025</span>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

// ─── Journal — 3-col image grid ───────────────────────────────────────────────
const ARTICLES = [
  { date: 'Apr 2, 2026',  title: 'Why most material substitutions fail at handoff, not specification' },
  { date: 'Mar 14, 2026', title: 'The integrity index: how we score what others estimate' },
  { date: 'Feb 28, 2026', title: "Carbon and durability don't trade off. Here's the evidence." },
]

const IMG_GRADIENTS = [
  'linear-gradient(135deg, #2a2a2a 0%, #404040 50%, #1a1a1a 100%)',
  'linear-gradient(135deg, #1e1e1e 0%, #383838 60%, #252525 100%)',
  'linear-gradient(135deg, #303030 0%, #1c1c1c 40%, #3a3a3a 100%)',
]

function Journal() {
  return (
    <Section>
      <SectionHead title="Journal" count={6} />
      <SubText>
        We share perspectives on regularity and research trends in the building compliance space — inspiring evidence-based approaches to design
      </SubText>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {ARTICLES.map((a, i) => (
          <motion.div key={a.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ width: '100%', aspectRatio: '4/3', background: IMG_GRADIENTS[i], borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', backgroundImage: GRAIN, backgroundSize: '256px', opacity: 0.4, mixBlendMode: 'overlay' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 300, color: C.dim, margin: '0 0 6px' }}>{a.date}</p>
            <p style={{ fontSize: 17, fontWeight: 400, color: C.text, margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{a.title}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CtaBand({ onEnter }) {
  return (
    <section style={{ borderTop: `1px solid ${C.border}`, padding: '120px 48px', textAlign: 'center' }}>
      <FadeUp>
        <h2 style={{ ...H, fontSize: 'clamp(40px, 5.5vw, 72px)', margin: '0 0 44px', lineHeight: 1.05 }}>
          Ready to evaluate your<br />next substitution?
        </h2>
        <button onClick={onEnter} style={{
          padding: '13px 36px', background: '#FFFFFF', color: '#111111',
          border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500,
          letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Enter the studio
        </button>
      </FadeUp>
    </section>
  )
}

// ─── Footer — Image #11 style ─────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: '64px 48px 48px' }}>
      {/* Nav columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', maxWidth: 1200, margin: '0 auto 80px' }}>
        {[
          ['Sitemap',  ['Work', 'Index', 'Blog']],
          ['Studio',   ['About', 'Contact']],
          ['Social',   ['X', 'Instagram', 'Linked In']],
        ].map(([heading, links]) => (
          <div key={heading}>
            <p style={{ fontSize: 15, fontWeight: 400, color: C.text, marginBottom: 14 }}>{heading}</p>
            {links.map(l => (
              <p key={l} style={{ fontSize: 14, fontWeight: 300, color: C.dim, marginBottom: 8, cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = C.text}
                onMouseOut={e => e.currentTarget.style.color = C.dim}
              >{l}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Wordmark row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(80px, 13vw, 200px)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: C.text,
          lineHeight: 0.85,
          display: 'block',
        }}>
          ræson
        </span>
        <span style={{ fontSize: 12, fontWeight: 300, color: C.muted, paddingBottom: 8 }}>
          Copyright 2026. All rights reserved.
        </span>
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
        <Hero onEnter={onEnter} />
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
