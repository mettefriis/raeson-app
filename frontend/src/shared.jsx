// ─── Raeson demo — shared tokens, primitives, API client ─────────────────
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue } from 'motion/react';

// ── Tokens (pulled from marketing/shared.jsx LIGHT theme) ───────────────
const C = {
  bg:           '#F6F4EE',
  surface:      '#FFFFFF',
  surfaceInset: '#EFEDE6',
  text:         '#141414',
  dim:          'rgba(20,20,20,0.58)',
  muted:        'rgba(20,20,20,0.42)',
  faint:        'rgba(20,20,20,0.10)',
  border:       'rgba(20,20,20,0.09)',
  borderStrong: 'rgba(20,20,20,0.20)',
  accent:       '#1a6b4b',
  blue:         '#1f3a5f',
  warn:         '#8c5a00',
  fail:         '#b82228',
  rule:         'rgba(20,20,20,0.25)',
  passBg:       'rgba(26,107,75,0.06)',
  warnBg:       'rgba(140,90,0,0.06)',
  failBg:       'rgba(184,34,40,0.06)',
};

const EASE = [0.16, 1, 0.3, 1];
const GRAIN_URL = `url("data:image/svg+xml,%3Csvg viewBox='0 0 600 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.52' numOctaves='4' stitchTiles='stitch' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 2.2 -0.4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ── Raeson logo mark ─────────────────────────────────────────────────────
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

// ── Grain ────────────────────────────────────────────────────────────────
function Grain() { return null; }

// ── Label / Eyebrow (mono, uppercase) ────────────────────────────────────
function Mono({ children, style, dim = false }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 11,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: dim ? C.muted : C.dim,
      ...style,
    }}>{children}</span>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────
function Btn({ children, onClick, href, variant = 'primary', disabled, style, icon, ...rest }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px',
    fontSize: 13, fontFamily: 'var(--font-sans)',
    fontWeight: 500, letterSpacing: '-0.01em',
    borderRadius: 9999,
    cursor: disabled ? 'default' : 'pointer',
    border: 'none', textDecoration: 'none',
    transition: 'background 0.18s, color 0.18s, border-color 0.18s, opacity 0.18s',
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: { background: C.text, color: C.bg },
    ghost:   { background: 'transparent', color: C.text, border: `1px solid ${C.borderStrong}` },
    subtle:  { background: 'transparent', color: C.dim, border: `1px solid ${C.border}` },
    accent:  { background: C.accent, color: '#FFFFFF' },
  };
  const El = href ? 'a' : 'button';
  return (
    <El href={href} onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {icon}
      {children}
    </El>
  );
}

// ── Sidebar navigation ───────────────────────────────────────────────────
function Sidebar({ route, onNavigate, onLogout, user }) {
  const items = [
    { k: 'projects', label: 'Projects', icon: IconFolder },
    { k: 'catalogue', label: 'Catalogue', icon: IconBook },
    { k: 'codes', label: 'Code library', icon: IconCode },
    { k: 'audit', label: 'Audit log', icon: IconClock },
  ];
  // Beige sidebar palette — same paper tone as the page, with grain overlay
  const D = {
    bg:      C.bg,           // #F6F4EE beige
    text:    C.text,
    dim:     C.dim,
    muted:   C.muted,
    faint:   C.faint,
    border:  C.border,
    surface: 'rgba(20,20,20,0.025)',
    accent:  C.accent,
    hoverBg: 'rgba(20,20,20,0.04)',
    activeBg:'rgba(20,20,20,0.07)',
  };
  return (
    <aside style={{
      width: 240, flexShrink: 0, height: '100vh',
      background: D.bg,
      color: D.text,
      borderRight: `1px solid ${D.border}`,
      padding: '22px 16px',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, zIndex: 20,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px 22px',
        borderBottom: `1px solid ${D.border}`, position: 'relative', zIndex: 1 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.035em', color: D.text }}>ræson</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: D.muted, letterSpacing: '0.08em' }}>0.9.2</span>
      </div>

      <div style={{ paddingTop: 22, flex: 1, position: 'relative', zIndex: 1 }}>
        <Mono style={{ display: 'block', padding: '0 8px 12px', color: D.muted }}>Workspace</Mono>
        {items.map(it => {
          const active = route === it.k;
          return (
            <button key={it.k} onClick={() => onNavigate(it.k)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px',
                margin: '1px 0',
                background: active ? D.activeBg : 'transparent',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontFamily: 'var(--font-sans)',
                color: active ? D.text : D.dim,
                letterSpacing: '-0.01em',
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
                borderRadius: 6,
              }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.background = D.hoverBg; e.currentTarget.style.color = D.text; } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = D.dim; } }}
            >
              <it.icon size={14} color={active ? D.text : D.muted} />
              {it.label}
            </button>
          );
        })}
      </div>

      {/* Assistance block */}
      <div style={{
        padding: 14, borderRadius: 6,
        border: `1px solid ${D.border}`,
        background: D.surface,
        marginBottom: 14,
        position: 'relative', zIndex: 1,
      }}>
        <Mono style={{ display: 'block', marginBottom: 8, color: D.muted }}>Studio</Mono>
        <div style={{ fontSize: 12, color: D.text, letterSpacing: '-0.01em' }}>Studio Aedile</div>
        <div style={{ fontSize: 11, color: D.muted, marginTop: 4 }}>8 / 45 substitutions this month</div>
        <div style={{ marginTop: 10, height: 3, background: D.faint, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, width: '18%', background: D.accent }} />
        </div>
      </div>

      {/* User */}
      <button onClick={onLogout} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 6,
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        color: D.text, position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: D.text, color: D.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
        }}>{(user?.initials || 'MF')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: D.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Mette Friis'}</div>
          <div style={{ fontSize: 10, color: D.muted, fontFamily: 'var(--font-mono)' }}>sign out ↗</div>
        </div>
      </button>
    </aside>
  );
}

// ── Icons (simple stroke SVGs) ───────────────────────────────────────────
function IconFolder({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square"><path d="M1.5 3.5h4l1.5 2h7.5v8h-13z"/></svg>);
}
function IconBook({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square"><path d="M2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H2zM14 2h-5a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h5z"/></svg>);
}
function IconCode({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square" strokeLinejoin="miter"><path d="M5 5l-3 3 3 3M11 5l3 3-3 3M9 3l-2 10"/></svg>);
}
function IconClock({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>);
}
function IconPlus({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="square"><path d="M8 3v10M3 8h10"/></svg>);
}
function IconArrow({ size = 14, color = 'currentColor', dir = 'right' }) {
  const r = dir === 'right' ? 0 : dir === 'left' ? 180 : dir === 'down' ? 90 : 270;
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square" style={{ transform: `rotate(${r}deg)` }}><path d="M3 8h10M9 4l4 4-4 4"/></svg>);
}
function IconDownload({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square"><path d="M8 2v9M4 8l4 4 4-4M2 14h12"/></svg>);
}
function IconUpload({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square"><path d="M8 13V4M4 7l4-4 4 4M2 2h12"/></svg>);
}
function IconCheck({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="square"><path d="M3 8l3 3 7-7"/></svg>);
}
function IconSearch({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>);
}
function IconDot({ size = 8, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill={color}/></svg>);
}
function IconClose({ size = 14, color = 'currentColor' }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square"><path d="M3 3l10 10M13 3L3 13"/></svg>);
}

// ── API client with fallback ────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000');
let _apiReachable = null;

async function api(path, { method = 'GET', body, signal } = {}) {
  if (_apiReachable === false) {
    return { __mock: true, __error: 'demo' };
  }
  const headers = { 'Accept': 'application/json' };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  // 1.5s timeout — backend either responds fast or we mock
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method, headers, signal: signal || ctrl.signal,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`${res.status}`);
    _apiReachable = true;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('json') ? res.json() : res.blob();
  } catch (e) {
    clearTimeout(t);
    _apiReachable = false;
    return { __mock: true, __error: e.message };
  }
}

// ── Page header ─────────────────────────────────────────────────────────
function PageHeader({ eyebrow, title, desc, right, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '80px 40px 32px',
      gap: 40,
      ...style,
    }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <Mono style={{ display: 'block', marginBottom: 14 }}>{eyebrow}</Mono>}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 42, fontWeight: 400,
          letterSpacing: '-0.035em', lineHeight: 1.05,
          color: C.text, margin: 0, textWrap: 'balance',
        }}>{title}</h1>
        {desc && <p style={{
          fontSize: 14, color: C.dim, lineHeight: 1.55,
          margin: '14px 0 0', maxWidth: 560, textWrap: 'pretty',
        }}>{desc}</p>}
      </div>
      {right && <div style={{ flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>{right}</div>}
    </div>
  );
}

export { C, EASE, GRAIN_URL, RaesonMark, Grain, Mono, Btn, Sidebar, PageHeader, IconFolder, IconBook, IconCode, IconClock, IconPlus, IconArrow, IconDownload, IconUpload, IconCheck, IconSearch, IconDot, IconClose, api };
