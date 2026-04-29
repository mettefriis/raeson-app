// ─── Shared primitives used across all Raeson marketing pages ────────────────
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue, useMotionValueEvent } from 'motion/react';

// ── Tokens ────────────────────────────────────────────────────────────────
const DARK = {
  bg: '#0A0A0A',
  surface: '#121212',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.55)',
  muted: 'rgba(255,255,255,0.32)',
  faint: 'rgba(255,255,255,0.14)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.18)',
  accent: '#009767',
  blue: '#7a9ec4',
  warn: '#d4a017',
  fail: '#e5484d',
  rule: 'rgba(255,255,255,0.18)',
  isDark: true,
};

const LIGHT = {
  bg: '#F6F4EE',
  surface: '#FFFFFF',
  text: '#141414',
  dim: 'rgba(20,20,20,0.58)',
  muted: 'rgba(20,20,20,0.42)',
  faint: 'rgba(20,20,20,0.10)',
  border: 'rgba(20,20,20,0.09)',
  borderStrong: 'rgba(20,20,20,0.20)',
  accent: '#1a6b4b',
  blue: '#1f3a5f',
  warn: '#8c5a00',
  fail: '#b82228',
  rule: 'rgba(20,20,20,0.25)',
  isDark: false,
};

// Night-sky blue — deep indigo/navy paper, white text
const NIGHT = {
  bg: '#0d1a2e',
  surface: '#132236',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.62)',
  muted: 'rgba(255,255,255,0.38)',
  faint: 'rgba(255,255,255,0.14)',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.22)',
  accent: '#6fb89b',
  blue: '#9fb8d8',
  warn: '#e0b64a',
  fail: '#e88b8f',
  rule: 'rgba(255,255,255,0.22)',
  isDark: true,
};

const GRAIN_URL = `url("data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.52' numOctaves='4' stitchTiles='stitch' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 2.2 -0.4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const EASE = [0.16, 1, 0.3, 1];

// ── Tweaks state ──────────────────────────────────────────────────────────
const DEFAULT_TWEAKS = {
  "theme": "light",
  "motion": "signature",
  "grain": true
};

function useTweaks() {
  const [tweaks, setTweaks] = useState(() => {
    try {
      const stored = localStorage.getItem('raeson_tweaks');
      if (stored) return { ...DEFAULT_TWEAKS, ...JSON.parse(stored) };
    } catch (e) {}
    return DEFAULT_TWEAKS;
  });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('raeson_tweaks', JSON.stringify(tweaks)); } catch (e) {}
  }, [tweaks]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setEditMode(true);
      if (e.data.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const update = (patch) => {
    setTweaks((t) => {
      const next = { ...t, ...patch };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
      return next;
    });
  };

  const C = tweaks.theme === 'light' ? LIGHT : tweaks.theme === 'night' ? NIGHT : DARK;
  return { tweaks, setTweaks: update, editMode, C };
}

// ── Raeson mark ───────────────────────────────────────────────────────────
function RaesonMark({ size = 18, color = 'currentColor', style }) {
  return (
    <svg viewBox="0 0 23 23" width={size} height={size} fill="none"
      style={{ display: 'block', flexShrink: 0, ...style }} aria-hidden="true">
      <rect x="0" y="0" width="3" height="20" fill={color} />
      <rect x="0" y="0" width="12" height="3" fill={color} />
      <rect x="9" y="0" width="3" height="12" fill={color} />
      <rect x="0" y="9" width="12" height="3" fill={color} />
      <line x1="12" y1="12" x2="21" y2="21" stroke={color} strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

// ── Grain overlay ─────────────────────────────────────────────────────────
function Grain() { return null; }

// ── Nav ───────────────────────────────────────────────────────────────────
function Nav({ C, current = 'home', onNavigate, hideWordmark = false }) {
  const links = [
    { label: 'Demo', key: 'demo' },
    { label: 'Platform', key: 'platform' },
    { label: 'Pricing', key: 'pricing' },
    { label: 'About', key: 'about' },
    { label: 'Journal', key: 'journal' },
  ];
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '22px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'transparent',
      pointerEvents: 'none',
    }}>
      <button onClick={() => onNavigate && onNavigate('home')} style={{
        display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
        color: C.text, pointerEvents: 'auto',
        opacity: hideWordmark ? 0 : 1, transition: 'opacity 0.3s',
        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500,
          letterSpacing: '-0.035em',
        }}>ræson</span>
      </button>

      <nav style={{
        display: 'flex', gap: 32, alignItems: 'center',
        pointerEvents: 'auto',
        padding: '8px 18px',
        border: `1px solid ${C.border}`,
        borderRadius: 9999,
        background: C.isDark ? 'rgba(10,10,10,0.55)' : 'rgba(245,244,239,0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {links.map(l => (
          <button key={l.key} onClick={() => onNavigate && onNavigate(l.key)} style={{
            fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em',
            color: current === l.key ? C.text : C.dim,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.color = C.text}
            onMouseOut={e => e.currentTarget.style.color = current === l.key ? C.text : C.dim}
          >{l.label}</button>
        ))}
      </nav>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', pointerEvents: 'auto' }}>
        <button onClick={() => onNavigate && onNavigate('signin')} style={{
          fontSize: 13, fontWeight: 400, color: C.dim,
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          padding: '8px 14px', whiteSpace: 'nowrap',
        }}
          onMouseOver={e => e.currentTarget.style.color = C.text}
          onMouseOut={e => e.currentTarget.style.color = C.dim}
        >Sign in</button>
        <button onClick={() => onNavigate && onNavigate('contact')} style={{
          fontSize: 13, fontWeight: 400, color: C.dim,
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          padding: '8px 14px',
        }}
          onMouseOver={e => e.currentTarget.style.color = C.text}
          onMouseOut={e => e.currentTarget.style.color = C.dim}
        >Contact</button>
        <button onClick={() => onNavigate && onNavigate('app')} style={{
          fontSize: 13, fontWeight: 500, color: C.bg,
          background: C.text, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          padding: '9px 16px',
          borderRadius: 9999,
          letterSpacing: '-0.01em',
        }}>See it work →</button>
      </div>
    </header>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer({ C, onNavigate }) {
  return (
    <footer style={{
      borderTop: `1px solid ${C.border}`,
      padding: '72px 32px 40px',
      position: 'relative', zIndex: 2,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48,
        paddingBottom: 80,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.035em', color: C.text }}>ræson</span>
          </div>
          <p style={{ fontSize: 13, color: C.dim, margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
            Material intelligence for architects. Specify with evidence, not instinct.
          </p>
        </div>
        {[
          ['Product', [['Platform', 'platform'], ['Pricing', 'pricing']]],
          ['Studio', [['About', 'about'], ['Contact', 'contact']]],
          ['Resources', [['Journal', 'journal']]],
          ['Legal', []],
        ].map(([h, links]) => (
          <div key={h}>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.dim, margin: '0 0 14px' }}>{h}</p>
            {links.map(([label, key]) => (
              <button key={label} onClick={() => onNavigate && onNavigate(key)} style={{
                display: 'block', fontSize: 13, color: C.dim,
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                padding: 0, marginBottom: 8, transition: 'color 0.15s', textAlign: 'left',
              }}
                onMouseOver={e => e.currentTarget.style.color = C.text}
                onMouseOut={e => e.currentTarget.style.color = C.dim}
              >{label}</button>
            ))}
          </div>
        ))}
      </div>

      {/* Gigantic wordmark */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        paddingTop: 32,
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(120px, 22vw, 320px)',
          fontWeight: 500,
          letterSpacing: '-0.06em',
          color: C.text,
          lineHeight: 0.82,
          display: 'block',
        }}>ræson</span>
      </div>
      <div style={{
        maxWidth: 1280, margin: '0 auto', marginTop: 32,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: C.muted, letterSpacing: '0.03em',
      }}>
        <span>© 2026 Ræson ApS · Copenhagen / Amsterdam</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>v 0.9.2 · {new Date().toISOString().slice(0,10)}</span>
      </div>
    </footer>
  );
}

// ── Tweaks panel ──────────────────────────────────────────────────────────
function TweaksPanel({ tweaks, setTweaks, C, visible }) {
  if (!visible) return null;
  const Row = ({ label, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 0' }}>
      <span style={{ fontSize: 13, color: C.dim }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>{children}</div>
    </div>
  );
  const Chip = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      fontSize: 11, padding: '6px 10px', cursor: 'pointer',
      background: active ? C.text : 'transparent',
      color: active ? C.bg : C.dim,
      border: `1px solid ${active ? C.text : C.border}`,
      borderRadius: 9999,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '-0.01em',
    }}>{children}</button>
  );
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      width: 280,
      padding: '14px 18px',
      background: C.isDark ? 'rgba(18,18,18,0.9)' : 'rgba(239,238,233,0.9)',
      border: `1px solid ${C.borderStrong}`,
      borderRadius: 10,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Tweaks</span>
        <span style={{ fontSize: 11, color: C.dim, fontFamily: 'var(--font-mono)' }}>ræ</span>
      </div>
      <Row label="Theme">
        <Chip active={tweaks.theme === 'light'} onClick={() => setTweaks({ theme: 'light' })}>light</Chip>
        <Chip active={tweaks.theme === 'dark'} onClick={() => setTweaks({ theme: 'dark' })}>dark</Chip>
        <Chip active={tweaks.theme === 'night'} onClick={() => setTweaks({ theme: 'night' })}>night</Chip>
      </Row>
      <Row label="Motion">
        <Chip active={tweaks.motion === 'subtle'} onClick={() => setTweaks({ motion: 'subtle' })}>subtle</Chip>
        <Chip active={tweaks.motion === 'signature'} onClick={() => setTweaks({ motion: 'signature' })}>mid</Chip>
        <Chip active={tweaks.motion === 'cinematic'} onClick={() => setTweaks({ motion: 'cinematic' })}>cine</Chip>
      </Row>
      <Row label="Grain">
        <Chip active={tweaks.grain} onClick={() => setTweaks({ grain: true })}>on</Chip>
        <Chip active={!tweaks.grain} onClick={() => setTweaks({ grain: false })}>off</Chip>
      </Row>
    </div>
  );
}

// ── FadeUp ────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, y = 24, style, duration = 0.7 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, ease: EASE, delay }}
      style={style}
    >{children}</motion.div>
  );
}

// ── Scroll-reveal word by word ────────────────────────────────────────────
function ScrollRevealText({ text, style, offset = ['start 0.9', 'center 0.3'] }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const words = text.split(' ');
  return (
    <p ref={ref} style={style}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = (i + 1) / words.length;
        return <RevealWord key={i} word={w} progress={scrollYProgress} start={start} end={end} />;
      })}
    </p>
  );
}

function RevealWord({ word, progress, start, end }) {
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  return <motion.span style={{ opacity, display: 'inline' }}>{word}{' '}</motion.span>;
}

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({ children, style, noPad, C }) {
  return (
    <section style={{
      maxWidth: 1280, margin: '0 auto',
      padding: noPad ? '0 32px' : '140px 32px',
      position: 'relative', zIndex: 2,
      ...style,
    }}>{children}</section>
  );
}

function SectionLabel({ children, C, style }) {
  return (
    <span style={{
      fontSize: 13, fontWeight: 400, color: C.dim,
      letterSpacing: '-0.005em',
      fontFamily: 'var(--font-sans)',
      display: 'inline-flex', alignItems: 'center', gap: 10,
      ...style,
    }}>
      <span aria-hidden style={{ width: 18, height: 1, background: 'currentColor', opacity: 0.35 }} />
      {children}
    </span>
  );
}

export {
  DARK, LIGHT, NIGHT, DEFAULT_TWEAKS, GRAIN_URL as MARKETING_GRAIN_URL, GRAIN_URL, EASE,
  useTweaks, RaesonMark, Grain, Nav, Footer, TweaksPanel,
  FadeUp, ScrollRevealText, Section, SectionLabel,
};
