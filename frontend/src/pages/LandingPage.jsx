import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg:      '#F0D4D0',
  surface: '#F5F5F5',
  card:    '#FFFFFF',
  border:  '#E5E5E5',
  text:    '#0F0F0F',
  dim:     '#666666',
  muted:   '#AAAAAA',
  accent:  '#009767',
}

// ─── Scroll-reveal word component ────────────────────────────────────────────
function Word({ word, progress, start, end }) {
  const opacity = useTransform(progress, [start, end], [0.08, 1])
  return (
    <motion.span style={{ opacity, display: 'inline' }}>
      {word}{' '}
    </motion.span>
  )
}

function ScrollRevealText({ text, className, style }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'center 0.25'],
  })
  const words = text.split(' ')
  return (
    <p ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <Word
          key={i}
          word={word}
          progress={scrollYProgress}
          start={i / words.length}
          end={(i + 1) / words.length}
        />
      ))}
    </p>
  )
}

// ─── Fade-in-up on scroll ─────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

// ─── Grain gradient background ───────────────────────────────────────────────
function GrainBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: '#F0D4D0' }}>
      {/* Coral/salmon — top centre */}
      <motion.div
        animate={{ x: [0, 40, -25, 0], y: [0, -30, 20, 0], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '90vw', height: '70vh',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(220,105,95,0.82) 0%, transparent 65%)',
          top: '-15%', left: '5%',
        }}
      />
      {/* Peach/orange — top right */}
      <motion.div
        animate={{ x: [0, -30, 15, 0], y: [0, 20, -10, 0], scale: [1, 0.95, 1.08, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{
          position: 'absolute',
          width: '55vw', height: '55vw',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(228,160,100,0.78) 0%, transparent 60%)',
          top: '-10%', right: '-5%',
        }}
      />
      {/* Lavender/purple — bottom */}
      <motion.div
        animate={{ x: [0, 25, -20, 0], y: [0, -20, 15, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        style={{
          position: 'absolute',
          width: '100vw', height: '65vh',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(148,130,185,0.85) 0%, transparent 60%)',
          bottom: '-15%', left: '-5%',
        }}
      />
      {/* Pink centre bloom */}
      <motion.div
        animate={{ x: [0, -15, 30, 0], y: [0, 25, -20, 0], scale: [1, 1.12, 0.90, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'absolute',
          width: '60vw', height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(210,120,140,0.70) 0%, transparent 65%)',
          top: '15%', left: '20%',
        }}
      />
      {/* Grain overlay — high opacity for the crisp ElevenLabs texture */}
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
  const logoScale = useTransform(scrollY, [0, 120], [1, 0.72])
  const navPy     = useTransform(scrollY, [0, 120], [24, 14])

  return (
    <motion.header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'transparent',
        paddingTop: navPy, paddingBottom: navPy,
      }}
    >
      <nav style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <motion.span
          style={{
            scale: logoScale,
            transformOrigin: 'left center',
            fontFamily: 'var(--font-sans)',
            fontSize: 18,
            fontWeight: 600,
            color: C.text,
            letterSpacing: '-0.04em',
          }}
        >
          ræson
        </motion.span>

        {/* Links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Platform', 'Process', 'Pricing', 'Technical'].map(link => (
            <span
              key={link}
              style={{
                fontSize: 13, color: C.dim, cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'color 0.15s',
              }}
              onMouseOver={e => e.target.style.color = C.text}
              onMouseOut={e => e.target.style.color = C.dim}
            >
              {link}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onEnter}
          style={{
            padding: '8px 20px',
            background: C.text,
            color: C.bg,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          Get started
        </button>
      </nav>
    </motion.header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ onEnter }) {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '0 40px 100px',
      maxWidth: 1200, margin: '0 auto',
      paddingTop: 160,
    }}>
      {/* Numbered tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ display: 'flex', gap: 28, marginBottom: 56 }}
      >
        {[['1.', 'Carbon'], ['2.', 'Durability'], ['3.', 'Compatibility'], ['4.', 'Wellbeing']].map(([n, label]) => (
          <span key={label} style={{ fontSize: 12, color: C.dim, letterSpacing: '0.02em' }}>
            <span style={{ marginRight: 6, opacity: 0.4 }}>{n}</span>{label}
          </span>
        ))}
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: 'clamp(52px, 7vw, 96px)',
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: '-0.04em',
          color: C.text,
          margin: 0,
          marginBottom: 40,
          maxWidth: 900,
        }}
      >
        Know before you specify.
      </motion.h1>

      {/* Subtext + CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 80, flexWrap: 'wrap' }}
      >
        <p style={{
          fontSize: 16, lineHeight: 1.65, color: C.dim,
          maxWidth: 340, margin: 0,
          letterSpacing: '-0.01em',
        }}>
          Every substitution evaluated across carbon, durability,
          and risk — before it reaches the client.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 4 }}>
          <button
            onClick={onEnter}
            style={{
              padding: '12px 28px',
              background: C.text, color: C.bg,
              fontSize: 13, fontWeight: 500,
              letterSpacing: '0.03em', textTransform: 'uppercase',
              border: 'none', borderRadius: 4, cursor: 'pointer',
            }}
          >
            Enter the studio
          </button>
          <button style={{
            padding: '11px 28px',
            background: 'transparent', color: C.text,
            fontSize: 13, fontWeight: 400,
            letterSpacing: '0.03em', textTransform: 'uppercase',
            border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer',
          }}>
            Read the method
          </button>
        </div>
      </motion.div>
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
              fontSize: 'clamp(22px, 2.8vw, 36px)',
              lineHeight: 1.35,
              letterSpacing: '-0.025em',
              color: C.text,
              margin: 0,
              marginBottom: 32,
              fontWeight: 400,
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
  { name: 'Nordic Museum',            detail: 'Timber facade substitution',      verdict: 'Accepted' },
  { name: 'Project Stockholm_04',     detail: 'Acetylated wood proposal',         verdict: 'Conditional' },
  { name: 'Copenhagen Port Pavilion', detail: 'Recycled aluminium cladding',      verdict: 'Accepted' },
  { name: 'Aedile Bergen',            detail: 'Stone composite assessment',       verdict: 'Fail' },
  { name: 'Urban KKLP',              detail: 'Structural glazing review',         verdict: 'Accepted' },
]

const VERDICT_COLOR = { Accepted: '#009767', Conditional: '#a16207', Fail: '#ef4444' }

function Cases() {
  return (
    <section style={{
      padding: '0 40px 120px',
      maxWidth: 1200, margin: '0 auto',
      borderTop: `1px solid ${C.border}`,
    }}>
      <FadeUp>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '48px 0 32px' }}>
          <span style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', color: C.text }}>
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
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 0',
              borderBottom: `1px solid ${C.border}`,
              cursor: 'pointer',
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
  { project: 'Nordic Museum, Oslo',        material: 'Timber cladding',     verdict: 'Accepted' },
  { project: 'Project Stockholm_04',       material: 'Acetylated wood',     verdict: 'Conditional' },
  { project: 'Copenhagen Port Pavilion',   material: 'Recycled aluminium',  verdict: 'Accepted' },
  { project: 'Aedile Bergen',              material: 'Stone composite',     verdict: 'Fail' },
  { project: 'Urban KKLP',               material: 'Structural glazing',   verdict: 'Accepted' },
  { project: 'Harbour Arts Centre',        material: 'Exposed concrete',    verdict: 'Conditional' },
  { project: 'Marienplatz Offices',        material: 'Cork insulation',     verdict: 'Accepted' },
  { project: 'East Bridge Cultural Hub',   material: 'Reclaimed brick',     verdict: 'Accepted' },
]

function IndexSection() {
  return (
    <section style={{
      padding: '0 40px 120px',
      maxWidth: 1200, margin: '0 auto',
      borderTop: `1px solid ${C.border}`,
    }}>
      <FadeUp>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '48px 0 40px' }}>
          <span style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', color: C.text }}>
            index
          </span>
        </div>
      </FadeUp>
      <div>
        {/* Header row */}
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
              padding: '16px 0',
              borderBottom: `1px solid ${C.border}`,
              fontSize: 13, color: C.dim,
            }}
          >
            <span style={{ color: C.text, letterSpacing: '-0.01em' }}>{row.project}</span>
            <span>{row.material}</span>
            <span style={{ color: VERDICT_COLOR[row.verdict] }}>{row.verdict}</span>
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
    <section style={{
      padding: '0 40px 120px',
      maxWidth: 1200, margin: '0 auto',
      borderTop: `1px solid ${C.border}`,
    }}>
      <FadeUp>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '48px 0 32px' }}>
          <span style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', color: C.text }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {ARTICLES.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 40,
              padding: '24px 0',
              borderBottom: `1px solid ${C.border}`,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 12, color: C.muted, minWidth: 100, letterSpacing: '0.01em' }}>{a.date}</span>
            <span style={{
              fontSize: 16, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4,
              transition: 'color 0.15s',
            }}
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
    <section style={{
      borderTop: `1px solid ${C.border}`,
      padding: '120px 40px',
      textAlign: 'center',
    }}>
      <FadeUp>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 72px)',
          fontWeight: 600,
          letterSpacing: '-0.04em',
          color: C.text,
          margin: '0 0 40px',
          lineHeight: 1.05,
        }}>
          Ready to evaluate your<br />next substitution?
        </h2>
        <button
          onClick={onEnter}
          style={{
            padding: '14px 36px',
            background: C.text, color: C.bg,
            fontSize: 13, fontWeight: 500,
            letterSpacing: '0.03em', textTransform: 'uppercase',
            border: 'none', borderRadius: 4, cursor: 'pointer',
          }}
        >
          Enter the studio
        </button>
      </FadeUp>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${C.border}`,
      padding: '60px 40px 40px',
      maxWidth: 1200, margin: '0 auto',
    }}>
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
          fontSize: 'clamp(48px, 8vw, 100px)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: C.text,
          lineHeight: 1,
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
